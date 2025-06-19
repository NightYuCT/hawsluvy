// Firebase 模組載入（記得放在 type="module" 中）
import {
  getDatabase, ref, set, get, onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
  getStorage, ref as sRef, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// 初始化 Firebase 資源（來自 window 全域變數）
const db = window.firebaseDB;
const storage = window.firebaseStorage;

// 每日一句
const quotes = [
  "你是我最甜的習慣。",
  "今天也要開心哦！",
  "有你在的日子就是特別。",
  "每天都值得被記住。",
];
document.getElementById("quoteText").innerText =
  quotes[Math.floor(Math.random() * quotes.length)];

// 倒數天數
const specialDate = new Date("2024-01-01");
const now = new Date();
const days = Math.ceil((now - specialDate) / (1000 * 60 * 60 * 24));
document.getElementById("daysLeft").innerText = days;

// Tab 切換
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
    document.getElementById(btn.dataset.target).classList.add("active");
  });
});

function getEmoji(type) {
  return type === "food" ? "🍣" : type === "music" ? "🎧" : "🎬";
}

// 喜好：新增與顯示
function addFavorite(type) {
  const input = document.getElementById(`fav${capitalize(type)}Input`);
  const value = input.value.trim();
  if (!value) return;
  const path = `favorites/${type}`;
  get(ref(db, path)).then(snapshot => {
    const data = snapshot.val() || [];
    data.push(value);
    set(ref(db, path), data).then(() => {
      input.value = "";
      showFavorites();
    });
  });
}
function removeFavorite(type, index) {
  const path = `favorites/${type}`;
  get(ref(db, path)).then(snapshot => {
    const data = snapshot.val() || [];
    data.splice(index, 1);
    set(ref(db, path), data).then(() => showFavorites());
  });
}
function showFavorites() {
  ["food", "music", "movie"].forEach(type => {
    const listEl = document.getElementById(`fav${capitalize(type)}List`);
    onValue(ref(db, `favorites/${type}`), snapshot => {
      const data = snapshot.val() || [];
      listEl.innerHTML = "";
      data.forEach((val, i) => {
        const div = document.createElement("div");
        div.innerHTML = `${getEmoji(type)} ${val} <button onclick="removeFavorite('${type}', ${i})">🗑️</button>`;
        listEl.appendChild(div);
      });
    });
  });
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 相簿圖片
document.getElementById("photoUpload").addEventListener("change", async (event) => {
  const files = event.target.files;
  for (let file of files) {
    const storagePath = `photos/${Date.now()}_${file.name}`;
    const fileRef = sRef(storage, storagePath);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    // 存到 Firebase DB
    get(ref(db, "photos")).then(snapshot => {
      const list = snapshot.val() || [];
      list.push({ url, path: storagePath });
      set(ref(db, "photos"), list).then(() => showPhotos());
    });
  }
});

function showPhotos() {
  onValue(ref(db, "photos"), snapshot => {
    const preview = document.getElementById("photoPreview");
    const list = snapshot.val() || [];
    preview.innerHTML = "";
    list.forEach((photo, i) => {
      const box = document.createElement("div");
      box.className = "photo-box";
      box.innerHTML = `
        <img src="${photo.url}" onclick="zoomImg('${photo.url}')">
        <button onclick="deletePhoto(${i})">🗑️</button>
      `;
      preview.appendChild(box);
    });
  });
}

function deletePhoto(index) {
  get(ref(db, "photos")).then(snapshot => {
    const list = snapshot.val() || [];
    const item = list[index];
    const imgRef = sRef(storage, item.path);
    deleteObject(imgRef).then(() => {
      list.splice(index, 1);
      set(ref(db, "photos"), list);
    });
  });
}

function zoomImg(src) {
  document.getElementById("modalImg").src = src;
  document.getElementById("imgModal").style.display = "flex";
}

// 回憶日曆
let currentEditDate = "";
function initCalendar() {
  const container = document.getElementById("calendarContainer");
  container.innerHTML = "";
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  get(ref(db, "calendarNotes")).then(snapshot => {
    const notes = snapshot.val() || {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${y}-${m + 1}-${d}`;
      const div = document.createElement("div");
      div.className = "calendar-day";
      div.textContent = d;
      if (notes[key]) div.classList.add("has-entry");
      div.onclick = () => openCalendarModal(key);
      container.appendChild(div);
    }
  });
}
function openCalendarModal(dateKey) {
  currentEditDate = dateKey;
  document.getElementById("calendarModal").style.display = "flex";
  get(ref(db, "calendarNotes")).then(snapshot => {
    const notes = snapshot.val() || {};
    document.getElementById("calendarNote").value = notes[dateKey] || "";
    document.getElementById("calendarModalTitle").innerText = `編輯 ${dateKey}`;
  });
}
function saveCalendarNote() {
  const note = document.getElementById("calendarNote").value.trim();
  get(ref(db, "calendarNotes")).then(snapshot => {
    const notes = snapshot.val() || {};
    notes[currentEditDate] = note;
    set(ref(db, "calendarNotes"), notes).then(() => {
      closeCalendarModal();
      initCalendar();
    });
  });
}
function deleteCalendarNote() {
  get(ref(db, "calendarNotes")).then(snapshot => {
    const notes = snapshot.val() || {};
    delete notes[currentEditDate];
    set(ref(db, "calendarNotes"), notes).then(() => {
      closeCalendarModal();
      initCalendar();
    });
  });
}
function closeCalendarModal() {
  document.getElementById("calendarModal").style.display = "none";
}

// 初始化執行
showPhotos();
showFavorites();
initCalendar();
