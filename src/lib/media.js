// Pautan media: video Google Drive, gambar thumbnail (Google Drive) dan URL paparan. Fungsi tulen, tiada I/O.
// Gambar hanya diterima daripada Google Drive (pautan fail atau ID): URL luar sewenang-wenang tidak diterima supaya
// pelawat tidak dihantar ke pelayan yang tidak dikenali. Rujukan gambar disimpan sebagai "drive:<ID>".

const ID_DRIVE = /^[A-Za-z0-9_-]{20,80}$/;
const HOS_DRIVE = new Set(['drive.google.com', 'drive.usercontent.google.com']);

// Terima pautan Google Drive (fail/d/ID, open?id=, uc?id=, thumbnail?id=) atau ID panjang. Folder ditolak.
// Pulangkan ID atau null.
export function ekstrakIdDrive(input) {
  const t = String(input ?? '').trim();
  if (!t) return null;
  if (ID_DRIVE.test(t)) return t;
  let u;
  try { u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (!HOS_DRIVE.has(u.hostname.toLowerCase())) return null;
  const m = u.pathname.match(/^\/file\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]+)/);
  let id = m ? m[1] : null;
  if (!id && ['/open', '/uc', '/download', '/thumbnail'].includes(u.pathname)) id = u.searchParams.get('id');
  return id && ID_DRIVE.test(id) ? id : null;
}

// Rujukan gambar yang disimpan: "drive:<ID>" atau null. Hanya Google Drive.
export const ekstrakRujukanGambar = (input) => { const id = ekstrakIdDrive(input); return id ? `drive:${id}` : null; };
export const idDariRujukan = (ref) => { const m = /^drive:([A-Za-z0-9_-]{20,80})$/.exec(String(ref ?? '')); return m ? m[1] : null; };

const thumbDrive = (id) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w800`;
// URL paparan gambar daripada rujukan yang disimpan. null jika rujukan tidak sah.
export const urlGambar = (ref) => { const id = idDariRujukan(ref); return id ? thumbDrive(id) : null; };
// Gambar automatik daripada video. HANYA untuk dipaparkan kepada yang layak melihat video itu (URL ini mendedahkan ID video).
export function urlGambarVideo(sumber, id) {
  if (!id) return null;
  if (sumber === 'drive') return ID_DRIVE.test(id) ? thumbDrive(id) : null;
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
// Pautan asal (untuk borang panel) bagi sumber video dan rujukan gambar.
export const pautanVideo = (sumber, id) => (!id ? '' : sumber === 'drive' ? `https://drive.google.com/file/d/${id}/view` : `https://youtu.be/${id}`);
// Pautan buka fail Google Drive (nota PDF). Hanya dihantar kepada yang layak (lihat pelajar-api /api/nota/<id>).
export const pautanFailDrive = (id) => (ID_DRIVE.test(String(id ?? '')) ? `https://drive.google.com/file/d/${id}/view` : null);
export const pautanGambar =(ref) => { const id = idDariRujukan(ref); return id ? `https://drive.google.com/file/d/${id}/view` : ''; };
