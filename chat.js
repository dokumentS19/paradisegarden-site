import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
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

/* ================================
   STATE
================================ */

const chatId = new URLSearchParams(window.location.search).get("chatId");

let currentUser = null;
let currentChat = null;
let unsubscribeMessages = null;
let firstLoad = true;

/* ================================
   DOM
================================ */

const messagesDiv = document.getElementById("messages");
const chatInfo = document.getElementById("chatInfo");
const chatStatus = document.getElementById("chatStatus");
const loginWarning = document.getElementById("loginWarning");
const input = document.getElementById("msg");

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

function formatTime(value) {
  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return new Date().toLocaleString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function setStatus(text) {
  if (chatStatus) {
    chatStatus.textContent = text;
  }
}

function scrollToBottom() {
  if (!messagesDiv) return;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showLoginWarning(show) {
  if (!loginWarning) return;
  loginWarning.classList.toggle("active", Boolean(show));
}

/* ================================
   NOTIFICATIONS
================================ */

if ("Notification" in window) {
  Notification.requestPermission().catch(() => {});
}

function notify(text) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification("📩 Нове повідомлення — Райський Сад", {
    body: text
  });
}

/* ================================
   AUTH
================================ */

onAuthStateChanged(auth, user => {
  currentUser = user;

  if (user) {
    showLoginWarning(false);
    setStatus("Онлайн");
  } else {
    showLoginWarning(true);
    setStatus("Потрібен вхід");
  }

  loadChat();
});

/* ================================
   LOAD CHAT
================================ */

async function loadChat() {
  if (!messagesDiv) return;

  if (!chatId) {
    messagesDiv.innerHTML = `
      <div class="chat-empty">
        <h2>❌ Чат не знайдено</h2>
        <p>Не передано chatId в адресі сторінки.</p>
        <a class="btn" href="index.html">На головну</a>
      </div>
    `;

    if (chatInfo) {
      chatInfo.textContent = "Помилка: chatId відсутній";
    }

    setStatus("Помилка");
    return;
  }

  try {
    const chatSnap = await getDoc(doc(db, "chats", chatId));

    if (!chatSnap.exists()) {
      messagesDiv.innerHTML = `
        <div class="chat-empty">
          <h2>❌ Чат не існує</h2>
          <p>Можливо, діалог був видалений або створений неправильно.</p>
          <a class="btn" href="index.html">На головну</a>
        </div>
      `;

      if (chatInfo) {
        chatInfo.textContent = "Чат не знайдено";
      }

      setStatus("Не знайдено");
      return;
    }

    currentChat = {
      id: chatSnap.id,
      ...chatSnap.data()
    };

    if (chatInfo) {
      const objectTitle = currentChat.objectTitle || "Обʼєкт нерухомості";
      chatInfo.textContent = `Діалог щодо: ${objectTitle}`;
    }

    if (
      currentUser &&
      Array.isArray(currentChat.users) &&
      !currentChat.users.includes(currentUser.uid)
    ) {
      messagesDiv.innerHTML = `
        <div class="chat-empty">
          <h2>⛔ Немає доступу</h2>
          <p>Ви не є учасником цього діалогу.</p>
          <a class="btn" href="index.html">На головну</a>
        </div>
      `;

      setStatus("Немає доступу");
      return;
    }

    listenMessages();
  } catch (error) {
    console.error("LOAD CHAT ERROR:", error);

    messagesDiv.innerHTML = `
      <div class="chat-empty">
        <h2>❌ Помилка завантаження</h2>
        <p>Перевірте Firebase правила або підключення до інтернету.</p>
      </div>
    `;

    setStatus("Помилка");
  }
}

/* ================================
   LISTEN MESSAGES
================================ */

function listenMessages() {
  if (!chatId || !messagesDiv) return;

  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }

  const messagesQuery = query(
    collection(db, "messages"),
    where("chatId", "==", chatId),
    orderBy("createdAt", "asc")
  );

  unsubscribeMessages = onSnapshot(
    messagesQuery,
    snap => {
      if (snap.empty) {
        messagesDiv.innerHTML = `
          <div class="chat-empty">
            <h2>Повідомлень поки немає</h2>
            <p>Напишіть перше повідомлення продавцю або клієнту.</p>
          </div>
        `;

        firstLoad = false;
        return;
      }

      const messages = [];

      snap.forEach(docSnap => {
        messages.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      renderMessages(messages);

      const lastMessage = messages[messages.length - 1];

      if (
        !firstLoad &&
        currentUser &&
        lastMessage &&
        lastMessage.senderId !== currentUser.uid
      ) {
        notify(lastMessage.text || "Нове повідомлення");
      }

      firstLoad = false;
      scrollToBottom();
    },
    error => {
      console.error("MESSAGES SNAPSHOT ERROR:", error);

      messagesDiv.innerHTML = `
        <div class="chat-empty">
          <h2>❌ Помилка повідомлень</h2>
          <p>Для чату потрібен індекс Firestore: chatId + createdAt.</p>
        </div>
      `;
    }
  );
}

/* ================================
   RENDER MESSAGES
================================ */

function renderMessages(messages) {
  if (!messagesDiv) return;

  messagesDiv.innerHTML = messages.map(message => {
    const isMine = currentUser && message.senderId === currentUser.uid;

    const text = escapeHtml(message.text || "");
    const time = formatTime(message.createdAt);
    const senderName = escapeHtml(message.senderName || "Користувач");

    return `
      <div class="msg ${isMine ? "mine" : "other"}">
        <div class="msg-text">${text}</div>
        <div class="msg-meta">
          ${isMine ? "Ви" : senderName} · ${time}
        </div>
      </div>
    `;
  }).join("");
}

/* ================================
   SEND MESSAGE
================================ */

window.sendMessage = async function(event) {
  if (event) event.preventDefault();

  if (!input) return;

  const text = input.value.trim();

  if (!text) return;

  if (!currentUser) {
    showLoginWarning(true);
    alert("Щоб писати в чат, увійдіть через Google у кабінеті.");
    return;
  }

  if (!chatId || !currentChat) {
    alert("Чат не завантажено.");
    return;
  }

  if (
    Array.isArray(currentChat.users) &&
    !currentChat.users.includes(currentUser.uid)
  ) {
    alert("Ви не є учасником цього чату.");
    return;
  }

  try {
    await addDoc(collection(db, "messages"), {
      chatId,
      text,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email || "Користувач",
      senderEmail: currentUser.email || "",
      createdAt: serverTimestamp(),
      read: false
    });

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    input.value = "";
    input.focus();
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    alert("❌ Не вдалося відправити повідомлення.");
  }
};
