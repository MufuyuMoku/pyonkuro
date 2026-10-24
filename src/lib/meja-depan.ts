// Alamat worker Meja Depan. Diisi pemilik di meja-depan/konfigurasi/umum.json;
// variabel lingkungan MEJA_DEPAN_URL saat build menimpanya (untuk pengujian lokal).
// Kosong berarti formulir Titip Ide belum aktif.
import umum from '../../meja-depan/konfigurasi/umum.json';

export const ALAMAT_WORKER: string = (import.meta.env.MEJA_DEPAN_URL ?? umum.alamatWorker).replace(/\/+$/, '');
export const TITIP_AKTIF = ALAMAT_WORKER !== '';
export const TURNSTILE_SITE_KEY: string = umum.turnstileSiteKey;
