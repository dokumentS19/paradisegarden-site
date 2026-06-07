import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ CONFIG
const firebaseConfig = {
  apiKey: "ТВОЙ_KEY",
  projectId: "paradisegarden-site",
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
