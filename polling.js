// ══════════════════════════════════════════════
//  polling.js — ANTITHESIS Polling Acara
// ══════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, get, set, push, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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

// ── Auth ──
const nama     = sessionStorage.getItem('antithesis_member');
const username = sessionStorage.getItem('antithesis_username');
if (!nama) { window.location.href = 'login.html'; }

document.getElementById('navNama').textContent = nama;
document.getElementById('btnLogout').addEventListener('click', () => { sessionStorage.clear(); window.location.href = 'login.html'; });
document.getElementById('navHam').addEventListener('click', () => document.getElementById('navLinks').classList.toggle('open'));

// ── Toast ──
function toast(msg) {
  let t = document.getElementById('__toast');
  if (!t) {
    t = document.createElement('div'); t.id = '__toast';
    t.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(16px);background:#111;border:1px solid rgba(201,168,76,.35);color:#c9a84c;font-family:Montserrat,sans-serif;font-size:.5rem;letter-spacing:.25em;text-transform:uppercase;padding:12px 26px;z-index:9999;opacity:0;transition:all .4s;pointer-events:none;white-space:nowrap;box-shadow:0 8px 36px rgba(0,0,0,.6);';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t.__tid);
  t.__tid = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(16px)'; }, 3200);
}

// ── Populate selects ──
const tglSel = document.getElementById('reqTgl');
for (let i = 1; i <= 31; i++) { const o = document.createElement('option'); o.value = String(i); o.textContent = i; tglSel.appendChild(o); }
const tahunSel = document.getElementById('reqTahun');
for (let y = 2025; y <= 2030; y++) { const o = document.createElement('option'); o.value = y; o.textContent = y; tahunSel.appendChild(o); }

// ── State ──
let selType = null, selLokasi = null;
let acaraAktif = false;
let voteData   = {};
let reqData    = [];

const bln = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const icons = { HBH: '🌙', Bukber: '🍽️', 'Temu Kangen': '🤝' };
const keyMap = { HBH: 'HBH', Bukber: 'Bukber', 'Temu Kangen': 'Temu' };

// ── Acara listener ──
onValue(ref(db, 'antithesis/acara'), snap => {
  acaraAktif = !!(snap.val() && snap.val().date);
  document.getElementById('voteLocked').classList.toggle('show', acaraAktif);
  renderVote();
});

// ── Vote listener ──
onValue(ref(db, 'antithesis/votes'), snap => {
  voteData = snap.val() || {};
  renderVote();
});

// ── Request listener ──
onValue(ref(db, 'antithesis/requests'), snap => {
  const raw = snap.val() || {};
  reqData = Object.entries(raw).map(([id, v]) => ({ id, ...v }));
  renderReq();
});

// ── Render vote cards ──
function renderVote() {
  const types  = ['HBH', 'Bukber', 'Temu Kangen'];
  const myVote = voteData[username] || null;
  const tally  = { HBH: 0, Bukber: 0, 'Temu Kangen': 0 };
  Object.values(voteData).forEach(v => { if (v && tally[v] !== undefined) tally[v]++; });
  const total = Object.values(tally).reduce((a, b) => a + b, 0);
  const maxV  = Math.max(...Object.values(tally), 1);

  types.forEach(type => {
    const key   = keyMap[type];
    const votes = tally[type];
    const pct   = total > 0 ? Math.round(votes / maxV * 100) : 0;
    const card  = document.getElementById('vc-' + key);
    const bar   = document.getElementById('vbar-' + key);
    const vv    = document.getElementById('vvotes-' + key);
    const check = document.getElementById('vcheck-' + key);
    if (!card) return;
    card.classList.toggle('voted',    myVote === type);
    card.classList.toggle('terkunci', acaraAktif);
    if (check) check.style.color = myVote === type ? 'var(--black)' : 'transparent';
    if (vv)    vv.textContent = votes;
    if (bar)   setTimeout(() => bar.style.width = pct + '%', 80);
  });

  const statusEl = document.getElementById('voteStatus');
  if (acaraAktif) {
    statusEl.textContent = 'Voting ditutup — acara telah ditetapkan.';
    statusEl.className   = 'vote-status rv d3';
  } else if (myVote) {
    statusEl.textContent = `✦ Kamu sudah memilih ${myVote}. Suaramu tercatat permanen.`;
    statusEl.className   = 'vote-status sudah rv d3';
  } else {
    statusEl.textContent = total > 0 ? `${total} anggota sudah memilih. Giliranmu!` : 'Belum ada suara. Jadilah yang pertama!';
    statusEl.className   = 'vote-status rv d3';
  }
}

// ── Kirim vote ──
window.kirimVote = async function (type) {
  if (acaraAktif) { toast('Voting ditutup — acara sudah ditetapkan.'); return; }
  const snap = await get(ref(db, 'antithesis/votes/' + username));
  if (snap.exists()) { toast('Kamu sudah memilih ' + snap.val() + '.'); return; }
  if (!confirm(`Pilih ${type}?\n\nSuara tidak bisa diubah setelah dikonfirmasi.`)) return;
  set(ref(db, 'antithesis/votes/' + username), type)
    .then(() => toast('✦ Suaramu untuk ' + type + ' tercatat!'))
    .catch(() => toast('Gagal mengirim suara. Coba lagi.'));
};

// ── Toggle form usulan ──
const btnToggle = document.getElementById('btnToggleUsulan');
const usulanForm = document.getElementById('usulanForm');
btnToggle.addEventListener('click', () => {
  usulanForm.classList.toggle('show');
  btnToggle.textContent = usulanForm.classList.contains('show') ? '✕ Tutup' : '+ Tambah Usulan';
});
document.getElementById('btnCancelUsulan').addEventListener('click', () => {
  usulanForm.classList.remove('show');
  btnToggle.textContent = '+ Tambah Usulan';
});

// Jenis pills
document.querySelectorAll('.jp').forEach(b => b.addEventListener('click', function () {
  document.querySelectorAll('.jp').forEach(x => x.classList.remove('active'));
  this.classList.add('active'); selType = this.dataset.type;
}));
// Lokasi pills
document.querySelectorAll('.lp').forEach(p => p.addEventListener('click', function () {
  document.querySelectorAll('.lp').forEach(x => x.classList.remove('active'));
  this.classList.add('active'); selLokasi = this.dataset.lokasi;
}));

// ── Kirim usulan ──
document.getElementById('btnReq').addEventListener('click', () => {
  const tgl    = document.getElementById('reqTgl').value;
  const bulan  = document.getElementById('reqBulan').value;
  const tahun  = document.getElementById('reqTahun').value;
  const catatan= document.getElementById('reqCatatan').value.trim();
  const errEl  = document.getElementById('reqErr');
  errEl.style.display = 'none';

  if (!selType)              { errEl.textContent = '✕ Pilih jenis acara'; errEl.style.display = 'block'; return; }
  if (!tgl || !bulan || !tahun) { errEl.textContent = '✕ Lengkapi tanggal'; errEl.style.display = 'block'; return; }
  if (!selLokasi)            { errEl.textContent = '✕ Pilih lokasi'; errEl.style.display = 'block'; return; }

  push(ref(db, 'antithesis/requests'), { type: selType, tgl, bulan, tahun, lokasi: selLokasi, catatan, submitter: username });

  document.getElementById('reqTypeConf').textContent = selType;
  document.getElementById('reqOk').style.display = 'block';
  document.getElementById('reqTgl').value = '';
  document.getElementById('reqBulan').value = '';
  document.getElementById('reqTahun').value = '';
  document.getElementById('reqCatatan').value = '';
  document.querySelectorAll('.jp').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.lp').forEach(b => b.classList.remove('active'));
  selType = null; selLokasi = null;

  setTimeout(() => {
    document.getElementById('reqOk').style.display = 'none';
    usulanForm.classList.remove('show');
    btnToggle.textContent = '+ Tambah Usulan';
  }, 3000);
});

// ── Render usulan ──
function renderReq() {
  const el = document.getElementById('reqEntries');
  document.getElementById('reqCount').textContent = reqData.length;
  if (!reqData.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💌</div><div class="empty-state-text">Belum ada usulan detail.</div></div>';
    return;
  }
  el.innerHTML = [...reqData].reverse().map(r => {
    const isOwner = r.submitter === username;
    const delBtn  = isOwner ? `<button class="ue-del" onclick="hapusUsulan('${r.id}')" title="Hapus">🗑</button>` : '';
    return `<div class="ue" id="ue-${r.id}">
      <div class="ue-left">
        <div class="ue-type">${icons[r.type] || '📅'} ${r.type}</div>
        <div class="ue-detail">📍 ${r.lokasi} &nbsp;·&nbsp; 📅 ${r.tgl} ${bln[+r.bulan] || ''} ${r.tahun}</div>
        ${r.catatan ? `<div class="ue-detail ue-catatan">"${r.catatan}"</div>` : ''}
        <div class="ue-from" style="margin-top:6px;">@${r.submitter || '?'}</div>
      </div>
      ${delBtn}
    </div>`;
  }).join('');
}

window.hapusUsulan = function (id) {
  if (!confirm('Hapus usulan ini?')) return;
  remove(ref(db, 'antithesis/requests/' + id)).then(() => toast('✦ Usulan dihapus.'));
};

// ── Scroll reveal ──
const obs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) e.target.classList.add('visible');
}), { threshold: 0.08 });
document.querySelectorAll('.rv').forEach(el => obs.observe(el));
