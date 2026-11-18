// /privasi: halaman awam dari pelayan (boleh dibaca tanpa JavaScript, penting untuk semakan jenama Google).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handle } from '../src/worker.js';
import { repoPalsu } from './repo-palsu.js';

const NOW = Date.parse('2026-11-18T02:00:00Z');
const B = 'https://harakihub.test';
const env = { ADMIN_EMELS: 'admin@gmail.com' };
const ambil = async (repo, laluan = '/privasi', e = env, kaedah = 'GET') => {
  const r = await handle(new Request(B + laluan, { method: kaedah }), e, { repo, now: NOW });
  return { status: r.status, kepala: r.headers, teks: await r.text() };
};

test('/privasi: 200 HTML tanpa log masuk; ada nama laman, data yang dikumpul, hak pengguna dan pautan kembali', async () => {
  const r = await ambil(repoPalsu());
  assert.equal(r.status, 200);
  assert.match(r.kepala.get('content-type'), /text\/html/);
  assert.match(r.teks, /<h1>Dasar Privasi Haraki Hub<\/h1>/);
  for (const frasa of ['Data yang kami kumpul', 'Nama dan alamat emel', 'Tujuan penggunaan', 'Perkhidmatan pihak ketiga', 'Hak anda', 'tidak</strong> meminta akses kepada Gmail']) assert.ok(r.teks.includes(frasa), frasa);
  assert.match(r.teks, /<link rel="canonical" href="https:\/\/harakihub\.test\/privasi">/);
  assert.ok(r.teks.includes('href="/privasi"')); // pautan dalam footer
  assert.ok(!/<meta name="robots" content="noindex/.test(r.teks), 'hos utama boleh diindeks');
});

test('/privasi: laluan dengan garis miring, kaedah tidak disokong, nama dan emel dari Tetapan laman, semua teks di-escape', async () => {
  const repo = repoPalsu();
  await repo.simpanTetapan({ nama: '<b>Laman</b> "X"', emel_hubungan: 'hubungi@contoh.my', privasi_teks: 'Ringkasan <script>alert(1)</script>\nbaris dua' });
  const r = await ambil(repo, '/privasi/');
  assert.equal(r.status, 200);
  assert.ok(r.teks.includes('&lt;b&gt;Laman&lt;/b&gt; &quot;X&quot;'));
  assert.ok(!r.teks.includes('<b>Laman</b>'));
  assert.ok(r.teks.includes('mailto:hubungi@contoh.my'));
  assert.ok(r.teks.includes('Ringkasan &lt;script&gt;alert(1)&lt;/script&gt;<br>baris dua'));
  assert.ok(!/<script>alert\(1\)/.test(r.teks));
  assert.equal((await ambil(repo, '/privasi', env, 'POST')).status, 405);
  assert.equal((await ambil(repo, '/privasi', env, 'HEAD')).status, 200);
});

test('/privasi: tanpa emel hubungan ada panduan hubungi; hos selain SITE_URL ditanda noindex', async () => {
  const r = await ambil(repoPalsu(), '/privasi', { ...env, SITE_URL: 'https://lain.example' });
  assert.match(r.teks, /<meta name="robots" content="noindex/);
  assert.match(r.teks, /Hubungi: |hubungi pengendali laman/);
  assert.ok(r.teks.includes('https://lain.example/privasi'));
});

test('laman utama: pautan Dasar Privasi ada dalam HTML mentah (tanpa JavaScript) dan laluan dihidang oleh Worker dahulu', () => {
  const index = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.ok(/<a href="\/privasi">Dasar Privasi<\/a>/.test(index));
  for (const f of ['wrangler.toml', 'wrangler.uji.toml']) assert.ok(readFileSync(new URL('../' + f, import.meta.url), 'utf8').includes('"/privasi"'), f);
});
