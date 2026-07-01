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
let objectsLoadingPromise = null;

let favs = [];

try {
  favs = JSON.parse(localStorage.getItem("favs")) || [];

  if (!Array.isArray(favs)) {
    favs = [];
  }
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
const rentPeriodFilter = document.getElementById("rentPeriodFilter"); 

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

function escapeAttribute(value = "") {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function normalizePrice(value) {
  const n = Number(value);

  return Number.isFinite(n) ? n : 0;
}
function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replaceAll("ʼ", "'")
    .replaceAll("’", "'")
    .replaceAll("`", "'")
    .replace(/[–—−]/g, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ");
}

function normalizeCityKey(value = "") {
  return normalizeText(value)
    .replace(/[-\s]/g, "");
}

function getObjectCity(item) {
  if (item.city) {
    return String(item.city);
  }

  const address = String(
    item.addressPublic ||
    item.address ||
    item.addressFull ||
    ""
  );

  if (!address) {
    return "";
  }

  return address.split(",")[0].trim();
}

function getObjectLocationText(item) {
  return [
    item.city,
    item.addressPublic,
    item.address,
    item.addressFull
  ]
    .filter(Boolean)
    .join(" ");
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
function getHouseTypeName(value) {
  return {
    house: "Будинок",
    dacha: "Дача",
    half_house: "Півбудинку",
    townhouse: "Таунхаус",
    duplex: "Дуплекс"
  }[value] || "";
}
function getApartmentFloorText(item) {
  const a = item.apartment;

  if (!a) {
    return "";
  }

  if (a.floor && a.floorsTotal) {
    return `${a.floor} / ${a.floorsTotal}`;
  }

  if (a.floor) {
    return `${a.floor}`;
  }

  if (a.floorsTotal) {
    return `Будинок ${a.floorsTotal} пов.`;
  }

  return "";
}
/* ================================
   MOBILE MENU + INTERNAL LINKS
================================ */

function scrollToSectionByHash(hash) {
  if (!hash || !hash.startsWith("#")) {
    return false;
  }

  const target = document.querySelector(hash);

  if (!target) {
    return false;
  }

  setTimeout(() => {
    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    history.pushState(null, "", hash);
  }, 100);

  setTimeout(() => {
    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 700);

  return true;
}

if (menuBtn && mainNav) {
  menuBtn.addEventListener("click", () => {
    mainNav.classList.toggle("active");
    mainNav.classList.toggle("open");
    document.body.classList.toggle("no-scroll");
  });
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", event => {
    const href = link.getAttribute("href");

    if (!href || href === "#") {
      return;
    }

    const target = document.querySelector(href);

    if (!target) {
      return;
    }

    event.preventDefault();

    if (mainNav) {
      mainNav.classList.remove("active");
      mainNav.classList.remove("open");
    }

        document.body.classList.remove("no-scroll");

    if (href === "#objects") {
      loadObjectsOnce().then(() => {
        applyFilters();
        scrollToSectionByHash("#objects");
      });

      return;
    }

    scrollToSectionByHash(href);
  });
});
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
function loadObjectsOnce() {
  if (objectsLoadingPromise) {
    return objectsLoadingPromise;
  }

  objectsLoadingPromise = loadObjects();

  return objectsLoadingPromise;
}
/* ================================
   FILTERS
================================ */

function applyFilters() {
  const searchText = searchInput ? normalizeText(searchInput.value) : "";
  const minPrice = minPriceInput ? Number(minPriceInput.value) : 0;
  const maxPrice = maxPriceInput ? Number(maxPriceInput.value) : 0;
  const sortValue = sortSelect ? sortSelect.value : "vip";

 const dealValue = dealTypeFilter ? dealTypeFilter.value : "all";
const propertyValue = propertyTypeFilter ? propertyTypeFilter.value : "all";
const commercialValue = commercialTypeFilter ? commercialTypeFilter.value : "all";
const rentPeriodValue = rentPeriodFilter ? rentPeriodFilter.value : "all";

filteredObjects = allObjects.filter(item => {
  const city = normalizeText(getObjectCity(item));
  const locationText = normalizeText(getObjectLocationText(item));

  const searchKey = normalizeCityKey(searchText);
  const cityKey = normalizeCityKey(city);
  const locationKey = normalizeCityKey(locationText);

  const price = normalizePrice(item.price);

  const matchesText =
    !searchText ||
    city.includes(searchText) ||
    locationText.includes(searchText) ||
    cityKey.includes(searchKey) ||
    locationKey.includes(searchKey);

    const matchesMin = !minPrice || price >= minPrice;
    const matchesMax = !maxPrice || price <= maxPrice;

    const matchesDeal =
      dealValue === "all" || item.dealType === dealValue;

    const matchesProperty =
      propertyValue === "all" || item.propertyType === propertyValue;

   const matchesCommercial =
  commercialValue === "all" || item.commercialType === commercialValue;

const matchesRentPeriod =
  rentPeriodValue === "all" ||
  item.rent?.pricePeriod === rentPeriodValue;

return (
  matchesText &&
  matchesMin &&
  matchesMax &&
  matchesDeal &&
  matchesProperty &&
  matchesCommercial &&
  matchesRentPeriod
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

function updatePricePlaceholders() {
  if (!minPriceInput || !maxPriceInput) {
    return;
  }

  const dealValue = dealTypeFilter ? dealTypeFilter.value : "all";

  if (dealValue === "sale") {
    minPriceInput.placeholder = "від $";
    maxPriceInput.placeholder = "до $";
    return;
  }

  if (dealValue === "rent") {
    minPriceInput.placeholder = "від грн";
    maxPriceInput.placeholder = "до грн";
    return;
  }

  minPriceInput.placeholder = "ціна від";
  maxPriceInput.placeholder = "ціна до";
}


function setupFilters() {
  const controls = [
    searchInput,
    minPriceInput,
    maxPriceInput,
    sortSelect,
    dealTypeFilter,
    propertyTypeFilter,
    commercialTypeFilter,
    rentPeriodFilter
  ];

  controls.forEach(control => {
    if (!control) return;

    control.addEventListener("input", () => {
      clearTimeout(renderTimer);
      renderTimer = setTimeout(applyFilters, 180);
    });

    control.addEventListener("change", applyFilters);
  });

  if (dealTypeFilter) {
    dealTypeFilter.addEventListener("change", updatePricePlaceholders);
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (minPriceInput) minPriceInput.value = "";
      if (maxPriceInput) maxPriceInput.value = "";
      if (sortSelect) sortSelect.value = "vip";

      if (dealTypeFilter) dealTypeFilter.value = "all";
      if (propertyTypeFilter) propertyTypeFilter.value = "all";
      if (commercialTypeFilter) commercialTypeFilter.value = "all";
      if (rentPeriodFilter) rentPeriodFilter.value = "all";

      updatePricePlaceholders();
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
  const id = escapeAttribute(item.id);
  const title = escapeHtml(item.title || "Обʼєкт нерухомості");
  const city = escapeHtml(getObjectCity(item));
  const area = escapeHtml(item.area || "-");
  const price = formatPrice(item.price, item.dealType, item.rent?.pricePeriod || "");
  const image = escapeAttribute(getMainImage(item));
  const views = Number(item.views || 0);
  const isVip = Boolean(item.vip);
  const isSold = item.status === "sold";
  const isFav = favs.includes(item.id);

  const dealName = escapeHtml(getDealTypeName(item.dealType));
  const propertyName = escapeHtml(getPropertyTypeName(item.propertyType));
  const commercialName = escapeHtml(getCommercialTypeName(item.commercialType));
  const houseTypeName = escapeHtml(getHouseTypeName(item.house?.houseType));
  const apartmentFloorText = escapeHtml(getApartmentFloorText(item));
  
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
${city ? `<span>📍 ${city}</span>` : ""}
          ${
  item.propertyType === "commercial" && commercialName
    ? `<span>📌 ${commercialName}</span>`
    : ""
}
${
  item.propertyType === "house" && houseTypeName
    ? `<span>🏡 ${houseTypeName}</span>`
    : ""
} 
${
  (item.propertyType === "apartment" || item.propertyType === "room") && apartmentFloorText
    ? `<span>🏢 Поверх: ${apartmentFloorText}</span>`
    : ""
} 
<span>📐 Площа: ${area}</span>
            <span>👁 Переглядів: ${views}</span>
          </div>

          <div class="price">💰 ${price}</div>
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
   HOME ARTICLES
   Вивід 3 корисних статей на головну
================================ */

const homeArticles = [
  {
  id: 1,
  title: "Повний посібник із житлової нерухомості",
  excerpt: "Практичний посібник для покупців та орендарів: вибір між квартирою і будинком, бюджет, документи та технічний аудит.",
  date: "13 червня 2026",
  image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80",
  url: "povnyi-posibnyk-iz-zhytlovoi-nerukhomosti.html"
  },
  {
    id: 2,
    title: "Продаж житлової нерухомості: як не втратити гроші та захистити свої інтереси",
    excerpt: "Короткі поради для власників: підготовка обʼєкта, правильна ціна, фото, покази, переговори та безпечне оформлення угоди.",
    date: "13 червня 2026",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
    url: "prodazh-zhytlovoi-nerukhomosti-yak-ne-vtratyty-hroshi.html"
  },
  {
    id: 3,
    title: "Оренда житла: що важливо перевірити",
    excerpt: "Розбираємо ключові моменти договору оренди, оплату, заставу, стан житла та комунікацію між власником і орендарем.",
    date: "13 червня 2026",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80",
    url: "orenda-zhytla-shcho-vazhlyvo-pereviryty.html"
   }
];

function renderHomeArticles() {
  const container = document.getElementById("homeArticlesList");

  if (!container) {
    return;
  }

  const latestArticles = homeArticles.slice(0, 3);

  if (!latestArticles.length) {
    container.innerHTML = `
      <div class="home-articles-empty">
        <h3>Статті скоро зʼявляться</h3>
        <p>Ми готуємо корисні матеріали про нерухомість, купівлю, продаж та оренду.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = latestArticles.map(article => `
    <a href="${escapeAttribute(article.url)}" class="article-card">
      <div class="article-card-img">
        <img src="${escapeAttribute(article.image)}" alt="${escapeAttribute(article.title)}" loading="lazy">
      </div>

      <div class="article-card-body">
        <span class="article-card-date">🗓 ${escapeHtml(article.date)}</span>

        <h3 class="article-card-title">${escapeHtml(article.title)}</h3>

        <p class="article-card-excerpt">${escapeHtml(article.excerpt)}</p>

        <span class="article-card-more">Читати далі →</span>
      </div>
    </a>
  `).join("");
}
/* ================================
   LANGUAGE SWITCHER
================================ */

const languageSwitcher = document.getElementById("languageSwitcher");
const langToggle = document.getElementById("langToggle");
const langMenu = document.getElementById("langMenu");
const currentLangLabel = document.getElementById("currentLangLabel");
const langButtons = document.querySelectorAll("[data-lang]");

function setSiteLanguage(lang) {
  const safeLang = ["uk", "pl", "en"].includes(lang) ? lang : "uk";

  localStorage.setItem("siteLang", safeLang);
  document.documentElement.setAttribute("lang", safeLang);

  if (currentLangLabel) {
    currentLangLabel.textContent = safeLang.toUpperCase();
  }

  langButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.lang === safeLang);
  });

  if (languageSwitcher) {
    languageSwitcher.classList.remove("open");
  }
}

if (langToggle && languageSwitcher) {
  langToggle.addEventListener("click", event => {
    event.stopPropagation();
    languageSwitcher.classList.toggle("open");
  });
}

langButtons.forEach(button => {
  button.addEventListener("click", () => {
    setSiteLanguage(button.dataset.lang);
  });
});

document.addEventListener("click", event => {
  if (
    languageSwitcher &&
    !languageSwitcher.contains(event.target)
  ) {
    languageSwitcher.classList.remove("open");
  }
});

setSiteLanguage(localStorage.getItem("siteLang") || "uk");
/* ===============================
   START
================================ */

setupFilters();
updatePricePlaceholders();
renderHomeArticles();

loadObjectsOnce().then(() => {
  if (window.location.hash === "#objects") {
    scrollToSectionByHash("#objects");
  }

  if (window.location.hash === "#contacts") {
    scrollToSectionByHash("#contacts");
  }

  if (window.location.hash === "#request") {
    scrollToSectionByHash("#request");
  }

  if (window.location.hash === "#director") {
    scrollToSectionByHash("#director");
  }

  if (window.location.hash === "#registers-preview") {
    scrollToSectionByHash("#registers-preview");
  }
});
