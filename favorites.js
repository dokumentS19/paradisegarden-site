import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { 
  getFirestore, 
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

/* ================================
   STATE
================================ */

let favIds = [];
let favObjects = [];

/* ================================
   DOM
================================ */

const grid = document.getElementById("favGrid");
const searchInput = document.getElementById("favSearch");

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

function formatPrice(value, dealType = "sale", pricePeriod = "") {
  const n = Number(value);

  if (!Number.isFinite(n) || n <= 0) {
    return "-";
  }

  const formatted = new Intl.NumberFormat("uk-UA").format(n);

  if (dealType === "rent") {
    const periodMap = {
      month: " / місяць",
      day: " / доба",
      year: " / рік",
      sqm_month: " / м² / місяць",
      sotka_month: " / сотку / місяць",
      negotiable: ""
    };

    return `${formatted} грн${periodMap[pricePeriod] || ""}`;
  }

  return `${formatted} $`;
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
    room: "Кімната",
    house: "Будинок",
    dacha: "Дача",
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

function loadFavIds() {
  try {
    favIds = JSON.parse(localStorage.getItem("favs")) || [];

    if (!Array.isArray(favIds)) {
      favIds = [];
    }

    favIds = [...new Set(favIds)];
  } catch {
    favIds = [];
  }
}

function saveFavIds() {
  favIds = [...new Set(favIds)];
  localStorage.setItem("favs", JSON.stringify(favIds));
}

/* ================================
   LOAD FAVORITES
================================ */

async function loadFavorites() {
  if (!grid) return;

  loadFavIds();

  if (!favIds.length) {
    favObjects = [];
    renderFavorites();
    return;
  }

  grid.innerHTML = `
    <div class="empty-favs" style="grid-column:1/-1;">
      <h2>Завантаження...</h2>
      <p>Отримуємо Ваші обрані обʼєкти.</p>
    </div>
  `;

  try {
    const results = await Promise.all(
      favIds.map(async id => {
        const snap = await getDoc(doc(db, "objects", id));

        if (!snap.exists()) {
          return null;
        }

        return {
          id: snap.id,
          ...snap.data()
        };
      })
    );

    favObjects = results.filter(Boolean);

    const existingIds = favObjects.map(item => item.id);
    favIds = favIds.filter(id => existingIds.includes(id));

    saveFavIds();
    renderFavorites();
  } catch (error) {
    console.error("LOAD FAVORITES ERROR:", error);

    grid.innerHTML = `
      <div class="empty-favs" style="grid-column:1/-1;">
        <h2>❌ Помилка завантаження</h2>
        <p>Не вдалося завантажити обрані обʼєкти. Перевірте Firebase або інтернет.</p>
      </div>
    `;
  }
}

/* ================================
   RENDER
================================ */

window.renderFavorites = function() {
  if (!grid) return;

  const search = searchInput ? searchInput.value.trim().toLowerCase() : "";

  let data = [...favObjects];

  if (search) {
    data = data.filter(item => {
      const title = String(item.title || "").toLowerCase();
      const area = String(item.area || "").toLowerCase();
      const address = String(item.address || "").toLowerCase();
      const description = String(item.description || "").toLowerCase();

      const dealName = getDealTypeName(item.dealType).toLowerCase();
      const propertyName = getPropertyTypeName(item.propertyType).toLowerCase();
      const commercialName = getCommercialTypeName(item.commercialType).toLowerCase();

      return (
        title.includes(search) ||
        area.includes(search) ||
        address.includes(search) ||
        description.includes(search) ||
        dealName.includes(search) ||
        propertyName.includes(search) ||
        commercialName.includes(search)
      );
    });
  }

  if (!favIds.length || !data.length) {
    grid.innerHTML = `
      <div class="empty-favs" style="grid-column:1/-1;">
        <h2>❤️ Обране порожнє</h2>
        <p>
          Додайте обʼєкти з головної сторінки, натиснувши сердечко на картці.
        </p>
        <a class="btn" href="index.html#objects">Перейти до обʼєктів</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = data.map(item => {
    const id = escapeHtml(item.id);
    const title = escapeHtml(item.title || "Обʼєкт нерухомості");
    const area = escapeHtml(item.area || "-");
    const address = escapeHtml(item.address || "Київ та Київська область");
    const price = formatPrice(item.price, item.dealType);
    const image = escapeHtml(getMainImage(item));
    const status = item.status === "sold" ? "❌ Продано" : "✅ Активне";

    const dealName = escapeHtml(getDealTypeName(item.dealType));
    const propertyName = escapeHtml(getPropertyTypeName(item.propertyType));
    const commercialName = escapeHtml(getCommercialTypeName(item.commercialType));

    return `
      <article class="fav-card">
        <button class="remove-fav" type="button" onclick="removeFavorite('${id}')" title="Прибрати з обраного">
          ✕
        </button>

        <a href="assets/object.html?id=${id}">
          <div class="fav-card-img">
            <img src="${image}" alt="${title}" loading="lazy">
          </div>

          <div class="fav-card-body">
            <h3>${title}</h3>
            <p>🔑 ${dealName}</p>
            <p>🏷️ ${propertyName}</p>
            ${
              item.propertyType === "commercial" && commercialName
                ? `<p>📌 ${commercialName}</p>`
                : ""
            }
            <p>📍 ${address}</p>
            <p>📐 ${area}</p>
            <p>${status}</p>
            <div class="fav-price">💰 ${price}</div>
          </div>
        </a>
      </article>
    `;
  }).join("");
};

/* ================================
   ACTIONS
================================ */

window.removeFavorite = function(id) {
  favIds = favIds.filter(item => item !== id);
  favObjects = favObjects.filter(item => item.id !== id);

  saveFavIds();
  renderFavorites();
};

window.clearFavorites = function() {
  if (!favIds.length) return;

  if (!confirm("Очистити всі обрані обʼєкти?")) {
    return;
  }

  favIds = [];
  favObjects = [];

  saveFavIds();
  renderFavorites();
};

if (searchInput) {
  searchInput.addEventListener("input", () => {
    renderFavorites();
  });
}

/* ================================
   START
================================ */

loadFavorites();
