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
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ CONFIG (встав свій ключ)
const firebaseConfig = {
  apiKey: "ТВОЙ_API_KEY",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();


// ✅ LOGIN (БЕЗ ПОМИЛОК)
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");

  if (btn) {
    btn.onclick = () => {
      signInWithPopup(auth, provider);
    };
  }
});


// ✅ СТЕЖЕННЯ ЗА ЮЗЕРОМ
onAuthStateChanged(auth, user => {

  const info = document.getElementById("userInfo");

  if (user) {
    console.log("✅ Увійшов:", user.uid);

    // ✅ показ профілю
    if (info) {
      info.innerHTML = `
        <p>👤 ${user.displayName}</p>
        <button onclick="logout()">Вийти</button>
      `;
    }

    loadMyAds(user.uid);

  } else {
    if (info) {
      info.innerHTML = `<p>❌ Не авторизований</p>`;
    }
  }
});


// ✅ ДОДАТИ ОГОЛОШЕННЯ
window.addObject = async () => {

  const user = auth.currentUser;

  if (!user) {
    alert("Увійди!");
    return;
  }

  const title = document.getElementById("title").value;
  const price = document.getElementById("price").value;
  const area = document.getElementById("area").value;

  await addDoc(collection(db, "objects"), {
    title,
    price,
    area,
    ownerId: user.uid,
    createdAt: new Date()
  });

  alert("✅ Додано");

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

  snap.forEach(docu => {
    const d = docu.data();

    el.innerHTML += `
      <div style="margin-bottom:10px;">
        <strong>${d.title}</strong> - ${d.price} $
        <button onclick="deleteAd('${docu.id}')">❌</button>
      </div>
    `;
  });
}


// ✅ ВИДАЛЕННЯ
window.deleteAd = async (id) => {
  await deleteDoc(doc(db, "objects", id));
  loadMyAds(auth.currentUser.uid);
};


// ✅ LOGOUT
window.logout = () => {
  signOut(auth);
};
