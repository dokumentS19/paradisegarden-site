import { db } from "./firebase.js";
import {
  collection, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const grid = document.getElementById("objectsGrid");
const modal = document.getElementById("galleryModal");
const modalImg = document.getElementById("modalImg");

let objects = [];

// LOAD
async function load() {
  grid.innerHTML = "Завантаження...";

  const snap = await getDocs(collection(db, "objects"));
  grid.innerHTML = "";

  objects = [];

  snap.forEach((doc, i) => {
    const d = doc.data();
    objects.push(d);

    const img = d.images?.[0] || "";

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${img}" data-i="${i}">
      <h3>${d.title}</h3>
      <b>${d.price}$</b>
    `;

    grid.appendChild(div);
  });
}

load();

// MODAL
document.addEventListener("click", e => {
  const img = e.target.closest("img[data-i]");
  if (!img) return;

  const i = +img.dataset.i;
  const imgs = objects[i].images || [];

  if (!imgs.length) return;

  modalImg.src = imgs[0];
  modal.classList.add("active");
});

modal.onclick = () => modal.classList.remove("active");

// FILTER
document.getElementById("searchInput").oninput = e => {
  const v = e.target.value.toLowerCase();

  document.querySelectorAll(".card").forEach(c => {
    c.style.display = c.innerText.toLowerCase().includes(v) ? "block" : "none";
  });
};

document.getElementById("priceFilter").oninput = e => {
  const max = +e.target.value;

  document.querySelectorAll(".card").forEach(c => {
    const price = +c.innerText.match(/\d+/)?.[0];

    c.style.display = !max || price <= max ? "block" : "none";
  });
};
