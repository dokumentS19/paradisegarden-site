import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ CONFIG
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBq_bUWieO6UI7REfU1iNrk2RK2EjQGnts",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.firebasestorage.app",
  messagingSenderId: "452352075250",
  appId: "1:452352075250:web:049e1b3f10c44bc04c776b",
  measurementId: "G-6XHWE6Y0JE"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allObjects = [];

/* ================================
   ✅ MAP VARIABLES (ДОДАНО)
================================ */
let map;
let mapMarkers = [];
let clusterer;

/* ================================
   ✅ TELEGRAM CONFIG
================================ */
const TOKEN = "ТУТ_НОВИЙ_TOKEN";
const CHAT_ID = "598876080";

/* ================================
   ✅ ✅ ✅ ДОДАНО: TELEGRAM ДЛЯ МЕНЕДЖЕРА
================================ */
async function sendToTelegram(message) {
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    });
  } catch (e) {
    console.error("Telegram error:", e);
  }
}

/* ================================
   ✅ LOAD OBJECTS
================================ */
async function load() {
  const snap = await getDocs(collection(db, "objects"));

  allObjects = [];

  snap.forEach(doc => {
    allObjects.push({ id: doc.id, ...doc.data() });
  });

  render(allObjects);

  // ✅ карта теж оновлюється
  updateMap(allObjects);
}

/* ================================
   ✅ RENDER (НЕ ЧІПАВ)
================================ */
function render(data) {

  const grid = document.getElementById("objectsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (data.length === 0) {
    grid.innerHTML = "<p>Нічого не знайдено</p>";
    return;
  }

  data.sort((a, b) => (b.vip === true) - (a.vip === true));

  data.forEach(d => {

    const img = d.images?.[0] || "https://via.placeholder.com/400";

    const favs = JSON.parse(localStorage.getItem("favs")) || [];
    const isFav = favs.includes(d.id);

    grid.innerHTML += `
      <div class="card">

        ${d.vip ? `<div style="color:gold;">🔥 VIP</div>` : ""}

        <a href="object.html?id=${d.id}">
          <img src="${img}">
          <h3>${d.title || "Без назви"}</h3>

          <p>📐 ${d.area || "-"}</p>
          <strong>💰 ${d.price || "-"} $</strong>

          <p>👁 ${d.views || 0}</p>

          <p>
            ${d.status === "sold"
              ? "❌ Продано"
              : "✅ Активне"}
          </p>

          <p>⭐ ${(d.rating || 0)} (${d.ratingCount || 0})</p>
        </a>

        <div onclick="toggleFav('${d.id}')" class="favorite">
          ${isFav ? "❤️" : "🤍"}
        </div>

      </div>
    `;
  });
}

/* ================================
   ✅ MAP INIT (ДОДАНО)
================================ */
window.initMap = async function () {

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 11,
    center: { lat: 50.5215, lng: 30.2506 }
  });

  updateMap(allObjects);
};

/* ================================
   ✅ UPDATE MAP (ГОЛОВНЕ)
================================ */
function updateMap(data) {

  if (!map) return;

  if (clusterer) clusterer.clearMarkers();
  mapMarkers.forEach(m => m.setMap(null));
  mapMarkers = [];

  const markers = data
    .filter(d => d.lat && d.lng)
    .map(d => {

      const marker = new google.maps.Marker({
        position: { lat: d.lat, lng: d.lng },
        map: map
      });

      const info = new google.maps.InfoWindow({
        content: `
          <div style="color:black; max-width:220px;">
            ${d.images?.[0] ? `<img src="${d.images[0]}" style="width:100%;">` : ""}
            <strong>${d.title}</strong><br>
            💰 ${d.price}$<br><br>
            <a href="object.html?id=${d.id}">Відкрити</a>
          </div>
        `
      });

      marker.addListener("click", () => {
        info.open(map, marker);
      });

      mapMarkers.push(marker);
      return marker;
    });

  clusterer = new markerClusterer.MarkerClusterer({
    map,
    markers
  });
}

/* ================================
   ✅ FAVORITES
================================ */
function toggleFav(id) {
  let favs = JSON.parse(localStorage.getItem("favs")) || [];

  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }

  localStorage.setItem("favs", JSON.stringify(favs));
  render(allObjects);
}

window.toggleFav = toggleFav;

/* ================================
   ✅ FILTER
================================ */
const search = document.getElementById("search");
const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");

if (search && minPrice && maxPrice) {

  search.oninput =
  minPrice.oninput =
  maxPrice.oninput = () => {

    const text = search.value.toLowerCase();
    const min = Number(minPrice.value);
    const max = Number(maxPrice.value);

    const filtered = allObjects.filter(d => {

      const matchText = d.title?.toLowerCase().includes(text);
      const matchMin = !min || Number(d.price) >= min;
      const matchMax = !max || Number(d.price) <= max;

      return matchText && matchMin && matchMax;
    });

    render(filtered);
    updateMap(filtered);
  };
}

/* ================================
   ✅ TELEGRAM + FIREBASE
================================ */
window.sendForm = async () => {

  const name = document.getElementById("name")?.value;
  const phone = document.getElementById("phone")?.value;

  if (!name || !phone) {
    alert("Заповни всі поля!");
    return;
  }

  const text = `
📩 НОВА ЗАЯВКА

👤 Імʼя: ${name}
📞 Телефон: ${phone}
`;

  try {

    // ✅ ТЕПЕР через універсальну функцію
    await sendToTelegram(text);

    await addDoc(collection(db, "leads"), {
      name,
      phone,
      status: "new",
      income: 1000,
      createdAt: new Date()
    });

    alert("✅ Заявка відправлена!");

    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";

  } catch (err) {
    console.error(err);
    alert("❌ Помилка");
  }
};

/* ================================
   ✅ CALL BUTTON
================================ */
window.callNow = () => {
  window.location.href = "tel:+380953777196";
};

/* ================================
   ✅ THEME SWITCH
================================ */
window.toggleTheme = function () {

  const current = document.body.classList.contains("light");

  if (current) {
    document.body.classList.remove("light");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.add("light");
    localStorage.setItem("theme", "light");
  }
};

// ✅ LOAD THEME
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
}

/* ================================
   ✅ START
================================ */
load();
