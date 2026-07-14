import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

const objectId = new URLSearchParams(window.location.search).get("id");

let currentUser = null;
let currentObject = null;
let images = [];
let currentSlide = 0;
let lightboxSlide = 0;

const COMPANY_PHONE_VISIBLE = "0953777196";
const COMPANY_PHONE_TEL = "+380953777196";

const TELEGRAM_LINK = "https://t.me/paradisegarden_leads_bot";
const VIBER_LINK = "viber://chat?number=%2B380953777196";

const page = document.getElementById("objectPage");

onAuthStateChanged(auth, user => {
  currentUser = user;
});

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

function valueText(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value);
}

/* ================================
   PUBLIC ADDRESS / MAP PRIVACY
================================ */

function getPublicAddress(item) {
  return item.addressPublic || item.address || "Київ та Київська область";
}

function getMapPrivacy(item) {
  return {
    hideExactLocation: item.mapPrivacy?.hideExactLocation === true,
    hideHouseNumber: item.mapPrivacy?.hideHouseNumber === true,
    hideCadastralNumber: item.mapPrivacy?.hideCadastralNumber === true
  };
}

function getPublicMapPosition(item) {
  const privacy = getMapPrivacy(item);

  if (
    privacy.hideExactLocation &&
    item.publicMapLocation &&
    Number.isFinite(Number(item.publicMapLocation.lat)) &&
    Number.isFinite(Number(item.publicMapLocation.lng))
  ) {
    return {
      lat: Number(item.publicMapLocation.lat),
      lng: Number(item.publicMapLocation.lng)
    };
  }

  if (
    item.mapLocation &&
    Number.isFinite(Number(item.mapLocation.lat)) &&
    Number.isFinite(Number(item.mapLocation.lng))
  ) {
    return {
      lat: Number(item.mapLocation.lat),
      lng: Number(item.mapLocation.lng)
    };
  }

  return {
    lat: Number(item.lat || 50.5215),
    lng: Number(item.lng || 30.2506)
  };
}

function getPublicCadastralNumber(item) {
  if (item.mapPrivacy?.hideCadastralNumber === true) {
    return "";
  }

  return item.cadastral?.publicNumber || item.cadastral?.number || "";
}

function getMapDisplayMode(item) {
  const privacy = getMapPrivacy(item);

  if (item.mapDisplay?.mode) {
    return item.mapDisplay.mode;
  }

  return privacy.hideExactLocation ? "approximate_circle" : "exact_marker";
}

function getMapDisplayRadius(item) {
  const radius = Number(item.mapDisplay?.radius);

  if (Number.isFinite(radius) && radius > 0) {
    return radius;
  }

  return 200;
}

function getMapNote(item) {
  const privacy = getMapPrivacy(item);

  if (privacy.hideExactLocation) {
    return "Точне місце обʼєкта приховано. На карті показано приблизну зону розташування.";
  }

  return "На карті показано місце розташування обʼєкта.";
}

/* ================================
   DICTIONARIES / TEXT HELPERS
================================ */

function yesNo(value) {
  if (value === true) return "Так";
  if (value === false) return "Ні";
  return "";
}

function getMainImage(item) {
  if (Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
    return item.images[0];
  }

  return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";
}

function getImages(item) {
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images;
  }

  return [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
  ];
}

function getCreatedDate(item) {
  if (item.createdAt?.seconds) {
    return new Date(item.createdAt.seconds * 1000).toLocaleDateString("uk-UA");
  }

  return "-";
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

function dict(value, map) {
  return map[value] || valueText(value);
}

function getBathroomTypeName(value) {
  return dict(value, {
    combined: "Суміжний",
    separate: "Роздільний",
    multiple: "Декілька санвузлів",
    outdoor: "На вулиці",
    none: "Немає"
  });
}

function getBathFeatureName(value) {
  return dict(value, {
    bath: "Ванна",
    shower: "Душова",
    both: "Ванна + душова",
    none: "Без ванни / душової"
  });
}

function getBalconyName(value) {
  return dict(value, {
    none: "Немає",
    balcony: "Балкон",
    loggia: "Лоджія",
    both: "Балкон + лоджія",
    terrace: "Тераса"
  });
}

function getConditionName(value) {
  return dict(value, {
    living: "Житловий",
    renovated: "Після ремонту",
    euro: "Євроремонт",
    needs_repair: "Під ремонт",
    builder: "Після будівельників",
    no_repair: "Без ремонту",
    unfinished: "Недобудова",
    good: "Добрий",
    normal: "Задовільний",
    office: "Офісний стан",
    shell: "Без ремонту"
  });
}

function getHeatingName(value) {
  return dict(value, {
    individual: "Індивідуальне",
    central: "Центральне",
    electric: "Електричне",
    gas: "Газове",
    solid_fuel: "Твердопаливне",
    combined: "Комбіноване",
    none: "Немає"
  });
}

function getHouseTypeName(value) {
  return dict(value, {
    house: "Будинок",
    dacha: "Дача",
    half_house: "Півбудинку",
    townhouse: "Таунхаус",
    duplex: "Дуплекс"
  });
}

function getGarageTypeName(value) {
  return dict(value, {
    capital: "Капітальний",
    metal: "Металевий",
    parking_place: "Паркомісце",
    underground: "Підземний паркінг",
    box: "Бокс"
  });
}

function getRentPeriodName(value) {
  return dict(value, {
    month: "За місяць",
    day: "За добу",
    year: "За рік",
    sqm_month: "За м² / місяць",
    sotka_month: "За сотку / місяць",
    negotiable: "Договірна"
  });
}

function getUtilitiesIncludedName(value) {
  return dict(value, {
    not_included: "Окремо",
    included: "Включені",
    partial: "Частково включені",
    negotiable: "Договірно"
  });
}

function getLayoutName(value) {
  return dict(value, {
    separate: "Роздільні кімнати",
    adjacent: "Суміжні кімнати",
    mixed: "Суміжно-роздільні кімнати",
    studio: "Студія",
    free: "Вільне планування",
    cabinet: "Кабінетна система",
    open_space: "Open space"
  });
}

function getBuildingTypeName(value) {
  return dict(value, {
    brick: "Цегляний",
    panel: "Панельний",
    monolith: "Монолітний",
    gasblock: "Газоблок",
    new_building: "Новобудова",
    stalinka: "Сталінка",
    hrushchovka: "Хрущовка",
    czech: "Чешка"
  });
}

function getDocumentsName(value) {
  return dict(value, {
    ownership: "Право власності",
    lease: "Оренда",
    act: "Державний акт",
    inheritance: "Спадщина",
    contract: "Договір",
    in_progress: "В процесі оформлення",
    other: "Інше"
  });
}

function getApplianceNames(values = []) {
  if (!Array.isArray(values) || !values.length) {
    return "";
  }

  const map = {
    fridge: "Холодильник",
    washer: "Пральна машина",
    conditioner: "Кондиціонер",
    dishwasher: "Посудомийка",
    internet: "Інтернет"
  };

  return values.map(item => map[item] || item).join(", ");
}

function feature(label, value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return `
    <div class="feature">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

/* ================================
   FEATURES BY TYPE
================================ */

function buildRentFeatures(item) {
  if (item.dealType !== "rent" || !item.rent) return "";

  const r = item.rent;

  return `
    ${feature("Період оплати", getRentPeriodName(r.pricePeriod))}
    ${feature("Комунальні платежі", getUtilitiesIncludedName(r.utilitiesIncluded))}
    ${feature("Застава", r.deposit ? `${r.deposit} грн` : "")}
    ${feature("Комісія", r.commission)}
    ${feature("Мінімальний строк", r.minTerm)}
    ${feature("Доступно з", r.availableFrom)}
    ${feature("Можна з дітьми", yesNo(r.childrenAllowed))}
    ${feature("Можна з тваринами", yesNo(r.petsAllowed))}
  `;
}

function buildApartmentFeatures(item) {
  const a = item.apartment;
  if (!a) return "";

  const floorText = a.floor && a.floorsTotal
    ? `${a.floor} / ${a.floorsTotal}`
    : a.floor
      ? `${a.floor}`
      : a.floorsTotal
        ? `Будинок ${a.floorsTotal} пов.`
        : "";

  return `
    ${feature("Загальна площа", a.totalArea ? `${a.totalArea} м²` : "")}
    ${feature("Житлова площа", a.livingArea ? `${a.livingArea} м²` : "")}
    ${feature("Кухня", a.kitchenArea ? `${a.kitchenArea} м²` : "")}
    ${feature("Кімнат", a.rooms)}
    ${feature("Поверх", floorText)}
    ${feature("Планування", getLayoutName(a.layout))}
    ${feature("Санвузол", getBathroomTypeName(a.bathroomType))}
    ${feature("Ванна / душова", getBathFeatureName(a.bathFeature))}
    ${feature("Кількість санвузлів", a.bathroomsCount)}
    ${feature("Балкон / лоджія", getBalconyName(a.balcony))}
    ${feature("Тип будинку", getBuildingTypeName(a.buildingType))}
    ${feature("Рік побудови", a.buildYear)}
    ${feature("Ліфт", dict(a.elevator, { yes: "Є", no: "Немає" }))}
    ${feature("Опалення", getHeatingName(a.heating))}
    ${feature("Стан", getConditionName(a.condition))}
    ${feature("Меблі", dict(a.furniture, { yes: "Мебльована", partial: "Частково мебльована", no: "Без меблів" }))}
    ${feature("Техніка", getApplianceNames(a.appliances))}
  `;
}

function buildHouseFeatures(item) {
  const h = item.house;
  if (!h) return "";

  return `
    ${feature("Тип будинку", getHouseTypeName(h.houseType))}
    ${feature("Загальна площа будинку", h.houseArea ? `${h.houseArea} м²` : "")}
    ${feature("Житлова площа", h.livingArea ? `${h.livingArea} м²` : "")}
    ${feature("Кухня", h.kitchenArea ? `${h.kitchenArea} м²` : "")}
    ${feature("Площа ділянки", h.landArea ? `${h.landArea} сот.` : "")}
    ${feature("Кімнат", h.rooms)}
    ${feature("Поверхів", h.floors)}
    ${feature("Стіни", h.walls)}
    ${feature("Санвузол", getBathroomTypeName(h.bathroomType))}
    ${feature("Ванна / душова", getBathFeatureName(h.bathFeature))}
    ${feature("Кількість санвузлів", h.bathroomsCount)}
    ${feature("Опалення", getHeatingName(h.heating))}
    ${feature("Вода", dict(h.water, { central: "Центральна", well: "Свердловина", well_yard: "Колодязь", none: "Немає" }))}
    ${feature("Каналізація", dict(h.sewerage, { central: "Центральна", septic: "Септик", cesspool: "Вигрібна яма", none: "Немає" }))}
    ${feature("Електрика", yesNo(h.electricity))}
    ${feature("Газ", yesNo(h.gas))}
    ${feature("Паркування", yesNo(h.parking))}
    ${feature("Гараж", yesNo(h.garageIncluded))}
    ${feature("Документи", getDocumentsName(h.documents))}
    ${feature("Стан", getConditionName(h.condition))}
  `;
}

function buildLandFeatures(item) {
  const l = item.land;
  if (!l) return "";

  return `
    ${feature("Площа ділянки", l.landArea ? `${l.landArea} сот.` : "")}
    ${feature("Цільове призначення", l.purposeName)}
    ${feature("Уточнення", l.purposeNote)}
    ${feature("Документи", getDocumentsName(l.documents))}
    ${feature("Фасад", l.frontage)}
    ${feature("Комунікації поруч", l.utilitiesNearby)}
  `;
}

function buildGarageFeatures(item) {
  const g = item.garage;
  if (!g) return "";

  return `
    ${feature("Площа", g.area ? `${g.area} м²` : "")}
    ${feature("Тип гаража", getGarageTypeName(g.garageType))}
    ${feature("Яма", yesNo(g.pit))}
    ${feature("Погріб", yesNo(g.cellar))}
    ${feature("Електрика", yesNo(g.electricity))}
    ${feature("Охорона / відеонагляд", yesNo(g.security))}
    ${feature("Ворота", g.gateType)}
    ${feature("Стан", getConditionName(g.condition))}
  `;
}

function buildCommercialFeatures(item) {
  const c = item.commercial;
  if (!c) return "";

  return `
    ${feature("Підтип", getCommercialTypeName(c.commercialType || item.commercialType))}
    ${feature("Площа", c.area ? `${c.area} м²` : "")}
    ${feature("Поверх", c.floor && c.floorsTotal ? `${c.floor} / ${c.floorsTotal}` : c.floor)}
    ${feature("Кабінетів / приміщень", c.rooms)}
    ${feature("Планування", getLayoutName(c.layout))}
    ${feature("Стан", getConditionName(c.condition))}
    ${feature("Вхід", dict(c.entrance, { separate: "Окремий", common: "Загальний", street: "З фасаду / з вулиці", yard: "З двору" }))}
    ${feature("Санвузол", dict(c.bathroom, { yes: "Є", no: "Немає", shared: "Спільний" }))}
    ${feature("Опалення", getHeatingName(c.heating))}
    ${feature("Потужність електрики", c.power)}
    ${feature("Інтернет", yesNo(c.internet))}
    ${feature("Паркування", yesNo(c.parking))}
    ${feature("Охорона", yesNo(c.security))}
    ${feature("Доступ 24/7", yesNo(c.access24))}
  `;
}

function buildTypeFeatures(item) {
  if (item.propertyType === "apartment" || item.propertyType === "room") return buildApartmentFeatures(item);
  if (item.propertyType === "house" || item.propertyType === "dacha") return buildHouseFeatures(item);
  if (item.propertyType === "land") return buildLandFeatures(item);
  if (item.propertyType === "garage") return buildGarageFeatures(item);
  if (item.propertyType === "commercial") return buildCommercialFeatures(item);

  return "";
} 
/* ================================
   GALLERY
================================ */

function applyImageOrientation(img) {
  if (!img) return;

  img.classList.remove("horizontal", "vertical");

  if (img.naturalWidth >= img.naturalHeight) {
    img.classList.add("horizontal");
  } else {
    img.classList.add("vertical");
  }
}

function updateGallery() {
  const mainImg = document.getElementById("mainImg");
  const counter = document.getElementById("counter");
  const galleryMain = document.querySelector(".gallery-main");

  const currentSrc = images[currentSlide] || getMainImage(currentObject || {});
  const safeCssUrl = String(currentSrc).replaceAll('"', '\\"');

  if (galleryMain) {
    galleryMain.style.setProperty("--gallery-bg", `url("${safeCssUrl}")`);
  }

  if (mainImg) {
    mainImg.onload = function() {
      applyImageOrientation(mainImg);
    };

    mainImg.src = currentSrc;

    if (mainImg.complete && mainImg.naturalWidth) {
      applyImageOrientation(mainImg);
    }
  }

  if (counter) {
    counter.textContent = `${currentSlide + 1} / ${images.length}`;
  }

  document.querySelectorAll(".thumbs img").forEach((img, index) => {
    img.classList.toggle("active", index === currentSlide);
  });

  bindGalleryOpenEvents();
}

/* ================================
   PHOTO LIGHTBOX
   Великий перегляд фото
================================ */

function updatePhotoLightbox() {
  const modalImg = document.getElementById("photoLightboxImg");
  const modalCounter = document.getElementById("photoLightboxCounter");

  if (!modalImg || !images.length) return;

  modalImg.src = images[lightboxSlide];

  if (modalCounter) {
    modalCounter.textContent = `${lightboxSlide + 1} / ${images.length}`;
  }
}

function isPhotoLightboxOpen() {
  const modal = document.getElementById("photoLightbox");
  return modal?.classList.contains("active") || modal?.classList.contains("closing");
}

window.openPhotoLightbox = function(index = currentSlide) {
  if (!images.length) return;

  const modal = document.getElementById("photoLightbox");

  if (!modal) return;

  lightboxSlide = Number.isInteger(index) ? index : currentSlide;

  if (lightboxSlide < 0) lightboxSlide = 0;
  if (lightboxSlide >= images.length) lightboxSlide = images.length - 1;

  modal.classList.remove("closing");
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");

  setTimeout(() => {
    updatePhotoLightbox();
  }, 60);
};

window.closePhotoLightbox = function() {
  const modal = document.getElementById("photoLightbox");

  if (!modal || !modal.classList.contains("active")) return;

  modal.classList.add("closing");

  setTimeout(() => {
    modal.classList.remove("active");
    modal.classList.remove("closing");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");

    currentSlide = lightboxSlide;
    updateGallery();
  }, 220);
};

window.changeLightboxSlide = function(step) {
  if (!images.length) return;

  lightboxSlide += step;

  if (lightboxSlide >= images.length) lightboxSlide = 0;
  if (lightboxSlide < 0) lightboxSlide = images.length - 1;

  updatePhotoLightbox();

  const modalImg = document.getElementById("photoLightboxImg");
  const arrow = step > 0
    ? document.querySelector(".photo-lightbox-next")
    : document.querySelector(".photo-lightbox-prev");

  if (modalImg) {
    modalImg.classList.remove("photo-swap");
    void modalImg.offsetWidth;
    modalImg.classList.add("photo-swap");
  }

  if (arrow) {
    arrow.classList.remove("arrow-pulse");
    void arrow.offsetWidth;
    arrow.classList.add("arrow-pulse");
  }
};

function bindGalleryOpenEvents() {
  const mainImg = document.getElementById("mainImg");

  if (!mainImg || mainImg.dataset.lightboxBound === "1") return;

  mainImg.dataset.lightboxBound = "1";

  mainImg.addEventListener("dblclick", () => {
    window.openPhotoLightbox(currentSlide);
  });

  mainImg.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      window.openPhotoLightbox(currentSlide);
    }
  });
}

window.changeSlide = function(step) {
  if (!images.length) return;

  currentSlide += step;

  if (currentSlide >= images.length) currentSlide = 0;
  if (currentSlide < 0) currentSlide = images.length - 1;

  updateGallery();
};

window.selectImage = function(index) {
  if (index < 0 || index >= images.length) return;

  currentSlide = index;
  updateGallery();
};

document.addEventListener("keydown", event => {
  if (isPhotoLightboxOpen()) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      window.changeLightboxSlide(1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      window.changeLightboxSlide(-1);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      window.closePhotoLightbox();
    }

    return;
  }

  if (event.key === "ArrowRight") window.changeSlide(1);
  if (event.key === "ArrowLeft") window.changeSlide(-1);
});

/* ================================
   CONTACT ACTIONS
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

window.startChat = async function(ownerId) {
  if (!currentUser) {
    alert("Для чату увійдіть у кабінет через Google.");
    return;
  }

  if (!ownerId) {
    alert("Власника обʼєкта не знайдено.");
    return;
  }

  try {
    const chatsQuery = query(
      collection(db, "chats"),
      where("users", "array-contains", currentUser.uid)
    );

    const snap = await getDocs(chatsQuery);

    let chatId = null;

    snap.forEach(chatDoc => {
      const data = chatDoc.data();

      if (
        Array.isArray(data.users) &&
        data.users.includes(ownerId) &&
        data.objectId === objectId
      ) {
        chatId = chatDoc.id;
      }
    });

    if (!chatId) {
      const newChat = await addDoc(collection(db, "chats"), {
        users: [currentUser.uid, ownerId],
        objectId,
        objectTitle: currentObject?.title || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      chatId = newChat.id;
    }

    window.location.href = `../chat.html?chatId=${encodeURIComponent(chatId)}`;
  } catch (error) {
    console.error("START CHAT ERROR:", error);
    alert("❌ Не вдалося відкрити чат.");
  }
};

/* ================================
   MAP
================================ */

function initMap(item) {
  const mapEl = document.getElementById("map");

  if (!mapEl) return;

  if (!window.google || !google.maps) {
    mapEl.innerHTML = "<p style='padding:16px;'>Карта тимчасово недоступна</p>";
    return;
  }

  const position = getPublicMapPosition(item);
  const privacy = getMapPrivacy(item);
  const displayMode = getMapDisplayMode(item);
  const radius = getMapDisplayRadius(item);

  const map = new google.maps.Map(mapEl, {
    center: position,
    zoom: privacy.hideExactLocation ? 14 : 15,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true
  });

  if (displayMode === "approximate_circle" || privacy.hideExactLocation) {
    new google.maps.Circle({
      strokeColor: "#e88912",
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: "#e88912",
      fillOpacity: 0.26,
      map,
      center: position,
      radius
    });

    return;
  }

  new google.maps.Marker({
    position,
    map,
    title: item?.title || "Обʼєкт нерухомості"
  });
}

/* ================================
   LOAD OBJECT
================================ */

async function loadObject() {
  if (!page) return;

  if (!objectId) {
    page.innerHTML = `
      <section class="object-hero-card">
        <h1>❌ Обʼєкт не знайдено</h1>
        <p>ID обʼєкта не передано в адресі сторінки.</p>
        <a class="btn" href="../index.html">Повернутися на головну</a>
      </section>
    `;
    return;
  }

  try {
    const objectRef = doc(db, "objects", objectId);
    const cached = sessionStorage.getItem(`object_${objectId}`);

if (cached) {
  const data = JSON.parse(cached);

  currentObject = data;
  images = getImages(data);

  renderObject(data);
  updateGallery();
}

    const snap = await getDoc(objectRef);

    if (!snap.exists()) {
      page.innerHTML = `
        <section class="object-hero-card">
          <h1>❌ Обʼєкт не знайдено</h1>
          <p>Можливо, оголошення було видалено або приховано.</p>
          <a class="btn" href="../index.html">Повернутися на головну</a>
        </section>
      `;
      return;
    }

    currentObject = {
      id: snap.id,
      ...snap.data()
    };
sessionStorage.setItem(
  `object_${objectId}`,
  JSON.stringify(currentObject)
);
    images = getImages(currentObject);
    currentSlide = 0;
    lightboxSlide = 0;

if (!sessionStorage.getItem(`viewed_${objectId}`)) {
  sessionStorage.setItem(`viewed_${objectId}`, "1");

  setTimeout(() => {
    updateDoc(objectRef, {
      views: increment(1),
      updatedAt: serverTimestamp()
    }).catch(() => {});
  }, 1000);
}

    renderObject(currentObject);
    updateGallery();

   setTimeout(() => {
  initMap(currentObject);
}, 1000);

    loadSimilarObjects(currentObject);
  } catch (error) {
    console.error("LOAD OBJECT ERROR:", error);

    page.innerHTML = `
      <section class="object-hero-card">
        <h1>❌ Помилка завантаження</h1>
        <p>Перевірте підключення Firebase або правила доступу.</p>
        <a class="btn" href="../index.html">Повернутися на головну</a>
      </section>
    `;
  }
}

/* ================================
   RENDER OBJECT
================================ */

function renderObject(item) {
  const title = escapeHtml(item.title || "Обʼєкт нерухомості");
  const price = formatPrice(item.price, item.dealType, item.rent?.pricePeriod || "");
  const area = item.area || "-";
  const address = getPublicAddress(item);
  const publicCadastralNumber = getPublicCadastralNumber(item);
  const mapNote = getMapNote(item);

  const description = escapeHtml(
    item.description || "Детальний опис обʼєкта буде додано найближчим часом."
  );

  const status = item.status === "sold" ? "Продано" : "Активне";
  const views = Number(item.views || 0) + 1;
  const createdDate = getCreatedDate(item);
  const ownerName = escapeHtml(item.ownerName || "Олег Іванчик");
  const ownerId = escapeAttribute(item.ownerId || "");

  const dealName = getDealTypeName(item.dealType);
  const propertyName = getPropertyTypeName(item.propertyType);
  const commercialName = getCommercialTypeName(item.commercialType);

  const thumbsHtml = images.map((src, index) => {
    const safeSrc = escapeAttribute(src);

    return `
      <img
        src="${safeSrc}"
        alt="Фото ${index + 1}"
        onclick="selectImage(${index})"
        class="${index === 0 ? "active" : ""}"
      >
    `;
  }).join("");

  const rentFeatures = buildRentFeatures(item);
  const typeFeatures = buildTypeFeatures(item);

  page.innerHTML = `
    <a class="back-link" href="../index.html#objects">← Назад до обʼєктів</a>

    <section class="object-hero-card">
      <div class="object-title-row">
        <div>
          <span class="section-label">АН «Райський Сад»</span>
          <h1>${title}</h1>

          <div class="status-line">
            <span class="pill">🏷️ ${escapeHtml(status)}</span>
            ${item.vip ? `<span class="pill">🔥 VIP</span>` : ""}
            <span class="pill">👁 ${views} переглядів</span>
          </div>
        </div>

        <div class="object-price">💰 ${escapeHtml(price)}</div>
      </div>

      <div class="gallery">
        <div class="gallery-main">
      <img id="mainImg" src="${escapeAttribute(images[0])}" alt="${title}" loading="lazy">

          <button class="gallery-btn left" type="button" onclick="changeSlide(-1)">‹</button>
          <button class="gallery-btn right" type="button" onclick="changeSlide(1)">›</button>

          <div id="counter" class="counter">1 / ${images.length}</div>
        </div>

       <div class="thumbs-wrapper">
  <button class="thumbs-nav left" onclick="scrollThumbs(-1)">‹</button>

  <div class="thumbs" id="thumbsContainer">
    ${thumbsHtml}
  </div>

  <button class="thumbs-nav right" onclick="scrollThumbs(1)">›</button>
</div>
      </div>
    </section>

    <section class="object-info-grid">
      <div class="object-box">
        <h2>Інформація про обʼєкт</h2>

        <div class="feature-grid">
          ${feature("Тип угоди", dealName)}
          ${feature("Тип нерухомості", propertyName)}
          ${item.propertyType === "commercial" && commercialName ? feature("Підтип комерції", commercialName) : ""}
          ${feature("Ціна", price)}
          ${feature("Площа", area)}
          ${feature("Локація", address)}
          ${publicCadastralNumber ? feature("Кадастровий номер", publicCadastralNumber) : ""}
          ${feature("Дата додавання", createdDate)}
          ${rentFeatures}
          ${typeFeatures}
        </div>

        <h3 style="margin-top: 22px;">Опис</h3>
        <p class="object-description">${description}</p>
      </div>

      <aside class="seller-card">
        <h3>Звʼязок з компанією</h3>

        <p>
          <strong>${ownerName}</strong><br>
          Агенція нерухомості «Райський Сад»
        </p>

        <p>
          Допоможемо з переглядом, перевіркою документів,
          переговорами та повним супроводом угоди.
        </p>

        <p><strong>Телефон:</strong> ${COMPANY_PHONE_VISIBLE}</p>

        <div class="seller-actions">
          <button class="cta-big" type="button" onclick="callCompany()">📞 Подзвонити</button>
          <button class="cta-outline" type="button" onclick="openTelegram()">✈️ Telegram</button>
          <button class="cta-outline" type="button" onclick="openViber()">💜 Viber</button>
          <button class="btn" type="button" onclick="startChat('${ownerId}')">💬 Чат з продавцем</button>
        </div>
      </aside>
    </section>

    <section class="object-box">
      <h2>Локація на карті</h2>
      <p class="map-note">${escapeHtml(mapNote)}</p>
      <div id="map" class="map-box"></div>
    </section>

    <section class="object-box">
      <h2>Схожі обʼєкти</h2>
      <div id="similarGrid" class="similar-grid">
        <p>Завантаження схожих обʼєктів...</p>
      </div>
    </section>
  `;
}

/* ================================
   SIMILAR OBJECTS
================================ */

async function loadSimilarObjects(item) {
  const similarGrid = document.getElementById("similarGrid");

  if (!similarGrid) return;

  try {
    const q = query(
      collection(db, "objects"),
      where("status", "==", "active"),
      limit(6)
    );

    const snap = await getDocs(q);

    const objects = snap.docs
      .map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      .filter(obj => obj.id !== item.id)
      .slice(0, 4);

    if (!objects.length) {
      similarGrid.innerHTML = "<p>Схожі обʼєкти поки відсутні.</p>";
      return;
    }

    similarGrid.innerHTML = objects.map(obj => {
      const image = escapeAttribute(getMainImage(obj));
      const title = escapeHtml(obj.title || "Без назви");
      const area = escapeHtml(obj.area || "-");
      const price = formatPrice(obj.price, obj.dealType, obj.rent?.pricePeriod || "");

      const dealName = escapeHtml(getDealTypeName(obj.dealType));
      const propertyName = escapeHtml(getPropertyTypeName(obj.propertyType));

      return `
        <a class="similar-card" href="object.html?id=${escapeAttribute(obj.id)}">
        <img src="${image}" alt="${title}" loading="lazy">

          <div>
            <strong>${title}</strong>
            <p>🔑 ${dealName}</p>
            <p>🏷️ ${propertyName}</p>
            <p>📐 ${area}</p>
            <p>💰 ${escapeHtml(price)}</p>
          </div>
        </a>
      `;
    }).join("");
  } catch (error) {
    console.error("SIMILAR ERROR:", error);
    similarGrid.innerHTML = "<p>Не вдалося завантажити схожі обʼєкти.</p>";
  }
}

loadObject();
