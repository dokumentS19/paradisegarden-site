/ ✅ ДОДАЙ ЦЕ
let currentImages = [];
let currentIndex = 0;


const modal = document.getElementById("galleryModal");
const modalImg = document.getElementById("galImg");

 // ✅ завантаження з бази
async function loadFavorites(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? snap.data().favorites || [] : [];
}

// ✅ збереження в базу
async function saveFavorites(userId, favs) {
  await setDoc(doc(db, "users", userId), { favorites: favs });
}

// ✅ логін
async function login() {
  try {
    await signInWithPopup(auth, provider);
    location.reload();
  } catch (e) {
    alert(e.message);
  }
   function updateFavUI() {
  document.querySelectorAll(".fav-btn").forEach(btn => {
    const id = Number(btn.dataset.id);

    btn.textContent = favorites.includes(id) ? "❤️" : "♡";
  });

  const counter = document.getElementById("favCounter");
  if (counter) counter.textContent = favorites.length;
}

// ✅ стан кнопки
const btn = document.getElementById("loginBtn");

let currentUser = null;
let favorites = [];

onAuthStateChanged(auth, async (user) => {

  if (!btn) return;

  if (user) {
    currentUser = user;

    btn.textContent = user.displayName || user.email;

    favorites = await loadFavorites(user.uid);

    updateFavUI(); // ✅ важливо

    btn.onclick = async () => {
      await signOut(auth);
    };

  } else {
    currentUser = null;
    favorites = [];

    btn.textContent = "Увійти";
    btn.onclick = login;

    updateFavUI();
  
 }
});
  
document.addEventListener("click", async (e) => {
 
const btn = e.target.closest(".fav-btn");
if (!btn) return;


  if (!currentUser) {
    alert("Спочатку увійди");
    return;
  }

  
const id = Number(btn.dataset.id);

  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
   btn.textContent = "♡";
  } else {
    favorites.push(id);
btn.textContent = "❤️";
  }
  await saveFavorites(currentUser.uid, favorites);
});

modal.addEventListener("click", (e) => {
  if (e.target === modal || e.target.dataset.close) {
    modal.style.display = "none";
  }
});
// ✅ ВСТАВЛЯЄШ ОЦЕ ТУТ
 document.getElementById("galPrev").onclick = () => {
  currentIndex--;
  if (currentIndex < 0) currentIndex = currentImages.length - 1;
  modalImg.src = currentImages[currentIndex];
};

document.getElementById("galNext").onclick = () => {
  currentIndex++;
  if (currentIndex >= currentImages.length) currentIndex = 0;
  modalImg.src = currentImages[currentIndex];
};

document.getElementById("galClose").onclick = () => {
  modal.style.display = "none";
};

// ✅ КЛІК ПО ФОТО

document.querySelectorAll(".card img").forEach((img, index) => {
  img.addEventListener("click", () => {

    currentImages = Array.from(document.querySelectorAll(".card img"))
      .map(i => i.src);

    currentIndex = index;

    modal.style.display = "block";
    modalImg.src = currentImages[currentIndex];
  });
});
// ✅ КЛАВІАТУРА
document.addEventListener("keydown", (e) => {
  if (modal.style.display !== "block") return;

  if (e.key === "ArrowRight") {
    currentIndex++;
    if (currentIndex >= currentImages.length) currentIndex = 0;
    modalImg.src = currentImages[currentIndex];
  }

  if (e.key === "ArrowLeft") {
    currentIndex--;
    if (currentIndex < 0) currentIndex = currentImages.length - 1;
    modalImg.src = currentImages[currentIndex];
  }

  if (e.key === "Escape") {
    modal.style.display = "none";
  }
});
  // ✅ ФОРМА
const form = document.getElementById("leadForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.name.value;
    const tel = form.tel.value;
    const msg = form.msg.value;

    const status = document.getElementById("formStatus");

    if (!name || !tel) {
      status.textContent = "⚠️ Введіть імʼя і телефон";
      return;
    }

    try {
      await addDoc(collection(db, "requests"), {
        name,
        tel,
        msg,
        createdAt: new Date()
      });

      status.textContent = "✅ Заявка відправлена";
      form.reset();

  
} catch (err) {
  console.error(err);
  status.textContent = "❌ Помилка";
}
  }); 
}  
// ✅ ФУНКЦІЯ ЗАВАНТАЖЕННЯ
async function loadObjects() {
  const snap = await getDocs(collection(db, "objects"));

  const grid = document.getElementById("objectsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();

    const imageUrl = d.images?.[0] || d.image || "https://via.placeholder.com/400x250";

 
const cardHTML = `
  <div class="card">
    <img class="gallery-img" src="${imageUrl}" alt="Об'єкт">

    <h3>${d.title || "Без назви"}</h3>
    <p>Площа: ${d.area || "-"} м²</p>
    <strong>${d.price || "-"} $</strong>
  </div>
    grid.innerHTML += cardHTML;
  });

}
loadObjects();
