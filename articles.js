import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query, 
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
   LOCAL ARTICLES
   Статті, які є окремими HTML-файлами на сайті
================================ */

const localArticles = [
  {
    id: "staryi-derzhavnyi-akt-kadastrovyi-nomer-2026",
    title: "Старий державний акт на землю: як присвоїти кадастровий номер у 2026 році",
    excerpt: "Пояснюємо, навіщо потрібен кадастровий номер, як внести стару земельну ділянку до ДЗК і які документи потрібні власнику.",
    category: "Документи",
    dateText: "15.06.2026",
    dateSort: new Date("2026-06-15").getTime(),
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80",
    url: "kadastr-2026.html",
    content: "старий державний акт земля кадастровий номер ДЗК Держгеокадастр технічна документація землеустрій земельна ділянка документи реєстрація права власності ДРРП витяг з ДЗК межі ділянки"
  },
    {
    id: "yak-obraty-kvartyru-v-irpeni-ta-buchi",
    title: "Як обрати квартиру в Ірпені або будинок у Бучі: аналіз площі, планування та комфортності",
    excerpt: "Практичний аналіз квадратних метрів, планувань, розташування та комфортності сучасного житла в Ірпені, Бучі та Київській області.",
    category: "Поради покупцю",
    dateText: "08.07.2026",
    dateSort: new Date("2026-07-08").getTime(),
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80",
    url: "yak-obraty-kvartyru-v-irpeni-ta-buchi.html",
    content: "нерухомість Ірпінь нерухомість Буча купити квартиру в Ірпені купити будинок у Бучі планування квартири комфортне житло"
  }
];

/* ================================
   STATE
================================ */

let allArticles = [];
let filteredArticles = [];

const articlesGrid = document.getElementById("articlesGrid");
const articleSearch = document.getElementById("articleSearch");
const categoryFilter = document.getElementById("categoryFilter");

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

function getDateValue(item) {
  if (item.dateSort) {
    return Number(item.dateSort);
  }

  if (item.createdAt?.seconds) {
    return item.createdAt.seconds * 1000;
  }

  if (item.updatedAt?.seconds) {
    return item.updatedAt.seconds * 1000;
  }

  return 0;
}

function formatDate(item) {
  if (item.dateText) {
    return item.dateText;
  }

  const value = getDateValue(item);

  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function getArticleImage(item) {
  if (item.image) {
    return item.image;
  }

  return "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80";
}

function getArticleUrl(item) {
  if (item.url) {
    return item.url;
  }

  if (item.slug) {
    return `article.html?slug=${encodeURIComponent(item.slug)}`;
  }

  return `article.html?id=${encodeURIComponent(item.id)}`;
}

/* ================================
   LOAD ARTICLES
================================ */

async function loadArticles() {
  if (!articlesGrid) return;

  try {
    const articlesQuery = query(
      collection(db, "articles"),
      where("status", "==", "published")
    );

    const snap = await getDocs(articlesQuery);

    const firebaseArticles = snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    allArticles = [
      ...localArticles,
      ...firebaseArticles
    ].sort((a, b) => getDateValue(b) - getDateValue(a));

    filteredArticles = [...allArticles];
    renderArticles(filteredArticles);
  } catch (error) {
    console.error("LOAD ARTICLES ERROR:", error);

    allArticles = [...localArticles];
    filteredArticles = [...allArticles];

    renderArticles(filteredArticles);
  }
}

/* ================================
   FILTERS
================================ */

function applyFilters() {
  const search = articleSearch ? articleSearch.value.trim().toLowerCase() : "";
  const category = categoryFilter ? categoryFilter.value : "all";

  filteredArticles = allArticles.filter(item => {
    const title = String(item.title || "").toLowerCase();
    const excerpt = String(item.excerpt || "").toLowerCase();
    const content = String(item.content || "").toLowerCase();
    const itemCategory = String(item.category || "");

    const matchesSearch =
      !search ||
      title.includes(search) ||
      excerpt.includes(search) ||
      content.includes(search);

    const matchesCategory =
      category === "all" || itemCategory === category;

    return matchesSearch && matchesCategory;
  });

  renderArticles(filteredArticles);
}

/* ================================
   RENDER
================================ */

function renderArticles(data) {
  if (!articlesGrid) return;

  if (!data.length) {
    articlesGrid.innerHTML = `
      <div class="empty-articles">
        <h2>Статей не знайдено</h2>
        <p>Спробуйте змінити пошук або обрати іншу категорію.</p>
      </div>
    `;
    return;
  }

  articlesGrid.innerHTML = data.map(item => {
    const title = escapeHtml(item.title || "Без назви");
    const excerpt = escapeHtml(item.excerpt || "Короткий опис статті буде додано пізніше.");
    const category = escapeHtml(item.category || "Стаття");
    const image = escapeAttribute(getArticleImage(item));
    const url = escapeAttribute(getArticleUrl(item));
    const date = escapeHtml(formatDate(item));

    return `
      <a class="article-card" href="${url}">
        <div class="article-card-img">
          <img src="${image}" alt="${title}">
        </div>

        <div class="article-card-body">
          <span class="article-category">${category}</span>
          <h2>${title}</h2>
          <p>${excerpt}</p>
          <div class="article-meta">📅 ${date}</div>
        </div>
      </a>
    `;
  }).join("");
} 

/* ================================
   EVENTS
================================ */

if (articleSearch) {
  articleSearch.addEventListener("input", applyFilters);
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", applyFilters);
}

/* ================================
   START
================================ */

loadArticles();
