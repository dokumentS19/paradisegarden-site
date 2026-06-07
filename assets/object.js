import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

// ✅ Перемикання
function changeSlide(step) {
  current += step;

  if (current >= images.length) current = 0;
  if (current < 0) current = images.length - 1;

  updateImage();
}

// ✅ Оновлення
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

// ✅ Вибір фото
function selectImage(index) {
  current = index;
  updateImage();
}

// ✅ Карта
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

// ✅ ЗАВАНТАЖЕННЯ ОБ'ЄКТА
async function loadObject() {
  if (!id) return;

  const snap = await getDoc(doc(db, "objects", id));

  if (!snap.exists()) {
    document.getElementById("objectPage").innerHTML = "❌ Не знайдено";
    return;
  }

  const d = snap.data();

  images = d.images || (d.image ? [d.image] : []);

  document.getElementById("objectPage").innerHTML = `
    <div class="object-page">

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

      <button onclick="call()">📞 Подзвонити</button>

      <!-- ✅ ЧАТ -->
      <button onclick="startChat('${d.ownerId}')" style="
        margin-top:10px;
        padding:12px;
        background:#3b82f6;
        color:white;
        border:none;
        border-radius:8px;
        cursor:pointer;
      ">
        💬 Написати продавцю
      </button>

      <!-- ✅ КАРТА -->
      <div id="map" style="height:300px; margin-top:20px;"></div>

    </div>
  `;

  updateImage();

  setTimeout(() => {
    initMap(d.lat, d.lng);
  }, 300);
}

// ✅ ЗВОНОК
window.call = () => {
  window.location.href = "tel:+380674464705";
};

// ✅ ЧАТ
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

  snap.forEach(d => {
    const users = d.data().users;

    if (users.includes(ownerId)) {
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

// ✅ глобально
window.changeSlide = changeSlide;
window.selectImage = selectImage;

// ✅ запуск
loadObject();

// ✅ свайп
let startX = 0;

document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
  let endX = e.changedTouches[0].clientX;

  if (endX - startX > 50) changeSlide(-1);

