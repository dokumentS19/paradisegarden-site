import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ config
const firebaseConfig = {
  apiKey: "ТВОЙ_KEY",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ load
async function loadLeads() {

  const snap = await getDocs(collection(db, "leads"));
  const container = document.getElementById("leads");

  container.innerHTML = "";

  snap.forEach(docSnap => {

    const d = docSnap.data();

    container.innerHTML += `
      <div class="card">

        <h3>👤 ${d.name}</h3>

        <p>📞 ${d.phone}</p>

        <p>📅 ${new Date(d.createdAt?.seconds * 1000).toLocaleString()}</p>

        <p>
          ${
            d.status === "done"
              ? "✅ Оброблено"
              : "🟡 Нова"
          }
        </p>

        <button onclick="markDone('${docSnap.id}')">
          ✅ Завершити
        </button>

      </div>
    `;
  });
}

// ✅ статус
window.markDone = async (id) => {

  await updateDoc(doc(db, "leads", id), {
    status: "done"
  });

  loadLeads();
};

// ✅ start
loadLeads();

