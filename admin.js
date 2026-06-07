import { getStorage, ref, uploadBytes, getDownloadURL }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore, collection, addDoc } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
 storageBucket: "paradisegarden-site.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

document.getElementById("addBtn").onclick = async () => {

  console.log("CLICK ✅");

  const title = document.getElementById("title").value;
  const area = Number(document.getElementById("area").value);
  const price = Number(document.getElementById("price").value);
  const files = document.getElementById("image").files;

  const images = [];

  try {
    for (let file of files) {
      const storageRef = ref(storage, "images/" + Date.now() + "_" + file.name);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      images.push(url);
    }

    await addDoc(collection(db, "objects"), {
      title,
      area,
      price,
      images
    });

    alert("✅ Додано!");

  } catch (e) {
    console.error(e);
    alert("❌ Помилка");
  }
};

  }

  btn.disabled = false;
};
