import { db } from "./firebase.js";

import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.getElementById("add").onclick = async () => {

  const title = document.getElementById("title").value;
  const area = document.getElementById("area").value;
  const price = document.getElementById("price").value;

  await addDoc(collection(db, "objects"), {
    title,
    area,
    price
  });

  alert("✅ Додано");
};

