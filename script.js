import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 

// ✅ ВСТАВ СВОЇ ДАНІ
const firebaseConfig = {
  apiKey: "ТВОЙ_API_KEY",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ ЗАВАНТАЖЕННЯ ОБ’ЄКТІВ
async function loadObjects() {
  const snap = await getDocs(collection(db, "objects"));

  const grid = document.getElementById("objectsGrid");
  grid.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();

    const img = d.images?.[0] || d.image || "https://via.placeholder.com/400";

   const html = `
  <a href="object.html?id=${doc.id}" class="card">
    <img src="${img}" alt="">

    <h3>${d.title || "Без назви"}</h3>
    <p>Площа: ${d.area || "-"} м²</p>
    <strong>${d.price || "-"} $</strong>
  </a>
`;

    grid.insertAdjacentHTML("beforeend", html);
  });
}

loadObjects();
