// ===== Firebase =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== SETTINGS =====
const TELEGRAM_TOKEN = "YOUR_TOKEN";
const TELEGRAM_CHAT = "YOUR_CHAT_ID";

// ===== STATE =====
let allObjects = [];
let currentImages = [];
let currentIndex = 0;

// ===== DOM =====
const grid = document.getElementById("objectsGrid");
const favCount = document.getElementById("favCount");
const modal = document.getElementById("galleryModal");
const modalImg = document.getElementById("modalImg");

// ===== LOAD OBJECTS =====
async function loadObjects() {
  grid.innerHTML = "Завантаження...";

  const snap = await getDocs(collection(db, "objects"));
  grid.innerHTML = "";
  allObjects = [];

  let index = 0;

  snap.forEach(doc => {
    const d = doc.data();
    allObjects.push(d);

    const img = d.images?.[0] || 
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa";

    grid.innerHTML += `
      <div class="card">
        <img class="gallery-img" src="${img}" data-index="${index}">
        <button class="fav-btn" data-id="${index}">♡</button>
        <h3>${d.title || "Без назви"}</h3>
        <p>Площа: ${d.area || "-"} м²</p>
        <strong>${d.price || "-"} $</strong>
      </div>
    `;

    index++;
  });

  bindGallery();
  updateFavCount();
}

// ===== GALLERY =====
function bindGallery() {
  document.querySelectorAll(".gallery-img").forEach(img => {
    img.onclick = () => {
      const i = Number(img.dataset.index);
      openGallery(allObjects[i]);
    };
  });
}

function openGallery(obj) {
  if (!obj?.images?.length) return;

  currentImages = obj.images;
  currentIndex = 0;

  modal.classList.add("active");
  showImage(currentIndex);
}

function showImage(i) {
  if (i < 0) i = currentImages.length - 1;
  if (i >= currentImages.length) i = 0;

  currentIndex = i;
  modalImg.src = currentImages[i];
}

function closeGallery() {
  modal.classList.remove("active");
}

// controls
document.getElementById("galClose")?.onclick = closeGallery;
document.getElementById("galNext")?.onclick = () => showImage(currentIndex + 1);
document.getElementById("galPrev")?.onclick = () => showImage(currentIndex - 1);

modal?.addEventListener("click", e => {
  if (e.target === modal) closeGallery();
});

// ===== FAVORITES =====
document.addEventListener("click", e => {
  const btn = e.target.closest(".fav-btn");
  if (!btn) return;

  let favs = JSON.parse(localStorage.getItem("favs") || "[]");
  const id = Number(btn.dataset.id);

  if (favs.includes(id)) {
    favs = favs.filter(x => x !== id);
    btn.textContent = "♡";
  } else {
    favs.push(id);
    btn.textContent = "❤️";
  }

  localStorage.setItem("favs", JSON.stringify(favs));
  updateFavCount();
});

function updateFavCount() {
  const favs = JSON.parse(localStorage.getItem("favs") || "[]");
  if (favCount) favCount.textContent = favs.length;
}

// ===== CRM + TELEGRAM =====
document.getElementById("leadForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  try {
    await addDoc(collection(db, "leads"), data);

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT,
        text: `🔥 Новий клієнт\nІм’я: ${data.name}\nТелефон: ${data.phone}`
      })
    });

    alert("✅ Заявка відправлена");
    e.target.reset();

  } catch (err) {
    console.error(err);
    alert("❌ Помилка");
  }
});

// ===== INIT =====
document.addEventListener("DOMContentLoaded", loadObjects);
