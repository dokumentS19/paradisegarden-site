const params = new URLSearchParams(window.location.search);
const id = Number(params.get("id"));

const data = {
  1: {
    title: "2-к квартира, Ірпінь",
    desc: "Сучасна квартира у новобудові з комфортним плануванням.",
    price: "65 000 $",
    info: ["Площа: 65 м²", "Кухня: 15 м²", "Поверх: 3/10"]
  },
  2: {
    title: "Будинок, Буча",
    desc: "Просторий будинок з ділянкою та хорошим ремонтом.",
    price: "120 000 $",
    info: ["Площа: 120 м²", "Ділянка: 5 соток", "Поверхів: 2"]
  },
  3: {
    title: "1-к квартира, Ірпінь",
    desc: "Компактна квартира в центрі міста.",
    price: "38 000 $",
    info: ["Площа: 38 м²", "Центр"]
  }
};

const images = {
  1: [
    "https://picsum.photos/800/400",
    "https://picsum.photos/800/401",
    "https://picsum.photos/800/402"
  ],
  2: [
    "https://picsum.photos/800/410",
    "https://picsum.photos/800/411",
    "https://picsum.photos/800/412"
  ],
  3: [
    "https://picsum.photos/800/420",
    "https://picsum.photos/800/421",
    "https://picsum.photos/800/422"
  ]
};

const obj = data[id];

if (obj) {
  document.getElementById("title").textContent = obj.title;
  document.getElementById("desc").textContent = obj.desc;
  document.getElementById("price").textContent = obj.price;

  const ul = document.getElementById("info");
  obj.info.forEach(i => {
    const li = document.createElement("li");
    li.textContent = i;
    ul.appendChild(li);
  });
}

const imgs = images[id];

if (imgs) {
  document.getElementById("main-img").src = imgs[0];

  const thumbs = document.querySelector(".thumbs");

  imgs.forEach(src => {
    const img = document.createElement("img");
    img.src = src;

    img.onclick = () => {
      document.getElementById("main-img").src = src;
    };

    thumbs.appendChild(img);
  });
}

// ===== FULLSCREEN =====

let currentIndex = 0;
let currentImages = [];

const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");

document.addEventListener("click", (e) => {
  if (e.target.matches(".thumbs img, #main-img")) {

   currentImages = imgs;

const clickedSrc = e.target.src;
currentIndex = currentImages.indexOf(clickedSrc);

if (currentIndex === -1) currentIndex = 0;

    modal.style.display = "block";
    modalImg.src = clickedSrc;
  }
});

// кнопка закрити
document.getElementById("close").onclick = () => {
  modal.style.display = "none";
};

// стрілка назад
document.getElementById("prev").onclick = () => {
  if (!currentImages.length) return;

  currentIndex--;
  if (currentIndex < 0) currentIndex = currentImages.length - 1;
  modalImg.src = currentImages[currentIndex];
};

// стрілка вперед

document.getElementById("next").onclick = () => {
  if (!currentImages.length) return;
  currentIndex++;
  if (currentIndex >= currentImages.length) currentIndex = 0;
  modalImg.src = currentImages[currentIndex];
};


// закриття по кліку
modal.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};
