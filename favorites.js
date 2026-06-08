import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
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

// ✅ отримуємо обране
const favs = JSON.parse(localStorage.getItem("favs")) || [];

const grid = document.getElementById("favGrid");

// ✅ завантаження
async function loadFavs() {

  grid.innerHTML = "";

  // ✅ якщо пусто
  if (favs.length === 0) {
    grid.innerHTML = "<p>Немає обраних ❤️</p>";
    return;
  }

  for (let id of favs) {

    try {
      const snap = await getDoc(doc(db, "objects", id));

      if (!snap.exists()) continue;

      const d = snap.data();

      const img = d.images?.[0] || "https://via.placeholder.com/400";

      grid.innerHTML += `
        <a href="object.html?id=${id}" class="card">

          <img src="${img}" alt="img">

          <h3>${d.title || "Без назви"}</h3>

          <p>📐 ${d.area || "-"}</p>

          <strong>${d.price || "-"} $</strong>

        </a>
      `;

    } catch (err) {
      console.error("Помилка:", err);
    }
  }
}

// ✅ запуск
loadFavs();
