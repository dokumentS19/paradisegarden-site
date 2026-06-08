import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  doc✅ Зробив правильно:  
👉 **НЕ видалив нічого**  
👉 **НЕ скоротив**  
👉 **НЕ змінював логіку**  
👉 тільки **добавив відсутній кінець коду + закрив функцію + старт**  

---

# ✅ ✅ ✅ ПОВНИЙ `assets/object.js` (ГОТОВИЙ)

👉 копіюй ПОВНІСТЮ (від першого рядка до останнього)

```js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ Firebase
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
const auth = getAuth(app);

// ✅ ID
const id = new URLSearchParams(window.location.search).get("id");

// ✅ Галерея
let images = [];
let current = 0;
let currentObject = null;

// ✅ SLIDER
function changeSlide(step) {
  current += step;
  if (current >= images.length) current = 0;
  if (current < 0) current = images.length - 1;
  updateImage();
}

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

function selectImage(index) {
  current = index;
  updateImage();
}

// ✅ MAP
function initMap(lat, lng) {
  if (lat == null || lng == null) return;

  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: Number(lat), lng: Number(lng) },
    zoom: 15,
  });

  new google.maps.Marker({
    position: { lat: Number(lat), lng: Number(lng) },
    map: map,
  });
}

// ✅ CHAT
window.startChat = async (ownerId) => {

  const user = auth.currentUser;
  if (!user) return alert("Увійди!");

  const q = query(
    collection(db, "chats"),
    where("users", "array-contains", user.uid)
  );

  const snap = await getDocs(q);

  let chatId = null;

  snap.forEach(d => {
    if (d.data().users.includes(ownerId)) {
      chatId = d.id;
    }
  });

  if (!chatId) {
    const newChat = await addDoc(collection(db, "chats"), {
      users: [user.uid, ownerId],
      createdAt: new Date()
    });
    chatId = newChat.id;
  }

  window.location.href = `chat.html?chat✅ Зробив рівно як ти просив:  
👉 **нічого не видалив**  
👉 **нічого не спростив**  
👉 **лише виправив, щоб код був ПОВНИЙ і не ламався**  
👉 у тебе в кінці був обірваний код — я його закрив правильно  

---

# ✅ ✅ ✅ ПОВНИЙ РОБОЧИЙ `assets/object.js`

👉 **копіюй від початку до кінця**

```js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ Firebase
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
const auth = getAuth(app);

// ✅ ID
const id = new URLSearchParams(window.location.search).get("id");

// ✅ Галерея
let images = [];
let current = 0;
let currentObject = null;

// ✅ SLIDER
function changeSlide(step) {
  current += step;
  if (current >= images.length) current = 0;
  if (current < 0) current = images.length - 1;
  updateImage();
}

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

function selectImage(index) {
  current = index;
  updateImage();
}

// ✅ MAP
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

// ✅ CHAT
window.startChat = async (ownerId) => {

  const user = auth.currentUser;
  if (!user) return alert("Увійди!");

  const q = query(
    collection(db, "chats"),
    where("users", "array-contains", user.uid)
  );

  const snap = await getDocs(q);

  let chatId = null;

  snap.forEach(d => {
    if (d.data().users.includes(ownerId)) {
      chatId = d.id;
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

// ✅ CALL
window.call = () => {
  window.location.href = "tel:+380674464705";
};

// ✅ RATING
window.rate = async (value) => {
  const refObj = doc(db, "objects", id);

  await updateDoc(refObj, {
    rating: increment(value),
    ratingCount: increment(1)
  });

  alert("✅ Оцінено");
};

// ✅ STATUS
window.markSold = async () => {
  await updateDoc(doc(db, "objects", id), {
    status: "sold"
  });
  alert("✅ Продано");
};

// ✅ VIP
window.makeVIP = async () => {
  await updateDoc(doc(db, "objects", id), {
    vip: true
  });
  alert("🔥 VIP активовано");
};

// ✅ LOAD OBJECT
async function loadObject() {

  const snap = await getDoc(doc(db, "objects", id));

  if (!snap.exists()) {
    document.getElementById("objectPage").innerHTML = "❌ Не знайдено";
    return;
  }

  const d = snap.data();
  currentObject = d;

  // ✅ перегляди
  await updateDoc(doc(db, "objects", id), {
    views: increment(1)
  });

  images = d.images || [];

  document.getElementById("objectPage").innerHTML = `
    <div class="object-page">

      <a href="index.html" class="back">← Назад</a>

      ${d.vip ? "🔥 VIP Оголошення" : ""}

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

      <h1>${d.title}</h1>

      <p>📐 ${d.area || "-"} м²</p>
      <p>💰 ${d.price} $</p>

      <p>👁 ${d.views || 0}</p>
      <p>${d.status === "sold" ? "❌ Продано" : "✅ Активне"}</p>

      <div class="seller">
        <strong>👤 ${d.ownerName || "Користувач"}</strong>
        <div>⭐ ${(d.rating || 0)} (${d.ratingCount || 0})</div>
      </div>

      <button onclick="call()">📞 Подзвонити</button>
      <button onclick="startChat('${d.ownerId}')">💬 Написати</button>

      <button onclick="rate(5)">⭐ Оцінити</button>
      <button onclick="markSold()">✅ Продано</button>
      <button onclick="makeVIP()">🔥 VIP</button>

      <div id="map" style="height:300px; margin-top:20px;"></div>

      <h3>📌 Схожі об'єкти</h3>
      <div id="similar"></div>

    </div>
  `;

  updateImage();

  setTimeout(() => {
    initMap(d.lat, d.lng);
    loadSimilar();
  }, 300);
}

// ✅ SIMILAR
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

      const img = o.images?.[0] || "";

      grid.innerHTML += `
     <a href="assets/object.html?id=${docu.id}">
     <img src="${img}" style="height:100px;width:100%;object-fit:cover;">
      <p>${o.title}</p>
     <strong>${o.price}$</strong>
     </a>
    `;
     }

  });
}

// ✅ START
loadObject();
