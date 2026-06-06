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

// ===== AUTH (простий SaaS рівень) =====
const PASSWORD = "admin123";  // 🔑 змінити
const ROLE_ADMIN = "admin";
const ROLE_MANAGER = "manager";

let currentRole = null;

// login
function login() {
  const pass = prompt("Пароль:");

  if (pass === PASSWORD) {
    currentRole = ROLE_ADMIN;
    localStorage.setItem("role", ROLE_ADMIN);
    alert("✅ Увійшли як ADMIN");
    init();
  } else {
    alert("❌ Невірний пароль");
  }
}

// перевірка при старті
function checkAuth() {
  const role = localStorage.getItem("role");

  if (!role) {
    login();
  } else {
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
  if (currentRole !== ROLE_ADMIN) {
    alert("⛔ Немає доступу");
    return;
  }

  const title = titleInput.value.trim();
  const area = Number(areaInput.value);
  const price = Number(priceInput.value);
  const files = fileInput.files;

  if (!title || !price || !files.length) {
    alert("❗ Заповни все");
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = "Завантаження...";

  try {
    const images = [];

    for (const file of files) {
      const name = Date.now() + "_" + file.name;
      const storageRef = ref(storage, "objects/" + name);

      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);

      images.push(url);
    }

    await addDoc(collection(db, "objects"), {
      title,
      area,
      price,
      images,
      createdAt: Date.now()
    });

    alert("✅ Обʼєкт додано");

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
        ${currentRole === ROLE_ADMIN ? `<button data-id="${id}">❌</button>` : ""}
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

  if (currentRole !== ROLE_ADMIN) {
    alert("⛔ Немає доступу");
    return;
  }

  const id = btn.dataset.id;

  if (!confirm("Видалити?")) return;

  await deleteDoc(doc(db, "objects", id));

  alert("✅ Видалено");
  loadObjects();
});

// ===== CRM: ВІДГУКИ BizChat =====
const reviewForm = document.getElementById("reviewForm");

reviewForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  try {
    await addDoc(collection(db, "reviews"), {
      ...data,
      createdAt: Date.now()
    });

    alert("✅ Дякуємо за відгук про BizChat!");
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
``
