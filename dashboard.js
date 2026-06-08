import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ✅ CONFIG
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();


// ✅ LOGIN
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");

  if (btn) {
    btn.onclick = () => {
      signInWithRedirect(auth, provider);
    };
  }
});
``


getRedirectResult(auth)
  .then((result) => {
    if (result) {
      console.log("✅ Успішний логін після redirect");

      const user = result.user;

      if (user) {
        console.log("UID:", user.uid);
      }
    }
  })
  .catch((error) => {
    console.error("❌ Помилка логіну:", error);
  });

    // ✅ профіль
    if (info) {
      info.innerHTML = `
        <p>👤 ${user.displayName || "Користувач"}</p>
        <button onclick="logout()">Вийти</button>
      `;
    }

    loadMyAds(user.uid);

  } else {
    if (info) {
      info.innerHTML = `<p>❌ Не авторизований</p>`;
    }

    document.getElementById("myAds").innerHTML = "";
  }
});


// ✅ ДОДАТИ ОГОЛОШЕННЯ
window.addObject = async () => {

  const user = auth.currentUser;

  if (!user) {
    alert("Увійди!");
    return;
  }

  const title = document.getElementById("title").value.trim();
  const price = document.getElementById("price").value;
  const area = document.getElementById("area").value;

  if (!title || !price) {
    alert("Заповни назву і ціну");
    return;
  }
await addDoc(collection(db, "objects"), {
  title,
  price: Number(price),
  area: area || "-",
  ownerId: user.uid,
  createdAt: new Date(),

  // ✅ ДОДАЙ ЦЕ
  lat: 50.5215,
  lng: 30.2506,

  images: ["https://via.placeholder.com/300"]
});

  alert("✅ Додано");

  // ✅ очищаємо поля
  document.getElementById("title").value = "";
  document.getElementById("price").value = "";
  document.getElementById("area").value = "";

  loadMyAds(user.uid);
};


// ✅ МОЇ ОГОЛОШЕННЯ
async function loadMyAds(uid) {

  const q = query(
    collection(db, "objects"),
    where("ownerId", "==", uid)
  );

  const snap = await getDocs(q);

  const el = document.getElementById("myAds");
  el.innerHTML = "";

  if (snap.empty) {
    el.innerHTML = "<p>Немає оголошень</p>";
    return;
  }

  snap.forEach(docu => {
    const d = docu.data();

    el.innerHTML += `
      <div style="
        background:#1e293b;
        padding:10px;
        margin-bottom:10px;
        border-radius:8px;
      ">
        <strong>${d.title}</strong><br>
        💰 ${d.price} $<br>
        📐 ${d.area}

        <br><br>

        <button onclick="deleteAd('${docu.id}')" style="background:red;">
          ❌ Видалити
        </button>
      </div>
    `;
  });
}


// ✅ ВИДАЛЕННЯ
window.deleteAd = async (id) => {

  if (!confirm("Видалити?")) return;

  await deleteDoc(doc(db, "objects", id));

  loadMyAds(auth.currentUser.uid);
};


// ✅ LOGOUT
window.logout = () => {
  signOut(auth);
};
