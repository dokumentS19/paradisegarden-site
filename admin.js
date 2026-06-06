import { db, storage } from "./firebase.js";

import {
  collection, addDoc, getDocs, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const title = document.getElementById("title");
const area = document.getElementById("area");
const price = document.getElementById("price");
const image = document.getElementById("image");
const list = document.getElementById("adminList");

// ADD OBJECT
document.getElementById("addBtn").onclick = async () => {

  const files = image.files;
  const urls = [];

  for (const file of files) {
    const storageRef = ref(storage, "objects/" + file.name);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    urls.push(url);
  }

  await addDoc(collection(db, "objects"), {
    title: title.value,
    area: +area.value,
    price: +price.value,
    images: urls,
    createdAt: Date.now()
  });

  alert("✅ Додано");

  load();
};

// LOAD
async function load() {
  const snap = await getDocs(collection(db, "objects"));
  list.innerHTML = "";

  snap.forEach(d => {
    const data = d.data();

    const div = document.createElement("div");

    div.innerHTML = `
      <b>${data.title}</b> — ${data.price}$
      <button data-id="${d.id}">❌</button>
    `;

    list.appendChild(div);
  });
}

load();

// DELETE
document.addEventListener("click", async e => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;

  await deleteDoc(doc(db, "objects", btn.dataset.id));
  load();
});
