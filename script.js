// 簡化範例 - Firebase 資料初始化
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// 確保 firebaseApp 來自 index.html 全域變數
const db = window.firebaseDB;
const storage = window.firebaseStorage;

// 示例：顯示每日一句
const quotes = ["你是我最甜的習慣。", "世界再吵，我也想聽你說話。"];
document.getElementById("quoteText").innerText = quotes[Math.floor(Math.random() * quotes.length)];
