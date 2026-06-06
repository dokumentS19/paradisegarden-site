// ===== Firebase =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ===== CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.firebasestorage.app"
};

// ===== INIT =====
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ===== DOM =====
const addBtn = document.getElementById("addBtn");
const titleInput = document.getElementById("title");
const areaInput = document.getElementById("area");
const priceInput = document.getElementById("price");
const fileInput = document.getElementById("image");
const list = document.getElementById("adminList");
const preview = document.getElementById("preview");

// ===== PREVIEW IMAGE =====
fileInput?.addEventListener("change", () => {
  preview.innerHTML = "";

  for (const file of fileInput.files) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.width = "80px";
    img.style.borderRadius = "6px";
    img.style.marginRight = "5px";
    preview.appendChild(img);
  }
});

// ===== ADD OBJECT =====
async function addObject() {
  const title = titleInput.value.trim();
  const area = Number(areaInput.value);
  const price = Number(priceInput.value);
  const files = fileInput.files;

  if (!title || !price) {
    alert("❗ Заповни назву і ціну");
    return;
  }

  if (!files.length) {
    alert("❗ Додай фото");
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = "Завантаження...";

  try {
    const images = [];

    for (const file of files) {
      const name = Date.now() + "_" + file.name.replace(/\s/g, "_");
      const storageRef = ref(storage, "objects/" + name);

      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);

      images.push(url);
    }

    await addDoc(collection(db, "objects"), {
      title,
      area,
      price,
      images,
      createdAt: Date.now()
    });

    alert("✅ Додано");

    titleInput.value = "";
    areaInput.value = "";
    priceInput.value = "";
    fileInput.value = "";
    preview.innerHTML = "";

    loadObjects();

  } catch (err) {
    console.error(err);
    alert("❌ Помилка");
  }

  addBtn.disabled = false;
  addBtn.textContent = "Додати";
}

// ===== LOAD OBJECTS (CRM LIST) =====
async function loadObjects() {
  if (!list) return;

  list.innerHTML = "Завантаження...";

  try {
    const snap = await getDocs(collection(db, "objects"));

    list.innerHTML = "";

    snap.forEach(docSnap => {
      const d = docSnap.data();
      const id = docSnap.id;

      const div = document.createElement("div");
      div.style.marginBottom = "10px";

      div.innerHTML = `
        <strong>${d.title}</strong> — ${d.price}$ 
        <button data-id="${id}">❌</button>
      `;

      list.appendChild(div);
    });

  } catch {
    list.innerHTML = "❌ Помилка";
  }
}

// ===== DELETE =====
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;

  const id = btn.dataset.id;

  if (!confirm("Видалити об'єкт?")) return;

  try {
    await deleteDoc(doc(db, "objects", id));

    alert("✅ Видалено");
    loadObjects();

  } catch (err) {
    console.error(err);
    alert("❌ Помилка");
  }
});

// ===== EVENTS =====
addBtn?.addEventListener("click", addObject);

// ===== INIT =====
loadObjects();
