// Video Google Drive, thumbnail siri/kuliah, gambar guru dan laluan gambar automatik (/api/gambar/...).
import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/worker.js';
import { repoPalsu } from './repo-palsu.js';
import { tokenBaru, hashToken } from '../src/lib/sesi.js';

const NOW = Date.parse('2026-11-18T02:00:00Z');
const B = 'https://haraki.test';
const env = { ADMIN_EMELS: 'admin@gmail.com' };
const DRIVE = '1FEln2yyKXbFFydEghgIyUoW9ygWaRwxO', DRIVE2 = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345', IMG = '1ZyXwVuTsRqPoNmLkJiHgFeDcBa987654';
const YT = 'dQw4w9WgXcQ', YT2 = 'eeeeeeeeeee';
const pautanDrive = (id) => `https://drive.google.com/file/d/${id}/view?usp=drive_link`;

async function sesi(repo, emel) {
  const p = await repo.simpanPengguna({ emel, sub: 's-' + emel, nama: emel }, 't');
  const token = tokenBaru();
  await repo.ciptaSesi(await hashToken(token), p.id, new Date(NOW + 864e5).toISOString());
  return 'kh_sesi=' + token;
}
const klien = (repo, kuki) => async (kaedah, laluan, badan) => {
  const r = await handle(new Request(B + laluan, { method: kaedah, redirect: 'manual', headers: { ...(kuki ? { cookie: kuki } : {}), ...(badan !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: badan === undefined ? undefined : JSON.stringify(badan) }), env, { repo, now: NOW });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch { /* bukan JSON */ }
  return { status: r.status, b: j, teks: t, lokasi: r.headers.get('location'), kepala: r.headers };
};

async function sedia() {
  const repo = repoPalsu();
  const A = klien(repo, await sesi(repo, 'admin@gmail.com'));
  await A('POST', '/api/admin/guru', { emel: 'guru@gmail.com', nama: 'Ustaz Ali' });
  const G = klien(repo, await sesi(repo, 'guru@gmail.com'));
  const P = klien(repo, await sesi(repo, 'ahli@gmail.com'));
  const awam = klien(repo, null);
  // Siri 1: kuliah pertama YouTube terbuka (pratonton), kuliah kedua Drive tertutup
  const c1 = (await A('POST', '/api/admin/course', { tajuk: 'Siri Satu', status: 'terbit', guru_emel: 'guru@gmail.com' })).b;
  const s1 = (await A('POST', `/api/admin/course/${c1.id}/subject`, { tajuk: 'Terbuka YT', video: `https://youtu.be/${YT}`, status: 'terbit', pratonton: true })).b;
  const s2 = (await A('POST', `/api/admin/course/${c1.id}/subject`, { tajuk: 'Tertutup Drive', video: pautanDrive(DRIVE), status: 'terbit' })).b;
  // Siri 2: semua tertutup (tiada video terbuka)
  const c2 = (await A('POST', '/api/admin/course', { tajuk: 'Siri Dua', status: 'terbit' })).b;
  const s3 = (await A('POST', `/api/admin/course/${c2.id}/subject`, { tajuk: 'Tertutup YT', video: `https://youtu.be/${YT2}`, status: 'terbit' })).b;
  return { repo, A, G, P, awam, c1, c2, s1, s2, s3 };
}

test('Drive: pautan disimpan sebagai ID dan sumber drive; ahli layak dapat video_id dan video_sumber; pelawat tidak', async () => {
  const { A, P, awam, c1, s2 } = await sedia();
  const dalam = (await A('GET', `/api/admin/course/${c1.id}`)).b.subject.find((x) => x.id === s2.id);
  assert.deepEqual([dalam.video_id, dalam.video_sumber], [DRIVE, 'drive']);
  const ahli = (await P('GET', `/api/subject/${s2.id}`)).b.subject;
  assert.deepEqual([ahli.video_id, ahli.video_sumber], [DRIVE, 'drive']);
  const pelawat = await awam('GET', `/api/subject/${s2.id}`);
  assert.equal('video_id' in pelawat.b.subject, false);
  assert.equal('video_sumber' in pelawat.b.subject, false);
  assert.equal(pelawat.teks.includes(DRIVE), false);
  assert.equal((await A('PUT', `/api/admin/subject/${s2.id}`, { video: 'https://drive.google.com/drive/folders/' + DRIVE })).b.ralat, 'video-tidak-sah');
  // tukar kembali ke YouTube menukar sumber
  const k = (await A('PUT', `/api/admin/subject/${s2.id}`, { video: `https://youtu.be/${YT2}` })).b;
  assert.deepEqual([k.video_id, k.video_sumber], [YT2, 'youtube']);
});

test('senarai dan halaman siri TIDAK mengandungi ID video (YouTube atau Drive) walaupun gambar automatik ada', async () => {
  const { P, awam, c1 } = await sedia();
  for (const kl of [awam, P]) {
    for (const laluan of ['/api/course', `/api/course/${c1.slug}`]) {
      const t = (await kl('GET', laluan)).teks;
      for (const id of [YT, YT2, DRIVE]) assert.equal(t.includes(id), false, `${laluan} bocor ${id}`);
    }
  }
});

test('gambar automatik siri: pelawat hanya jika ada video terbuka; ahli berdaftar untuk semua; laluan mengalih ikut kelayakan', async () => {
  const { awam, P, c1, c2 } = await sedia();
  const pel = (await awam('GET', '/api/course')).b;
  assert.equal(pel.find((c) => c.id === c1.id).gambar, `/api/gambar/course/${c1.id}`);
  assert.equal(pel.find((c) => c.id === c2.id).gambar, null); // semua tertutup: tiada gambar automatik untuk pelawat
  const ahli = (await P('GET', '/api/course')).b;
  assert.equal(ahli.find((c) => c.id === c2.id).gambar, `/api/gambar/course/${c2.id}`);
  const r1 = await awam('GET', `/api/gambar/course/${c1.id}`);
  assert.equal(r1.status, 302);
  assert.equal(r1.lokasi, `https://i.ytimg.com/vi/${YT}/hqdefault.jpg`);
  assert.match(r1.kepala.get('cache-control'), /private/);
  assert.equal((await awam('GET', `/api/gambar/course/${c2.id}`)).status, 404);
  assert.equal((await P('GET', `/api/gambar/course/${c2.id}`)).lokasi, `https://i.ytimg.com/vi/${YT2}/hqdefault.jpg`);
});

test('gambar automatik kuliah: pelawat hanya kuliah terbuka; Drive guna thumbnail Drive; draf dan tiada kuliah 404', async () => {
  const { awam, P, A, c1, s1, s2 } = await sedia();
  assert.equal((await awam('GET', `/api/gambar/subject/${s1.id}`)).lokasi, `https://i.ytimg.com/vi/${YT}/hqdefault.jpg`);
  assert.equal((await awam('GET', `/api/gambar/subject/${s2.id}`)).status, 404); // tertutup untuk pelawat: ID tidak didedahkan
  assert.equal((await P('GET', `/api/gambar/subject/${s2.id}`)).lokasi, `https://drive.google.com/thumbnail?id=${DRIVE}&sz=w800`);
  const draf = (await A('POST', `/api/admin/course/${c1.id}/subject`, { tajuk: 'Draf', video: `https://youtu.be/ffffffffffg`, status: 'draf', pratonton: true })).b;
  assert.equal((await P('GET', `/api/gambar/subject/${draf.id}`)).status, 404);
  assert.equal((await P('GET', '/api/gambar/subject/9999')).status, 404);
  assert.equal((await P('GET', '/api/gambar/subject/abc')).status, 404);
  assert.equal((await P('GET', '/api/gambar/lain/1')).status, 404);
  assert.equal((await P('POST', `/api/gambar/subject/${s1.id}`)).status, 404);
});

test('siri berkunci golongan: tiada gambar automatik atau pengalihan untuk yang tidak layak', async () => {
  const { A, P, awam, c1, s1 } = await sedia();
  await A('PUT', `/api/admin/course/${c1.id}`, { golongan: 'pelajar' });
  const senarai = (await P('GET', '/api/course')).b.find((c) => c.id === c1.id);
  assert.equal(senarai.terkunci_golongan, true);
  assert.equal(senarai.gambar, null);
  assert.equal((await P('GET', `/api/gambar/course/${c1.id}`)).status, 404);
  assert.equal((await P('GET', `/api/gambar/subject/${s1.id}`)).status, 404);
  assert.equal((await awam('GET', `/api/gambar/subject/${s1.id}`)).status, 404);
});

test('thumbnail pilihan: Drive sahaja; menggantikan gambar automatik; senarai kuliah membawa gambar; URL luar ditolak', async () => {
  const { A, awam, P, c1, s1, s2 } = await sedia();
  const k = (await A('PUT', `/api/admin/course/${c1.id}`, { thumbnail: pautanDrive(IMG) })).b;
  assert.equal(k.thumbnail, `drive:${IMG}`);
  assert.equal((await awam('GET', '/api/course')).b.find((c) => c.id === c1.id).gambar, `https://drive.google.com/thumbnail?id=${IMG}&sz=w800`);
  assert.equal((await A('PUT', `/api/admin/course/${c1.id}`, { thumbnail: 'https://contoh.my/a.jpg' })).b.ralat, 'pautan-gambar-tidak-sah');
  await A('PUT', `/api/admin/subject/${s2.id}`, { thumbnail: pautanDrive(DRIVE2) });
  const senarai = (await P('GET', `/api/course/${c1.slug}`)).b;
  assert.equal(senarai.subject.find((s) => s.id === s2.id).gambar, `https://drive.google.com/thumbnail?id=${DRIVE2}&sz=w800`);
  assert.equal(senarai.subject.find((s) => s.id === s1.id).gambar, `/api/gambar/subject/${s1.id}`);
  assert.equal((await A('PUT', `/api/admin/course/${c1.id}`, { thumbnail: '' })).b.thumbnail, null);
  // thumbnail pilihan pada kuliah tertutup tidak mendedahkan ID video kepada pelawat
  const pel = (await awam('GET', `/api/course/${c1.slug}`)).b.subject.find((s) => s.id === s2.id);
  assert.equal(pel.gambar, `https://drive.google.com/thumbnail?id=${DRIVE2}&sz=w800`);
  assert.equal(JSON.stringify(pel).includes(DRIVE + '"'), false);
});

test('gambar guru: admin sahaja; dipapar kepada awam sebagai thumbnail Drive; pautan luar ditolak; emel tidak bocor', async () => {
  const { A, G, P, awam, c1 } = await sedia();
  const r = await A('PUT', '/api/admin/guru/guru%40gmail.com', { gambar: pautanDrive(IMG) });
  assert.equal(r.status, 200);
  assert.equal(r.b.find((g) => g.emel === 'guru@gmail.com').gambar, `drive:${IMG}`);
  const d = (await awam('GET', `/api/course/${c1.slug}`)).b;
  assert.equal(d.guru_profil.gambar, `https://drive.google.com/thumbnail?id=${IMG}&sz=w800`);
  assert.equal(JSON.stringify(d).includes('guru@gmail.com'), false);
  assert.equal((await A('PUT', '/api/admin/guru/guru%40gmail.com', { gambar: 'https://contoh.my/muka.jpg' })).b.ralat, 'pautan-gambar-tidak-sah');
  assert.equal((await G('PUT', '/api/admin/guru/guru%40gmail.com', { gambar: pautanDrive(DRIVE2) })).status, 403);
  assert.equal((await P('PUT', '/api/admin/guru/guru%40gmail.com', { gambar: pautanDrive(DRIVE2) })).status, 403);
  // menyimpan nama sahaja tidak memadam gambar
  await A('PUT', '/api/admin/guru/guru%40gmail.com', { nama: 'Ustaz Ali 2' });
  assert.equal((await A('GET', '/api/admin/guru')).b[0].gambar, `drive:${IMG}`);
  await A('PUT', '/api/admin/guru/guru%40gmail.com', { gambar: '' });
  assert.equal((await awam('GET', `/api/course/${c1.slug}`)).b.guru_profil.gambar, null);
});

test('guru menukar video atau thumbnail kuliah terbit: masuk kelulusan; selepas lulus sumber dan ID berubah bersama', async () => {
  const { A, G, awam, P, c1, s1 } = await sedia();
  const r = await G('PUT', `/api/admin/subject/${s1.id}`, { video: pautanDrive(DRIVE2), thumbnail: pautanDrive(IMG) });
  assert.equal(r.status, 202);
  assert.deepEqual(Object.keys(r.b.semakan).sort(), ['thumbnail', 'video_id', 'video_sumber']);
  assert.equal((await awam('GET', `/api/subject/${s1.id}`)).b.subject.video_id, YT); // belum berubah
  const sem = (await A('GET', '/api/admin/kelulusan')).b.perubahan[0];
  await A('POST', `/api/admin/kelulusan/perubahan/${sem.id}/lulus`);
  const kini = (await awam('GET', `/api/subject/${s1.id}`)).b.subject;
  assert.deepEqual([kini.video_id, kini.video_sumber, kini.gambar], [DRIVE2, 'drive', `https://drive.google.com/thumbnail?id=${IMG}&sz=w800`]);
  // guru tidak boleh menetapkan video kosong pada kuliah terbit
  assert.equal((await G('PUT', `/api/admin/subject/${s1.id}`, { video: '' })).b.ralat, 'video-diperlukan');
  assert.ok(P && c1);
});

test('panel: butiran siri dan senarai kelulusan membawa video_sumber dan thumbnail untuk pratonton', async () => {
  const { A, G, c1, s2 } = await sedia();
  await A('PUT', `/api/admin/subject/${s2.id}`, { thumbnail: pautanDrive(IMG) });
  const dalam = (await A('GET', `/api/admin/course/${c1.id}`)).b.subject.find((x) => x.id === s2.id);
  assert.deepEqual([dalam.video_sumber, dalam.thumbnail], ['drive', `drive:${IMG}`]);
  const baru = (await G('POST', `/api/admin/course/${c1.id}/subject`, { tajuk: 'Guru Drive', video: pautanDrive(DRIVE2), status: 'menunggu' })).b;
  const q = (await A('GET', '/api/admin/kelulusan')).b.subject.find((x) => x.id === baru.id);
  assert.deepEqual([q.video_sumber, q.video_id], ['drive', DRIVE2]);
});
