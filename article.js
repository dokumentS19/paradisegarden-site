import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp
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

const COMPANY_PHONE_TEL = "+380953777196";
const TELEGRAM_LINK = "https://t.me/paradisegarden_leads_bot";
const VIBER_LINK = "viber://chat?number=%2B380953777196";

const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const id = params.get("id");

const articleView = document.getElementById("articleView");

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
  if (item.createdAt?.seconds) {
    return item.createdAt.seconds * 1000;
  }

  if (item.updatedAt?.seconds) {
    return item.updatedAt.seconds * 1000;
  }

  return 0;
}

function formatDate(item) {
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

  return "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80";
}

function renderMarkdownLite(text = "") {
  const safe = escapeHtml(text);
  const lines = safe.split("\n");

  let html = "";
  let listOpen = false;

  function closeList() {
    if (listOpen) {
      html += "</ul>";
      listOpen = false;
    }
  }

  lines.forEach(line => {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      return;
    }

    if (trimmed.startsWith("### ")) {
      closeList();
      html += `<h3>${trimmed.slice(4)}</h3>`;
      return;
    }

    if (trimmed.startsWith("## ")) {
      closeList();
      html += `<h2>${trimmed.slice(3)}</h2>`;
      return;
    }

    if (trimmed.startsWith("# ")) {
      closeList();
      html += `<h2>${trimmed.slice(2)}</h2>`;
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      if (!listOpen) {
        html += "<ul>";
        listOpen = true;
      }

      html += `<li>${trimmed.slice(2)}</li>`;
      return;
    }

    closeList();
    html += `<p>${trimmed}</p>`;
  });

  closeList();

  return html;
}

async function getArticle() {
  if (id) {
    const ref = doc(db, "articles", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data();

    if (data.status !== "published") return null;

    return {
      id: snap.id,
      ref,
      ...data
    };
  }

  if (slug) {
    const articleQuery = query(
      collection(db, "articles"),
      where("slug", "==", slug),
      where("status", "==", "published"),
      limit(1)
    );

    const snap = await getDocs(articleQuery);

    if (snap.empty) return null;

    const docSnap = snap.docs[0];

    return {
      id: docSnap.id,
      ref: doc(db, "articles", docSnap.id),
      ...docSnap.data()
    };
  }

  return null;
}

async function loadArticle() {
  if (!articleView) return;

  try {
    const article = await getArticle();

    if (!article) {
      articleView.innerHTML = `
        <div class="article-content-wrap">
          <h1>❌ Статтю не знайдено</h1>
          <p class="article-excerpt">Можливо, матеріал видалено або ще не опубліковано.</p>
          <a class="btn" href="articles.html">До всіх статей</a>
        </div>
      `;
      return;
    }

    try {
      await updateDoc(article.ref, {
        views: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (viewsError) {
      console.warn("Article views update blocked:", viewsError);
    }

    renderArticle(article);
  } catch (error) {
    console.error("LOAD ARTICLE ERROR:", error);

    articleView.innerHTML = `
      <div class="article-content-wrap">
        <h1>❌ Помилка завантаження</h1>
        <p class="article-excerpt">Перевірте підключення Firebase або правила Firestore.</p>
        <a class="btn" href="articles.html">До всіх статей</a>
      </div>
    `;
  }
}

function renderArticle(article) {
  const title = escapeHtml(article.title || "Без назви");
  const excerpt = escapeHtml(article.excerpt || "");
  const category = escapeHtml(article.category || "Стаття");
  const image = escapeAttribute(getArticleImage(article));
  const date = escapeHtml(formatDate(article));
  const views = Number(article.views || 0) + 1;
  const content = renderMarkdownLite(article.content || "Текст статті буде додано пізніше.");

  document.title = `${article.title || "Стаття"} — АН «Райський Сад»`;

  const metaDescription = document.querySelector('meta[name="description"]');

  if (metaDescription && article.excerpt) {
    metaDescription.setAttribute("content", article.excerpt);
  }

  articleView.innerHTML = `
    <div class="article-hero-img">
      <img src="${image}" alt="${title}">
    </div>

    <div class="article-content-wrap">
      <div class="article-meta-line">
        <span class="article-pill">${category}</span>
        <span class="article-pill">📅 ${date}</span>
        <span class="article-pill">👁 ${views} переглядів</span>
      </div>

      <h1>${title}</h1>
      ${excerpt ? `<p class="article-excerpt">${excerpt}</p>` : ""}

      <div class="article-content">
        ${content}
      </div>
    </div>
  `;
}

window.callCompany = function() {
  window.location.href = `tel:${COMPANY_PHONE_TEL}`;
};

window.openTelegram = function() {
  window.open(TELEGRAM_LINK, "_blank", "noopener,noreferrer");
};

window.openViber = function() {
  window.location.href = VIBER_LINK;
};

loadArticle();
