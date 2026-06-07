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
  storageBucket: "paradisegarden-site.firebasestorage.app",
  messagingSenderId: "452352075250",
  appId: "1:452352075250:web:049e1b3f10c44bc04c776b",
  measurementId: "G-6XHWE6Y0JE"
};
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const id = new URLSearchParams(window.location.search).get("id");

// ✅ ФУНКЦІЯ ЗАВАНТАЖЕННЯ
async function loadObject() {
  if (!id) return;

  const snap = await getDoc(doc(db, "objects", id));

  if (!snap.exists()) {
    document.getElementById("objectPage").innerHTML = "❌ Не знайдено";
    return;
  }

  const d = snap.data();

  const img = d.images?.[0] || d.image || "https://via.placeholder.com/400";

  document.getElementById("objectPage").innerHTML = `
    <div class="card">

      <img src="${img}" alt="">

      <h1>${d.title || "Без назви"}</h1>

      <p>📐 ${d.area || "-"} м²</p>
      <p>💰 ${d.price || "-"} $</p>

      <button onclick="call()">📞 Подзвонити</button>

    </div>
  `;
} // ✅ ОЦЕЇ ДУЖКИ У ТЕБЕ НЕ ВИСТАЧАЛО

// ✅ ВИКЛИК ПОЗА ФУНКЦІЄЮ
window.call = () => {
  window.location.href = "tel:+380674464705";
};

loadObject();

