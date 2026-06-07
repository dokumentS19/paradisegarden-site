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

// 🔥 ВСТАВ СВОЇ ДАНІ
const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.firebasestorage.app",
  messagingSenderId: "452352075250",
  appId: "1:452352075250:web:049e1b3f10c44bc04c776b",
  measurementId: "G-6XHWE6Y0JE"
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.appspot.com"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);

// ✅ ПРЕВ’Ю ФОТО
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

// ✅ ДОДАВАННЯ ОБ’ЄКТА
window.addObject = async () => {
  const title = document.getElementById("title").value;
  const area = document.getElementById("area").value;
  const price = document.getElementById("price").value;
  const files = input.files;

  if (!title || !price || files.length === 0) {
    alert("Заповни всі поля і вибери фото");
    return;
  }

  try {
    const imageUrls = [];

    // ✅ загрузка всіх фото
    for (let file of files) {

      const storageRef = ref(
        storage,
        "objects/" + Date.now() + "_" + file.name
      );

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      imageUrls.push(url);
    }

    // ✅ запис в Firestore
    await addDoc(collection(db, "objects"), {
      title,
      area,
      price,
      images: imageUrls, // ✅ масив фото
      createdAt: new Date()
    });

    alert("✅ Об'єкт додано!");

    // очистка
    preview.innerHTML = "";
    input.value = "";

  } catch (err) {
    console.error(err);
    alert("❌ Помилка завантаження");
  }
};
