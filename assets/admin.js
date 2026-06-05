 
import { getStorage, ref, uploadBytes, getDownloadURL }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
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
// ✅ ГОЛОВНА ФУНКЦІЯ
window.addObject = async () => {
  const title = document.getElementById("title").value;
  const area = Number(document.getElementById("area").value);
  const price = Number(document.getElementById("price").value);
  const files = document.getElementById("image").files;

  const images = [];

  for (let file of files) {
  const storageRef = ref(storage, "images/" + Date.now() + "_" + file.name);

  await uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);

  images.push(url);
 }

  await addDoc(collection(db, "objects"), {
    title,
    area,
    price,
    images
  });

  alert("✅ Додано!");

  // очистка ✅
  document.getElementById("title").value = "";
  document.getElementById("area").value = "";
  document.getElementById("price").value = "";
  document.getElementById("image").value = "";
};

// ✅ кнопка
document.getElementById("addBtn").onclick = window.addObject;
