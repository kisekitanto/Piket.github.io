// ===== NAMA KETUA PIKET: GANTI DI SINI =====
// Isi nama ketua piket tiap hari. Nama ini tampil di pojok kanan atas dan di pengumuman.
// Kalau dikosongkan (""), barisnya tidak ditampilkan.
const KETUA = { senin: "Rahman", selasa: "Nataka", rabu: "Radin", kamis: "Kaka", jumat: "Lutfi" };

// ===== DATA TETAP (ubah di sini kalau perlu) =====
const baca = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const AKUN_BAWAAN = { senin: { u: "Senin", p: "Senin123" }, selasa: { u: "Selasa", p: "Selasa123" }, rabu: { u: "Rabu", p: "Rabu123" }, kamis: { u: "Kamis", p: "Kamis123" }, jumat: { u: "Jumat", p: "Jumat123" }, guru: { u: "Guru", p: "Guru123" } };
let AKUN = Object.assign({}, AKUN_BAWAAN, baca("piketLogin", {})); // login bisa diubah lewat Pengaturan
const GURU = "guru", URUT = ["senin", "selasa", "rabu", "kamis", "jumat"];
// Nomor WhatsApp guru untuk menerima permintaan ubah nama (format 628xxxxxxxxxx). Kosong = pengirim pilih kontak sendiri.
const NOMOR_GURU = "";
const NAMA_AKUN = { senin: "Senin", selasa: "Selasa", rabu: "Rabu", kamis: "Kamis", jumat: "Jumat" };
// Nama petugas tiap hari (dari foto jadwal). Ubah di sini kalau ada yang salah baca.
const NAMA_BAWAAN = {
  senin: ["Rahman", "Fauzan", "Moses", "Nova", "Latief", "Zahra", "Citra", "Fara"],
  selasa: ["Akma", "Haidar", "Rizki", "Nataka", "Wisnu", "Nabila", "Ais"],
  rabu: ["Nico", "Bastian", "Haikal", "Bagus", "Radin", "Mumut", "Rissa", "Vazza"],
  kamis: ["Agi", "Daffin", "Kaka", "Akmal", "Eri", "Rahma", "Ima"],
  jumat: ["Fathan", "Farel", "Lutfi", "Cahya", "Imam", "zilla", "Mazaya", "Vita"]
};
// Nama anggota: dibaca dari names.json (diunggah guru). Kalau file tidak ada, pakai NAMA_BAWAAN di atas.
const NAMA = JSON.parse(JSON.stringify(NAMA_BAWAAN));
let namaDiperbarui = "";
async function muatNama() {
  try {
    const r = await fetch("names.json", { cache: "no-store" }); if (!r.ok) return;
    const d = await r.json(), n = d && d.nama; if (!n) return;
    URUT.forEach(h => { if (Array.isArray(n[h])) { const l = n[h].map(x => String(x).trim()).filter(Boolean); if (l.length) NAMA[h] = l; } });
    namaDiperbarui = d.diperbarui || "";
  } catch (e) { }
}
function bersihDraf() { draf.slot.forEach(w => w.forEach(x => { if (x.n && !NAMA[akun].includes(x.n)) { x.n = ""; x.j = []; } })); }
const JOBS = ["Menyapu Dalam Kelas", "Menyapu Luar Kelas", "Membersihkan Kaca", "Mengumpulkan HP", "Mengambil HP", "Buang Sampah", "Mengepel Dalam Kelas", "Mengepel Luar Kelas", "Membersihkan dan Mengatur Meja/Kursi", "Membersihkan Papan Tulis", "memastikan kelas rapi dan bersih"];
const WAKTU = ["Sebelum apel pagi", "Istirahat pertama", "Istirahat kedua", "Sebelum apel sore", "Saat pulang"];
const SLOT = 4, MAX_SALAH = 5, KUNCI_DETIK = 30, IDLE_MENIT = 30;
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// ===== TEKS FIKSASI (PUNISHMENT) - jangan dihapus di web, ubah di kode aja =====
const PUNISHMENT_TEXT = `📢 PUNISHMENT JIKA TIDAK PIKET! 📢
Level 1 - Buat video klarifikasi 🎥
Level 2 - Membersihkan pantry sampai BERSIH 🧹✨
Level 3 - Bikin PPT "About Me" selucu mungkin & ditampilkan saat bilas 📊😂
Level 4 - Membeli kebutuhan kelas minimal Rp25.000 🛒💸
Level 5 - Denda Rp100.000 (Bendahara pasti senang) 💰😎

⚠️ Noted: Level akan bertambah kalau ada yang tidak piket atau tidak laksanakan punishment-nya. Kalau kamu TIDAK laksanakan punishment, kamu akan laksanakan punishment selanjutnya + punishment sebelumnya. Masih "bandel"? Urusannya sama Wali Kelas ya 👋😉`;

// ===== KEADAAN APLIKASI =====
const $ = id => document.getElementById(id);
const baru = () => ({ tanggal: "", slot: WAKTU.map(() => Array.from({ length: SLOT }, () => ({ n: "", j: [] }))) });
let akun = null, draf = baru(), preview = null;
let salah = 0, kunciSampai = 0, timerKunci, timerCopy, aktifTerakhir = Date.now();

// ===== ALAT BANTU =====
const pad = n => String(n).padStart(2, "0");
const iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function besok() { const d = new Date(), h = d.getDay(); d.setDate(d.getDate() + (h === 5 ? 3 : h === 6 ? 2 : 1)); return d; } // Jumat/Sabtu/Minggu -> Senin
const besokIso = () => iso(besok());
function fmtIso(s) { const [y, m, t] = s.split("-").map(Number); return HARI[new Date(y, m - 1, t).getDay()] + ", " + t + " " + BULAN[m - 1] + " " + y; }
const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function pesan(el, teks, jenis, ms) { el.textContent = teks; el.className = "msg " + (jenis || ""); if (ms) setTimeout(() => { if (el.textContent === teks) el.textContent = ""; }, ms); }
const adaIsi = () => draf.slot.some(w => w.some(s => s.n || s.j.length));
const kedaluwarsa = () => adaIsi() && draf.tanggal && draf.tanggal < besokIso();

// ===== LOGIN =====
$("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  if (Date.now() < kunciSampai) return;
  const u = $("un").value.trim().toLowerCase(), p = $("pw").value, m = $("loginMsg");
  if (!u || !p) { pesan(m, "Harap isi Username dan Password!", "err"); (u ? $("pw") : $("un")).focus(); return; }
  const id = Object.keys(AKUN).find(h => AKUN[h].u.toLowerCase() === u);
  if (id && AKUN[id].p === p) { salah = 0; sessionStorage.setItem("piketAkun", id); masuk(id); return; }
  salah++; $("pw").value = ""; $("pw").focus();
  if (salah >= MAX_SALAH) { salah = 0; kunciSampai = Date.now() + KUNCI_DETIK * 1000; hitungKunci(); }
  else pesan(m, "Username atau Password salah!", "err");
});
["un", "pw"].forEach(id => $(id).addEventListener("input", () => { if (Date.now() >= kunciSampai) pesan($("loginMsg"), ""); }));
function hitungKunci() {
  clearInterval(timerKunci);
  const tik = () => {
    const s = Math.ceil((kunciSampai - Date.now()) / 1000);
    if (s <= 0) { clearInterval(timerKunci); $("btnLogin").disabled = false; pesan($("loginMsg"), ""); return; }
    $("btnLogin").disabled = true; pesan($("loginMsg"), "Terlalu banyak percobaan. Coba lagi dalam " + s + " detik.", "err");
  };
  tik(); timerKunci = setInterval(tik, 1000);
}
function masuk(k) {
  if (k === GURU) return masukGuru();
  akun = k; aktifTerakhir = Date.now(); preview = null; draf = baru();
  try { const d = JSON.parse(localStorage.getItem("piketDraf2:" + k)); if (d && Array.isArray(d.slot) && d.slot.length === WAKTU.length && d.slot.every(w => w.length === SLOT)) draf = d; } catch (e) { }
  bersihDraf(); document.querySelector(".layout").hidden = false; $("guruView").hidden = true;
  $("login").hidden = true; $("app").hidden = false;
  $("userName").textContent = (KETUA[k] ? "Ketua: " + KETUA[k] + " · " : "") + NAMA_AKUN[k];
  pesan($("buatMsg"), ""); bangun(); segarkan(); renderDaftarHari();
}
function keluar(teks) {
  akun = null; sessionStorage.removeItem("piketAkun");
  $("app").hidden = true; $("login").hidden = false;
  $("un").value = ""; $("pw").value = ""; pesan($("loginMsg"), teks, "info"); $("un").focus();
}
$("btnKeluar").onclick = () => keluar("Kamu sudah keluar.");
["click", "keydown", "touchstart"].forEach(ev => document.addEventListener(ev, () => { aktifTerakhir = Date.now(); }));
let besokTerakhir = besokIso();
setInterval(() => { // cek tidak aktif 30 menit dan pergantian hari
  if (akun && Date.now() - aktifTerakhir > IDLE_MENIT * 60000) keluar("Kamu keluar otomatis karena tidak aktif.");
  if (akun && akun !== GURU && besokIso() !== besokTerakhir) { besokTerakhir = besokIso(); if (preview) preview.basi = true; segarkan(); }
}, 30000);

// ===== TABEL PER WAKTU =====
function opsiNama(n0) { // nama hari ini saja
  const o = n => "<option" + (n === n0 ? " selected" : "") + ">" + esc(n) + "</option>";
  return NAMA[akun].map(o).join("");
}
function bangun() {
  $("tabel").innerHTML = WAKTU.map((w, wi) => '<section class="panel" data-w="' + wi + '"><div class="head"><h3>' + esc(w) + '</h3><span class="pill"></span></div><div class="tbl"><table><thead><tr><th>No</th><th>Nama</th><th>Job (boleh lebih dari satu)</th><th></th></tr></thead><tbody>' +
    draf.slot[wi].map((s, si) => '<tr data-s="' + si + '"><td>' + (si + 1) + '</td><td><select class="nm"><option value="">— Pilih nama —</option>' + opsiNama(s.n) + '</select></td><td><details class="dd"><summary></summary><div class="opts">' +
      JOBS.map(j => '<label><input type="checkbox" value="' + esc(j) + '"' + (s.j.includes(j) ? " checked" : "") + ">" + esc(j) + "</label>").join("") + '</div></details></td><td><button type="button" class="btn x" title="Kosongkan baris">✕</button></td></tr>').join("") +
    "</tbody></table></div></section>").join("");
}
const slotDari = tr => draf.slot[+tr.closest("section").dataset.w][+tr.dataset.s];
$("tabel").addEventListener("change", e => {
  const tr = e.target.closest("tr"); if (!tr) return;
  const s = slotDari(tr); s.n = tr.querySelector(".nm").value; s.j = [...tr.querySelectorAll("input:checked")].map(i => i.value); ubah();
});
$("tabel").addEventListener("click", e => {
  const b = e.target.closest(".x"); if (!b) return;
  const tr = b.closest("tr"), s = slotDari(tr); s.n = ""; s.j = [];
  tr.querySelector(".nm").value = ""; tr.querySelectorAll("input").forEach(i => { i.checked = false; }); ubah();
});
document.addEventListener("click", e => document.querySelectorAll("details.dd[open]").forEach(d => { if (!d.contains(e.target)) d.open = false; }));
document.addEventListener("keydown", e => { if (e.key === "Escape" && akun) { document.querySelectorAll("details.dd[open]").forEach(d => { d.open = false; }); $("tanya").hidden = true; } }); // Esc pada pertanyaan reset = Tidak
function ubah() { // dipanggil setiap isian berubah
  if (!draf.tanggal) draf.tanggal = besokIso();
  if (!adaIsi()) draf.tanggal = "";
  localStorage.setItem("piketDraf2:" + akun, JSON.stringify(draf));
  if (preview) preview.basi = true;
  pesan($("buatMsg"), ""); document.querySelectorAll(".salah").forEach(r => r.classList.remove("salah")); segarkan();
}
$("btnKosong").onclick = () => { draf = baru(); preview = null; bangun(); ubah(); };
$("btnPakai").onclick = () => { draf.tanggal = besokIso(); ubah(); };

// ===== TAMPILAN =====
function segarkan() {
  const k = kedaluwarsa(), dipakai = new Set();
  $("judul").textContent = "Piket untuk Besok — " + fmtIso(besokIso());
  $("kadaluarsa").hidden = !k; if (k) $("kadaluarsaTeks").textContent = "Daftar ini untuk " + fmtIso(draf.tanggal) + " dan sudah lewat.";
  document.querySelectorAll("#tabel section").forEach(sec => {
    const w = +sec.dataset.w, ada = draf.slot[w].map(s => s.n).filter(Boolean);
    ada.forEach(n => dipakai.add(n)); sec.querySelector(".pill").textContent = ada.length + "/" + SLOT + " orang";
    sec.querySelectorAll("tr[data-s]").forEach(tr => {
      const s = draf.slot[w][+tr.dataset.s];
      tr.querySelectorAll("option").forEach(o => { o.disabled = !!o.value && o.value !== s.n && ada.includes(o.value); }); // satu nama sekali per tabel
      tr.querySelector("summary").textContent = s.j.length ? s.j.join(", ") : "Pilih job";
    });
  });
  const sisa = NAMA[akun].filter(n => !dipakai.has(n));
  $("belum").textContent = sisa.length ? "Belum kebagian tugas: " + sisa.join(", ") : "Semua nama sudah kebagian tugas.";
  $("btnBuat").disabled = k;
  $("preview").hidden = !preview;
  if (preview) { $("teks").textContent = preview.teks; $("basi").hidden = !preview.basi; $("btnCopy").disabled = preview.basi; $("btnWA").disabled = preview.basi; }
}

// ===== DAFTAR HARI SIDEBAR (hanya tampilan, tidak bisa pindah hari) =====
function renderDaftarHari() {
  const hariOrder = ["senin", "selasa", "rabu", "kamis", "jumat"];
  $("daftarHari").innerHTML = hariOrder.map(h => {
    const anggota = NAMA[h] || [];
    const ketua = KETUA[h] || "-";
    const isActive = h === akun;
    return '<div class="day-card' + (isActive ? ' active' : '') + '">' +
      '<div class="day-name">' + esc(NAMA_AKUN[h]) + '</div>' +
      '<div class="day-ketua">Ketua: ' + esc(ketua) + '</div>' +
      '<div class="day-members">' + (anggota.length ? anggota.map(esc).join(", ") : "-") + '</div>' +
    '</div>';
  }).join("") + (namaDiperbarui ? '<div class="upd">Daftar nama diperbarui guru: ' + fmtIso(iso(new Date(namaDiperbarui))) + '</div>' : "");
}

// ===== PENGUMUMAN =====
$("btnBuat").onclick = () => {
  const m = $("buatMsg"), parts = []; let bad = "";
  WAKTU.forEach((w, wi) => {
    const rows = draf.slot[wi].filter(s => s.n && s.j.length);
    if (rows.length) {
      parts.push(w.toUpperCase() + " 🌅");
      rows.forEach((s, idx) => {
        parts.push((idx + 1) + ". " + s.n + " - " + s.j.join(", "));
      });
      parts.push(""); // empty line between sections
    }
  });
  document.querySelectorAll("#tabel tr[data-s]").forEach(tr => {
    const w = +tr.closest("section").dataset.w, s = slotDari(tr);
    if (!!s.n !== !!s.j.length) { tr.classList.add("salah"); bad = bad || (s.n ? "Ada petugas yang belum diberi job." : "Ada job yang belum diberi nama petugas."); }
  });
  if (bad) { pesan(m, bad, "err"); return; }
  if (!parts.length) { pesan(m, "Daftar masih kosong, isi minimal 1 petugas dulu!", "err", 4000); return; }
  const catatan = $("catatan").value.trim();
  let teks = "JADWAL PIKET BESOK (" + fmtIso(besokIso()) + ") 📅\n" + (KETUA[akun] ? "Ketua piket: " + KETUA[akun] + "\n" : "") + "\n" + parts.join("\n") + "Harap dilaksanakan dengan penuh tanggung jawab! 💪\n";
  if (catatan) teks += "\n📝 CATATAN:\n" + catatan + "\n";
  teks += "\n" + PUNISHMENT_TEXT;
  preview = { teks: teks, basi: false };
  $("tanya").hidden = true; pesan($("copyMsg"), ""); segarkan(); $("preview").scrollIntoView({ behavior: "smooth" });
};
async function salin(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) { }
  try { const a = document.createElement("textarea"); a.value = t; a.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(a); a.select(); const ok = document.execCommand("copy"); a.remove(); return ok; } catch (e) { return false; }
}
$("btnCopy").onclick = async () => {
  if (!preview || preview.basi) return;
  if (!await salin(preview.teks)) {
    pesan($("copyMsg"), "Gagal menyalin. Tekan dan tahan teks lalu salin manual.", "err");
    const r = document.createRange(); r.selectNodeContents($("teks")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return;
  }
  pesan($("copyMsg"), ""); const t = $("btnCopy"); t.textContent = "Berhasil Disalin ke Clipboard!"; t.classList.add("done");
  clearTimeout(timerCopy); timerCopy = setTimeout(() => { t.textContent = "Copy Semua Teks"; t.classList.remove("done"); }, 3000);
  $("tanya").hidden = false;
};
$("btnYa").onclick = () => { draf = baru(); preview = null; bangun(); ubah(); pesan($("buatMsg"), "Daftar dikosongkan. Siap untuk jadwal berikutnya.", "info", 4000); };
$("btnTidak").onclick = () => { $("tanya").hidden = true; };

// ===== KIRIM KE WHATSAPP =====
$("btnWA").onclick = () => {
  if (!preview || preview.basi) return;
  window.open("https://wa.me/?text=" + encodeURIComponent(preview.teks), "_blank");
  $("tanya").hidden = false;
};

// ===== PENGATURAN: TAMPILAN, ANGGOTA, AKUN =====
function terap() { const t = baca("piketTampil", {}); document.documentElement.dataset.tema = t.tema || "biru"; document.documentElement.dataset.huruf = t.huruf || "normal"; }
terap();
$("btnSet").onclick = () => {
  const t = baca("piketTampil", {}); $("optTema").value = t.tema || "biru"; $("optHuruf").value = t.huruf || "normal";
  $("secReq").hidden = akun === GURU; $("reqTeks").value = ""; pesan($("reqMsg"), "");
  $("akU").value = AKUN[akun].u; $("akP").value = ""; $("akLama").value = "";  pesan($("akMsg"), "");
  $("dlg").showModal();
};
$("dTutup").onclick = () => $("dlg").close();
["optTema", "optHuruf"].forEach(id => $(id).addEventListener("change", () => { localStorage.setItem("piketTampil", JSON.stringify({ tema: $("optTema").value, huruf: $("optHuruf").value })); terap(); }));
$("btnSimpanAk").onclick = () => {
  const m = $("akMsg"), u = $("akU").value.trim(), pb = $("akP").value;
  if ($("akLama").value !== AKUN[akun].p) { pesan(m, "Password saat ini salah.", "err"); return; }
  if (!u || /\s/.test(u) || u.length > 20) { pesan(m, "Username wajib diisi, tanpa spasi, maksimal 20 huruf.", "err"); return; }
  if (Object.keys(AKUN).some(h => h !== akun && AKUN[h].u.toLowerCase() === u.toLowerCase())) { pesan(m, "Username itu sudah dipakai ketua lain.", "err"); return; }
  if (pb && pb.length < 4) { pesan(m, "Password baru minimal 4 karakter.", "err"); return; }
  AKUN[akun] = { u: u, p: pb || AKUN[akun].p }; const o = baca("piketLogin", {}); o[akun] = AKUN[akun]; localStorage.setItem("piketLogin", JSON.stringify(o));
  $("akP").value = ""; $("akLama").value = ""; pesan(m, "Akun tersimpan. Pakai ini saat login berikutnya.", "ok", 4000);
};

// ===== PERMINTAAN UBAH NAMA (ketua -> guru lewat WhatsApp) =====
$("btnReq").onclick = () => {
  const t = $("reqTeks").value.trim();
  if (!t) { pesan($("reqMsg"), "Tulis dulu permintaannya.", "err", 3000); return; }
  const teks = "PERMINTAAN UBAH NAMA PIKET\nHari: " + NAMA_AKUN[akun] + (KETUA[akun] ? " (Ketua: " + KETUA[akun] + ")" : "") + "\n\n" + t;
  window.open("https://wa.me/" + NOMOR_GURU.replace(/\D/g, "") + "?text=" + encodeURIComponent(teks), "_blank");
  $("reqTeks").value = ""; pesan($("reqMsg"), "WhatsApp dibuka. Kirim pesannya ke guru.", "ok", 4000);
};

// ===== PANEL GURU =====
let edGuru = {}, kotor = false;
function masukGuru() {
  akun = GURU; aktifTerakhir = Date.now(); preview = null;
  edGuru = {}; URUT.forEach(h => { edGuru[h] = NAMA[h].slice(); }); kotor = false;
  document.querySelector(".layout").hidden = true; $("guruView").hidden = false;
  $("login").hidden = true; $("app").hidden = false;
  $("userName").textContent = "Guru · Admin";
  pesan($("guruMsg"), ""); gambarGuru(); gambarRiwayat();
}
function gambarGuru() {
  $("guruDaftar").innerHTML = URUT.map(h => '<section class="panel"><div class="head"><h3>' + esc(NAMA_AKUN[h]) + '</h3><span class="pill">Ketua: ' + esc(KETUA[h] || "-") + '</span></div>' +
    edGuru[h].map((n, i) => '<div class="angrow"><input data-h="' + h + '" data-i="' + i + '" maxlength="30" value="' + esc(n) + '" aria-label="Nama ' + esc(NAMA_AKUN[h]) + ' ' + (i + 1) + '"><button class="btn danger" type="button" data-hd="' + h + '" data-di="' + i + '">Hapus</button></div>').join("") +
    '<button class="btn" type="button" data-tambah="' + h + '">+ Tambah nama</button></section>').join("");
}
$("guruDaftar").addEventListener("input", e => { const d = e.target.dataset; if (d.h !== undefined) { edGuru[d.h][+d.i] = e.target.value; kotor = true; } });
$("guruDaftar").addEventListener("click", e => {
  const d = e.target.dataset;
  if (d.hd !== undefined) { edGuru[d.hd].splice(+d.di, 1); kotor = true; gambarGuru(); }
  else if (d.tambah !== undefined) { edGuru[d.tambah].push(""); kotor = true; gambarGuru(); const ins = e.target.closest("section").querySelectorAll(".angrow input"); if (ins.length) ins[ins.length - 1].focus(); }
});
window.addEventListener("beforeunload", e => { if (akun === GURU && kotor) { e.preventDefault(); e.returnValue = ""; } });
const bersihNama = arr => { const o = []; arr.forEach(n => { n = n.replace(/\s+/g, " ").trim(); if (n && !o.includes(n)) o.push(n); }); return o; };
function unduhFile(nama, isi) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([isi], { type: "application/json" })); a.download = nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
function catat(t) { const r = baca("piketRiwayat", []); r.unshift(t); localStorage.setItem("piketRiwayat", JSON.stringify(r.slice(0, 50))); gambarRiwayat(); }
function gambarRiwayat() { const r = baca("piketRiwayat", []); $("riwayat").innerHTML = r.length ? r.map(t => '<div class="log">' + esc(t) + '</div>').join("") : '<div class="log">Belum ada perubahan.</div>'; }
$("btnUnduh").onclick = () => {
  const m = $("guruMsg"), baruN = {}; let kosong = "";
  URUT.forEach(h => { baruN[h] = bersihNama(edGuru[h]); if (!baruN[h].length && !kosong) kosong = NAMA_AKUN[h]; });
  if (kosong) { pesan(m, "Hari " + kosong + " harus punya minimal 1 nama.", "err"); return; }
  const ubahan = [];
  URUT.forEach(h => {
    const tambah = baruN[h].filter(n => !NAMA[h].includes(n)), hapus = NAMA[h].filter(n => !baruN[h].includes(n));
    if (tambah.length || hapus.length) ubahan.push(NAMA_AKUN[h] + ": " + tambah.map(n => "+ " + n).concat(hapus.map(n => "− " + n)).join(", "));
  });
  if (!ubahan.length) { pesan(m, "Tidak ada perubahan dari daftar saat ini.", "info", 4000); return; }
  const now = new Date();
  unduhFile("names.json", JSON.stringify({ diperbarui: now.toISOString(), nama: baruN }, null, 2));
  catat(now.getDate() + " " + BULAN[now.getMonth()] + " " + now.getFullYear() + " " + pad(now.getHours()) + ":" + pad(now.getMinutes()) + " — " + ubahan.join(" | "));
  URUT.forEach(h => { NAMA[h] = baruN[h]; edGuru[h] = baruN[h].slice(); }); kotor = false; gambarGuru();
  pesan(m, "File names.json sudah diunduh. Ganti file lama di tempat web ini disimpan supaya ketua melihat nama baru.", "ok", 8000);
};

// ===== MULAI =====
muatNama().then(() => {
  if (akun && akun !== GURU) { bersihDraf(); bangun(); segarkan(); renderDaftarHari(); return; }
  const sesi = sessionStorage.getItem("piketAkun");
  if (!akun && sesi && AKUN[sesi] !== undefined) masuk(sesi); else if (!akun) $("un").focus();
});
