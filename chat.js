import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ CONFIG
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

// ✅ chatId з URL
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

// ✅ отримуємо юзера
onAuthStateChanged(auth, user => {
  currentUser = user;
});

// ✅ контейнер
const messagesDiv = document.getElementById("messages");

// ✅ запит
const q = query(
  collection(db, "messages"),
  where("chatId", "==", chatId),
  orderBy("createdAt")
);

// ✅ слухаємо повідомлення
onSnapshot(q, snap => {

  messagesDiv.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();

    const isMine = d.senderId === currentUser?.uid;

    messagesDiv.innerHTML += `
      <div class="msg ${isMine ? "mine" : "other"}">
        ${d.text}
      </div>
    `;

    // ✅ push (тільки якщо не твоє повідомлення)
    if (currentUser && d.senderId !== currentUser.uid) {
      notify(d.text);
    }
  });

  // ✅ автоскрол вниз
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// ✅ відправка повідомлення
window.send = async () => {

  const input = document.getElementById("msg");
  const text = input.value.trim();

  if (!text) return;

  // ✅ перевірка логіну
  if (!currentUser) {
    alert("Увійди!");
    return;
  }

  await addDoc(collection(db, "messages"), {
    text: text,
    chatId: chatId,
    senderId: currentUser.uid,
    createdAt: new Date()
  });

  input.value = "";
};
