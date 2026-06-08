import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ CONFIG
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
const storage = getStorage(app);
const auth = getAuth(app);

let currentUser = null;

// ✅ USER
onAuthStateChanged(auth, user => {
  currentUser = user;
});

// ✅ PREVIEW
const input = document.getElementById("file");
const preview = document.getElementById("preview");

input.addEventListener("change", () => {
  preview.innerHTML = "";

  const files = input.files;

  for (let file of files) {
    const reader = new FileReader();

    reader.onload = e => {
      const img = document.createElement("img");
      img.src = e.target.result;
      preview.appendChild(img);
    };

    reader.readAsDataURL(file);
  }
});

// ✅ ADD OBJECT
window.addObject = async () => {

  const title = document.getElementById("title").value.trim();
  const area = document.getElementById("area").value;
  const price = document.getElementById("price").value;
  const files = input.files;

  if (!title || !price || files.length === 0) {
    alert("Заповни всі поля і додай фото");
    return;
  }

  if (!currentUser) {
    alert("Увійди!");
    return;
  }

  try {
    const imageUrls = [];

    for (let file of files) {

      const fileName =
        Date.now() + "_" + Math.random().toString(36).slice(2);

      const storageRef = ref(storage, "objects/" + fileName);

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      imageUrls.push(url);
    }

    // ✅ ЗАПИС В FIREBASE
    await addDoc(collection(db, "objects"), {
      title,
      area: area || "-",
      price: Number(price),
      images: imageUrls,

      // ✅ ✅ ✅ ОТ САМЕ ТУТ ДОДАНО
      lat: 50.5215,
      lng: 30.2506,

      // ✅ власник
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || "Користувач",

      // ✅ PRO ПОЛЯ
      status: "active",
      views: 0,
      rating: 0,
      ratingCount: 0,
      vip: false,

      createdAt: new Date()
    });

    alert("✅ Об'єкт створено!");

    // ✅ очистка
    preview.innerHTML = "";
    input.value = "";
    document.getElementById("title").value = "";
    document.getElementById("area").value = "";
    document.getElementById("price").value = "";

  } catch (err) {
✅ ІДЕАЛЬНО. ТИ ДАВ САМЕ ТОЙ ФАЙЛ, ЯКИЙ ТРЕБА 🔥  

👉 Зараз я **поправлю ТІЛЬКИ потрібне**, нічого не видаляю, не змінюю логіку — просто додаю `lat/lng`.

---

# ✅ ✅ ✅ ОНОВЛЕНИЙ `admin.js` (СКОПІЮЙ І ЗАМІНИ ПОВНІСТЮ)

```js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ CONFIG

});

// ✅ PREVIEW
const input = document.getElementById("file");
const preview = document.getElementById("preview");

input.addEventListener("change", () => {
  preview.innerHTML = "";

  const files = input.files;

  for (let file of files) {
    const reader = new FileReader();

    reader.onload = e => {
      const img = document.createElement("img");
      img.src = e.target.result;
      preview.appendChild(img);
    };

    reader.readAsDataURL(file);
  }
});

// ✅ ADD OBJECT
window.addObject = async () => {

  const title = document.getElementById("title").value.trim();
  const area = document.getElementById("area").value;
  const price = document.getElementById("price").value;
  const files = input.files;

  if (!title || !price || files.length === 0) {
    alert("Заповни всі поля і додай фото");
    return;
  }

  if (!currentUser) {
    alert("Увійди!");
    return;
  }

  try {
    const imageUrls = [];

    for (let file of files) {

      const fileName =
        Date.now() + "_" + Math.random().toString(36).slice(2);

      const storageRef = ref(storage, "objects/" + fileName);

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      imageUrls.push(url);
    }

    // ✅ ✅ ✅ ГОЛОВНИЙ FIX ТУТ
    await addDoc(collection(db, "objects"), {
      title,
      area: area || "-",
      price: Number(price),
      images: imageUrls,

      // ✅ КООРДИНАТИ (додаємо!)
      lat: 50.5215,
      lng: 30.2506,

      // ✅ власник
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || "Користувач",

      // ✅ PRO ПОЛЯ
      status: "active",
      views: 0,
      rating: 0,
      ratingCount: 0,
      vip: false,

      createdAt: new Date()
    });

    alert("✅ Об'єкт створено!");

    // ✅ очистка
    preview.innerHTML = "";
    input.value = "";
    document.getElementById("title").value = "";
    document.getElementById("area").value = "";
    document.getElementById("price").value = "";

  } catch (err) {
    console.error(err);
    alert("❌ Помилка");
  }
};
``
