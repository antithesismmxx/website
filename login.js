// ══════════════════════════════════════════════
//  ANTITHESIS — login.js
//  Firebase Auth + Whitelist + Email Verification
// ══════════════════════════════════════════════

import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get }             from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp({
  apiKey:            "AIzaSyDF7IAbFI3acQXIHxxoea5cgPTumiUjSMg",
  authDomain:        "antithesis-al-muayyad.firebaseapp.com",
  databaseURL:       "https://antithesis-al-muayyad-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "antithesis-al-muayyad",
  storageBucket:     "antithesis-al-muayyad.firebasestorage.app",
  messagingSenderId: "1014116431079",
  appId:             "1:1014116431079:web:5f490096bf6ecdf7011e42"
});

const auth = getAuth(app);
const db   = getDatabase(app);

// ── Pastikan user ter-logout saat buka halaman login ──
signOut(auth).catch(() => {});

// ── Helpers ──
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent   = msg;
  el.style.display = 'block';
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
    'auth/email-already-in-use':   'Email sudah terdaftar. Silakan masuk.',
    'auth/invalid-email':          'Format email tidak valid.',
    'auth/weak-password':          'Password minimal 6 karakter.',
    'auth/user-not-found':         'Akun tidak ditemukan.',
    'auth/wrong-password':         'Password salah.',
    'auth/invalid-credential':     'Email atau password salah.',
    'auth/too-many-requests':      'Terlalu banyak percobaan. Coba lagi nanti.',
    'auth/user-disabled':          'Akun ini dinonaktifkan.',
    'auth/network-request-failed': 'Periksa koneksi internet kamu.',
  };
  return map[code] || 'Terjadi kesalahan. Coba lagi.';
}

// ── Cek whitelist ──
async function cekWhitelist(nama) {
  const snap = await get(ref(db, 'antithesis/whitelist'));
  if (!snap.exists()) return false;
  const namaLower = nama.trim().toLowerCase();
  return Object.values(snap.val()).some(item =>
    (item.nama || item || '').toString().toLowerCase() === namaLower
  );
}

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

    // Cek verifikasi email
    if (!cred.user.emailVerified) {
      await signOut(auth);
      sessionStorage.setItem('pending_verif_email', email);
      document.getElementById('btnResendVerif').style.display = 'block';
      showErr('loginErr', '✕ Email belum diverifikasi. Cek inbox/spam lalu klik link verifikasi.');
      btn.textContent = 'Masuk →'; btn.disabled = false;
      return;
    }

    // Cek banned
    const akunSnap = await get(ref(db, 'antithesis/akun'));
    if (akunSnap.exists()) {
      const myAkun = Object.values(akunSnap.val()).find(a => a.email === email);
      if (myAkun && myAkun.banned === true) {
        await signOut(auth);
        showErr('loginErr', '✕ Akun kamu telah dinonaktifkan. Hubungi admin.');
        btn.textContent = 'Masuk →'; btn.disabled = false;
        return;
      }
    }

    // Login sukses
    sessionStorage.setItem('antithesis_member', cred.user.displayName || cred.user.email);
    sessionStorage.setItem('antithesis_username', cred.user.email.split('@')[0]);
    window.location.href = 'dashboard.html';

  } catch (e) {
    showErr('loginErr', firebaseErrMsg(e.code));
    btn.textContent = 'Masuk →'; btn.disabled = false;
  }
});

// ── Kirim ulang verifikasi ──
document.getElementById('btnResendVerif')?.addEventListener('click', async () => {
  const email = sessionStorage.getItem('pending_verif_email') || '';
  const pass  = document.getElementById('loginPass').value;
  if (!email || !pass) return showErr('loginErr', 'Masukkan password dulu.');
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (cred.user.emailVerified) {
      showOk('loginOk', '✦ Email sudah terverifikasi! Silakan masuk.');
    } else {
      await sendEmailVerification(cred.user);
      showOk('loginOk', '✦ Email verifikasi dikirim ulang! Cek inbox kamu.');
    }
    await signOut(auth);
  } catch (e) {
    showErr('loginErr', firebaseErrMsg(e.code));
  }
});

// ── Toggle password ──
document.getElementById('toggleLoginPass')?.addEventListener('click', function() {
  const inp = document.getElementById('loginPass');
  inp.type         = inp.type === 'password' ? 'text' : 'password';
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
      if (i < n)   dot.classList.add('done');
    }
  });
  document.querySelectorAll('.step-line').forEach((l, idx) => {
    l.classList.toggle('done', idx < n - 1);
  });
}

// STEP 1 → cek whitelist
document.getElementById('btnKirimKode')?.addEventListener('click', async () => {
  hideErr('regErr1');
  const nama  = document.getElementById('regNama').value.trim();
  const email = document.getElementById('regEmail').value.trim();

  if (!nama)                          return showErr('regErr1', 'Nama lengkap wajib diisi.');
  if (!email || !email.includes('@')) return showErr('regErr1', 'Format email tidak valid.');

  const btn = document.getElementById('btnKirimKode');
  btn.textContent = 'Memeriksa...'; btn.disabled = true;

  try {
    const diizinkan = await cekWhitelist(nama);
    if (!diizinkan) {
      showErr('regErr1', '✕ Nama tidak ada dalam daftar anggota. Hubungi admin.');
      btn.textContent = 'Lanjut →'; btn.disabled = false;
      return;
    }
    sessionStorage.setItem('reg_nama',  nama);
    sessionStorage.setItem('reg_email', email);
    btn.textContent = 'Lanjut →'; btn.disabled = false;
    goStep(2);
  } catch (e) {
    showErr('regErr1', 'Gagal memeriksa data. Cek koneksi kamu.');
    btn.textContent = 'Lanjut →'; btn.disabled = false;
  }
});

// STEP 2 → Buat akun + kirim verifikasi
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
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: nama });
    await sendEmailVerification(cred.user);
    await set(ref(db, 'antithesis/akun/' + cred.user.uid), {
      nama, email, createdAt: Date.now(), verified: false
    });
    await signOut(auth);

    document.getElementById('daftarStep2').innerHTML = `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:3rem;margin-bottom:16px;">📧</div>
        <div style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;color:var(--white);margin-bottom:10px;">
          Cek <em style="color:var(--gold)">Email Kamu!</em>
        </div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:1rem;font-style:italic;color:var(--muted);line-height:1.8;margin-bottom:24px;">
          Link verifikasi sudah dikirim ke<br>
          <strong style="color:var(--cream);font-style:normal;">${email}</strong><br><br>
          Klik link di email tersebut, lalu kembali ke sini untuk masuk.
        </div>
        <button onclick="document.querySelector('[data-tab=masuk]').click()" class="btn btn-primary">
          Ke Halaman Masuk →
        </button>
        <div style="font-family:'Cormorant Garamond',serif;font-size:.85rem;font-style:italic;color:var(--muted2);margin-top:14px;">
          Tidak menerima email? Cek folder spam.
        </div>
      </div>`;

  } catch (e) {
    showErr('regErr3', firebaseErrMsg(e.code));
    btn.textContent = 'Selesai & Masuk →'; btn.disabled = false;
  }
});

// ── Toggle password daftar ──
['toggleRegPass', 'toggleRegPass2'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', function() {
    const inp = this.previousElementSibling;
    inp.type         = inp.type === 'password' ? 'text' : 'password';
    this.textContent = inp.type === 'password' ? '👁' : '🙈';
  });
});

// ══════════════════════════
//  LUPA PASSWORD
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
    btn.textContent = 'Kirim Link Reset →'; btn.disabled = false;
  }
});

document.getElementById('btnBackStep1')?.addEventListener('click', () => goStep(1));
