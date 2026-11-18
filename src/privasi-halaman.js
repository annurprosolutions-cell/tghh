// Halaman awam Dasar Privasi: /privasi. HTML penuh dari pelayan supaya boleh dibaca tanpa JavaScript
// (termasuk oleh semakan jenama Google). Nama laman, emel hubungan dan ringkasan datang daripada Tetapan laman.
// Teks ini draf yang menerangkan apa yang sistem lakukan sebenarnya; pemilik perlu menyemaknya.

import { h, tarikhMy } from './lib/artikel.js';
import { bingkai, keluarHtml, muatLaman } from './artikel-halaman.js';

// Tarikh dasar ini dikemas kini. Ubah bila teks atau amalan data berubah.
export const KEMASKINI_PRIVASI = '2026-11-18';

export function badanPrivasi(laman) {
  const nama = h(laman.nama);
  const hubungi = laman.emel_hubungan
    ? `<a href="mailto:${h(laman.emel_hubungan)}">${h(laman.emel_hubungan)}</a>`
    : 'admin laman ini (gunakan butang Lapor pada mana-mana kuliah atau hubungi pengendali laman)';
  const ringkasan = String(laman.privasi_teks || '').trim();
  return `<section class="section"><div class="wrap artikel-bekas">
    <nav class="crumb" style="margin-bottom:14px"><a href="/">Utama</a><span>/</span><span>Dasar Privasi</span></nav>
    <h1>Dasar Privasi ${nama}</h1>
    <p class="artikel-meta">Dikemas kini ${h(tarikhMy(KEMASKINI_PRIVASI))}</p>
    <div class="artikel-isi">
      ${ringkasan ? `<p><strong>Ringkasan:</strong> ${h(ringkasan).replace(/\n/g, '<br>')}</p>` : ''}
      <p>${nama} ialah laman kuliah dalam talian. Dasar ini menerangkan data yang kami kumpul apabila anda menggunakan laman ini, tujuannya, dengan siapa ia dikongsi dan hak anda.</p>

      <h2>1. Data yang kami kumpul</h2>
      <p>Anda boleh menonton kuliah terbuka dan membaca artikel tanpa log masuk, tanpa kami menyimpan data peribadi anda. Jika anda log masuk dengan Google, kami menyimpan:</p>
      <ul>
        <li><strong>Nama dan alamat emel</strong> akaun Google anda, serta pengecam akaun Google (supaya akaun yang sama dikenali semasa log masuk seterusnya).</li>
        <li><strong>Kemajuan tontonan</strong>: kuliah yang anda tandakan atau capai khatam.</li>
        <li><strong>Soalan dan laporan</strong> yang anda hantar, termasuk catatan yang anda tulis.</li>
        <li><strong>Maklumat sesi</strong>: satu kuki sesi dan masa log masuk terakhir.</li>
      </ul>
      <p>Kami <strong>tidak</strong> meminta akses kepada Gmail, Google Drive, kenalan atau data Google anda yang lain. Kami hanya menerima nama dan emel melalui Log Masuk dengan Google.</p>

      <h2>2. Tujuan penggunaan</h2>
      <ul>
        <li>Mengesahkan log masuk dan menyimpan kemajuan anda.</li>
        <li>Menjawab soalan anda dan menyelia kandungan (menyemak laporan).</li>
        <li>Mengeluarkan sijil, jika ciri itu dihidupkan oleh pentadbir.</li>
        <li>Menjaga keselamatan laman, termasuk menyekat akaun yang menyalahgunakan laman.</li>
      </ul>
      <p>Kami tidak menjual data anda dan tidak menggunakannya untuk pengiklanan.</p>

      <h2>3. Siapa boleh melihat data anda</h2>
      <ul>
        <li><strong>Admin laman</strong> boleh melihat senarai pengguna (nama dan emel), soalan dan laporan.</li>
        <li><strong>Guru</strong> boleh melihat soalan pada siri kuliah mereka sendiri.</li>
        <li><strong>Pengguna lain</strong> hanya nampak <strong>nama pertama</strong> anda pada soalan yang telah dijawab. Emel anda tidak dipaparkan kepada pengguna lain.</li>
      </ul>

      <h2>4. Perkhidmatan pihak ketiga</h2>
      <ul>
        <li><strong>Google</strong>: Log Masuk dengan Google, serta video yang dimainkan daripada YouTube atau Google Drive. Apabila video dimainkan, Google menerima data teknikal peranti anda mengikut dasar privasi Google.</li>
        <li><strong>Cloudflare</strong>: menghoskan laman dan menyimpan pangkalan data kami.</li>
      </ul>
      <p>Pihak ketiga ini mempunyai dasar privasi mereka sendiri. Kami tidak mengawal data yang mereka kumpul.</p>

      <h2>5. Kuki dan storan pelayar</h2>
      <p>Kami menggunakan satu kuki sesi yang diperlukan untuk kekal log masuk, dan storan pelayar untuk mengingat warna tema dan halaman asal selepas log masuk. Kami tidak menggunakan kuki iklan atau penjejakan.</p>

      <h2>6. Tempoh simpanan dan pemadaman</h2>
      <p>Data akaun dan kemajuan disimpan selagi laman beroperasi dan akaun anda wujud. Sesi tamat dibersihkan mengikut tarikh tamatnya. Anda boleh meminta akaun dan data anda dipadam dengan menghubungi kami; admin akan memadam atas permintaan.</p>

      <h2>7. Hak anda</h2>
      <p>Anda boleh meminta akses kepada data peribadi anda, pembetulan, atau pemadaman. Hubungi: ${hubungi}.</p>

      <h2>8. Keselamatan</h2>
      <p>Kami menggunakan sambungan HTTPS, tidak menyimpan kata laluan (log masuk melalui Google), dan menyimpan sesi dalam bentuk yang tidak boleh dibaca semula. Tiada sistem yang selamat sepenuhnya; sila laporkan sebarang kebimbangan kepada kami.</p>

      <h2>9. Perubahan dasar ini</h2>
      <p>Jika dasar ini berubah, tarikh kemas kini di atas akan diubah. Penggunaan laman selepas itu bermaksud anda menerima dasar yang dikemas kini.</p>

      <h2>10. Hubungi kami</h2>
      <p>Soalan tentang dasar ini: ${hubungi}.</p>
    </div>
  </div></section>`;
}

export async function privasiHalaman(req, env, url, repo) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Kaedah tidak disokong', { status: 405 });
  const tapak = (env.SITE_URL || url.origin).replace(/\/+$/, '');
  let hosTapak; try { hosTapak = new URL(tapak).host; } catch { hosTapak = url.host; }
  const laman = await muatLaman(repo);
  return keluarHtml(bingkai({
    laman, tapak, tajuk: `Dasar Privasi · ${laman.nama}`, deskripsi: `Dasar privasi ${laman.nama}: data yang dikumpul, tujuan, perkongsian dan hak pengguna.`,
    kanonik: tapak + '/privasi', noindex: hosTapak !== url.host, badan: badanPrivasi(laman),
  }), 200, { 'cache-control': 'public, max-age=300' });
}
