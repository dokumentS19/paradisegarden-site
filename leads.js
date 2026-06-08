import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";import { initializeDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBq_bUWieO6UI7REfU1iNrk2RK2EjQGnts",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.firebasestorage.app",
  messagingSenderId: "452352075250",
  appId: "1:452352075250:web:049e1b3f10c44bc04c776b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ STATE
let allLeads = [];
let chartInstance = null;

// ✅ DOM CACHE
const UI = {
  leads: document.getElementById("leads"),
  stats: document.getElementById("stats"),
  chart: document.getElementById("leadsChart"),
  search: document.getElementById("searchLead")
};

const STATUSES = ["new", "in_progress", "done"];

/* ===========================
   ✅ HISTORY
=========================== */
async function addHistory(id, action, comment = "") {
  try {
    await updateDoc(doc(db, "leads", id), {
      history: arrayUnion({
        action,
        comment,
        time: new Date().toLocaleString()
      })
    });
  } catch (e) {
    console.error("History error:", e);
  }
}

/* ===========================
   ✅ STATUS LABEL
=========================== */
function getStatusName(status) {
  return {
    new: "🟡 Новий",
    in_progress: "🟠 В роботі",
    done: "✅ Закритий"
  }[status] || status;
}

/* ===========================
   ✅ PRIORITY
=========================== */
function getPriority(lead) {
  let score = 0;

  if (lead?.status === "new") score += 2;
  if (lead?.note?.length > 5) score += 2;

  score += Math.min((lead?.income || 0) / 1000, 5);

  if (lead?.createdAt?.seconds) {
    const days = (Date.now() - lead.createdAt.seconds * 1000) / 86400000;
    if (days < 2) score += 2;
  }

  return score;
}

/* ===========================
   ✅ LOAD
=========================== */
async function loadLeads() {
  try {
    const snap = await getDocs(collection(db, "leads"));

    allLeads = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    render(allLeads);
    analytics(allLeads);
    drawChart(allLeads);

  } catch (e) {
    console.error("Load error:", e);
  }
}

/* ===========================
   ✅ RENDER
=========================== */
function render(data) {

  if (!UI.leads) return;

  UI.leads.innerHTML = "";

  if (!data?.length) {
    UI.leads.innerHTML = "<p>Немає заявок</p>";
    return;
  }

  let html = "";

  data
    .sort((a, b) => getPriority(b) - getPriority(a))
    .forEach(d => {

      const priority = getPriority(d);

      let badge = "🟡";
      if (priority > 6) badge = "🔥";
      else if (priority > 3) badge = "⚡";

      const historyHtml = (d.history || [])
        .slice(-5)
        .map(h => `<div>📌 ${h.action} (${h.time})</div>`)
        .join("");

      html += `
        <div class="card" draggable="true"
          ondragstart="dragStart(event,'${d.id}')">

          <h3>👤 ${d.name || "-"}</h3>
          <p>📞 ${d.phone || "-"}</p>

          <p>${badge}</p>

          <textarea id="note-${d.id}">${d.note || ""}</textarea>

          <button onclick="saveNote('${d.id}')">💾</button>

          <p>${getStatusName(d.status)}</p>

          <input value="${d.manager || ""}"
            onchange="assignManager('${d.id}',this.value)">

          <input type="datetime-local"
            onchange="setReminder('${d.id}',this.value)">

          <button onclick="markDone('${d.id}')">✅</button>
          <button onclick="removeLead('${d.id}')">❌</button>

          <div>${historyHtml}</div>

        </div>
      `;
    });

  UI.leads.innerHTML = html;

  renderBoard(data);
}

/* ===========================
   ✅ BOARD
=========================== */
function renderBoard(data) {
  const board = document.getElementById("crmBoard");
  if (!board) return;

  board.innerHTML = STATUSES.map(s => `
    <div class="column"
      ondrop="dropLead(event,'${s}')"
      ondragover="allowDrop(event)">
      <h3>${getStatusName(s)}</h3>
      ${data.filter(l => l.status === s)
        .map(l => `<div class="mini">${l.name}</div>`).join("")}
    </div>
  `).join("");
}

/* ===========================
   ✅ ACTIONS
=========================== */
window.markDone = async (id) => {
  await updateDoc(doc(db, "leads", id), { status: "done" });
  await addHistory(id, "Закрито");
  loadLeads();
};

window.removeLead = async (id) => {
  if (!confirm("Видалити?")) return;
  await deleteDoc(doc(db, "leads", id));
  loadLeads();
};

window.saveNote = async (id) => {
  const val = document.getElementById("note-" + id).value;
  await updateDoc(doc(db, "leads", id), { note: val });
  await addHistory(id, "Коментар", val);
};

window.assignManager = async (id, val) => {
  await updateDoc(doc(db, "leads", id), { manager: val });
  await addHistory(id, "Менеджер", val);
};

window.setReminder = async (id, val) => {
  await updateDoc(doc(db, "leads", id), { reminder: new Date(val) });
  await addHistory(id, "Нагадування", val);
};

/* ===========================
   ✅ SEARCH (DEBOUNCE)
=========================== */
let searchTimer;

window.searchLead = () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    const val = UI.search.value.toLowerCase();

    const filtered = allLeads.filter(l =>
      (l.name || "").toLowerCase().includes(val) ||
      (l.phone || "").includes(val)
    );

    render(filtered);
  }, 250);
};

/* ===========================
   ✅ ANALYTICS
=========================== */
function analytics(data) {
  const done = data.filter(l => l.status === "done").length;
  const income = data.reduce((s, l) => s + (l.income || 0), 0);

  if (UI.stats) {
    UI.stats.innerHTML = `
      <p>Заявки: ${data.length}</p>
      <p>Закриті: ${done}</p>
      <p>Дохід: ${income}$</p>
    `;
  }

  document.getElementById("kpi-total").innerText = data.length;
  document.getElementById("kpi-done").innerText = done;
  document.getElementById("kpi-income").innerText = income + "$";
}

/* ===========================
   ✅ CHART (FIXED)
=========================== */
function drawChart(data) {

  if (!UI.chart) return;

  if (chartInstance) chartInstance.destroy();

  const done = data.filter(l => l.status === "done").length;

  chartInstance = new Chart(UI.chart, {
    type: "doughnut",
    data: {
      labels: ["Нові", "Оброблені"],
      datasets: [{
        data: [data.length - done, done],
        backgroundColor: ["#facc15", "#22c55e"]
      }]
    }
  });
}

/* ===========================
   ✅ START
=========================== */
loadLeads();
import { arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
