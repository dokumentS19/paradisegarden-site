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
const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.appspot.com"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

let currentUser = null;

// ✅ отримуємо юзера
onAuthStateChanged(auth, user => {
  currentUser = user;
});

// ✅ PREVIEW ФОТО
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

// ✅ ДОДАТИ ОБʼЄКТ
window.addObject = async () => {

  const title = document.getElementById("title").value.trim();
  const area = document.getElementById("area").value;
  const price = document.getElementById("price").value;
  const files = input.files;

  // ✅ перевірка
  if (!title || !price || files.length === 0) {
    alert("Заповни назву, ціну і вибери фото");
    return;
  }

  if (!currentUser) {
    alert("Увійди в кабінет!");
    return;
  }

  try {
    const imageUrls = [];

    // ✅ загрузка фото
    for (let file of files) {

      const fileName = Date.now() + "_" + Math.random().toString(36).slice(2);
      const storageRef = ref(storage, "objects/" + fileName);

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      imageUrls.push(url);
    }

    // ✅ запис у Firestore
    await addDoc(collection(db, "objects"), {
      title,
      area: area || "-",
      price: Number(price),
      images: imageUrls,
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || "Користувач", // ✅ ДОДАНО
      createdAt: new Date()
    });

    alert("✅ Об'єкт додано!");

    // ✅ очистка
    preview.innerHTML = "";
    input.value = "";
    document.getElementById("title").value = "";
    document.getElementById("area").value = "";
    document.getElementById("price").value = "";

  } catch (err) {
    console.error(err);
    alert("❌ Помилка завантаження");
  }
};
