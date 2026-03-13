// ══════════════════════════════════════════════
//  login.js — Autentikasi ANTITHESIS (Firebase Auth)
// ══════════════════════════════════════════════

import { initializeApp }            from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, ref, get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ── Config ──
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

// ── Jika sudah login & verified, langsung ke dashboard ──
auth.onAuthStateChanged(user => {
  if (user && user.emailVerified) {
    window.location.href = 'dashboard.html';
  }
});

// ── Helpers ──
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}
function hideErr(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
function showOk(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function friendlyError(code) {
  const map = {
    'auth/invalid-email':           '✕  Format email tidak valid',
    'auth/user-not-found':          '✕  Akun tidak ditemukan',
    'auth/wrong-password':          '✕  Password salah',
    'auth/invalid-credential':      '✕  Email atau password salah',
    'auth/too-many-requests':       '✕  Terlalu banyak percobaan. Coba lagi nanti',
    'auth/user-disabled':           '✕  Akun ini dinonaktifkan',
    'auth/network-request-failed':  '✕  Gagal terhubung ke server',
    'auth/requires-recent-login':   '✕  Silakan login ulang sebelum ganti password',
    'auth/weak-password':           '✕  Password baru terlalu lemah (min 6 karakter)',
  };
  return map[code] || '✕  Terjadi kesalahan: ' + code;
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? '0.6' : '1';
}

// ══════════════════════════════════════════════
//  MASUK
// ══════════════════════════════════════════════
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;
  hideErr('loginErr');

  if (!email || !pass) {
    showErr('loginErr', '✕  Lengkapi email dan password');
    return;
  }

  setLoading('btnLogin', true);

  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const user = cred.user;

    // ── CEK EMAIL VERIFIED ──
    if (!user.emailVerified) {
      // Kirim ulang email verifikasi
      try { await sendEmailVerification(user); } catch (_) {}
      await signOut(auth);

      const hint = btoa(email).replace(/=/g, '');
      window.location.href = `verify.html?hint=${hint}&reason=unverified`;
      return;
    }

    // ── Verified ✓ ── ambil nama dari DB
    const snap = await get(ref(db, 'antithesis/users/' + user.uid));
    const nama = snap.exists()
      ? (snap.val().nama || user.displayName || email)
      : (user.displayName || email);

    sessionStorage.setItem('antithesis_member',  nama);
    sessionStorage.setItem('antithesis_username', user.displayName || email.split('@')[0]);
    sessionStorage.setItem('antithesis_uid',      user.uid);

    window.location.href = 'dashboard.html';

  } catch (err) {
    showErr('loginErr', friendlyError(err.code));
  } finally {
    setLoading('btnLogin', false);
  }
}

// ══════════════════════════════════════════════
//  GANTI PASSWORD
// ══════════════════════════════════════════════
async function doGantiPass() {
  const email   = document.getElementById('gpEmail').value.trim();
  const oldPass = document.getElementById('gpOld').value;
  const newPass = document.getElementById('gpNew').value;
  hideErr('gpErr');
  const gpOkEl = document.getElementById('gpOk');
  if (gpOkEl) gpOkEl.style.display = 'none';

  if (!email || !oldPass || !newPass) {
    showErr('gpErr', '✕  Lengkapi semua field');
    return;
  }
  if (newPass.length < 6) {
    showErr('gpErr', '✕  Password baru minimal 6 karakter');
    return;
  }
  if (oldPass === newPass) {
    showErr('gpErr', '✕  Password baru harus berbeda dengan yang lama');
    return;
  }

  setLoading('btnGantiPass', true);

  try {
    // Login dulu untuk re-auth
    const cred = await signInWithEmailAndPassword(auth, email, oldPass);
    const user = cred.user;

    const credential = EmailAuthProvider.credential(email, oldPass);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPass);
    await signOut(auth);

    showOk('gpOk', '✓  Password berhasil diubah. Silakan login ulang.');
    document.getElementById('gpEmail').value = '';
    document.getElementById('gpOld').value   = '';
    document.getElementById('gpNew').value   = '';

  } catch (err) {
    showErr('gpErr', friendlyError(err.code));
  } finally {
    setLoading('btnGantiPass', false);
  }
}

// ══════════════════════════════════════════════
//  DOM Ready
// ══════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {

  // Toggle show/hide password
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
  setupToggle('toggleLoginPass', 'loginPass');
  setupToggle('toggleGpOld',     'gpOld');
  setupToggle('toggleGpNew',     'gpNew');

  // Tombol login
  const btnLogin = document.getElementById('btnLogin');
  if (btnLogin) btnLogin.addEventListener('click', doLogin);

  // Enter di form login
  ['loginEmail', 'loginPass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  });

  // Modal ganti password
  const passModal     = document.getElementById('passModal');
  const btnOpenPass   = document.getElementById('btnOpenPass');
  const btnCloseModal = document.getElementById('btnCloseModal');

  if (btnOpenPass)    btnOpenPass.addEventListener('click',  () => passModal?.classList.add('show'));
  if (btnCloseModal)  btnCloseModal.addEventListener('click', () => passModal?.classList.remove('show'));
  if (passModal)      passModal.addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('show');
  });

  // Tombol ganti pass
  const btnGP = document.getElementById('btnGantiPass');
  if (btnGP) btnGP.addEventListener('click', doGantiPass);

  // Enter di form ganti pass
  ['gpEmail', 'gpOld', 'gpNew'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') doGantiPass(); });
  });

  // Link ke register
  const btnToReg = document.getElementById('btnToRegister');
  if (btnToReg) btnToReg.addEventListener('click', () => {
    window.location.href = 'register.html';
  });
});
