// ══════════════════════════════════════════════
//  register.js — Pendaftaran Akun ANTITHESIS
// ══════════════════════════════════════════════

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, get, set }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDF7IAbFI3acQXIHxxoea5cgPTumiUjSMg",
  authDomain:        "antithesis-al-muayyad.firebaseapp.com",
  databaseURL:       "https://antithesis-al-muayyad-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "antithesis-al-muayyad",
  storageBucket:     "antithesis-al-muayyad.appspot.com",
  messagingSenderId: "1014116431079",
  appId:             "1:1014116431079:web:5f490096bf6ecdf7011e42"
};

const EJS_SERVICE  = "service_0ol6msu";
const EJS_TEMPLATE = "ruyjgfi";
const EJS_KEY      = "JTW0LCDn6Cl5MP5IR";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// ── Helpers ──
function showErr(msg) {
  const el = document.getElementById('regErr');
  if (!el) return;
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
  btn.disabled      = loading;
  btn.style.opacity = loading ? '0.6' : '1';
  btn.textContent   = loading ? 'Memproses...' : 'Daftar →';
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use':   '✕  Email sudah digunakan akun lain',
    'auth/invalid-email':           '✕  Format email tidak valid',
    'auth/weak-password':           '✕  Password terlalu lemah (min 6 karakter)',
    'auth/network-request-failed':  '✕  Gagal terhubung ke server',
  };
  return map[code] || '✕  Terjadi kesalahan: ' + code;
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Kirim OTP — gunakan window.emailjs agar kompatibel dengan module scope
async function kirimOTP(toEmail, nama, otp) {
  const ejs = window.emailjs;
  if (!ejs) throw new Error('EmailJS belum dimuat');
  
  const result = await ejs.send(
    EJS_SERVICE,
    EJS_TEMPLATE,
    { to_email: toEmail, nama: nama, otp_code: otp },
    { publicKey: EJS_KEY }
  );
  console.log('EmailJS result:', result);
  return result;
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

// ── Daftar ──
async function doDaftar() {
  hideErr();

  const nama  = document.getElementById('regNama')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const pass  = document.getElementById('regPass')?.value;
  const pass2 = document.getElementById('regPass2')?.value;

  if (!nama || !email || !pass || !pass2) { showErr('✕  Lengkapi semua field'); return; }
  if (pass.length < 6)  { showErr('✕  Password minimal 6 karakter'); return; }
  if (pass !== pass2)   { showErr('✕  Password tidak cocok'); return; }

  // Pastikan EmailJS sudah siap
  if (!window.emailjs) {
    showErr('✕  Halaman belum siap, refresh dan coba lagi'); return;
  }

  setLoading(true);
  let userCreated = null;

  try {
    // ── 1. Cek whitelist ──
    let whitelist = {};
    try {
      const wSnap = await get(ref(db, 'antithesis/whitelist'));
      whitelist = wSnap.val() || {};
    } catch(e) { console.warn('Whitelist skip:', e.message); }

    if (Object.keys(whitelist).length > 0) {
      const namaLower = nama.toLowerCase().trim();
      const cocok = Object.values(whitelist).find(v => {
        const n = typeof v === 'string' ? v : (v.nama || '');
        return n.toLowerCase().trim() === namaLower;
      });
      if (!cocok) {
        showErr('✕  Nama tidak ditemukan dalam daftar anggota');
        setLoading(false); return;
      }
    }

    // ── 2. Buat akun Firebase Auth ──
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    userCreated = cred.user;
    await updateProfile(userCreated, { displayName: nama });

    // ── 3. Simpan data akun ke DB ──
    await set(ref(db, 'antithesis/akun/' + userCreated.uid), {
      nama,
      email,
      banned:    false,
      verified:  false,
      createdAt: Date.now()
    });

    // ── 4. Generate & simpan OTP ──
    const otp     = generateOTP();
    const expired = Date.now() + (10 * 60 * 1000);
    await set(ref(db, 'antithesis/otp/' + userCreated.uid), {
      kode:    otp,
      email:   email,
      expired: expired
    });

    // ── 5. Kirim OTP via EmailJS ──
    await kirimOTP(email, nama, otp);

    // ── 6. Semua sukses → logout & redirect ──
    const uidEnc = btoa(userCreated.uid).replace(/=/g, '');
    const hint   = btoa(email).replace(/=/g, '');
    await signOut(auth);
    window.location.href = `verify.html?uid=${uidEnc}&hint=${hint}&reason=newreg`;

  } catch(err) {
    console.error('Register error detail:', err.status, err.text, err.message, err);

    // Rollback akun Auth jika sudah terbuat
    if (userCreated) {
      try { await userCreated.delete(); console.log('Rollback Auth berhasil'); }
      catch(re) { console.warn('Rollback gagal:', re.message); }
    }

    if (err.message && err.message.includes('PERMISSION_DENIED')) {
      showErr('✕  Akses ditolak — minta admin update Firebase Rules');
    } else if (err.status === 400) {
      showErr('✕  Gagal kirim email OTP — cek konfigurasi EmailJS');
    } else {
      showErr(friendlyError(err.code || err.message));
    }
    setLoading(false);
  }
}

// ── DOM Ready ──
window.addEventListener('DOMContentLoaded', () => {
  // Init EmailJS
  if (window.emailjs) {
    window.emailjs.init({ publicKey: EJS_KEY });
  }

  setupToggle('togglePass',  'regPass');
  setupToggle('togglePass2', 'regPass2');

  const btn = document.getElementById('btnDaftar');
  if (btn) btn.addEventListener('click', doDaftar);

  ['regNama','regEmail','regPass','regPass2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') doDaftar(); });
  });
});
