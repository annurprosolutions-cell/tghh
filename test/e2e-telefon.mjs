// Ujian telefon: hero laman utama tidak terpotong walaupun tajuk panjang (360/390/450px) dan huraian panjang
// diringkaskan dengan "Lihat lagi". Jalankan: npm run test:e2e. SKRIN_DIR=<folder> menyimpan tangkapan skrin.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { mulaWorker, sha256, tokenRawak } from './e2e-sedia.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');

const SKRIN = process.env.SKRIN_DIR;
const ADMIN = 'admin-tel@contoh.my';
const tokenAdmin = tokenRawak();
const masa = new Date().toISOString(), tamat = new Date(Date.now() + 864e5).toISOString();
const { B, henti } = await mulaWorker({
  port: 8795,
  vars: { ADMIN_EMELS: ADMIN },
  semaiSql: `INSERT INTO pengguna (emel, nama, peranan, dicipta_pada, golongan) VALUES ('${ADMIN}', 'Admin Tel', 'pelajar', '${masa}', 'awam');
    INSERT INTO sesi (token_hash, pengguna_id, tamat_pada) VALUES ('${sha256(tokenAdmin)}', 1, '${tamat}');`,
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
let lulus = 0;
const langkah = async (nama, fn) => { await fn(); lulus++; console.log('ok', lulus, '-', nama); };
const skrin = async (page, nama) => { if (SKRIN) { mkdirSync(SKRIN, { recursive: true }); await page.screenshot({ path: `${SKRIN}/${nama}.png` }); } };

async function konteks(lebar, tokenSesi) {
  const ctx = await pelayar.newContext({ viewport: { width: lebar, height: 844 }, serviceWorkers: 'block' });
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
  return { ctx, page };
}

const HURAIAN_SIRI = "Buku ini membincangkan berbagai fahaman dan ideologi yang berkembang di kalangan umat Islam, mulai dari mazhab akidah seperti Asy'ariyah, Maturidiyyah, hingga ideologi-ideologi modern seperti sekularisme, nasionalisme, kapitalisme, komunisme dan sosialisme. Ia juga menjelaskan perpecahan awal umat Islam menjadi berbagai aliran seperti Syiah, Khawarij, Mu'tazilah, dan lain-lain TAMATSIRI";
const HURAIAN_KULIAH = 'Kuliah ini menerangkan asas fahaman dan ideologi. '.repeat(9) + '<script>window.__xss = 1</script> TAMATKULIAH';
const TAJUK_SIRI = 'FAHAMAN DAN IDEOLOGI UMAT ISLAM';
const TAJUK_KULIAH = '001 - Pengenalan Fahaman dan Ideologi Umat Islam Secara Menyeluruh';

try {
  const { ctx: ctxAdmin } = await konteks(390, tokenAdmin);
  const post = async (laluan, data) => { const r = await ctxAdmin.request.post(B + '/api/admin/' + laluan, { data }); assert.ok(r.ok(), laluan + ' ' + r.status()); return r.json(); };
  const panjang = await post('course', { tajuk: TAJUK_SIRI, huraian: HURAIAN_SIRI, status: 'terbit' });
  const k1 = await post(`course/${panjang.id}/subject`, { tajuk: TAJUK_KULIAH, huraian: HURAIAN_KULIAH, video: 'aaaaaaaaaaa', status: 'terbit', pratonton: true });
  await post(`course/${panjang.id}/subject`, { tajuk: '002 - Kedua', video: 'bbbbbbbbbbb', status: 'terbit' });
  const pendek = await post('course', { tajuk: 'Siri Pendek', huraian: 'Huraian pendek sahaja.', status: 'terbit' });
  await post(`course/${pendek.id}/subject`, { tajuk: 'K1', video: 'ccccccccccc', status: 'terbit', pratonton: true });
  await ctxAdmin.close();

  await langkah('/privasi: dihidang oleh Worker (bukan shell SPA) dengan kandungan penuh; laman utama ada pautan dalam HTML mentah', async () => {
    const r = await fetch(B + '/privasi');
    assert.equal(r.status, 200);
    const html = await r.text();
    assert.ok(html.includes('<h1>Dasar Privasi') && html.includes('Data yang kami kumpul'), 'bukan halaman privasi sebenar');
    assert.ok(!html.includes('id="akar"'), 'dihidang shell SPA, bukan halaman pelayan');
    const utama = await (await fetch(B + '/')).text();
    assert.ok(utama.includes('href="/privasi"'), 'laman utama tiada pautan /privasi dalam HTML mentah');
  });

  await langkah('hero: kad video dan statistik muat dalam skrin pada 360, 390 dan 450px walaupun tajuk panjang; kad di tengah', async () => {
    for (const lebar of [360, 390, 450]) {
      const { ctx, page: p } = await konteks(lebar, null);
      await p.goto(B + '/');
      await p.locator('.preview-card').waitFor({ state: 'attached' });
      await p.waitForTimeout(1200);
      const r = await p.evaluate(() => { const k = (s) => { const x = document.querySelector(s).getBoundingClientRect(); return { kiri: x.left, kanan: x.right }; };
        return { W: innerWidth, kad: k('.preview-card'), stat: k('.hero-stats'), tajuk: k('.preview-judul'), head: k('.preview-head') }; });
      assert.ok(r.kad.kiri >= 0 && r.kad.kanan <= r.W + 0.5, `kad hero melebihi skrin pada ${lebar}px: ${JSON.stringify(r.kad)}`);
      assert.ok(r.stat.kanan <= r.W + 0.5, 'statistik melebihi skrin');
      assert.ok(Math.abs(r.kad.kiri - (r.W - r.kad.kanan)) <= 2, `kad tidak di tengah pada ${lebar}px: kiri ${r.kad.kiri}, kanan ${r.W - r.kad.kanan}`);
      assert.ok(r.tajuk.kanan <= r.head.kanan + 0.5, 'tajuk melebihi kepala kad');
      if (lebar === 390) { await p.locator('.preview-card').scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await skrin(p, 't1-hero-390'); }
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await p.waitForTimeout(1200);
      assert.ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= lebar, `skrol mendatar pada ${lebar}px`);
      await ctx.close();
    }
  });

  const { ctx: ctxP, page: p } = await konteks(390, null);

  await langkah('kad siri: huraian panjang diringkaskan (<= 140 aksara) dengan butang Lihat lagi; siri huraian pendek tiada butang', async () => {
    await p.goto(B + '/');
    await p.locator('#gridCourse a.course').first().waitFor();
    const kad = p.locator('#gridCourse a.course', { hasText: TAJUK_SIRI });
    const pendekTeks = await kad.locator('.rk-pendek').textContent();
    assert.ok(pendekTeks.length <= 142, 'ringkasan terlalu panjang: ' + pendekTeks.length);
    assert.ok(pendekTeks.endsWith('…'));
    assert.ok(await kad.locator('.rk-penuh').isHidden());
    await kad.locator('.lihat-lagi').waitFor();
    assert.equal(await kad.locator('.lihat-lagi').textContent(), 'Lihat lagi');
    assert.equal(await p.locator('#gridCourse a.course', { hasText: 'Siri Pendek' }).locator('.lihat-lagi').count(), 0);
    await kad.scrollIntoViewIfNeeded();
    await p.waitForTimeout(1000); // animasi masuk kad (scroll-reveal) mesti selesai sebelum tangkapan skrin
    await skrin(p, 't2-kad-ringkas');
  });

  await langkah('Lihat lagi mengembangkan teks penuh tanpa membuka halaman siri; Tutup meringkaskan semula', async () => {
    const kad = p.locator('#gridCourse a.course', { hasText: TAJUK_SIRI });
    await kad.locator('.lihat-lagi').click();
    await kad.locator('.rk-penuh').waitFor({ state: 'visible' });
    assert.ok((await kad.locator('.rk-penuh').textContent()).includes('TAMATSIRI'));
    assert.ok(await kad.locator('.rk-pendek').isHidden());
    assert.equal(await kad.locator('.lihat-lagi').textContent(), 'Tutup');
    assert.equal(await kad.locator('.lihat-lagi').getAttribute('aria-expanded'), 'true');
    assert.equal(await p.evaluate(() => location.hash), '', 'klik Lihat lagi tidak patut membuka halaman siri');
    await skrin(p, 't3-kad-dikembangkan');
    await kad.locator('.lihat-lagi').click();
    await kad.locator('.rk-pendek').waitFor({ state: 'visible' });
    assert.ok(await kad.locator('.rk-penuh').isHidden());
    assert.equal(await kad.locator('.lihat-lagi').getAttribute('aria-expanded'), 'false');
    // klik pada kawasan lain kad tetap membuka siri
    await kad.locator('h3').click();
    await p.waitForFunction(() => location.hash.startsWith('#/course/'));
  });

  await langkah('halaman siri: huraian siri diringkaskan dengan Lihat lagi', async () => {
    const sub = p.locator('.page-head .sub .ringkas');
    await sub.waitFor();
    await sub.locator('.lihat-lagi').click();
    assert.ok((await sub.locator('.rk-penuh').textContent()).includes('TAMATSIRI'));
    await p.locator('.kad-guru').count();
  });

  await langkah('halaman kuliah: huraian panjang diringkaskan; HTML dalam huraian kekal teks; huraian pendek tiada butang', async () => {
    await p.goto(B + `/#/subject/${k1.id}`);
    await p.locator('#pemain[data-video]').waitFor();
    const pane = p.locator('[data-pane=huraian]');
    await pane.locator('.ringkas').waitFor();
    assert.ok((await pane.locator('.rk-pendek').textContent()).length <= 302);
    await pane.locator('.lihat-lagi').click();
    const penuh = await pane.locator('.rk-penuh').textContent();
    assert.ok(penuh.includes('TAMATKULIAH') && penuh.includes('<script>window.__xss = 1</script>'));
    assert.equal(await pane.locator('script').count(), 0);
    assert.equal(await p.evaluate(() => window.__xss), undefined);
    assert.ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);
    await skrin(p, 't4-huraian-kuliah');
  });

  await langkah('tiada ralat JavaScript', async () => { assert.deepEqual(ralatHalaman, []); });
  await ctxP.close();

  console.log(`\n# lulus ${lulus}`);
} catch (e) {
  console.error('GAGAL selepas', lulus, 'langkah:', e.message);
  process.exitCode = 1;
} finally {
  await pelayar.close();
  henti();
}
