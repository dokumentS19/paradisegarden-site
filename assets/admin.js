import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ ГОЛОВНА ФУНКЦІЯ
window.addObject = async () => {
  const title = document.getElementById("title").value;
  const area = Number(document.getElementById("area").value);
  const price = Number(document.getElementById("price").value);
  const files = document.getElementById("image").files;

  const images = [];

  for (let file of files) {
    const base64 = await toBase64(file);
    images.push(base64);
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

// ✅ конвертація
function toBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
  });
}
