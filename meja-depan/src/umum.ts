// Konfigurasi umum Meja Depan (meja-depan/konfigurasi/umum.json), bertipe.
import umumJson from '../konfigurasi/umum.json';

export type KonfigurasiUmum = {
  alamatWorker: string;
  turnstileSiteKey: string;
  asalDiizinkan: string[];
  surelPemilik: string;
  pengirimSurel: string;
  batasKiriman: { jumlah: number; jendelaMenit: number };
};

export const UMUM = umumJson as KonfigurasiUmum;
