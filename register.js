// ══════════════════════════════════════════════
//  register.js — Pendaftaran Akun ANTITHESIS
// ══════════════════════════════════════════════

import { initializeApp }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, ref, get, set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDF7IAbFI3acQXIHxxoea5cgPTumiUjSMg",
  authDomain:        "antithesis-al-muayyad.firebaseapp.com",
  databaseURL:       "https://antithesis-al-muayyad-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "antithesis-al-muayyad",
  storageBucket:     "antithesis-al-muayyad.appspot.com",
  messagingSenderId: "1014116431079",
  appId:             "1:1014116431079:web:5f490096bf6ecdf7011e42"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// ── Helpers ──
function showErr(msg) {
  const el = document.getElementById('regErr');
  el.textContent = msg;
  el.style.display = 'block';
}
function hideErr() {
  const el = document.getElementById('regErr');
  if (el) el.style.display = 'none';
}
function setLoading(loading) {
  const btn = document.getElementById('btnDaftar');
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? '0.6' : '1';
  btn.textContent = loading ? 'Memproses...' : 'Daftar →';
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use':  '✕  Email sudah digunakan akun lain',
    'auth/invalid-email':          '✕  Format email tidak valid',
    'auth/weak-password':          '✕  Password terlalu lemah (min 6 karakter)',
    'auth/network-request-failed': '✕  Gagal terhubung ke server',
  };
  return map[code] || '✕  Terjadi kesalahan: ' + code;
}

// ── Toggle password ──
function setupToggle(btnId, inputId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.textContent = inp.type === 'password' ? '👁' : '🙈';
  });
}

// ── Daftar ──
async function doDaftar() {
  hideErr();
  const nama  = document.getElementById('regNama').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass  = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;

  if (!nama || !email || !pass || !pass2) {
    showErr('✕  Lengkapi semua field'); return;
  }
  if (pass.length < 6) {
    showErr('✕  Password minimal 6 karakter'); return;
  }
  if (pass !== pass2) {
    showErr('✕  Password tidak cocok'); return;
  }

  setLoading(true);

  try {
    // ── 1. Cek whitelist ──
    const wSnap = await get(ref(db, 'antithesis/whitelist'));
    const whitelist = wSnap.val() || {};

    const namaLower = nama.toLowerCase().trim();
    const cocok = Object.values(whitelist).find(v => {
      const n = typeof v === 'string' ? v : (v.nama || '');
      return n.toLowerCase().trim() === namaLower;
    });

    if (!cocok) {
      showErr('✕  Nama tidak ditemukan dalam daftar anggota');
      setLoading(false); return;
    }

    // ── 2. Buat akun Firebase Auth ──
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = cred.user;

    // ── 3. Update display name ──
    await updateProfile(user, { displayName: nama });

    // ── 4. Simpan ke database antithesis/akun/{uid} ──
    await set(ref(db, 'antithesis/akun/' + user.uid), {
      nama:  nama,
      email: email,
      banned: false,
      createdAt: Date.now()
    });

    // ── 5. Kirim email verifikasi ──
    await sendEmailVerification(user);
    await signOut(auth);

    // ── 6. Redirect ke verify ──
    const hint = btoa(email).replace(/=/g, '');
    window.location.href = `verify.html?hint=${hint}&reason=newreg`;

  } catch (err) {
    showErr(friendlyError(err.code));
    setLoading(false);
  }
}

// ── DOM Ready ──
window.addEventListener('DOMContentLoaded', () => {
  setupToggle('togglePass',  'regPass');
  setupToggle('togglePass2', 'regPass2');

  const btn = document.getElementById('btnDaftar');
  if (btn) btn.addEventListener('click', doDaftar);

  ['regNama','regEmail','regPass','regPass2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') doDaftar(); });
  });
});
