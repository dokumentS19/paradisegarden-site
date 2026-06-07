import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "ТВОЙ_KEY",
  projectId: "paradisegarden-site",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const messagesDiv = document.getElementById("messages");

// ✅ слухаємо чат
const q = query(collection(db, "chat"), orderBy("createdAt"));

onSnapshot(q, snap => {
  messagesDiv.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();

    messagesDiv.innerHTML += `
      <p>${d.text}</p>
    `;
  });
});

// ✅ відправка
window.send = async () => {
  const text = document.getElementById("msg").value;

  await addDoc(collection(db, "chat"), {
    text,
    createdAt: new Date()
  });
};
