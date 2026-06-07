import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "ТВОЙ_KEY",
  authDomain: "paradisegarden-site.firebaseapp.com",
  projectId: "paradisegarden-site",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allObjects = [];

async function load() {
  const snap = await getDocs(collection(db, "objects"));

  allObjects = [];

  snap.forEach(doc => {
    allObjects.push({ id: doc.id, ...doc.data() });
  });

  render(allObjects);
}

// ✅ відображення
function render(data) {
  const grid = document.getElementById("objectsGrid");
  grid.innerHTML = "";

  data.forEach(d => {

    const img = d.images?.[0] || "https://via.placeholder.com/400";

    grid.innerHTML += `
      <div class="card">

        object.html?id=${d.id}

          ${img}

          <h3>${d.title}</h3>
          <p>${d.area || "-"} м²</p>
          <strong>${d.price}$</strong>

        </a>

        ❤️
        

      </div>
    `;
  });
}

// ❤️ обране
function toggleFav(id) {
  let favs = JSON.parse(localStorage.getItem("favs")) || [];

  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }

  localStorage.setItem("favs", JSON.stringify(favs));
}

window.toggleFav = toggleFav;


// ✅ пошук + фільтр
document.getElementById("search").oninput =
document.getElementById("minPrice").oninput =
document.getElementById("maxPrice").oninput = () => {

  const text = document.getElementById("search").value.toLowerCase();
  const min = Number(document.getElementById("minPrice").value);
  const max = Number(document.getElementById("maxPrice").value);

  const filtered = allObjects.filter(d => {

    const matchText = d.title?.toLowerCase().includes(text);
    const matchMin = !min || d.price >= min;
    const matchMax = !max || d.price <= max;

    return matchText && matchMin && matchMax;
  });

  render(filtered);
};

load();
