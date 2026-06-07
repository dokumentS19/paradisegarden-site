import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.appspot.com"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

document.getElementById("addBtn").onclick = async () => {
  const btn = document.getElementById("addBtn");
  btn.disabled = true;

  const title = document.getElementById("title").value.trim();
  const area = Number(document.getElementById("area").value);
  const price = Number(document.getElementById("price").value);
  const files = document.getElementById("image").files;

  if (!title || isNaN(area) || isNaN(price)) {
    alert("Заповніть всі поля!");
    btn.disabled = false;
    return;
  }

  if (!files.length) {
    alert("Додайте хоча б 1 фото");
    btn.disabled = false;
    return;
  }

  const images = [];

  try {
    for (let file of files) {
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
        alert("Помилка з файлом");
        btn.disabled = false;
        return;
      }
    }

    for (let file of files) {
      const cleanName = file.name.replace(/\s+/g, "_");
      const uniqueName = Date.now() + "_" + cleanName;

      const folder = new Date().toISOString().slice(0,10);
      const storageRef = ref(storage, `images/${folder}/${uniqueName}`);

      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      images.push(url);
    }

    await addDoc(collection(db, "objects"), {
      title,
      area,
      price,
      images,
      createdAt: Date.now()
    });

    alert("✅ Додано!");

  } catch (e) {
    console.error(e);
    alert("❌ Помилка");
  }

  btn.disabled = false;
};
