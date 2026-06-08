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
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBq_bUWieO6UI7REfU1iNrk2RK2EjQGnts",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.firebasestorage.app",
  messagingSenderId: "452352075250",
  appId: "1:452352075250:web:049e1b3f10c44bc04c776b"
};

// ✅ INIT
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ СТАБІЛЬНИЙ ЛОГІН (НЕ ВИКИДАЄ)
async function initAuth() {
  await setPersistence(auth, browserLocalPersistence);
}
initAuth();

// ✅ LOGIN BUTTON
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");

  if (btn) {
    btn.onclick = () => {
      if (auth.currentUser) {
        signOut(auth);
      } else {
        signInWithRedirect(auth, provider);
      }
    };
  }
});

// ✅ REDIRECT (після Google)
getRedirectResult(auth).catch(console.error);

// ✅ AUTH STATE
onAuthStateChanged(auth, (user) => {
  const info = document.getElementById("userInfo");

  if (user) {
    if (info) {
      info.innerHTML = `
        <p>👤 ${user.displayName || "Користувач"}</p>
      `;
    }

    loadMyAds(user.uid);

  } else {
    if (info) info.innerHTML = "❌ Не авторизований";
    
    const ads = document.getElementById("myAds");
    if (ads) ads.innerHTML = "";
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

    lat: 50.5215,
    lng: 30.2506,

    ownerId: user.uid,
    ownerName: user.displayName || "Користувач",

    createdAt: new Date(),
    images: ["https://via.placeholder.com/300"],

    status: "active",
    views: 0,
    rating: 0,
    ratingCount: 0,
    vip: false
  });

  alert("✅ Додано!");

  // ✅ очистка
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

  if (!el) return;

  el.innerHTML = "";

  if (snap.empty) {
    el.innerHTML = "<p>Немає оголошень</p>";
    return;
  }

  snap.forEach(docSnap => {
    const d = docSnap.data();

    el.innerHTML += `
      <div style="background:#1e293b;padding:10px;margin-bottom:10px;border-radius:8px;">
        <strong>${d.title}</strong><br>
        💰 ${d.price} $<br>
        📐 ${d.area}<br><br>
        <button onclick="deleteAd('${docSnap.id}')" style="background:red;">
          ❌ Видалити
        </button>
      </div>
    `;
  });
}

// ✅ DELETE
window.deleteAd = async (id) => {
  if (!confirm("Видалити?")) return;

  await deleteDoc(doc(db, "objects", id));

  if (auth.currentUser) {
    loadMyAds(auth.currentUser.uid);
  }
};
``
