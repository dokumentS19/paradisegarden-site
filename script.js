let allObjects = [];
import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
console.log("SCRIPT OK");
const firebaseConfig = {
  apiKey: "AIzaSyB7Uu7Iq6X0471orSFgorzwwIqP5JMJeGk",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const showFavBtn = document.getElementById("showFavOnly");
if (showFavBtn) {
  showFavBtn.onclick = () => {
    document.querySelectorAll(".card").forEach(card => {
      const btn = card.querySelector(".fav-btn");
      if (!btn) return;
      const id = Number(btn.dataset.id);
      card.style.display = favorites.includes(id) ? "block" : "none";
    });
  };
} 
async function loadObjects() {
 console.log("LOAD OBJECTS ✅");
  
const snap = await getDocs(collection(db, "objects"));
console.log("DOCS COUNT:", snap.size);

  const grid = document.getElementById("objectsGrid");
  if (!grid) return;
  grid.innerHTML = "";
allObjects = [];

snap.forEach((docSnap, index) => {
  const d = docSnap.data();

  allObjects.push(d); // ✅ зберігаємо всі дані

  const imageUrl = d.images?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa";

  grid.innerHTML += `
    <div class="card">
      <img class="gallery-img" src="${imageUrl}" data-index="${index}">
      <button class="fav-btn" data-id="${index}">♡</button>

      <h3>${d.title || "Без назви"}</h3>
      <p>Площа: ${d.area || "-"} м²</p>
      <strong>${d.price || "-"} $</strong>
    </div>
  `;
});
    
  updateFavUI(); // ✅
}
const modal = document.getElementById("galleryModal");
const modalImg = document.getElementById("galImg");

let currentImages = [];
let currentIndex = 0;

document.addEventListener("keydown", (e) => {
  if (!modal || modal.style.display !== "block") return;

  if (e.key === "ArrowRight") showImage(currentIndex + 1);
  if (e.key === "ArrowLeft") showImage(currentIndex - 1);
  if (e.key === "Escape") modal.style.display = "none";
});
function showImage(index) {
  if (!currentImages.length) return;
  if (index < 0) index = currentImages.length - 1;
  if (index >= currentImages.length) index = 0;

  currentIndex = index; 
  modalImg.src = currentImages[currentIndex];
}
let startX = 0;

modal.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

modal.addEventListener("touchend", (e) => {
  const endX = e.changedTouches[0].clientX;

  if (startX - endX > 50) {
    showImage(currentIndex + 1);
  }

  if (endX - startX > 50) {
    showImage(currentIndex - 1);
  }
});
const nextBtn = document.getElementById("galNext");
const prevBtn = document.getElementById("galPrev");

if (nextBtn) {
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // ✅ ВАЖЛИВО
    console.log("NEXT");
    showImage(currentIndex + 1);
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // ✅ ВАЖЛИВО
    console.log("PREV");
    showImage(currentIndex - 1);
  });
}
document.addEventListener("click", (e) => {
  const img = e.target.closest(".gallery-img");
 if (img) {
  modal.style.display = "block";

  const index = Number(img.dataset.index);
  const obj = allObjects[index];

  currentImages = obj.images?.length
    ? obj.images
    : [img.src];

  currentIndex = 0;

  showImage(currentIndex);
  return;
}
  const btn = e.target.closest(".fav-btn");
  if (!btn) return;

  if (!currentUser) {
    alert("Спочатку увійди");
    return;
  }
  const id = Number(btn.dataset.id);
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  updateFavUI();
});
function updateFavUI() {
  document.querySelectorAll(".fav-btn").forEach(btn => {
    const id = Number(btn.dataset.id);
    if (favorites.includes(id)) {
      btn.textContent = "❤️";
    } else {
      btn.textContent = "♡";
    }
  });
  // лічильник
  const counter = document.getElementById("favCounter");
  if (counter) counter.textContent = favorites.length;
}
/*
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    btn.textContent = user.displayName || user.email;

    favorites = await loadFavorites(user.uid);

    updateFavUI(); // ✅ синхронізація

    btn.onclick = async () => {
      await signOut(auth);
    };

  } else {
    currentUser = null;
    favorites = [];

    btn.textContent = "Увійти";
    btn.onclick = login;
  }
});
*/
let currentUser = null;
let favorites = [];
function getFavs() {
  return favorites;
}

function toggleFav(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
    return false;
  } else {
    favorites.push(id);
    return true;
  }
}

function isFav(id) {
  return favorites.includes(id);
}
const btn = document.getElementById("loginBtn");
const PHONE_NUMBER  = "+380674464705";
const VIBER_NUMBER  = "+380674464705";
const TELEGRAM_LINK = "https://t.me/+380674464705";

const REMOTE_SHEET_CSV_URL = "";  // Google Sheets CSV
const AIRTABLE_VIEW_CSV_URL = ""; // Airtable View CSV
const favCounter = document.getElementById('favCounter');
const favHeaderBtn = document.getElementById('favHeaderBtn');

function updateFavCounter(){ 
  if (favCounter) favCounter.textContent = favorites.length; 
}
updateFavCounter();
if (favHeaderBtn){ 
favHeaderBtn.addEventListener('click', () => { 
const onlyFav = document.getElementById('featOnlyFav'); 
if (onlyFav && !onlyFav.checked){ 
onlyFav.checked = true; 
   } 

    document.getElementById('featured')?.scrollIntoView({behavior:'smooth'}); 
    renderFeatured(); 
  }); 
}
const showPhoneBtn  = document.getElementById('showPhoneBtn');
const phoneNumber   = document.getElementById('phoneNumber');
const viberLink     = document.getElementById('viberLink');
const tgLink        = document.getElementById('tgLink');
const showPhoneBtn2 = document.getElementById('showPhoneBtn2');
const phoneNumber2  = document.getElementById('phoneNumber2');
const viberLink2    = document.getElementById('viberLink2');
const tgLink2       = document.getElementById('tgLink2');
const burger        = document.querySelector('.burger');
const nav           = document.querySelector('.nav');
const yearSpan      = document.getElementById('year');
const recommendBtn  = document.getElementById('recommendBtn');
// ===== Utils =====
const CURRENCY_SYMBOL = { UAH: '₴', USD: '$', EUR: '€' };
function fmtPrice({value, currency='USD'} = {}){ if (typeof value !== 'number' || isNaN(value)) return 'Ціна за запитом'; const sym = CURRENCY_SYMBOL[currency] || ''; const num = value.toLocaleString('uk-UA', { maximumFractionDigits: 0 }); return `${sym}${num}`; }
function bySortKey(a,b,key,dir='asc'){ const k = {asc:1,desc:-1}[dir]||1; const av = key.split('.').reduce((o,p)=>o?.[p], a); const bv = key.split('.').reduce((o,p)=>o?.[p], b); return av>bv?1*k:av<bv?-1*k:0; }
function setupShowPhone(btn, out){ if (!btn || !out) return; btn.addEventListener('click', ()=>{ out.classList.remove('sr-only'); out.textContent = PHONE_NUMBER ? `Телефон: ${PHONE_NUMBER}` : 'Телефон: (не вказано)'; btn.setAttribute('aria-expanded','true'); btn.textContent = 'Телефон показано';                                                           
btn.disabled = true; }); }
function setupViber(aTag){
  if (!aTag) return;

  const numberPlain = (VIBER_NUMBER || '').replace(/[^\d+]/g,'');

  aTag.href = numberPlain
    ? `viber://chat?number=${encodeURIComponent(numberPlain)}`
    : '#';

  aTag.addEventListener('click', e => {
    if (!numberPlain){
      e.preventDefault();
      alert('Номер Viber ще не вказано.');
    }
  });
}

function setupTelegram(aTag){
  if (!aTag) return;

  const url = (TELEGRAM_LINK || '').trim();

  aTag.href = url || '#';

  aTag.addEventListener('click', e => {
    if (!url){
      e.preventDefault();
      alert('Посилання на Telegram ще не вказано.');
    }
  });
}
// ===== Featured data =====
let FEATURED_LISTINGS = [];
async function initData(){
  const urls = [REMOTE_SHEET_CSV_URL, AIRTABLE_VIEW_CSV_URL].filter(Boolean);
  let rows = [];
  async function fetchCsv(url){ try { const res = await fetch(url, {cache:'no-store'}); if (!res.ok) throw new Error(res.statusText); return await res.text(); } catch(e){ console.warn('CSV fetch failed:', url, e); return ''; } }
  function parseCSV(text){ if (!text) return [];const lines = text.trim().split(/\r?\n/)
 ; if (!lines.length) return []; const headers = lines.shift().split(',').map(h=>h.trim()); return lines.map(line=>{ const cells = line.split(','); const obj = {}; headers.forEach((h,i)=> obj[h] = (cells[i]||'').trim()); return obj; }); }
  function parseRow(r){ if (!r || !r.id) return null; const toNum = v=> v===''? undefined : Number(v); const list = v=> (v||'').split(/[|,]/).map(s=>s.trim()).filter(Boolean); return { id:String(r.id), title:r.title||'', type:r.type||'', city:r.city||'', location:r.location||'', price:{ value: toNum(r.price_value), currency: (r.price_currency||'USD').toUpperCase() }, area: toNum(r.area), bedrooms: toNum(r.bedrooms), bathrooms: toNum(r.bathrooms), cover: r.cover||'', gallery: list(r.gallery), url: r.url||'#', badges: list(r.badges), date: r.date || '2000-01-01' }; }
  if (urls.length){
    for (const u of urls){ const csv = await fetchCsv(u); rows = rows.concat(parseCSV(csv)); }
  }
  if (!rows.length){ // fallback to local csv
    const csv = await fetchCsv('assets/data/featured.csv'); rows = rows.concat(parseCSV(csv));
  }
  const mapped = rows.map(parseRow).filter(Boolean);
  if (mapped.length) FEATURED_LISTINGS = mapped;
}
// ===== Featured render =====
function renderFeatured(){
  const grid = document.getElementById('featuredGrid'); const empty = document.getElementById('featuredEmpty'); if (!grid) return;
  const q = (document.getElementById('featSearch')?.value || '').toLowerCase().trim();
  const city = document.getElementById('featCity')?.value || ''; const type = document.getElementById('featType')?.value || ''; const sort = document.getElementById('featSort')?.value || 'date_desc'; const onlyFav = !!document.getElementById('featOnlyFav')?.checked;
  let items = [...FEATURED_LISTINGS];
  if (q){ items = items.filter(it => (it.title||'').toLowerCase().includes(q) || (it.location||'').toLowerCase().includes(q) || (it.city||'').toLowerCase().includes(q)); }
  if (city) items = items.filter(it => (it.city||'').toLowerCase() === city.toLowerCase());
  if (type) items = items.filter(it => it.type === type);
  if (onlyFav){ const fav = new Set(getFavs()); items = items.filter(it => fav.has(String(it.id))); }
  if (sort === 'price_asc') items.sort((a,b)=>bySortKey(a,b,'price.value','asc'));
  if (sort === 'price_desc') items.sort((a,b)=>bySortKey(a,b,'price.value','desc'));
  if (sort === 'area_asc') items.sort((a,b)=>bySortKey(a,b,'area','asc'));
  if (sort === 'area_desc') items.sort((a,b)=>bySortKey(a,b,'area','desc'));
  if (sort === 'date_desc') items.sort((a,b)=> new Date(b.date) - new Date(a.date));
  if (!items.length){ grid.innerHTML = ''; if (empty) empty.hidden = false; return; } else if (empty) empty.hidden = true;
  const phone = PHONE_NUMBER; const viberHref = `viber://chat?number=${encodeURIComponent(PHONE_NUMBER)}`; const tgHref = TELEGRAM_LINK;
  const cardsHtml = items.map(it=>{
    const cover = it.cover || 'assets/covers/placeholder.webp'; const price = fmtPrice(it.price); const favChecked = isFav(it.id); const badges = (it.badges||[]).map(b=>`<span class="badge-tag">${b}</span>`).join('');
    const meta = [it.location || it.city || '', it.area ? `${it.area} м²` : '', Number.isFinite(it.bedrooms) ? `${it.bedrooms} кім.` : '', Number.isFinite(it.bathrooms) ? `${it.bathrooms} санвуз.` : ''].filter(Boolean).join(' • ');
    return `
      <article class="feature-card" data-id="${it.id}">
        <a href="#" class="feature-cover" data-open-gallery="${it.id}">
          <img src="${cover}" alt="${it.title}" loading="lazy" decoding="async"/>
          <div class="feature-badges">${badges}</div>
        </a>
        <div class="feature-body">
          <h3 class="feature-title">${it.title}</h3>
          ${meta ? `<div class="feature-meta">${meta}</div>` : ''}
          <div class="feature-actions">
            <span class="feature-price">${price}</span>
            <a class="btn small outline" href="${it.url}" target="_blank" rel="noopener nofollow">Переглянути</a>
            <a class="btn small outline" href="tel:${phone}">Подзвонити</a>
            <a class="btn small outline" href="${viberHref}">Viber</a>
            <a class="btn small tg" href="${tgHref}">Telegram</a>
            <label class="fav ${favChecked ? 'checked' : ''}" title="Додати до обраного">
              <input type="checkbox" ${favChecked ? 'checked' : ''} />
              <span class="heart" aria-hidden="true"></span>
              <span class="sr-only">Обране</span>
            </label>
          </div>
        </div>
      </article>`;
  }).join('');
  grid.innerHTML = cardsHtml;
 // Fav handlers
  grid.querySelectorAll('.feature-card').forEach(card=>{
    const id = card.getAttribute('data-id'); const fav = card.querySelector('.fav'); const checkbox = fav?.querySelector('input');
    if (checkbox){ checkbox.addEventListener('change', ()=>{ const state = toggleFav(id); fav.classList.toggle('checked', state); updateFavCounter(); }); }
  });
  attachGalleryHandlers();
}
// ===== Gallery =====
const galImg = document.getElementById('galImg');
const galPrev = document.getElementById('galPrev');
const galNext = document.getElementById('galNext');
const galClose = document.getElementById('galClose');
const galThumbs = document.getElementById('galThumbs');
const galCaption = document.getElementById('galCaption');
let galState = { list: [], index: 0, title: '' };
function openGallery(listing){ galState.list = (listing.gallery && listing.gallery.length ? listing.gallery : [listing.cover]).filter(Boolean); galState.index = 0; galState.title = listing.title || ''; renderGallery(); modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden'; }
function closeGallery(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; }
function showIdx(i){ if (!galState.list.length) return; galState.index = (i + galState.list.length) % galState.list.length; renderGallery(); }
function renderGallery(){ const src = galState.list[galState.index]; galImg.src = src; galImg.alt = galState.title || "Фото об'єкта"; 
galCaption.textContent = `${galState.title} — ${galState.index+1}/${galState.list.length}`; galThumbs.innerHTML = galState.list.map((s,idx)=>`
<img src="${s}" data-idx="${idx}" alt="thumb ${idx+1}" loading="lazy"/>`).join(''); galThumbs.querySelectorAll('img').forEach(img=>{ img.addEventListener('click',
()=> showIdx(Number(img.dataset.idx))); if (Number(img.dataset.idx)===galState.index) img.classList.add('active'); });
['click'].forEach(()=>{}); // placeholder to avoid lint
if (galPrev) galPrev.addEventListener('click', ()=> showIdx(galState.index - 1));
if (galNext) galNext.addEventListener('click', ()=> showIdx(galState.index + 1));
if (galClose) galClose.addEventListener('click', closeGallery);
if (modal) modal.addEventListener('click', (e)=>{ if (e.target?.dataset?.close) closeGallery(); });
document.addEventListener('keydown', (e)=>{ 
if (!modal.classList.contains('open'))return; 
if (e.key==='Escape') closeGallery(); 
if (e.key==='ArrowLeft')showIdx(galState.index - 1); 
if (e.key==='ArrowRight') showIdx(galState.index + 1);
});
}
function attachGalleryHandlers(){ const grid = document.getElementById('featuredGrid');
if (!grid) return; grid.querySelectorAll('[data-open-gallery]').forEach(a=>{ a.addEventListener('click', 
ev=>{ ev.preventDefault(); const id = a.getAttribute('data-open-gallery'); 
const listing = FEATURED_LISTINGS.find(x => String(x.id) === String(id)); 
if (listing) openGallery(listing); }); }); }
// ===== External listings (other platforms) =====
const EXTERNAL_LISTINGS = [
  { title: 'Будинок, Ірпінь, 250 м², 6 соток', platform: { name: 'DOM.RIA', logo: 'assets/platforms/domria.svg' }, url: 'https://dom.ria.com/uk/', cover: 'assets/featured/irpin-house.jpg', location: 'Ірпінь • Київська область', price: '€230 000', ctaLabel: 'Переглянути на DOM.RIA' },
  { title: '2-кімнатна квартира, Буча, 64 м²', platform: { name: 'OLX', logo: 'assets/platforms/olx.svg' }, url: 'https://www.olx.ua/', cover: 'assets/featured/bucha-flat.jpg', location: 'Буча • Київська область', price: '$68 000', ctaLabel: 'Відкрити на OLX' },
  { title: 'Таунхаус, Гостомель, 120 м²', platform: { name: 'LUN', logo: 'assets/platforms/lun.svg' }, url: 'https://lun.ua/uk', cover: 'assets/featured/hostomel-townhouse.jpg', location: 'Гостомель • Київська область', price: '$115 000', ctaLabel: 'Дивитись на LUN' },
];
function renderExternalListings(){ const grid = document.getElementById('listingsGrid'); if (!grid) return; if (!EXTERNAL_LISTINGS.length){ grid.innerHTML = `<p class="muted">Наразі зовнішніх посилань немає.</p>`; return; } grid.innerHTML = EXTERNAL_LISTINGS.map(item=>{ const coverImg = item.cover || 'assets/covers/placeholder.webp'; const meta = [item.location, item.price].filter(Boolean).join(' • '); return `
      <article class="listing-card">
        <a href="${item.url}" class="listing-cover" target="_blank" rel="noopener nofollow">
          <img src="${coverImg}" alt="${item.title}" loading="lazy" decoding="async"/>
          <span class="listing-badge">${item.platform?.name || 'Платформа'}</span>
        </a>
        <div class="listing-body">
          <h3 class="listing-title">${item.title}</h3>
          ${meta ? `<div class="listing-meta">${meta}</div>` : ''}
          <div class="listing-actions">
            <a class="btn outline" href="${item.url}" target="_blank" rel="noopener nofollow">${item.ctaLabel || 'Перейти'}</a>
            <span class="platform">
              ${item.platform?.logo ? `<img src="${item.platform.logo}" alt="${item.platform.name}" />` : ''}
              ${item.platform?.name || ''}
            </span>
          </div>
        </div>
      </article>`; }).join(''); }
 // ===== Other behaviours =====
setupShowPhone(showPhoneBtn, phoneNumber); setupShowPhone(showPhoneBtn2, phoneNumber2);
setupViber(viberLink); setupViber(viberLink2); setupTelegram(tgLink); setupTelegram(tgLink2);
if (yearSpan) yearSpan.textContent = new Date().getFullYear();
if (burger && nav){ burger.addEventListener('click', ()=>{ const visible = getComputedStyle(nav).display !== 'none'; nav.style.display = visible ? 'none' : 'flex'; burger.setAttribute('aria-expanded', String(!visible)); }); nav.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=>{ if (window.matchMedia('(max-width: 980px)').matches){ nav.style.display = 'none'; burger.setAttribute('aria-expanded','false'); } })); }
if (recommendBtn)
{ recommendBtn.addEventListener('click', async ()=>{ 
const url = location.href; 
  
try{ 
await navigator.clipboard.writeText(url);
recommendBtn.textContent = 'Посилання скопійовано!';
setTimeout(()=> recommendBtn.textContent='Рекомендувати', 1800);
} catch {
  alert('Скопіюйте посилання: ' + url); 
}
}); 
 }
 document.addEventListener('DOMContentLoaded', async ()=>{
  await initData();
  renderFeatured();
  renderExternalListings();
   
  loadObjects();
   
  ['featSearch','featCity','featType','featSort','featOnlyFav'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', renderFeatured);
  });
  const reset = document.getElementById('featReset');
  if (reset) reset.addEventListener('click', ()=>{
    const ids=['featSearch','featCity','featType','featSort','featOnlyFav'];
    ids.forEach(id=>{
      const el=document.getElementById(id);
      if (!el) return;
      if (el.tagName==='INPUT' && el.type==='checkbox') el.checked=false;
      else if (el.tagName==='SELECT') el.selectedIndex=0;
      else el.value='';
    });
    renderFeatured();
  });
  });
  const exportBtn = document.getElementById('featExport');
  if (exportBtn) exportBtn.addEventListener('click', ()=>{
    const favIds = getFavs();
    if (!favIds.length){
      alert('Немає обраних оголошень');
      return;
    }
    const map = new Map(FEATURED_LISTINGS.map(x=>[String(x.id), x]));
    const lines = favIds.map(id => map.get(String(id))?.url).filter(Boolean);
    const text = lines.join('\n');
    try {
  navigator.clipboard.writeText(text)
    .then(() => alert('✅ Скопійовано'))
    .catch(() => {
      const w = window.open();
      if (w) {
        w.document.write(`<pre>${text}</pre>`);
      }
    });
  //status.textContent = "✅ Заявка відправлена";
  //form.reset();
} catch (err) {
  console.error(err);
  //status.textContent = "❌ Помилка";
}
});
window.addObject = async () => {
  console.log("CLICK ✅");

  const title = document.getElementById("title").value;
  const area = Number(document.getElementById("area").value);
  const price = Number(document.getElementById("price").value);

  const files = document.getElementById("image").files;

  const images = [];

  for (let file of files) {
    const base64 = await toBase64(file);
    images.push(base64);
  }

  try {
    await addDoc(collection(db, "objects"), {
      title,
      area,
      price,
      images
    });

    alert("✅ Додано!");

  } catch (e) {
    console.error(e);
    alert("❌ Помилка");
  }
};
