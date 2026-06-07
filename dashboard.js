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
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ CONFIG
const firebaseConfig = {
  apiKey: "ТВІЙ_KEY",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ LOGIN
document.getElementById("loginBtn").onclick = () => {
  signInWithPopup(auth, provider);
};

// ✅ СЛУХАЄМО ЮЗЕРА
onAuthStateChanged(auth, user => {
  if (user) {
    loadMyAds(user.uid);
  }
});

// ✅ ДОДАВАННЯ
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
      <div>
        ${d.title} - ${d.price} $
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
``
