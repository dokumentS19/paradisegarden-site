import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "ТВОЙ_API_KEY",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const id = new URLSearchParams(window.location.search).get("id");

async function loadObject() {
  if (!id) return;

  const snap = await getDoc(doc(db, "objects", id));

  if (!snap.exists()) {
    document.getElementById("objectPage").innerHTML = "❌ Не знайдено";
    return;
  }

  const d = snap.data();

  document.getElementById("objectPage").innerHTML = `
    <div class="card">
      <img src="${d.image || "https://via.placeholder.com/400"}">

      <h1>${d.title}</h1>

      <p>📐 ${d.area || "-"} м²</p>
      <p>💰 ${d.price || "-"} $</p>

      <button onclick="call()">📞 Подзвонити</button>
    </div>
  `;
}

window.call = () => {
  window.location.href = "tel:+380674464705";
};

loadObject();
