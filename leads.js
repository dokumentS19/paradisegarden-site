import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ CONFIG
const firebaseConfig = {
  apiKey: "ТВОЙ_KEY",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allLeads = [];

/* ===================================
   ✅ LOAD
=================================== */
async function loadLeads() {

  const snap = await getDocs(collection(db, "leads"));

  allLeads = [];

  snap.forEach(docSnap => {
    allLeads.push({ id: docSnap.id, ...docSnap.data() });
  });

  render(allLeads);
  analytics(allLeads);
}

/* ===================================
   ✅ RENDER
=================================== */
function render(data) {

  const container = document.getElementById("leads");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p>Немає заявок</p>";
    return;
  }

  data.forEach(d => {

    container.innerHTML += `
      <div class="card">

        <h3>👤 ${d.name}</h3>

        <p>📞 ${d.phone}</p>

        <p>
          ${d.status === "done"
            ? "✅ Оброблено"
            : "🟡 Нова"}
        </p>

        <button onclick="markDone('${d.id}')">✅</button>
        <button onclick="removeLead('${d.id}')">❌</button>

      </div>
    `;
  });
}

/* ===================================
   ✅ АНАЛІТИКА
=================================== */
function analytics(data) {

  const total = data.length;
  const done = data.filter(l => l.status === "done").length;
  const newLeads = total - done;

  document.getElementById("stats").innerHTML = `
    <h3>📊 Аналітика</h3>
    <p>Всего: ${total}</p>
    <p>Нові: ${newLeads}</p>
    <p>Оброблені: ${done}</p>
  `;
}

/* ===================================
   ✅ FILTER
=================================== */
window.filterStatus = (status) => {

  if (status === "all") {
    render(allLeads);
    return;
  }

  const filtered = allLeads.filter(l => l.status === status);

  render(filtered);
};

/* ===================================
   ✅ SEARCH
=================================== */
window.searchLead = () => {

  const text = document.getElementById("searchLead").value.toLowerCase();

  const filtered = allLeads.filter(l =>
    l.name.toLowerCase().includes(text) ||
    l.phone.includes(text)
  );

  render(filtered);
};

/* ===================================
   ✅ STATUS
=================================== */
window.markDone = async (id) => {

  await updateDoc(doc(db, "leads", id), {
    status: "done"
  });

  loadLeads();
};

/* ===================================
   ✅ DELETE
=================================== */
window.removeLead = async (id) => {

  if (!confirm("Видалити заявку?")) return;

  await deleteDoc(doc(db, "leads", id));

  loadLeads();
};

/* ===================================
   ✅ START
=================================== */
loadLeads();
``
