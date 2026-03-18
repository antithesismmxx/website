// ══════════════════════════════════════════════
//  login.js — Autentikasi ANTITHESIS
// ══════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, ref, get
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

// Redirect kalau sudah login
if (sessionStorage.getItem('antithesis_member')) {
  window.location.href = 'dashboard.html';
}

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

function friendlyError(code) {
  const map = {
    'auth/user-not-found':         '✕  Email tidak terdaftar',
    'auth/wrong-password':         '✕  Password salah',
    'auth/invalid-email':          '✕  Format email tidak valid',
    'auth/too-many-requests':      '✕  Terlalu banyak percobaan, coba lagi nanti',
    'auth/network-request-failed': '✕  Gagal terhubung ke server',
    'auth/invalid-credential':     '✕  Email atau password salah',
  };
  return map[code] || '✕  Terjadi kesalahan: ' + code;
}

window.addEventListener('DOMContentLoaded', () => {

  function setupToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const inp = document.getElementById(inputId);
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });
  }
  setupToggle('toggleLoginPass', 'loginPass');
  setupToggle('toggleGpOld',     'gpOld');
  setupToggle('toggleGpNew',     'gpNew');

  // ── MASUK ──
  async function doLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPass').value;
    hideErr('loginErr');

    if (!email || !pass) {
      showErr('loginErr', '✕  Lengkapi email dan password'); return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const user = cred.user;

      // Ambil data dari database
      const snap = await get(ref(db, 'antithesis/akun/' + user.uid));

      // Cek verified dari database kita (bukan Firebase emailVerified)
      if (snap.exists() && snap.val().verified !== true) {
        showErr('loginErr', '✕  Akun belum diverifikasi, selesaikan verifikasi OTP dulu');
        await auth.signOut();
        return;
      }

      // Cek banned
      if (snap.exists() && snap.val().banned === true) {
        showErr('loginErr', '✕  Akun kamu telah dinonaktifkan');
        await auth.signOut();
        return;
      }

      const nama = snap.exists() ? (snap.val().nama || user.displayName || email) : (user.displayName || email);

      // Simpan session
      const remember = document.getElementById('rememberMe')?.checked;
      if (remember) {
        localStorage.setItem('antithesis_member',   nama);
        localStorage.setItem('antithesis_username', user.uid);
      }
      sessionStorage.setItem('antithesis_member',   nama);
      sessionStorage.setItem('antithesis_username', user.uid);

      window.location.href = 'dashboard.html';

    } catch (err) {
      showErr('loginErr', friendlyError(err.code));
    }
  }

  document.getElementById('btnLogin').addEventListener('click', doLogin);
  ['loginEmail','loginPass'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  });

  // ── MODAL GANTI PASSWORD ──
  document.getElementById('btnOpenPass').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('passModal').classList.add('show');
  });
  document.getElementById('btnCloseModal').addEventListener('click', () => {
    document.getElementById('passModal').classList.remove('show');
  });
  document.getElementById('passModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('show');
  });

  // ── GANTI PASSWORD ──
  document.getElementById('btnGantiPass').addEventListener('click', async () => {
    const email   = document.getElementById('gpEmail').value.trim();
    const oldPass = document.getElementById('gpOld').value;
    const newPass = document.getElementById('gpNew').value;
    hideErr('gpErr');
    const okEl = document.getElementById('gpOk');
    if (okEl) okEl.style.display = 'none';

    if (!email || !oldPass || !newPass) {
      showErr('gpErr', '✕  Lengkapi semua field'); return;
    }
    if (newPass.length < 6) {
      showErr('gpErr', '✕  Password baru minimal 6 karakter'); return;
    }

    try {
      const cred2      = await signInWithEmailAndPassword(auth, email, oldPass);
      const credential = EmailAuthProvider.credential(email, oldPass);
      await reauthenticateWithCredential(cred2.user, credential);
      await updatePassword(cred2.user, newPass);
      await auth.signOut();

      if (okEl) { okEl.textContent = '✓  Password berhasil diubah'; okEl.style.display = 'block'; }
      document.getElementById('gpEmail').value = '';
      document.getElementById('gpOld').value   = '';
      document.getElementById('gpNew').value   = '';
    } catch (err) {
      showErr('gpErr', friendlyError(err.code));
    }
  });

});
