import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const id = new URLSearchParams(window.location.search).get("id");

// ✅ дані галереї
let images = [];
let current = 0;

// ✅ змінити слайд
function changeSlide(step) {
  current += step;

  if (current >= images.length) current = 0;
  if (current < 0) current = images.length - 1;

  updateImage();
}

// ✅ оновлення фото
function updateImage() {
  document.getElementById("mainImg").src = images[current];
  document.getElementById("counter").textContent =
    `${current + 1} / ${images.length}`;

  // ✅ активна мініатюра
  document.querySelectorAll(".thumbs img").forEach((img, i) => {
    img.classList.toggle("active", i === current);
  });
}

// ✅ вибір мініатюри
function selectImage(index) {
  current = index;
  updateImage();
}

// ✅ fullscreen
function openModal() {
  document.getElementById("modal").style.display = "flex";
  document.getElementById("modalImg").src = images[current];
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// ✅ загрузка об'єкта
async function loadObject() {
  if (!id) return;

  const snap = await getDoc(doc(db, "objects", id));

  if (!snap.exists()) {
    document.getElementById("objectPage").innerHTML = "❌ Не знайдено";
    return;
  }

  const d = snap.data();

  images = d.images || [d.image];

  document.getElementById("objectPage").innerHTML = `
    <div class="object-page">

      <div class="gallery">

        <button class="nav left" onclick="changeSlide(-1)">◀</button>

        <img id="mainImg" src="${images[0]}" onclick="openModal()">

        <button class="nav right" onclick="changeSlide(1)">▶</button>

        <div id="counter">1 / ${images.length}</div>

      </div>

      <div class="thumbs">
        ${images.map((img, i) => `
          <img src="${img}" onclick="selectImage(${i})">
        `).join("")}
      </div>

      <h1>${d.title || "Без назви"}</h1>

      <p>📐 ${d.area || "-"} м²</p>
      <p>💰 ${d.price || "-"} $</p>

      <button onclick="call()">📞 Подзвонити</button>

      <div id="modal" onclick="closeModal()">
        <img id="modalImg">
      </div>

    </div>
  `;
}

// ✅ телефон
window.call = () => {
  window.location.href = "tel:+380674464705";
};

// ✅ глобальні функції
window.changeSlide = changeSlide;
window.selectImage = selectImage;
window.openModal = openModal;
window.closeModal = closeModal;

// ✅ старт
loadObject();

// ✅ свайп
let startX = 0;

document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
  let endX = e.changedTouches[0].clientX;

  if (endX - startX > 50) changeSlide(-1);
  if (startX - endX > 50) changeSlide(1);
});
