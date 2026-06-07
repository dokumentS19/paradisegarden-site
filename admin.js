import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "ТВОЙ_API_KEY",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.addObject = async () => {
  const title = document.getElementById("title").value;
  const area = document.getElementById("area").value;
  const price = document.getElementById("price").value;

  if (!title || !price) {
    alert("Заповни дані");
    return;
  }

  await addDoc(collection(db, "objects"), {
    title,
    area,
    price,
    image: "",
    createdAt: new Date()
  });

  alert("✅ Об'єкт додано");
};
