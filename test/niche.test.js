// Ujian ubah suai niche (Fasa 2): kategori (F-12), rujukan (F-13), profil guru (F-14), penafian dan privasi (F-15).
import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/worker.js';
import { repoPalsu } from './repo-palsu.js';
import { tokenBaru, hashToken } from '../src/lib/sesi.js';
import { sahkanSubject, sahkanCourse, sahkanKategori, sahkanProfilGuru } from '../src/lib/kandungan.js';
import { sahkanTetapan, LALAI } from '../src/lib/tetapan.js';

const NOW = Date.parse('2026-11-17T02:00:00Z');
const B = 'https://haraki.test';
const env = { ADMIN_EMELS: 'admin@gmail.com' };
const V1 = 'aaaaaaaaaaa', V2 = 'bbbbbbbbbbb';

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

async function sedia() {
  const repo = repoPalsu();
  const A = klien(repo, await sesi(repo, 'admin@gmail.com'));
  await A('POST', '/api/admin/guru', { emel: 'guru@gmail.com', nama: 'Ustaz Ali' });
  const G = klien(repo, await sesi(repo, 'guru@gmail.com'));
  const P = klien(repo, await sesi(repo, 'ahli@gmail.com'));
  const awam = klien(repo, null);
  return { repo, A, G, P, awam };
}

// ---------- pengesahan (fungsi tulen) ----------

test('rujukan: maks 4,000 aksara, kosong jadi null, baris baharu dikekalkan, aksara kawalan dibuang', () => {
  assert.equal(sahkanSubject({ tajuk: 'x', rujukan: 'a'.repeat(4000) }).ok, true);
  assert.deepEqual(sahkanSubject({ tajuk: 'x', rujukan: 'a'.repeat(4001) }), { ok: false, sebab: 'terlalu-panjang', medan: 'rujukan' });
  assert.equal(sahkanSubject({ tajuk: 'x', rujukan: '   ' }).nilai.rujukan, null);
  assert.equal(sahkanSubject({ tajuk: 'x', rujukan: 'baris 1\r\nbaris 2\u0000' }).nilai.rujukan, 'baris 1\nbaris 2');
  assert.equal(sahkanSubject({ rujukan: 5 }, { separa: true }).ok, false);
  assert.equal(sahkanSubject({ tajuk: 'x' }).nilai.rujukan, undefined);
});

test('kategori_id pada course: integer positif atau null', () => {
  assert.equal(sahkanCourse({ tajuk: 'x', kategori_id: 3 }).nilai.kategori_id, 3);
  assert.equal(sahkanCourse({ tajuk: 'x', kategori_id: null }).nilai.kategori_id, null);
  assert.equal(sahkanCourse({ tajuk: 'x', kategori_id: 'a' }).ok, false);
  assert.equal(sahkanCourse({ tajuk: 'x', kategori_id: 0 }).ok, false);
  assert.equal('kategori_id' in sahkanCourse({ tajuk: 'x' }).nilai, false);
});

test('kategori: nama 2-60 aksara; profil guru: kelayakan 200, institusi 120, bio 600', () => {
  assert.equal(sahkanKategori({ nama: 'A' }).ok, false);
  assert.equal(sahkanKategori({ nama: 'x'.repeat(61) }).ok, false);
  assert.equal(sahkanKategori({ nama: '  Akidah  ' }).nilai.nama, 'Akidah');
  assert.equal(sahkanKategori({}, { separa: true }).ok, true);
  assert.equal(sahkanProfilGuru({ kelayakan: 'x'.repeat(201) }).ok, false);
  assert.equal(sahkanProfilGuru({ institusi: 'x'.repeat(121) }).ok, false);
  assert.equal(sahkanProfilGuru({ bio: 'x'.repeat(601) }).ok, false);
  assert.equal(sahkanProfilGuru({ bio: 'x'.repeat(600) }).ok, true);
  assert.deepEqual(sahkanProfilGuru({ bio: '' }).nilai, { bio: null });
});

test('penafian dan privasi: ada lalai, boleh diubah, had panjang dikuatkuasa', () => {
  assert.match(LALAI.penafian_teks, /tidak menghukum individu/);
  assert.match(LALAI.privasi_teks, /Hanya admin boleh melihat emel/);
  assert.equal(sahkanTetapan({ penafian_teks: 'x'.repeat(800) }).ok, true);
  assert.equal(sahkanTetapan({ penafian_teks: 'x'.repeat(801) }).ok, false);
  assert.equal(sahkanTetapan({ privasi_teks: 'x'.repeat(501) }).ok, false);
  assert.equal(sahkanTetapan({ penafian_teks: 'baris 1\nbaris 2' }).nilai.penafian_teks, 'baris 1\nbaris 2');
});

// ---------- API kategori ----------

test('kategori: admin cipta, ubah nama, susun; slug dijana dan unik', async () => {
  const { A } = await sedia();
  let r = await A('POST', '/api/admin/kategori', { nama: 'Sejarah Firqah' });
  assert.equal(r.status, 201);
  assert.equal(r.b[0].slug, 'sejarah-firqah');
  r = await A('POST', '/api/admin/kategori', { nama: 'Sejarah Firqah' });
  assert.deepEqual(r.b.map((k) => k.slug), ['sejarah-firqah', 'sejarah-firqah-2']);
  r = await A('PUT', `/api/admin/kategori/${r.b[0].id}`, { nama: 'Sejarah Mazhab', urutan: 9 });
  assert.equal(r.b.find((k) => k.id === 1).nama, 'Sejarah Mazhab');
  assert.equal(r.b.find((k) => k.id === 1).slug, 'sejarah-firqah'); // slug tidak berubah
  assert.equal((await A('POST', '/api/admin/kategori', { nama: 'A' })).status, 400);
  assert.equal((await A('PUT', '/api/admin/kategori/999', { nama: 'Abc' })).status, 404);
});

test('kategori: guru boleh baca tetapi tidak boleh cipta, ubah atau padam; pelawat dan ahli ditolak', async () => {
  const { A, G, P, awam } = await sedia();
  await A('POST', '/api/admin/kategori', { nama: 'Akidah' });
  assert.equal((await G('GET', '/api/admin/kategori')).status, 200);
  assert.equal((await G('POST', '/api/admin/kategori', { nama: 'Baharu' })).status, 403);
  assert.equal((await G('PUT', '/api/admin/kategori/1', { nama: 'Ubah' })).status, 403);
  assert.equal((await G('DELETE', '/api/admin/kategori/1')).status, 403);
  assert.equal((await P('GET', '/api/admin/kategori')).status, 403);
  assert.equal((await awam('GET', '/api/admin/kategori')).status, 401);
  assert.equal((await awam('POST', '/api/admin/kategori', { nama: 'Akidah' })).status, 401);
});

test('kategori: tidak boleh dipadam selagi dipakai siri; boleh selepas siri dikosongkan', async () => {
  const { A } = await sedia();
  const kat = (await A('POST', '/api/admin/kategori', { nama: 'Akidah' })).b[0];
  const c = (await A('POST', '/api/admin/course', { tajuk: 'Siri 1', kategori_id: kat.id })).b;
  assert.equal(c.kategori_id, kat.id);
  const t = await A('DELETE', `/api/admin/kategori/${kat.id}`);
  assert.equal(t.status, 409); assert.equal(t.b.ralat, 'kategori-digunakan');
  await A('PUT', `/api/admin/course/${c.id}`, { kategori_id: null });
  assert.equal((await A('DELETE', `/api/admin/kategori/${kat.id}`)).status, 200);
});

test('course: kategori_id yang tidak wujud ditolak', async () => {
  const { A } = await sedia();
  assert.equal((await A('POST', '/api/admin/course', { tajuk: 'S', kategori_id: 77 })).b.ralat, 'kategori-tidak-sah');
  const c = (await A('POST', '/api/admin/course', { tajuk: 'S' })).b;
  assert.equal((await A('PUT', `/api/admin/course/${c.id}`, { kategori_id: 77 })).status, 400);
});

test('penapis kategori: hanya siri kategori itu muncul; slug tidak dikenali = kosong; senarai kategori awam ikut siri terbit', async () => {
  const { A, awam } = await sedia();
  const k1 = (await A('POST', '/api/admin/kategori', { nama: 'Akidah' })).b[0];
  const k2 = (await A('POST', '/api/admin/kategori', { nama: 'Sejarah' })).b[1];
  await A('POST', '/api/admin/kategori', { nama: 'Kosong' });
  const buat = async (tajuk, kategori_id, status = 'terbit') => {
    const c = (await A('POST', '/api/admin/course', { tajuk, kategori_id, status })).b;
    await A('POST', `/api/admin/course/${c.id}/subject`, { tajuk: 'K1', video: V1, status: 'terbit' });
    return c;
  };
  await buat('Siri Akidah', k1.id); await buat('Siri Sejarah', k2.id); await buat('Tanpa kategori', null); await buat('Draf Akidah', k1.id, 'draf');
  assert.deepEqual((await awam('GET', '/api/course')).b.map((c) => c.tajuk).sort(), ['Siri Akidah', 'Siri Sejarah', 'Tanpa kategori']);
  assert.deepEqual((await awam('GET', '/api/course?kategori=akidah')).b.map((c) => c.tajuk), ['Siri Akidah']);
  assert.equal((await awam('GET', '/api/course?kategori=akidah')).b[0].kategori.nama, 'Akidah');
  assert.equal((await awam('GET', '/api/course?kategori=tiada')).b.length, 0);
  // kategori tanpa siri terbit (Kosong) dan siri draf tidak dikira
  const senarai = (await awam('GET', '/api/kategori')).b;
  assert.deepEqual(senarai.map((k) => [k.slug, k.bil_course]), [['akidah', 1], ['sejarah', 1]]);
  assert.equal(JSON.stringify(senarai).includes('"emel"'), false);
});

test('guru: kategori pada siri terbit masuk kelulusan; pada siri draf terus disimpan', async () => {
  const { A, G } = await sedia();
  const k = (await A('POST', '/api/admin/kategori', { nama: 'Akidah' })).b[0];
  const c = (await G('POST', '/api/admin/course', { tajuk: 'Siri guru', kategori_id: k.id })).b;
  assert.equal(c.kategori_id, k.id);
  await G('POST', `/api/admin/course/${c.id}/subject`, { tajuk: 'K1', video: V1 });
  await A('PUT', `/api/admin/course/${c.id}`, { status: 'terbit' });
  const k2 = (await A('POST', '/api/admin/kategori', { nama: 'Sejarah' })).b[1];
  const r = await G('PUT', `/api/admin/course/${c.id}`, { kategori_id: k2.id });
  assert.equal(r.status, 202); assert.equal(r.b.menunggu_kelulusan, true);
  assert.equal((await A('GET', `/api/admin/course/${c.id}`)).b.kategori_id, k.id); // belum berubah
  const sem = (await A('GET', '/api/admin/kelulusan')).b.perubahan[0];
  assert.deepEqual(sem.perubahan, { kategori_id: k2.id });
  await A('POST', `/api/admin/kelulusan/perubahan/${sem.id}/lulus`);
  assert.equal((await A('GET', `/api/admin/course/${c.id}`)).b.kategori_id, k2.id);
});

// ---------- rujukan ----------

async function siriDenganRujukan() {
  const s = await sedia();
  const c = (await s.A('POST', '/api/admin/course', { tajuk: 'Siri', status: 'terbit' })).b;
  const buka = (await s.A('POST', `/api/admin/course/${c.id}/subject`, { tajuk: 'Terbuka', video: V1, pratonton: true, status: 'terbit', rujukan: '1. Kitab al-Milal wa al-Nihal, j. 1, m/s 20\n2. قال الله تعالى: ﴿إِنَّ الدِّينَ عِندَ اللَّهِ الْإِسْلَامُ﴾' })).b;
  const tutup = (await s.A('POST', `/api/admin/course/${c.id}/subject`, { tajuk: 'Tertutup', video: V2, status: 'terbit', rujukan: 'Rujukan tertutup' })).b;
  return { ...s, c, buka, tutup };
}

test('rujukan: disimpan dengan teks Arab utuh; diserahkan kepada yang layak sahaja', async () => {
  const { awam, P, buka, tutup } = await siriDenganRujukan();
  const lihatBuka = (await awam('GET', `/api/subject/${buka.id}`)).b.subject;
  assert.equal(lihatBuka.video_id, V1);
  assert.match(lihatBuka.rujukan, /الْإِسْلَامُ/);
  assert.match(lihatBuka.rujukan, /\n2\./);
  // Pelawat pada kuliah tidak terbuka: tiada video_id dan tiada rujukan dalam respons mentah
  const mentah = await awam('GET', `/api/subject/${tutup.id}`);
  assert.equal(mentah.b.subject.boleh_tonton, false);
  assert.equal('video_id' in mentah.b.subject, false);
  assert.equal('rujukan' in mentah.b.subject, false);
  assert.equal(mentah.teks.includes(V2), false);
  assert.equal(mentah.teks.includes('Rujukan tertutup'), false);
  // Ahli berdaftar layak
  assert.equal((await P('GET', `/api/subject/${tutup.id}`)).b.subject.rujukan, 'Rujukan tertutup');
});

test('rujukan: senarai kuliah dalam halaman siri tidak membawa rujukan', async () => {
  const { awam, c } = await siriDenganRujukan();
  const r = await awam('GET', `/api/course/${c.slug}`);
  assert.equal(r.teks.includes('Rujukan tertutup'), false);
  assert.equal(r.teks.includes('Kitab al-Milal'), false);
});

test('rujukan: had 4,000 aksara di API; guru menyunting rujukan siri terbit melalui kelulusan', async () => {
  const { A, G, c, buka } = await siriDenganRujukan();
  assert.equal((await A('PUT', `/api/admin/subject/${buka.id}`, { rujukan: 'a'.repeat(4001) })).status, 400);
  assert.equal((await A('PUT', `/api/admin/subject/${buka.id}`, { rujukan: 'a'.repeat(4000) })).status, 200);
  // guru bukan pemilik siri ini: ditolak sebagai tidak wujud
  assert.equal((await G('PUT', `/api/admin/subject/${buka.id}`, { rujukan: 'x' })).status, 404);
  await A('PUT', `/api/admin/course/${c.id}`, { guru_emel: 'guru@gmail.com' });
  const r = await G('PUT', `/api/admin/subject/${buka.id}`, { rujukan: 'Rujukan guru' });
  assert.equal(r.status, 202);
  assert.equal((await A('GET', `/api/admin/course/${c.id}`)).b.subject.find((s) => s.id === buka.id).rujukan, 'a'.repeat(4000)); // belum berubah
  const sem = (await A('GET', '/api/admin/kelulusan')).b.perubahan[0];
  await A('POST', `/api/admin/kelulusan/perubahan/${sem.id}/lulus`);
  assert.equal((await A('GET', `/api/admin/course/${c.id}`)).b.subject.find((s) => s.id === buka.id).rujukan, 'Rujukan guru');
});

test('XSS: teks berbahaya disimpan dan dihantar sebagai teks mentah dalam JSON (paparan di pelayar melalui h())', async () => {
  const { repo, A, awam, c, buka } = await siriDenganRujukan();
  const xss = '<script>alert(1)</script><img src=x onerror=alert(2)>';
  await A('PUT', `/api/admin/subject/${buka.id}`, { rujukan: xss });
  await A('POST', '/api/admin/guru', { emel: 'guru@gmail.com', nama: 'G', bio: xss, kelayakan: xss, institusi: xss });
  await A('PUT', `/api/admin/course/${c.id}`, { guru_emel: 'guru@gmail.com' });
  assert.equal((await awam('GET', `/api/subject/${buka.id}`)).b.subject.rujukan, xss);
  assert.equal((await awam('GET', `/api/course/${c.slug}`)).b.guru_profil.bio, xss);
  const mentah = await handle(new Request(B + `/api/course/${c.slug}`), env, { repo, now: NOW });
  assert.match(mentah.headers.get('content-type') || '', /application\/json/); // bukan HTML: pelayar tidak menjalankannya
});

// ---------- profil guru ----------

test('profil guru: admin mengisi; dipapar kepada awam tanpa emel; guru tidak boleh mengubah sendiri', async () => {
  const { A, G, awam, P } = await sedia();
  const c = (await A('POST', '/api/admin/course', { tajuk: 'Siri', status: 'terbit', guru_emel: 'guru@gmail.com' })).b;
  await A('POST', `/api/admin/course/${c.id}/subject`, { tajuk: 'K1', video: V1, status: 'terbit' });
  // belum diisi: nama sahaja
  let d = (await awam('GET', `/api/course/${c.slug}`)).b;
  assert.deepEqual(d.guru_profil, { nama: 'Ustaz Ali', kelayakan: null, institusi: null, bio: null });
  const r = await A('PUT', '/api/admin/guru/guru%40gmail.com', { kelayakan: 'Sarjana Usuluddin; Tauliah JAIS', institusi: 'Institut Ilmu', bio: 'Mengajar sejak 2010.' });
  assert.equal(r.status, 200);
  assert.equal(r.b[0].kelayakan, 'Sarjana Usuluddin; Tauliah JAIS');
  d = (await awam('GET', `/api/course/${c.slug}`)).b;
  assert.deepEqual(d.guru_profil, { nama: 'Ustaz Ali', kelayakan: 'Sarjana Usuluddin; Tauliah JAIS', institusi: 'Institut Ilmu', bio: 'Mengajar sejak 2010.' });
  assert.equal(JSON.stringify(d).includes('guru@gmail.com'), false);
  // guru dan ahli ditolak oleh server
  assert.equal((await G('PUT', '/api/admin/guru/guru%40gmail.com', { kelayakan: 'Profesor Agung' })).status, 403);
  assert.equal((await G('POST', '/api/admin/guru', { emel: 'guru@gmail.com', nama: 'x', kelayakan: 'y' })).status, 403);
  assert.equal((await P('PUT', '/api/admin/guru/guru%40gmail.com', { bio: 'x' })).status, 403);
  assert.equal((await awam('PUT', '/api/admin/guru/guru%40gmail.com', { bio: 'x' })).status, 401);
  assert.equal((await A('GET', '/api/admin/guru')).b[0].kelayakan, 'Sarjana Usuluddin; Tauliah JAIS');
  // profil tidak hilang bila admin menukar nama sahaja
  await A('PUT', '/api/admin/guru/guru%40gmail.com', { nama: 'Ustaz Ali Baharu' });
  assert.equal((await A('GET', '/api/admin/guru')).b[0].kelayakan, 'Sarjana Usuluddin; Tauliah JAIS');
});

test('profil guru: had panjang dan guru tidak wujud', async () => {
  const { A } = await sedia();
  assert.equal((await A('PUT', '/api/admin/guru/guru%40gmail.com', { bio: 'x'.repeat(601) })).status, 400);
  assert.equal((await A('PUT', '/api/admin/guru/tiada%40gmail.com', { bio: 'x' })).status, 404);
  assert.equal((await A('POST', '/api/admin/guru', { emel: 'baru@gmail.com', nama: 'Baru', kelayakan: 'x'.repeat(201) })).status, 400);
  const r = await A('POST', '/api/admin/guru', { emel: 'baru@gmail.com', nama: 'Baru', kelayakan: 'Ijazah', institusi: 'Madrasah' });
  assert.equal(r.status, 201);
  assert.equal(r.b.find((g) => g.emel === 'baru@gmail.com').institusi, 'Madrasah');
});

// ---------- penafian dan privasi ----------

test('penafian: ada pada /api/konfig dengan lalai Lampiran A; admin ubah tanpa kod; guru tidak boleh', async () => {
  const { A, G, awam } = await sedia();
  let k = (await awam('GET', '/api/konfig')).b.laman;
  assert.match(k.penafian_teks, /Kuliah di laman ini menerangkan pelbagai fahaman/);
  assert.match(k.privasi_teks, /emel/);
  const r = await A('PUT', '/api/admin/tetapan', { penafian_teks: 'Penafian baharu.\nBaris dua.', privasi_teks: 'Privasi baharu.' });
  assert.equal(r.status, 200);
  k = (await awam('GET', '/api/konfig')).b.laman;
  assert.equal(k.penafian_teks, 'Penafian baharu.\nBaris dua.');
  assert.equal(k.privasi_teks, 'Privasi baharu.');
  assert.equal((await G('PUT', '/api/admin/tetapan', { penafian_teks: 'x' })).status, 403);
  // kosong = kembali ke lalai
  await A('PUT', '/api/admin/tetapan', { penafian_teks: '' });
  assert.match((await awam('GET', '/api/konfig')).b.laman.penafian_teks, /pelbagai fahaman/);
});
