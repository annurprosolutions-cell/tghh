// Pengesahan kandungan (course dan subject) dan utiliti. Fungsi tulen, tiada I/O.

const ID_YT = /^[A-Za-z0-9_-]{11}$/;
const HOS_YT = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com']);
export const STATUS = ['draf', 'menunggu', 'terbit'];
export const GOLONGAN_COURSE = ['awam', 'pelajar', 'ahli']; // golongan minimum yang boleh melihat course // menunggu = dihantar guru, menunggu kelulusan admin

// Terima pautan YouTube (watch, youtu.be, embed, shorts, live) atau ID 11 aksara. Hos lain ditolak,
// termasuk youtube.com.penipu.test. Pulangkan ID atau null.
export function ekstrakIdYoutube(input) {
  const t = String(input ?? '').trim();
  if (!t) return null;
  if (ID_YT.test(t)) return t;
  let u;
  try { u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const hos = u.hostname.toLowerCase();
  let id = null;
  if (hos === 'youtu.be') id = u.pathname.split('/')[1];
  else if (HOS_YT.has(hos)) {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else { const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/); if (m) id = m[1]; }
  }
  return id && ID_YT.test(id) ? id : null;
}

export function buatSlug(tajuk) {
  const s = String(tajuk ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/g, '');
  return s || 'course';
}

const gagal = (sebab, medan) => ({ ok: false, sebab, ...(medan ? { medan } : {}) });
const pangkas = (v) => (typeof v === 'string' ? v.trim() : '');
const ada = (m, k) => Object.prototype.hasOwnProperty.call(m, k);
const intDalam = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const objek = (m) => m && typeof m === 'object' && !Array.isArray(m);

function tajukHuraian(m, separa, n) {
  if (!separa || ada(m, 'tajuk')) {
    const t = pangkas(m.tajuk);
    if (!t || t.length > 120) return gagal('tajuk-tidak-sah', 'tajuk');
    n.tajuk = t;
  }
  if (ada(m, 'huraian')) {
    if (m.huraian == null || m.huraian === '') n.huraian = null;
    else if (typeof m.huraian !== 'string' || m.huraian.length > 2000) return gagal('huraian-tidak-sah', 'huraian');
    else n.huraian = m.huraian.trim();
  }
  return null;
}

function urutanUntuk(m, n) {
  if (ada(m, 'urutan') && m.urutan !== null) {
    if (!intDalam(m.urutan, 0, 9999)) return gagal('urutan-tidak-sah', 'urutan');
    n.urutan = m.urutan;
  }
  return null;
}

export const MAKS_RUJUKAN = 4000;
export const MAKS_KELAYAKAN = 200, MAKS_INSTITUSI = 120, MAKS_BIO = 600;
// Buang aksara kawalan (kecuali tab dan baris baharu) supaya teks biasa sahaja disimpan.
const bersih = (t) => t.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '');

// Pengesahan kategori: nama 2-60 aksara, urutan pilihan. Medan separa untuk ubah.
export function sahkanKategori(m, { separa = false } = {}) {
  if (!objek(m)) return gagal('badan-tidak-sah');
  const n = {};
  if (!separa || ada(m, 'nama')) {
    const t = pangkas(m.nama);
    if (t.length < 2 || t.length > 60) return gagal('nama-tidak-sah', 'nama');
    n.nama = t;
  }
  if (ada(m, 'urutan') && m.urutan !== null) {
    if (!intDalam(m.urutan, 0, 9999)) return gagal('urutan-tidak-sah', 'urutan');
    n.urutan = m.urutan;
  }
  return { ok: true, nilai: n };
}

// Profil guru (F-14): diisi admin sahaja. Teks biasa; kosong = buang.
export function sahkanProfilGuru(m) {
  if (!objek(m)) return gagal('badan-tidak-sah');
  const n = {};
  for (const [k, maks] of [['kelayakan', MAKS_KELAYAKAN], ['institusi', MAKS_INSTITUSI], ['bio', MAKS_BIO]]) {
    if (!ada(m, k)) continue;
    if (m[k] == null || m[k] === '') { n[k] = null; continue; }
    if (typeof m[k] !== 'string') return gagal(`${k}-tidak-sah`, k);
    const t = bersih(m[k]).trim();
    if (t.length > maks) return gagal('terlalu-panjang', k);
    n[k] = t || null;
  }
  return { ok: true, nilai: n };
}

// `separa` = kemas kini separa: hanya medan yang diberi disahkan. Selain itu, ini penciptaan dan tajuk wajib.
export function sahkanCourse(m, { separa = false } = {}) {
  if (!objek(m)) return gagal('badan-tidak-sah');
  const n = {};
  const g = tajukHuraian(m, separa, n) || urutanUntuk(m, n);
  if (g) return g;
  for (const [k, senarai, lalai] of [['status', STATUS, 'draf'], ['golongan', GOLONGAN_COURSE, 'awam']]) {
    if (ada(m, k)) { if (!senarai.includes(m[k])) return gagal(`${k}-tidak-sah`, k); n[k] = m[k]; }
    else if (!separa) n[k] = lalai;
  }
  if (ada(m, 'kategori_id')) {
    if (m.kategori_id === null || m.kategori_id === '') n.kategori_id = null;
    else if (!intDalam(m.kategori_id, 1, 1e9)) return gagal('kategori-tidak-sah', 'kategori_id');
    else n.kategori_id = m.kategori_id;
  }
  return { ok: true, nilai: n };
}

export function sahkanSubject(m, { separa = false } = {}) {
  if (!objek(m)) return gagal('badan-tidak-sah');
  const n = {};
  const g = tajukHuraian(m, separa, n) || urutanUntuk(m, n);
  if (g) return g;
  if (ada(m, 'video')) {
    if (m.video == null || m.video === '') n.video_id = null;
    else { const id = ekstrakIdYoutube(m.video); if (!id) return gagal('video-tidak-sah', 'video'); n.video_id = id; }
  } else if (!separa) n.video_id = null;
  if (ada(m, 'pratonton')) {
    if (typeof m.pratonton !== 'boolean') return gagal('pratonton-tidak-sah', 'pratonton');
    n.pratonton = m.pratonton ? 1 : 0;
  } else if (!separa) n.pratonton = 0;
  if (ada(m, 'status')) { if (!STATUS.includes(m.status)) return gagal('status-tidak-sah', 'status'); n.status = m.status; }
  else if (!separa) n.status = 'draf';
  if (ada(m, 'rujukan')) {
    if (m.rujukan == null || m.rujukan === '') n.rujukan = null;
    else if (typeof m.rujukan !== 'string') return gagal('rujukan-tidak-sah', 'rujukan');
    else {
      const t = bersih(m.rujukan).trim();
      if (t.length > MAKS_RUJUKAN) return gagal('terlalu-panjang', 'rujukan');
      n.rujukan = t || null;
    }
  }
  if (ada(m, 'tempoh_saat')) {
    if (m.tempoh_saat === null) n.tempoh_saat = null;
    else if (!intDalam(m.tempoh_saat, 1, 86400)) return gagal('tempoh-tidak-sah', 'tempoh_saat');
    else n.tempoh_saat = m.tempoh_saat;
  }
  return { ok: true, nilai: n };
}
