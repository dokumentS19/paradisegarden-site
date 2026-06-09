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

/* ================================
   STATE
================================ */

const objectId = new URLSearchParams(window.location.search).get("id");

let currentUser = null;
let currentObject = null;
let images = [];
let currentSlide = 0;

/* ================================
   CONTACTS
================================ */

const COMPANY_PHONE_VISIBLE = "0953777196";
const COMPANY_PHONE_TEL = "+380953777196";

/*
  Замініть your_bot_username на username Вашого Telegram-бота.
  Наприклад:
  const TELEGRAM_LINK = "https://t.me/RaiskiySadBot";
*/
const TELEGRAM_LINK = "https://t.me/your_bot_username";

const VIBER_LINK = "viber://chat?number=%2B380953777196";

/* ================================
   DOM
================================ */

const page = document.getElementById("objectPage");

/* ================================
   AUTH
================================ */

onAuthStateChanged(auth, user => {
  currentUser = user;
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

function formatPrice(value) {
  const n = Number(value);

  if (!Number.isFinite(n) || n <= 0) {
    return "-";
  }

  return new Intl.NumberFormat("uk-UA").format(n);
}

function getMainImage(item) {
  if (Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
    return item.images[0];
  }

  return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";
}

function getImages(item) {
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images.slice(0, 10);
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

/* ================================
   GALLERY
================================ */

function updateGallery() {
  const mainImg = document.getElementById("mainImg");
  const counter = document.getElementById("counter");

  if (mainImg) {
    mainImg.src = images[currentSlide] || getMainImage(currentObject || {});
  }

  if (counter) {
    counter.textContent = `${currentSlide + 1} / ${images.length}`;
  }

  document.querySelectorAll(".thumbs img").forEach((img, index) => {
    img.classList.toggle("active", index === currentSlide);
  });
}

window.changeSlide = function(step) {
  if (!images.length) return;

  currentSlide += step;

  if (currentSlide >= images.length) {
    currentSlide = 0;
  }

  if (currentSlide < 0) {
    currentSlide = images.length - 1;
  }

  updateGallery();
};

window.selectImage = function(index) {
  if (index < 0 || index >= images.length) return;

  currentSlide = index;
  updateGallery();
};

document.addEventListener("keydown", event => {
  if (event.key === "ArrowRight") {
    window.changeSlide(1);
  }

  if (event.key === "ArrowLeft") {
    window.changeSlide(-1);
  }
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

/* ================================
   CHAT
================================ */

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

      if (Array.isArray(data.users) && data.users.includes(ownerId)) {
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

function initMap(lat, lng) {
  const mapEl = document.getElementById("map");

  if (!mapEl) return;

  if (!window.google || !google.maps) {
    mapEl.innerHTML = "<p style='padding:16px;'>Карта тимчасово недоступна</p>";
    return;
  }

  const position = {
    lat: Number(lat || 50.5215),
    lng: Number(lng || 30.2506)
  };

  const map = new google.maps.Map(mapEl, {
    center: position,
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true
  });

  new google.maps.Marker({
    position,
    map,
    title: currentObject?.title || "Обʼєкт нерухомості"
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

    images = getImages(currentObject);
    currentSlide = 0;

    await updateDoc(objectRef, {
      views: increment(1),
      updatedAt: serverTimestamp()
    });

    renderObject(currentObject);
    updateGallery();

    setTimeout(() => {
      initMap(currentObject.lat, currentObject.lng);
    }, 300);

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
  const price = formatPrice(item.price);
  const area = escapeHtml(item.area || "-");
  const address = escapeHtml(item.address || "Київ та Київська область");
  const description = escapeHtml(item.description || "Детальний опис обʼєкта буде додано найближчим часом.");
  const status = item.status === "sold" ? "Продано" : "Активне";
  const views = Number(item.views || 0) + 1;
  const createdDate = getCreatedDate(item);
  const ownerName = escapeHtml(item.ownerName || "АН «Райський Сад»");
  const ownerId = escapeHtml(item.ownerId || "");

  const thumbsHtml = images.map((src, index) => {
    return `
      <img
        src="${escapeHtml(src)}"
        alt="Фото ${index + 1}"
        onclick="selectImage(${index})"
        class="${index === 0 ? "active" : ""}"
      >
    `;
  }).join("");

  page.innerHTML = `
    <a class="back-link" href="../index.html">← Назад до обʼєктів</a>

    <section class="object-hero-card">
      <div class="object-title-row">
        <div>
          <span class="section-label">АН «Райський Сад»</span>
          <h1>${title}</h1>

          <div class="status-line">
            <span class="pill">🏷️ ${status}</span>
            ${item.vip ? `<span class="pill">🔥 VIP</span>` : ""}
            <span class="pill">👁 ${views} переглядів</span>
          </div>
        </div>

        <div class="object-price">💰 ${price} $</div>
      </div>

      <div class="gallery">
        <div class="gallery-main">
          <img id="mainImg" src="${escapeHtml(images[0])}" alt="${title}">

          <button class="gallery-btn left" type="button" onclick="changeSlide(-1)">‹</button>
          <button class="gallery-btn right" type="button" onclick="changeSlide(1)">›</button>

          <div id="counter" class="counter">1 / ${images.length}</div>
        </div>

        <div class="thumbs">
          ${thumbsHtml}
        </div>
      </div>
    </section>

    <section class="object-info-grid">
      <div class="object-box">
        <h2>Інформація про обʼєкт</h2>

        <div class="feature-grid">
          <div class="feature">
            <small>Ціна</small>
            <strong>${price} $</strong>
          </div>

          <div class="feature">
            <small>Площа</small>
            <strong>${area}</strong>
          </div>

          <div class="feature">
            <small>Локація</small>
            <strong>${address}</strong>
          </div>

          <div class="feature">
            <small>Дата додавання</small>
            <strong>${createdDate}</strong>
          </div>
        </div>

        <h3 style="margin-top: 24px;">Опис</h3>
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
      const image = getMainImage(obj);

      return `
       <a class="similar-card" href="object.html?id=${obj.id}">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(obj.title || "Обʼєкт")}">

          <div>
            <strong>${escapeHtml(obj.title || "Без назви")}</strong>
            <p>📐 ${escapeHtml(obj.area || "-")}</p>
            <p>💰 ${formatPrice(obj.price)} $</p>
          </div>
        </a>
      `;
    }).join("");
  } catch (error) {
    console.error("SIMILAR ERROR:", error);
    similarGrid.innerHTML = "<p>Не вдалося завантажити схожі обʼєкти.</p>";
  }
}

/* ================================
   START
================================ */

loadObject();
