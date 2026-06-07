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
   ✅ AI ПРІОРИТЕТ
=================================== */
function getPriority(lead) {

  let score = 0;

  if (lead.status === "new") score += 2;
  if (lead.note && lead.note.length > 5) score += 2;

  score += Math.min((lead.income || 0) / 1000, 5);

  if (lead.createdAt?.seconds) {
    const days = (Date.now() - lead.createdAt.seconds * 1000) / (1000 * 60 * 60 * 24);
    if (days < 2) score += 2;
  }

  return score;
}

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
  drawChart(allLeads);
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

  data
    .sort((a, b) => getPriority(b) - getPriority(a))
    .forEach(d => {

      const priority = getPriority(d);

      let badge = "🟡";
      if (priority > 6) badge = "🔥 ГАРЯЧИЙ";
      else if (priority > 3) badge = "⚡ ТЕПЛИЙ";

      container.innerHTML += `
        <div class="card">

          <h3>👤 ${d.name}</h3>
          <p>📞 ${d.phone}</p>

          <p><strong>${badge}</strong></p>

          <textarea id="note-${d.id}" placeholder="Коментар...">
${d.note || ""}
          </textarea>

          <button onclick="saveNote('${d.id}')">💾 Зберегти</button>

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

  const conversion = total
    ? Math.round((done / total) * 100)
    : 0;

  const income = data.reduce((sum, l) => sum + (l.income || 0), 0);

  const hot = data.filter(l => getPriority(l) > 6).length;

  document.getElementById("stats").innerHTML = `
    <h3>📊 Аналітика агентства</h3>
    <p>Всього заявок: ${total}</p>
    <p>Нові: ${newLeads}</p>

