import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp
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

let allObjects = [];
let filteredObjects = [];
let renderTimer = null;

let favs = [];

try {
  favs = JSON.parse(localStorage.getItem("favs")) || [];
  if (!Array.isArray(favs)) favs = [];
} catch {
  favs = [];
}

/* ================================
   CONTACTS
================================ */

const COMPANY_PHONE_VISIBLE = "0953777196";
const COMPANY_PHONE_TEL = "+380953777196";

const TELEGRAM_LINK = "https://t.me/paradisegarden_leads_bot";
const VIBER_LINK = "viber://chat?number=%2B380953777196";

/* ================================
   DOM
================================ */

const loader = document.getElementById("loader");
const grid = document.getElementById("objectsGrid");

const searchInput = document.getElementById("search");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");
const sortSelect = document.getElementById("sortSelect");

const dealTypeFilter = document.getElementById("dealTypeFilter");
const propertyTypeFilter = document.getElementById("propertyTypeFilter");
const commercialTypeFilter = document.getElementById("commercialTypeFilter");

const resetFiltersBtn = document.getElementById("resetFilters");

const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");

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

function normalizePrice(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
function formatPrice(value, dealType = "sale") {
  const n = Number(value);

  if (!Number.isFinite(n) || n <= 0) {
    return "-";
  }

  const currency = dealType === "rent" ? "грн" : "$";

  return `${new Intl.NumberFormat("uk-UA").format(n)} ${currency}`;
}

function getDateValue(item) {
  if (item.createdAt?.seconds) {
    return item.createdAt.seconds * 1000;
  }

  if (item.createdAt instanceof Date) {
    return item.createdAt.getTime();
  }

  return 0;
}

function showLoader(show) {
  if (!loader) return;

  loader.classList.toggle("active", Boolean(show));
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

/* ================================
   MOBILE MENU
================================ */

if (menuBtn && mainNav) {
  menuBtn.addEventListener("click", () => {
    mainNav.classList.toggle("open");
    document.body.classList.toggle("no-scroll");
  });

  mainNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      document.body.classList.remove("no-scroll");
    });
  });
}

/* ================================
   REVEAL ANIMATION
================================ */

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  {
    threshold: 0.14
  }
);

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

/* ================================
   LOAD OBJECTS
================================ */

async function loadObjects() {
  try {
    showLoader(true);

    const snap = await getDocs(collection(db, "objects"));

    allObjects = snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    filteredObjects = [...allObjects];

    applyFilters();
  } catch (error) {
    console.error("LOAD OBJECTS ERROR:", error);

    if (grid) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>❌ Не вдалося завантажити обʼєкти</h3>
          <p>Перевірте підключення Firebase або правила доступу.</p>
        </div>
      `;
    }
  } finally {
    showLoader(false);
  }
}

/* ================================
   FILTERS
================================ */

function applyFilters() {
  const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const minPrice = minPriceInput ? Number(minPriceInput.value) : 0;
  const maxPrice = maxPriceInput ? Number(maxPriceInput.value) : 0;
  const sortValue = sortSelect ? sortSelect.value : "vip";

  const dealValue = dealTypeFilter ? dealTypeFilter.value : "all";
  const propertyValue = propertyTypeFilter ? propertyTypeFilter.value : "all";
  const commercialValue = commercialTypeFilter ? commercialTypeFilter.value : "all";

  filteredObjects = allObjects.filter(item => {
    const title = String(item.title || "").toLowerCase();
    const description = String(item.description || "").toLowerCase();
    const area = String(item.area || "").toLowerCase();
    const address = String(item.address || "").toLowerCase();

    const price = normalizePrice(item.price);

    const matchesText =
      !searchText ||
      title.includes(searchText) ||
      description.includes(searchText) ||
      area.includes(searchText) ||
      address.includes(searchText);

    const matchesMin = !minPrice || price >= minPrice;
    const matchesMax = !maxPrice || price <= maxPrice;

    const matchesDeal =
      dealValue === "all" || item.dealType === dealValue;

    const matchesProperty =
      propertyValue === "all" || item.propertyType === propertyValue;

    const matchesCommercial =
      commercialValue === "all" ||
      item.commercialType === commercialValue;

    return (
      matchesText &&
      matchesMin &&
      matchesMax &&
      matchesDeal &&
      matchesProperty &&
      matchesCommercial
    );
  });

  filteredObjects.sort((a, b) => {
    if (sortValue === "priceAsc") {
      return normalizePrice(a.price) - normalizePrice(b.price);
    }

    if (sortValue === "priceDesc") {
      return normalizePrice(b.price) - normalizePrice(a.price);
    }

    if (sortValue === "newest") {
      return getDateValue(b) - getDateValue(a);
    }

    return Number(Boolean(b.vip)) - Number(Boolean(a.vip));
  });

  safeRender(filteredObjects);
}

function setupFilters() {
  const controls = [
    searchInput,
    minPriceInput,
    maxPriceInput,
    sortSelect,
    dealTypeFilter,
    propertyTypeFilter,
    commercialTypeFilter
  ];

  controls.forEach(control => {
    if (!control) return;

    control.addEventListener("input", () => {
      clearTimeout(renderTimer);
      renderTimer = setTimeout(applyFilters, 180);
    });

    control.addEventListener("change", applyFilters);
  });

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (minPriceInput) minPriceInput.value = "";
      if (maxPriceInput) maxPriceInput.value = "";
      if (sortSelect) sortSelect.value = "vip";

      if (dealTypeFilter) dealTypeFilter.value = "all";
      if (propertyTypeFilter) propertyTypeFilter.value = "all";
      if (commercialTypeFilter) commercialTypeFilter.value = "all";

      applyFilters();
    });
  }
}

/* ================================
   RENDER
================================ */

function safeRender(data) {
  clearTimeout(renderTimer);

  renderTimer = setTimeout(() => {
    renderObjects(data);
  }, 60);
}

function renderObjects(data) {
  if (!grid) return;

  if (!data || data.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Нічого не знайдено</h3>
        <p>Спробуйте змінити параметри пошуку або зверніться до нас напряму.</p>
        <button class="btn" onclick="callCompany()">Подзвонити ${COMPANY_PHONE_VISIBLE}</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = data.map(item => createObjectCard(item)).join("");
}

function createObjectCard(item) {
  const id = escapeHtml(item.id);
  const title = escapeHtml(item.title || "Обʼєкт нерухомості");
  const area = escapeHtml(item.area || "-");
 const price = formatPrice(item.price, item.dealType);
  const image = escapeHtml(getMainImage(item));
  const views = Number(item.views || 0);
  const isVip = Boolean(item.vip);
  const isSold = item.status === "sold";
  const isFav = favs.includes(item.id);

  const dealName = getDealTypeName(item.dealType);
  const propertyName = getPropertyTypeName(item.propertyType);
  const commercialName = getCommercialTypeName(item.commercialType);

  return `
    <article class="card">
      ${isVip ? `<div class="vip-badge">🔥 VIP</div>` : ""}

      <button class="fav-btn" onclick="toggleFav('${id}')" title="Додати в обране">
        ${isFav ? "❤️" : "🤍"}
      </button>

      <a href="assets/object.html?id=${id}" class="card-link">
        <div class="card-img">
          <img src="${image}" alt="${title}" loading="lazy">

          <div class="status-badge">
            ${isSold ? "❌ Продано" : "✅ Активне"}
          </div>
        </div>

        <div class="card-body">
          <h3>${title}</h3>

          <div class="card-meta">
            <span>🔑 ${dealName}</span>
            <span>🏷️ ${propertyName}</span>
            ${
              item.propertyType === "commercial" && commercialName
                ? `<span>📌 ${commercialName}</span>`
                : ""
            }
            <span>📐 Площа: ${area}</span>
            <span>👁 Переглядів: ${views}</span>
          </div>

          <div class="price">💰 ${price} $</div>
        </div>
      </a>
    </article>
  `;
}

/* ================================
   FAVORITES
================================ */

window.toggleFav = function(id) {
  if (!id) return;

  if (favs.includes(id)) {
    favs = favs.filter(item => item !== id);
  } else {
    favs.push(id);
  }

  favs = [...new Set(favs)];

  localStorage.setItem("favs", JSON.stringify(favs));

  safeRender(filteredObjects);
};

/* ================================
   REQUEST FORM
================================ */

window.sendForm = async function(event) {
  if (event) event.preventDefault();

  const nameInput = document.getElementById("name");
  const phoneInput = document.getElementById("phone");
  const messageInput = document.getElementById("message");

  const name = nameInput ? nameInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const message = messageInput ? messageInput.value.trim() : "";

  if (!name || !phone) {
    alert("Будь ласка, заповніть імʼя та телефон.");
    return;
  }

  try {
    await addDoc(collection(db, "leads"), {
      name,
      phone,
      message,
      source: "Головна сторінка",
      status: "new",
      income: 0,
      createdAt: serverTimestamp()
    });

    alert("✅ Прийнято. Ми з Вами звʼяжимося.");

    if (nameInput) nameInput.value = "";
    if (phoneInput) phoneInput.value = "";
    if (messageInput) messageInput.value = "";
  } catch (error) {
    console.error("SEND FORM ERROR:", error);
    alert("❌ Помилка відправки заявки. Спробуйте ще раз або зателефонуйте нам.");
  }
};

/* ================================
   CONTACT BUTTONS
================================ */

window.callCompany = function() {
  window.location.href = `tel:${COMPANY_PHONE_TEL}`;
};

window.openTelegram = function() {
  window.open(TELEGRAM_LINK, "_blank", "noopener,noreferrer");
};

window.openViber = function() {
  window.location.href = VIBER_LINK;
};

/* ================================
   START
================================ */

setupFilters();
loadObjects();
