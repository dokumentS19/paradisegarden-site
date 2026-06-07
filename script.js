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

/* =========================================
   ✅ TELEGRAM CONFIG
========================================= */
const TOKEN = "ТУТ_НОВИЙ_TOKEN"; // після /revoke
const CHAT_ID = "598876080";

/* =========================================
   ✅ LOAD OBJECTS
========================================= */
async function load() {
  const snap = await getDocs(collection(db, "objects"));

  allObjects = [];

  snap.forEach(doc => {
    allObjects.push({ id: doc.id, ...doc.data() });
  });

  render(allObjects);
}

/* =========================================
   ✅ RENDER
========================================= */
function render(data) {

  const grid = document.getElementById("objectsGrid");
  grid.innerHTML = "";

  if (data.length === 0) {
    grid.innerHTML = "<p>Нічого не знайдено</p>";
    return;
  }

  // ✅ VIP зверху
  data.sort((a, b) => {
    return (b.vip === true) - (a.vip === true);
  });

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

