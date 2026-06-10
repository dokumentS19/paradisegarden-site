import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBq_bUWieO6UI7REfU1iNrk2RK2EjQGnts",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.firebasestorage.app",
  messagingSenderId: "452352075250",
  appId: "1:452352075250:web:049e1b3f10c44bc04c776b",
  measurementId: "G-6XHWE6Y0JE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allLeads = [];
let visibleLeads = [];
let chartInstance = null;
let draggedLeadId = null;

const STATUSES = ["new", "in_progress", "done"];

const UI = {
  leads: document.getElementById("leads"),
  board: document.getElementById("crmBoard"),
  stats: document.getElementById("stats"),
  chart: document.getElementById("leadsChart"),
  search: document.getElementById("searchLead"),
  statusFilter: document.getElementById("statusFilter"),
  sortFilter: document.getElementById("sortFilter"),
  total: document.getElementById("kpi-total"),
  new: document.getElementById("kpi-new"),
  done: document.getElementById("kpi-done"),
  income: document.getElementById("kpi-income")
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStatusName(status) {
  return {
    new: "🟡 Новий",
    in_progress: "🟠 В роботі",
    done: "✅ Закритий"
  }[status] || "🟡 Новий";
}

function getStatusShort(status) {
  return {
    new: "Нові",
    in_progress: "В роботі",
    done: "Закриті"
  }[status] || "Нові";
}

function getLeadDate(lead) {
  if (lead.createdAt?.seconds) {
    return new Date(lead.createdAt.seconds * 1000).toLocaleString("uk-UA");
  }

  return "-";
}

function getLeadTimeValue(lead) {
  if (lead.createdAt?.seconds) {
    return lead.createdAt.seconds * 1000;
  }

  return 0;
}

function getPriority(lead) {
  let score = 0;

  if ((lead.status || "new") === "new") score += 3;
  if ((lead.message || "").length > 10) score += 2;
  if ((lead.note || "").length > 5) score += 1;
  if (Number(lead.income || 0) > 0) score += Math.min(Number(lead.income) / 1000, 5);

  if (lead.createdAt?.seconds) {
    const days = (Date.now() - lead.createdAt.seconds * 1000) / 86400000;
    if (days < 1) score += 3;
    else if (days < 3) score += 1;
  }

  return Math.round(score);
}

function getPriorityBadge(lead) {
  const priority = getPriority(lead);

  if (priority >= 8) return "🔥 Високий";
  if (priority >= 4) return "⚡ Середній";

  return "🟢 Звичайний";
}

async function addHistory(id, action, comment = "") {
  await updateDoc(doc(db, "leads", id), {
    history: arrayUnion({
      action,
      comment,
      time: new Date().toLocaleString("uk-UA")
    }),
    updatedAt: serverTimestamp()
  });
}

async function loadLeads() {
  try {
    const snap = await getDocs(collection(db, "leads"));

    allLeads = snap.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    applyFilters();
  } catch (error) {
    console.error("LOAD LEADS ERROR:", error);

    if (UI.leads) {
      UI.leads.innerHTML = "<p>❌ Не вдалося завантажити заявки.</p>";
    }
  }
}

function applyFilters() {
  const text = UI.search ? UI.search.value.trim().toLowerCase() : "";
  const status = UI.statusFilter ? UI.statusFilter.value : "all";
  const sort = UI.sortFilter ? UI.sortFilter.value : "priority";

  visibleLeads = allLeads.filter(lead => {
    const name = String(lead.name || "").toLowerCase();
    const phone = String(lead.phone || "").toLowerCase();
    const message = String(lead.message || "").toLowerCase();
    const note = String(lead.note || "").toLowerCase();

    const matchesText =
      !text ||
      name.includes(text) ||
      phone.includes(text) ||
      message.includes(text) ||
      note.includes(text);

    const leadStatus = lead.status || "new";
    const matchesStatus = status === "all" || leadStatus === status;

    return matchesText && matchesStatus;
  });

  visibleLeads.sort((a, b) => {
    if (sort === "newest") {
      return getLeadTimeValue(b) - getLeadTimeValue(a);
    }

    if (sort === "income") {
      return Number(b.income || 0) - Number(a.income || 0);
    }

    return getPriority(b) - getPriority(a);
  });

  renderLeads(visibleLeads);
  renderBoard(allLeads);
  updateAnalytics(allLeads);
  drawChart(allLeads);
}

function renderLeads(data) {
  if (!UI.leads) return;

  if (!data.length) {
    UI.leads.innerHTML = "<p>Заявок не знайдено.</p>";
    return;
  }

  UI.leads.innerHTML = data.map(lead => {
    const id = escapeHtml(lead.id);
    const name = escapeHtml(lead.name || "Без імені");
    const phone = escapeHtml(lead.phone || "-");
    const message = escapeHtml(lead.message || "");
    const note = escapeHtml(lead.note || "");
    const manager = escapeHtml(lead.manager || "");
    const income = Number(lead.income || 0);
    const status = lead.status || "new";

    const history = Array.isArray(lead.history) ? lead.history.slice(-5) : [];

    const historyHtml = history.length
      ? history.map(item => {
          return `<div>📌 ${escapeHtml(item.action || "")} ${item.comment ? "— " + escapeHtml(item.comment) : ""} <small>(${escapeHtml(item.time || "")})</small></div>`;
        }).join("")
      : "<div>Історії поки немає</div>";

    return `
      <article class="lead-card" draggable="true" ondragstart="dragStartLead(event, '${id}')">
        <div class="lead-head">
          <div>
            <h3>👤 ${name}</h3>
            <div class="lead-meta">
              <span>📞 ${phone}</span>
              <span>🕒 ${getLeadDate(lead)}</span>
              <span>💬 ${message || "Без повідомлення"}</span>
            </div>
          </div>

          <div style="display:grid;gap:8px;align-content:start;">
            <span class="status-badge-crm">${getStatusName(status)}</span>
            <span class="priority-badge">${getPriorityBadge(lead)}</span>
          </div>
        </div>

        <label>Коментар</label>
        <textarea id="note-${id}" placeholder="Коментар менеджера">${note}</textarea>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label>Менеджер</label>
            <input id="manager-${id}" value="${manager}" placeholder="Імʼя менеджера">
          </div>

          <div>
            <label>Дохід, $</label>
            <input id="income-${id}" type="number" value="${income}" placeholder="0">
          </div>
        </div>

        <div class="lead-actions">
          <button class="btn" type="button" onclick="saveLeadInfo('${id}')">💾 Зберегти</button>
          <button class="cta-outline" type="button" onclick="changeLeadStatus('${id}', 'new')">🟡 Новий</button>
          <button class="cta-outline" type="button" onclick="changeLeadStatus('${id}', 'in_progress')">🟠 В роботу</button>
          <button class="btn" type="button" onclick="changeLeadStatus('${id}', 'done')">✅ Закрити</button>
          <button class="danger-btn" type="button" onclick="deleteLead('${id}')">🗑 Видалити</button>
        </div>

        <div class="lead-history">
          ${historyHtml}
        </div>
      </article>
    `;
  }).join("");
}

function renderBoard(data) {
  if (!UI.board) return;

  UI.board.innerHTML = STATUSES.map(status => {
    const items = data.filter(lead => (lead.status || "new") === status);

    const cards = items.length
      ? items.map(lead => {
          return `
            <div class="lead-mini" draggable="true" ondragstart="dragStartLead(event, '${escapeHtml(lead.id)}')">
              <strong>${escapeHtml(lead.name || "Без імені")}</strong>
              <div style="color:#cbd5e1;font-size:13px;margin-top:5px;">📞 ${escapeHtml(lead.phone || "-")}</div>
              <div style="color:#bbf7d0;font-size:13px;margin-top:5px;">${getPriorityBadge(lead)}</div>
            </div>
          `;
        }).join("")
      : "<p style='color:#94a3b8;'>Порожньо</p>";

    return `
      <div class="crm-column" ondragover="allowLeadDrop(event)" ondrop="dropLead(event, '${status}')">
        <h3>
          <span>${getStatusName(status)}</span>
          <small>${items.length}</small>
        </h3>

        ${cards}
      </div>
    `;
  }).join("");
}

function updateAnalytics(data) {
  const total = data.length;
  const newCount = data.filter(item => (item.status || "new") === "new").length;
  const doneCount = data.filter(item => item.status === "done").length;
  const inProgressCount = data.filter(item => item.status === "in_progress").length;
  const income = data.reduce((sum, item) => sum + Number(item.income || 0), 0);

  if (UI.total) UI.total.textContent = total;
  if (UI.new) UI.new.textContent = newCount;
  if (UI.done) UI.done.textContent = doneCount;
  if (UI.income) UI.income.textContent = `${income}$`;

  if (UI.stats) {
    UI.stats.innerHTML = `
      <p>Усього заявок: <strong>${total}</strong></p>
      <p>Нові: <strong>${newCount}</strong></p>
      <p>В роботі: <strong>${inProgressCount}</strong></p>
      <p>Закриті: <strong>${doneCount}</strong></p>
      <p>Потенційний / зафіксований дохід: <strong>${income}$</strong></p>
    `;
  }
}

function drawChart(data) {
  if (!UI.chart || typeof Chart === "undefined") return;

  const counts = {
    new: data.filter(item => (item.status || "new") === "new").length,
    in_progress: data.filter(item => item.status === "in_progress").length,
    done: data.filter(item => item.status === "done").length
  };

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(UI.chart, {
    type: "doughnut",
    data: {
      labels: ["Нові", "В роботі", "Закриті"],
      datasets: [{
        data: [counts.new, counts.in_progress, counts.done],
        backgroundColor: ["#facc15", "#fb923c", "#22c55e"],
        borderColor: "#0f172a",
        borderWidth: 3
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "#ffffff"
          }
        }
      }
    }
  });
}

window.saveLeadInfo = async function(id) {
  const note = document.getElementById(`note-${id}`)?.value.trim() || "";
  const manager = document.getElementById(`manager-${id}`)?.value.trim() || "";
  const income = Number(document.getElementById(`income-${id}`)?.value || 0);

  try {
    await updateDoc(doc(db, "leads", id), {
      note,
      manager,
      income,
      updatedAt: serverTimestamp()
    });

    await addHistory(id, "Оновлено дані заявки", `Менеджер: ${manager || "-"}, дохід: ${income}$`);

    await loadLeads();
  } catch (error) {
    console.error("SAVE LEAD ERROR:", error);
    alert("❌ Не вдалося зберегти заявку.");
  }
};

window.changeLeadStatus = async function(id, status) {
  try {
    await updateDoc(doc(db, "leads", id), {
      status,
      updatedAt: serverTimestamp()
    });

    await addHistory(id, "Змінено статус", getStatusShort(status));

    await loadLeads();
  } catch (error) {
    console.error("CHANGE STATUS ERROR:", error);
    alert("❌ Не вдалося змінити статус.");
  }
};

window.deleteLead = async function(id) {
  if (!confirm("Видалити заявку?")) return;

  try {
    await deleteDoc(doc(db, "leads", id));
    await loadLeads();
  } catch (error) {
    console.error("DELETE LEAD ERROR:", error);
    alert("❌ Не вдалося видалити заявку.");
  }
};

window.dragStartLead = function(event, id) {
  draggedLeadId = id;
  event.dataTransfer.setData("text/plain", id);
};

window.allowLeadDrop = function(event) {
  event.preventDefault();
};

window.dropLead = async function(event, status) {
  event.preventDefault();

  const id = draggedLeadId || event.dataTransfer.getData("text/plain");

  if (!id) return;

  await window.changeLeadStatus(id, status);

  draggedLeadId = null;
};

window.resetLeadFilters = function() {
  if (UI.search) UI.search.value = "";
  if (UI.statusFilter) UI.statusFilter.value = "all";
  if (UI.sortFilter) UI.sortFilter.value = "priority";

  applyFilters();
};

if (UI.search) UI.search.addEventListener("input", applyFilters);
if (UI.statusFilter) UI.statusFilter.addEventListener("change", applyFilters);
if (UI.sortFilter) UI.sortFilter.addEventListener("change", applyFilters);

loadLeads();
