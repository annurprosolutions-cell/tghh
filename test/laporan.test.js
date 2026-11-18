// Ujian laporan kandungan (F-17): pengesahan, had 5 sehari, pendua, akses, panel admin.
import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/worker.js';
import { repoPalsu } from './repo-palsu.js';
import { tokenBaru, hashToken } from '../src/lib/sesi.js';
import { sahkanLaporan, sahkanKemaskiniLaporan, SEBAB } from '../src/lib/laporan.js';

const NOW = Date.parse('2026-11-18T02:00:00Z'); // 18/11/2026 10:00 GMT+8
const B = 'https://haraki.test';
const env = { ADMIN_EMELS: 'admin@gmail.com' };

async function sesi(repo, emel) {
  const p = await repo.simpanPengguna({ emel, sub: 's-' + emel, nama: emel }, 't');
  const token = tokenBaru();
  await repo.ciptaSesi(await hashToken(token), p.id, new Date(NOW + 864e5).toISOString());
  return 'kh_sesi=' + token;
}
const klien = (repo, kuki) => async (kaedah, laluan, badan, header = {}) => {
  const r = await handle(new Request(B + laluan, { method: kaedah, headers: { ...(kuki ? { cookie: kuki } : {}), ...(badan !== undefined ? { 'content-type': 'application/json' } : {}), ...header },
    body: badan === undefined ? undefined : JSON.stringify(badan) }), env, { repo, now: NOW });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch { /* bukan JSON */ }
  return { status: r.status, b: j, teks: t };
};

async function sedia() {
  const repo = repoPalsu();
  const A = klien(repo, await sesi(repo, 'admin@gmail.com'));
  await A('POST', '/api/admin/guru', { emel: 'guru@gmail.com', nama: 'Ustaz' });
  const G = klien(repo, await sesi(repo, 'guru@gmail.com'));
  const P = klien(repo, await sesi(repo, 'ahli@gmail.com'));
  const P2 = klien(repo, await sesi(repo, 'ahli2@gmail.com'));
  const awam = klien(repo, null);
  const c = (await A('POST', '/api/admin/course', { tajuk: 'Siri', status: 'terbit' })).b;
  const subj = [];
  for (let i = 1; i <= 7; i++) subj.push((await A('POST', `/api/admin/course/${c.id}/subject`, { tajuk: 'K' + i, video: 'aaaaaaaaaa' + i, status: 'terbit' })).b);
  const draf = (await A('POST', `/api/admin/course/${c.id}/subject`, { tajuk: 'Draf', video: 'bbbbbbbbbbb', status: 'draf' })).b;
  return { repo, A, G, P, P2, awam, c, subj, draf };
}

test('pengesahan: sebab dalam enum, catatan maks 500, id mesti integer positif', () => {
  assert.deepEqual(SEBAB, ['salah-fakta', 'kebencian-takfir', 'tiada-rujukan', 'lain']);
  assert.equal(sahkanLaporan({ subject_id: 1, sebab: 'salah-fakta' }).ok, true);
  assert.equal(sahkanLaporan({ subject_id: 1, sebab: 'salah-fakta' }).nilai.catatan, '');
  assert.equal(sahkanLaporan({ subject_id: 1, sebab: 'spam' }).medan, 'sebab');
  assert.equal(sahkanLaporan({ subject_id: 'a', sebab: 'lain' }).medan, 'subject_id');
  assert.equal(sahkanLaporan({ subject_id: 0, sebab: 'lain' }).ok, false);
  assert.equal(sahkanLaporan({ subject_id: 1, sebab: 'lain', soalan_id: -1 }).medan, 'soalan_id');
  assert.equal(sahkanLaporan({ subject_id: 1, sebab: 'lain', catatan: 'x'.repeat(500) }).ok, true);
  assert.equal(sahkanLaporan({ subject_id: 1, sebab: 'lain', catatan: 'x'.repeat(501) }).sebab, 'catatan-terlalu-panjang');
  assert.equal(sahkanLaporan({ subject_id: 1, sebab: 'lain', catatan: 5 }).ok, false);
  assert.equal(sahkanLaporan(null).ok, false);
  assert.equal(sahkanLaporan({ subject_id: 1, sebab: 'lain', catatan: 'a\u0000b\r\nc' }).nilai.catatan, 'ab\nc');
  assert.equal(sahkanKemaskiniLaporan({ status: 'selesai' }).ok, true);
  assert.equal(sahkanKemaskiniLaporan({ status: 'padam' }).medan, 'status');
  assert.equal(sahkanKemaskiniLaporan({ catatan_admin: 'x'.repeat(501) }).ok, false);
  assert.equal(sahkanKemaskiniLaporan({ catatan_admin: '' }).nilai.catatan_admin, null);
  assert.equal(sahkanKemaskiniLaporan({}).ok, false);
});

test('ahli berdaftar menghantar laporan; admin nampak dan menukar status; pelapor tidak melihat laporan orang lain', async () => {
  const { A, P, subj } = await sedia();
  const r = await P('POST', '/api/laporan', { subject_id: subj[0].id, sebab: 'salah-fakta', catatan: 'Tarikh peristiwa salah.' });
  assert.equal(r.status, 201); assert.equal(r.b.ok, true);
  const senarai = (await A('GET', '/api/admin/laporan')).b;
  assert.equal(senarai.bil_baru, 1);
  assert.equal(senarai.laporan.length, 1);
  assert.deepEqual([senarai.laporan[0].status, senarai.laporan[0].sebab, senarai.laporan[0].catatan, senarai.laporan[0].subject_tajuk, senarai.laporan[0].emel_pelapor],
    ['baru', 'salah-fakta', 'Tarikh peristiwa salah.', 'K1', 'ahli@gmail.com']);
  const id = senarai.laporan[0].id;
  let u = await A('PUT', `/api/admin/laporan/${id}`, { status: 'disemak', catatan_admin: 'Sedang disemak guru.' });
  assert.equal(u.status, 200); assert.equal(u.b.status, 'disemak'); assert.equal(u.b.catatan_admin, 'Sedang disemak guru.');
  assert.equal((await A('GET', '/api/admin/laporan')).b.laporan.length, 0); // tapis lalai: baru
  assert.equal((await A('GET', '/api/admin/laporan?status=disemak')).b.laporan.length, 1);
  assert.equal((await A('GET', '/api/admin/laporan?status=semua')).b.bil_baru, 0);
  u = await A('PUT', `/api/admin/laporan/${id}`, { status: 'selesai' });
  assert.equal(u.b.status, 'selesai');
  assert.equal((await A('PUT', `/api/admin/laporan/${id}`, { status: 'salah' })).status, 400);
  assert.equal((await A('PUT', '/api/admin/laporan/999', { status: 'selesai' })).status, 404);
});

test('akses: pelawat 401, ahli dan guru ditolak di panel (403), Origin luar ditolak', async () => {
  const { awam, P, G, subj } = await sedia();
  const badan = { subject_id: subj[0].id, sebab: 'lain' };
  assert.equal((await awam('POST', '/api/laporan', badan)).status, 401);
  assert.equal((await P('GET', '/api/admin/laporan')).status, 403);
  assert.equal((await G('GET', '/api/admin/laporan')).status, 403);
  assert.equal((await awam('GET', '/api/admin/laporan')).status, 401);
  assert.equal((await P('PUT', '/api/admin/laporan/1', { status: 'selesai' })).status, 403);
  assert.equal((await P('POST', '/api/laporan', badan, { origin: 'https://jahat.test' })).status, 403);
  assert.equal((await P('GET', '/api/laporan')).status, 404);
});

test('had 5 laporan sehari: keenam ditolak (429); pengguna lain tidak terjejas', async () => {
  const { A, P, P2, subj } = await sedia();
  for (let i = 0; i < 5; i++) assert.equal((await P('POST', '/api/laporan', { subject_id: subj[i].id, sebab: 'tiada-rujukan' })).status, 201);
  const keenam = await P('POST', '/api/laporan', { subject_id: subj[5].id, sebab: 'tiada-rujukan' });
  assert.equal(keenam.status, 429); assert.equal(keenam.b.ralat, 'had-harian'); assert.equal(keenam.b.had, 5);
  assert.equal((await P2('POST', '/api/laporan', { subject_id: subj[5].id, sebab: 'tiada-rujukan' })).status, 201);
  assert.equal((await A('GET', '/api/admin/laporan')).b.bil_baru, 6);
});

test('laporan sama (kuliah + sebab) tidak boleh dihantar dua kali dalam 24 jam; sebab lain atau kuliah lain dibenarkan', async () => {
  const { P, subj } = await sedia();
  assert.equal((await P('POST', '/api/laporan', { subject_id: subj[0].id, sebab: 'salah-fakta' })).status, 201);
  const dua = await P('POST', '/api/laporan', { subject_id: subj[0].id, sebab: 'salah-fakta' });
  assert.equal(dua.status, 409); assert.equal(dua.b.ralat, 'laporan-pendua');
  assert.equal((await P('POST', '/api/laporan', { subject_id: subj[0].id, sebab: 'lain' })).status, 201);
  assert.equal((await P('POST', '/api/laporan', { subject_id: subj[1].id, sebab: 'salah-fakta' })).status, 201);
});

test('pengesahan di server: sebab tidak sah, catatan terlalu panjang, kuliah draf atau tidak wujud, JSON sahaja', async () => {
  const { P, subj, draf } = await sedia();
  assert.equal((await P('POST', '/api/laporan', { subject_id: subj[0].id, sebab: 'spam' })).b.medan, 'sebab');
  assert.equal((await P('POST', '/api/laporan', { subject_id: subj[0].id, sebab: 'lain', catatan: 'x'.repeat(501) })).b.ralat, 'catatan-terlalu-panjang');
  assert.equal((await P('POST', '/api/laporan', { subject_id: draf.id, sebab: 'lain' })).status, 404);
  assert.equal((await P('POST', '/api/laporan', { subject_id: 9999, sebab: 'lain' })).status, 404);
  assert.equal((await P('POST', '/api/laporan', { sebab: 'lain' })).status, 400);
  const r = await handle(new Request(B + '/api/laporan', { method: 'POST', headers: { cookie: await sesi(repoPalsu(), 'x@gmail.com'), 'content-type': 'text/plain' }, body: 'x' }), env, { repo: repoPalsu(), now: NOW });
  assert.ok([401, 415].includes(r.status));
});

test('laporan soalan: hanya soalan awam (sudah dijawab, tidak disorok) pada kuliah yang sama', async () => {
  const { A, P, P2, subj } = await sedia();
  const q = (await P('POST', `/api/subject/${subj[0].id}/soalan`, { teks: 'Apakah maksud istilah ini?' })).b;
  assert.equal((await P2('POST', '/api/laporan', { subject_id: subj[0].id, soalan_id: q.id, sebab: 'lain' })).status, 400); // belum dijawab
  await A('PUT', `/api/admin/soalan/${q.id}`, { jawapan: 'Ini jawapannya.' });
  assert.equal((await P2('POST', '/api/laporan', { subject_id: subj[1].id, soalan_id: q.id, sebab: 'lain' })).status, 400); // kuliah lain
  assert.equal((await P2('POST', '/api/laporan', { subject_id: subj[0].id, soalan_id: q.id, sebab: 'salah-fakta', catatan: 'Jawapan keliru' })).status, 201);
  const l = (await A('GET', '/api/admin/laporan')).b.laporan[0];
  assert.equal(l.soalan_id, q.id); assert.equal(l.soalan_teks, 'Apakah maksud istilah ini?');
  await A('POST', `/api/admin/soalan/${q.id}/sorok`, { tersembunyi: true });
  assert.equal((await P('POST', '/api/laporan', { subject_id: subj[0].id, soalan_id: q.id, sebab: 'lain' })).status, 400);
});

test('XSS: catatan dengan HTML disimpan sebagai teks mentah dan dihantar sebagai JSON', async () => {
  const { A, P, subj } = await sedia();
  const xss = '<script>alert(1)</script><img src=x onerror=alert(2)>';
  assert.equal((await P('POST', '/api/laporan', { subject_id: subj[0].id, sebab: 'lain', catatan: xss })).status, 201);
  const l = (await A('GET', '/api/admin/laporan')).b.laporan[0];
  assert.equal(l.catatan, xss);
});

test('laporan pada kuliah yang dipadam turut dipadam; kuliah dalam siri berkunci golongan tidak boleh dilapor oleh yang tidak layak (403)', async () => {
  const { A, repo, P, subj, c } = await sedia();
  await P('POST', '/api/laporan', { subject_id: subj[6].id, sebab: 'lain' });
  await A('PUT', `/api/admin/subject/${subj[6].id}`, { status: 'draf' });
  await A('DELETE', `/api/admin/subject/${subj[6].id}`);
  assert.equal((await A('GET', '/api/admin/laporan?status=semua')).b.laporan.length, 0);
  await A('PUT', `/api/admin/course/${c.id}`, { golongan: 'ahli' });
  assert.equal((await P('POST', '/api/laporan', { subject_id: subj[0].id, sebab: 'lain' })).status, 403); // siri berkunci: ahli biasa tidak layak menonton, jadi tidak boleh melapor
  assert.equal(await repo.bilLaporanBaharu(), 0);
});
