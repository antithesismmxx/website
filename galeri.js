// ══════════════════════════════════════════════
//  galeri.js — ANTITHESIS Buku Kenangan
// ══════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://antithesis-al-muayyad-default-rtdb.asia-southeast1.firebasedatabase.app",
  apiKey: "AIzaSyDF7IAbFI3acQXIHxxoea5cgPTumiUjSMg", projectId: "antithesis-al-muayyad",
  appId: "1:1014116431079:web:5f490096bf6ecdf7011e42"
};
const db = getDatabase(initializeApp(firebaseConfig));

// ── Auth ──
const nama = sessionStorage.getItem('antithesis_member');
if (!nama) { window.location.href = 'login.html'; }

document.getElementById('navNama').textContent = nama;
document.getElementById('btnLogout').addEventListener('click', () => { sessionStorage.clear(); window.location.href = 'login.html'; });
document.getElementById('navHam').addEventListener('click', () => document.getElementById('navLinks').classList.toggle('open'));

// ── Toast ──
function toast(msg) {
  let t = document.getElementById('__toast');
  if (!t) {
    t = document.createElement('div'); t.id = '__toast';
    t.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(16px);background:#111;border:1px solid rgba(201,168,76,.35);color:#c9a84c;font-family:Montserrat,sans-serif;font-size:.5rem;letter-spacing:.25em;text-transform:uppercase;padding:12px 26px;z-index:9999;opacity:0;transition:all .4s;pointer-events:none;white-space:nowrap;';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t.__tid);
  t.__tid = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(16px)'; }, 3200);
}

// ── Mood ──
let selMood = '🌟';
document.querySelectorAll('.mood-btn').forEach(b => b.addEventListener('click', function () {
  document.querySelectorAll('.mood-btn').forEach(x => x.classList.remove('active'));
  this.classList.add('active'); selMood = this.dataset.mood;
}));

// ── Kirim pesan ──
document.getElementById('btnBuku').addEventListener('click', () => {
  const msg = document.getElementById('bukuMsg').value.trim();
  if (!msg) {
    document.getElementById('bukuMsg').style.borderColor = 'rgba(201,168,76,.5)';
    document.getElementById('bukuMsg').focus(); return;
  }
  const now    = new Date();
  const waktu  = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  push(ref(db, 'antithesis/buku'), { mood: selMood, msg, waktu });
  document.getElementById('bukuMsg').value = '';
  document.getElementById('bukuMsg').style.borderColor = '';
  toast('✦ Pesanmu berhasil dikirim!');
});

// ── Listener & render ──
onValue(ref(db, 'antithesis/buku'), snap => {
  const raw  = snap.val() || {};
  const data = Object.values(raw).reverse();
  document.getElementById('bukuCount').textContent = data.length;

  // Mood stats
  const moodCount = {};
  data.forEach(d => { moodCount[d.mood] = (moodCount[d.mood] || 0) + 1; });
  const moodLabels = { '🌟': 'Bangga', '🥹': 'Haru', '😄': 'Bahagia', '💛': 'Rindu' };
  document.getElementById('moodStats').innerHTML = Object.entries(moodCount).map(([emoji, n]) =>
    `<div class="mood-stat">
      <span class="mood-stat-emoji">${emoji}</span>
      <div><div class="mood-stat-num">${n}</div><div class="mood-stat-lbl">${moodLabels[emoji] || emoji}</div></div>
    </div>`).join('');

  // Entries
  const list = document.getElementById('bukuList');
  if (!data.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✨</div><div class="empty-state-text">Belum ada pesan. Jadilah yang pertama!</div></div>';
    return;
  }
  list.innerHTML = data.map(d => `
    <div class="buku-entry">
      <div class="entry-mood">${d.mood || '💛'}</div>
      <div class="entry-msg">${escHtml(d.msg)}</div>
      <div class="entry-foot">
        <span class="entry-anon">Anonim</span>
        <span class="entry-waktu">${d.waktu || ''}</span>
      </div>
    </div>`).join('');
});

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Scroll reveal ──
const obs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) e.target.classList.add('visible');
}), { threshold: 0.08 });
document.querySelectorAll('.rv').forEach(el => obs.observe(el));
