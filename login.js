// ══════════════════════════════════════════════
//  dashboard.js — ANTITHESIS Dashboard
// ══════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDF7IAbFI3acQXIHxxoea5cgPTumiUjSMg",
  authDomain: "antithesis-al-muayyad.firebaseapp.com",
  databaseURL: "https://antithesis-al-muayyad-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "antithesis-al-muayyad",
  storageBucket: "antithesis-al-muayyad.appspot.com",
  messagingSenderId: "1014116431079",
  appId: "1:1014116431079:web:5f490096bf6ecdf7011e42"
};
const db = getDatabase(initializeApp(firebaseConfig));

// ── Auth guard ──
const nama     = sessionStorage.getItem('antithesis_member');
const username = sessionStorage.getItem('antithesis_username');
if (!nama) { window.location.href = 'login.html'; }

// ── Greeting ──
document.getElementById('navNama').textContent  = nama;
document.getElementById('heroNama').textContent = nama;

const now = new Date();
const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
document.getElementById('heroDate').textContent =
  `${hari[now.getDay()]}, ${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`;

// ── Logout ──
document.getElementById('btnLogout').addEventListener('click', async () => {
  try {
    const { getAuth, signOut } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    await signOut(getAuth());
  } catch(e) {}
  sessionStorage.clear();
  window.location.href = 'login.html';
});



// ── Hamburger ──
document.getElementById('navHam').addEventListener('click', () =>
  document.getElementById('navLinks').classList.toggle('open'));

// ── Pengumuman ──
onValue(ref(db, 'antithesis/pengumuman'), snap => {
  const txt = snap.val() || '';
  const bar = document.getElementById('pgBar');
  if (txt) { document.getElementById('pgText').textContent = txt; bar.classList.add('show'); }
  else bar.classList.remove('show');
});

// ── Countdown ──
let cdInterval = null;
const bln = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

onValue(ref(db, 'antithesis/acara'), snap => {
  const a = snap.val();
  if (a && a.date) {
    document.getElementById('countdownWrap').classList.add('visible');
    document.getElementById('cdEvent').textContent = a.jenis || 'Acara Angkatan';
    const loc = a.lokasi ? `📍 ${a.lokasi}` : '';
    const tgl  = a.date   ? `📅 ${a.date}`   : '';
    document.getElementById('cdLoc').innerHTML =
      `<span>${tgl}</span>${loc ? ` &nbsp;·&nbsp; <span>${loc}</span>` : ''}`;
    clearInterval(cdInterval);
    cdInterval = setInterval(() => tick(new Date(a.date + (a.jam ? 'T'+a.jam : 'T00:00'))), 1000);
  } else {
    clearInterval(cdInterval);
    document.getElementById('countdownWrap').classList.remove('visible');
  }
});

function tick(target) {
  const diff = target - Date.now();
  if (diff <= 0) { clearInterval(cdInterval); return; }
  const h = Math.floor(diff / 86400000);
  const j = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  document.getElementById('cdH').textContent = String(h).padStart(2,'0');
  document.getElementById('cdJ').textContent = String(j).padStart(2,'0');
  document.getElementById('cdM').textContent = String(m).padStart(2,'0');
  document.getElementById('cdS').textContent = String(s).padStart(2,'0');
}

// ── Stats ──
onValue(ref(db, 'antithesis/akun'),  s => document.getElementById('statAnggota').textContent  = s.val() ? Object.keys(s.val()).length : 0);
onValue(ref(db, 'antithesis/anggota'),   s => document.getElementById('statProfil').textContent   = s.val() ? Object.keys(s.val()).length : 0);
onValue(ref(db, 'antithesis/requests'),  s => document.getElementById('statUsulan').textContent   = s.val() ? Object.keys(s.val()).length : 0);
onValue(ref(db, 'antithesis/buku'),      s => document.getElementById('statKenangan').textContent = s.val() ? Object.keys(s.val()).length : 0);

// ── Profil Saya ──
onValue(ref(db, 'antithesis/anggota'), snap => {
  const all = snap.val() || {};
  const myProfil = Object.values(all).find(a => a.username === username || (a.nama||'').toLowerCase() === nama.toLowerCase());
  if (myProfil) {
    document.getElementById('profilWrap').style.display = 'grid';
    document.getElementById('noProfilWrap').style.display = 'none';
    document.getElementById('profilNama').textContent = myProfil.nama || nama;
    document.getElementById('profilKelas').textContent = myProfil.kelas ? 'Kelas ' + myProfil.kelas : '';
    document.getElementById('profilSekolah').innerHTML = myProfil.sekolah
      ? `<span class="badge badge-${myProfil.sekolah.toLowerCase()}">${myProfil.sekolah} Al Muayyad</span>` : '';
    document.getElementById('profilMotto').textContent = myProfil.motto ? `"${myProfil.motto}"` : '';
    if (myProfil.foto) {
      document.getElementById('profilFoto').src = myProfil.foto;
      document.getElementById('profilFoto').style.display = 'block';
      document.getElementById('profilPh').style.display = 'none';
    }
  } else {
    document.getElementById('profilWrap').style.display = 'none';
    document.getElementById('noProfilWrap').style.display = 'block';
  }
});

// ── Scroll reveal ──
const obs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) e.target.classList.add('visible');
}), { threshold: 0.08 });
document.querySelectorAll('.rv').forEach(el => obs.observe(el));
