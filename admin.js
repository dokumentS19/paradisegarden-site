import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
 https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";  serverTimestamp

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

/* ================================
   FIREBASE CONFIG
================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBq_bUWieO6UI7REfU1iNrk2RK2EjQGnts",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
  storageBucket: "paradisegarden-site.firebasestorage.app",
  messagingSenderId: "452352075250",
  appId: "1:452352075250:web:049e1b3f10c44bc04c776b",
  measurementId: "G-6XHWE6Y0JE"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* ================================
   ACCESS
================================ */

const allowedEmails = [
  "olegivanchik1234@gmail.com",
  "rad202331@gmail.com"
];

function isAllowedAdmin(user) {
  return Boolean(user && allowedEmails.includes(user.email));
}

/* ================================
   STATE
================================ */

let currentUser = null;
let selectedFiles = [];

/* ================================
   DOM
================================ */

const fileInput = document.getElementById("file");
const preview = document.getElementById("preview");
const loginBtn = document.getElementById("loginBtn");
const userInfo = document.getElementById("userInfo");
const progressBox = document.getElementById("progressBox");

/* ================================
   AUTH
================================ */

await setPersistence(auth, browserLocalPersistence);

getRedirectResult(auth).catch(error => {
  console.error("REDIRECT AUTH ERROR:", error);
});

onAuthStateChanged(auth, user => {
  if (isAllowedAdmin(user)) {
    currentUser = user;

    if (userInfo) {
      userInfo.innerHTML = `👤 ${escapeHtml(user.displayName || user.email || "Користувач")}`;
    }

    if (loginBtn) {
      loginBtn.textContent = "Вийти";
    }

    return;
  }

  currentUser = null;

  if (user && !isAllowedAdmin(user)) {
    if (userInfo) {
      userInfo.innerHTML = `⛔ Немає доступу для ${escapeHtml(user.email || "цього акаунта")}`;
    }

    if (loginBtn) {
      loginBtn.textContent = "Вийти";
    }

    return;
  }

  if (userInfo) {
    userInfo.innerHTML = "❌ Не авторизований";
  }

  if (loginBtn) {
    loginBtn.textContent = "Увійти через Google";
  }
});

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    if (auth.currentUser) {
      signOut(auth);
    } else {
      signInWithRedirect(auth, provider);
    }
  });
}

/* ================================
   HELPERS
================================ */

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showProgress(show) {
  if (!progressBox) return;

  progressBox.classList.toggle("active", Boolean(show));
}

function validateFiles(files) {
  if (!files.length) {
    alert("Додайте хоча б одне фото.");
    return false;
  }

  if (files.length > 10) {
    alert("Можна додати максимум 10 фото.");
    return false;
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      alert(`Файл "${file.name}" не є зображенням.`);
      return false;
    }

    if (file.size > 1024 * 1024) {
      alert(`Фото "${file.name}" більше 1 МБ. Зменшіть розмір фото.`);
      return false;
    }
  }

  return true;
}

function renderPreview(files) {
  if (!preview) return;

  preview.innerHTML = "";

  files.forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = event => {
      const item = document.createElement("div");
      item.className = "preview-item";

      item.innerHTML = `
        <img src="${event.target.result}" alt="Фото ${index + 1}">
        <span>${index + 1}</span>
      `;

      preview.appendChild(item);
    };

    reader.readAsDataURL(file);
  });
}

/* ================================
   COMMERCIAL TYPE
================================ */

window.toggleCommercialType = function() {
  const propertyType = document.getElementById("propertyType");
  const commercialTypeBox = document.getElementById("commercialTypeBox");
  const commercialType = document.getElementById("commercialType");

  if (!propertyType || !commercialTypeBox) return;

  if (propertyType.value === "commercial") {
    commercialTypeBox.style.display = "block";
  } else {
    commercialTypeBox.style.display = "none";

    if (commercialType) {
      commercialType.value = "";
    }
  }
};

/* ================================
   FILE INPUT
================================ */

if (fileInput) {
  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files || []);

    if (!validateFiles(files)) {
      fileInput.value = "";
      selectedFiles = [];

      if (preview) {
        preview.innerHTML = "";
      }

      return;
    }

    selectedFiles = files;
    renderPreview(selectedFiles);
  });
}

/* ================================
   ADD OBJECT
================================ */

window.addObject = async function(event) {
  if (event) event.preventDefault();

  if (!currentUser) {
    alert("Спочатку увійдіть через Google акаунтом адміністратора.");
    return;
  }

  const title = document.getElementById("title")?.value.trim();
  const area = document.getElementById("area")?.value.trim();
  const price = Number(document.getElementById("price")?.value);
  const address = document.getElementById("address")?.value.trim();
  const description = document.getElementById("description")?.value.trim();

  const dealType = document.getElementById("dealType")?.value || "sale";
  const propertyType = document.getElementById("propertyType")?.value || "apartment";

  const commercialType = propertyType === "commercial"
    ? document.getElementById("commercialType")?.value || ""
    : "";

  const latRaw = document.getElementById("lat")?.value;
  const lngRaw = document.getElementById("lng")?.value;

  const vip = document.getElementById("vip")?.checked || false;
  const sold = document.getElementById("sold")?.checked || false;

  const lat = latRaw ? Number(latRaw) : 50.5215;
  const lng = lngRaw ? Number(lngRaw) : 30.2506;

  if (!title) {
    alert("Вкажіть назву обʼєкта.");
    return;
  }

  if (!price || price <= 0) {
    alert("Вкажіть коректну ціну.");
    return;
  }

  if (!dealType) {
    alert("Виберіть тип угоди.");
    return;
  }

  if (!propertyType) {
    alert("Виберіть тип нерухомості.");
    return;
  }

  if (propertyType === "commercial" && !commercialType) {
    alert("Виберіть підтип комерції.");
    return;
  }

  if (!validateFiles(selectedFiles)) {
    return;
  }

  try {
    showProgress(true);

    const imageUrls = [];

    for (const file of selectedFiles) {
      const safeName = file.name.replace(/[^\wа-яА-ЯіїєґІЇЄҐ.-]/g, "_");
      const fileName = `${Date.now()}_${crypto.randomUUID()}_${safeName}`;

      // ВАЖЛИВО:
      // шлях відповідає storage.rules: objects/{userId}/{fileName}
      const storageRef = ref(storage, `objects/${currentUser.uid}/${fileName}`);

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);
      imageUrls.push(url);
    }

    await addDoc(collection(db, "objects"), {
      title,
      area: area || "-",
      price,
      address: address || "",
      description: description || "",

      dealType,
      propertyType,
      commercialType,

      images: imageUrls,

      lat,
      lng,

      ownerId: currentUser.uid,
      ownerName: "Олег Іванчик",
      ownerEmail: currentUser.email || "",

      status: sold ? "sold" : "active",
      vip,

      views: 0,
      rating: 0,
      ratingCount: 0,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    alert("✅ Обʼєкт успішно створено!");

    clearForm();
  } catch (error) {
    console.error("ADD OBJECT ERROR:", error);
    alert("❌ Помилка створення обʼєкта. Перевірте Firebase Storage / Firestore правила.");
  } finally {
    showProgress(false);
  }
};

/* ================================
   CLEAR FORM
================================ */

window.clearForm = function() {
  const ids = [
    "title",
    "area",
    "price",
    "address",
    "description",
    "lat",
    "lng"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);

    if (el) {
      el.value = "";
    }
  });

  const dealType = document.getElementById("dealType");
  const propertyType = document.getElementById("propertyType");
  const commercialType = document.getElementById("commercialType");
  const commercialTypeBox = document.getElementById("commercialTypeBox");

  if (dealType) {
    dealType.value = "sale";
  }

  if (propertyType) {
    propertyType.value = "apartment";
  }

  if (commercialType) {
    commercialType.value = "";
  }

  if (commercialTypeBox) {
    commercialTypeBox.style.display = "none";
  }

  const vip = document.getElementById("vip");
  const sold = document.getElementById("sold");

  if (vip) vip.checked = false;
  if (sold) sold.checked = false;

  if (fileInput) {
    fileInput.value = "";
  }

  selectedFiles = [];

  if (preview) {
    preview.innerHTML = "";
  }
};
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
