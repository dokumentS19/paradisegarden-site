import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const grid = document.getElementById("grid");

// LOAD
async function load() {
  grid.innerHTML = "Завантаження...";

  const snap = await getDocs(collection(db, "objects"));
  grid.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <h3>${d.title}</h3>
      <p>${d.area} м²</p>
      <b>${d.price}$</b>
    `;

    grid.appendChild(div);
  });
}

load();
