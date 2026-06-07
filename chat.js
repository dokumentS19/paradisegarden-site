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

let currentUser = null;

// ✅ запит дозволу на push
if ("Notification" in window) {
  Notification.requestPermission();
}

// ✅ функція нотифікації
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

// ✅ чат контейнер
const messagesDiv = document.getElementById("messages");

// ✅ real-time чат
const q = query(collection(db, "chat"), orderBy("createdAt"));

onSnapshot(q, snap => {

  messagesDiv.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();

    messagesDiv.innerHTML += `
      <div style="
        background:#1e293b;
        padding:8px;
        margin-bottom:6px;
        border-radius:6px;
      ">
        <strong>${d.userName || "Анонім"}:</strong>
        ${d.text}
      </div>
    `;

    // ✅ push повідомлення
    if (currentUser && d.userId !== currentUser.uid) {
      notify(d.text);
    }
  });

});

// ✅ відправка повідомлення
window.send = async () => {

  const input = document.getElementById("msg");
  const text = input.value;

  if (!text) return;

  await addDoc(collection(db, "chat"), {
    text: text,
    userId: currentUser?.uid || "guest",
    userName: currentUser?.displayName || "Гість",
    createdAt: new Date()
  });

  input.value = "";
};
