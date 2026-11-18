import test from 'node:test';
import assert from 'node:assert/strict';
import { ekstrakIdDrive, ekstrakRujukanGambar, idDariRujukan, urlGambar, urlGambarVideo, pautanVideo, pautanGambar } from '../src/lib/media.js';

const ID = '1FEln2yyKXbFFydEghgIyUoW9ygWaRwxO';

test('ekstrakIdDrive: pautan fail, open, uc, thumbnail dan ID panjang diterima', () => {
  assert.equal(ekstrakIdDrive(`https://drive.google.com/file/d/${ID}/view?usp=drive_link`), ID); // contoh pemilik
  assert.equal(ekstrakIdDrive(`https://drive.google.com/file/d/${ID}/preview`), ID);
  assert.equal(ekstrakIdDrive(`drive.google.com/file/d/${ID}/view`), ID);
  assert.equal(ekstrakIdDrive(`https://drive.google.com/file/u/1/d/${ID}/view`), ID);
  assert.equal(ekstrakIdDrive(`https://drive.google.com/open?id=${ID}`), ID);
  assert.equal(ekstrakIdDrive(`https://drive.google.com/uc?export=download&id=${ID}`), ID);
  assert.equal(ekstrakIdDrive(`https://drive.google.com/thumbnail?id=${ID}&sz=w800`), ID);
  assert.equal(ekstrakIdDrive(`  ${ID}  `), ID);
});

test('ekstrakIdDrive: folder, hos palsu, skema berbahaya, ID terlalu pendek atau aksara pelik ditolak', () => {
  assert.equal(ekstrakIdDrive(`https://drive.google.com/drive/folders/${ID}`), null);
  assert.equal(ekstrakIdDrive(`https://drive.google.com.penipu.test/file/d/${ID}/view`), null);
  assert.equal(ekstrakIdDrive(`https://penipu.test/file/d/${ID}/view`), null);
  assert.equal(ekstrakIdDrive(`javascript:alert(1)//drive.google.com/file/d/${ID}`), null);
  assert.equal(ekstrakIdDrive('https://drive.google.com/file/d/abc/view'), null);
  assert.equal(ekstrakIdDrive(`https://drive.google.com/file/d/${ID}"onload="x/view`), ID); // aksara selepas ID dibuang; hanya ID bersih digunakan
  assert.equal(ekstrakIdDrive('<script>alert(1)</script>'), null);
  assert.equal(ekstrakIdDrive(''), null);
  assert.equal(ekstrakIdDrive(null), null);
  assert.equal(ekstrakIdDrive('dQw4w9WgXcQ'), null); // ID YouTube 11 aksara bukan ID Drive
});

test('rujukan gambar: hanya drive:<ID>; urlGambar dan urlGambarVideo; pautan untuk borang', () => {
  assert.equal(ekstrakRujukanGambar(`https://drive.google.com/file/d/${ID}/view`), `drive:${ID}`);
  assert.equal(ekstrakRujukanGambar('https://contoh.my/gambar.jpg'), null);
  assert.equal(idDariRujukan(`drive:${ID}`), ID);
  assert.equal(idDariRujukan('https://x'), null);
  assert.equal(idDariRujukan(`drive:${ID}"><script>`), null);
  assert.equal(urlGambar(`drive:${ID}`), `https://drive.google.com/thumbnail?id=${ID}&sz=w800`);
  assert.equal(urlGambar('lain'), null);
  assert.equal(urlGambar(null), null);
  assert.equal(urlGambarVideo('youtube', 'dQw4w9WgXcQ'), 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  assert.equal(urlGambarVideo('drive', ID), `https://drive.google.com/thumbnail?id=${ID}&sz=w800`);
  assert.equal(urlGambarVideo('youtube', ID), null); // ID Drive bukan ID YouTube
  assert.equal(urlGambarVideo('drive', 'pendek'), null);
  assert.equal(urlGambarVideo('youtube', null), null);
  assert.equal(pautanVideo('youtube', 'dQw4w9WgXcQ'), 'https://youtu.be/dQw4w9WgXcQ');
  assert.equal(pautanVideo('drive', ID), `https://drive.google.com/file/d/${ID}/view`);
  assert.equal(pautanVideo('drive', null), '');
  assert.equal(pautanGambar(`drive:${ID}`), `https://drive.google.com/file/d/${ID}/view`);
  assert.equal(pautanGambar(null), '');
});
