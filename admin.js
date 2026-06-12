import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
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

const allowedEmails = [
  "olegivanchik1234@gmail.com",
  "rad202331@gmail.com"
];

let currentUser = null;
let selectedFiles = [];

const fileInput = document.getElementById("file");
const preview = document.getElementById("preview");
const loginBtn = document.getElementById("loginBtn");
const userInfo = document.getElementById("userInfo");
const progressBox = document.getElementById("progressBox");

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
  if (raw === "") return null;

  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function checked(id) {
  return Boolean($(id)?.checked);
}

function selectedCheckboxes(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map(input => input.value);
}

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

window.toggleFormFields = function() {
  const dealType = value("dealType") || "sale";
  const propertyType = value("propertyType") || "apartment";
  const commercialType = value("commercialType");

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
    if (el) el.classList.remove("active");
  });

  if (dealType === "rent") {
    $("rentFields")?.classList.add("active");
  }

  if (propertyType === "apartment") {
    $("apartmentFields")?.classList.add("active");
  }

  if (propertyType === "house") {
    $("houseFields")?.classList.add("active");
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

    if (file.size > 10 * 1024 * 1024) {
      alert(`Фото "${file.name}" більше 10 МБ. Зменшіть розмір фото.`);
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
  if (dealType !== "rent") return null;

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
    exactStreet: value("exactStreet"),
    exactHouseNumber: value("exactHouseNumber"),
    exactApartmentNumber: value("exactApartmentNumber"),
    cadastralNumber: value("cadastralNumber"),
    ownerContacts: value("ownerContacts"),
    internalComment: value("internalComment")
  };
}

function buildAreaLabel(propertyType, data) {
  if (propertyType === "apartment") {
    const total = data.apartment?.totalArea;
    return total ? `${total} м²` : "-";
  }

  if (propertyType === "house") {
    const houseArea = data.house?.houseArea;
    const landArea = data.house?.landArea;

    if (houseArea && landArea) return `${houseArea} м² / ${landArea} сот.`;
    if (houseArea) return `${houseArea} м²`;
    if (landArea) return `${landArea} сот.`;

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

window.addObject = async function(event) {
  if (event) event.preventDefault();

  if (!currentUser) {
    alert("Спочатку увійдіть через Google акаунтом адміністратора.");
    return;
  }

  const title = value("title");
  const price = numberValue("price");
  const address = value("address");
  const description = value("description");

  const dealType = value("dealType") || "sale";
  const propertyType = value("propertyType") || "apartment";
  const commercialType = propertyType === "commercial" ? value("commercialType") : "";

  const latRaw = value("lat");
  const lngRaw = value("lng");

  const vip = checked("vip");
  const sold = checked("sold");

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

  if (propertyType === "commercial" && !commercialType) {
    alert("Виберіть підтип комерції.");
    return;
  }

  if (!validateFiles(selectedFiles)) {
    return;
  }

  const dataByType = {
    rent: buildRentData(dealType),
    apartment: propertyType === "apartment" ? buildApartmentData() : null,
    house: propertyType === "house" ? buildHouseData() : null,
    land: propertyType === "land" ? buildLandData() : null,
    garage: propertyType === "garage" ? buildGarageData() : null,
    commercial: propertyType === "commercial" ? buildCommercialData() : null,
    privateData: buildPrivateData()
  };

  const area = buildAreaLabel(propertyType, dataByType);

  try {
    showProgress(true);

    const imageUrls = [];

    for (const file of selectedFiles) {
      const safeName = file.name.replace(/[^\wа-яА-ЯіїєґІЇЄҐ.-]/g, "_");
      const fileName = `${Date.now()}_${crypto.randomUUID()}_${safeName}`;
      const storageRef = ref(storage, `objects/${currentUser.uid}/${fileName}`);

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);
      imageUrls.push(url);
    }

    const payload = {
      title,
      area,
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
    };

    if (dataByType.rent) payload.rent = dataByType.rent;
    if (dataByType.apartment) payload.apartment = dataByType.apartment;
    if (dataByType.house) payload.house = dataByType.house;
    if (dataByType.land) payload.land = dataByType.land;
    if (dataByType.garage) payload.garage = dataByType.garage;
    if (dataByType.commercial) payload.commercial = dataByType.commercial;
    payload.privateData = dataByType.privateData;

    await addDoc(collection(db, "objects"), payload);

    alert("✅ Обʼєкт успішно створено!");

    clearForm();
  } catch (error) {
    console.error("ADD OBJECT ERROR:", error);
    alert("❌ Помилка створення обʼєкта. Перевірте Firebase Storage / Firestore правила.");
  } finally {
    showProgress(false);
  }
};

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

  if ($("dealType")) $("dealType").value = "sale";
  if ($("propertyType")) $("propertyType").value = "apartment";
  if ($("rentPeriod")) $("rentPeriod").value = "month";
  if ($("utilitiesIncluded")) $("utilitiesIncluded").value = "not_included";

  selectedFiles = [];

  if (preview) {
    preview.innerHTML = "";
  }

  toggleFormFields();
};

toggleFormFields();
