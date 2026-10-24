// Aturan tanpa AI: perkiraan tingkat proyek (SPEC §7), hal yang belum jelas,
// dan draf penawaran singkat (SPEC §8). Semua aturan dan teksnya dibaca dari
// konfigurasi/tingkat.json dan konfigurasi/draf.json.
import drafJson from '../konfigurasi/draf.json';
import tingkatJson from '../konfigurasi/tingkat.json';
import { PERTANYAAN, type Bahasa, type Kiriman, type KonfigurasiPertanyaan, type Teks3 } from './formulir';

export type KonfigurasiTingkat = {
  hargaPatokan: Record<string, string>;
  tingkat: { id: string; nama: string; jikaAda: string[] }[];
  labelCiri: Record<string, string>;
  ciriJenis: Record<string, string[]>;
  ciriJawaban: Record<string, Record<string, string[]>>;
};

type TeksDraf = { salam: string; pengantarPoin: string; harga: string; caraBayar: string; tambahan: string; penutup: string };
export type KonfigurasiDraf = {
  belumJelas: {
    jawabanBelumTahu: string;
    anggaranBelumTahu: string;
    jenisLainnya: string;
    waktuSecepatnya: string;
    tanpaContoh: string;
    masalahSingkat: string;
    batasMasalahSingkat: number;
    perJenis: Record<string, string[]>;
    perJawaban: Record<string, string[]>;
  };
  draf: Record<Bahasa, TeksDraf>;
  poin: {
    jenis: Record<string, Teks3[]>;
    lanjutan: Record<string, Record<string, Teks3>>;
    teks: Record<string, Teks3>;
  };
};

export const TINGKAT = tingkatJson as KonfigurasiTingkat;
export const DRAF = drafJson as KonfigurasiDraf;

export const HARGA_KOSONG = '[isi harga]';
const BELUM_TAHU = 'belum-tahu';

export type Perkiraan = { id: string; nama: string; alasan: string; kasar: boolean };

// Ciri proyek yang terbaca dari jawaban (mis. "login", "transaksi").
export function kumpulkanCiri(data: Kiriman, kt: KonfigurasiTingkat = TINGKAT): Set<string> {
  const ciri = new Set(kt.ciriJenis[data.jenis] ?? []);
  for (const [id, jawaban] of Object.entries(data.lanjutan)) {
    for (const c of kt.ciriJawaban[id]?.[jawaban] ?? []) ciri.add(c);
  }
  return ciri;
}

// Tingkat pertama (urut dari atas) yang salah satu cirinya ada; tingkat tanpa
// syarat (jikaAda kosong) menjadi bawaan.
export function perkiraTingkat(data: Kiriman, kt: KonfigurasiTingkat = TINGKAT): Perkiraan {
  const ciri = kumpulkanCiri(data, kt);
  const kasar = data.jenis === 'lainnya' || Object.values(data.lanjutan).includes(BELUM_TAHU);
  for (const t of kt.tingkat) {
    const cocok = t.jikaAda.filter((c) => ciri.has(c));
    if (cocok.length || t.jikaAda.length === 0) {
      const alasan = cocok.length
        ? cocok.map((c) => kt.labelCiri[c] ?? c).join(', ')
        : 'tidak ada login, data yang diubah lewat panel, atau transaksi';
      return { id: t.id, nama: t.nama, alasan, kasar };
    }
  }
  throw new Error('konfigurasi tingkat tidak punya tingkat bawaan (jikaAda kosong)');
}

export function hargaPatokan(tingkat: string, kt: KonfigurasiTingkat = TINGKAT): string {
  return kt.hargaPatokan[tingkat]?.trim() || HARGA_KOSONG;
}

// Daftar pertanyaan yang perlu ditanyakan pemilik ke klien.
export function halBelumJelas(data: Kiriman, kd: KonfigurasiDraf = DRAF, kp: KonfigurasiPertanyaan = PERTANYAAN): string[] {
  const b = kd.belumJelas;
  const daftar: string[] = [];
  if (data.jenis === 'lainnya') daftar.push(b.jenisLainnya);
  for (const p of kp.lanjutan[data.jenis] ?? []) {
    const jawaban = data.lanjutan[p.id];
    if (jawaban === BELUM_TAHU) daftar.push(b.jawabanBelumTahu.replace('{pertanyaan}', () => p.pertanyaan.id));
    if (jawaban) daftar.push(...(b.perJawaban[`${p.id}.${jawaban}`] ?? []));
  }
  if (data.masalah.length < b.batasMasalahSingkat) daftar.push(b.masalahSingkat);
  if (data.anggaran === BELUM_TAHU) daftar.push(b.anggaranBelumTahu);
  if (data.waktu === 'secepatnya') daftar.push(b.waktuSecepatnya);
  if (!data.contoh) daftar.push(b.tanpaContoh);
  daftar.push(...(b.perJenis[data.jenis] ?? []));
  return daftar;
}

const potongPoin = (t: string) => (t.length <= 160 ? t : `${t.slice(0, 159).trimEnd()}…`);

// Poin "apa yang dibuat", dalam bahasa formulir klien.
export function poinPekerjaan(data: Kiriman, kd: KonfigurasiDraf = DRAF, kp: KonfigurasiPertanyaan = PERTANYAAN): string[] {
  const bhs = data.bahasa;
  const poin = (kd.poin.jenis[data.jenis] ?? []).map((t) => t[bhs]);
  for (const p of kp.lanjutan[data.jenis] ?? []) {
    const jawaban = data.lanjutan[p.id];
    if (!jawaban) continue;
    if (p.tipe === 'teks') {
      const pola = kd.poin.teks[p.id]?.[bhs];
      if (pola) poin.push(pola.replace('{teks}', () => potongPoin(jawaban.replace(/\s*\n\s*/g, ' '))));
    } else {
      const t = kd.poin.lanjutan[p.id]?.[jawaban]?.[bhs];
      if (t) poin.push(t);
    }
  }
  return poin;
}

// Draf pesan WhatsApp untuk klien (SPEC §8), dalam bahasa formulir klien.
export function susunDraf(data: Kiriman, tingkat: string, kd: KonfigurasiDraf = DRAF, kt: KonfigurasiTingkat = TINGKAT): string {
  const t = kd.draf[data.bahasa];
  const nama = data.nama.replace(/\s*\n\s*/g, ' ');
  return [
    t.salam.replace('{nama}', () => nama),
    [t.pengantarPoin, ...poinPekerjaan(data, kd).map((p) => `• ${p}`)].join('\n'),
    t.harga.replace('{harga}', () => hargaPatokan(tingkat, kt)),
    t.caraBayar,
    t.tambahan,
    t.penutup,
  ].join('\n\n');
}
