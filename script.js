import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.firebasestorage.app",
  messagingSenderId: "452352075250",
  appId: "1:452352075250:web:049e1b3f10c44bc04c776b",
  measurementId: "G-6XHWE6Y0JE"
};
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadObjects() {
  const snap = await getDocs(collection(db, "objects"));

  const grid = document.getElementById("objectsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();

    const img = d.images?.[0] || "https://via.placeholder.com/400";

 const html = `
  <a href="assets/object.html?id=${doc.id}" class="card${d.title || "Без назви"}</h3>
    <p>${d.area || "-"} м²</p>
    <strong>${d.price || "-"} $</strong>

  </a>
`;


    grid.insertAdjacentHTML("beforeend", html);
  });
}

loadObjects();
