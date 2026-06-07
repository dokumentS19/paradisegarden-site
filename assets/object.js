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

