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

// ✅ Firebase config
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

// ✅ ГАЛЕРЕЯ
let images = [];
let current = 0;
let currentObject = null;

function changeSlide(step) {
  current += step;
  if (current >= images.length) current = 0;
  if (current < 0) current = images.length - 1;
  updateImage();
}

function updateImage() {
  const img = document.getElementById("mainImg");
  if (!img) return;

  img.src = images[current] || "https://via.placeholder.com/400";

  const counter = document.getElementById("counter");
  if (counter) {
    counter.textContent = `${current + 1} / ${images.length}`;
  }
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

  window.location.href = `chat.html?chatId=${chatId}`;
};

// ✅ CALL
window.call = () => {
  window.location.href = "tel:+380674464705";
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

  await updateDoc(doc(db, "objects", id), {
    views: increment(1)
  });

  images = d.images || [];

  document.getElementById("objectPage").innerHTML = `
    <h1>${d.title}</h1>
    <img id="mainImg" src="${images[0] || ""}" style="width:100%">
    <p>💰 ${d.price}$</p>
    <div id="map" style="height:300px;"></div>
  `;

  updateImage();

  setTimeout(() => {
    initMap(d.lat, d.lng);
  }, 300);
}

// ✅ START
loadObject();
