import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ CONFIG
const firebaseConfig = {
  apiKey: "ТВОЙ_KEY",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allObjects = [];

/* ================================
   ✅ TELEGRAM CONFIG
================================ */
const TOKEN = "ТУТ_НОВИЙ_TOKEN"; // після /revoke
const CHAT_ID = "598876080";

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
}

/* ================================
   ✅ RENDER
================================ */
function render(data) {

  const grid = document.getElementById("objectsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (data.length === 0) {
    grid.innerHTML = "<p>Нічого не знайдено</p>";
    return;
  }

  // ✅ VIP зверху
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
📩 Нова заявка

👤 Імʼя: ${name}
📞 Телефон: ${phone}
`;

  try {

    // ✅ Telegram
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text
      })
    });

    // ✅ Firebase CRM
    await addDoc(collection(db, "leads"), {
      name,
      phone,
      status: "new",
      createdAt: new Date()
    });

    alert("✅ Заявка відправлена!");

    // очистка
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
   ✅ START
================================ */
load();
