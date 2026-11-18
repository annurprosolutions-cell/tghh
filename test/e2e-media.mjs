// Ujian hujung ke hujung video Google Drive, thumbnail siri/kuliah dan gambar guru (Chromium 390px, Worker tempatan).
// Semua permintaan luar disekat; thumbnail Google Drive, gambar YouTube dan pemain Drive diganti tiruan.
// Jalankan: npm run test:e2e. SKRIN_DIR=<folder> menyimpan tangkapan skrin.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { mulaWorker, sha256, tokenRawak } from './e2e-sedia.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');

const SKRIN = process.env.SKRIN_DIR;
const ADMIN = 'admin-med@contoh.my', PELAJAR = 'pelajar-med@contoh.my';
const token = { admin: tokenRawak(), pelajar: tokenRawak(), guru: tokenRawak() };
const masa = new Date().toISOString(), tamat = new Date(Date.now() + 864e5).toISOString();

const DR_VIDEO = '1FEln2yyKXbFFydEghgIyUoW9ygWaRwxO';          // video Drive (pratonton)
const DR_TUTUP = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';          // video Drive tertutup
const IMG_SIRI = '1ZyXwVuTsRqPoNmLkJiHgFeDcBa987654';          // thumbnail siri
const IMG_KULIAH = '1QwErTyUiOpAsDfGhJkLzXcVbNm0123456';       // thumbnail kuliah tertutup
const IMG_GURU = '1MnBvCxZlKjHgFdSaPoIuYtReWq9876543';         // gambar guru
const IMG_ROSAK = '1RoSaKrOsAkRoSaKrOsAkRoSaK12345678';        // gambar yang gagal dimuatkan
const YT_PRATONTON = 'dQw4w9WgXcQ', YT_TUTUP = 'eeeeeeeeeee';

const { B, henti } = await mulaWorker({
  port: 8796,
  vars: { ADMIN_EMELS: ADMIN },
  semaiSql: `INSERT INTO pengguna (emel, nama, peranan, dicipta_pada, golongan) VALUES ('${ADMIN}', 'Admin Med', 'pelajar', '${masa}', 'awam'), ('${PELAJAR}', 'Pelajar Med', 'pelajar', '${masa}', 'awam'), ('guru-med@contoh.my', 'Ustaz Gambar', 'pelajar', '${masa}', 'awam');
    INSERT INTO sesi (token_hash, pengguna_id, tamat_pada) VALUES ('${sha256(token.admin)}', 1, '${tamat}'), ('${sha256(token.pelajar)}', 2, '${tamat}'), ('${sha256(token.guru)}', 3, '${tamat}');`,
});

const YT_TIRUAN = `
  window.__pemain = [];
  window.YT = { PlayerState: { ENDED: 0, PLAYING: 1 }, Player: function (id, o) {
    const el = document.getElementById(id); el.setAttribute('data-video', o.videoId); el.textContent = 'VIDEO ' + o.videoId;
    window.__pemain.push(o); this.destroy = () => {}; } };
  setTimeout(() => window.onYouTubeIframeAPIReady(), 0);`;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

const pelayar = await chromium.launch();
const ralatHalaman = [];
const permintaan = []; // semua URL luar yang diminta pelayar
let lulus = 0;
const langkah = async (nama, fn) => { await fn(); lulus++; console.log('ok', lulus, '-', nama); };
const skrin = async (page, nama) => { if (SKRIN) { mkdirSync(SKRIN, { recursive: true }); await page.screenshot({ path: `${SKRIN}/${nama}.png` }); } };

async function konteks(tokenSesi) {
  const ctx = await pelayar.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  if (tokenSesi) await ctx.addCookies([{ name: 'kh_sesi', value: tokenSesi, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
  await ctx.route('**/*', async (r) => {
    const u = r.request().url();
    // /api/gambar/...: semak pengalihan Worker (status dan lokasi) lalu hidang gambar tiruan; hop 302 ke luar tidak dipintas oleh Playwright.
    if (u.startsWith(B + '/api/gambar/')) {
      const resp = await r.fetch({ maxRedirects: 0 });
      if (resp.status() === 302) { permintaan.push(resp.headers().location); return r.fulfill({ status: 200, contentType: 'image/png', body: PNG }); }
      return r.fulfill({ response: resp });
    }
    if (u.startsWith(B)) return r.continue();
    permintaan.push(u);
    if (u === 'https://www.youtube.com/iframe_api') return r.fulfill({ contentType: 'text/javascript', body: YT_TIRUAN });
    if (u.startsWith('https://i.ytimg.com/')) return r.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    if (u.startsWith('https://drive.google.com/thumbnail')) return u.includes(IMG_ROSAK) ? r.fulfill({ status: 404, body: 'x' }) : r.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    if (/^https:\/\/drive\.google\.com\/file\/d\/[^/]+\/preview/.test(u)) return r.fulfill({ contentType: 'text/html', body: '<html><body style="margin:0;background:#000;color:#fff">PEMAIN DRIVE TIRUAN</body></html>' });
    return r.abort();
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10_000);
  page.on('pageerror', (e) => ralatHalaman.push(e.message));
  page.on('dialog', (d) => d.accept());
  return { ctx, page };
}
const pautanDrive = (id) => `https://drive.google.com/file/d/${id}/view?usp=drive_link`;
const imgMuat = (page, pemilih) => page.locator(pemilih).evaluate((i) => i.complete && i.naturalWidth > 0);
const tiadaSkrolMendatar = async (page) => {
  await page.waitForTimeout(900);
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'skrol mendatar');
};

try {
  const { ctx: ctxAdmin } = await konteks(token.admin);
  const api = async (kaedah, laluan, data) => { const r = await ctxAdmin.request[kaedah](B + '/api/admin/' + laluan, data === undefined ? {} : { data }); assert.ok(r.ok(), `${kaedah} ${laluan} ${r.status()} ${await r.text()}`); return r.json(); };
  await api('post', 'guru', { emel: 'guru-med@contoh.my', nama: 'Ustaz Gambar', kelayakan: 'Sarjana', institusi: 'Institut', gambar: pautanDrive(IMG_GURU) });
  // Siri A: thumbnail pilihan, video Drive terbuka dan kuliah tertutup berthumbnail pilihan
  const a = await api('post', 'course', { tajuk: 'Siri A Drive', status: 'terbit', thumbnail: pautanDrive(IMG_SIRI), guru_emel: 'guru-med@contoh.my', huraian: 'Siri contoh dengan video Drive.' });
  const aS1 = await api('post', `course/${a.id}/subject`, { tajuk: 'Kuliah Drive Terbuka', video: pautanDrive(DR_VIDEO), status: 'terbit', pratonton: true });
  const aS2 = await api('post', `course/${a.id}/subject`, { tajuk: 'Kuliah Drive Tertutup', video: pautanDrive(DR_TUTUP), thumbnail: pautanDrive(IMG_KULIAH), status: 'terbit' });
  // Siri B: tiada thumbnail; kuliah pertama YouTube terbuka (gambar automatik)
  const b = await api('post', 'course', { tajuk: 'Siri B YouTube', status: 'terbit' });
  await api('post', `course/${b.id}/subject`, { tajuk: 'Kuliah YT Terbuka', video: `https://youtu.be/${YT_PRATONTON}`, status: 'terbit', pratonton: true });
  // Siri C: semua tertutup, tiada thumbnail (pelawat tidak sepatutnya nampak gambar daripada video)
  const c = await api('post', 'course', { tajuk: 'Siri C Tertutup', status: 'terbit' });
  const cS1 = await api('post', `course/${c.id}/subject`, { tajuk: 'Kuliah YT Tertutup', video: `https://youtu.be/${YT_TUTUP}`, status: 'terbit' });
  // Siri D: thumbnail yang gagal dimuatkan
  const d = await api('post', 'course', { tajuk: 'Siri D Gambar Rosak', status: 'terbit', thumbnail: pautanDrive(IMG_ROSAK) });
  await api('post', `course/${d.id}/subject`, { tajuk: 'Kuliah D', video: `https://youtu.be/ggggggggggg`, status: 'terbit', pratonton: true });
  await ctxAdmin.close();

  const pelawat = await konteks(null);
  const pv = pelawat.page;

  await langkah('laman utama (pelawat): kad siri memaparkan thumbnail pilihan, gambar automatik video terbuka; siri tertutup kekal corak lalai', async () => {
    await pv.goto(B + '/');
    await pv.locator('#gridCourse a.course').first().waitFor();
    await pv.locator('#gridCourse').scrollIntoViewIfNeeded();
    await pv.waitForTimeout(1200);
    const kad = (t) => pv.locator('#gridCourse a.course', { hasText: t });
    assert.equal(await kad('Siri A Drive').locator('img[data-gambar]').getAttribute('src'), `https://drive.google.com/thumbnail?id=${IMG_SIRI}&sz=w800`);
    assert.equal(await kad('Siri B YouTube').locator('img[data-gambar]').getAttribute('src'), `/api/gambar/course/${b.id}`);
    assert.equal(await kad('Siri C Tertutup').locator('img[data-gambar]').count(), 0, 'siri tertutup tidak patut ada gambar daripada video');
    await kad('Siri C Tertutup').locator('.thumb > div').first().waitFor(); // corak lalai
    for (const t of ['Siri A Drive', 'Siri B YouTube']) assert.ok(await imgMuat(pv, `#gridCourse a.course:has-text("${t}") img[data-gambar]`), `gambar ${t} tidak dimuatkan`);
    await skrin(pv, 'm1-kad-thumbnail');
    await tiadaSkrolMendatar(pv);
  });

  await langkah('gambar yang gagal dimuatkan dibuang dan kad kembali kepada corak lalai tanpa kad rosak', async () => {
    const kad = pv.locator('#gridCourse a.course', { hasText: 'Siri D Gambar Rosak' });
    await kad.waitFor();
    await pv.waitForFunction(() => ![...document.querySelectorAll('#gridCourse a.course')].find((a) => a.textContent.includes('Siri D'))?.querySelector('img[data-gambar]'));
    await kad.locator('.thumb > div').first().waitFor();
    assert.equal(await kad.locator('h3').textContent(), 'Siri D Gambar Rosak');
  });

  await langkah('ID video tertutup tidak pernah diminta oleh pelayar pelawat; laluan gambar menolak kuliah tertutup (404) dan mengalih kuliah terbuka', async () => {
    for (const id of [YT_TUTUP, DR_TUTUP]) assert.ok(!permintaan.some((u) => u.includes(id)), 'pelayar meminta URL mengandungi ID tertutup: ' + id);
    const html = await pv.content();
    for (const id of [YT_TUTUP, DR_TUTUP]) assert.ok(!html.includes(id), 'ID tertutup dalam DOM: ' + id);
    assert.equal((await pv.request.get(`${B}/api/gambar/subject/${cS1.id}`, { maxRedirects: 0 })).status(), 404);
    assert.equal((await pv.request.get(`${B}/api/gambar/subject/${aS2.id}`, { maxRedirects: 0 })).status(), 404);
    assert.equal((await pv.request.get(`${B}/api/gambar/course/${c.id}`, { maxRedirects: 0 })).status(), 404);
    const r = await pv.request.get(`${B}/api/gambar/course/${b.id}`, { maxRedirects: 0 });
    assert.equal(r.status(), 302);
    assert.equal(r.headers().location, `https://i.ytimg.com/vi/${YT_PRATONTON}/hqdefault.jpg`);
  });

  await langkah('halaman siri: foto guru dan thumbnail pilihan kuliah tertutup (tanpa mendedahkan video) dipaparkan; tiada skrol mendatar', async () => {
    await pv.goto(B + `/#/course/siri-a-drive`);
    await pv.locator('.kad-guru').waitFor();
    await pv.locator('.kad-guru-foto').waitFor();
    assert.equal(await pv.locator('.kad-guru-foto').getAttribute('src'), `https://drive.google.com/thumbnail?id=${IMG_GURU}&sz=w800`);
    assert.ok(await imgMuat(pv, '.kad-guru-foto'));
    const html = await pv.content();
    assert.ok(!html.includes(DR_TUTUP) && !html.includes('@contoh.my'), 'ID video tertutup atau emel bocor');
    await tiadaSkrolMendatar(pv);
    await skrin(pv, 'm2-halaman-siri-guru');
  });

  await langkah('kuliah Drive terbuka: pemain Drive /preview dimuatkan, tiada pemain YouTube, ada nota tandakan selesai', async () => {
    await pv.goto(B + `/#/subject/${aS1.id}`);
    const f = pv.locator('iframe#pemain');
    await f.waitFor();
    assert.equal(await f.getAttribute('src'), `https://drive.google.com/file/d/${DR_VIDEO}/preview`);
    assert.equal(await pv.evaluate(() => (window.__pemain || []).length), 0, 'pemain YouTube tidak patut dimulakan untuk video Drive');
    await pv.locator('.nota-drive').getByText('Google Drive').waitFor();
    // iframe berada dalam kotak pentas dan tidak melebihi skrin (tunggu animasi masuk halaman selesai)
    await pv.waitForTimeout(900);
    const kotak = await f.boundingBox();
    assert.ok(kotak.x >= 0 && kotak.x + kotak.width <= 390 && kotak.height > 150, JSON.stringify(kotak));
    await tiadaSkrolMendatar(pv);
    await skrin(pv, 'm3-kuliah-drive');
  });

  await langkah('kuliah Drive tertutup (pelawat): poster guna thumbnail pilihan, tiada iframe, tiada ID video', async () => {
    await pv.goto(B + `/#/subject/${aS2.id}`);
    await pv.getByRole('heading', { name: 'Log masuk untuk menonton' }).waitFor();
    assert.equal(await pv.locator('iframe').count(), 0);
    assert.equal(await pv.locator('.stage > img.gambar').getAttribute('src'), `https://drive.google.com/thumbnail?id=${IMG_KULIAH}&sz=w800`);
    assert.ok(!(await pv.content()).includes(DR_TUTUP));
  });

  const pelajar = await konteks(token.pelajar);
  const pp = pelajar.page;

  await langkah('ahli berdaftar: kuliah Drive tertutup dimainkan; Tandakan selesai manual merekod khatam', async () => {
    await pp.goto(B + `/#/subject/${aS2.id}`);
    const f = pp.locator('iframe#pemain');
    await f.waitFor();
    assert.equal(await f.getAttribute('src'), `https://drive.google.com/file/d/${DR_TUTUP}/preview`);
    await pp.locator('#kotak-selesai button').click();
    await pp.locator('#kotak-selesai').getByText('Selesai').waitFor();
    const senarai = await (await pp.request.get(`${B}/api/course/siri-a-drive`)).json();
    assert.equal(senarai.subject.find((s) => s.id === aS2.id).selesai, true);
    assert.ok(!JSON.stringify(senarai).includes(DR_TUTUP), 'senarai siri mendedahkan ID video');
  });

  await langkah('ahli berdaftar: siri tertutup mendapat gambar automatik melalui laluan gambar', async () => {
    await pp.goto(B + '/#/kuliah');
    await pp.locator('.mycourse', { hasText: 'Siri C Tertutup' }).waitFor();
    const src = await pp.locator('.mycourse', { hasText: 'Siri C Tertutup' }).locator('img[data-gambar]').getAttribute('src');
    assert.equal(src, `/api/gambar/course/${c.id}`);
    assert.ok(await imgMuat(pp, '.mycourse:has-text("Siri C Tertutup") img[data-gambar]'));
  });

  // ---- panel admin ----
  const adm = await konteks(token.admin);
  const ap = adm.page;

  await langkah('panel: borang kuliah menerima pautan Drive dan thumbnail; pratonton menunjukkan sumber; pautan palsu ditolak dengan mesej jelas', async () => {
    await ap.goto(B + `/panel/#/course/${b.id}/subject/baru`);
    await ap.locator('#tajuk').fill('Kuliah Panel Drive');
    await ap.locator('#video').fill('https://drive.google.com/drive/folders/' + DR_VIDEO);
    await ap.getByRole('button', { name: 'Simpan' }).click();
    await ap.getByText('Pautan video tidak dikenali').waitFor();
    await ap.locator('#video').fill(pautanDrive(DR_VIDEO));
    await ap.locator('#thumbnail').fill('https://contoh.my/gambar.jpg');
    await ap.getByRole('button', { name: 'Simpan' }).click();
    await ap.getByText('Pautan gambar tidak sah').waitFor();
    await ap.locator('#thumbnail').fill(pautanDrive(IMG_KULIAH));
    await skrin(ap, 'm4-panel-borang-kuliah');
    await ap.getByRole('button', { name: 'Simpan' }).click();
    await ap.locator('h1', { hasText: 'Siri B YouTube' }).waitFor();
    const baris = ap.locator('.subject', { hasText: 'Kuliah Panel Drive' });
    await baris.waitFor();
    assert.equal(await baris.locator('img').first().getAttribute('src'), `https://drive.google.com/thumbnail?id=${IMG_KULIAH}&sz=w400`);
    await baris.getByRole('link', { name: 'Sunting' }).click();
    assert.equal(await ap.locator('#video').inputValue(), `https://drive.google.com/file/d/${DR_VIDEO}/view`);
    assert.equal(await ap.locator('#thumbnail').inputValue(), `https://drive.google.com/file/d/${IMG_KULIAH}/view`);
    await ap.getByText('Google Drive', { exact: false }).first().waitFor();
  });

  await langkah('panel: thumbnail siri dan gambar guru disimpan; muncul di laman awam; kosongkan mengembalikan gambar automatik', async () => {
    await ap.goto(B + `/panel/#/course/${b.id}/sunting`);
    await ap.locator('h1', { hasText: 'Sunting siri' }).waitFor(); // navigasi hash tidak memuat semula: tunggu borang siri sebelum mengisi
    await ap.locator('#thumbnail').fill(pautanDrive(IMG_SIRI));
    await ap.getByRole('button', { name: 'Simpan' }).click();
    await ap.locator('h1', { hasText: 'Siri B YouTube' }).waitFor();
    const p = pelawat.page;
    await p.goto(B + '/'); await p.reload();
    await p.locator('#gridCourse a.course').first().waitFor();
    assert.equal(await p.locator('#gridCourse a.course', { hasText: 'Siri B YouTube' }).locator('img[data-gambar]').getAttribute('src'), `https://drive.google.com/thumbnail?id=${IMG_SIRI}&sz=w800`);
    await ap.goto(B + `/panel/#/course/${b.id}/sunting`);
    await ap.locator('h1', { hasText: 'Sunting siri' }).waitFor();
    await ap.locator('#thumbnail').fill('');
    await ap.getByRole('button', { name: 'Simpan' }).click();
    await ap.locator('h1', { hasText: 'Siri B YouTube' }).waitFor();
    await p.reload();
    await p.locator('#gridCourse a.course').first().waitFor();
    assert.equal(await p.locator('#gridCourse a.course', { hasText: 'Siri B YouTube' }).locator('img[data-gambar]').getAttribute('src'), `/api/gambar/course/${b.id}`);
    // gambar guru melalui panel Pasukan
    await ap.goto(B + '/panel/#/guru');
    const kad = ap.locator('.kad', { hasText: 'Ustaz Gambar' }).filter({ has: ap.locator('[data-borang=profil-guru]') });
    await kad.getByRole('button', { name: 'Profil' }).click();
    assert.equal(await kad.locator('input[name=gambar]').inputValue(), `https://drive.google.com/file/d/${IMG_GURU}/view`);
    await kad.locator('input[name=gambar]').fill('https://contoh.my/muka.jpg');
    await kad.getByRole('button', { name: 'Simpan profil' }).click();
    await ap.getByText('Pautan gambar tidak sah').first().waitFor();
    await skrin(ap, 'm5-panel-gambar-guru');
  });

  await langkah('guru menukar video kuliah terbit kepada Drive: menunggu kelulusan; admin nampak sumber dan pautan; selepas lulus awam melihat pemain Drive', async () => {
    const g = await konteks(token.guru);
    // kuliah YouTube terbuka dalam siri A milik guru: tukar kepada Drive melalui borang guru
    const kuliahYt = await (await ap.request.post(`${B}/api/admin/course/${a.id}/subject`, { data: { tajuk: 'Kuliah YT Guru', video: `https://youtu.be/hhhhhhhhhhh`, status: 'terbit', pratonton: true } })).json();
    await g.page.goto(B + `/panel/#/course/${a.id}/subject/${kuliahYt.id}`);
    await g.page.locator('#video').fill(pautanDrive(DR_TUTUP));
    await g.page.getByRole('button', { name: 'Simpan' }).click();
    await g.page.locator('.subject', { hasText: 'Kuliah YT Guru' }).getByText('Perubahan menunggu').waitFor();
    // awam masih melihat versi lama (YouTube)
    const lama = (await (await pelawat.page.request.get(`${B}/api/subject/${kuliahYt.id}`)).json()).subject;
    assert.deepEqual([lama.video_id, lama.video_sumber], ['hhhhhhhhhhh', 'youtube']);
    await ap.goto(B + '/panel/#/kelulusan');
    const kad = ap.locator('.kad', { hasText: 'Kuliah YT Guru' });
    await kad.waitFor();
    await kad.getByRole('cell', { name: 'Sumber video' }).waitFor();
    await kad.getByRole('cell', { name: 'Google Drive' }).first().waitFor();
    assert.ok(await kad.getByRole('link', { name: 'Google Drive' }).first().getAttribute('href').then((h) => h.startsWith('https://drive.google.com/file/d/')));
    await skrin(ap, 'm6-kelulusan-drive');
    await kad.getByRole('button', { name: 'Lulus' }).click();
    await ap.waitForFunction(() => !document.body.textContent.includes('Kuliah YT Guru'));
    const kini = (await (await pelawat.page.request.get(`${B}/api/subject/${kuliahYt.id}`)).json()).subject;
    assert.deepEqual([kini.video_id, kini.video_sumber], [DR_TUTUP, 'drive']);
    await g.ctx.close();
  });

  await langkah('tiada ralat JavaScript', async () => { assert.deepEqual(ralatHalaman, []); });

  console.log(`\n# lulus ${lulus}`);
} catch (e) {
  console.error('GAGAL selepas', lulus, 'langkah:', e.message);
  process.exitCode = 1;
} finally {
  await pelayar.close();
  henti();
}
