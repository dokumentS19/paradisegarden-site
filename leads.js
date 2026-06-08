import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
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

// 🆕 CRM BOARD
const STATUSES = ["new", "in_progress", "done"];

/* ===================================
   ✅ ✅ ✅ HISTORY (ДОДАНО)
=================================== */
async function addHistory(id, action, comment = "") {

  const time = new Date().toLocaleString();

  await updateDoc(doc(db, "leads", id), {
   history: arrayUnion({
  action,
  comment,
  time
})
  });
}

/* ===================================
   ✅ ✅ ✅ НАЗВИ СТАДІЙ
=================================== */
function getStatusName(status) {
  if (status === "new") return "🟡 Новий";
  if (status === "in_progress") return "🟠 В роботі";
  if (status === "done") return "✅ Закритий";
  return status;
}

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
        <div class="card"
             draggable="true"
             ondragstart="dragStart(event, '${d.id}')">

          <h3>👤 ${d.name}</h3>
          <p>📞 ${d.phone}</p>

          <p><strong>${badge}</strong></p>

          <textarea id="note-${d.id}" placeholder="Коментар...">
${d.note || ""}
          </textarea>

          <button onclick="saveNote('${d.id}')">💾 Зберегти</button>

          <p>${getStatusName(d.status)}</p>

          <input placeholder="Менеджер"
                 value="${d.manager || ""}"
                 onchange="assignManager('${d.id}', this.value)">

          <input type="datetime-local"
                 onchange="setReminder('${d.id}', this.value)">

          <button onclick="markDone('${d.id}')">✅</button>
          <button onclick="removeLead('${d.id}')">❌</button>

          <!-- ✅ HISTORY VIEW -->
          <div style="margin-top:10px; font-size:12px;">
            ${(d.history || []).map(h => `
              <div>📌 ${h.action} (${h.time}) ${h.comment}</div>
            `).join("")}
          </div>

        </div>
      `;
    });

  renderBoard(data);
}

/* ===================================
   ✅ DRAG DROP CRM
=================================== */
window.dragStart = (e, id) => {
  e.dataTransfer.setData("id", id);
};

window.allowDrop = (e) => e.preventDefault();

window.dropLead = async (e, status) => {
  e.preventDefault();

  const id = e.dataTransfer.getData("id");

  await updateDoc(doc(db, "leads", id), {
    status
  });

  await addHistory(id, "Зміна статусу", status);

  loadLeads();
};

/* ===================================
   ✅ CRM BOARD
=================================== */
function renderBoard(data) {

  const board = document.getElementById("crmBoard");
  if (!board) return;

  board.innerHTML = STATUSES.map(status => {

    let color = "#334155";
    if (status === "new") color = "#facc15";
    if (status === "in_progress") color = "#fb923c";
    if (status === "done") color = "#22c55e";

    return `
      <div class="column"
        style="background:${color}; padding:10px; border-radius:10px;"
        ondrop="dropLead(event,'${status}')"
        ondragover="allowDrop(event)">

        <h3>${getStatusName(status)}</h3>

        ${data.filter(l => l.status === status)
          .map(l => `<div class="mini">${l.name}</div>`)
          .join("")}

      </div>
    `;
    
  }).join("");
}

/* ===================================
   ✅ МЕНЕДЖЕР
=================================== */
window.assignManager = async (id, name) => {
  await updateDoc(doc(db, "leads", id), {
    manager: name
  });

  await addHistory(id, "Менеджер", name);
};

/* ===================================
   ✅ НАГАДУВАННЯ
=================================== */
window.setReminder = async (id, date) => {
  await updateDoc(doc(db, "leads", id), {
    reminder: new Date(date)
  });

  await addHistory(id, "Нагадування", date);
};

/* ===================================
   ✅ STATUS
=================================== */
window.markDone = async (id) => {

  await updateDoc(doc(db, "leads", id), {
    status: "done"
  });

  await addHistory(id, "Закрито");

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
   ✅ SAVE NOTE
=================================== */
window.saveNote = async (id) => {

  const text = document.getElementById("note-" + id).value;

  await updateDoc(doc(db, "leads", id), {
    note: text
  });

  await addHistory(id, "Коментар", text);

  alert("✅ Збережено");
};

/* ===================================
   ✅ АНАЛІТИКА + KPI
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
    <p>Оброблені: ${done}</p>
    <p>📈 Конверсія: ${conversion}%</p>
    <p>💰 Потенційний дохід: ${income}$</p>
    <p>🔥 Гарячі клієнти: ${hot}</p>
  `;

  document.getElementById("kpi-total").innerText = total;
  document.getElementById("kpi-done").innerText = done;
  document.getElementById("kpi-income").innerText = income + "$";
}

/* ===================================
   ✅ ГРАФІК
=================================== */
function drawChart(data) {

  const done = data.filter(l => l.status === "done").length;
  const newLeads = data.length - done;

  const canvas = document.getElementById("leadsChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "#22c55e");
  gradient.addColorStop(1, "#4ade80");

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Нові", "Оброблені"],
      datasets: [{
        data: [newLeads, done],
        backgroundColor: ["#facc15", gradient]
      }]
    }
  });
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
   ✅ THEME
=================================== */
window.toggleTheme = function () {

  const current = document.body.classList.contains("light");

  if (current) {
    document.body.classList.remove("light");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.add("light");
    localStorage.setItem("theme", "light");
  }
};

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
}

/* ===================================
   ✅ START
=================================== */
loadLeads();
