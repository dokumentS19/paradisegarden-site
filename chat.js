import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ CONFIG
const firebaseConfig = {
  apiKey: "ТВОЙ_API_KEY",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

// ✅ отримуємо chatId з URL
const chatId = new URLSearchParams(window.location.search).get("chatId");

let currentUser = null;

// ✅ push дозволи
if ("Notification" in window) {
  Notification.requestPermission();
}

// ✅ push функція
function notify(text) {
  if (Notification.permission === "granted") {
    new Notification("📩 Нове повідомлення", {
      body: text
    });
  }
}

// ✅ слідкуємо за юзером
onAuthStateChanged(auth, user => {
  currentUser = user;
});

// ✅ блок повідомлень
const messagesDiv = document.getElementById("messages");

// ✅ підписка на повідомлення (1‑на‑1)
const q = query(
  collection(db, "messages"),
  orderBy("createdAt")
);

// ✅ слухаємо чат
onSnapshot(q, snap => {

  messagesDiv.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();

    // ✅ показуємо тільки свій чат
    if (d.chatId !== chatId) return;

    const isMine = d.senderId === currentUser?.uid;

    messagesDiv.innerHTML += `
      <div style="
        background:${isMine ? "#16a34a" : "#1e293b"};
        padding:10px;
        margin:5px;
        border-radius:10px;
        text-align:${isMine ? "right" : "left"};
      ">
        ${d.text}
      </div>
    `;

    // ✅ пуш тільки від інших
    if (currentUser && d.senderId !== currentUser.uid) {
      notify(d.text);
    }
  });

});

// ✅ відправка
window.send = async () => {

  const input = document.getElementById("msg");
  const text = input.value;

  if (!text) return;

  await addDoc(collection(db, "messages"), {
    text: text,
    chatId: chatId, // ✅ ключове
    senderId: currentUser?.uid,
    createdAt: new Date()
  });

  input.value = "";

  // ✅ авто-скрол вниз
  setTimeout(() => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }, 100);
};
