// ===== Firebase =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ===== CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.firebasestorage.app"
};

// ===== INIT =====
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ===== AUTH =====
const PASSWORD = "admin123";
let currentRole = null;

function login() {
  const pass = prompt("Пароль:");
  if (pass === PASSWORD) {
    currentRole = "admin";
    localStorage.setItem("role", "admin");
    init();
  } else {
    alert("❌ Невірний пароль");
  }
}

function checkAuth() {
  const role = localStorage.getItem("role");
  if (!role) login();
  else {
    currentRole = role;
    init();
  }
}

// ===== DOM =====
const addBtn = document.getElementById("addBtn");
const titleInput = document.getElementById("title");
const areaInput = document.getElementById("area");
const priceInput = document.getElementById("price");
const fileInput = document.getElementById("image");
const preview = document.getElementById("preview");
const list = document.getElementById("adminList");

// ===== PREVIEW =====
fileInput?.addEventListener("change", () => {
  preview.innerHTML = "";
  for (const file of fileInput.files) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.width = "80px";
    img.style.marginRight = "5px";
    preview.appendChild(img);
  }
});

// ===== ADD OBJECT =====
async function addObject() {

  if (!titleInput.value || !priceInput.value || !fileInput.files.length) {
    alert("❗ Заповни всі поля");
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = "Завантаження...";

  try {
    const images = [];

    for (const file of fileInput.files) {
      const name = Date.now() + "_" + file.name;

      const storageRef = ref(storage, "objects/" + name);

      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);

      images.push(url);
    }

    await addDoc(collection(db, "objects"), {
      title: titleInput.value,
      area: Number(areaInput.value),
      price: Number(priceInput.value),
      images,
      createdAt: Date.now()
    });

    alert("✅ Обʼєкт додано");

    // reset
    titleInput.value = "";
    areaInput.value = "";
    priceInput.value = "";
    fileInput.value = "";
    preview.innerHTML = "";

    loadObjects();

  } catch (err) {
    console.error(err);
    alert("❌ Помилка");
  }

  addBtn.disabled = false;
  addBtn.textContent = "Додати";
}

// ===== LOAD OBJECTS =====
async function loadObjects() {
  if (!list) return;

  list.innerHTML = "⏳ Завантаження...";

  try {
    const snap = await getDocs(collection(db, "objects"));
    list.innerHTML = "";

    snap.forEach(docSnap => {
      const d = docSnap.data();
      const id = docSnap.id;

      const div = document.createElement("div");

      div.innerHTML = `
        <b>${d.title}</b> — ${d.price}$ 
        ${currentRole === "admin" ? `<button data-id="${id}">❌</button>` : ""}
      `;

      list.appendChild(div);
    });

  } catch {
    list.innerHTML = "❌ Помилка";
  }
}

// ===== DELETE =====
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;

  if (currentRole !== "admin") {
    alert("⛔ Немає доступу");
    return;
  }

  const id = btn.dataset.id;

  if (!confirm("Видалити об'єкт?")) return;

  await deleteDoc(doc(db, "objects", id));

  alert("✅ Видалено");
  loadObjects();
});

// ===== REVIEWS =====
const reviewForm = document.getElementById("reviewForm");

reviewForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  try {
    await addDoc(collection(db, "reviews"), {
      ...data,
      createdAt: Date.now()
    });

    alert("✅ Відгук збережено");
    e.target.reset();

  } catch {
    alert("❌ Помилка");
  }
});

// ===== INIT =====
function init() {
  loadObjects();
}

// ===== START =====
checkAuth();
addBtn?.addEventListener("click", addObject);
