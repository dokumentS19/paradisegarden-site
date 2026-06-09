import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

/* ================================
   FIREBASE CONFIG
================================ */

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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* ================================
   STATE
================================ */

let currentUser = null;
let dialogs = [];
let unsubscribeDialogs = null;

/* ================================
   DOM
================================ */

const loginBtn = document.getElementById("loginBtn");
const userInfo = document.getElementById("userInfo");
const userAvatar = document.getElementById("userAvatar");
const dialogsList = document.getElementById("dialogsList");
const dialogSearch = document.getElementById("dialogSearch");

/* ================================
   AUTH
================================ */

await setPersistence(auth, browserLocalPersistence);

getRedirectResult(auth).catch(error => {
  console.error("AUTH REDIRECT ERROR:", error);
});

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    if (auth.currentUser) {
      signOut(auth);
    } else {
      signInWithRedirect(auth, provider);
    }
  });
}

onAuthStateChanged(auth, user => {
  currentUser = user;

  if (user) {
    renderUser(user);
    listenDialogs(user.uid);
  } else {
    renderGuest();
  }
});

/* ================================
   HELPERS
================================ */

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return "-";
}

function getTimeValue(value) {
  if (value?.seconds) {
    return value.seconds * 1000;
  }

  return 0;
}

function getInitials(user) {
  const source = user.displayName || user.email || "?";

  return source
    .trim()
    .slice(0, 2)
    .toUpperCase();
}

function getDialogDate(dialog) {
  return dialog.lastMessageAt || dialog.updatedAt || dialog.createdAt || null;
}

/* ================================
   USER RENDER
================================ */

function renderUser(user) {
  if (loginBtn) {
    loginBtn.textContent = "Вийти";
  }

  if (userInfo) {
    userInfo.innerHTML = `
      <strong>${escapeHtml(user.displayName || "Користувач")}</strong>
      <span>${escapeHtml(user.email || "")}</span>
    `;
  }

  if (userAvatar) {
    if (user.photoURL) {
      userAvatar.innerHTML = `<img src="${escapeHtml(user.photoURL)}" alt="avatar">`;
    } else {
      userAvatar.textContent = getInitials(user);
    }
  }
}

function renderGuest() {
  currentUser = null;
  dialogs = [];

  if (unsubscribeDialogs) {
    unsubscribeDialogs();
    unsubscribeDialogs = null;
  }

  if (loginBtn) {
    loginBtn.textContent = "Увійти через Google";
  }

  if (userInfo) {
    userInfo.innerHTML = `
      <strong>Не авторизований</strong>
      <span>Увійдіть через Google, щоб побачити діалоги</span>
    `;
  }

  if (userAvatar) {
    userAvatar.textContent = "?";
  }

  if (dialogsList) {
    dialogsList.innerHTML = `
      <div class="empty-dialogs">
        <h2>Потрібна авторизація</h2>
        <p>Увійдіть через Google, щоб переглядати свої діалоги.</p>
        <div class="dialogs-actions">
          <button class="btn" type="button" onclick="document.getElementById('loginBtn').click()">Увійти</button>
          <a class="cta-outline" href="index.html">На головну</a>
        </div>
      </div>
    `;
  }
}

/* ================================
   LOAD / LISTEN DIALOGS
================================ */

function listenDialogs(uid) {
  if (!dialogsList) return;

  if (unsubscribeDialogs) {
    unsubscribeDialogs();
    unsubscribeDialogs = null;
  }

  dialogsList.innerHTML = `
    <div class="empty-dialogs">
      <h2>Завантаження діалогів...</h2>
      <p>Отримуємо Ваші чати з Firebase.</p>
    </div>
  `;

  const q = query(
    collection(db, "chats"),
    where("users", "array-contains", uid)
  );

  unsubscribeDialogs = onSnapshot(
    q,
    snap => {
      dialogs = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      sortDialogs();
      renderDialogs();
    },
    error => {
      console.error("DIALOGS SNAPSHOT ERROR:", error);

      dialogsList.innerHTML = `
        <div class="empty-dialogs">
          <h2>❌ Помилка завантаження</h2>
          <p>Не вдалося отримати список діалогів. Перевірте правила Firestore.</p>
        </div>
      `;
    }
  );
}

function sortDialogs() {
  dialogs.sort((a, b) => {
    const aTime = getTimeValue(getDialogDate(a));
    const bTime = getTimeValue(getDialogDate(b));

    return bTime - aTime;
  });
}

/* ================================
   RENDER DIALOGS
================================ */

function renderDialogs() {
  if (!dialogsList) return;

  const search = dialogSearch ? dialogSearch.value.trim().toLowerCase() : "";

  let data = [...dialogs];

  if (search) {
    data = data.filter(dialog => {
      const objectTitle = String(dialog.objectTitle || "").toLowerCase();
      const lastMessage = String(dialog.lastMessage || "").toLowerCase();
      const objectId = String(dialog.objectId || "").toLowerCase();

      return (
        objectTitle.includes(search) ||
        lastMessage.includes(search) ||
        objectId.includes(search)
      );
    });
  }

  if (!data.length) {
    dialogsList.innerHTML = `
      <div class="empty-dialogs">
        <h2>Діалогів поки немає</h2>
        <p>
          Діалог зʼявиться після натискання кнопки «Чат з продавцем»
          на сторінці обʼєкта.
        </p>

        <div class="dialogs-actions">
          <a class="btn" href="index.html#objects">Перейти до обʼєктів</a>
          <a class="cta-outline" href="dashboard.html">Кабінет</a>
        </div>
      </div>
    `;
    return;
  }

  dialogsList.innerHTML = data.map(dialog => {
    const id = escapeHtml(dialog.id);
    const objectTitle = escapeHtml(dialog.objectTitle || "Обʼєкт нерухомості");
    const objectId = escapeHtml(dialog.objectId || "");
    const lastMessage = escapeHtml(dialog.lastMessage || "Повідомлень поки немає");
    const date = formatDate(getDialogDate(dialog));
    const usersCount = Array.isArray(dialog.users) ? dialog.users.length : 0;

    return `
      <a class="dialog-card" href="chat.html?chatId=${id}">
        <div class="dialog-icon">💬</div>

        <div class="dialog-main">
          <h3>${objectTitle}</h3>

          <p>
            Учасників: ${usersCount}
            ${objectId ? ` · ID обʼєкта: ${objectId}` : ""}
          </p>

          <div class="dialog-last">
            ${lastMessage}
          </div>
        </div>

        <div class="dialog-side">
          <span class="dialog-badge">Відкрити чат</span>
          <span class="dialog-date">${date}</span>
        </div>
      </a>
    `;
  }).join("");
}

/* ================================
   ACTIONS
================================ */

window.reloadDialogs = function() {
  if (!currentUser) {
    alert("Спочатку увійдіть через Google.");
    return;
  }

  renderDialogs();
};

if (dialogSearch) {
  dialogSearch.addEventListener("input", () => {
    renderDialogs();
  });
}
