// Ujian hujung ke hujung laporan kandungan (Fasa 4, F-17) dalam Chromium 390px terhadap Worker tempatan:
// butang Lapor, modal S-10 (Esc, pengesahan, hantar), had harian dan pendua, tab Laporan S-21, kiraan, XSS.
// Jalankan: npm run test:e2e. SKRIN_DIR=<folder> menyimpan tangkapan skrin.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { mulaWorker, sha256, tokenRawak } from './e2e-sedia.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');

const SKRIN = process.env.SKRIN_DIR;
const ADMIN = 'admin-lap@contoh.my', GURU = 'guru-lap@contoh.my', PELAJAR = 'pelajar-lap@contoh.my';
const token = { admin: tokenRawak(), guru: tokenRawak(), pelajar: tokenRawak() };
const masa = new Date().toISOString(), tamat = new Date(Date.now() + 864e5).toISOString();

const { B, henti } = await mulaWorker({
  port: 8794,
  vars: { ADMIN_EMELS: ADMIN },
  semaiSql: `INSERT INTO pengguna (emel, nama, peranan, dicipta_pada, golongan) VALUES ('${ADMIN}', 'Admin Lap', 'pelajar', '${masa}', 'awam'), ('${GURU}', 'Guru Lap', 'pelajar', '${masa}', 'awam'), ('${PELAJAR}', 'Pelajar Lap', 'pelajar', '${masa}', 'awam');
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
const skrin = async (page, nama) => { if (SKRIN) { mkdirSync(SKRIN, { recursive: true }); await page.screenshot({ path: `${SKRIN}/${nama}.png`, fullPage: false }); } };
const tiadaSkrolMendatar = async (page) => {
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => ({ lebar: document.documentElement.scrollWidth, tetingkap: window.innerWidth }));
  assert.ok(r.lebar <= r.tetingkap, `skrol mendatar: ${r.lebar} > ${r.tetingkap}`);
};
const XSS = '<script>window.__xss = 1</script><img src=x onerror="window.__xss = 2">';

try {
  const { ctx: ctxAdmin } = await konteks(token.admin);
  const post = async (laluan, data) => { const r = await ctxAdmin.request.post(B + '/api/admin/' + laluan, { data }); assert.ok(r.ok(), laluan + ' ' + r.status()); return r.json(); };
  const put = async (laluan, data) => { const r = await ctxAdmin.request.put(B + '/api/admin/' + laluan, { data }); assert.ok(r.ok(), laluan + ' ' + r.status()); return r.json(); };
  await post('guru', { emel: GURU, nama: 'Guru Lap' });
  const c = await post('course', { tajuk: 'Siri Laporan', status: 'terbit' });
  const s = [];
  for (let i = 1; i <= 7; i++) s.push(await post(`course/${c.id}/subject`, { tajuk: 'Kuliah ' + i, video: 'aaaaaaaaaa' + i, status: 'terbit', pratonton: i === 1 }));
  // satu soalan dijawab pada kuliah 1 untuk uji laporan soalan
  const ctxP0 = await konteks(token.pelajar);
  const q = await (await ctxP0.ctx.request.post(`${B}/api/subject/${s[0].id}/soalan`, { data: { teks: 'Apakah maksud takfir dalam konteks ini?' } })).json();
  await put(`soalan/${q.id}`, { jawapan: 'Takfir ialah menghukum seseorang sebagai kafir; sistem ini tidak melakukannya.' });
  await ctxP0.ctx.close();
  await ctxAdmin.close();

  const pelawat = await konteks(null);
  const pelajar = await konteks(token.pelajar);
  const pp = pelajar.page;

  await langkah('pelawat: butang Lapor ada tetapi membawa ke log masuk (tiada modal)', async () => {
    const p = pelawat.page;
    await p.goto(B + `/#/subject/${s[0].id}`);
    await p.locator('#pemain[data-video]').waitFor();
    await p.locator('.butang-lapor').click();
    await p.waitForFunction(() => location.hash === '#/masuk');
    assert.equal(await p.locator('.modal-latar').count(), 0);
    assert.equal((await p.request.post(B + '/api/laporan', { data: { subject_id: s[0].id, sebab: 'lain' } })).status(), 401);
  });

  await langkah('ahli: butang Lapor di bawah tajuk kuliah; modal S-10 dibuka dengan empat sebab dan catatan', async () => {
    await pp.goto(B + `/#/subject/${s[0].id}`);
    await pp.locator('#pemain[data-video]').waitFor();
    await pp.locator('.butang-lapor').click();
    const m = pp.locator('.modal-latar [role=dialog]');
    await m.waitFor();
    await m.getByRole('heading', { name: 'Lapor kandungan' }).waitFor();
    assert.deepEqual(await m.locator('.lapor-pilih span').allTextContents(), ['Salah fakta', 'Kandungan kebencian atau takfir', 'Tiada rujukan', 'Lain-lain']);
    await m.locator('#catatanLapor').waitFor();
    await m.getByRole('button', { name: 'Hantar' }).waitFor();
    await m.getByRole('button', { name: 'Batal' }).waitFor();
    // sasaran sentuh minimum 44px dan modal muat dalam skrin 390px
    const ukur = await pp.evaluate(() => ({ pilih: Math.min(...[...document.querySelectorAll('.lapor-pilih')].map((e) => e.getBoundingClientRect().height)), kotak: document.querySelector('.modal-kotak').getBoundingClientRect() }));
    assert.ok(ukur.pilih >= 44, 'sasaran sentuh < 44px: ' + ukur.pilih);
    assert.ok(ukur.kotak.left >= 0 && ukur.kotak.right <= 390, 'modal melebihi skrin');
    await skrin(pp, 'f4-01-modal-lapor');
  });

  await langkah('modal: Esc menutup dan fokus kembali ke butang; Batal menutup; latar menutup', async () => {
    await pp.keyboard.press('Escape');
    await pp.locator('.modal-latar').waitFor({ state: 'detached' });
    assert.equal(await pp.evaluate(() => document.activeElement?.className), 'butang-lapor');
    await pp.locator('.butang-lapor').click();
    await pp.getByRole('button', { name: 'Batal' }).click();
    await pp.locator('.modal-latar').waitFor({ state: 'detached' });
    await pp.locator('.butang-lapor').click();
    await pp.locator('.modal-latar').click({ position: { x: 5, y: 5 } });
    await pp.locator('.modal-latar').waitFor({ state: 'detached' });
    assert.equal(await pp.evaluate(() => document.body.style.overflow), '');
  });

  await langkah('modal: hantar tanpa sebab ditolak dengan mesej; catatan dikira; HTML dalam catatan dihantar sebagai teks', async () => {
    await pp.locator('.butang-lapor').click();
    const m = pp.locator('.modal-latar');
    await m.getByRole('button', { name: 'Hantar' }).click();
    await m.getByText('Pilih sebab laporan.').waitFor();
    await m.locator('.lapor-pilih', { hasText: 'Salah fakta' }).click();
    await m.locator('#catatanLapor').fill(XSS);
    assert.ok((await m.locator('#kiraLapor').textContent()).endsWith('/ 500'));
    await m.getByRole('button', { name: 'Hantar' }).click();
    await pp.locator('.toast').getByText('Terima kasih').waitFor();
    await pp.locator('.modal-latar').waitFor({ state: 'detached' });
    await skrin(pp, 'f4-02-terima-kasih');
    assert.equal(await pp.evaluate(() => window.__xss), undefined);
  });

  await langkah('laporan sama (kuliah + sebab) dalam 24 jam ditolak dengan mesej jelas; sebab lain dibenarkan', async () => {
    await pp.locator('.butang-lapor').click();
    const m = pp.locator('.modal-latar');
    await m.locator('.lapor-pilih', { hasText: 'Salah fakta' }).click();
    await m.getByRole('button', { name: 'Hantar' }).click();
    await m.getByText('sudah menghantar laporan yang sama').waitFor();
    await skrin(pp, 'f4-03-pendua');
    await m.locator('.lapor-pilih', { hasText: 'Tiada rujukan' }).click();
    await m.getByRole('button', { name: 'Hantar' }).click();
    await pp.locator('.toast').getByText('Terima kasih').waitFor();
  });

  await langkah('laporan soalan: butang "Lapor soalan ini" pada soal jawab dihantar bersama soalan_id', async () => {
    await pp.getByRole('tab', { name: /Soal jawab/ }).click();
    await pp.getByRole('button', { name: 'Lapor soalan ini' }).click();
    const m = pp.locator('.modal-latar');
    await m.getByText('Soalan atau jawapan ini').waitFor();
    await m.locator('.lapor-pilih', { hasText: 'Kandungan kebencian' }).click();
    await m.locator('#catatanLapor').fill('Jawapan perlu rujukan.');
    await m.getByRole('button', { name: 'Hantar' }).click();
    await pp.locator('.toast').getByText('Terima kasih').waitFor();
  });

  await langkah('had 5 laporan sehari: yang keenam ditolak (API 429) dan UI memaparkan mesej had harian', async () => {
    // sudah 3 laporan (kuliah 1 dua sebab, soalan satu); tambah 2 pada kuliah lain supaya genap 5
    for (const i of [1, 2]) assert.equal((await pp.request.post(B + '/api/laporan', { data: { subject_id: s[i].id, sebab: 'lain' } })).status(), 201);
    const enam = await pp.request.post(B + '/api/laporan', { data: { subject_id: s[3].id, sebab: 'lain' } });
    assert.equal(enam.status(), 429);
    assert.equal((await enam.json()).ralat, 'had-harian');
    await pp.goto(B + `/#/subject/${s[3].id}`);
    await pp.locator('.butang-lapor').click();
    await pp.locator('.lapor-pilih', { hasText: 'Lain-lain' }).click();
    await pp.getByRole('button', { name: 'Hantar' }).click();
    await pp.locator('.modal-latar').getByText('had 5 laporan sehari').waitFor();
    await skrin(pp, 'f4-04-had-harian');
    await pp.keyboard.press('Escape');
  });

  // ---- panel admin ----
  const adm = await konteks(token.admin);
  const ap = adm.page;

  await langkah('panel: lencana Laporan di menu dan notis pada senarai siri menunjukkan bilangan laporan baharu', async () => {
    await ap.goto(B + '/panel/');
    await ap.locator('#bilLaporan').waitFor({ state: 'visible' });
    assert.equal((await ap.locator('#bilLaporan').textContent()).trim(), '5');
    await ap.getByText('laporan kandungan baharu').waitFor();
    await skrin(ap, 'f4-05-panel-ringkasan');
  });

  await langkah('panel S-21: senarai laporan menunjukkan sebab, kuliah, pelapor, soalan; HTML kekal teks', async () => {
    await ap.getByRole('link', { name: 'Laporan' }).first().click();
    await ap.locator('h1', { hasText: 'Laporan kandungan' }).waitFor();
    assert.equal(await ap.locator('[data-borang=urus-laporan]').count(), 5);
    const kad = ap.locator('[data-borang=urus-laporan]', { hasText: 'Salah fakta' });
    await kad.getByText(XSS).waitFor();
    assert.equal(await kad.locator('script, img').count(), 0);
    assert.equal(await ap.evaluate(() => window.__xss), undefined);
    await kad.getByText('pelajar-lap@contoh.my').waitFor();
    await kad.getByRole('link', { name: 'Kuliah 1' }).waitFor();
    const soalan = ap.locator('[data-borang=urus-laporan]', { hasText: 'Kandungan kebencian atau takfir' });
    await soalan.getByText('Apakah maksud takfir dalam konteks ini?').waitFor();
    await tiadaSkrolMendatar(ap);
    await skrin(ap, 'f4-06-panel-laporan');
  });

  await langkah('panel S-21: admin menukar status ke Disemak dengan catatan; hilang daripada tab Baru, muncul di Disemak; kiraan berkurang', async () => {
    const kad = ap.locator('[data-borang=urus-laporan]', { hasText: 'Salah fakta' });
    await kad.locator('select[name=status]').selectOption('disemak');
    await kad.locator('textarea[name=catatan_admin]').fill('Sudah semak dengan guru. Rujukan akan ditambah.');
    await kad.getByRole('button', { name: 'Simpan' }).click();
    await ap.waitForFunction(() => document.querySelectorAll('[data-borang=urus-laporan]').length === 4);
    await ap.waitForFunction(() => document.getElementById('bilLaporan')?.textContent.trim() === '4'); // lencana dikemas kini selepas permintaan
    await ap.getByRole('link', { name: 'Disemak' }).click();
    await ap.waitForFunction(() => document.querySelectorAll('[data-borang=urus-laporan]').length === 1);
    const d = ap.locator('[data-borang=urus-laporan]');
    assert.equal(await d.count(), 1);
    assert.equal(await d.locator('textarea[name=catatan_admin]').inputValue(), 'Sudah semak dengan guru. Rujukan akan ditambah.');
    await d.locator('select[name=status]').selectOption('selesai');
    await d.getByRole('button', { name: 'Simpan' }).click();
    await ap.waitForFunction(() => !document.querySelector('[data-borang=urus-laporan]'));
    await ap.getByRole('link', { name: 'Selesai' }).click();
    await ap.waitForFunction(() => document.querySelectorAll('[data-borang=urus-laporan]').length === 1);
    await ap.getByRole('link', { name: 'Semua' }).click();
    await ap.waitForFunction(() => document.querySelectorAll('[data-borang=urus-laporan]').length === 5);
    await skrin(ap, 'f4-07-panel-semua');
  });

  await langkah('guru dan ahli: tiada tab Laporan dan API admin laporan menolak (403)', async () => {
    const g = await konteks(token.guru);
    await g.page.goto(B + '/panel/');
    await g.page.locator('h1', { hasText: 'Siri saya' }).waitFor();
    assert.equal(await g.page.getByRole('link', { name: 'Laporan' }).count(), 0);
    assert.equal((await g.page.request.get(B + '/api/admin/laporan')).status(), 403);
    assert.equal((await g.page.request.put(B + '/api/admin/laporan/1', { data: { status: 'selesai' } })).status(), 403);
    await g.ctx.close();
    assert.equal((await pp.request.get(B + '/api/admin/laporan')).status(), 403);
  });

  await langkah('tiada ralat JavaScript dan tiada amaran XSS sepanjang sesi', async () => {
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
