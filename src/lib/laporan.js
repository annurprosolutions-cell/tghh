// Peraturan laporan kandungan (F-17). Fungsi tulen, tiada I/O.
export const SEBAB = ['salah-fakta', 'kebencian-takfir', 'tiada-rujukan', 'lain'];
export const STATUS_LAPORAN = ['baru', 'disemak', 'selesai'];
export const LABEL_SEBAB = { 'salah-fakta': 'Salah fakta', 'kebencian-takfir': 'Kandungan kebencian atau takfir', 'tiada-rujukan': 'Tiada rujukan', lain: 'Lain-lain' };
export const MAKS_CATATAN = 500;
export const HAD_LAPORAN_SEHARI = 5;

const gagal = (sebab, medan) => ({ ok: false, sebab, ...(medan ? { medan } : {}) });
const bersih = (t) => String(t ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\n{3,}/g, '\n\n').trim();
const idSah = (v) => Number.isInteger(v) && v > 0;

// Laporan baharu daripada ahli: subject_id wajib, soalan_id pilihan, sebab dalam enum, catatan maks 500.
export function sahkanLaporan(m) {
  if (!m || typeof m !== 'object' || Array.isArray(m)) return gagal('badan-tidak-sah');
  if (!idSah(m.subject_id)) return gagal('kuliah-tidak-sah', 'subject_id');
  if (m.soalan_id != null && !idSah(m.soalan_id)) return gagal('soalan-tidak-sah', 'soalan_id');
  if (!SEBAB.includes(m.sebab)) return gagal('sebab-tidak-sah', 'sebab');
  if (m.catatan != null && typeof m.catatan !== 'string') return gagal('catatan-tidak-sah', 'catatan');
  const catatan = bersih(m.catatan);
  if (catatan.length > MAKS_CATATAN) return gagal('catatan-terlalu-panjang', 'catatan');
  return { ok: true, nilai: { subject_id: m.subject_id, soalan_id: m.soalan_id ?? null, sebab: m.sebab, catatan } };
}

// Kemas kini oleh admin: status dalam enum dan/atau catatan_admin maks 500. Separa.
export function sahkanKemaskiniLaporan(m) {
  if (!m || typeof m !== 'object' || Array.isArray(m)) return gagal('badan-tidak-sah');
  const n = {};
  if ('status' in m) { if (!STATUS_LAPORAN.includes(m.status)) return gagal('status-tidak-sah', 'status'); n.status = m.status; }
  if ('catatan_admin' in m) {
    if (m.catatan_admin == null || m.catatan_admin === '') n.catatan_admin = null;
    else if (typeof m.catatan_admin !== 'string') return gagal('catatan-tidak-sah', 'catatan_admin');
    else { const t = bersih(m.catatan_admin); if (t.length > MAKS_CATATAN) return gagal('catatan-terlalu-panjang', 'catatan_admin'); n.catatan_admin = t || null; }
  }
  if (!Object.keys(n).length) return gagal('tiada-perubahan');
  return { ok: true, nilai: n };
}
