import { getStorage, ref, uploadBytes, getDownloadURL }
з «https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js»;

import { initializeApp } з "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } з "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: «райський сад-майданчик»,
  storageBucket: "paradisegarden-site.firebasestorage.app",
  messageagingSenderId: "452352075250",
  appId: "1:452352075250:web:049e1b3f10c44bc04c776b",
  Ідентифікатор вимірювання: "G-6XHWE6Y0JE"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app));
// ✅ ГОЛОВНА ФУНКЦІЯ
Вікно.addObject = асинхронний () => {
  Const title = документ.getElementById("title").Цінність;
  const area = Number(document.getElementById("area").Цінність);
   const ціна = Номер(документ.getElementById("price").Цінність);
  const files = документ.getElementById("image").Файли;

  Const Images = [];

  for (let file of files) {
  const storageRef = ref(storage, "images/" + Date.now() + "_" + файл.Ім'я);

  waitit uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);

  зображення.push(url);
 }

  waitit addDoc(collection(db, "objects")), {
 Заголовок,
 площа,
 Ціна,
 Зображення
  });

  alert(" ✅ Додано!");

  // очистка ✅
  Документ.getElementById("title").Цінність = "";
  Документ.getElementById("area").Цінність = "";
  Документ.getElementById("price").Цінність = "";
  Документ.getElementById("image").Цінність = "";
};

// ✅ кнопка
Документ.getElementById("addBtn").onclick = вікно.addObject;
