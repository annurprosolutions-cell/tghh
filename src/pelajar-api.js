// API pelajar: /api/course, /api/course/<slug>, /api/subject/<id>, POST /api/subject/<id>/selesai.
// Senarai dan halaman course terbuka kepada pelawat; menonton (kecuali kuliah pratonton) dan progress perlukan log masuk.

import { json } from './lib/http.js';
import { bacaKuki, hashToken } from './lib/sesi.js';
import { hariIni } from './lib/tarikh.js';
import { keputusanSubject, subjectRingkas, subjectPenuh } from './lib/pelajar.js';
import { kepalaKandungan } from './lib/nota.js';
import { golonganEfektif, keterlihatan, normalKod, kodBolehGuna, tamatSelepasTebus, LABEL } from './lib/golongan.js';
import { perananPenuh } from './lib/peranan.js';
import { ciriAktif } from './lib/tetapan.js';
import { urlGambar, urlGambarVideo } from './lib/media.js';
import { kodSijil, sahkanNamaSijil, layakSijil } from './lib/sijil.js';
import { sahkanSoalan, namaPertama, awalHari, HAD_SEHARI } from './lib/soalan.js';
import { sahkanLaporan, HAD_LAPORAN_SEHARI } from './lib/laporan.js';

const idDari = (x) => { const n = Number(x); return Number.isInteger(n) && n > 0 ? n : null; };

async function konteks(req, env, repo, now) {
  const token = bacaKuki(req);
  const pengguna = token ? await repo.penggunaDariSesi(await hashToken(token), new Date(now).toISOString()) : null;
  const hari = hariIni(now);
  const peranan = pengguna ? await perananPenuh(env, repo, pengguna) : null;
  return { pengguna, hari, peranan, golongan: golonganEfektif(pengguna, hari, peranan).golongan };
}

// Siri yang ada kuliah pertama yang boleh dilihat pengguna ini (pelawat: video terbuka sahaja) supaya gambar automatik wujud.
// Pulangkan peta course_id -> baris video pertama. Baris video tidak pernah dihantar ke pelayar.
async function videoGambarSiri(repo, logMasuk) {
  const m = new Map();
  try { for (const r of await repo.videoUntukGambarSiri({ hanyaPratonton: !logMasuk })) if (!m.has(r.course_id) && urlGambarVideo(r.video_sumber, r.video_id)) m.set(r.course_id, r); } catch { /* tiada gambar automatik */ }
  return m;
}
// gambar: thumbnail pilihan guru, atau laluan automatik /api/gambar/course/<id> (disemak di pelayar sebelum mengalih ke gambar video).
const courseAwam = (c, guru, kategori, gambarAuto = false) => ({ gambar: urlGambar(c.thumbnail) || (gambarAuto ? `/api/gambar/course/${c.id}` : null), id: c.id, slug: c.slug, tajuk: c.tajuk, huraian: c.huraian ?? null, golongan: c.golongan || 'awam', guru: (c.guru_emel && guru?.get(c.guru_emel)) || null,
  kategori: (c.kategori_id && kategori?.get(c.kategori_id)) || null });
// Kategori untuk paparan (F-12): id -> { id, nama, slug }. Jadual belum wujud: peta kosong.
const petaKategori = async (repo) => { try { return new Map((await repo.senaraiKategori()).map((x) => [x.id, { id: x.id, nama: x.nama, slug: x.slug }])); } catch { return new Map(); } };
// Profil guru yang dipapar kepada awam (F-14): nama, kelayakan, institusi, bio sahaja. Emel tidak pernah dihantar.
async function profilGuru(repo, emel) {
  if (!emel) return null;
  let g = null; try { g = await repo.guruDariEmel(emel); } catch { /* jadual belum wujud */ }
  return g ? { nama: g.nama, kelayakan: g.kelayakan ?? null, institusi: g.institusi ?? null, bio: g.bio ?? null, gambar: urlGambar(g.gambar) } : null;
}
// Nama guru untuk paparan. Jadual guru mungkin belum wujud: pulangkan peta kosong.
const petaGuru = async (repo) => { try { return new Map((await repo.senaraiGuru()).map((g) => [g.emel, g.nama])); } catch { return new Map(); } };

// Subject terbit dalam course terbit sahaja; selain itu dianggap tidak wujud (404), termasuk untuk admin.
async function subjectTerbit(repo, id) {
  const s = id && await repo.subjectDariId(id);
  if (!s || s.status !== 'terbit') return null;
  const c = await repo.courseDariId(s.course_id);
  if (!c || c.status !== 'terbit') return null;
  return { s, c };
}

export async function pelajarApi(req, env, url, repo, now) {
  const bahagian = url.pathname.replace(/^\/api\//, '').split('/');
  const k = await konteks(req, env, repo, now);
  const logMasuk = !!k.pengguna;

  // Gambar automatik daripada video (kuliah atau siri). Mengalih (302) ke gambar video HANYA jika pengguna ini layak menonton
  // kuliah itu; selain itu 404. URL gambar YouTube/Drive mendedahkan ID video, jadi ia tidak pernah berada dalam senarai API.
  if (bahagian[0] === 'gambar' && bahagian.length === 3 && ['subject', 'course'].includes(bahagian[1]) && req.method === 'GET') {
    const id = idDari(bahagian[2]);
    let video = null;
    if (bahagian[1] === 'subject') {
      const t = await subjectTerbit(repo, id);
      if (t && keterlihatan(t.c.golongan, k.golongan) !== 'sembunyi' && keputusanSubject({ course: t.c, subject: t.s, logMasuk, golongan: k.golongan }).akses) video = t.s;
    } else {
      const c = id && await repo.courseDariId(id);
      if (c && c.status === 'terbit' && keterlihatan(c.golongan, k.golongan) === 'nampak') video = (await videoGambarSiri(repo, logMasuk)).get(c.id) ?? null;
    }
    const sasaran = video && urlGambarVideo(video.video_sumber, video.video_id);
    if (!sasaran) return json({ ralat: 'tidak-dijumpai' }, 404);
    return new Response(null, { status: 302, headers: { location: sasaran, 'cache-control': 'private, max-age=3600', vary: 'Cookie', 'referrer-policy': 'no-referrer' } });
  }

  // Senarai kategori awam (F-12): hanya kategori yang ada siri terbit yang boleh dilihat pengguna ini.
  if (bahagian[0] === 'kategori' && bahagian.length === 1 && req.method === 'GET') {
    const bil = new Map();
    for (const c of await repo.senaraiCourse()) {
      if (c.bil_subject_terbit > 0 && c.kategori_id && keterlihatan(c.golongan, k.golongan) !== 'sembunyi') bil.set(c.kategori_id, (bil.get(c.kategori_id) ?? 0) + 1);
    }
    let semua = []; try { semua = await repo.senaraiKategori(); } catch { /* jadual belum wujud */ }
    return json(semua.filter((x) => bil.has(x.id)).map((x) => ({ id: x.id, nama: x.nama, slug: x.slug, bil_course: bil.get(x.id) })));
  }

  if (bahagian[0] === 'course' && bahagian.length === 1 && req.method === 'GET') {
    const selesai = logMasuk ? new Map((await repo.kiraanSelesai(k.pengguna.id)).map((r) => [r.course_id, r.bil])) : null;
    const guru = await petaGuru(repo);
    const kategori = await petaKategori(repo);
    const tapis = (url.searchParams.get('kategori') || '').trim().toLowerCase();
    const tapisId = tapis ? ([...kategori.values()].find((x) => x.slug === tapis)?.id ?? -1) : null; // slug tidak dikenali = tiada hasil
    const auto = await videoGambarSiri(repo, logMasuk);
    const senarai = (await repo.senaraiCourse()).filter((c) => c.bil_subject_terbit > 0 && keterlihatan(c.golongan, k.golongan) !== 'sembunyi' && (tapisId === null || c.kategori_id === tapisId))
      .map((c) => ({ ...courseAwam(c, guru, kategori, keterlihatan(c.golongan, k.golongan) === 'berkunci' ? false : auto.has(c.id)), terkunci_golongan: keterlihatan(c.golongan, k.golongan) === 'berkunci', bil_subject: c.bil_subject_terbit, selesai: selesai ? (selesai.get(c.id) ?? 0) : null }));
    return json(senarai);
  }

  if (bahagian[0] === 'course' && bahagian.length === 2 && req.method === 'GET') {
    const c = await repo.courseDariSlug(decodeURIComponent(bahagian[1]));
    if (!c || c.status !== 'terbit' || keterlihatan(c.golongan, k.golongan) === 'sembunyi') return json({ ralat: 'tidak-dijumpai' }, 404);
    const selesai = new Set(logMasuk ? await repo.subjectSelesai(k.pengguna.id) : []);
    const subject = (await repo.senaraiSubject(c.id)).map((s) =>
      subjectRingkas(s, keputusanSubject({ course: c, subject: s, logMasuk, golongan: k.golongan }), selesai.has(s.id)));
    const sijilOn = await ciriAktif(repo, 'sijil_aktif');
    let sijil = null;
    if (logMasuk && sijilOn) { try { const x = await repo.sijilPengguna(k.pengguna.id, c.id); if (x) sijil = { kod: x.kod }; } catch { /* jadual sijil belum wujud */ } }
    return json({ course: courseAwam(c, await petaGuru(repo), await petaKategori(repo), subject.some((s) => s.gambar && s.gambar.startsWith('/api/gambar/'))), guru_profil: await profilGuru(repo, c.guru_emel), subject, log_masuk: logMasuk, sijil, ciri: { sijil: sijilOn } });
  }

  // Dapatkan sijil: semua kuliah terbit dalam course mesti selesai. Nama boleh ditukar sekali sebelum dikeluarkan sahaja.
  if (bahagian[0] === 'course' && bahagian[2] === 'sijil' && bahagian.length === 3 && req.method === 'POST') {
    const asal = req.headers.get('origin');
    if (asal && asal !== url.origin) return json({ ralat: 'asal-tidak-dibenarkan' }, 403);
    if (!logMasuk) return json({ ralat: 'belum-log-masuk' }, 401);
    if (!(await ciriAktif(repo, 'sijil_aktif'))) return json({ ralat: 'tidak-dijumpai' }, 404);
    const c = await repo.courseDariSlug(decodeURIComponent(bahagian[1]));
    if (!c || c.status !== 'terbit' || keterlihatan(c.golongan, k.golongan) === 'sembunyi') return json({ ralat: 'tidak-dijumpai' }, 404);
    const ada = await repo.sijilPengguna(k.pengguna.id, c.id);
    if (ada) return json({ kod: ada.kod, nama: ada.nama });
    const subject = await repo.senaraiSubject(c.id);
    if (!layakSijil(subject.map((s) => s.id), await repo.subjectSelesai(k.pengguna.id))) return json({ ralat: 'belum-khatam' }, 409);
    let b; try { b = await req.json(); } catch { return json({ ralat: 'json-tidak-sah' }, 400); }
    const nama = sahkanNamaSijil(b?.nama);
    if (!nama.ok) return json({ ralat: nama.sebab, medan: nama.medan }, 400);
    const guru = (c.guru_emel && (await petaGuru(repo)).get(c.guru_emel)) || null;
    for (let cuba = 0; ; cuba++) {
      try {
        const s = await repo.ciptaSijil({ kod: kodSijil(), pengguna_id: k.pengguna.id, course_id: c.id, nama: nama.nilai, tajuk_course: c.tajuk, guru, dikeluarkan_pada: new Date(now).toISOString() });
        return json({ kod: s.kod, nama: s.nama }, 201);
      } catch (e) { if (cuba >= 3) throw e; } // kod bertembung: cuba semula
    }
  }

  if (bahagian[0] === 'sijil' && bahagian.length === 1 && req.method === 'GET') {
    if (!logMasuk) return json({ ralat: 'belum-log-masuk' }, 401);
    if (!(await ciriAktif(repo, 'sijil_aktif'))) return json({ ralat: 'tidak-dijumpai' }, 404);
    let senarai = []; try { senarai = await repo.senaraiSijilPengguna(k.pengguna.id); } catch { /* jadual belum wujud */ }
    return json(senarai.map((s) => ({ kod: s.kod, tajuk_course: s.tajuk_course, nama: s.nama, dikeluarkan_pada: s.dikeluarkan_pada })));
  }

  if (bahagian[0] === 'subject' && bahagian.length === 2 && req.method === 'GET') {
    const t = await subjectTerbit(repo, idDari(bahagian[1]));
    if (!t || keterlihatan(t.c.golongan, k.golongan) === 'sembunyi') return json({ ralat: 'tidak-dijumpai' }, 404);
    const keputusan = keputusanSubject({ course: t.c, subject: t.s, logMasuk, golongan: k.golongan });
    const selesai = logMasuk && (await repo.subjectSelesai(k.pengguna.id)).includes(t.s.id);
    const adik = await repo.senaraiSubject(t.c.id);
    const i = adik.findIndex((x) => x.id === t.s.id);
    const ringkas = (x) => (x ? { id: x.id, tajuk: x.tajuk } : null);
    // Nama nota hanya untuk yang layak DAN sudah log masuk. Kunci R2 tidak pernah dihantar. Jika jadual nota
    // belum dicipta, halaman kuliah tetap berfungsi tanpa nota.
    let nota = [];
    try { nota = (await repo.senaraiNota(t.s.id)).map(({ id, nama, saiz }) => ({ id, nama, saiz })); } catch { /* jadual atau lajur belum wujud */ }
    // Soal jawab: bilangan sentiasa diberi; senarai dijawab untuk sesiapa yang layak menonton (pelawat pada kuliah percuma boleh membaca);
    // soalan menunggu hanya milik pengguna sendiri. Nama penanya hanya nama pertama. Jika jadual belum wujud: kosong.
    let soalan = { bil: 0, awam: [], menunggu: [], had: HAD_SEHARI };
    try {
      const bil = await repo.bilSoalanAwam(t.s.id);
      soalan = { bil, had: HAD_SEHARI, awam: [], menunggu: [] };
      if (keputusan.akses) {
        soalan.awam = (await repo.soalanAwam(t.s.id)).map((q) => ({ id: q.id, nama: namaPertama(q.nama_penanya), teks: q.teks, dicipta_pada: q.dicipta_pada, jawapan: q.jawapan, penjawab: q.penjawab_nama, dijawab_pada: q.dijawab_pada }));
        if (logMasuk) soalan.menunggu = await repo.soalanMenunggu(t.s.id, k.pengguna.id);
      }
    } catch { /* jadual soalan belum wujud */ }
    return json({
      subject: subjectPenuh(t.s, keputusan, selesai), course: courseAwam(t.c, await petaGuru(repo), await petaKategori(repo)), soalan,
      bil_nota: nota.length, nota: keputusan.akses && logMasuk ? nota : [],
      kedudukan: i + 1, jumlah: adik.length, sebelum: ringkas(adik[i - 1]), seterusnya: ringkas(adik[i + 1]), log_masuk: logMasuk,
    });
  }

  if (bahagian[0] === 'subject' && bahagian[2] === 'selesai' && bahagian.length === 3 && req.method === 'POST') {
    const asal = req.headers.get('origin');
    if (asal && asal !== url.origin) return json({ ralat: 'asal-tidak-dibenarkan' }, 403);
    if (!logMasuk) return json({ ralat: 'belum-log-masuk' }, 401);
    const t = await subjectTerbit(repo, idDari(bahagian[1]));
    if (!t || keterlihatan(t.c.golongan, k.golongan) === 'sembunyi') return json({ ralat: 'tidak-dijumpai' }, 404); // tersembunyi = tidak wujud baginya
    // Tidak boleh menanda selesai subject yang tidak boleh ditonton.
    if (!keputusanSubject({ course: t.c, subject: t.s, logMasuk, golongan: k.golongan }).akses) return json({ ralat: 'tiada-akses' }, 403);
    await repo.tandaSelesai(k.pengguna.id, t.s.id, new Date(now).toISOString());
    return json({ ok: true, selesai: true });
  }

  // Pilih golongan semasa mendaftar, atau naik taraf / lanjut dengan kod (halaman Akaun).
  //   { pilihan: 'awam' }  hanya jika belum memilih atau sedang awam (turun taraf hanya oleh admin)
  //   { kod: 'ABCD-EFGH' } pelajar atau ahli organisasi; had 5 cubaan gagal sejam
  if (bahagian[0] === 'golongan' && bahagian.length === 1 && req.method === 'POST') {
    const asal = req.headers.get('origin');
    if (asal && asal !== url.origin) return json({ ralat: 'asal-tidak-dibenarkan' }, 403);
    if (!logMasuk) return json({ ralat: 'belum-log-masuk' }, 401);
    if (!(req.headers.get('content-type') || '').includes('application/json')) return json({ ralat: 'JSON sahaja' }, 415);
    let b; try { b = JSON.parse(await req.text()); } catch { return json({ ralat: 'JSON tidak sah' }, 400); }
    const p = k.pengguna, masa = new Date(now).toISOString();
    const semasa = golonganEfektif(p, k.hari, null);
    if (b?.pilihan === 'awam') {
      if (semasa.golongan !== 'awam') return json({ ralat: 'turun-taraf-admin' }, 409);
      await repo.tetapkanGolongan(p.id, 'awam', null);
      return json({ golongan: 'awam', label: LABEL.awam, tamat: null });
    }
    if (!(await ciriAktif(repo, 'kod_aktif'))) return json({ ralat: 'ciri-dimatikan' }, 404);
    const teks = normalKod(b?.kod);
    if (!teks) return json({ ralat: 'kod-diperlukan', medan: 'kod' }, 400);
    const sejamLalu = new Date(now - 3600e3).toISOString();
    if ((await repo.bilCubaanKod(p.id, sejamLalu)) >= 5) return json({ ralat: 'terlalu-banyak-cubaan' }, 429);
    const kod = await repo.kodDariTeks(teks);
    if (!kodBolehGuna(kod, k.hari)) { await repo.catatCubaanKod(p.id, masa); return json({ ralat: 'kod-tidak-sah', medan: 'kod' }, 400); }
    // Tiada turun taraf sendiri: ahli organisasi yang aktif tidak boleh menukar kepada pelajar dengan kod.
    if (semasa.golongan === 'ahli' && kod.golongan === 'pelajar') return json({ ralat: 'turun-taraf-admin' }, 409);
    const tamat = tamatSelepasTebus(kod, { golongan: semasa.golongan, golongan_tamat: semasa.tamat }, k.hari);
    if (!(await repo.tebusKod(kod.id, p.id, kod.golongan, tamat, masa, k.hari))) { await repo.catatCubaanKod(p.id, masa); return json({ ralat: 'kod-tidak-sah', medan: 'kod' }, 400); }
    return json({ golongan: kod.golongan, label: LABEL[kod.golongan], tamat });
  }

  // Tanya soalan pada kuliah: mesti log masuk dan layak menonton kuliah itu. Had beberapa soalan sehari.
  if (bahagian[0] === 'subject' && bahagian[2] === 'soalan' && bahagian.length === 3 && req.method === 'POST') {
    const asal = req.headers.get('origin');
    if (asal && asal !== url.origin) return json({ ralat: 'asal-tidak-dibenarkan' }, 403);
    if (!logMasuk) return json({ ralat: 'belum-log-masuk' }, 401);
    const t = await subjectTerbit(repo, idDari(bahagian[1]));
    if (!t || keterlihatan(t.c.golongan, k.golongan) === 'sembunyi') return json({ ralat: 'tidak-dijumpai' }, 404); // tersembunyi = tidak wujud baginya
    if (!keputusanSubject({ course: t.c, subject: t.s, logMasuk, golongan: k.golongan }).akses) return json({ ralat: 'tiada-akses' }, 403);
    if (!(req.headers.get('content-type') || '').includes('application/json')) return json({ ralat: 'JSON sahaja' }, 415);
    let b; try { b = JSON.parse(await req.text()); } catch { return json({ ralat: 'JSON tidak sah' }, 400); }
    const v = sahkanSoalan(b?.teks); if (!v.ok) return json({ ralat: v.sebab, medan: 'teks' }, 400);
    if ((await repo.bilSoalanSejak(k.pengguna.id, awalHari(k.hari))) >= HAD_SEHARI) return json({ ralat: 'had-harian', had: HAD_SEHARI }, 429);
    const q = await repo.ciptaSoalan(t.s.id, k.pengguna.id, v.nilai, new Date(now).toISOString());
    return json({ id: q.id, teks: q.teks, dicipta_pada: q.dicipta_pada }, 201);
  }

  // Lapor kandungan (F-17): ahli berdaftar sahaja. Mesti layak menonton kuliah itu. Had 5 sehari; laporan yang sama
  // (kuliah + sebab) tidak boleh dihantar lebih sekali dalam 24 jam.
  if (bahagian[0] === 'laporan' && bahagian.length === 1 && req.method === 'POST') {
    const asal = req.headers.get('origin');
    if (asal && asal !== url.origin) return json({ ralat: 'asal-tidak-dibenarkan' }, 403);
    if (!logMasuk) return json({ ralat: 'belum-log-masuk' }, 401);
    if (!(req.headers.get('content-type') || '').includes('application/json')) return json({ ralat: 'JSON sahaja' }, 415);
    let teks; try { teks = await req.text(); } catch { return json({ ralat: 'JSON tidak sah' }, 400); }
    if (teks.length > 5000) return json({ ralat: 'badan-terlalu-besar' }, 413);
    let b; try { b = JSON.parse(teks); } catch { return json({ ralat: 'JSON tidak sah' }, 400); }
    const v = sahkanLaporan(b); if (!v.ok) return json({ ralat: v.sebab, ...(v.medan ? { medan: v.medan } : {}) }, 400);
    const t = await subjectTerbit(repo, v.nilai.subject_id);
    if (!t || keterlihatan(t.c.golongan, k.golongan) === 'sembunyi') return json({ ralat: 'tidak-dijumpai' }, 404);
    if (!keputusanSubject({ course: t.c, subject: t.s, logMasuk, golongan: k.golongan }).akses) return json({ ralat: 'tiada-akses' }, 403);
    if (v.nilai.soalan_id) { // hanya soalan awam pada kuliah yang sama boleh dilapor
      const q = await repo.soalanDariId(v.nilai.soalan_id);
      if (!q || q.subject_id !== t.s.id || q.jawapan == null || q.tersembunyi) return json({ ralat: 'soalan-tidak-sah', medan: 'soalan_id' }, 400);
    }
    const masa = new Date(now).toISOString();
    if (await repo.adaLaporanSama(k.pengguna.id, t.s.id, v.nilai.sebab, new Date(now - 864e5).toISOString())) return json({ ralat: 'laporan-pendua' }, 409);
    if ((await repo.bilLaporanSejak(k.pengguna.id, awalHari(k.hari))) >= HAD_LAPORAN_SEHARI) return json({ ralat: 'had-harian', had: HAD_LAPORAN_SEHARI }, 429);
    const l = await repo.ciptaLaporan({ ...v.nilai, pengguna_id: k.pengguna.id }, masa);
    return json({ id: l.id, ok: true }, 201);
  }

  // Penanya boleh menarik balik soalannya selagi belum dijawab.
  if (bahagian[0] === 'soalan' && bahagian.length === 2 && req.method === 'DELETE') {
    const asal = req.headers.get('origin');
    if (asal && asal !== url.origin) return json({ ralat: 'asal-tidak-dibenarkan' }, 403);
    if (!logMasuk) return json({ ralat: 'belum-log-masuk' }, 401);
    const q = await repo.soalanDariId(idDari(bahagian[1]));
    if (!q || q.pengguna_id !== k.pengguna.id) return json({ ralat: 'tidak-dijumpai' }, 404);
    if (q.jawapan != null) return json({ ralat: 'sudah-dijawab' }, 409);
    await repo.padamSoalan(q.id);
    return json({ ok: true });
  }

  // Muat turun nota: peraturan akses sama seperti video, ditambah mesti log masuk (SPEC bahagian 9).
  if (bahagian[0] === 'nota' && bahagian.length === 2 && req.method === 'GET') {
    const n = await repo.notaDariId(idDari(bahagian[1]));
    const t = n && (n.status ?? 'terbit') === 'terbit' && await subjectTerbit(repo, n.subject_id); // nota menunggu kelulusan = tiada
    if (!t || keterlihatan(t.c.golongan, k.golongan) === 'sembunyi') return json({ ralat: 'tidak-dijumpai' }, 404); // tersembunyi = tidak wujud baginya
    const keputusan = keputusanSubject({ course: t.c, subject: t.s, logMasuk, golongan: k.golongan });
    if (!logMasuk) return json({ ralat: 'belum-log-masuk' }, 401);
    if (!keputusan.akses) return json({ ralat: 'tiada-akses' }, 403);
    if (!env.NOTA) return json({ ralat: 'r2-belum-sedia' }, 503);
    const obj = await env.NOTA.get(n.kunci);
    if (!obj) return json({ ralat: 'tidak-dijumpai' }, 404);
    return new Response(obj.body, { headers: {
      'content-type': 'application/pdf',
      'content-length': String(obj.size ?? n.saiz),
      'content-disposition': kepalaKandungan(n.nama, url.searchParams.get('unduh') === '1'),
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    } });
  }

  return json({ ralat: 'tidak-dijumpai' }, 404);
}
