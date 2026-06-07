import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ Firebase
const firebaseConfig = {
  apiKey: "ТВОЙ_FIREBASE_KEY",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ ID
const id = new URLSearchParams(window.location.search).get("id");

// ✅ Галерея
let images = [];
let current = 0;
let currentObject = null;

// ✅ перемикання
function changeSlide(step) {
  current += step;

  if (current >= images.length) current = 0;
  if (current < 0) current = images.length - 1;

  updateImage();
}

// ✅ оновлення
function updateImage() {
  const img = document.getElementById("mainImg");
  if (!img) return;

  img.src = images[current];

  const counter = document.getElementById("counter");
  if (counter) {
    counter.textContent = `${current + 1} / ${images.length}`;
  }

  document.querySelectorAll(".thumbs img").forEach((el, i) => {
    el.classList.toggle("active", i === current);
  });
}

// ✅ вибір
function selectImage(index) {
  current = index;
  updateImage();
}

// ✅ карта
function initMap(lat, lng) {
  if (!lat || !lng) return;

  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: Number(lat), lng: Number(lng) },
    zoom: 15,
  });

  new google.maps.Marker({
    position: { lat: Number(lat), lng: Number(lng) },
    map: map,
  });
}

// ✅ чат
window.startChat = async (ownerId) => {

  const user = auth.currentUser;

  if (!user) {
    alert("Увійди!");
    return;
  }

  const q = query(
    collection(db, "chats"),
    where("users", "array-contains", user.uid)
  );

  const snap = await getDocs(q);

  let chatId = null;

  snap.forEach(doc => {
    const users = doc.data().users;

    if (users.includes(ownerId)) {
      chatId = doc.id;
    }
  });

  if (!chatId) {
    const newChat = await addDoc(collection(db, "chats"), {
      users: [user.uid, ownerId],
      createdAt: new Date()
    });

    chatId = newChat.id;
  }

  window.location.href = `chat.html?chatId=${chatId}`;
};

// ✅ дзвінок
window.call = () => {
  window.location.href = "tel:+380674464705";
};

// ✅ ЗАВАНТАЖЕННЯ
async function loadObject() {

  const snap = await getDoc(doc(db, "objects", id));

  if (!snap.exists()) {
    document.getElementById("objectPage").innerHTML = "❌ Не знайдено";
    return;
  }

  const d = snap.data();
  currentObject = d;

  images = d.images || (d.image ? [d.image] : []);

  document.getElementById("objectPage").innerHTML = `
    <div class="object-page">

      <a href="index.html" class="back">← Назад</a>

      <div class="gallery">
        <button class="nav left" onclick="changeSlide(-1)">◀</button>

        <img id="mainImg" src="${images[0] || ""}">

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

      <!-- ✅ продавець -->
      <div class="seller">
        <strong>👤 Продавець</strong>
        ${d.ownerName || "Користувач"}
        <div>⭐⭐⭐⭐☆ (4.0)</div>
      </div>

      <button onclick="call()">📞 Подзвонити</button>

      <button onclick="startChat('${d.ownerId}')" style="
        margin-top:10px;
        padding:12px;
        background:#3b82f6;
        color:white;
        border:none;
        border-radius:8px;
      ">
        💬 Написати продавцю
      </button>

      <div id="map" style="height:300px; margin-top:20px;"></div>

      <h3 style="margin-top:30px;">📌 Схожі об'єкти</h3>
      <div id="similar"></div>

    </div>
  `;

  updateImage();

  setTimeout(() => {
    initMap(d.lat, d.lng);
    loadSimilar();
  }, 300);
}

// ✅ схожі об'єкти
async function loadSimilar() {

  const grid = document.getElementById("similar");

  const snap = await getDocs(collection(db, "objects"));

  snap.forEach(docu => {

    if (docu.id === id) return;

    const o = docu.data();

    if (
      o.price &&
      currentObject.price &&
      Math.abs(o.price - currentObject.price) < 20000
    ) {
      const img = o.images?.[0] || "https://via.placeholder.com/200";

      grid.innerHTML += `
        <a href="object.html?id=${docu.id}">
          <img src="${img}">
          <h4>${o.title}</h4>
          <strong>${o.price}$</strong>
        </a>
      `;
    }
  });
}

// ✅ глобально
window.changeSlide = changeSlide;
window.selectImage = selectImage;

// ✅ запуск
loadObject();

// ✅ swipe
let startX = 0;

document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
  const endX = e.changedTouches[0].clientX;

  if (endX - startX > 50) changeSlide(-1);
  if (startX - endX > 50) changeSlide(1);
});
