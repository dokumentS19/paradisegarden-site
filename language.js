const languageSwitcher = document.getElementById("languageSwitcher");
const langToggle = document.getElementById("langToggle");
const currentLangLabel = document.getElementById("currentLangLabel");
const langButtons = document.querySelectorAll("[data-lang]");

function clearGoogleTranslateCookie() {
  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.paradisegarden.com.ua;";
}

function hideGoogleTranslateBar() {
  const googleFrames = document.querySelectorAll(
    ".goog-te-banner-frame, .goog-te-balloon-frame, iframe.goog-te-banner-frame, body > .skiptranslate"
  );

  googleFrames.forEach(element => {
    element.style.display = "none";
    element.style.visibility = "hidden";
    element.style.height = "0";
  });

  document.body.style.top = "0px";
  document.documentElement.style.marginTop = "0px";
  document.body.style.marginTop = "0px";
}

function runGoogleTranslate(lang) {
  if (lang === "uk") {
    clearGoogleTranslateCookie();
    localStorage.setItem("siteLang", "uk");
    window.location.reload();
    return;
  }

  const select = document.querySelector(".goog-te-combo");

  if (!select) {
    setTimeout(() => {
      runGoogleTranslate(lang);
    }, 500);

    return;
  }

  select.value = lang;
  select.dispatchEvent(new Event("change"));

  localStorage.setItem("siteLang", lang);
}

function setLanguageButtonState(lang) {
  const safeLang = ["uk", "pl", "en"].includes(lang) ? lang : "uk";

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
    const lang = button.dataset.lang;

    setLanguageButtonState(lang);
    runGoogleTranslate(lang);
  });
});

document.addEventListener("click", event => {
  if (languageSwitcher && !languageSwitcher.contains(event.target)) {
    languageSwitcher.classList.remove("open");
  }
});

const savedLang = localStorage.getItem("siteLang") || "uk";

setLanguageButtonState(savedLang);
setInterval(hideGoogleTranslateBar, 500);

if (savedLang !== "uk") {
  setTimeout(() => {
    runGoogleTranslate(savedLang);
  }, 1200);
}
