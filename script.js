import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";import { initializeApp } fromRK2EjQGnts",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ STATE
let allObjects = [];
let map;
let markers = [];
let clusterer;
let renderTimer;

// ✅ FAVORITES CACHE
let favs = JSON.parse(localStorage.getItem("favs")) || [];

// ✅ TELEGRAM
const TOKEN = "ТУТ_НОВИЙ_TOKEN";
const CHAT_ID = "598876080";

/* =======================
   ✅ SAFE TELEGRAM
======================= */
async function sendToTelegram(msg) {
  try {
    fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: msg
      }),
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.warn("TG fail:", e);
  }
}

/* =======================
   ✅ PRELOADER
======================= */
function showLoader(show) {
  let el = document.getElementById("loader");
  if (!el) return;

  el.style.display = show ? "block" : "none";
}

/* =======================
   ✅ LOAD DATA
======================= */
async function load() {

  try {
    showLoader(true);

    const snap = await getDocs(collection(db, "objects"));

    allObjects = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    safeRender(allObjects);
    updateMap(allObjects);

  } catch (e) {
    console.error("LOAD ERROR:", e);
  }

  showLoader(false);
}

/* =======================
   ✅ SMART RENDER (DEBOUNCE)
======================= */
function safeRender(data) {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    render(data);
  }, 80);
}

/* =======================
   ✅ RENDER GRID
======================= */
function render(data) {

  const grid = document.getElementById("objectsGrid");
  if (!grid) return;

  if (!data?.length) {
    grid.innerHTML = "<p>Нічого не знайдено</p>";
    return;
  }

  let html = "";

  data
    .sort((a, b) => (b.vip === true) - (a.vip === true))
    .forEach(d => {

      const img = d?.images?.[0]
        ? `<img src="${d.images[0]}" loading="lazy">`
        : `<img src="https://via.placeholder.com/400">`;

      const isFav = favs.includes(d.id);

      html += `
      <div class="card leaderboard">

        ${d.vip ? `<div class="vip-badge">🔥 VIP</div>` : ""}

        <a href="object.html?id=${d.id}">
          ${img}

          <h3>${d.title || "Без назви"}</h3>

          <p>📐 ${d.area || "-"}</p>
          <strong>💰 ${d.price || "-"} $</strong>

          <p>👁 ${d.views || 0}</p>
          <p>${d.status === "sold" ? "❌ Продано" : "✅ Активне"}</p>

          <p>⭐ ${d.rating || 0} (${d.ratingCount || 0})</p>

        </a>

        <div onclick="toggleFav('${d.id}')"
             class="fav-btn">
          ${isFav ? "❤️" : "🤍"}
        </div>

      </div>
      `;
    });

  grid.innerHTML = html;
}

/* =======================
   ✅ MAP INIT
======================= */
window.initMap = function () {

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 11,
    center: { lat: 50.5215, lng: 30.2506 }
  });

  updateMap(allObjects);
};

/* =======================
   ✅ UPDATE MAP
======================= */
function updateMap(data) {

  if (!map) return;

  if (clusterer) clusterer.clearMarkers();

  markers.forEach(m => m.setMap(null));
  markers = [];

  const valid = data.filter(d => d.lat && d.lng);

  const newMarkers = valid.map(d => {

    const m = new google.maps.Marker({
      position: { lat: d.lat, lng: d.lng },
      map
    });

    const info = new google.maps.InfoWindow({
      content: `
        <div style="color:black">
          ${d.images?.[0] ? `<img src="${d.images[0]}" width="200">` : ""}
          <strong>${d.title}</strong><br>
          💰 ${d.price}$
        </div>
      `
    });

    m.addListener("click", () => info.open(map, m));

    markers.push(m);
    return m;
  });

  clusterer = new markerClusterer.MarkerClusterer({
    map,
    markers: newMarkers
  });
}

/* =======================
   ✅ FAVORITES
======================= */
window.toggleFav = function (id) {

  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }

  localStorage.setItem("favs", JSON.stringify(favs));

  safeRender(allObjects);
};

/* =======================
   ✅ FILTER (DEBOUNCE)
======================= */
function setupFilter() {

  const s = document.getElementById("search");
  const min = document.getElementById("minPrice");
  const max = document.getElementById("maxPrice");

  if (!s || !min || !max) return;

  let timer;

  const run = () => {

    clearTimeout(timer);

    timer = setTimeout(() => {

      const text = s.value.toLowerCase();
      const minVal = Number(min.value);
      const maxVal = Number(max.value);

      const filtered = allObjects.filter(d => {

        return (
          (d.title || "").toLowerCase().includes(text) &&
          (!minVal || d.price >= minVal) &&
          (!maxVal || d.price <= maxVal)
        );
      });

      safeRender(filtered);
      updateMap(filtered);

    }, 200);
  };

  s.oninput = run;
  min.oninput = run;
  max.oninput = run;
}

/* =======================
   ✅ FORM
======================= */
window.sendForm = async () => {

  const name = document.getElementById("name")?.value.trim();
  const phone = document.getElementById("phone")?.value.trim();

  if (!name || !phone) return alert("Заповни всі поля!");

  const text = `📩 ЗАЯВКА\n👤 ${name}\n📞 ${phone}`;

  try {

    sendToTelegram(text);

    await addDoc(collection(db, "leads"), {
      name,
      phone,
      status: "new",
      createdAt: new Date()
    });

    alert("✅ Відправлено");

  } catch (e) {
    console.error(e);
    alert("❌ Помилка");
  }
};

/* =======================
   ✅ START
======================= */
setupFilter();
load();
import {
  getFirestore,
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ CONFIG
const firebaseConfig = {
