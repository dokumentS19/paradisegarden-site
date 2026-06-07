import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "ТВОЙ_KEY",
  projectId: "paradisegarden-site",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.addObject = async () => {
  const title = document.getElementById("title").value;
  const price = document.getElementById("price").value;

  await addDoc(collection(db, "objects"), {
    title,
    price: Number(price),
    createdAt: new Date()
  });

  alert("✅ Додано");
};
