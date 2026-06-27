import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider("6LcLfi0tAAAAAPVIK-0xOrVII9xWPwPmWTNpJoZn"),
  isTokenAutoRefreshEnabled: true
});
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

/* ================================
   STATE
================================ */

let currentUser = null;
let selectedFiles = [];
let currentImageUrls = [];
let editObjectId = null;
let editLoaded = false;

let adminMap = null;
let adminMarker = null;
let adminCircle = null;
let adminGeocoder = null;

/* ================================
   DOM
================================ */

const fileInput = document.getElementById("file");
const preview = document.getElementById("preview");
const loginBtn = document.getElementById("loginBtn");
const userInfo = document.getElementById("userInfo");
const progressBox = document.getElementById("progressBox");

const photoManager = document.getElementById("photoManager");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");

const urlParams = new URLSearchParams(window.location.search);
editObjectId = urlParams.get("edit");

/* ================================
   HELPERS
================================ */

function isAllowedAdmin(user) {
  return Boolean(user && allowedEmails.includes(user.email));
}

function $(id) {
  return document.getElementById(id);
}

function value(id) {
  return $(id)?.value?.trim() || "";
}

function numberValue(id) {
  const raw = value(id);

  if (raw === "") {
    return null;
  }

  const n = Number(raw);

  return Number.isFinite(n) ? n : null;
}

function checked(id) {
  return Boolean($(id)?.checked);
}

function setValue(id, newValue) {
  const el = $(id);

  if (!el) {
    return;
  }

  el.value = newValue ?? "";
}

function setChecked(id, newValue) {
  const el = $(id);

  if (!el) {
    return;
  }

  el.checked = Boolean(newValue);
}

function selectedCheckboxes(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map(input => input.value);
}

function setCheckboxes(name, values = []) {
  const selected = Array.isArray(values) ? values : [];

  document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
    input.checked = selected.includes(input.value);
  });
}

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

function showProgress(show) {
  if (!progressBox) {
    return;
  }

  progressBox.classList.toggle("active", Boolean(show));
}

/* ================================
   MAP / ADDRESS / PRIVACY
================================ */

function makePublicAddress(fullAddress, hideHouseNumber) {
  const clean = String(fullAddress || "").trim();

  if (!clean) {
    return "";
  }

  if (!hideHouseNumber) {
    return clean;
  }

  return clean
    .replace(/,\s*\d+[a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9\/\-\s]*\s*(?=,|$)/u, "")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function getApproximateLocation(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);

  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) {
    return {
      lat: 50.5215,
      lng: 30.2506
    };
  }

  return {
    lat: Number((nLat + 0.0012).toFixed(7)),
    lng: Number((nLng + 0.0012).toFixed(7))
  };
}

function getFullAddressForMap() {
  const fullAddress = value("fullAddress");

  if (fullAddress) {
    return fullAddress;
  }

  const parts = [
    value("exactStreet"),
    value("exactHouseNumber"),
    value("address")
  ].filter(Boolean);

  return parts.join(", ");
}

function prepareAddressForGoogle(rawAddress) {
  let address = String(rawAddress || "").trim();

  if (!address) {
    return "";
  }

  const lower = address.toLowerCase();

  const hasUkraine =
    lower.includes("україна") ||
    lower.includes("ukraine");

  const hasRegion =
    lower.includes("київська") ||
    lower.includes("киевская") ||
    lower.includes("kyiv");

  const hasKnownCity =
    lower.includes("ірпінь") ||
    lower.includes("ирпень") ||
    lower.includes("буча") ||
    lower.includes("гостомель") ||
    lower.includes("ворзель") ||
    lower.includes("київ") ||
    lower.includes("киев");

  if (!hasKnownCity) {
    const publicLocation = value("address");

    if (publicLocation) {
      address += `, ${publicLocation}`;
    } else {
      address += ", Ірпінь";
    }
  }

  if (!hasRegion) {
    address += ", Київська область";
  }

  if (!hasUkraine) {
    address += ", Україна";
  }

  return address;
}

function updateMapPrivacyView() {
  if (!adminMap || !adminMarker || !window.google || !google.maps) {
    return;
  }

  const lat = numberValue("lat") || 50.5215;
  const lng = numberValue("lng") || 30.2506;

  const position = {
    lat,
    lng
  };

  const hideExactLocation = checked("hideExactLocation");

  adminMarker.setPosition(position);

  if (adminCircle) {
    adminCircle.setMap(null);
    adminCircle = null;
  }

  if (hideExactLocation) {
    adminMarker.setVisible(false);

    adminCircle = new google.maps.Circle({
      strokeColor: "#e88912",
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: "#e88912",
      fillOpacity: 0.25,
      map: adminMap,
      center: position,
      radius: 200
    });
  } else {
    adminMarker.setVisible(true);
  }
}

function initAdminMap() {
  if (adminMap) {
    return;
  }

  const mapEl = $("adminMap");
  if (!mapEl || !window.google || !google.maps) {
    return;
  }

  const startPosition = {
    lat: numberValue("lat") || 50.5215,
    lng: numberValue("lng") || 30.2506
  };

  if (!value("lat")) {
    setValue("lat", startPosition.lat);
  }

  if (!value("lng")) {
    setValue("lng", startPosition.lng);
  }

  adminGeocoder = new google.maps.Geocoder();

  adminMap = new google.maps.Map(mapEl, {
    center: startPosition,
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true
  });

  adminMarker = new google.maps.Marker({
    position: startPosition,
    map: adminMap,
    draggable: true,
    title: "Перетягніть прапорець для уточнення місця"
  });

  adminMarker.addListener("dragend", event => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    setValue("lat", lat);
    setValue("lng", lng);

    updateMapPrivacyView();
  });

  $("findAddressBtn")?.addEventListener("click", findAddressOnAdminMap);
  $("useMyLocationBtn")?.addEventListener("click", useUserGeolocationOnAdminMap);
  $("hideExactLocation")?.addEventListener("change", updateMapPrivacyView);

  $("lat")?.addEventListener("change", () => {
    const lat = numberValue("lat");
    const lng = numberValue("lng");

    if (lat && lng) {
      adminMap.setCenter({ lat, lng });
      updateMapPrivacyView();
    }
  });

  $("lng")?.addEventListener("change", () => {
    const lat = numberValue("lat");
    const lng = numberValue("lng");

    if (lat && lng) {
      adminMap.setCenter({ lat, lng });
      updateMapPrivacyView();
    }
  });

  updateMapPrivacyView();
}

function findAddressOnAdminMap() {
  if (!adminGeocoder) {
    if (window.google && google.maps) {
      adminGeocoder = new google.maps.Geocoder();
    } else {
      alert("Карта ще не завантажилась. Спробуйте через кілька секунд.");
      return;
    }
  }

  const rawAddress = getFullAddressForMap();

  if (!rawAddress) {
    alert("Введіть адресу для пошуку на карті.");
    return;
  }

  const searchAddress = prepareAddressForGoogle(rawAddress);
  const btn = $("findAddressBtn");

  if (btn) {
    btn.disabled = true;
    btn.textContent = "🔎 Шукаємо адресу...";
  }

  adminGeocoder.geocode(
    {
      address: searchAddress,
      region: "UA",
      componentRestrictions: {
        country: "UA"
      }
    },
    (results, status) => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "📍 Показати адресу на карті";
      }

      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        setValue("lat", lat);
        setValue("lng", lng);

        if (adminMap) {
          adminMap.setCenter(location);
          adminMap.setZoom(16);
        }

        updateMapPrivacyView();

        if (checked("hideExactLocation")) {
          alert("✅ Адресу знайдено. Увімкнена приватність, тому на карті показується кольорова область, а не точна мітка.");
        } else {
          alert("✅ Адресу знайдено. Координати оновлено.");
        }

        return;
      }

      let message = "Адресу не знайдено. Перетягніть прапорець вручну на карті.";

      if (status === "ZERO_RESULTS") {
        message = "Адресу не знайдено. Спробуйте ввести повніше: місто, вулиця, номер будинку, Київська область, Україна.";
      }

      if (status === "REQUEST_DENIED") {
        message = "Google відхилив запит. Перевірте, чи увімкнено Geocoding API для ключа Google Maps.";
      }

      if (status === "OVER_QUERY_LIMIT") {
        message = "Перевищено ліміт запитів Google Maps. Спробуйте пізніше.";
      }

      if (status === "INVALID_REQUEST") {
        message = "Некоректний запит адреси. Перевірте, чи поле адреси не порожнє.";
      }

      alert(`❌ ${message}\n\nСтатус Google: ${status}`);
    }
  );
}

function useUserGeolocationOnAdminMap() {
  if (!navigator.geolocation) {
    alert("Ваш браузер не підтримує геолокацію.");
    return;
  }

  const btn = $("useMyLocationBtn");

  if (btn) {
    btn.disabled = true;
    btn.textContent = "📡 Визначаємо місце...";
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setValue("lat", lat);
      setValue("lng", lng);

      const mapPosition = { lat, lng };

      if (adminMap) {
        adminMap.setCenter(mapPosition);
        adminMap.setZoom(16);
      }

      updateMapPrivacyView();

      if (btn) {
        btn.disabled = false;
        btn.textContent = "📡 Моє місце";
      }

      alert("✅ Геолокацію визначено. Координати оновлено.");
    },
    error => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "📡 Моє місце";
      }

      let message = "Не вдалося визначити Ваше місце.";

      if (error.code === error.PERMISSION_DENIED) {
        message = "Доступ до геолокації заборонено в браузері.";
      }

      if (error.code === error.POSITION_UNAVAILABLE) {
        message = "Геолокація зараз недоступна.";
      }

      if (error.code === error.TIMEOUT) {
        message = "Час очікування геолокації вийшов.";
      }

      alert(`❌ ${message}`);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function buildMapData() {
  const lat = numberValue("lat") || 50.5215;
  const lng = numberValue("lng") || 30.2506;

  const fullAddress = getFullAddressForMap();
  const hideHouseNumber = checked("hideHouseNumber");
  const hideExactLocation = checked("hideExactLocation");
  const hideCadastralNumber = checked("hideCadastralNumber");

  const publicAddress = value("address") || makePublicAddress(fullAddress, hideHouseNumber);
  const approximateLocation = getApproximateLocation(lat, lng);
  const cadastralNumber = value("cadastralNumber");

  return {
    addressFull: fullAddress,
    addressPublic: publicAddress,

    lat,
    lng,

    mapLocation: {
      lat,
      lng
    },

    publicMapLocation: hideExactLocation
      ? approximateLocation
      : {
          lat,
          lng
        },

    mapPrivacy: {
      hideHouseNumber,
      hideExactLocation,
      hideCadastralNumber
    },

    mapDisplay: {
      mode: hideExactLocation ? "approximate_circle" : "exact_marker",
      radius: hideExactLocation ? 200 : 0
    },

    cadastral: {
      number: cadastralNumber,
      publicNumber: hideCadastralNumber ? "" : cadastralNumber
    }
  };
}

/* ================================
   AUTH
================================ */

await setPersistence(auth, browserLocalPersistence);

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      alert("Помилка входу: " + error.message);
    }
  });
}

onAuthStateChanged(auth, user => {
  if (isAllowedAdmin(user)) {
    currentUser = user;

    if (userInfo) {
      const adminName = user.email === "olegivanchik1234@gmail.com"
        ? "Олег Іванчик"
        : "Адміністратор";

      userInfo.innerHTML = `👤 ${escapeHtml(adminName)}`;
    }

    if (loginBtn) {
      loginBtn.textContent = "Вийти";
    }

    loadObjectForEdit();

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

/* ================================
   FORM VISIBILITY
================================ */

window.toggleFormFields = function() {
  const dealType = value("dealType") || "sale";
  const propertyType = value("propertyType") || "apartment";

  const blocks = [
    "rentFields",
    "apartmentFields",
    "houseFields",
    "landFields",
    "garageFields",
    "commercialFields",
    "commercialTypeBox"
  ];

  blocks.forEach(id => {
    const el = $(id);

    if (el) {
      el.classList.remove("active");
    }
  });

  if (dealType === "rent") {
    $("rentFields")?.classList.add("active");
  }

 if (propertyType === "apartment" || propertyType === "room") {
  $("apartmentFields")?.classList.add("active");
}

  if (propertyType === "house" || propertyType === "dacha") {
    $("houseFields")?.classList.add("active");
  }

  const houseTitle = $("houseFieldsTitle");
  if (houseTitle) {
    houseTitle.textContent = propertyType === "dacha"
      ? "Характеристики дачі"
      : "Характеристики будинку";
  }

  if (propertyType === "land") {
    $("landFields")?.classList.add("active");
  }

  if (propertyType === "garage") {
    $("garageFields")?.classList.add("active");
  }

  if (propertyType === "commercial") {
    $("commercialTypeBox")?.classList.add("active");
    $("commercialFields")?.classList.add("active");
  }

  if (propertyType !== "commercial" && $("commercialType")) {
    $("commercialType").value = "";
  }
};

/* ================================
   FILES / PHOTO MANAGER
================================ */

function validateFiles(files) {
  if (files.length > 20) {
    alert("Можна додати максимум 20 фото.");
    return false;
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      alert(`Файл "${file.name}" не є зображенням.`);
      return false;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert(`Фото "${file.name}" більше 25 МБ. Виберіть менше фото.`);
      return false;
    }
  }

  return true;
}

function renderPhotoManager() {
  if (!photoManager) {
    return;
  }

  if (!currentImageUrls.length) {
    photoManager.innerHTML = `
      <div class="photo-empty">
        Поточних фото ще немає. Додайте нові фото нижче.
      </div>
    `;
    return;
  }

  photoManager.innerHTML = currentImageUrls.map((url, index) => `
    <div class="photo-manager-item">
      <div class="photo-manager-img">
        <img src="${escapeAttribute(url)}" alt="Фото ${index + 1}">
        ${index === 0 ? `<span class="photo-main-badge">⭐ Головне</span>` : ""}
      </div>

      <div class="photo-manager-actions">
        <button type="button" onclick="makeMainPhoto(${index})" ${index === 0 ? "disabled" : ""}>
          ⭐ Зробити головним
        </button>

        <button type="button" onclick="movePhotoLeft(${index})" ${index === 0 ? "disabled" : ""}>
          ⬅️ Вліво
        </button>

        <button type="button" onclick="movePhotoRight(${index})" ${index === currentImageUrls.length - 1 ? "disabled" : ""}>
          ➡️ Вправо
        </button>

        <button class="photo-delete-btn" type="button" onclick="removePhoto(${index})">
          🗑 Видалити
        </button>
      </div>
    </div>
  `).join("");
}

function renderNewFilesPreview() {
  if (!preview) {
    return;
  }

  preview.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = event => {
      const item = document.createElement("div");
      item.className = "preview-item";

      item.innerHTML = `
        <img src="${escapeAttribute(event.target.result)}" alt="Нове фото ${index + 1}">
        <span>+${index + 1}</span>
      `;

      preview.appendChild(item);
    };

    reader.readAsDataURL(file);
  });
}

window.makeMainPhoto = function(index) {
  if (index <= 0 || index >= currentImageUrls.length) {
    return;
  }

  const [photo] = currentImageUrls.splice(index, 1);
  currentImageUrls.unshift(photo);

  renderPhotoManager();
};

window.movePhotoLeft = function(index) {
  if (index <= 0 || index >= currentImageUrls.length) {
    return;
  }

  [currentImageUrls[index - 1], currentImageUrls[index]] =
    [currentImageUrls[index], currentImageUrls[index - 1]];

  renderPhotoManager();
};

window.movePhotoRight = function(index) {
  if (index < 0 || index >= currentImageUrls.length - 1) {
    return;
  }

  [currentImageUrls[index], currentImageUrls[index + 1]] =
    [currentImageUrls[index + 1], currentImageUrls[index]];

  renderPhotoManager();
};

window.removePhoto = function(index) {
  if (index < 0 || index >= currentImageUrls.length) {
    return;
  }

  if (!confirm("Видалити це фото з оголошення?")) {
    return;
  }

  currentImageUrls.splice(index, 1);

  renderPhotoManager();
};

if (fileInput) {
  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files || []);

    if (!validateFiles(files)) {
      fileInput.value = "";
      selectedFiles = [];
      renderNewFilesPreview();
      return;
    }

    if (currentImageUrls.length + files.length > 20) {
      alert("Разом можна мати максимум 20 фото на один обʼєкт.");
      fileInput.value = "";
      selectedFiles = [];
      renderNewFilesPreview();
      return;
    }

    selectedFiles = files;
    renderNewFilesPreview();
  });
}

/* ================================
   BUILD DATA
================================ */

function getPurposeData() {
  const raw = value("landPurpose");

  if (!raw) {
    return {
      purposeCode: "",
      purposeName: "",
      purposeNote: value("landPurposeNote")
    };
  }

  const [code, name] = raw.split("|");

  return {
    purposeCode: code || "",
    purposeName: name || "",
    purposeNote: value("landPurposeNote")
  };
}

function buildRentData(dealType) {
  if (dealType !== "rent") {
    return null;
  }

  return {
    pricePeriod: value("rentPeriod"),
    utilitiesIncluded: value("utilitiesIncluded"),
    deposit: numberValue("deposit"),
    commission: value("commission"),
    minTerm: value("minTerm"),
    availableFrom: value("availableFrom"),
    childrenAllowed: checked("childrenAllowed"),
    petsAllowed: checked("petsAllowed")
  };
}

function buildApartmentData() {
  return {
    totalArea: numberValue("apTotalArea"),
    livingArea: numberValue("apLivingArea"),
    kitchenArea: numberValue("apKitchenArea"),
    rooms: numberValue("apRooms"),
    floor: numberValue("apFloor"),
    floorsTotal: numberValue("apFloorsTotal"),
    layout: value("apLayout"),
    bathroomType: value("apBathroomType"),
    bathFeature: value("apBathFeature"),
    bathroomsCount: numberValue("apBathroomsCount"),
    balcony: value("apBalcony"),
    buildingType: value("apBuildingType"),
    buildYear: numberValue("apBuildYear"),
    elevator: value("apElevator"),
    heating: value("apHeating"),
    condition: value("apCondition"),
    furniture: value("apFurniture"),
    appliances: selectedCheckboxes("appliances")
  };
}

function buildHouseData() {
  return {
    houseType: value("houseType"),

    houseArea: numberValue("houseArea"),
    livingArea: numberValue("houseLivingArea"),
    kitchenArea: numberValue("houseKitchenArea"),
    landArea: numberValue("houseLandArea"),

    rooms: numberValue("houseRooms"),
    floors: numberValue("houseFloors"),

    walls: value("houseWalls"),
    documents: value("houseDocuments"),

    bathroomType: value("houseBathroomType"),
    bathFeature: value("houseBathFeature"),
    bathroomsCount: numberValue("houseBathroomsCount"),

    heating: value("houseHeating"),
    water: value("houseWater"),
    sewerage: value("houseSewerage"),

    electricity: checked("houseElectricity"),
    gas: checked("houseGas"),
    parking: checked("houseParking"),
    garageIncluded: checked("houseGarageIncluded"),

    condition: value("houseCondition")
  };
}

function buildLandData() {
  return {
    landArea: numberValue("landArea"),
    documents: value("landDocuments"),
    ...getPurposeData(),
    frontage: value("landFrontage"),
    utilitiesNearby: value("landUtilitiesNearby")
  };
}

function buildGarageData() {
  return {
    area: numberValue("garageArea"),
    garageType: value("garageType"),
    pit: checked("garagePit"),
    cellar: checked("garageCellar"),
    electricity: checked("garageElectricity"),
    security: checked("garageSecurity"),
    gateType: value("garageGateType"),
    condition: value("garageCondition")
  };
}

function buildCommercialData() {
  return {
    commercialType: value("commercialType"),
    area: numberValue("commercialArea"),
    floor: numberValue("commercialFloor"),
    floorsTotal: numberValue("commercialFloorsTotal"),
    rooms: numberValue("commercialRooms"),
    condition: value("commercialCondition"),
    layout: value("commercialLayout"),
    entrance: value("commercialEntrance"),
    bathroom: value("commercialBathroom"),
    heating: value("commercialHeating"),
    power: value("commercialPower"),
    internet: checked("commercialInternet"),
    parking: checked("commercialParking"),
    security: checked("commercialSecurity"),
    access24: checked("commercialAccess24")
  };
}

function buildPrivateData() {
  return {
    fullAddress: getFullAddressForMap(),
    exactStreet: value("exactStreet"),
    exactHouseNumber: value("exactHouseNumber"),
    exactApartmentNumber: value("exactApartmentNumber"),
    cadastralNumber: value("cadastralNumber"),
    hideHouseNumber: checked("hideHouseNumber"),
    hideExactLocation: checked("hideExactLocation"),
    hideCadastralNumber: checked("hideCadastralNumber"),
    ownerContacts: value("ownerContacts"),
    internalComment: value("internalComment")
  };
}

function buildAreaLabel(propertyType, data) {
  if (propertyType === "apartment") {
    const total = data.apartment?.totalArea;
    return total ? `${total} м²` : "-";
  }

  if (propertyType === "house" || propertyType === "dacha") {
    const houseArea = data.house?.houseArea;
    const landArea = data.house?.landArea;

    if (houseArea && landArea) {
      return `${houseArea} м² / ${landArea} сот.`;
    }

    if (houseArea) {
      return `${houseArea} м²`;
    }

    if (landArea) {
      return `${landArea} сот.`;
    }

    return "-";
  }

  if (propertyType === "land") {
    const landArea = data.land?.landArea;
    return landArea ? `${landArea} сот.` : "-";
  }

  if (propertyType === "garage") {
    const area = data.garage?.area;
    return area ? `${area} м²` : "-";
  }

  if (propertyType === "commercial") {
    const area = data.commercial?.area;
    return area ? `${area} м²` : "-";
  }

  return "-";
}

/* ================================
   IMAGE COMPRESSION
================================ */

async function compressImage(file, maxWidth = 1600, quality = 0.75) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onload = event => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (!blob) {
              resolve(file);
              return;
            }

            const originalName = file.name || "image.jpg";
            const compressedName = originalName.replace(/\.[^/.]+$/, ".jpg");

            const compressedFile = new File(
              [blob],
              compressedName,
              {
                type: "image/jpeg",
                lastModified: Date.now()
              }
            );

            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        resolve(file);
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}

/* ================================
   UPLOAD
================================ */

async function uploadSelectedFiles() {
  const imageUrls = [];

  for (const file of selectedFiles) {
    const compressedFile = await compressImage(file, 1600, 0.75);

    const safeName = compressedFile.name.replace(/[^\wа-яА-ЯіїєґІЇЄҐ.-]/g, "_");
    const fileName = `${Date.now()}_${crypto.randomUUID()}_${safeName}`;
    const storageRef = ref(storage, `objects/${currentUser.uid}/${fileName}`);

    await uploadBytes(storageRef, compressedFile, {
      contentType: compressedFile.type
    });

    const url = await getDownloadURL(storageRef);
    imageUrls.push(url);
  }

  return imageUrls;
}

/* ================================
   SAVE OBJECT
================================ */

window.addObject = async function(event) {
  if (event) {
    event.preventDefault();
  }

  if (!currentUser) {
    alert("Спочатку увійдіть через Google акаунтом адміністратора.");
    return;
  }

  const title = value("title");
  const price = numberValue("price");
  const description = value("description");

  const dealType = value("dealType") || "sale";
  const propertyType = value("propertyType") || "apartment";
  const commercialType = propertyType === "commercial" ? value("commercialType") : "";

  const vip = checked("vip");
  const sold = checked("sold");

  if (!title) {
    alert("Вкажіть назву обʼєкта.");
    return;
  }

  if (!price || price <= 0) {
    alert("Вкажіть коректну ціну.");
    return;
  }

  if (propertyType === "commercial" && !commercialType) {
    alert("Виберіть підтип комерції.");
    return;
  }

  if (!validateFiles(selectedFiles)) {
    return;
  }

  if (currentImageUrls.length + selectedFiles.length === 0) {
    alert("Додайте хоча б одне фото.");
    return;
  }

  if (currentImageUrls.length + selectedFiles.length > 20) {
    alert("Можна мати максимум 20 фото на один обʼєкт.");
    return;
  }

  const dataByType = {
    rent: buildRentData(dealType),
   apartment: (propertyType === "apartment" || propertyType === "room") ? buildApartmentData() : null,
    house: (propertyType === "house" || propertyType === "dacha") ? buildHouseData() : null,
    land: propertyType === "land" ? buildLandData() : null,
    garage: propertyType === "garage" ? buildGarageData() : null,
    commercial: propertyType === "commercial" ? buildCommercialData() : null,
    privateData: buildPrivateData()
  };

  const area = buildAreaLabel(propertyType, dataByType);

  try {
    showProgress(true);

    const uploadedImageUrls = await uploadSelectedFiles();
    const finalImageUrls = [...currentImageUrls, ...uploadedImageUrls];

    const mapData = buildMapData();

    const payload = {
      title,
      area,
      price,

      address: mapData.addressPublic || "",
      addressFull: mapData.addressFull || "",
      addressPublic: mapData.addressPublic || "",

      description: description || "",

      dealType,
      propertyType,
      commercialType,

      images: finalImageUrls,

      lat: mapData.lat,
      lng: mapData.lng,

      mapLocation: mapData.mapLocation,
      publicMapLocation: mapData.publicMapLocation,
      mapPrivacy: mapData.mapPrivacy,
      mapDisplay: mapData.mapDisplay,
      cadastral: mapData.cadastral,

      status: sold ? "sold" : "active",
      vip,

      updatedAt: serverTimestamp()
    };

    if (dataByType.rent) {
      payload.rent = dataByType.rent;
    }

    if (dataByType.apartment) {
      payload.apartment = dataByType.apartment;
    }

    if (dataByType.house) {
      payload.house = dataByType.house;
    }

    if (dataByType.land) {
      payload.land = dataByType.land;
    }

    if (dataByType.garage) {
      payload.garage = dataByType.garage;
    }

    if (dataByType.commercial) {
      payload.commercial = dataByType.commercial;
    }

    payload.privateData = dataByType.privateData;

    if (editObjectId) {
      await updateDoc(doc(db, "objects", editObjectId), payload);

      alert("✅ Обʼєкт успішно оновлено!");

      window.location.href = "dashboard.html";
      return;
    }

    await addDoc(collection(db, "objects"), {
      ...payload,

      ownerId: currentUser.uid,
      ownerName: "Олег Іванчик",
      ownerEmail: currentUser.email || "",

      views: 0,
      rating: 0,
      ratingCount: 0,

      createdAt: serverTimestamp()
    });

    alert("✅ Обʼєкт успішно створено!");

    clearForm();
  } catch (error) {
    console.error("SAVE OBJECT ERROR:", error);
    alert("❌ Помилка збереження обʼєкта. Перевірте Firebase Storage / Firestore правила.");
  } finally {
    showProgress(false);
  }
};

/* ================================
   LOAD OBJECT FOR EDIT
================================ */

async function loadObjectForEdit() {
  if (!editObjectId || editLoaded || !currentUser) {
    return;
  }

  try {
    showProgress(true);

    const snap = await getDoc(doc(db, "objects", editObjectId));

    if (!snap.exists()) {
      alert("Обʼєкт для редагування не знайдено.");
      window.location.href = "dashboard.html";
      return;
    }

    const data = snap.data();

    editLoaded = true;

    if (formTitle) {
      formTitle.textContent = "Редагувати обʼєкт нерухомості";
    }

    if (submitBtn) {
      submitBtn.textContent = "💾 Зберегти зміни";
    }

    if (fileInput) {
      fileInput.required = false;
    }

    setValue("title", data.title || "");
    setValue("dealType", data.dealType || "sale");
    setValue("propertyType", data.propertyType || "apartment");
    setValue("commercialType", data.commercialType || "");

    setValue("price", data.price ?? "");
    setValue("address", data.addressPublic || data.address || "");
    setValue("fullAddress", data.addressFull || data.privateData?.fullAddress || "");
    setValue("description", data.description || "");

    setValue("lat", data.mapLocation?.lat ?? data.lat ?? "");
    setValue("lng", data.mapLocation?.lng ?? data.lng ?? "");

    setChecked("hideHouseNumber", data.mapPrivacy?.hideHouseNumber ?? data.privateData?.hideHouseNumber ?? true);
    setChecked("hideExactLocation", data.mapPrivacy?.hideExactLocation ?? data.privateData?.hideExactLocation ?? true);
    setChecked("hideCadastralNumber", data.mapPrivacy?.hideCadastralNumber ?? data.privateData?.hideCadastralNumber ?? true);

    setChecked("vip", data.vip);
    setChecked("sold", data.status === "sold");

    if (data.rent) {
      setValue("rentPeriod", data.rent.pricePeriod || "month");
      setValue("utilitiesIncluded", data.rent.utilitiesIncluded || "not_included");
      setValue("deposit", data.rent.deposit ?? "");
      setValue("commission", data.rent.commission || "");
      setValue("minTerm", data.rent.minTerm || "");
      setValue("availableFrom", data.rent.availableFrom || "");
      setChecked("childrenAllowed", data.rent.childrenAllowed);
      setChecked("petsAllowed", data.rent.petsAllowed);
    }

    if (data.apartment) {
      setValue("apTotalArea", data.apartment.totalArea ?? "");
      setValue("apLivingArea", data.apartment.livingArea ?? "");
      setValue("apKitchenArea", data.apartment.kitchenArea ?? "");
      setValue("apRooms", data.apartment.rooms ?? "");
      setValue("apFloor", data.apartment.floor ?? "");
      setValue("apFloorsTotal", data.apartment.floorsTotal ?? "");
      setValue("apLayout", data.apartment.layout || "");
      setValue("apCondition", data.apartment.condition || "");
      setValue("apBathroomType", data.apartment.bathroomType || "");
      setValue("apBathFeature", data.apartment.bathFeature || "");
      setValue("apBathroomsCount", data.apartment.bathroomsCount ?? "");
      setValue("apBalcony", data.apartment.balcony || "");
      setValue("apBuildingType", data.apartment.buildingType || "");
      setValue("apHeating", data.apartment.heating || "");
      setValue("apBuildYear", data.apartment.buildYear ?? "");
      setValue("apElevator", data.apartment.elevator || "");
      setValue("apFurniture", data.apartment.furniture || "");
      setCheckboxes("appliances", data.apartment.appliances || []);
    }

    if (data.house) {
      setValue("houseType", data.house.houseType || "");
      setValue("houseCondition", data.house.condition || "");

      setValue("houseArea", data.house.houseArea ?? "");
      setValue("houseLivingArea", data.house.livingArea ?? "");
      setValue("houseKitchenArea", data.house.kitchenArea ?? "");
      setValue("houseLandArea", data.house.landArea ?? "");

      setValue("houseRooms", data.house.rooms ?? "");
      setValue("houseFloors", data.house.floors ?? "");

      setValue("houseWalls", data.house.walls || "");
      setValue("houseDocuments", data.house.documents || "");

      setValue("houseBathroomType", data.house.bathroomType || "");
      setValue("houseBathFeature", data.house.bathFeature || "");
      setValue("houseBathroomsCount", data.house.bathroomsCount ?? "");

      setValue("houseHeating", data.house.heating || "");
      setValue("houseWater", data.house.water || "");
      setValue("houseSewerage", data.house.sewerage || "");

      setChecked("houseElectricity", data.house.electricity);
      setChecked("houseGas", data.house.gas);
      setChecked("houseParking", data.house.parking);
      setChecked("houseGarageIncluded", data.house.garageIncluded);
    }

    if (data.land) {
      setValue("landArea", data.land.landArea ?? "");
      setValue("landDocuments", data.land.documents || "");

      if (data.land.purposeCode || data.land.purposeName) {
        setValue("landPurpose", `${data.land.purposeCode || ""}|${data.land.purposeName || ""}`);
      }

      setValue("landPurposeNote", data.land.purposeNote || "");
      setValue("landFrontage", data.land.frontage || "");
      setValue("landUtilitiesNearby", data.land.utilitiesNearby || "");
    }

    if (data.garage) {
      setValue("garageArea", data.garage.area ?? "");
      setValue("garageType", data.garage.garageType || "");
      setChecked("garagePit", data.garage.pit);
      setChecked("garageCellar", data.garage.cellar);
      setChecked("garageElectricity", data.garage.electricity);
      setChecked("garageSecurity", data.garage.security);
      setValue("garageGateType", data.garage.gateType || "");
      setValue("garageCondition", data.garage.condition || "");
    }

    if (data.commercial) {
      setValue("commercialType", data.commercial.commercialType || data.commercialType || "");
      setValue("commercialArea", data.commercial.area ?? "");
      setValue("commercialFloor", data.commercial.floor ?? "");
      setValue("commercialFloorsTotal", data.commercial.floorsTotal ?? "");
      setValue("commercialRooms", data.commercial.rooms ?? "");
      setValue("commercialCondition", data.commercial.condition || "");
      setValue("commercialLayout", data.commercial.layout || "");
      setValue("commercialEntrance", data.commercial.entrance || "");
      setValue("commercialBathroom", data.commercial.bathroom || "");
      setValue("commercialHeating", data.commercial.heating || "");
      setValue("commercialPower", data.commercial.power || "");
      setChecked("commercialInternet", data.commercial.internet);
      setChecked("commercialParking", data.commercial.parking);
      setChecked("commercialSecurity", data.commercial.security);
      setChecked("commercialAccess24", data.commercial.access24);
    }

    if (data.privateData) {
      setValue("exactStreet", data.privateData.exactStreet || "");
      setValue("exactHouseNumber", data.privateData.exactHouseNumber || "");
      setValue("exactApartmentNumber", data.privateData.exactApartmentNumber || "");
      setValue("cadastralNumber", data.privateData.cadastralNumber || data.cadastral?.number || "");
      setValue("ownerContacts", data.privateData.ownerContacts || "");
      setValue("internalComment", data.privateData.internalComment || "");
    } else {
      setValue("cadastralNumber", data.cadastral?.number || "");
    }

    currentImageUrls = Array.isArray(data.images)
      ? [...data.images]
      : [];

    toggleFormFields();
    renderPhotoManager();
    renderNewFilesPreview();

    setTimeout(() => {
      if (adminMap) {
        const editLat = numberValue("lat") || 50.5215;
        const editLng = numberValue("lng") || 30.2506;

        adminMap.setCenter({
          lat: editLat,
          lng: editLng
        });

        updateMapPrivacyView();
      }
    }, 400);
  } catch (error) {
    console.error("LOAD EDIT OBJECT ERROR:", error);
    alert("❌ Не вдалося завантажити обʼєкт для редагування.");
  } finally {
    showProgress(false);
  }
}

/* ================================
   CLEAR FORM
================================ */

window.clearForm = function() {
  document.querySelectorAll("input, textarea, select").forEach(el => {
    if (el.type === "checkbox") {
      el.checked = false;
      return;
    }

    if (el.type === "file") {
      el.value = "";
      return;
    }

    el.value = "";
  });

  if ($("dealType")) {
    $("dealType").value = "sale";
  }

  if ($("propertyType")) {
    $("propertyType").value = "apartment";
  }

  if ($("rentPeriod")) {
    $("rentPeriod").value = "month";
  }

  if ($("utilitiesIncluded")) {
    $("utilitiesIncluded").value = "not_included";
  }

  setChecked("hideHouseNumber", true);
  setChecked("hideExactLocation", true);
  setChecked("hideCadastralNumber", true);

  setValue("lat", 50.5215);
  setValue("lng", 30.2506);

  selectedFiles = [];
  currentImageUrls = [];

  if (preview) {
    preview.innerHTML = "";
  }

  renderPhotoManager();
  toggleFormFields();

  if (adminMap) {
    adminMap.setCenter({
      lat: 50.5215,
      lng: 30.2506
    });

    updateMapPrivacyView();
  }
};

/* ================================
   START
================================ */

toggleFormFields();
renderPhotoManager();

function startAdminMapWhenReady(retries = 40) {
  const mapEl = document.getElementById("adminMap");

  if (adminMap) {
    return;
  }

  if (mapEl && window.google && google.maps) {
    initAdminMap();
    console.log("✅ Адмін-карту ініціалізовано");
    return;
  }

  if (retries > 0) {
    setTimeout(() => {
      startAdminMapWhenReady(retries - 1);
    }, 300);
    return;
  }

  console.warn("⚠️ Google Maps не завантажилась або #adminMap не знайдено.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    startAdminMapWhenReady();
  });
} else {
  startAdminMapWhenReady();
}
