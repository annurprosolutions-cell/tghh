# Haraki Hub: ringkasan serahan

Alamat laman: https://harakihub.annurpro.com
Panel admin dan guru: https://harakihub.annurpro.com/panel/
Alamat asal (cadangan simpan): https://haraki-hub.ruzbihanbakhtiar94.workers.dev

Repo ini mesti kekal **private**. Emel admin ada dalam `wrangler.toml`.

## 1. Cara tambah kuliah

1. Di panel, tekan **Siri**, kemudian **Tambah siri** (atau buka siri sedia ada).
2. Dalam siri, tekan **Tambah kuliah**.
3. Isi tajuk, tampal pautan YouTube (video mesti **Unlisted**), huraian dan **Rujukan dan dalil**.
4. Tandakan **Tonton tanpa log masuk** jika kuliah itu boleh ditonton orang awam.
5. Pilih **Terbit** (admin) atau **Hantar untuk kelulusan admin** (guru).

### Video: YouTube atau Google Drive

Medan **Pautan video** menerima kedua-dua jenis, dan sumbernya dikesan sendiri:
- **Google Drive**: di Drive, klik kanan fail video, **Share**, tetapkan **Anyone with the link** (Viewer), **Copy link** dan tampal. Contoh: `https://drive.google.com/file/d/<ID>/view`. Folder tak boleh digunakan.
- **YouTube**: tampal pautan Share; video sebaiknya **Unlisted**.
- Video **Google Drive tidak ditanda khatam secara automatik** (Drive tak menghantar isyarat video tamat). Pelajar menekan **Tandakan selesai** sendiri. Video YouTube ditanda khatam secara automatik.
- Drive bukan platform video: video besar yang ditonton ramai boleh dikenakan had oleh Google (mesej "terlalu ramai pengguna"). Untuk trafik besar, YouTube lebih stabil.
- Sesiapa yang ada pautan Drive atau YouTube boleh menontonnya terus. Sistem hanya menghantar ID video kepada pengguna yang layak.

### Gambar thumbnail dan gambar guru

- **Thumbnail siri** (borang Siri) dan **thumbnail kuliah** (borang Kuliah): tampal pautan fail gambar Google Drive (perkongsian **Anyone with the link**). Kosongkan untuk guna gambar automatik daripada video.
- **Gambar guru**: tab **Pasukan**, butang **Profil**. Hanya admin boleh isi. Pastikan guru bersetuju.
- Hanya pautan Google Drive diterima untuk gambar. Muat naik terus ke laman memerlukan storan R2 (belum diaktifkan).
- Gambar automatik daripada video dipaparkan kepada pelawat hanya jika kuliah itu terbuka (pratonton).

## 2. Cara luluskan kandungan guru

Tab **Kelulusan** menunjukkan siri, kuliah dan perubahan yang menunggu. Tekan **Lulus**, atau **Tolak** dengan catatan untuk guru.

## 3. Cara tambah guru

1. Tab **Pasukan**, bahagian **Guru**: masukkan emel Gmail guru dan nama paparan, kemudian **Simpan guru**.
2. Tekan **Profil** pada kad guru untuk isi kelayakan, institusi dan bio. Hanya admin boleh isi, dan guru tak boleh ubah sendiri.

## 4. Cara tukar nama, warna dan penafian

Di tab **Tetapan laman**:
- Nama laman, tagline dan teks hero.
- Warna tema (hijau, biru, ungu, marun, arang).
- **Teks penafian** dan **Notis privasi**. Teks penafian ialah draf Lampiran A PRD dan **mesti disemak penasihat syariah** sebelum lancar.

## 5. Toggle sijil dan kod kelas

Di **Tetapan laman**, dua pilihan **Papar** atau **Sembunyi**:
- **Sijil khatam siri**: lalai **Sembunyi**. Bila sembunyi, pelajar tak nampak butang dapatkan sijil, dan halaman `/sijil/<kod>` ditutup. Sijil yang sudah dikeluarkan tak dipadam.
- **Kod kelas (golongan)**: lalai **Sembunyi**. Bila sembunyi, kotak Guna kod dan tab Kod golongan disembunyikan. Siri berkunci kekal berkunci untuk orang awam.

## 6. Perkara yang belum dibuat

- **Storan R2 (nota PDF, logo, gambar artikel, sandaran harian)** belum didaftar. Ciri ni dimatikan. Sandaran manual: `wrangler d1 export` oleh pembangun, sebelum perubahan besar dan sekurang-kurangnya sebulan sekali.
- **Dasar privasi** ada di `/privasi` (dihidang dari server, nama laman dan emel hubungan dari Tetapan laman). Isi **Emel hubungan** di Tetapan laman, dan semak teksnya sebelum lancar.
- **Google OAuth** masih mod Testing. Pengguna biasa belum boleh log masuk sehingga ditukar ke Production (lihat bahagian 7).
- Kandungan ujian dalam panel: **"Ujian: Pengenalan Aliran"** dan **"Kuliah 2"** masih ada. Padam bila dah tak perlu.

## 7. Langkah sebelum buka kepada pelajar

1. Buka Google Cloud Console, pilih projek **Haraki Hub**.
2. Di **Google Auth Platform**, buka **Audience**. Cari butang **Publish app** (atau **Make it production**, label boleh berbeza mengikut versi dashboard). Tukar daripada Testing kepada **In production**.
3. Log masuk dengan akaun Gmail yang **bukan** admin, dan pastikan log masuk berfungsi.
4. Google mungkin minta pengesahan jika app minta skop sensitif. Laman ni hanya minta nama dan emel asas. Kalau Google minta pengesahan, bagitahu aku untuk semak.

## 8. Akaun dan pemilikan

- Cloudflare, Google Cloud dan GitHub masih dalam akaun pengurus pembangunan. Repo GitHub masih di bawah organisasi `annurprosolutions-cell`. Sebelum serahan penuh, pindahkan ke akaun pemilik (ikut TRD seksyen 9).
- Client ID Google dan Database ID D1 **bukan rahsia**. Tiada kunci atau kata laluan dalam repo.

## 9. Keputusan dan had yang diketahui

- Video YouTube Unlisted boleh ditonton oleh sesiapa yang ada pautan. Jangan guna untuk kandungan yang perlu dirahsiakan.
- Tauliah mengajar dan kelulusan Jabatan Agama negeri **belum disahkan**. Pemilik perlu sahkan sebelum lancar (PRD seksyen 1.2).
- Had pelan percuma Cloudflare (permintaan, baris D1) **belum disahkan** di dashboard.

---

## Lampiran: keputusan QA (IPD seksyen 6)

Semua ujian automatik dijalankan dengan `npm test`, `npm run test:d1` dan `npm run test:e2e` (130 unit, 27 SQL, 71 e2e pelayar termasuk telefon 390px). Status "manual" bermaksud perlu semakan di telefon atau akaun sebenar.

| Ujian | Cara | Status |
|---|---|---|
| Log masuk setiap role | e2e-panel: admin, guru, emel biasa | Lulus |
| Akses tanpa kebenaran | e2e-panel, unit admin-api: 401/403 | Lulus |
| Guru tak boleh terbit | e2e-panel: kekal menunggu sehingga admin lulus | Lulus |
| Guru tak nampak siri guru lain | guru.test.js | Lulus |
| `video_id` tak bocor | pelajar-api.test, e2e-pelajar: kuliah tertutup | Lulus |
| Kuliah terbuka tanpa log masuk | e2e-pelajar | Lulus |
| Soalan berkawal | e2e-pelajar: soalan tak nampak sebelum dijawab | Lulus |
| Had soalan 5 sehari | soalan.test, e2e | Lulus |
| Rujukan Arab 390px | e2e-niche: arah baris diukur | Lulus |
| Kategori | e2e-niche: penapis dan lencana | Lulus |
| Profil guru | e2e-niche: admin isi, awam nampak, emel tak bocor | Lulus |
| Penafian | e2e-niche: di kuliah, footer, log masuk | Lulus |
| Laporan (had, pendua) | laporan.test, e2e-laporan | Lulus |
| XSS | Ujian merentas: teks HTML dipapar sebagai teks | Lulus |
| Mobile 390px, tiada skrol mendatar | e2e-telefon, e2e setiap skrin | Lulus |
| Skema berulang, naik taraf v1 ke v2 | repo-d1.integ | Lulus |
| Sandaran | R2 tidak aktif | Tidak dinilai (lihat bahagian 6) |
| Akaun Gmail bukan admin | Perlu akaun sebenar | Manual |
| Telefon sebenar, PWA dipasang | Perlu telefon sebenar | Manual |
