// Toggle ciri sijil dan kod golongan (Tetapan laman). Lalai sembunyi; server menolak bila sembunyi.
import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/worker.js';
import { repoPalsu } from './repo-palsu.js';
import { tokenBaru, hashToken } from '../src/lib/sesi.js';
import { sahkanTetapan, LALAI } from '../src/lib/tetapan.js';

const NOW = Date.parse('2026-11-18T02:00:00Z');
const B = 'https://haraki.test';
const env = { ADMIN_EMELS: 'admin@gmail.com' };

async function sesi(repo, emel) {
  const p = await repo.simpanPengguna({ emel, sub: 's-' + emel, nama: emel }, 't');
  const token = tokenBaru();
  await repo.ciptaSesi(await hashToken(token), p.id, new Date(NOW + 864e5).toISOString());
  return 'kh_sesi=' + token;
}
const klien = (repo, kuki) => async (kaedah, laluan, badan) => {
  const r = await handle(new Request(B + laluan, { method: kaedah, headers: { ...(kuki ? { cookie: kuki } : {}), ...(badan !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: badan === undefined ? undefined : JSON.stringify(badan) }), env, { repo, now: NOW });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch { /* bukan JSON */ }
  return { status: r.status, b: j, teks: t };
};

async function sedia(tetapan = {}) {
  const repo = repoPalsu();
  if (Object.keys(tetapan).length) await repo.simpanTetapan(tetapan);
  const A = klien(repo, await sesi(repo, 'admin@gmail.com'));
  const c = (await A('POST', '/api/admin/course', { tajuk: 'Siri Ciri', status: 'terbit' })).b;
  await A('POST', `/api/admin/course/${c.id}/subject`, { tajuk: 'K1', video: 'aaaaaaaaaaa', status: 'terbit', pratonton: true });
  const P = klien(repo, await sesi(repo, 'ahli@gmail.com'));
  return { repo, A, P, c };
}

test('lalai: kedua-dua ciri sembunyi; tetapan boleh diisi ya atau tidak sahaja', () => {
  assert.equal(LALAI.sijil_aktif, 'tidak');
  assert.equal(LALAI.kod_aktif, 'tidak');
  assert.equal(sahkanTetapan({ sijil_aktif: 'ya', kod_aktif: 'tidak' }).ok, true);
  assert.equal(sahkanTetapan({ sijil_aktif: 'mungkin' }).medan, 'sijil_aktif');
  assert.equal(sahkanTetapan({ kod_aktif: 'YA' }).ok, false);
});

test('lalai sembunyi: /api/konfig melaporkan sembunyi; sijil dan kod ditolak 404', async () => {
  const { P, A, c } = await sedia();
  const k = (await klien(null, null)('GET', '/api/konfig')).b; // tanpa repo: lalai
  assert.equal(k.laman.sijil_aktif, 'tidak');
  assert.equal(k.laman.kod_aktif, 'tidak');
  const d = (await P('GET', `/api/course/${c.slug}`)).b;
  assert.deepEqual(d.ciri, { sijil: false });
  assert.equal(d.sijil, null);
  assert.equal((await P('GET', '/api/sijil')).status, 404);
  assert.equal((await P('POST', `/api/course/${c.slug}/sijil`, { nama: 'Ali Bin Abu' }, )).status, 404);
  assert.equal((await P('POST', '/api/golongan', { kod: 'ABCD-EFGH' })).status, 404);
  assert.equal((await A('POST', '/api/admin/kod', { golongan: 'pelajar', bulan_akses: 1 })).status, 201); // admin masih boleh cipta kod
});

test('sijil sembunyi: halaman pengesahan /sijil/<kod> ditutup walaupun kod wujud', async () => {
  const { repo } = await sedia({ sijil_aktif: 'tidak' });
  await repo.ciptaSijil({ kod: 'ABCDEFGHJK', pengguna_id: 1, course_id: 1, nama: 'Ali', tajuk_course: 'Siri', guru: null, dikeluarkan_pada: 't' });
  const r = await handle(new Request(B + '/sijil/ABCDEFGHJK'), env, { repo, now: NOW });
  assert.equal(r.status, 404);
});

test('ciri dihidupkan: sijil dan kod berfungsi; ciri dimatikan semula menutup semula (data kekal)', async () => {
  const { A, P, c, repo } = await sedia({ sijil_aktif: 'ya', kod_aktif: 'ya' });
  const d = (await P('GET', `/api/course/${c.slug}`)).b;
  assert.deepEqual(d.ciri, { sijil: true });
  assert.equal((await P('GET', '/api/sijil')).status, 200);
  assert.equal((await P('POST', '/api/golongan', { kod: 'ABCD-EFGH' })).status, 400); // kod tidak wujud, tetapi ciri dihidupkan
  await A('POST', '/api/admin/kod', { golongan: 'pelajar', bulan_akses: 1, kod: 'KODUJIAN1' });
  assert.equal((await P('POST', '/api/golongan', { kod: 'KODUJIAN1' })).status, 200);
  await A('PUT', '/api/admin/tetapan', { kod_aktif: 'tidak' });
  assert.equal((await P('POST', '/api/golongan', { kod: 'KODUJIAN1' })).status, 404);
  assert.ok((await A('GET', '/api/admin/kod')).b.some((k) => k.kod === 'KODUJIAN1')); // kod tidak dipadam
  assert.equal(await repo.kodDariTeks('KODUJIAN1') !== null, true);
});

test('tetapan lalai kembali bila nilai dikosongkan; admin tidak boleh tetapkan nilai selain ya/tidak', async () => {
  const { A } = await sedia();
  assert.equal((await A('PUT', '/api/admin/tetapan', { sijil_aktif: 'ya' })).b.nilai.sijil_aktif, 'ya');
  assert.equal((await A('PUT', '/api/admin/tetapan', { sijil_aktif: '' })).b.nilai.sijil_aktif, 'tidak');
  assert.equal((await A('PUT', '/api/admin/tetapan', { kod_aktif: 'aktif' })).status, 400);
});
