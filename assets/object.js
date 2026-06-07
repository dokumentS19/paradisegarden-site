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

// ✅ ГАЛЕРЕЯ
let images = [];
let current = 0;

function changeSlide(step) {
  current += step;

  if (current >= images.length) current = 0;
  if (current < 0) current = images.length - 1;

  document.getElementById("mainImg").src = images[current];
}

// ✅ FULLSCREEN
function openModal() {
  document.getElementById("modal").style.display = "flex";
  document.getElementById("modalImg").src = images[current];
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// ✅ ЗАВАНТАЖЕННЯ ОБ'ЄКТА
async function loadObject() {

