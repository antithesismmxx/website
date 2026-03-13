// ══════════════════════════════════════════════
//  register.js — Pendaftaran Akun ANTITHESIS
// ══════════════════════════════════════════════

import { initializeApp }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
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
  storageBucket:     "antithesis-al-muayyad.firebasestorage.app",
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
function friendlyError(err) {
  if (typeof err === 'string') return '✕  ' + err;
  const code = err?.code || '';
  const map = {
    'auth/email-already-in-use':  '✕  Email sudah digunakan akun lain',
    'auth/invalid-email':          '✕  Format email tidak valid',
    'auth/weak-password':          '✕  Password terlalu lemah (min 8 karakter)',
    'auth/network-request-failed': '✕  Gagal terhubung ke server',
    'auth/too-many-requests':      '✕  Terlalu banyak percobaan. Coba lagi nanti',
  };
  return map[code] || ('✕  ' + (err?.message || 'Terjadi kesalahan, coba lagi'));
}
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

// ── Validasi password kuat ──
function isStrongPassword(pass) {
  return pass.length >= 8 &&
    /[A-Z]/.test(pass) &&
    /[0-9]/.test(pass);
}

// ── Daftar ──
async function doDaftar() {
  hideErr();
  const nama     = document.getElementById('regNama').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const pass     = document.getElementById('regPass').value;
  const pass2    = document.getElementById('regPass2').value;

  // Validasi kosong
  if (!nama || !email || !username || !pass || !pass2) {
    showErr('✕  Lengkapi semua field'); return;
  }
  // Validasi username (no spasi)
  if (/\s/.test(username)) {
    showErr('✕  Username tidak boleh mengandung spasi'); return;
  }
  // Validasi password kuat
  if (!isStrongPassword(pass)) {
    showErr('✕  Password min. 8 karakter, harus ada huruf besar dan angka'); return;
  }
  if (pass !== pass2) {
    showErr('✕  Password tidak cocok'); return;
  }

  setLoading(true);

  try {
    // ── 1. Cek whitelist nama ──
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

    // ── 2. Cek username sudah dipakai ──
    const uSnap = await get(ref(db, 'antithesis/usernames/' + username.toLowerCase()));
    if (uSnap.exists()) {
      showErr('✕  Username sudah digunakan, pilih yang lain');
      setLoading(false); return;
    }

    // ── 3. Buat akun Firebase Auth ──
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = cred.user;

    // ── 4. Update display name = username ──
    await updateProfile(user, { displayName: username });

    // ── 5. Simpan ke database ──
    await set(ref(db, 'antithesis/akun/' + user.uid), {
      nama:      nama,
      username:  username,
      email:     email,
      banned:    false,
      createdAt: Date.now()
    });

    // ── 6. Simpan username agar tidak dobel ──
    await set(ref(db, 'antithesis/usernames/' + username.toLowerCase()), user.uid);

    // ── 7. Simpan session sementara (untuk redirect setelah verifikasi) ──
    sessionStorage.setItem('antithesis_pending_nama',     nama);
    sessionStorage.setItem('antithesis_pending_username', username);
    sessionStorage.setItem('antithesis_pending_uid',      user.uid);

    // ── 8. Kirim email verifikasi ──
    await sendEmailVerification(user, {
      url: window.location.origin + '/dashboard.html'
    });

    // ── 9. Redirect ke halaman tunggu verifikasi ──
    const hint = btoa(email).replace(/=/g, '');
    window.location.href = `verify.html?hint=${hint}&reason=newreg`;

  } catch (err) {
    showErr(friendlyError(err));
    setLoading(false);
  }
}

// ── DOM Ready ──
window.addEventListener('DOMContentLoaded', () => {
  setupToggle('togglePass',  'regPass');
  setupToggle('togglePass2', 'regPass2');

  const btn = document.getElementById('btnDaftar');
  if (btn) btn.addEventListener('click', doDaftar);

  ['regNama','regEmail','regUsername','regPass','regPass2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') doDaftar(); });
  });
});
