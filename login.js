// ══════════════════════════════════════════════
//  login.js — Autentikasi ANTITHESIS
// ══════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://antithesis-al-muayyad-default-rtdb.asia-southeast1.firebasedatabase.app",
  apiKey: "AIzaSyDF7IAbFI3acQXIHxxoea5cgPTumiUjSMg",
  authDomain: "antithesis-al-muayyad.firebaseapp.com",
  projectId: "antithesis-al-muayyad",
  storageBucket: "antithesis-al-muayyad.appspot.com",
  messagingSenderId: "1014116431079",
  appId: "1:1014116431079:web:5f490096bf6ecdf7011e42"
};
const db = getDatabase(initializeApp(firebaseConfig));

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

if (sessionStorage.getItem('antithesis_member')) {
  window.location.href = 'dashboard.html';
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.style.display = 'block';
}
function hideErr(id) { document.getElementById(id).style.display = 'none'; }

// ── Expose ke window agar onclick HTML bisa akses ──
window._loginHandlers = { db, sha256, showErr, hideErr };

window.addEventListener('DOMContentLoaded', () => {

  // Toggle password visibility
  function setupToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener('click', () => {
      const inp = document.getElementById(inputId);
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });
  }
  setupToggle('toggleLoginPass', 'loginPass');
  setupToggle('toggleRegPass', 'regPass');

  // ── MASUK ──
  document.getElementById('btnLogin').addEventListener('click', async () => {
    const username = document.getElementById('loginUser').value.trim().toLowerCase();
    const pass     = document.getElementById('loginPass').value;
    hideErr('loginErr');
    if (!username || !pass) { showErr('loginErr', '✕  Lengkapi username dan password'); return; }
    const snap = await get(ref(db, 'antithesis/accounts/' + username));
    if (!snap.exists()) { showErr('loginErr', '✕  Username tidak ditemukan'); return; }
    const data = snap.val();
    const hashed = await sha256(pass);
    if (data.password !== hashed) { showErr('loginErr', '✕  Password salah'); return; }
    sessionStorage.setItem('antithesis_member', data.nama);
    sessionStorage.setItem('antithesis_username', username);
    window.location.href = 'dashboard.html';
  });

  // ── DAFTAR ──
  document.getElementById('btnDaftar').addEventListener('click', async () => {
    const username = document.getElementById('regUser').value.trim().toLowerCase();
    const nama     = document.getElementById('regNama').value.trim();
    const pass     = document.getElementById('regPass').value;
    hideErr('regErr');
    document.getElementById('regOk').style.display = 'none';
    if (!username || !nama || !pass) { showErr('regErr', '✕  Lengkapi semua field'); return; }
    if (pass.length < 6) { showErr('regErr', '✕  Password minimal 6 karakter'); return; }
    if (!/^[a-z0-9_]+$/.test(username)) { showErr('regErr', '✕  Username hanya huruf kecil, angka, underscore'); return; }
    const wlSnap = await get(ref(db, 'antithesis/whitelist'));
    const wl = wlSnap.val() || {};
    const namaLower = nama.toLowerCase();
    const found = Object.values(wl).some(v => {
      const n = typeof v === 'string' ? v : (v.nama || '');
      return n.toLowerCase() === namaLower;
    });
    if (!found) { showErr('regErr', '✕  Nama tidak ditemukan dalam daftar anggota'); return; }
    const existing = await get(ref(db, 'antithesis/accounts/' + username));
    if (existing.exists()) { showErr('regErr', '✕  Username sudah dipakai'); return; }
    const hashed = await sha256(pass);
    await set(ref(db, 'antithesis/accounts/' + username), { nama, password: hashed });
    document.getElementById('regOk').style.display = 'block';
    document.getElementById('regUser').value = '';
    document.getElementById('regNama').value = '';
    document.getElementById('regPass').value = '';
  });

  // ── MODAL GANTI PASSWORD ──
  document.getElementById('btnOpenPass').addEventListener('click', () => {
    document.getElementById('passModal').classList.add('show');
  });
  document.getElementById('btnCloseModal').addEventListener('click', () => {
    document.getElementById('passModal').classList.remove('show');
  });
  document.getElementById('passModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('show');
  });
  document.getElementById('btnGantiPass').addEventListener('click', async () => {
    const username = document.getElementById('gpUser').value.trim().toLowerCase();
    const oldPass  = document.getElementById('gpOld').value;
    const newPass  = document.getElementById('gpNew').value;
    hideErr('gpErr');
    document.getElementById('gpOk').style.display = 'none';
    if (!username || !oldPass || !newPass) { showErr('gpErr', '✕  Lengkapi semua field'); return; }
    if (newPass.length < 6) { showErr('gpErr', '✕  Password baru minimal 6 karakter'); return; }
    const snap = await get(ref(db, 'antithesis/accounts/' + username));
    if (!snap.exists()) { showErr('gpErr', '✕  Username tidak ditemukan'); return; }
    const data = snap.val();
    const oldHashed = await sha256(oldPass);
    if (data.password !== oldHashed) { showErr('gpErr', '✕  Password lama salah'); return; }
    const newHashed = await sha256(newPass);
    await set(ref(db, 'antithesis/accounts/' + username), { ...data, password: newHashed });
    document.getElementById('gpOk').style.display = 'block';
    document.getElementById('gpUser').value = '';
    document.getElementById('gpOld').value = '';
    document.getElementById('gpNew').value = '';
  });

});
