// Panel admin dan guru. Satu fail, tiada build step. Laluan hash:
//   #/                                 senarai course
//   #/course/baru                      cipta course
//   #/course/<id>                      butiran course dan senarai subject
//   #/course/<id>/sunting              sunting course
//   #/course/<id>/subject/baru         tambah subject
//   #/course/<id>/subject/<sid>        sunting subject
//   #/kelulusan, #/kategori, #/laporan, #/guru, #/artikel, #/tetapan   admin sahaja
// Peranan: admin (semua) atau guru (course sendiri; penerbitan dan perubahan melalui kelulusan admin).
// Klik ditangani melalui data-act, borang melalui data-borang (satu pendengar setiap jenis).

const app = document.getElementById('app');
const menuPanel = document.getElementById('menuPanel');

// Ikon menu (gaya sama dengan menu pelajar)
const IKON = {
  pengguna: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="2.5" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="6.2" cy="7" r="1.6" stroke="currentColor" stroke-width="1.4"/><path d="M3.9 11.2c.4-1.2 1.2-1.8 2.3-1.8s1.9.6 2.3 1.8M10 6.5h2.2M10 9h2.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  kod: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="5.5" cy="10.5" r="3" stroke="currentColor" stroke-width="1.5"/><path d="m7.7 8.3 5.8-5.8M11.5 4.5 13 6M10 6l1.2 1.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  course: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1.3" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="2" width="5" height="5" rx="1.3" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="9" width="5" height="5" rx="1.3" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="5" height="5" rx="1.3" stroke="currentColor" stroke-width="1.5"/></svg>',
  kelulusan: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="m5.3 8.2 1.8 1.8 3.6-3.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  guru: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="6" cy="5.5" r="2.4" stroke="currentColor" stroke-width="1.5"/><path d="M1.8 13c.5-2 2.2-3.1 4.2-3.1s3.7 1.1 4.2 3.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10.6 3.4a2.3 2.3 0 0 1 0 4.3M12 9.9c1.2.4 2 1.4 2.3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  artikel: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M9.5 2H4.2A1.2 1.2 0 0 0 3 3.2v9.6A1.2 1.2 0 0 0 4.2 14h7.6a1.2 1.2 0 0 0 1.2-1.2V5.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9.5 2v3.5H13M5.8 8.5h4.4M5.8 11h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  tetapan: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.8v1.6M8 12.6v1.6M14.2 8h-1.6M3.4 8H1.8M12.4 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1M12.4 12.4l-1.1-1.1M4.7 4.7 3.6 3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  laporan: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 14V2.5M3.5 3h8.2l-1.6 2.8 1.6 2.8H3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  kategori: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8.6 2H13a1 1 0 0 1 1 1v4.4a1 1 0 0 1-.3.7l-5.6 5.6a1 1 0 0 1-1.4 0L2.3 9.3a1 1 0 0 1 0-1.4l5.6-5.6a1 1 0 0 1 .7-.3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="11" cy="5" r="1" fill="currentColor"/></svg>',
  soalan: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 3.5A1.5 1.5 0 0 1 4 2h8a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 12 11H7l-3 2.5V11A1.5 1.5 0 0 1 2.5 9.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5.5 5.5h5M5.5 7.8h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  luar: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M9 3h4v4M13 3 7.5 8.5M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  keluar: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H6M10.5 11l3-3-3-3M13.5 8H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  orang: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="5.5" r="2.6" stroke="currentColor" stroke-width="1.5"/><path d="M3 13.2c.6-2.2 2.6-3.4 5-3.4s4.4 1.2 5 3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
};

// Menu pil di header. Item aktif ditanda ikut bahagian pertama hash.
function binaMenu() {
  const item = PERANAN === 'admin'
    ? [['course', '#/', 'Siri'], ['kategori', '#/kategori', 'Kategori'], ['kelulusan', '#/kelulusan', 'Kelulusan'], ['soalan', '#/soalan', 'Soal jawab'], ['laporan', '#/laporan', 'Laporan'], ['pengguna', '#/pengguna', 'Pengguna'], ['guru', '#/guru', 'Pasukan'], ...(KOD_AKTIF ? [['kod', '#/kod', 'Kod golongan']] : []), ['artikel', '#/artikel', 'Artikel'], ['tetapan', '#/tetapan', 'Tetapan laman']]
    : [['course', '#/', 'Siri saya'], ['soalan', '#/soalan', 'Soal jawab']];
  menuPanel.innerHTML = item.map(([k, href, label]) => `<a href="${href}" data-menu="${k}">${IKON[k]}<span>${label}</span>${k === 'kelulusan' ? '<span class="bil-pil" id="bilKelulusan" hidden></span>' : ''}${k === 'soalan' ? '<span class="bil-pil" id="bilSoalan" hidden></span>' : ''}${k === 'laporan' ? '<span class="bil-pil" id="bilLaporan" hidden></span>' : ''}</a>`).join('')
    + `<a href="/" data-menu="luar">${IKON.luar}<span>Laman pelajar</span></a>`;
  menuPanel.hidden = false;
}
function tandaMenu() {
  const bahagian = (location.hash || '#/').slice(2).split('/')[0];
  const aktif = ['kelulusan', 'kategori', 'soalan', 'laporan', 'pengguna', 'guru', 'kod', 'artikel', 'tetapan'].includes(bahagian) ? bahagian : 'course';
  menuPanel.querySelectorAll('a[data-menu]').forEach((a) => { if (a.dataset.menu === aktif) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}
async function kemaskiniBilSoalan() {
  const lencana = document.getElementById('bilSoalan');
  if (!lencana) return;
  try { const n = (await api('GET', 'soalan')).bil_menunggu; lencana.textContent = n; lencana.hidden = !n; } catch { lencana.hidden = true; }
}
async function kemaskiniBilLaporan() {
  const lencana = document.getElementById('bilLaporan');
  if (!lencana) return;
  try { const n = (await api('GET', 'laporan')).bil_baru; lencana.textContent = n; lencana.hidden = !n; } catch { lencana.hidden = true; }
}
async function kemaskiniBilKelulusan() {
  const lencana = document.getElementById('bilKelulusan');
  if (!lencana || PERANAN !== 'admin') return;
  try {
    const q = await api('GET', 'kelulusan');
    const n = q.course.length + q.subject.length + q.perubahan.length + q.nota.length;
    lencana.textContent = n; lencana.hidden = !n;
  } catch { lencana.hidden = true; }
}
const kotakPengguna = document.getElementById('pengguna');

const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const RALAT = {
  'tajuk-tidak-sah': 'Tajuk wajib diisi, maksimum 120 aksara.',
  'huraian-tidak-sah': 'Huraian maksimum 2000 aksara.',
  'urutan-tidak-sah': 'Urutan mesti nombor bulat 0 hingga 9999.',
  'video-tidak-sah': 'Pautan video tidak dikenali. Tampal pautan YouTube (https://youtu.be/...) atau pautan fail Google Drive (https://drive.google.com/file/d/.../view). Folder Drive tidak boleh digunakan.',
  'pautan-gambar-tidak-sah': 'Pautan gambar tidak sah. Guna pautan fail gambar Google Drive (https://drive.google.com/file/d/.../view) dan pastikan perkongsian ditetapkan kepada sesiapa yang ada pautan.',
  'video-diperlukan': 'Kuliah yang diterbitkan mesti ada video (YouTube atau Google Drive). Tampal pautan, atau simpan sebagai draf.',
  'ada-subject': 'Siri ini masih ada kuliah. Padam semua kuliah dahulu.',
  'tidak-dibenarkan': 'Akaun ini bukan admin.',
  'belum-log-masuk': 'Sesi tamat. Sila log masuk semula.',
  'tidak-dijumpai': 'Tidak dijumpai. Mungkin sudah dipadam.',
  'asal-tidak-dibenarkan': 'Permintaan ditolak (asal laman tidak sah).',
  'bukan-pdf': 'Fail ini bukan PDF yang sah.',
  'slug-tidak-sah': 'Slug hanya huruf kecil, nombor dan sempang (contoh hukum-solat-jamak), maksimum 80 aksara.',
  'slug-sudah-ada': 'Slug ini sudah digunakan artikel lain.',
  'slug-dikunci': 'Slug tidak boleh ditukar selepas artikel pernah diterbitkan (URL akan rosak).',
  'ringkasan-diperlukan': 'Ringkasan wajib diisi sebelum diterbitkan (ia menjadi keterangan di Google).',
  'ringkasan-tidak-sah': 'Ringkasan maksimum 200 aksara.',
  'isi-diperlukan': 'Isi artikel wajib diisi sebelum diterbitkan.',
  'isi-tidak-sah': 'Isi terlalu panjang.',
  'badan-terlalu-besar': 'Kandungan terlalu besar.',
  'jawapan-kosong': 'Jawapan tidak boleh kosong.',
  'jawapan-terlalu-panjang': 'Jawapan terlalu panjang. Maksimum 4000 aksara.',
  'gambar-terlalu-besar': 'Gambar terlalu besar walaupun selepas dikecilkan (maksimum 2 MB).',
  'meta-tidak-sah': 'Meta description maksimum 200 aksara.',
  'gambar-tidak-sah': 'Gambar tidak sah. Muat naik semula.',
  'alt-tidak-sah': 'Teks alt maksimum 150 aksara.',
  'bukan-gambar': 'Logo mesti gambar PNG, JPG atau WEBP.',
  'logo-terlalu-besar': 'Logo terlalu besar. Maksimum 500 KB.',
  'terlalu-panjang': 'Teks terlalu panjang.',
  'status-tidak-sah': 'Status laporan tidak sah.',
  'catatan-terlalu-panjang': 'Catatan maksimum 500 aksara.',
  'tiada-perubahan': 'Tiada perubahan untuk disimpan.',
  'kategori-tidak-sah': 'Kategori yang dipilih tidak wujud. Muat semula halaman.',
  'kategori-digunakan': 'Kategori ini masih digunakan oleh siri. Pindahkan atau kosongkan kategori siri tersebut dahulu.',
  'nama-tidak-sah': 'Nama mesti 2 hingga 80 aksara.',
  'rujukan-tidak-sah': 'Rujukan tidak sah.',
  'emel-tidak-sah': 'Format emel tidak sah.',
  'medan-tidak-sah': 'Nilai tidak sah.',
  'fail-terlalu-besar': 'Fail terlalu besar. Maksimum 20 MB.',
  'fail-kosong': 'Fail kosong.',
  'had-nota': 'Setiap kuliah maksimum 10 nota. Padam nota lama dahulu.',
  'r2-belum-sedia': 'Storan fail (R2) belum disambungkan pada Worker.',
  'golongan-tidak-sah': 'Pilih golongan.',
  'hari-sesi-tidak-sah': 'Tempoh log masuk mesti 1 hingga 365 hari.',
  'tidak-boleh-sekat': 'Tidak boleh menyekat akaun sendiri atau admin utama.',
  'admin-utama-sahaja': 'Hanya admin utama boleh menambah atau membuang admin.',
  'sudah-admin-utama': 'Emel ini sudah admin utama.',
  'label-tidak-sah': 'Label maksimum 60 aksara.',
  'bulan-tidak-sah': 'Tempoh akses mesti 1 hingga 36 bulan.',
  'had-tidak-sah': 'Had guna mesti nombor 1 hingga 100000, atau kosong untuk tanpa had.',
  'tarikh-tidak-sah': 'Tarikh tamat kod tidak sah.',
  'bilangan-tidak-sah': 'Bilangan kod mesti 1 hingga 200.',
  'kod-tidak-sah': 'Kod sendiri mesti 4 hingga 20 huruf atau nombor.',
  'kod-satu-sahaja': 'Kod sendiri hanya untuk satu kod. Kosongkan medan kod untuk menjana berbilang kod rawak.',
  'kod-sudah-ada': 'Kod ini sudah wujud. Pilih kod lain.',
  'kod-sudah-digunakan': 'Kod ini sudah digunakan, jadi tidak boleh dipadam. Matikan sahaja.',
};

class RalatApi extends Error {
  constructor(d, status) { super(RALAT[d.ralat] || `Ralat (${d.ralat || status}). Cuba lagi.`); this.kod = d.ralat; this.medan = d.medan; this.status = status; }
}

async function api(kaedah, laluan, badan) {
  const r = await fetch('/api/admin/' + laluan, {
    method: kaedah,
    headers: badan ? { 'content-type': 'application/json' } : {},
    body: badan ? JSON.stringify(badan) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new RalatApi(d, r.status);
  return d;
}

const pergi = (hash) => { if (location.hash === hash) laluan(); else location.hash = hash; };
const LABEL_GOLONGAN = { awam: 'Semua (orang awam)', pelajar: 'Pelajar dan ahli organisasi', ahli: 'Ahli organisasi sahaja' };
const lencanaGolongan = (g) => (g && g !== 'awam' ? `<span class="lencana pratonton">${g === 'ahli' ? 'Ahli organisasi' : 'Pelajar'}</span>` : '');
const lencanaStatus = (s) => (s === 'terbit' ? '<span class="lencana">Terbit</span>' : s === 'menunggu' ? '<span class="lencana pratonton">Menunggu kelulusan</span>' : '<span class="lencana draf">Draf</span>');
// Pautan media (YouTube atau Google Drive) untuk borang dan pratonton. Rujukan gambar disimpan sebagai "drive:<ID>".
const idRujukan = (ref) => /^drive:([A-Za-z0-9_-]{20,80})$/.exec(String(ref ?? ''))?.[1] || null;
const urlThumbDrive = (id) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w400`;
const pautanVideoP = (sumber, id) => (!id ? '' : sumber === 'drive' ? `https://drive.google.com/file/d/${id}/view` : `https://youtu.be/${id}`);
const pautanGambarP = (ref) => (idRujukan(ref) ? `https://drive.google.com/file/d/${idRujukan(ref)}/view` : '');
// Pratonton kecil: thumbnail pilihan, jika tiada gambar daripada video (YouTube atau Drive), jika gagal dimuatkan "Video".
function gambarSubject(s) {
  const id = idRujukan(s?.thumbnail);
  const url = id ? urlThumbDrive(id) : !s?.video_id ? null : s.video_sumber === 'drive' ? urlThumbDrive(s.video_id) : `https://i.ytimg.com/vi/${encodeURIComponent(s.video_id)}/mqdefault.jpg`;
  return url
    ? `<img src="${h(url)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'tiada-video',textContent:'Video'}))">`
    : '<div class="tiada-video">Tiada video</div>';
}

function paparRalat(e) {
  if (e instanceof RalatApi && e.status === 401) return mula();
  app.innerHTML = `<div class="ralat">${h(e.message)}</div><p><a href="#/">Kembali ke senarai siri</a></p>`;
}

// ---------- paparan ----------

// Peranan pengguna panel: 'admin' atau 'guru' (ditetapkan dalam mula()).
let PERANAN = 'admin';
const ADMIN = () => PERANAN === 'admin';

// Pilihan status ikut peranan. Guru tidak boleh menerbitkan; kandungan terbit milik guru tiada pilihan status.
function pilihanStatus(status, jenis) {
  if (ADMIN()) {
    return `<label>Status</label><div class="pilihan">
      <label><input type="radio" name="status" value="draf" ${status === 'draf' ? 'checked' : ''}> Draf${jenis === 'course' ? ' (pelajar tak nampak)' : ''}</label>
      ${status === 'menunggu' ? '<label><input type="radio" name="status" value="menunggu" checked> Menunggu kelulusan</label>' : ''}
      <label><input type="radio" name="status" value="terbit" ${status === 'terbit' ? 'checked' : ''}> Terbit</label></div>`;
  }
  if (status === 'terbit') return '<div class="info">Sudah diterbitkan. Perubahan yang anda simpan dihantar kepada admin untuk kelulusan; pelajar terus melihat versi semasa sehingga diluluskan.</div>';
  return `<label>Status</label><div class="pilihan">
    <label><input type="radio" name="status" value="draf" ${status !== 'menunggu' ? 'checked' : ''}> Draf (simpan dahulu)</label>
    <label><input type="radio" name="status" value="menunggu" ${status === 'menunggu' ? 'checked' : ''}> Hantar untuk kelulusan admin</label></div>`;
}
const kotakCatatan = (x) => (x.catatan_semakan ? `<div class="catatan">Catatan admin: ${h(x.catatan_semakan)}</div>` : '');
const kotakSemakan = (x) => (x.semakan ? '<div class="info">Ada perubahan menunggu kelulusan admin. Borang di bawah menunjukkan versi yang anda cadangkan.</div>' : '');

async function senaraiCourse() {
  const [senarai, q, kat, lap, soal] = await Promise.all([api('GET', 'course'), ADMIN() ? api('GET', 'kelulusan').catch(() => null) : null, api('GET', 'kategori').catch(() => []),
    ADMIN() ? api('GET', 'laporan').catch(() => null) : null, api('GET', 'soalan').catch(() => null)]);
  const namaKat = new Map(kat.map((k) => [k.id, k.nama]));
  const bil = q ? q.course.length + q.subject.length + q.perubahan.length + q.nota.length : 0;
  app.innerHTML = `
    ${bil ? `<a class="info" style="display:block" href="#/kelulusan"><b>${bil}</b> item menunggu kelulusan. Semak sekarang &rarr;</a>` : ''}
    ${soal && soal.bil_menunggu ? `<a class="info" style="display:block" href="#/soalan"><b>${soal.bil_menunggu}</b> soalan belum dijawab. Semak sekarang &rarr;</a>` : ''}
    ${lap && lap.bil_baru ? `<a class="info" style="display:block" href="#/laporan"><b>${lap.bil_baru}</b> laporan kandungan baharu. Semak sekarang &rarr;</a>` : ''}
    <div class="baris antara"><h1>${ADMIN() ? 'Siri' : 'Siri saya'}</h1><a class="butang" href="#/course/baru">Tambah siri</a></div>
    ${senarai.length ? senarai.map((c) => `
      <a class="kad" href="#/course/${c.id}">
        <div class="baris"><b>${h(c.tajuk)}</b> ${c.kategori_id && namaKat.get(c.kategori_id) ? `<span class="lencana kat">${h(namaKat.get(c.kategori_id))}</span>` : ''} ${lencanaGolongan(c.golongan)} ${lencanaStatus(c.status)} ${c.ada_semakan ? '<span class="lencana pratonton">Perubahan menunggu</span>' : ''}</div>
        <div class="kecil">${c.bil_subject_terbit} daripada ${c.bil_subject} kuliah diterbitkan${ADMIN() && c.guru_nama ? ` · Guru: ${h(c.guru_nama)}` : ''}</div>
      </a>`).join('') : '<div class="kad kosong">Belum ada siri. Mula dengan <b>Tambah siri</b>.</div>'}`;
}

async function borangCourse(id) {
  const c = id ? await api('GET', `course/${id}`) : { tajuk: '', huraian: '', golongan: 'awam', status: 'draf', urutan: '', guru_emel: null, semakan: null };
  const v = { ...c, ...(c.semakan || {}) }; // guru menyunting versi cadangan jika ada
  const guru = ADMIN() ? await api('GET', 'guru').catch(() => []) : [];
  const kat = await api('GET', 'kategori').catch(() => []);
  app.innerHTML = `
    <p><a href="${id ? `#/course/${id}` : '#/'}">&larr; Kembali</a></p>
    <h1>${id ? 'Sunting siri' : 'Siri baru'}</h1>
    <form class="kad" data-borang="course" data-id="${id || ''}" novalidate>
      <div class="ralat" hidden></div>
      ${kotakCatatan(c)}${kotakSemakan(c)}
      <label for="tajuk">Tajuk</label>
      <input type="text" id="tajuk" name="tajuk" maxlength="120" value="${h(v.tajuk)}" required>
      <label for="huraian">Huraian</label>
      <textarea id="huraian" name="huraian" maxlength="2000">${h(v.huraian)}</textarea>
      <label for="kategori_id">Kategori</label>
      <select id="kategori_id" name="kategori_id"><option value="">Tiada kategori</option>${kat.map((k) => `<option value="${k.id}" ${Number(v.kategori_id) === k.id ? 'selected' : ''}>${h(k.nama)}</option>`).join('')}</select>
      <div class="bantuan">Satu siri satu kategori. Pelawat boleh menapis siri ikut kategori di laman utama.${ADMIN() ? '' : ' Menukar kategori siri yang sudah terbit perlu kelulusan admin.'}</div>
      <label for="thumbnail">Gambar thumbnail siri (pilihan)</label>
      <input type="url" id="thumbnail" name="thumbnail" inputmode="url" placeholder="https://drive.google.com/file/d/.../view" value="${h(pautanGambarP(v.thumbnail))}">
      <div class="bantuan">Pautan gambar dari Google Drive (perkongsian <b>Anyone with the link</b>). Dipaparkan pada kad siri di laman utama. Kosongkan untuk guna gambar daripada kuliah pertama yang boleh ditonton secara automatik.</div>
      <label for="golongan">Siapa boleh lihat</label>
      <select id="golongan" name="golongan">${Object.entries(LABEL_GOLONGAN).map(([k, t]) => `<option value="${k}" ${(v.golongan || 'awam') === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <div class="bantuan">Orang awam nampak siri pelajar dan ahli organisasi dalam keadaan berkunci. Pelajar tidak nampak siri ahli organisasi langsung. Golongan diberi melalui kod di menu <b>Kod golongan</b>.</div>
      ${pilihanStatus(c.status, 'course')}
      ${ADMIN() ? `
      <label for="guru_emel">Guru</label>
      <select id="guru_emel" name="guru_emel"><option value="">Tiada (diurus admin)</option>${guru.map((g) => `<option value="${h(g.emel)}" ${g.emel === c.guru_emel ? 'selected' : ''}>${h(g.nama)} (${h(g.emel)})</option>`).join('')}</select>
      <div class="bantuan">Guru boleh menyunting siri ini dan kuliahnya. Setiap penerbitan dan perubahan perlu kelulusan admin.</div>
      <label for="urutan">Urutan</label>
      <input type="number" id="urutan" name="urutan" min="0" max="9999" value="${h(c.urutan)}">
      <div class="bantuan">Nombor kecil dipaparkan dahulu. Biarkan kosong untuk letak di hujung.</div>` : ''}
      <div class="tindakan">
        <button type="submit">Simpan</button>
        ${id && (ADMIN() || c.status !== 'terbit') ? `<button type="button" class="bahaya" data-act="padam-course" data-id="${id}">Padam siri</button>` : ''}
      </div>
    </form>`;
}

async function butiranCourse(id) {
  const c = await api('GET', `course/${id}`);
  const terbit = c.subject.filter((s) => s.status === 'terbit');
  const amaran = [];
  if (c.status === 'draf') amaran.push(ADMIN() ? 'Siri ini masih <b>draf</b>: pelajar belum nampak. Sunting siri dan pilih Terbit bila sedia.'
    : 'Siri ini masih <b>draf</b>. Bila sedia, sunting siri dan pilih <b>Hantar untuk kelulusan admin</b>.');
  else if (c.status === 'menunggu') amaran.push('Siri ini sedang <b>menunggu kelulusan</b> admin.');
  else if (!terbit.length) amaran.push('Siri ini diterbitkan tetapi belum ada kuliah yang diterbitkan.');
  app.innerHTML = `
    <p><a href="#/">&larr; Semua siri</a></p>
    <div class="baris antara">
      <div><h1>${h(c.tajuk)}</h1><div class="baris" style="margin-top:6px">${lencanaGolongan(c.golongan)} ${lencanaStatus(c.status)} ${c.semakan ? '<span class="lencana pratonton">Perubahan menunggu</span>' : ''}${ADMIN() && c.guru_nama ? `<span class="kecil">Guru: ${h(c.guru_nama)}</span>` : ''}</div></div>
      <div class="baris"><a class="butang kedua" href="#/course/${id}/sunting">Sunting siri</a><a class="butang" href="#/course/${id}/subject/baru">Tambah kuliah</a></div>
    </div>
    ${c.huraian ? `<p>${h(c.huraian)}</p>` : ''}
    ${kotakCatatan(c)}
    ${amaran.map((a) => `<div class="info">${a}</div>`).join('')}
    <h2>Subject (${c.subject.length})</h2>
    ${c.subject.length ? c.subject.map((s, i) => `
      <div class="kad subject">
        ${gambarSubject(s)}
        <div class="isi">
          <b>${i + 1}. ${h(s.tajuk)}</b>
          <div class="baris">${lencanaStatus(s.status)} ${s.pratonton ? '<span class="lencana pratonton">Tanpa log masuk</span>' : ''}
            ${s.semakan ? '<span class="lencana pratonton">Perubahan menunggu</span>' : ''}${s.catatan_semakan ? '<span class="lencana draf">Ada catatan admin</span>' : ''}
            ${s.status === 'terbit' ? `<span class="kecil">${s.bil_khatam} pelajar khatam</span>` : ''}</div>
        </div>
        <div class="baris alat">
          <button class="kedua ikon" title="Naik" aria-label="Naikkan ${h(s.tajuk)}" data-act="alih" data-course="${id}" data-id="${s.id}" data-arah="-1" ${i === 0 ? 'disabled' : ''}>&uarr;</button>
          <button class="kedua ikon" title="Turun" aria-label="Turunkan ${h(s.tajuk)}" data-act="alih" data-course="${id}" data-id="${s.id}" data-arah="1" ${i === c.subject.length - 1 ? 'disabled' : ''}>&darr;</button>
          <a class="butang kedua" href="#/course/${id}/subject/${s.id}">Sunting</a>
        </div>
      </div>`).join('') : '<div class="kad kosong">Belum ada kuliah. Tekan <b>Tambah kuliah</b>.</div>'}`;
}

async function borangSubject(cid, sid) {
  const c = await api('GET', `course/${cid}`);
  const s0 = sid ? c.subject.find((x) => String(x.id) === String(sid)) : { tajuk: '', huraian: '', video_id: null, rujukan: '', pratonton: true, status: 'draf', semakan: null };
  if (!s0) throw new RalatApi({ ralat: 'tidak-dijumpai' }, 404);
  const s = { ...s0, ...(s0.semakan || {}) }; // versi cadangan guru jika ada
  app.innerHTML = `
    <p><a href="#/course/${cid}">&larr; ${h(c.tajuk)}</a></p>
    <h1>${sid ? 'Sunting kuliah' : 'Kuliah baru'}</h1>
    <form class="kad" data-borang="subject" data-course="${cid}" data-id="${sid || ''}" novalidate>
      <div class="ralat" hidden></div>
      ${kotakCatatan(s0)}${kotakSemakan(s0)}
      <label for="tajuk">Tajuk</label>
      <input type="text" id="tajuk" name="tajuk" maxlength="120" value="${h(s.tajuk)}" required>
      <label for="video">Pautan video (YouTube atau Google Drive)</label>
      <input type="url" id="video" name="video" inputmode="url" placeholder="https://drive.google.com/file/d/.../view atau https://youtu.be/..." value="${h(pautanVideoP(s.video_sumber, s.video_id))}">
      <div class="bantuan"><b>Google Drive:</b> klik kanan fail, <b>Share</b>, tetapkan <b>Anyone with the link</b> (Viewer), kemudian <b>Copy link</b> dan tampal di sini. <b>YouTube:</b> tampal pautan dari butang Share; video sebaiknya <b>Unlisted</b>. Video Google Drive tidak ditanda khatam secara automatik; pelajar menekan <b>Tandakan selesai</b> sendiri.</div>
      ${s.video_id ? `<div class="subject" style="margin-top:8px">${gambarSubject(s)}<span class="kecil">Video ${s0.semakan && 'video_id' in s0.semakan ? 'dicadangkan' : 'semasa'} (${s.video_sumber === 'drive' ? 'Google Drive' : 'YouTube'})</span></div>` : ''}
      <label for="thumbnail">Gambar thumbnail (pilihan)</label>
      <input type="url" id="thumbnail" name="thumbnail" inputmode="url" placeholder="https://drive.google.com/file/d/.../view" value="${h(pautanGambarP(s.thumbnail))}">
      <div class="bantuan">Pautan fail gambar (JPG atau PNG) dari Google Drive, perkongsian <b>Anyone with the link</b>. Kosongkan untuk guna gambar daripada video secara automatik. Disyorkan nisbah 16:9.</div>
      <label for="huraian">Huraian</label>
      <textarea id="huraian" name="huraian" maxlength="2000">${h(s.huraian)}</textarea>
      <label for="rujukan">Rujukan dan dalil</label>
      <textarea id="rujukan" name="rujukan" class="rujukan-medan" dir="auto" rows="8" maxlength="4000" placeholder="1. Nama kitab, jilid, halaman&#10;2. Petikan nas atau dalil (boleh teks Arab)">${h(s.rujukan)}</textarea>
      <div class="bantuan">Satu rujukan satu baris, dipapar bernombor di bawah video. Teks Arab boleh ditampal terus dan dipapar kanan ke kiri. Maksimum 4,000 aksara. Isi rujukan sebelum menghantar untuk kelulusan.</div>
      <label>Tonton tanpa log masuk</label>
      <div class="pilihan"><label><input type="checkbox" name="pratonton" ${s.pratonton ? 'checked' : ''}> Pelawat boleh menonton kuliah ini tanpa log masuk (contoh: video pengenalan)</label></div>
      <div class="bantuan">Kuliah lain hanya boleh ditonton selepas pelajar log masuk dengan Google. Kuliah bertanda ini juga dipaparkan di laman utama.</div>
      ${pilihanStatus(s0.status, 'subject')}
      <div class="tindakan">
        <button type="submit">Simpan</button>
        ${sid && (ADMIN() || s0.status !== 'terbit') ? `<button type="button" class="bahaya" data-act="padam-subject" data-course="${cid}" data-id="${sid}">Padam kuliah</button>` : ''}
      </div>
    </form>
    <div class="kad" id="kad-nota" data-subject="${sid || ''}">${sid ? 'Memuatkan nota…' : '<h2>Nota PDF</h2><p class="bantuan">Simpan kuliah ini dahulu, kemudian buka semula untuk memuat naik nota.</p>'}</div>`;
  if (sid) segarNota(sid);
}

// ---------- kelulusan (admin) ----------

const NAMA_MEDAN = { tajuk: 'Tajuk', huraian: 'Huraian', video_id: 'Video', video_sumber: 'Sumber video', thumbnail: 'Gambar thumbnail', pratonton: 'Tanpa log masuk', golongan: 'Siapa boleh lihat', tempoh_saat: 'Tempoh', rujukan: 'Rujukan', kategori_id: 'Kategori' };
function nilaiMedan(k, v, sumber) {
  if (k === 'video_id') return v ? `<a href="${h(pautanVideoP(sumber, v))}" target="_blank" rel="noopener">${sumber === 'drive' ? 'Google Drive' : 'youtu.be/' + h(v)}</a>` : '(tiada)';
  if (k === 'video_sumber') return sumber === 'drive' ? 'Google Drive' : 'YouTube';
  if (k === 'thumbnail') return pautanGambarP(v) ? `<a href="${h(pautanGambarP(v))}" target="_blank" rel="noopener">Gambar (Google Drive)</a>` : '(tiada)';
  if (k === 'pratonton') return v ? 'Ya' : 'Tidak';
  const t = String(v ?? '');
  return t ? h(t.length > 400 ? t.slice(0, 400) + '…' : t) : '<i>(kosong)</i>';
}
const butangKelulusan = (jenis, id) => `<div class="baris" style="margin-top:12px">
  <button data-act="lulus" data-jenis="${jenis}" data-id="${id}">Lulus</button>
  <button class="bahaya" data-act="tolak" data-jenis="${jenis}" data-id="${id}">Tolak</button></div>`;

async function halamanKelulusan() {
  const q = await api('GET', 'kelulusan');
  const bahagian = (tajuk, senarai, papar) => `<h2>${tajuk} (${senarai.length})</h2>${senarai.length ? senarai.map(papar).join('') : '<p class="kecil">Tiada.</p>'}`;
  app.innerHTML = `
    <p><a href="#/">&larr; Senarai siri</a></p>
    <h1>Kelulusan</h1>
    <p class="kecil">Kandungan daripada guru hanya dipaparkan kepada pelajar selepas diluluskan. Tolak akan meminta catatan yang dilihat guru.</p>
    ${bahagian('Siri baru', q.course, (c) => `<div class="kad"><b>${h(c.tajuk)}</b>
      <div class="kecil">Guru: ${h(c.guru_nama || '-')} · <a href="#/course/${c.id}">Lihat siri</a></div>${c.huraian ? `<p>${h(c.huraian)}</p>` : ''}${butangKelulusan('course', c.id)}</div>`)}
    ${bahagian('Kuliah baru', q.subject, (s) => `<div class="kad subject">${gambarSubject(s)}<div class="isi"><b>${h(s.tajuk)}</b>
      <div class="kecil">${h(s.course_tajuk)} · Guru: ${h(s.guru_nama || '-')} · <a href="#/course/${s.course_id}/subject/${s.id}">Lihat</a>${s.video_id ? ` · <a href="${h(pautanVideoP(s.video_sumber, s.video_id))}" target="_blank" rel="noopener">Tonton</a>` : ''}</div>
      ${butangKelulusan('subject', s.id)}</div></div>`)}
    ${bahagian('Perubahan pada kandungan terbit', q.perubahan, (k) => `<div class="kad"><b>${k.jenis === 'course' ? 'Course' : 'Kuliah'}: ${h(k.tajuk)}</b>
      <div class="kecil">Guru: ${h(k.guru_nama || '-')}</div>
      <table class="beza"><thead><tr><th>Medan</th><th>Sekarang</th><th>Dicadangkan</th></tr></thead><tbody>
      ${Object.keys(k.perubahan).map((m) => `<tr><td>${NAMA_MEDAN[m] || h(m)}</td><td>${nilaiMedan(m, k.semasa[m], k.semasa.video_sumber ?? k.perubahan.video_sumber)}</td><td>${nilaiMedan(m, k.perubahan[m], k.perubahan.video_sumber ?? k.semasa.video_sumber)}</td></tr>`).join('')}
      </tbody></table>${butangKelulusan('perubahan', k.id)}</div>`)}
    ${bahagian('Nota PDF', q.nota, (n) => `<div class="kad"><b>${h(n.nama)}</b> <span class="kecil">${saizTeks(n.saiz)}</span>
      <div class="kecil">${h(n.course_tajuk)} · ${h(n.subject_tajuk)} · Guru: ${h(n.guru_nama || '-')} · <a href="/api/admin/nota/${n.id}" target="_blank" rel="noopener">Buka PDF</a></div>${butangKelulusan('nota', n.id)}</div>`)}`;
}

// ---------- soal jawab (admin dan guru) ----------

async function halamanSoalan(status) {
  const d = await api('GET', `soalan?status=${status}`);
  const kad = (q) => `<div class="kad soalan-kad" data-soalan="${q.id}">
    <div class="baris antara" style="margin:0"><div class="kecil"><b>${h(q.course_tajuk)}</b> · <a href="/#/subject/${q.subject_id}" target="_blank" rel="noopener">${h(q.subject_tajuk)}</a></div>
      ${q.tersembunyi ? '<span class="lencana draf">Disorok</span>' : ''}</div>
    <div class="kecil" style="margin-top:6px">${h(q.nama_penanya || 'Pelajar')}${ADMIN() && q.emel_penanya ? ` (${h(q.emel_penanya)})` : ''} · ${tarikhMy(q.dicipta_pada)}</div>
    <p class="soalan-teks">${h(q.teks)}</p>
    <label for="j-${q.id}">${q.jawapan ? 'Jawapan' + (q.penjawab_nama ? ` (${h(q.penjawab_nama)}, ${tarikhMy(q.dijawab_pada)})` : '') : 'Jawapan anda'}</label>
    <textarea id="j-${q.id}" maxlength="4000" style="min-height:96px" placeholder="Tulis jawapan. Selepas dihantar, ia terus dipaparkan kepada pelajar.">${h(q.jawapan || '')}</textarea>
    <div class="ralat" hidden></div>
    <div class="tindakan" style="margin-top:12px">
      <button type="button" data-act="jawab" data-id="${q.id}">${q.jawapan ? 'Kemas kini jawapan' : 'Hantar jawapan'}</button>
      ${ADMIN() && q.jawapan ? `<button type="button" class="kedua" data-act="sorok-soalan" data-id="${q.id}" data-sorok="${q.tersembunyi ? '0' : '1'}">${q.tersembunyi ? 'Tunjuk semula' : 'Sorok daripada pelajar'}</button>` : ''}
      ${ADMIN() ? `<button type="button" class="bahaya" data-act="padam-soalan" data-id="${q.id}">Padam</button>` : ''}
    </div></div>`;
  app.innerHTML = `
    <p><a href="#/">&larr; Senarai siri</a></p>
    <div class="baris antara"><h1>Soal jawab</h1>
      <div class="segmen" role="tablist" aria-label="Penapis soalan">
        <a href="#/soalan" role="tab" aria-selected="${status === 'menunggu'}">Menunggu${d.bil_menunggu ? ` (${d.bil_menunggu})` : ''}</a>
        <a href="#/soalan/dijawab" role="tab" aria-selected="${status === 'dijawab'}">Dijawab</a>
      </div></div>
    <p class="kecil">Soalan pelajar pada kuliah ${ADMIN() ? 'semua course' : 'course anda'}. Jawapan terus dipaparkan kepada pelajar; soalan yang belum dijawab tidak kelihatan kepada pelajar lain.</p>
    ${d.soalan.length ? d.soalan.map(kad).join('') : `<div class="kad kosong">${status === 'menunggu' ? 'Tiada soalan menunggu jawapan.' : 'Belum ada soalan yang dijawab.'}</div>`}`;
}

// ---------- guru (admin) ----------

// ---------- laporan kandungan (S-21, admin) ----------
const LABEL_SEBAB_LAPOR = { 'salah-fakta': 'Salah fakta', 'kebencian-takfir': 'Kandungan kebencian atau takfir', 'tiada-rujukan': 'Tiada rujukan', lain: 'Lain-lain' };
const LABEL_STATUS_LAPOR = { baru: 'Baru', disemak: 'Disemak', selesai: 'Selesai' };
const lencanaLaporan = (s) => `<span class="lencana ${s === 'baru' ? 'bahaya-l' : s === 'disemak' ? 'pratonton' : ''}">${h(LABEL_STATUS_LAPOR[s] || s)}</span>`;
async function halamanLaporan(status = 'baru') {
  if (!['baru', 'disemak', 'selesai', 'semua'].includes(status)) status = 'baru';
  const d = await api('GET', `laporan?status=${status}`);
  const tab = (k, label) => `<a class="butang ${status === k ? '' : 'kedua'}" href="#/laporan${k === 'baru' ? '' : '/' + k}" ${status === k ? 'aria-current="page"' : ''}>${label}${k === 'baru' && d.bil_baru ? ` (${d.bil_baru})` : ''}</a>`;
  app.innerHTML = `
    <p><a href="#/">&larr; Senarai siri</a></p>
    <h1>Laporan kandungan</h1>
    <p class="kecil">Laporan daripada ahli berdaftar tentang kuliah, soalan atau jawapan. Untuk menyorok kuliah serta-merta, tukar statusnya kepada Draf di Sunting kuliah.</p>
    <div class="baris" style="flex-wrap:wrap;gap:8px;margin:12px 0">${tab('baru', 'Baru')}${tab('disemak', 'Disemak')}${tab('selesai', 'Selesai')}${tab('semua', 'Semua')}</div>
    ${d.laporan.length ? d.laporan.map((l) => `
      <form class="kad" data-borang="urus-laporan" data-id="${l.id}" novalidate>
        <div class="ralat" hidden></div>
        <div class="baris antara" style="margin:0 0 6px"><div><b>${h(LABEL_SEBAB_LAPOR[l.sebab] || l.sebab)}</b> ${lencanaLaporan(l.status)}</div><span class="kecil">${h(tarikhMy(l.dicipta_pada))}</span></div>
        <div class="kecil">Kuliah: <a href="#/course/${l.course_id}/subject/${l.subject_id}">${h(l.subject_tajuk)}</a> · Siri: <a href="#/course/${l.course_id}">${h(l.course_tajuk)}</a>${l.subject_status !== 'terbit' ? ` · <b>${h(l.subject_status)}</b>` : ''}</div>
        ${l.soalan_id ? `<div class="catatan-laporan"><small>Soalan yang dilapor</small><p>${h(l.soalan_teks || '(soalan sudah dipadam)')}</p></div>` : ''}
        ${l.catatan ? `<div class="catatan-laporan"><small>Catatan pelapor</small><p>${h(l.catatan).replace(/\n/g, '<br>')}</p></div>` : '<div class="kecil">Tiada catatan.</div>'}
        <div class="kecil">Pelapor: ${h(l.nama_pelapor || '')} (${h(l.emel_pelapor || '')})</div>
        <label for="ls-${l.id}">Status</label>
        <select id="ls-${l.id}" name="status">${Object.entries(LABEL_STATUS_LAPOR).map(([k, t]) => `<option value="${k}" ${l.status === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <label for="lc-${l.id}">Catatan admin (dalaman)</label>
        <textarea id="lc-${l.id}" name="catatan_admin" maxlength="500" rows="3">${h(l.catatan_admin)}</textarea>
        <div class="tindakan"><button type="submit">Simpan</button><a class="butang kedua" href="/#/subject/${l.subject_id}" target="_blank" rel="noopener">Buka kuliah</a></div>
      </form>`).join('') : '<div class="kad kosong">Tiada laporan.</div>'}`;
}

async function halamanKategori() {
  const senarai = await api('GET', 'kategori');
  app.innerHTML = `
    <p><a href="#/">&larr; Senarai siri</a></p>
    <h1>Kategori</h1>
    <p class="kecil">Kategori mengelompokkan siri di laman awam dan menjadi penapis. Satu siri satu kategori. Nombor urutan kecil dipaparkan dahulu.</p>
    <form class="kad" data-borang="kategori" novalidate>
      <div class="ralat" hidden></div>
      <label for="nama-kat">Tambah kategori</label>
      <input type="text" id="nama-kat" name="nama" maxlength="60" placeholder="contoh: Sejarah Firqah &amp; Mazhab">
      <div class="tindakan"><button type="submit">Tambah kategori</button></div>
    </form>
    ${senarai.length ? senarai.map((k) => `
      <form class="kad" data-borang="ubah-kategori" data-id="${k.id}" novalidate>
        <div class="ralat" hidden></div>
        <div class="baris antara" style="margin:0 0 8px"><b>${h(k.nama)}</b><span class="kecil">${k.bil_course} siri${k.bil_course_terbit !== k.bil_course ? ` (${k.bil_course_terbit} terbit)` : ''} · /${h(k.slug)}</span></div>
        <label for="kn-${k.id}">Nama</label>
        <input type="text" id="kn-${k.id}" name="nama" maxlength="60" value="${h(k.nama)}">
        <label for="ku-${k.id}">Urutan</label>
        <input type="number" id="ku-${k.id}" name="urutan" min="0" max="9999" value="${h(k.urutan)}">
        <div class="tindakan"><button type="submit">Simpan</button>
          <button type="button" class="bahaya" data-act="padam-kategori" data-id="${k.id}" ${k.bil_course ? 'disabled title="Masih digunakan oleh siri"' : ''}>Padam</button></div>
        ${k.bil_course ? '<div class="bantuan">Tidak boleh dipadam selagi ada siri. Pindahkan atau kosongkan kategori siri itu dahulu.</div>' : ''}
      </form>`).join('') : '<div class="kad kosong">Belum ada kategori.</div>'}`;
}

async function halamanGuru() {
  const [senarai, adm] = await Promise.all([api('GET', 'guru'), api('GET', 'admin')]);
  app.innerHTML = `
    <p><a href="#/">&larr; Senarai siri</a></p>
    <h1>Pasukan</h1>
    <h2 style="margin-top:8px">Admin</h2>
    <div class="kad">
      ${adm.utama.map((e) => `<div class="baris antara" style="margin:0 0 8px"><div><b>${h(e)}</b><div class="kecil">Admin utama (ditetapkan dalam Cloudflare, ADMIN_EMELS)</div></div></div>`).join('')}
      ${adm.tambahan.map((a) => `<div class="baris antara" style="margin:0 0 8px"><div><b>${h(a.emel)}</b><div class="kecil">Admin tambahan · ditambah oleh ${h(a.ditambah_oleh)} pada ${h(tarikhMy(a.dicipta_pada))}</div></div>
        ${adm.bolehUrus ? `<button class="bahaya" data-act="buang-admin" data-emel="${h(a.emel)}">Buang</button>` : ''}</div>`).join('')}
      ${adm.bolehUrus ? `<form data-borang="admin" novalidate style="margin-top:12px"><div class="ralat" hidden></div>
        <label for="emelAdmin">Tambah admin (emel Google)</label>
        <input type="text" id="emelAdmin" name="emel" inputmode="email" maxlength="120" placeholder="nama@gmail.com">
        <div class="bantuan">Admin tambahan mempunyai kuasa penuh panel kecuali menambah atau membuang admin. Bila dibuang, sesi mereka ditamatkan serta-merta.</div>
        <div class="tindakan"><button type="submit">Tambah admin</button></div></form>`
        : '<div class="bantuan">Hanya admin utama boleh menambah atau membuang admin.</div>'}
    </div>
    <h2>Guru</h2>
    <form class="kad" data-borang="guru" novalidate>
      <div class="ralat" hidden></div>
      <label for="emel">Emel Google guru</label>
      <input type="text" id="emel" name="emel" inputmode="email" maxlength="120" placeholder="nama@gmail.com">
      <label for="nama">Nama paparan</label>
      <input type="text" id="nama" name="nama" maxlength="80" placeholder="contoh: Ustaz Ali">
      <div class="bantuan">Guru log masuk di <b>/panel/</b> dengan akaun Google emel ini. Nama paparan dilihat pelajar pada siri guru. Kelayakan, institusi dan bio diisi melalui butang Profil pada kad guru.</div>
      <div class="tindakan"><button type="submit">Simpan guru</button></div>
    </form>
    ${senarai.length ? senarai.map((g) => `<div class="kad"><div class="baris antara" style="margin:0"><div><b>${h(g.nama)}</b><div class="kecil">${h(g.emel)} · ${g.bil_course} siri</div>
      <div class="kecil">${g.kelayakan ? h(g.kelayakan) : '<i>Kelayakan belum diisi</i>'}${g.institusi ? ' · ' + h(g.institusi) : ''}</div></div>
      <div class="baris" style="margin:0"><button class="kedua" data-act="buka-profil" data-emel="${h(g.emel)}">Profil</button><button class="bahaya" data-act="buang-guru" data-emel="${h(g.emel)}">Buang</button></div></div>
      <form data-borang="profil-guru" data-emel="${h(g.emel)}" hidden novalidate style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px"><div class="ralat" hidden></div>
        <div class="info" hidden>Profil disimpan.</div>
        <label>Nama paparan</label>
        <input type="text" name="nama" maxlength="80" value="${h(g.nama)}">
        <label>Kelayakan / tauliah</label>
        <input type="text" name="kelayakan" maxlength="200" value="${h(g.kelayakan)}" placeholder="contoh: Sarjana Usuluddin; Tauliah mengajar JAIS">
        <label>Institusi</label>
        <input type="text" name="institusi" maxlength="120" value="${h(g.institusi)}">
        <label>Gambar guru (pilihan)</label>
        <input type="url" name="gambar" inputmode="url" placeholder="https://drive.google.com/file/d/.../view" value="${h(pautanGambarP(g.gambar))}">
        <div class="bantuan">Pautan gambar dari Google Drive (perkongsian <b>Anyone with the link</b>). Dipaparkan kecil pada kad Pengajar. Pastikan guru bersetuju gambarnya dipaparkan.</div>
        <label>Bio ringkas</label>
        <textarea name="bio" maxlength="600" rows="4">${h(g.bio)}</textarea>
        <div class="bantuan">Dipaparkan kepada orang awam pada halaman siri guru ini. Hanya admin boleh mengisi atau mengubahnya; guru tidak boleh menyunting sendiri. Pastikan kelayakan dan tauliah telah disahkan.</div>
        <div class="tindakan"><button type="submit">Simpan profil</button></div></form></div>`).join('') : '<div class="kad kosong">Belum ada guru.</div>'}`;
}

// ---------- pengguna (admin) ----------
const tapisPengguna = { cari: '', golongan: '', status: '' };
const LABEL_GOL_P = { awam: 'Orang awam', pelajar: 'Pelajar', ahli: 'Ahli organisasi' };
async function halamanPengguna(halaman = 0) {
  const kotakCari = document.getElementById('cariPengguna');
  if (kotakCari) { tapisPengguna.cari = kotakCari.value.trim(); tapisPengguna.golongan = document.getElementById('tapisGolongan').value; tapisPengguna.status = document.getElementById('tapisStatus').value; }
  const d = await api('GET', 'pengguna?' + new URLSearchParams({ ...tapisPengguna, halaman }));
  const hari = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
  const pilih = (id, nilai, pilihan) => `<select id="${id}">${pilihan.map(([v, t]) => `<option value="${v}" ${nilai === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  const golTeks = (p) => (p.golongan === null || p.golongan === undefined ? 'Belum memilih' : LABEL_GOL_P[p.golongan] + (p.golongan_tamat ? ` hingga ${tarikhMy(p.golongan_tamat + 'T00:00:00+08:00')}${p.golongan_tamat < hari ? ' (tamat)' : ''}` : ''));
  const akhir = Math.max(0, Math.ceil(d.jumlah / d.saiz) - 1);
  app.innerHTML = `
    <p><a href="#/">&larr; Senarai siri</a></p>
    <div class="baris antara"><h1>Pengguna</h1><button class="kedua" data-act="eksport-pengguna">Eksport CSV</button></div>
    <form class="kad tapis-pengguna" data-borang="tapis-pengguna" novalidate><div class="ralat" hidden></div>
      <label for="cariPengguna">Cari nama atau emel</label>
      <input type="text" id="cariPengguna" maxlength="80" value="${h(tapisPengguna.cari)}" placeholder="contoh: aminah">
      <div class="dua-lajur">
        <div><label for="tapisGolongan">Golongan</label>${pilih('tapisGolongan', tapisPengguna.golongan, [['', 'Semua'], ['awam', 'Orang awam'], ['pelajar', 'Pelajar'], ['ahli', 'Ahli organisasi'], ['belum', 'Belum memilih']])}</div>
        <div><label for="tapisStatus">Status</label>${pilih('tapisStatus', tapisPengguna.status, [['', 'Semua'], ['disekat', 'Disekat']])}</div>
      </div>
      <div class="tindakan"><button type="submit">Tapis</button></div>
    </form>
    <p class="kecil">${d.jumlah} pengguna${d.jumlah > d.saiz ? ` · halaman ${d.halaman + 1} daripada ${akhir + 1}` : ''}</p>
    ${d.senarai.length ? d.senarai.map((p) => `<div class="kad" id="pg-${p.id}">
      <div class="baris antara" style="margin:0;align-items:flex-start"><div style="min-width:0">
        <div class="baris" style="margin:0"><b>${h(p.nama || '(tiada nama)')}</b>${p.disekat ? '<span class="lencana bahaya-l">Disekat</span>' : ''}</div>
        <div class="kecil" style="overflow-wrap:anywhere">${h(p.emel)}</div>
        <div class="kecil" style="margin-top:4px">${h(golTeks(p))}</div>
        <div class="kecil">Daftar ${h(tarikhMy(p.dicipta_pada))}${p.log_masuk_terakhir ? ` · log masuk terakhir ${h(tarikhMy(p.log_masuk_terakhir))}` : ''}${p.hari_sesi ? ` · sesi ${p.hari_sesi} hari` : ''}</div></div>
        <button class="kedua" data-act="buka-pengguna" data-id="${p.id}">Urus</button></div>
      <form id="pf-${p.id}" data-borang="urus-pengguna" data-id="${p.id}" hidden novalidate style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px">
        <div class="ralat" hidden></div>
        <div class="dua-lajur">
          <div><label for="g-${p.id}">Golongan</label><select id="g-${p.id}" name="golongan">${['awam', 'pelajar', 'ahli'].map((g) => `<option value="${g}" ${(p.golongan || 'awam') === g ? 'selected' : ''}>${LABEL_GOL_P[g]}</option>`).join('')}</select></div>
          <div><label for="gt-${p.id}">Golongan tamat</label><input type="date" id="gt-${p.id}" name="golongan_tamat" value="${h(p.golongan_tamat || '')}"></div>
        </div>
        <div class="bantuan">Kosongkan tarikh untuk akses kekal. Orang awam tiada tarikh tamat.</div>
        <label for="hs-${p.id}">Tempoh log masuk khas (hari)</label>
        <input type="number" id="hs-${p.id}" name="hari_sesi" min="1" max="365" value="${p.hari_sesi ?? ''}" placeholder="kosong = ikut tetapan laman">
        <div class="tindakan" style="flex-wrap:wrap">
          <button type="submit">Simpan</button>
          <button type="button" class="kedua" data-act="keluar-pengguna" data-id="${p.id}">Log keluar semua peranti</button>
          <button type="button" class="${p.disekat ? 'kedua' : 'bahaya'}" data-act="sekat-pengguna" data-id="${p.id}" data-sekat="${p.disekat ? 0 : 1}">${p.disekat ? 'Nyahsekat' : 'Sekat akaun'}</button>
        </div>
      </form></div>`).join('') : '<div class="kad kosong">Tiada pengguna sepadan.</div>'}
    ${d.jumlah > d.saiz ? `<div class="baris antara">
      ${d.halaman > 0 ? `<button class="kedua" data-act="halaman-pengguna" data-halaman="${d.halaman - 1}">&larr; Sebelum</button>` : '<span></span>'}
      ${d.halaman < akhir ? `<button class="kedua" data-act="halaman-pengguna" data-halaman="${d.halaman + 1}">Seterusnya &rarr;</button>` : ''}</div>` : ''}`;
}

// ---------- kod golongan (admin) ----------
// Satu mekanisme sahaja: "had guna". Kosong = kod kongsi untuk satu kelas/kumpulan; 1 = kod peribadi sekali guna.
async function halamanKod() {
  const senarai = await api('GET', 'kod');
  const statusKod = (k) => (!k.aktif ? '<span class="lencana draf">Dimatikan</span>'
    : k.tamat_pada && k.tamat_pada < new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10) ? '<span class="lencana draf">Tamat</span>'
    : k.had_guna != null && k.bil_guna >= k.had_guna ? '<span class="lencana draf">Penuh</span>' : '<span class="lencana">Aktif</span>');
  app.innerHTML = `
    <p><a href="#/">&larr; Senarai siri</a></p>
    <h1>Kod golongan</h1>
    <div class="bantuan" style="margin-bottom:12px">Kod kelas membuka course yang dihadkan kepada golongan tertentu. Pelajar memasukkan kod di halaman Akaun selepas log masuk. Course bertanda "Semua" tidak memerlukan kod.</div>
    <form class="kad" data-borang="kod" novalidate>
      <div class="ralat" hidden></div>
      <label for="kgolongan">Golongan</label>
      <select id="kgolongan" name="golongan"><option value="pelajar">Pelajar</option><option value="ahli">Ahli organisasi</option></select>
      <label for="klabel">Label (untuk rujukan anda)</label>
      <input type="text" id="klabel" name="label" maxlength="60" placeholder="contoh: Kelas Tafsir UIA 2026">
      <label for="kbulan">Tempoh akses selepas kod dimasukkan</label>
      <select id="kbulan" name="bulan_akses">${[1, 2, 3, 6, 12].map((n) => `<option value="${n}" ${n === 1 ? 'selected' : ''}>${n} bulan</option>`).join('')}<option value="0">Kekal (tiada tamat)</option></select>
      <div class="bantuan">Pengguna yang memasukkan kod sama sekali lagi sebelum tamat akan disambung dari tarikh tamat sedia ada.</div>
      <label for="khad">Had guna</label>
      <input type="number" id="khad" name="had_guna" min="1" max="100000" placeholder="kosong = tanpa had">
      <div class="bantuan"><b>Kosong</b>: satu kod dikongsi seluruh kelas. <b>1</b>: kod peribadi, hanya seorang boleh guna. Nombor lain: had bilangan orang.</div>
      <label for="ktamat">Kod boleh dimasukkan sehingga (pilihan)</label>
      <input type="date" id="ktamat" name="tamat_pada">
      <label for="kbilangan">Bilangan kod</label>
      <input type="number" id="kbilangan" name="bilangan" min="1" max="200" value="1">
      <label for="kkod">Kod sendiri (pilihan, hanya jika bilangan 1)</label>
      <input type="text" id="kkod" name="kod" maxlength="24" placeholder="kosong = dijana rawak, contoh TAFSIR2026">
      <div class="tindakan"><button type="submit">Cipta kod</button></div>
    </form>
    <div id="kodBaru"></div>
    ${senarai.length ? senarai.map((k) => `<div class="kad"><div class="baris antara" style="margin:0;align-items:flex-start"><div>
        <div class="baris" style="margin:0"><b class="kod-teks">${h(k.kod_papar)}</b> <span class="lencana ${k.golongan === 'ahli' ? 'ahli' : ''}">${k.golongan === 'ahli' ? 'Ahli organisasi' : 'Pelajar'}</span> ${statusKod(k)}</div>
        <div class="kecil" style="margin-top:4px">${k.label ? h(k.label) + ' · ' : ''}${k.bulan_akses ? `${k.bulan_akses} bulan akses` : 'akses kekal'} · digunakan ${k.bil_guna}${k.had_guna != null ? '/' + k.had_guna : ''} kali${k.tamat_pada ? ' · boleh dimasukkan hingga ' + h(tarikhMy(k.tamat_pada + 'T00:00:00+08:00')) : ''}</div>
        <div class="kod-pengguna" id="kp-${k.id}"></div></div>
      <div class="baris" style="margin:0;flex-wrap:wrap;justify-content:flex-end">
        <button class="kedua" data-act="salin-kod" data-kod="${h(k.kod_papar)}">Salin</button>
        ${k.bil_guna ? `<button class="kedua" data-act="pengguna-kod" data-id="${k.id}">Pengguna</button>` : ''}
        <button class="kedua" data-act="aktif-kod" data-id="${k.id}" data-aktif="${k.aktif ? 0 : 1}">${k.aktif ? 'Matikan' : 'Hidupkan'}</button>
        ${k.bil_guna ? '' : `<button class="bahaya" data-act="padam-kod" data-id="${k.id}">Padam</button>`}</div></div></div>`).join('')
      : '<div class="kad kosong">Belum ada kod.</div>'}`;
}

// ---------- artikel ----------

const SASARAN = 2000;
const kiraPerkataan = (isi) => String(isi || '').replace(/!\[([^\]]*)\]\([^)]*\)/g, ' $1 ').replace(/\[([^\]]+)\]\([^)]*\)/g, ' $1 ').replace(/[#>*_`]/g, ' ')
  .split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
const tarikhMy = (iso) => { if (!iso) return ''; const d = new Date(Date.parse(iso) + 8 * 3600e3).toISOString().slice(0, 10); return `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`; };

async function senaraiArtikel() {
  const senarai = await api('GET', 'artikel');
  app.innerHTML = `
    <div class="baris antara"><h1>Artikel</h1><a class="butang" href="#/artikel/baru">Tambah artikel</a></div>
    ${senarai.length ? senarai.map((a) => `<a class="kad" href="#/artikel/${a.id}">
      <div class="baris antara" style="margin:0"><b>${h(a.tajuk)}</b>${lencanaStatus(a.status)}</div>
      <div class="kecil" style="margin-top:6px">${a.bil_perkataan} perkataan${a.bil_perkataan < SASARAN ? ` (sasaran ${SASARAN})` : ''} · /artikel/${h(a.slug)}${a.diterbit_pada ? ' · terbit ' + tarikhMy(a.diterbit_pada) : ''}</div></a>`).join('')
      : '<div class="kad kosong">Belum ada artikel. Tekan <b>Tambah artikel</b>.</div>'}`;
}

async function borangArtikel(id) {
  const a = id ? await api('GET', `artikel/${id}`) : { tajuk: '', slug: '', ringkasan: '', meta_description: '', gambar: null, gambar_alt: '', isi: '', status: 'draf', diterbit_pada: null, bil_perkataan: 0 };
  const dikunci = !!a.diterbit_pada;
  app.innerHTML = `
    <p><a href="#/artikel">&larr; Senarai artikel</a></p>
    <h1>${id ? 'Sunting artikel' : 'Artikel baru'}</h1>
    <form class="kad" data-borang="artikel" data-id="${id || ''}" novalidate>
      <div class="ralat" hidden></div>
      <div class="info" id="artikel-ok" hidden>Disimpan.</div>
      <label for="tajuk">Tajuk (jadi tajuk H1 dan tajuk di Google)</label>
      <input type="text" id="tajuk" name="tajuk" maxlength="120" value="${h(a.tajuk)}" required>
      <label for="slug">Slug (alamat artikel)</label>
      <input type="text" id="slug" name="slug" maxlength="80" value="${h(a.slug)}" placeholder="dijana daripada tajuk jika dikosongkan" ${dikunci ? 'readonly' : ''}>
      <div class="bantuan">${dikunci ? 'Dikunci kerana artikel pernah diterbitkan.' : 'Hanya huruf kecil, nombor dan sempang. Tidak boleh ditukar selepas diterbitkan.'}${a.slug ? ` Alamat: <b>/artikel/${h(a.slug)}</b>` : ''}</div>
      <label for="ringkasan">Ringkasan (dipaparkan pada kad artikel di laman)</label>
      <textarea id="ringkasan" name="ringkasan" maxlength="200" style="min-height:70px">${h(a.ringkasan)}</textarea>
      <div class="bantuan" id="kira-ringkasan"></div>
      <label for="meta_description">Meta description (teks di bawah tajuk dalam hasil carian Google)</label>
      <textarea id="meta_description" name="meta_description" maxlength="200" style="min-height:70px" placeholder="Kosongkan untuk guna ringkasan">${h(a.meta_description)}</textarea>
      <div class="bantuan" id="kira-meta"></div>
      <label>Gambar utama</label>
      <input type="hidden" name="gambar" id="gambar" value="${h(a.gambar || '')}">
      <div id="pratonton-gambar"></div>
      <div class="baris" style="margin-top:8px">
        <input type="file" id="failGambar" accept="image/png,image/jpeg,image/webp" data-gambar-utama>
        <button type="button" class="kedua" data-act="buang-gambar" id="butangBuangGambar" hidden>Buang gambar</button>
      </div>
      <div class="bantuan">Dikecilkan automatik (lebar maksimum 1600px). Nisbah 16:9 paling sesuai. Gambar ini juga dipaparkan bila artikel dikongsi di WhatsApp dan Facebook.</div>
      <label for="gambar_alt">Teks alt gambar utama (penerangan gambar untuk Google)</label>
      <input type="text" id="gambar_alt" name="gambar_alt" maxlength="150" value="${h(a.gambar_alt)}" placeholder="contoh: Pelajar menadah kitab di masjid">
      <div class="baris antara" style="margin-top:16px"><label for="isi" style="margin:0">Isi artikel</label>
        <label class="butang kedua" style="margin:0;font-weight:600">Masukkan gambar<input type="file" accept="image/png,image/jpeg,image/webp" data-gambar-isi hidden></label></div>
      <textarea id="isi" name="isi" style="min-height:420px;font-family:inherit;line-height:1.6">${h(a.isi)}</textarea>
      <div class="bantuan" id="kira-isi"></div>
      <details style="margin-top:10px"><summary class="kecil" style="cursor:pointer">Panduan format</summary>
        <div class="bantuan" style="line-height:1.7">
          <code>## Tajuk bahagian</code> · <code>### Tajuk kecil</code><br>
          <code>**tebal**</code> · <code>*condong*</code><br>
          <code>- senarai</code> · <code>1. senarai bernombor</code> · <code>&gt; petikan</code> · <code>---</code> garis<br>
          <code>[teks pautan](https://contoh.com)</code> atau <code>[kuliah](/#/course/slug)</code><br>
          Gambar: tekan <b>Masukkan gambar</b> di atas kotak isi (dimuat naik dan disisip di kedudukan kursor). Tukar teks dalam <code>![...]</code> kepada penerangan gambar.<br>
          Tinggalkan satu baris kosong antara perenggan. Jangan taip tajuk artikel sekali lagi dalam isi; tajuk di atas sudah menjadi H1.
        </div></details>
      <label>Status</label>
      <div class="pilihan">
        <label><input type="radio" name="status" value="draf" ${a.status === 'draf' ? 'checked' : ''}> Draf</label>
        <label><input type="radio" name="status" value="terbit" ${a.status === 'terbit' ? 'checked' : ''}> Terbit</label>
      </div>
      <div class="tindakan">
        <button type="submit">Simpan</button>
        ${id ? `<a class="butang kedua" href="/artikel/${h(a.slug)}" target="_blank" rel="noopener">${a.status === 'terbit' ? 'Lihat di laman' : 'Pratonton draf'}</a>
          <button type="button" class="bahaya" data-act="padam-artikel" data-id="${id}">Padam</button>` : ''}
      </div>
    </form>`;
  kemaskiniKiraArtikel();
  paparGambarUtama(a.gambar);
}

function kemaskiniKiraArtikel() {
  const isi = document.getElementById('isi'), rg = document.getElementById('ringkasan');
  if (!isi || !rg) return;
  const n = kiraPerkataan(isi.value);
  const k = document.getElementById('kira-isi');
  k.textContent = `${n} perkataan${n >= SASARAN ? ' (sasaran 2000 dicapai)' : `, kurang ${SASARAN - n} untuk sasaran ${SASARAN}`}`;
  k.style.color = n >= SASARAN ? 'var(--ok)' : '';
  const l = rg.value.trim().length;
  document.getElementById('kira-ringkasan').textContent = `${l} aksara`;
  const m = document.getElementById('meta_description').value.trim().length;
  const km = document.getElementById('kira-meta');
  km.textContent = !m ? 'Kosong: ringkasan akan digunakan sebagai meta description.'
    : `${m} aksara${m > 160 ? ' (terlalu panjang: Google biasanya memotong selepas kira-kira 155 hingga 160)' : m < 70 ? ' (agak pendek: sasaran 120 hingga 160)' : ' (baik)'}`;
  km.style.color = m > 160 ? 'var(--warn)' : '';
}

// ---------- gambar artikel: dikecilkan di pelayar, kemudian dimuat naik ke /api/admin/media ----------

async function kecilkanGambar(fail) {
  try {
    const bmp = await createImageBitmap(fail);
    const skala = Math.min(1, 1600 / bmp.width);
    const kanvas = document.createElement('canvas');
    kanvas.width = Math.round(bmp.width * skala); kanvas.height = Math.round(bmp.height * skala);
    kanvas.getContext('2d').drawImage(bmp, 0, 0, kanvas.width, kanvas.height);
    for (const [jenis, mutu] of [['image/webp', 0.82], ['image/jpeg', 0.85]]) {
      const blob = await new Promise((r) => kanvas.toBlob(r, jenis, mutu));
      if (blob && blob.type === jenis) return blob; // Safari lama tidak menyokong webp: cuba jpeg
    }
  } catch { /* pelayar tidak menyokong: hantar fail asal, pelayan menyemak jenis dan saiz */ }
  return fail;
}

async function muatGambar(fail) {
  const b = await kecilkanGambar(fail);
  const r = await fetch('/api/admin/media', { method: 'POST', headers: { 'content-type': b.type || 'application/octet-stream' }, body: b });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new RalatApi(d, r.status);
  return d.url;
}

function paparGambarUtama(url) {
  const kotak = document.getElementById('pratonton-gambar');
  if (!kotak) return;
  kotak.innerHTML = url ? `<img class="gambar-utama" src="${h(url)}" alt="Gambar utama">` : '<p class="kecil">Tiada gambar utama.</p>';
  document.getElementById('butangBuangGambar').hidden = !url;
}

document.addEventListener('change', async (e) => {
  const utama = e.target.closest('[data-gambar-utama]'), dalam = e.target.closest('[data-gambar-isi]');
  if ((!utama && !dalam) || !e.target.files.length) return;
  const f = e.target.files[0], b = e.target.closest('form');
  e.target.disabled = true;
  try {
    const url = await muatGambar(f);
    if (utama) { b.querySelector('#gambar').value = url; paparGambarUtama(url); }
    else {
      const t = b.querySelector('#isi'), alt = f.name.replace(/\.[^.]+$/, '').replace(/[[\]()]/g, ' ').trim() || 'gambar';
      const sisip = `\n\n![${alt}](${url})\n\n`, i = t.selectionStart ?? t.value.length;
      t.value = t.value.slice(0, i) + sisip + t.value.slice(t.selectionEnd ?? i);
      t.focus(); t.selectionStart = t.selectionEnd = i + sisip.length;
      kemaskiniKiraArtikel();
    }
  } catch (err) { if (err.status === 401) return mula(); tunjukRalatBorang(b, err); }
  finally { e.target.disabled = false; e.target.value = ''; }
});

document.addEventListener('input', (e) => { if (['isi', 'ringkasan', 'meta_description'].includes(e.target.id)) kemaskiniKiraArtikel(); });

// ---------- tetapan laman ----------

const MEDAN_TETAPAN = [
  ['sijil_aktif', 'Sijil khatam siri', 'pilih', 'Sembunyi: pelajar tidak nampak butang Dapatkan sijil, tab sijil di Akaun, dan halaman /sijil/<kod> ditutup. Sijil yang sudah dikeluarkan tidak dipadam. Hidupkan bila tajuk dan penandatangan sudah disahkan.'],
  ['kod_aktif', 'Kod kelas (golongan)', 'pilih', 'Sembunyi: kotak Guna kod di Akaun dan tab Kod golongan disembunyikan. Siri berkunci kekal berkunci untuk orang awam. Data kod tidak dipadam.'],
  ['nama', 'Nama laman', 'input', 'Dipaparkan di header, footer dan tab pelayar.'],
  ['tagline', 'Tagline di bawah nama', 'input', 'Kosongkan untuk guna teks lalai.'],
  ['hero_tajuk', 'Tajuk utama (laman awam)', 'input', ''],
  ['hero_teks', 'Teks pengenalan (laman awam)', 'textarea', ''],
  ['footer_teks', 'Teks footer', 'textarea', ''],
  ['emel_hubungan', 'Emel hubungan', 'input', 'Dipaparkan di footer jika diisi.'],
  ['sijil_tajuk', 'Tajuk sijil', 'input', 'Contoh: Sijil Penyertaan atau Sijil Tamat Kursus. Sijil dikeluarkan bila pelajar khatam semua kuliah dalam satu siri.'],
  ['sijil_penandatangan', 'Nama penandatangan sijil', 'input', 'Kosongkan untuk guna nama guru siri (atau nama laman jika tiada guru).'],
  ['sijil_jawatan', 'Jawatan penandatangan', 'input', 'Contoh: Pengerusi, Pengetua. Pilihan.'],
  ['penafian_teks', 'Teks penafian', 'textarea', 'Dipaparkan di bawah rujukan setiap kuliah dan di footer laman awam. Kosongkan untuk guna teks cadangan. Baris baharu dikekalkan. Semak dengan penasihat syariah sebelum lancar.'],
  ['privasi_teks', 'Notis privasi (skrin log masuk)', 'textarea', 'Dipaparkan di bawah butang log masuk Google. Kosongkan untuk guna teks cadangan.'],
  ['warna', 'Warna tema', 'warna', 'Warna utama laman pelajar, panel, artikel dan sijil.'],
  ['hari_sesi', 'Tempoh log masuk (hari)', 'nombor', 'Berapa hari pengguna kekal log masuk sebelum perlu log masuk semula. Lalai 30. Boleh ditetapkan khas untuk pengguna tertentu di halaman Pengguna. Berkuat kuasa pada log masuk seterusnya.'],
  ['papar_peserta', 'Bilangan peserta di laman utama', 'pilih', 'Papar "N peserta berdaftar" di hero. Admin dan guru tidak dikira. Pilih Sembunyi jika bilangan masih kecil.'],
];

async function borangTetapan() {
  const t = await api('GET', 'tetapan');
  app.innerHTML = `
    <p><a href="#/">&larr; Senarai siri</a></p>
    <h1>Tetapan laman</h1>
    <form class="kad" data-borang="tetapan" novalidate>
      <div class="ralat" hidden></div>
      <div class="info" id="tetapan-ok" hidden>Disimpan. Muat semula laman pelajar untuk lihat perubahan.</div>
      ${MEDAN_TETAPAN.map(([k, label, jenis, bantuan]) => `
        <label for="${k}">${label}</label>
        ${jenis === 'pilih'
          ? `<select id="${k}" name="${k}"><option value="ya" ${t.nilai[k] !== 'tidak' ? 'selected' : ''}>Papar</option><option value="tidak" ${t.nilai[k] === 'tidak' ? 'selected' : ''}>Sembunyi</option></select>`
          : jenis === 'warna'
          ? `<div class="pilih-warna" role="radiogroup" aria-label="Warna tema">${Object.entries(BRAND_WARNA).map(([w, kod]) => `<label><input type="radio" name="warna" value="${w}" ${(t.nilai.warna || 'hijau') === w ? 'checked' : ''}><i style="background:${kod}"></i>${{ hijau: 'Hijau zamrud', biru: 'Biru laut', ungu: 'Ungu', marun: 'Marun', arang: 'Arang' }[w]}</label>`).join('')}</div>`
          : jenis === 'nombor'
          ? `<input type="number" id="${k}" name="${k}" min="1" max="365" placeholder="${h(t.lalai[k])}" value="${t.nilai[k] === t.lalai[k] ? '' : h(t.nilai[k])}">`
          : jenis === 'textarea'
          ? `<textarea id="${k}" name="${k}" maxlength="${{ penafian_teks: 800, privasi_teks: 500 }[k] || 300}" rows="${k === 'penafian_teks' ? 8 : k === 'privasi_teks' ? 5 : 3}" placeholder="${h(t.lalai[k])}">${t.nilai[k] === t.lalai[k] ? '' : h(t.nilai[k])}</textarea>`
          : `<input type="text" id="${k}" name="${k}" maxlength="${k === 'hero_tajuk' || k === 'emel_hubungan' ? 120 : k.startsWith('sijil_') && k !== 'sijil_tajuk' ? 80 : 60}" placeholder="${h(t.lalai[k])}" value="${t.nilai[k] === t.lalai[k] ? '' : h(t.nilai[k])}">`}
        ${bantuan ? `<div class="bantuan">${bantuan}</div>` : ''}`).join('')}
      <div class="tindakan"><button type="submit">Simpan</button></div>
    </form>
    <div class="kad" id="kad-logo"></div>
    <div class="kad" id="kad-sandaran" hidden></div>`;
  paparLogo(t.logo);
  paparSandaran();
}

// Sandaran D1 (admin utama sahaja; admin tambahan tidak nampak bahagian ini).
async function paparSandaran(mesej) {
  const kotak = document.getElementById('kad-sandaran');
  if (!kotak) return;
  let senarai;
  try { senarai = await api('GET', 'sandaran'); } catch (e) { if (e.kod === 'r2-belum-sedia') { kotak.hidden = false; kotak.innerHTML = '<h2>Sandaran data</h2><p class="kecil">Storan R2 belum disambungkan.</p>'; } return; }
  const saiz = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
  kotak.hidden = false;
  kotak.innerHTML = `<h2>Sandaran data</h2>
    <p class="kecil">Semua data (pengguna, course, kemajuan, sijil, artikel dan lain-lain) disandarkan setiap hari jam 2:17 pagi ke storan R2. 30 sandaran terbaharu disimpan. Fail video YouTube dan nota PDF tidak termasuk (nota sudah tersimpan dalam R2).</p>
    ${mesej ? `<div class="info">${mesej}</div>` : ''}
    <div class="tindakan" style="margin:12px 0"><button type="button" class="kedua" data-act="buat-sandaran">Sandarkan sekarang</button></div>
    ${senarai.length ? `<ul class="senarai-sandaran">${senarai.map((f) => `<li><span><b>${h(f.nama)}</b> <span class="kecil">${saiz(f.saiz)}</span></span>
      <a class="butang kedua" href="/api/admin/sandaran/${encodeURIComponent(f.nama)}" download>Muat turun</a></li>`).join('')}</ul>` : '<p class="kecil">Belum ada sandaran. Sandaran pertama dibuat malam ini, atau tekan Sandarkan sekarang.</p>'}`;
}

function paparLogo(logo, ralat) {
  document.getElementById('kad-logo').innerHTML = `<h2>Logo</h2>
    <div class="ralat" ${ralat ? '' : 'hidden'}>${h(ralat || '')}</div>
    ${logo ? `<div class="baris" style="margin-bottom:12px"><img src="${h(logo)}" alt="Logo semasa" style="width:64px;height:64px;object-fit:contain;border:1px solid var(--line);border-radius:12px;padding:6px;background:#fff">
      <button type="button" class="bahaya" data-act="buang-logo">Buang logo</button></div>` : '<p class="kecil">Belum ada logo. Ikon lalai digunakan.</p>'}
    <label for="failLogo">Muat naik logo (PNG, JPG atau WEBP, maksimum 500 KB)</label>
    <input type="file" id="failLogo" accept="image/png,image/jpeg,image/webp" data-logo-fail>
    <div class="bantuan">Gambar segi empat sama (contoh 512x512) paling sesuai. Ikon pada skrin utama telefon (PWA) tidak berubah dengan logo ini; hubungi pembangun untuk menukarnya.</div>`;
}

document.addEventListener('change', async (e) => {
  const input = e.target.closest('[data-logo-fail]');
  if (!input || !input.files.length) return;
  const f = input.files[0];
  input.disabled = true;
  try {
    const r = await fetch('/api/admin/tetapan/logo', { method: 'POST', headers: { 'content-type': f.type || 'application/octet-stream' }, body: f });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new RalatApi(d, r.status);
    paparLogo(d.logo);
  } catch (err) {
    if (err.status === 401) return mula();
    paparLogo(null, err.message); document.getElementById('kad-logo').scrollIntoView({ block: 'center' });
  }
});

// ---------- nota PDF ----------

const saizTeks = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

async function segarNota(sid, ralat) {
  const kad = document.getElementById('kad-nota');
  if (!kad) return;
  let senarai = [];
  try { senarai = await api('GET', `subject/${sid}/nota`); } catch (e) { ralat = ralat || e.message; }
  kad.innerHTML = `<h2>Nota PDF</h2>
    <div class="ralat" ${ralat ? '' : 'hidden'}>${h(ralat || '')}</div>
    ${senarai.length ? senarai.map((n) => `<div class="baris antara" style="margin:0 0 8px"><span><b>${h(n.nama)}</b> <span class="kecil">${saizTeks(n.saiz)}</span> ${n.status === 'menunggu' ? lencanaStatus('menunggu') : ''}</span>
      ${ADMIN() || n.status === 'menunggu' ? `<button type="button" class="bahaya" data-act="padam-nota" data-subject="${sid}" data-id="${n.id}">${ADMIN() ? 'Padam' : 'Tarik balik'}</button>` : ''}</div>`).join('') : '<p class="kecil">Belum ada nota.</p>'}
    <label for="failNota">Muat naik nota (PDF, maksimum 20 MB, sehingga 10 nota)</label>
    <input type="file" id="failNota" accept="application/pdf,.pdf" multiple data-nota-fail data-subject="${sid}">
    <div class="bantuan" id="statusNota">${ADMIN() ? '' : 'Nota yang dimuat naik dipaparkan kepada pelajar selepas admin meluluskan. '}Pelajar hanya boleh muat turun jika layak menonton kuliah ini dan sudah log masuk.</div>`;
}

document.addEventListener('change', async (e) => {
  const input = e.target.closest('[data-nota-fail]');
  if (!input || !input.files.length) return;
  const sid = input.dataset.subject, status = document.getElementById('statusNota');
  let ralat = '';
  input.disabled = true;
  for (const f of input.files) {
    status.textContent = `Memuat naik ${f.name}…`;
    try {
      const r = await fetch(`/api/admin/subject/${sid}/nota?nama=${encodeURIComponent(f.name)}`, { method: 'POST', headers: { 'content-type': 'application/pdf' }, body: f });
      if (!r.ok) throw new RalatApi(await r.json().catch(() => ({})), r.status);
    } catch (err) {
      if (err.status === 401) return mula();
      ralat = `${f.name}: ${err.message}`; break;
    }
  }
  segarNota(sid, ralat);
});

// ---------- borang dan tindakan ----------

function tunjukRalatBorang(borang, e) {
  const kotak = borang.querySelector('.ralat');
  kotak.textContent = e.message;
  kotak.hidden = false;
  borang.querySelectorAll('.salah').forEach((x) => x.classList.remove('salah'));
  const medan = e.medan && borang.querySelector(`[name="${e.medan}"]`);
  if (medan) { medan.classList.add('salah'); medan.focus(); }
  else kotak.scrollIntoView({ block: 'center' });
}

const BORANG = {
  async course(b) {
    const d = new FormData(b);
    const urutan = String(d.get('urutan') ?? '').trim();
    const badan = { tajuk: d.get('tajuk'), huraian: d.get('huraian'), golongan: d.get('golongan') || 'awam', kategori_id: d.get('kategori_id') ? Number(d.get('kategori_id')) : null, thumbnail: d.get('thumbnail') };
    if (d.get('status')) badan.status = d.get('status'); // guru: tiada pilihan status bila course sudah terbit
    if (ADMIN()) { badan.urutan = urutan === '' ? null : Number(urutan); badan.guru_emel = d.get('guru_emel') || ''; }
    const id = b.dataset.id;
    const c = id ? await api('PUT', `course/${id}`, badan) : await api('POST', 'course', badan);
    pergi(`#/course/${c.id}`);
  },
  async kod(b) {
    const d = new FormData(b);
    const nom = (x) => { const t = String(d.get(x) ?? '').trim(); return t === '' ? null : Number(t); };
    const badan = { golongan: d.get('golongan'), label: d.get('label'), bulan_akses: Number(d.get('bulan_akses')), had_guna: nom('had_guna'),
      tamat_pada: d.get('tamat_pada') || null, bilangan: nom('bilangan') ?? 1, kod: String(d.get('kod') || '').trim() || undefined };
    const baru = await api('POST', 'kod', badan);
    await halamanKod();
    const kotak = document.getElementById('kodBaru');
    kotak.innerHTML = `<div class="info"><b>${baru.length} kod dicipta.</b> Salin dan edarkan:<textarea readonly style="margin-top:8px;height:${Math.min(240, 40 + baru.length * 22)}px">${h(baru.map((k) => k.kod_papar).join('\n'))}</textarea></div>`;
    kotak.scrollIntoView({ block: 'center' });
  },
  async artikel(b) {
    const d = new FormData(b);
    const badan = { tajuk: d.get('tajuk'), ringkasan: d.get('ringkasan'), meta_description: d.get('meta_description'), gambar: d.get('gambar') || '', gambar_alt: d.get('gambar_alt'), isi: d.get('isi'), status: d.get('status') };
    const slug = String(d.get('slug') || '').trim();
    if (slug && !b.querySelector('#slug').readOnly) badan.slug = slug;
    const n = kiraPerkataan(badan.isi);
    if (badan.status === 'terbit' && n < SASARAN && !confirm(`Artikel ini baru ${n} perkataan (sasaran ${SASARAN}). Terbitkan juga?`)) return;
    const id = b.dataset.id;
    const a = id ? await api('PUT', `artikel/${id}`, badan) : await api('POST', 'artikel', badan);
    if (!id) return pergi(`#/artikel/${a.id}`);
    await borangArtikel(id); // muat semula borang daripada data tersimpan (slug dikunci, pautan pratonton dikemas kini)
    const ok = document.getElementById('artikel-ok'); ok.hidden = false; ok.scrollIntoView({ block: 'center' });
  },
  async admin(b) {
    const d = new FormData(b);
    await api('POST', 'admin', { emel: d.get('emel') });
    halamanGuru();
  },
  async 'urus-laporan'(b) {
    const d = new FormData(b), id = b.dataset.id;
    await api('PUT', `laporan/${id}`, { status: d.get('status'), catatan_admin: d.get('catatan_admin') });
    await laluan();
    const kad = document.querySelector(`[data-borang="urus-laporan"][data-id="${id}"]`);
    if (kad) { kad.insertAdjacentHTML('afterbegin', '<div class="info">Disimpan.</div>'); kad.scrollIntoView({ block: 'center' }); }
  },
  async kategori(b) {
    await api('POST', 'kategori', { nama: new FormData(b).get('nama') });
    await halamanKategori();
  },
  async 'ubah-kategori'(b) {
    const d = new FormData(b), u = String(d.get('urutan') ?? '').trim();
    await api('PUT', `kategori/${b.dataset.id}`, { nama: d.get('nama'), urutan: u === '' ? null : Number(u) });
    await halamanKategori();
    const kad = document.querySelector(`[data-borang="ubah-kategori"][data-id="${b.dataset.id}"]`);
    if (kad) { kad.insertAdjacentHTML('afterbegin', '<div class="info">Disimpan.</div>'); kad.scrollIntoView({ block: 'center' }); }
  },
  async 'profil-guru'(b) {
    const d = new FormData(b);
    await api('PUT', `guru/${encodeURIComponent(b.dataset.emel)}`, { nama: d.get('nama'), kelayakan: d.get('kelayakan'), institusi: d.get('institusi'), bio: d.get('bio'), gambar: d.get('gambar') });
    await halamanGuru();
    const f = document.querySelector(`[data-borang="profil-guru"][data-emel="${CSS.escape(b.dataset.emel)}"]`);
    if (f) { f.hidden = false; f.querySelector('.info').hidden = false; f.scrollIntoView({ block: 'center' }); }
  },
  async 'tapis-pengguna'() { await halamanPengguna(0); },
  async 'urus-pengguna'(b) {
    const d = new FormData(b), id = b.dataset.id;
    await api('PUT', `pengguna/${id}`, { golongan: d.get('golongan'), golongan_tamat: d.get('golongan_tamat') || null, hari_sesi: String(d.get('hari_sesi') || '').trim() || null });
    await halamanPengguna();
    const kad = document.getElementById('pg-' + id); if (kad) { kad.insertAdjacentHTML('afterbegin', '<div class="info">Disimpan.</div>'); kad.scrollIntoView({ block: 'center' }); }
  },
  async guru(b) {
    const d = new FormData(b);
    await api('POST', 'guru', { emel: d.get('emel'), nama: d.get('nama') });
    halamanGuru();
  },
  async tetapan(b) {
    const d = new FormData(b);
    const badan = Object.fromEntries(MEDAN_TETAPAN.map(([k]) => [k, d.get(k) ?? '']));
    await api('PUT', 'tetapan', badan);
    pasangWarna(badan.warna);
    b.querySelector('.ralat').hidden = true;
    b.querySelectorAll('.salah').forEach((x) => x.classList.remove('salah'));
    const ok = document.getElementById('tetapan-ok'); ok.hidden = false; ok.scrollIntoView({ block: 'center' });
  },
  async subject(b) {
    const d = new FormData(b);
    const badan = { tajuk: d.get('tajuk'), huraian: d.get('huraian'), rujukan: d.get('rujukan'), video: d.get('video'), thumbnail: d.get('thumbnail'), pratonton: d.get('pratonton') === 'on' };
    if (d.get('status')) badan.status = d.get('status');
    const { course, id } = b.dataset;
    if (id) await api('PUT', `subject/${id}`, badan); else await api('POST', `course/${course}/subject`, badan);
    pergi(`#/course/${course}`);
  },
};

const TINDAKAN = {
  async 'padam-course'(el) {
    if (!confirm('Padam siri ini? Tindakan ini tidak boleh dibatalkan.')) return;
    await api('DELETE', `course/${el.dataset.id}`);
    pergi('#/');
  },
  'buang-gambar'() {
    document.getElementById('gambar').value = '';
    paparGambarUtama(null);
  },
  async 'padam-artikel'(el) {
    if (!confirm('Padam artikel ini? Tindakan ini tidak boleh dibatalkan.')) return;
    await api('DELETE', `artikel/${el.dataset.id}`);
    pergi('#/artikel');
  },
  async jawab(el) {
    const kad = el.closest('[data-soalan]'), ralat = kad.querySelector('.ralat');
    ralat.hidden = true;
    try { await api('PUT', `soalan/${el.dataset.id}`, { jawapan: kad.querySelector('textarea').value }); }
    catch (e) { if (e.status === 401) return mula(); ralat.textContent = e.message; ralat.hidden = false; return; }
    await laluan();
  },
  async 'aktif-kod'(el) { await api('PUT', `kod/${el.dataset.id}`, { aktif: el.dataset.aktif === '1' }); await laluan(); },
  async 'padam-kod'(el) { if (!confirm('Padam kod ini?')) return; await api('DELETE', `kod/${el.dataset.id}`); await laluan(); },
  async 'salin-kod'(el) { try { await navigator.clipboard.writeText(el.dataset.kod); el.textContent = 'Disalin'; } catch { prompt('Salin kod ini:', el.dataset.kod); } },
  async 'pengguna-kod'(el) {
    const kotak = document.getElementById('kp-' + el.dataset.id);
    if (kotak.innerHTML) { kotak.innerHTML = ''; return; }
    const p = await api('GET', `kod/${el.dataset.id}/pengguna`);
    kotak.innerHTML = `<ul class="kecil" style="margin:8px 0 0;padding-left:18px">${p.map((x) => `<li>${h(x.nama)} (${h(x.emel)}) · ${h(tarikhMy(x.digunakan_pada))}${x.golongan_tamat ? ' · tamat ' + h(tarikhMy(x.golongan_tamat + 'T00:00:00+08:00')) : ''}</li>`).join('')}</ul>`;
  },
  async 'sorok-soalan'(el) { await api('POST', `soalan/${el.dataset.id}/sorok`, { tersembunyi: el.dataset.sorok === '1' }); await laluan(); },
  async 'padam-soalan'(el) {
    if (!confirm('Padam soalan ini? Tindakan ini tidak boleh dibatalkan.')) return;
    await api('DELETE', `soalan/${el.dataset.id}`);
    await laluan();
  },
  async lulus(el) {
    await api('POST', `kelulusan/${el.dataset.jenis}/${el.dataset.id}/lulus`);
    halamanKelulusan();
  },
  async tolak(el) {
    const catatan = prompt('Sebab ditolak (dilihat guru):');
    if (catatan === null) return;
    await api('POST', `kelulusan/${el.dataset.jenis}/${el.dataset.id}/tolak`, { catatan });
    halamanKelulusan();
  },
  async 'buat-sandaran'() {
    const r = await api('POST', 'sandaran');
    await paparSandaran(`Sandaran ${h(r.nama.replace('sandaran/', ''))} dibuat (${Object.values(r.jadual).reduce((a, b) => a + b, 0)} baris).`);
  },
  async 'buang-admin'(el) {
    if (!confirm(`Buang ${el.dataset.emel} sebagai admin? Sesi mereka akan ditamatkan.`)) return;
    await api('DELETE', `admin/${encodeURIComponent(el.dataset.emel)}`);
    halamanGuru();
  },
  'buka-pengguna'(el) { const f = document.getElementById('pf-' + el.dataset.id); f.hidden = !f.hidden; el.textContent = f.hidden ? 'Urus' : 'Tutup'; },
  async 'sekat-pengguna'(el) {
    const sekat = el.dataset.sekat === '1';
    if (sekat && !confirm('Sekat akaun ini? Pengguna dilog keluar dari semua peranti dan tidak boleh log masuk sehingga dinyahsekat.')) return;
    await api('PUT', `pengguna/${el.dataset.id}`, { disekat: sekat });
    await halamanPengguna();
  },
  async 'keluar-pengguna'(el) {
    if (!confirm('Log keluar pengguna ini dari semua peranti?')) return;
    await api('POST', `pengguna/${el.dataset.id}/keluar-semua`);
    el.textContent = 'Sudah dilog keluar';
  },
  'halaman-pengguna'(el) { halamanPengguna(Number(el.dataset.halaman)); },
  async 'eksport-pengguna'(el) {
    const r = await fetch('/api/admin/pengguna/eksport?' + new URLSearchParams(tapisPengguna));
    if (!r.ok) { alert('Eksport gagal.'); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(await r.blob());
    a.download = (r.headers.get('content-disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'pengguna.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  'buka-profil'(el) {
    const f = document.querySelector(`[data-borang="profil-guru"][data-emel="${CSS.escape(el.dataset.emel)}"]`);
    f.hidden = !f.hidden; el.textContent = f.hidden ? 'Profil' : 'Tutup';
  },
  async 'padam-kategori'(el) {
    if (!confirm('Padam kategori ini?')) return;
    await api('DELETE', `kategori/${el.dataset.id}`);
    await halamanKategori();
  },
  async 'buang-guru'(el) {
    if (!confirm(`Buang ${el.dataset.emel} sebagai guru? Siri mereka kekal; guru tidak lagi boleh masuk panel.`)) return;
    await api('DELETE', `guru/${encodeURIComponent(el.dataset.emel)}`);
    halamanGuru();
  },
  async 'buang-logo'() {
    if (!confirm('Buang logo? Ikon lalai akan digunakan semula.')) return;
    const d = await api('DELETE', 'tetapan/logo');
    paparLogo(d.logo);
  },
  async 'padam-nota'(el) {
    if (!confirm('Padam nota ini?')) return;
    try { await api('DELETE', `nota/${el.dataset.id}`); } catch (e) { if (e.status === 401) return mula(); return segarNota(el.dataset.subject, e.message); }
    segarNota(el.dataset.subject);
  },
  async 'padam-subject'(el) {
    if (!confirm('Padam kuliah ini? Kemajuan pelajar dan nota PDF kuliah ini turut dipadam.')) return;
    await api('DELETE', `subject/${el.dataset.id}`);
    pergi(`#/course/${el.dataset.course}`);
  },
  // Tukar kedudukan dengan jiran, kemudian tulis semula urutan 1..n untuk yang berubah sahaja.
  async alih(el) {
    const { course, id } = el.dataset;
    const senarai = (await api('GET', `course/${course}`)).subject;
    const i = senarai.findIndex((s) => String(s.id) === id), j = i + Number(el.dataset.arah);
    if (i < 0 || j < 0 || j >= senarai.length) return;
    [senarai[i], senarai[j]] = [senarai[j], senarai[i]];
    for (const [n, s] of senarai.entries()) if (s.urutan !== n + 1) await api('PUT', `subject/${s.id}`, { urutan: n + 1 });
    butiranCourse(course);
  },
  async keluar() {
    await fetch('/auth/keluar', { method: 'POST' });
    location.reload();
  },
};

app.addEventListener('submit', async (e) => {
  const b = e.target.closest('[data-borang]');
  if (!b) return;
  e.preventDefault();
  const butang = b.querySelector('button[type=submit]');
  butang.disabled = true;
  try { await BORANG[b.dataset.borang](b); } catch (err) { if (err.status === 401) mula(); else tunjukRalatBorang(b, err); } finally { butang.disabled = false; }
});

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || !TINDAKAN[el.dataset.act]) return;
  e.preventDefault();
  el.disabled = true;
  try { await TINDAKAN[el.dataset.act](el); } catch (err) {
    const b = el.closest('[data-borang]');
    if (b && err.status !== 401) tunjukRalatBorang(b, err); else paparRalat(err);
  } finally { el.disabled = false; }
});

// ---------- laluan dan log masuk ----------

async function laluan() {
  const m = (location.hash || '#/').slice(1).split('/').filter(Boolean);
  try {
    if (!m.length) await senaraiCourse();
    else if (m[0] === 'tetapan') await borangTetapan();
    else if (m[0] === 'kelulusan') await halamanKelulusan();
    else if (m[0] === 'kategori') await halamanKategori();
    else if (m[0] === 'laporan') await halamanLaporan(m[1] || 'baru');
    else if (m[0] === 'soalan') await halamanSoalan(m[1] === 'dijawab' ? 'dijawab' : 'menunggu');
    else if (m[0] === 'guru') await halamanGuru();
    else if (m[0] === 'pengguna') await halamanPengguna(0);
    else if (m[0] === 'kod') await halamanKod();
    else if (m[0] === 'artikel' && !m[1]) await senaraiArtikel();
    else if (m[0] === 'artikel' && m[1] === 'baru') await borangArtikel(null);
    else if (m[0] === 'artikel') await borangArtikel(m[1]);
    else if (m[0] === 'course' && m[1] === 'baru') await borangCourse(null);
    else if (m[0] === 'course' && m.length === 2) await butiranCourse(m[1]);
    else if (m[0] === 'course' && m[2] === 'sunting') await borangCourse(m[1]);
    else if (m[0] === 'course' && m[2] === 'subject' && m[3] === 'baru') await borangSubject(m[1], null);
    else if (m[0] === 'course' && m[2] === 'subject' && m[3]) await borangSubject(m[1], m[3]);
    else pergi('#/');
    window.scrollTo(0, 0);
  } catch (e) { paparRalat(e); }
  tandaMenu();
  kemaskiniBilKelulusan();
  kemaskiniBilSoalan();
  kemaskiniBilLaporan();
  // gerakan luncur setiap pertukaran skrin (gaya.css .halaman)
  app.classList.remove('halaman'); void app.offsetWidth; app.classList.add('halaman');
}

async function logMasukGoogle(res) {
  const r = await fetch('/auth/google', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ credential: res.credential }) });
  if (r.ok) { mula(); return; }
  const j = await r.json().catch(() => ({}));
  app.innerHTML = `<div class="ralat">${j.ralat === 'akaun-disekat' ? 'Akaun ini telah disekat. Hubungi admin.' : 'Log masuk gagal. Cuba lagi.'}</div>`;
}

let dengarLaluan = false;

const BRAND_WARNA = { hijau: '#0B6B4F', biru: '#1D4ED8', ungu: '#6D28D9', marun: '#8B1E3F', arang: '#1F2937' };
function pasangWarna(w) {
  const warna = BRAND_WARNA[w] ? w : 'hijau';
  if (warna === 'hijau') document.documentElement.removeAttribute('data-warna'); else document.documentElement.setAttribute('data-warna', warna);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', BRAND_WARNA[warna]);
  try { localStorage.setItem('kh-warna', warna); } catch { /* storan disekat */ }
}

// Ciri yang boleh dihidupkan/disembunyikan dari Tetapan laman (sembunyi jika tidak dinyatakan).
let KOD_AKTIF = false;
async function muatCiri() {
  try { const k = await (await fetch('/api/konfig')).json(); KOD_AKTIF = k.laman?.kod_aktif === 'ya'; } catch { KOD_AKTIF = false; }
}
async function mula() {
  fetch('/api/konfig').then((r) => r.json()).then((k) => {
    pasangWarna(k.laman?.warna);
    if (k.laman?.nama) { document.getElementById('namaLaman').textContent = k.laman.nama; document.title = 'Panel · ' + k.laman.nama; }
  }).catch(() => {});
  const saya = await fetch('/api/saya');
  if (saya.ok) {
    const d = await saya.json();
    PERANAN = d.pengguna.peranan;
    kotakPengguna.innerHTML = `<span class="role-chip" title="${h(d.pengguna.emel)}">${IKON.orang}<span class="rc-text"><small>${PERANAN === 'admin' ? 'Admin' : PERANAN === 'guru' ? 'Guru' : 'Pelajar'}</small><b>${h(d.pengguna.nama || d.pengguna.emel)}</b></span></span>
      <button class="kedua pil ikon-keluar" data-act="keluar" aria-label="Log keluar" title="Log keluar">${IKON.keluar}</button>`;
    if (PERANAN === 'admin' || PERANAN === 'guru') { await muatCiri(); binaMenu(); }
    if (PERANAN !== 'admin' && PERANAN !== 'guru') {
      app.innerHTML = `<div class="kad"><h1>Tiada akses</h1><p>Akaun <b>${h(d.pengguna.emel)}</b> bukan admin atau guru. Hubungi pemilik jika ini satu kesilapan.</p><p><a href="/">Ke laman utama</a></p></div>`;
      return;
    }
    if (!dengarLaluan) { window.addEventListener('hashchange', laluan); dengarLaluan = true; }
    return laluan();
  }
  kotakPengguna.innerHTML = '';
  menuPanel.hidden = true;
  const k = await (await fetch('/api/konfig')).json();
  app.innerHTML = '<div class="kad"><h1>Panel admin</h1><p>Log masuk dengan akaun Google admin.</p><div id="google"></div></div>';
  if (!k.googleClientId) { app.querySelector('p').textContent = 'GOOGLE_CLIENT_ID belum ditetapkan.'; return; }
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.onload = () => {
    google.accounts.id.initialize({ client_id: k.googleClientId, callback: logMasukGoogle });
    google.accounts.id.renderButton(document.getElementById('google'), { theme: 'outline', size: 'large', text: 'signin_with' });
  };
  document.head.appendChild(s);
}

mula();
