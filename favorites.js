import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "ТВОЙ_KEY",
  projectId: "paradisegarden-site",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const favs = JSON.parse(localStorage.getItem("favs")) || [];

const grid = document.getElementById("favGrid");

async function loadFavs() {

  grid.innerHTML = "";

  for (let id of favs) {

    const snap = await getDoc(doc(db, "objects", id));
    if (!snap.exists()) continue;

    const d = snap.data();

    const img = d.images?.[0] || "https://via.placeholder.com/400";

    grid.innerHTML += `
      <a href="object.html?id=${id}" class="card">
        <img src="${img}">
        <h3>${d.title}</h3>
        <strong>${d.price}$</strong>
      </a>
    `;
  }
}

loadFavs();

