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

// ✅ ТВОЙ КОНФІГ
const firebaseConfig = {
  apiKey: "ТВОЙ_API_KEY",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.appspot.com"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);

// ✅ ДОДАВАННЯ ОБ'ЄКТА
window.addObject = async () => {
  const title = document.getElementById("title").value;
  const area = document.getElementById("area").value;
  const price = document.getElementById("price").value;
  const file = document.getElementById("file").files[0];

  if (!title || !price || !file) {
    alert("Заповни всі поля і вибери фото");
    return;
  }

  try {
    // ✅ шлях в storage
    const storageRef = ref(storage, "objects/" + Date.now() + "_" + file.name);

    // ✅ загрузка файлу
    await uploadBytes(storageRef, file);

    // ✅ отримати URL
    const url = await getDownloadURL(storageRef);

    // ✅ запис в Firestore
    await addDoc(collection(db, "objects"), {
      title,
      area,
      price,
      images: [url], // ✅ ВАЖЛИВО
      createdAt: new Date()
    });

    alert("✅ Об'єкт додано!");
  } catch (err) {
    console.error(err);
    alert("❌ Помилка загрузки");
  }
};
};
