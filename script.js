let allObjects = [];

// ===== Firebase =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("SCRIPT OK");

const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== Контакти =====
const TELEGRAM_LINK = "https://t.me/RSOleg";
const PHONE_NUMBER = "+380674464705";

// ===== Галерея =====
const modal = document.getElementById("galleryModal");
const modalImg = document.getElementById("modalImg");

let currentImages = [];
let currentIndex = 0;

function openGallery(obj) {
  if (!obj || !obj.images || obj.images.length === 0) return;

  currentImages = obj.images;
  currentIndex = 0;

  modal.classList.add("active");
  showImage(currentIndex);

  document.body.style.overflow = "hidden";
}

function showImage(index) {
  if (!currentImages.length) return;

  if (index < 0) index = currentImages.length - 1;
  if (index >= currentImages.length) index = 0;

  currentIndex = index;
  modalImg.src = currentImages[currentIndex];
}

function closeGallery() {
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

// ===== Клавіатура =====
document.addEventListener("keydown", (e) => {
  if (!modal || !modal.classList.contains("active")) return;

  if (e.key === "ArrowRight") showImage(currentIndex + 1);
  if (e.key === "ArrowLeft") showImage(currentIndex - 1);
  if (e.key === "Escape") closeGallery();
});

// ===== Кнопки галереї =====
document.getElementById("galClose")?.addEventListener("click", closeGallery);
document.querySelector(".modal-backdrop")?.addEventListener("click", closeGallery);

document.getElementById("galNext")?.addEventListener("click", (e) => {
  e.stopPropagation();
  showImage(currentIndex + 1);
});

document.getElementById("galPrev")?.addEventListener("click", (e) => {
  e.stopPropagation();
  showImage(currentIndex - 1);
});

// ===== Swipe =====
let startX = 0;

modal?.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

modal?.addEventListener("touchend", (e) => {
  const endX = e.changedTouches[0].clientX;

  if (startX - endX > 50) showImage(currentIndex + 1);
  if (endX - startX > 50) showImage(currentIndex - 1);
});

// ===== Zoom =====
let scale = 1;

modalImg?.addEventListener("wheel", (e) => {
  e.preventDefault();

  scale += e.deltaY < 0 ? 0.2 : -0.2;
  scale = Math.max(1, Math.min(4, scale));

  modalImg.style.transform = `scale(${scale})`;
});

// ===== Firebase загрузка =====
async function loadObjects() {
  console.log("LOAD OBJECTS ✅");

  const snap = await getDocs(collection(db, "objects"));
  console.log("DOCS COUNT:", snap.size);

  const grid = document.getElementById("objectsGrid");
  if (!grid) return;

  grid.innerHTML = "";
  allObjects = [];

  snap.forEach((docSnap, index) => {
    const d = docSnap.data();
    allObjects.push(d);

    const imageUrl = d.images?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa";

    grid.innerHTML += `
      <div class="card">
        <img class="gallery-img" src="${imageUrl}" data-index="${index}">
        <button class="fav-btn" data-id="${index}">♡</button>

        <h3>${d.title || "Без назви"}</h3>
        <p>Площа: ${d.area || "-"} м²</p>
        <strong>${d.price || "-"} $</strong>
      </div>
    `;
  });

  setTimeout(() => {
    document.querySelectorAll(".gallery-img").forEach(img => {
      img.addEventListener("click", () => {
        const index = Number(img.dataset.index);
        openGallery(allObjects[index]);
      });
    });
  }, 0);
}

// ===== Фаворити =====
document.getElementById("showFavOnly")?.addEventListener("click", () => {
  const favs = JSON.parse(localStorage.getItem("favs") || "[]");

  document.querySelectorAll(".card").forEach(card => {
    const id = Number(card.querySelector(".fav-btn")?.dataset.id);
    card.style.display = favs.includes(id) ? "block" : "none";
  });
});

// ===== Контакти =====
function setupTelegram(aTag) {
  if (!aTag) return;

  aTag.href = TELEGRAM_LINK;
}

function setupViber(aTag) {
  if (!aTag) return;

  aTag.href = `viber://chat?number=${encodeURIComponent(PHONE_NUMBER)}`;
}

// ===== Запуск =====
document.addEventListener("DOMContentLoaded", () => {
  setupTelegram(document.getElementById("tgLink"));
  setupViber(document.getElementById("viberLink"));

  loadObjects();
});
``
