// ══════════════════════════════════════════════
//  ANTITHESIS — login.js
//  Firebase Authentication (Email + Password)
// ══════════════════════════════════════════════

import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get }             from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── Firebase Config ──
const app = initializeApp({
  apiKey:            "AIzaSyDF7IAbfI3acQXIHxxoea5cgPTumiUjSMg",
  authDomain:        "antithesis-al-muayyad.firebaseapp.com",
  databaseURL:       "https://antithesis-al-muayyad-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "antithesis-al-muayyad",
  storageBucket:     "antithesis-al-muayyad.firebasestorage.app",
  messagingSenderId: "1014116431079",
  appId:             "1:1014116431079:web:5f490096bf6ecdf7011e42"
});

const auth = getAuth(app);
const db   = getDatabase(app);

// ── Helpers ──
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent    = msg;
  el.style.display  = 'block';
  el.style.color    = '';
  el.style.background = '';
  el.style.border   = '';
}
function hideErr(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
function showOk(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent   = msg;
  el.style.display = 'block';
}
function firebaseErrMsg(code) {
  const map = {
    'auth/email-already-in-use':    'Email sudah terdaftar. Silakan masuk.',
    'auth/invalid-email':           'Format email tidak valid.',
    'auth/weak-password':           'Password minimal 6 karakter.',
    'auth/user-not-found':          'Akun tidak ditemukan.',
    'auth/wrong-password':          'Password salah.',
    'auth/invalid-credential':      'Email atau password salah.',
    'auth/too-many-requests':       'Terlalu banyak percobaan. Coba lagi nanti.',
    'auth/user-disabled':           'Akun ini dinonaktifkan.',
    'auth/network-request-failed':  'Periksa koneksi internet kamu.',
  };
  return map[code] || 'Terjadi kesalahan. Coba lagi.';
}

// ── Redirect jika sudah login ──
onAuthStateChanged(auth, user => {
  if (user && user.emailVerified) {
    window.location.href = 'dashboard.html';
  }
});

// ══════════════════════════
//  TAB SWITCHING
// ══════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b  => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ══════════════════════════
//  MASUK (LOGIN)
// ══════════════════════════
document.getElementById('btnLogin')?.addEventListener('click', async () => {
  hideErr('loginErr');
  const email = document.getElementById('loginUser').value.trim();
  const pass  = document.getElementById('loginPass').value;

  if (!email) return showErr('loginErr', 'Email wajib diisi.');
  if (!pass)  return showErr('loginErr', 'Password wajib diisi.');

  const btn = document.getElementById('btnLogin');
  btn.textContent = 'Memproses...'; btn.disabled = true;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (!cred.user.emailVerified) {
      await auth.signOut();
      showErr('loginErr', 'Email belum diverifikasi. Cek inbox kamu.');
      return;
    }
    window.location.href = 'dashboard.html';
  } catch (e) {
    showErr('loginErr', firebaseErrMsg(e.code));
  } finally {
    btn.textContent = 'Masuk →'; btn.disabled = false;
  }
});

// ── Toggle password (login) ──
document.getElementById('toggleLoginPass')?.addEventListener('click', function() {
  const inp = document.getElementById('loginPass');
  inp.type        = inp.type === 'password' ? 'text' : 'password';
  this.textContent = inp.type === 'password' ? '👁' : '🙈';
});

// ══════════════════════════
//  DAFTAR — MULTI STEP
// ══════════════════════════
function goStep(n) {
  [1, 2].forEach(i => {
    const step = document.getElementById('daftarStep' + i);
    if (step) step.style.display = i === n ? 'block' : 'none';
    const dot = document.getElementById('stepDot' + i);
    if (dot) {
      dot.classList.remove('active', 'done');
      if (i === n) dot.classList.add('active');
      if (i < n)  dot.classList.add('done');
    }
  });
  document.querySelectorAll('.step-line').forEach((l, idx) => {
    l.classList.toggle('done', idx < n - 1);
  });
}

// STEP 1 → STEP 2 (validasi nama + email, lanjut ke password)
document.getElementById('btnKirimKode')?.addEventListener('click', () => {
  hideErr('regErr1');
  const nama  = document.getElementById('regNama').value.trim();
  const email = document.getElementById('regEmail').value.trim();

  if (!nama)                      return showErr('regErr1', 'Nama lengkap wajib diisi.');
  if (!email || !email.includes('@')) return showErr('regErr1', 'Format email tidak valid.');

  // Simpan sementara di session
  sessionStorage.setItem('reg_nama',  nama);
  sessionStorage.setItem('reg_email', email);

  goStep(2);
});

// STEP 2 → Buat akun Firebase + kirim verifikasi
document.getElementById('btnDaftar')?.addEventListener('click', async () => {
  hideErr('regErr3');
  const pass  = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  const nama  = sessionStorage.getItem('reg_nama')  || '';
  const email = sessionStorage.getItem('reg_email') || '';

  if (!pass)           return showErr('regErr3', 'Password wajib diisi.');
  if (pass.length < 6) return showErr('regErr3', 'Password minimal 6 karakter.');
  if (pass !== pass2)  return showErr('regErr3', 'Konfirmasi password tidak cocok.');

  const btn = document.getElementById('btnDaftar');
  btn.textContent = 'Membuat akun...'; btn.disabled = true;

  try {
    // Buat akun Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    // Set display name
    await updateProfile(cred.user, { displayName: nama });

    // Simpan data ke Realtime Database
    await set(ref(db, 'antithesis/akun/' + cred.user.uid), {
      nama,
      email,
      createdAt: Date.now(),
      verified:  false
    });

    // Kirim email verifikasi (Firebase kirim otomatis)
    await sendEmailVerification(cred.user);

    // Logout dulu — harus verifikasi email sebelum bisa masuk
    await auth.signOut();

    showOk('regOk', '✦ Akun dibuat! Cek email ' + email + ' untuk verifikasi.');
    btn.textContent = 'Selesai'; btn.disabled = true;

    // Alihkan ke tab masuk setelah 3 detik
    setTimeout(() => {
      document.querySelector('[data-tab="masuk"]').click();
      document.getElementById('loginUser').value = email;
    }, 3000);

  } catch (e) {
    showErr('regErr3', firebaseErrMsg(e.code));
    btn.textContent = 'Selesai & Masuk →'; btn.disabled = false;
  }
});

// ── Toggle password (daftar) ──
['toggleRegPass', 'toggleRegPass2'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', function() {
    const inp = this.previousElementSibling;
    inp.type         = inp.type === 'password' ? 'text' : 'password';
    this.textContent = inp.type === 'password' ? '👁' : '🙈';
  });
});

// ══════════════════════════
//  LUPA PASSWORD (RESET)
// ══════════════════════════
document.getElementById('btnOpenPass')?.addEventListener('click', () => {
  document.getElementById('passModal').classList.add('show');
});
document.getElementById('btnCloseModal')?.addEventListener('click', () => {
  document.getElementById('passModal').classList.remove('show');
});

document.getElementById('btnGantiPass')?.addEventListener('click', async () => {
  hideErr('gpErr');
  const email = document.getElementById('gpUser').value.trim();
  if (!email || !email.includes('@')) return showErr('gpErr', 'Masukkan email yang valid.');

  const btn = document.getElementById('btnGantiPass');
  btn.textContent = 'Mengirim...'; btn.disabled = true;

  try {
    await sendPasswordResetEmail(auth, email);
    document.getElementById('gpOk').style.display = 'block';
    document.getElementById('gpOk').textContent   = '✦ Link reset dikirim ke ' + email;
    btn.textContent = 'Terkirim!';
  } catch (e) {
    showErr('gpErr', firebaseErrMsg(e.code));
    btn.textContent = 'Ganti Password →'; btn.disabled = false;
  }
});

// ── Tombol kembali ke step 1 ──
document.getElementById('btnBackStep1')?.addEventListener('click', () => goStep(1));
