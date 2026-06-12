import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* ================================
   STATE
================================ */

let currentUser = null;
let myAdsCache = [];

/* ================================
   DOM
================================ */

const loginBtn = document.getElementById("loginBtn");
const userInfo = document.getElementById("userInfo");
const profileAvatar = document.getElementById("profileAvatar");
const myAds = document.getElementById("myAds");

const statTotal = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
const statSold = document.getElementById("statSold");

/* ================================
   AUTH
================================ */

await setPersistence(auth, browserLocalPersistence);

getRedirectResult(auth).catch(error => {
  console.error("AUTH REDIRECT ERROR:", error);
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

onAuthStateChanged(auth, user => {
  currentUser = user;

  if (user) {
    renderUser(user);
    loadMyAds(user.uid);
  } else {
    renderGuest();
  }
});

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

function formatPrice(value, dealType = "sale") {
  const n = Number(value);

  if (!Number.isFinite(n) || n <= 0) {
    return "-";
  }

  const currency = dealType === "rent" ? "грн" : "$";

  return `${new Intl.NumberFormat("uk-UA").format(n)} ${currency}`;
}

function getMainImage(item) {
  if (Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
    return item.images[0];
  }

  return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80";
}

function getDealTypeName(value) {
  return {
    sale: "Продаж",
    rent: "Оренда"
  }[value] || "Не вказано";
}

function getPropertyTypeName(value) {
  return {
    apartment: "Квартира",
    house: "Будинок",
    land: "Земельна ділянка",
    garage: "Гараж",
    commercial: "Комерція"
  }[value] || "Не вказано";
}

function getCommercialTypeName(value) {
  return {
    office: "Офіс",
    hangar: "Ангар",
    warehouse: "Склад",
    shop: "Магазин",
    production: "Виробниче приміщення",
    other: "Інше"
  }[value] || "";
}

function setStats(total = 0, active = 0, sold = 0) {
  if (statTotal) statTotal.textContent = total;
  if (statActive) statActive.textContent = active;
  if (statSold) statSold.textContent = sold;
}

/* ================================
   PROFILE RENDER
================================ */

function renderUser(user) {
  if (loginBtn) {
    loginBtn.textContent = "Вийти";
  }

  if (userInfo) {
    userInfo.innerHTML = `
      <p><strong>👤 ${escapeHtml(user.displayName || "Користувач")}</strong></p>
      <p>✉️ ${escapeHtml(user.email || "-")}</p>
      <p>🆔 ${escapeHtml(user.uid)}</p>
    `;
  }

  if (profileAvatar) {
    if (user.photoURL) {
      profileAvatar.innerHTML = `<img src="${escapeHtml(user.photoURL)}" alt="avatar">`;
    } else {
      const initials = (user.displayName || user.email || "?")
        .trim()
        .slice(0, 2)
        .toUpperCase();

      profileAvatar.textContent = initials;
    }
  }
}

function renderGuest() {
  currentUser = null;
  myAdsCache = [];

  if (loginBtn) {
    loginBtn.textContent = "Увійти через Google";
  }

  if (userInfo) {
    userInfo.innerHTML = `<p>❌ Не авторизований</p>`;
  }

  if (profileAvatar) {
    profileAvatar.textContent = "?";
  }

  if (myAds) {
    myAds.innerHTML = `
      <div class="empty-dashboard">
        Увійдіть через Google, щоб бачити свої оголошення.
      </div>
    `;
  }

  setStats(0, 0, 0);
}

/* ================================
   QUICK ADD OBJECT
================================ */

window.addObject = async function(event) {
  if (event) event.preventDefault();

  if (!currentUser) {
    alert("Спочатку увійдіть через Google.");
    return;
  }

  const title = document.getElementById("title")?.value.trim();
  const price = Number(document.getElementById("price")?.value);
  const area = document.getElementById("area")?.value.trim();
  const address = document.getElementById("address")?.value.trim();
  const description = document.getElementById("description")?.value.trim();

  const dealType = document.getElementById("quickDealType")?.value || "sale";
  const propertyType = document.getElementById("quickPropertyType")?.value || "apartment";

  if (!title) {
    alert("Вкажіть назву оголошення.");
    return;
  }

  if (!price || price <= 0) {
    alert("Вкажіть коректну ціну.");
    return;
  }

  try {
    await addDoc(collection(db, "objects"), {
      title,
      price,
      area: area || "-",
      address: address || "",
      description: description || "",

      dealType,
      propertyType,
      commercialType: "",

      images: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
      ],

      lat: 50.5215,
      lng: 30.2506,

      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || currentUser.email || "Користувач",
      ownerEmail: currentUser.email || "",

      status: "active",
      vip: false,

      views: 0,
      rating: 0,
      ratingCount: 0,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    alert("✅ Оголошення додано!");

    clearQuickForm();
    loadMyAds(currentUser.uid);
  } catch (error) {
    console.error("ADD QUICK OBJECT ERROR:", error);
    alert("❌ Помилка додавання оголошення.");
  }
};

function clearQuickForm() {
  const ids = ["title", "price", "area", "address", "description"];

  ids.forEach(id => {
    const el = document.getElementById(id);

    if (el) {
      el.value = "";
    }
  });

  const quickDealType = document.getElementById("quickDealType");
  const quickPropertyType = document.getElementById("quickPropertyType");

  if (quickDealType) quickDealType.value = "sale";
  if (quickPropertyType) quickPropertyType.value = "apartment";
}

/* ================================
   LOAD MY ADS
================================ */

async function loadMyAds(uid) {
  if (!myAds) return;

  myAds.innerHTML = `
    <div class="empty-dashboard">
      Завантаження Ваших оголошень...
    </div>
  `;

  try {
    const q = query(
      collection(db, "objects"),
      where("ownerId", "==", uid)
    );

    const snap = await getDocs(q);

    myAdsCache = snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    renderMyAds(myAdsCache);
    updateStats(myAdsCache);
  } catch (error) {
    console.error("LOAD MY ADS ERROR:", error);

    myAds.innerHTML = `
      <div class="empty-dashboard">
        ❌ Не вдалося завантажити оголошення. Перевірте Firebase правила.
      </div>
    `;

    setStats(0, 0, 0);
  }
}

window.reloadMyAds = function() {
  if (!currentUser) {
    alert("Увійдіть через Google.");
    return;
  }

  loadMyAds(currentUser.uid);
};

function updateStats(data) {
  const total = data.length;
  const active = data.filter(item => item.status !== "sold").length;
  const sold = data.filter(item => item.status === "sold").length;

  setStats(total, active, sold);
}

/* ================================
   RENDER MY ADS
================================ */

function renderMyAds(data) {
  if (!myAds) return;

  if (!data.length) {
    myAds.innerHTML = `
      <div class="empty-dashboard">
        <h3 style="color:white;margin-top:0;">Оголошень поки немає</h3>
        <p>
          Ви можете додати швидке оголошення у формі вище
          або створити повноцінний обʼєкт з фото через адмін-панель.
        </p>
        <a class="btn" href="admin.html">Перейти в адмінку</a>
      </div>
    `;
    return;
  }

  data.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;

    return bTime - aTime;
  });

  myAds.innerHTML = data.map(item => {
    const id = escapeHtml(item.id);
    const title = escapeHtml(item.title || "Без назви");
    const area = escapeHtml(item.area || "-");
    const address = escapeHtml(item.address || "Київ та Київська область");
    const price = formatPrice(item.price, item.dealType);
    const image = escapeHtml(getMainImage(item));
    const status = item.status === "sold" ? "❌ Продано" : "✅ Активне";
    const views = Number(item.views || 0);

    const dealName = escapeHtml(getDealTypeName(item.dealType));
    const propertyName = escapeHtml(getPropertyTypeName(item.propertyType));
    const commercialName = escapeHtml(getCommercialTypeName(item.commercialType));

    return `
      <article class="my-ad">
        <div class="my-ad-img">
          <img src="${image}" alt="${title}">
        </div>

        <div class="my-ad-body">
          <h3>${title}</h3>

          <p>🔑 ${dealName}</p>
          <p>🏷️ ${propertyName}</p>
          ${
            item.propertyType === "commercial" && commercialName
              ? `<p>📌 ${commercialName}</p>`
              : ""
          }

          <p>💰 ${price}</p>
          <p>📐 ${area}</p>
          <p>📍 ${address}</p>
          <p>${status}</p>
          <p>👁 Переглядів: ${views}</p>

          <div class="my-ad-actions">
            <a class="cta-outline" href="assets/object.html?id=${id}">👁 Переглянути</a>

            <button class="cta-outline" type="button" onclick="editAd('${id}')">
              ✏️ Редагувати
            </button>

            ${
              item.status === "sold"
                ? `<button class="cta-outline" type="button" onclick="setAdStatus('${id}', 'active')">✅ Зробити активним</button>`
                : `<button class="cta-outline" type="button" onclick="setAdStatus('${id}', 'sold')">❌ Позначити проданим</button>`
            }

            <button class="danger-btn" type="button" onclick="deleteAd('${id}')">🗑 Видалити</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

/* ================================
   ACTIONS
================================ */

window.setAdStatus = async function(id, status) {
  if (!currentUser) {
    alert("Увійдіть через Google.");
    return;
  }

  try {
    await updateDoc(doc(db, "objects", id), {
      status,
      updatedAt: serverTimestamp()
    });

    await loadMyAds(currentUser.uid);
  } catch (error) {
    console.error("SET STATUS ERROR:", error);
    alert("❌ Не вдалося змінити статус.");
  }
};

window.deleteAd = async function(id) {
  if (!currentUser) {
    alert("Увійдіть через Google.");
    return;
  }

  if (!confirm("Видалити це оголошення?")) {
    return;
  }

  try {
    await deleteDoc(doc(db, "objects", id));

    myAdsCache = myAdsCache.filter(item => item.id !== id);

    renderMyAds(myAdsCache);
    updateStats(myAdsCache);

    alert("✅ Оголошення видалено.");
  } catch (error) {
    console.error("DELETE AD ERROR:", error);
    alert("❌ Не вдалося видалити оголошення.");
  }
};

window.editAd = async function(id) {
  if (!currentUser) {
    alert("Увійдіть через Google.");
    return;
  }

  const item = myAdsCache.find(ad => ad.id === id);

  if (!item) {
    alert("Оголошення не знайдено.");
    return;
  }

  const title = prompt("Назва обʼєкта:", item.title || "");
  if (title === null) return;

  const priceRaw = prompt("Ціна:", item.price || "");
  if (priceRaw === null) return;

  const area = prompt("Площа:", item.area || "");
  if (area === null) return;

  const address = prompt("Адреса / локація:", item.address || "");
  if (address === null) return;

  const description = prompt("Опис:", item.description || "");
  if (description === null) return;

  const dealType = prompt(
    "Тип угоди: sale = Продаж, rent = Оренда",
    item.dealType || "sale"
  );
  if (dealType === null) return;

  const propertyType = prompt(
    "Тип нерухомості: apartment, house, land, garage, commercial",
    item.propertyType || "apartment"
  );
  if (propertyType === null) return;

  let commercialType = item.commercialType || "";

  if (propertyType === "commercial") {
    commercialType = prompt(
      "Підтип комерції: office, hangar, warehouse, shop, production, other",
      item.commercialType || ""
    );

    if (commercialType === null) return;
  } else {
    commercialType = "";
  }

  const price = Number(priceRaw);

  if (!title.trim()) {
    alert("Назва не може бути порожньою.");
    return;
  }

  if (!price || price <= 0) {
    alert("Вкажіть коректну ціну.");
    return;
  }

  try {
    await updateDoc(doc(db, "objects", id), {
      title: title.trim(),
      price,
      area: area.trim() || "-",
      address: address.trim() || "",
      description: description.trim() || "",
      dealType,
      propertyType,
      commercialType,
      updatedAt: serverTimestamp()
    });

    alert("✅ Оголошення оновлено.");

    await loadMyAds(currentUser.uid);
  } catch (error) {
    console.error("EDIT AD ERROR:", error);
    alert("❌ Не вдалося оновити оголошення.");
  }
};
