// Ujian hujung ke hujung ubah suai niche (Fasa 2) dalam Chromium 390px terhadap Worker tempatan:
// kategori (F-12), rujukan dan teks Arab (F-13), profil guru (F-14), penafian dan privasi (F-15).
// Jalankan: npm run test:e2e. SKRIN_DIR=<folder> menyimpan tangkapan skrin untuk disemak.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { mulaWorker, sha256, tokenRawak } from './e2e-sedia.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');

const SKRIN = process.env.SKRIN_DIR;
const ADMIN = 'admin-niche@contoh.my', GURU = 'guru-niche@contoh.my', PELAJAR = 'pelajar-niche@contoh.my';
const token = { admin: tokenRawak(), guru: tokenRawak(), pelajar: tokenRawak() };
const masa = new Date().toISOString(), tamat = new Date(Date.now() + 864e5).toISOString();
const V = { s1: 'aaaaaaaaaaa', s2: 'bbbbbbbbbbb', c2: 'ccccccccccc', c3: 'ddddddddddd' };

const { B, henti } = await mulaWorker({
  port: 8793,
  vars: { ADMIN_EMELS: ADMIN },
  semaiSql: `INSERT INTO pengguna (emel, nama, peranan, dicipta_pada, golongan) VALUES ('${ADMIN}', 'Admin Niche', 'pelajar', '${masa}', 'awam'), ('${GURU}', 'Guru Niche', 'pelajar', '${masa}', 'awam'), ('${PELAJAR}', 'Pelajar Niche', 'pelajar', '${masa}', 'awam');
    INSERT INTO sesi (token_hash, pengguna_id, tamat_pada) VALUES ('${sha256(token.admin)}', 1, '${tamat}'), ('${sha256(token.guru)}', 2, '${tamat}'), ('${sha256(token.pelajar)}', 3, '${tamat}');`,
});

const YT_TIRUAN = `
  window.__pemain = [];
  window.YT = { PlayerState: { ENDED: 0, PLAYING: 1 }, Player: function (id, o) {
    const el = document.getElementById(id); el.setAttribute('data-video', o.videoId); el.textContent = 'VIDEO ' + o.videoId;
    window.__pemain.push(o); this.destroy = () => {}; } };
  setTimeout(() => window.onYouTubeIframeAPIReady(), 0);`;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

const pelayar = await chromium.launch();
const ralatHalaman = [], amaran = [];
let lulus = 0;
const langkah = async (nama, fn) => { await fn(); lulus++; console.log('ok', lulus, '-', nama); };

async function konteks(tokenSesi) {
  const ctx = await pelayar.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  if (tokenSesi) await ctx.addCookies([{ name: 'kh_sesi', value: tokenSesi, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
  await ctx.route('**/*', (r) => {
    const u = r.request().url();
    if (u.startsWith(B)) return r.continue();
    if (u === 'https://www.youtube.com/iframe_api') return r.fulfill({ contentType: 'text/javascript', body: YT_TIRUAN });
    if (u.startsWith('https://i.ytimg.com/')) return r.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    return r.abort();
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10_000);
  page.on('pageerror', (e) => ralatHalaman.push(e.message));
  page.on('dialog', (d) => { if (d.type() === 'confirm') d.accept(); else { amaran.push(d.message()); d.dismiss(); } });
  return { ctx, page };
}
const skrin = async (page, nama) => { if (SKRIN) { mkdirSync(SKRIN, { recursive: true }); await page.screenshot({ path: `${SKRIN}/${nama}.png`, fullPage: true }); } };
// Tiada skrol mendatar pada 390px dan tiada elemen kandungan melebihi lebar skrin.
const tiadaSkrolMendatar = async (page) => {
  await page.waitForTimeout(900); // animasi masuk halaman (.halaman meluncur) mesti selesai sebelum mengukur
  const r = await page.evaluate(() => ({ lebar: document.documentElement.scrollWidth, tetingkap: window.innerWidth,
    lebih: [...document.querySelectorAll('.rujukan-blok, .rujukan-blok *, .kad-guru, .kad-guru *, .penafian, .penafian *, .penapis-kat, .penapis-kat *, .foot-penafian, .foot-penafian *, .foot-penafian-gelap, .foot-penafian-gelap *, .nota-privasi, .nota-penafian, .lencana-kat')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(e).position !== 'fixed').map((e) => e.tagName + '.' + e.className).slice(0, 5) }));
  assert.ok(r.lebar <= r.tetingkap, `skrol mendatar: ${r.lebar} > ${r.tetingkap}`);
  assert.deepEqual(r.lebih, [], 'elemen melebihi skrin');
};

const RUJUKAN = [
  '1. Al-Milal wa al-Nihal, al-Shahrastani, j. 1, m/s 20',
  'قال الله تعالى: ﴿إِنَّ الدِّينَ عِندَ اللَّهِ الْإِسْلَامُ﴾ (آل عمران: 19)',
  'Hadis riwayat al-Bukhari: «إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ» no. 1 dalam Sahih al-Bukhari bab permulaan wahyu',
  '<script>window.__xss = 1</script>',
  '<img src=x onerror="window.__xss = 2">',
].join('\n');

try {
  // ---- kandungan melalui API admin ----
  const { ctx: ctxAdmin } = await konteks(token.admin);
  const api = async (kaedah, laluan, data) => { const r = await ctxAdmin.request[kaedah](B + '/api/admin/' + laluan, data === undefined ? {} : { data }); assert.ok(r.ok(), `${kaedah} ${laluan} ${r.status()}`); return r.json(); };
  const kat = Object.fromEntries((await api('get', 'kategori')).map((k) => [k.slug, k.id]));
  assert.equal(Object.keys(kat).length, 5, 'kategori awal disemai');
  await api('post', 'guru', { emel: GURU, nama: 'Ustaz Niche', kelayakan: 'Sarjana Usuluddin; Tauliah mengajar JAIS', institusi: 'Institut Ilmu Harmoni', bio: 'Mengajar akidah dan sejarah firqah sejak 2010.\nBaris kedua <b>bio</b>.' });
  const c1 = await api('post', 'course', { tajuk: 'Mengenali Aliran Asyairah', huraian: 'Pengenalan sejarah dan pegangan.', status: 'terbit', kategori_id: kat['akidah-aliran'], guru_emel: GURU });
  const s1 = await api('post', `course/${c1.id}/subject`, { tajuk: 'Pengenalan Aliran', video: V.s1, status: 'terbit', pratonton: true, rujukan: RUJUKAN });
  const s2 = await api('post', `course/${c1.id}/subject`, { tajuk: 'Bab Tertutup', video: V.s2, status: 'terbit', rujukan: 'Rujukan rahsia tertutup' });
  const c2 = await api('post', 'course', { tajuk: 'Sejarah Awal Firqah', status: 'terbit', kategori_id: kat['sejarah-firqah'] });
  await api('post', `course/${c2.id}/subject`, { tajuk: 'Peristiwa Fitnah', video: V.c2, status: 'terbit', pratonton: true });
  const c3 = await api('post', 'course', { tajuk: 'Siri Tanpa Kategori', status: 'terbit' });
  await api('post', `course/${c3.id}/subject`, { tajuk: 'Kuliah Umum', video: V.c3, status: 'terbit', pratonton: true });
  await ctxAdmin.close();

  const pelawat = await konteks(null);

  await langkah('pelawat: laman utama ada penapis kategori; hanya kategori yang ada siri terbit; menapis memaparkan siri kategori itu sahaja', async () => {
    const p = pelawat.page;
    await p.goto(B + '/');
    await p.locator('#gridCourse a.course').first().waitFor();
    assert.equal(await p.locator('#gridCourse a.course').count(), 3);
    assert.deepEqual(await p.locator('.penapis-kat .cip').allTextContents(), ['Semua', 'Sejarah Firqah & Mazhab', 'Akidah & Aliran Pemikiran']);
    await p.locator('.cip', { hasText: 'Akidah & Aliran Pemikiran' }).click();
    assert.deepEqual(await p.locator('#gridCourse a.course h3').allTextContents(), ['Mengenali Aliran Asyairah']);
    assert.equal(await p.locator('.cip[aria-pressed=true]').textContent(), 'Akidah & Aliran Pemikiran');
    await p.locator('.cip', { hasText: 'Sejarah Firqah' }).click();
    assert.deepEqual(await p.locator('#gridCourse a.course h3').allTextContents(), ['Sejarah Awal Firqah']);
    await p.locator('.cip', { hasText: 'Semua' }).click();
    assert.equal(await p.locator('#gridCourse a.course').count(), 3);
    await p.locator('.course', { hasText: 'Mengenali Aliran Asyairah' }).locator('.lencana-kat', { hasText: 'Akidah & Aliran Pemikiran' }).waitFor();
    assert.equal(await p.locator('.course', { hasText: 'Siri Tanpa Kategori' }).locator('.lencana-kat').count(), 0);
    await tiadaSkrolMendatar(p);
    await skrin(p, 'n01-laman-utama-kategori');
  });

  await langkah('pelawat: penafian nampak di footer laman utama', async () => {
    const p = pelawat.page;
    await p.locator('.foot-penafian-gelap').getByText('tidak menghukum individu').waitFor();
    await p.locator('.foot-penafian-gelap').scrollIntoViewIfNeeded();
    await skrin(p, 'n02-footer-penafian');
  });

  await langkah('halaman siri: kad pengajar memaparkan nama, kelayakan, institusi, bio; emel tidak dipaparkan; HTML kekal teks', async () => {
    const p = pelawat.page;
    await p.goto(B + '/#/course/mengenali-aliran-asyairah');
    const kad = p.locator('.kad-guru');
    await kad.waitFor();
    await kad.getByRole('heading', { name: 'Ustaz Niche' }).waitFor();
    await kad.getByText('Sarjana Usuluddin; Tauliah mengajar JAIS').waitFor();
    await kad.getByText('Institut Ilmu Harmoni').waitFor();
    await kad.getByText('Baris kedua <b>bio</b>.').waitFor(); // dipaparkan sebagai teks
    assert.equal(await kad.locator('b').count(), 0);
    assert.ok(!(await p.content()).includes(GURU), 'emel guru bocor dalam halaman');
    await tiadaSkrolMendatar(p);
    await skrin(p, 'n03-kad-guru');
  });

  await langkah('kuliah terbuka: rujukan bernombor di bawah video, Arab kanan-ke-kiri, campuran BM/Arab tidak terbalik, tiada skrol mendatar pada 390px', async () => {
    const p = pelawat.page;
    await p.goto(B + `/#/subject/${s1.id}`);
    await p.locator('#pemain[data-video]').waitFor();
    const blok = p.locator('.rujukan-blok');
    await blok.waitFor();
    await blok.getByRole('heading', { name: 'Rujukan' }).waitFor();
    assert.equal(await blok.locator('ol > li').count(), 5);
    // nombor dalam teks dibuang supaya tidak berganda dengan penomboran senarai
    assert.ok((await blok.locator('li').first().textContent()).startsWith('Al-Milal'));
    // Arah sebenar diukur daripada kedudukan teks: baris Arab penuh rata kanan, baris BM dan campuran bermula BM rata kiri.
    const ukurRata = await blok.locator('li').evaluateAll((els) => els.map((li) => {
      const k = li.getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(li);
      const kotak = [...r.getClientRects()];
      return { jarakKiri: Math.min(...kotak.map((x) => x.left)) - k.left, jarakKanan: k.right - Math.max(...kotak.map((x) => x.right)) };
    }));
    assert.ok(ukurRata[0].jarakKiri < 3, 'baris BM mesti rata kiri');
    assert.ok(ukurRata[1].jarakKanan < 3, 'baris Arab mesti rata kanan (kanan ke kiri)');
    assert.ok(ukurRata[2].jarakKiri < 3, 'baris campuran bermula BM kekal kiri ke kanan');
    assert.equal(await blok.locator('li').nth(2).locator('bdi.arab').count(), 1);
    assert.equal(await blok.locator('li').nth(1).locator('bdi.arab').count(), 1);
    // urutan visual baris campuran: teks BM sebelum petikan Arab, "no. 1" selepasnya (tidak terbalik)
    const kotak = await blok.locator('li').nth(2).evaluate((li) => {
      const ar = li.querySelector('bdi.arab').getBoundingClientRect(), lr = li.getBoundingClientRect();
      const julat = document.createRange(); julat.selectNodeContents(li);
      return { arRight: ar.right, arLeft: ar.left, liLeft: lr.left, liRight: lr.right, teks: li.textContent };
    });
    assert.ok(kotak.teks.indexOf('Hadis riwayat al-Bukhari:') < kotak.teks.indexOf('إِنَّمَا'));
    assert.ok(kotak.arLeft >= kotak.liLeft - 1 && kotak.arRight <= kotak.liRight + 1, 'petikan Arab terkeluar daripada baris');
    // baris Arab penuh rata kanan, tidak terpotong
    const ar = await blok.locator('li').nth(1).evaluate((li) => { const b = li.getBoundingClientRect(); const r = document.createRange(); r.selectNodeContents(li); const t = r.getBoundingClientRect(); return { liRight: b.right, teksRight: t.right, teksLeft: t.left, liLeft: b.left, lebarTetingkap: window.innerWidth }; });
    assert.ok(ar.teksRight <= ar.liRight + 1 && ar.teksLeft >= ar.liLeft - 1, 'teks Arab terpotong');
    assert.ok(ar.liRight <= ar.lebarTetingkap);
    assert.ok(await blok.locator('li').nth(1).locator('bdi.arab').evaluate((e) => /Naskh|Amiri|Traditional|Geeza|Scheherazade|Times|serif/i.test(getComputedStyle(e).fontFamily)));
    await tiadaSkrolMendatar(p);
    await skrin(p, 'n04-rujukan-arab-390');
  });

  await langkah('XSS: <script> dan <img onerror> dalam rujukan dipapar sebagai teks, tidak dijalankan', async () => {
    const p = pelawat.page;
    const blok = p.locator('.rujukan-blok');
    await blok.getByText('<script>window.__xss = 1</script>').waitFor();
    await blok.getByText('<img src=x onerror="window.__xss = 2">').waitFor();
    assert.equal(await blok.locator('script, img').count(), 0);
    assert.equal(await p.evaluate(() => window.__xss), undefined);
    assert.deepEqual(amaran, []);
  });

  await langkah('kuliah terbuka: blok penafian di bawah rujukan dan footer semua skrin awam', async () => {
    const p = pelawat.page;
    const susunan = await p.evaluate(() => { const r = document.querySelector('.rujukan-blok').getBoundingClientRect().bottom, n = document.querySelector('.penafian').getBoundingClientRect().top; return { r, n }; });
    assert.ok(susunan.n >= susunan.r - 1, 'penafian mesti di bawah rujukan');
    await p.locator('.penafian').getByText('tidak menghukum individu').waitFor();
    await p.locator('.foot-penafian').getByText('tidak menghukum individu').waitFor();
    assert.equal(await p.locator('.penafian [role]').count(), 0);
    await skrin(p, 'n05-penafian-kuliah');
  });

  await langkah('kuliah tidak terbuka: pelawat tiada video_id dan tiada rujukan; penafian tetap nampak', async () => {
    const p = pelawat.page;
    await p.goto(B + `/#/subject/${s2.id}`);
    await p.getByRole('heading', { name: 'Log masuk untuk menonton' }).waitFor();
    const html = await p.content();
    assert.ok(!html.includes(V.s2) && !html.includes('Rujukan rahsia tertutup'), 'bocor');
    assert.equal(await p.locator('.rujukan-blok').count(), 0);
    await p.locator('.penafian').waitFor();
    const mentah = await (await p.request.get(B + `/api/subject/${s2.id}`)).text();
    assert.ok(!mentah.includes(V.s2) && !mentah.includes('rahsia'), 'API bocor');
  });

  await langkah('skrin log masuk: notis privasi dan penafian ringkas di bawah butang', async () => {
    const p = pelawat.page;
    await p.goto(B + '/#/masuk');
    await p.locator('.nota-privasi').getByText('Hanya admin boleh melihat emel anda').waitFor();
    await p.locator('.nota-penafian').getByText('Kuliah di laman ini menerangkan pelbagai fahaman').waitFor();
    await tiadaSkrolMendatar(p);
    await skrin(p, 'n06-log-masuk-privasi');
  });

  // ---- panel admin ----
  const adm = await konteks(token.admin);
  const ap = adm.page;

  await langkah('panel: tab Kategori: senarai awal, tambah, ubah nama dan urutan; kategori yang dipakai tidak boleh dipadam', async () => {
    await ap.goto(B + '/panel/');
    await ap.getByRole('link', { name: 'Kategori' }).click();
    await ap.locator('h1', { hasText: 'Kategori' }).waitFor();
    assert.equal(await ap.locator('[data-borang=ubah-kategori]').count(), 5);
    await ap.locator('#nama-kat').fill('Kategori Ujian');
    await ap.getByRole('button', { name: 'Tambah kategori' }).click();
    const kad = ap.locator('[data-borang=ubah-kategori]', { hasText: 'Kategori Ujian' });
    await kad.waitFor();
    await kad.locator('input[name=nama]').fill('Kategori Ujian Baharu');
    await kad.getByRole('button', { name: 'Simpan' }).click();
    await ap.locator('[data-borang=ubah-kategori]', { hasText: 'Kategori Ujian Baharu' }).getByText('Disimpan').waitFor();
    const dipakai = ap.locator('[data-borang=ubah-kategori]', { hasText: 'Akidah & Aliran Pemikiran' }).getByRole('button', { name: 'Padam' });
    assert.ok(await dipakai.isDisabled(), 'kategori yang dipakai siri tidak boleh dipadam');
    await skrin(ap, 'n07-panel-kategori');
    await ap.locator('[data-borang=ubah-kategori]', { hasText: 'Kategori Ujian Baharu' }).getByRole('button', { name: 'Padam' }).click();
    await ap.waitForFunction(() => ![...document.querySelectorAll('[data-borang=ubah-kategori] b')].some((b) => b.textContent === 'Kategori Ujian Baharu'));
    assert.equal(await ap.locator('[data-borang=ubah-kategori]').count(), 5);
  });

  await langkah('panel: tetapkan kategori pada siri; penapis awam menunjukkan siri itu di bawah kategori baharu', async () => {
    await ap.goto(B + `/panel/#/course/${c3.id}/sunting`);
    await ap.locator('#kategori_id').selectOption({ label: 'Ideologi & Pemikiran Moden' });
    await skrin(ap, 'n08-panel-borang-siri');
    await ap.getByRole('button', { name: 'Simpan' }).click();
    await ap.locator('.lencana.kat', { hasText: 'Ideologi' }).waitFor().catch(() => {}); // lencana ada pada senarai siri
    await ap.goto(B + '/panel/#/');
    await ap.locator('.kad', { hasText: 'Siri Tanpa Kategori' }).locator('.lencana.kat', { hasText: 'Ideologi & Pemikiran Moden' }).waitFor();
    const p = pelawat.page;
    await p.goto(B + '/');
    await p.locator('.cip', { hasText: 'Ideologi & Pemikiran Moden' }).click();
    assert.deepEqual(await p.locator('#gridCourse a.course h3').allTextContents(), ['Siri Tanpa Kategori']);
  });

  await langkah('panel: kuliah baharu lalai "tonton tanpa log masuk" ditanda; medan rujukan menyimpan teks Arab; guru tidak kehilangan data', async () => {
    await ap.goto(B + `/panel/#/course/${c3.id}/subject/baru`);
    await ap.locator('#tajuk').fill('Kuliah Baharu Rujukan');
    assert.ok(await ap.locator('input[name=pratonton]').isChecked(), 'lalai mesti ditanda');
    await ap.locator('#video').fill('https://youtu.be/eeeeeeeeeee');
    const teks = '1. Kitab Ujian, j. 2\nقال تعالى: ﴿وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ﴾';
    await ap.locator('#rujukan').fill(teks);
    assert.equal(await ap.locator('#rujukan').getAttribute('dir'), 'auto');
    await skrin(ap, 'n09-panel-borang-kuliah');
    await ap.locator('label', { hasText: 'Terbit' }).first().click();
    await ap.getByRole('button', { name: 'Simpan' }).click();
    await ap.locator('.subject', { hasText: 'Kuliah Baharu Rujukan' }).getByRole('link', { name: 'Sunting' }).click();
    assert.equal(await ap.locator('#rujukan').inputValue(), teks);
    // paparan awam untuk kuliah itu
    const senarai = await (await ap.request.get(B + `/api/admin/course/${c3.id}`)).json();
    const baru = senarai.subject.find((s) => s.tajuk === 'Kuliah Baharu Rujukan');
    const p = pelawat.page;
    await p.goto(B + `/#/subject/${baru.id}`);
    await p.locator('.rujukan-blok li').nth(1).locator('bdi.arab').waitFor();
    assert.equal(await p.locator('.rujukan-blok li').count(), 2);
    await tiadaSkrolMendatar(p);
  });

  await langkah('panel Pasukan: admin mengisi kelayakan, institusi, bio guru; profil dipapar pada halaman siri', async () => {
    await ap.goto(B + '/panel/#/guru');
    const kad = ap.locator('.kad', { hasText: 'Ustaz Niche' }).filter({ has: ap.locator('[data-borang=profil-guru]') });
    await kad.waitFor();
    await kad.getByRole('button', { name: 'Profil' }).click();
    const f = kad.locator('[data-borang=profil-guru]');
    await f.locator('input[name=kelayakan]').fill('Doktor Falsafah Akidah; Tauliah JAIS 2025');
    await f.locator('input[name=institusi]').fill('Universiti Ilmu');
    await f.getByRole('button', { name: 'Simpan profil' }).click();
    await ap.locator('.kad', { hasText: 'Doktor Falsafah Akidah; Tauliah JAIS 2025' }).waitFor();
    await skrin(ap, 'n10-panel-pasukan-profil');
    const p = pelawat.page;
    await p.goto(B + '/#/course/mengenali-aliran-asyairah');
    await p.locator('.kad-guru').getByText('Doktor Falsafah Akidah; Tauliah JAIS 2025').waitFor();
    await p.locator('.kad-guru').getByText('Universiti Ilmu').waitFor();
  });

  await langkah('panel Tetapan: admin menukar penafian dan privasi tanpa kod; muncul di laman awam dan skrin log masuk', async () => {
    await ap.goto(B + '/panel/#/tetapan');
    await ap.locator('#penafian_teks').fill('Penafian ujian baharu.\nBaris kedua penafian.');
    await ap.locator('#privasi_teks').fill('Notis privasi ujian baharu.');
    await skrin(ap, 'n11-panel-tetapan-penafian');
    await ap.getByRole('button', { name: 'Simpan' }).click();
    await ap.locator('#tetapan-ok').waitFor();
    const p = pelawat.page;
    await p.goto(B + `/#/subject/${s1.id}`);
    await p.reload(); // pelawat baharu memuat tetapan terkini (navigasi hash sahaja tidak memuat semula konfigurasi)
    await p.locator('.penafian').getByText('Penafian ujian baharu.').waitFor();
    await p.locator('.foot-penafian').getByText('Baris kedua penafian.').waitFor();
    await p.goto(B + '/#/masuk');
    await p.reload();
    await p.locator('.nota-privasi').getByText('Notis privasi ujian baharu.').waitFor();
  });

  await langkah('guru: tiada menu Kategori/Pasukan; boleh pilih kategori pada siri; server menolak ubah profil sendiri (403)', async () => {
    const g = await konteks(token.guru);
    const gp = g.page;
    await gp.goto(B + '/panel/');
    await gp.locator('h1', { hasText: 'Siri saya' }).waitFor();
    assert.equal(await gp.getByRole('link', { name: 'Kategori' }).count(), 0);
    assert.equal(await gp.getByRole('link', { name: 'Pasukan' }).count(), 0);
    await gp.getByRole('link', { name: 'Tambah siri' }).click();
    await gp.locator('#kategori_id').waitFor();
    assert.ok((await gp.locator('#kategori_id option').allTextContents()).includes('Akidah & Aliran Pemikiran'));
    assert.equal((await gp.request.put(B + '/api/admin/guru/' + encodeURIComponent(GURU), { data: { kelayakan: 'Profesor Agung' } })).status(), 403);
    assert.equal((await gp.request.post(B + '/api/admin/kategori', { data: { nama: 'Cuba' } })).status(), 403);
    await skrin(gp, 'n12-panel-guru-borang-siri');
    await g.ctx.close();
  });

  await langkah('ahli berdaftar: lihat rujukan kuliah tertutup; tiada ralat JavaScript', async () => {
    const a = await konteks(token.pelajar);
    await a.page.goto(B + `/#/subject/${s2.id}`);
    await a.page.locator('.rujukan-blok').getByText('Rujukan rahsia tertutup').waitFor();
    await a.page.goto(B + '/#/kuliah');
    await a.page.locator('.cip', { hasText: 'Akidah & Aliran Pemikiran' }).click();
    assert.deepEqual(await a.page.locator('#senaraiSiri .mycourse b').allTextContents(), ['Mengenali Aliran Asyairah']);
    await tiadaSkrolMendatar(a.page);
    await skrin(a.page, 'n13-ahli-senarai-siri-kategori');
    await a.ctx.close();
    assert.deepEqual(ralatHalaman, []);
    assert.deepEqual(amaran, []);
  });

  console.log(`\n# lulus ${lulus}`);
} catch (e) {
  console.error('GAGAL selepas', lulus, 'langkah:', e.message);
  process.exitCode = 1;
} finally {
  await pelayar.close();
  henti();
}
