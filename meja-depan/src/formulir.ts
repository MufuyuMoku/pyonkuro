// Bentuk kiriman formulir Titip Ide dan validasinya.
// Dipakai di dua tempat dengan aturan yang sama: browser (halaman Titip Ide)
// dan worker. Jangan mengimpor apa pun yang khusus Cloudflare atau DOM di sini.
import pertanyaanJson from '../konfigurasi/pertanyaan.json';

export const BAHASA = ['id', 'en', 'ja'] as const;
export type Bahasa = (typeof BAHASA)[number];
export type Teks3 = Record<Bahasa, string>;

export type Pilihan = { id: string; label: Teks3 };
export type PertanyaanLanjutan = {
  id: string;
  tipe: 'pilihan' | 'teks';
  wajib: boolean;
  pertanyaan: Teks3;
  petunjuk?: Teks3;
  pilihan?: Pilihan[];
};
export type DaftarPilihan = { pertanyaan: Teks3; pilihan: Pilihan[] };
export type KonfigurasiPertanyaan = {
  batasPanjang: { pendek: number; sedang: number; panjang: number };
  jenis: DaftarPilihan;
  lanjutan: Record<string, PertanyaanLanjutan[]>;
  waktu: DaftarPilihan;
  anggaran: DaftarPilihan;
};

export const PERTANYAAN = pertanyaanJson as KonfigurasiPertanyaan;

export type JenisKontak = 'whatsapp' | 'surel';

export type Kiriman = {
  bahasa: Bahasa;
  jenis: string;
  usaha: string;
  masalah: string;
  lanjutan: Record<string, string>;
  contoh: string;
  waktu: string;
  anggaran: string;
  nama: string;
  kontakJenis: JenisKontak;
  kontak: string;
  namaUsaha: string;
};

export type KodeGalat = 'wajib' | 'terlalu-panjang' | 'pilihan-tidak-dikenal' | 'kontak-tidak-sah';
export type HasilValidasi =
  | { ok: true; data: Kiriman }
  | { ok: false; galat: Record<string, KodeGalat> };

// Batas panjang per medan teks. Lanjutan bertipe teks memakai "sedang".
export function batasMedan(k: KonfigurasiPertanyaan = PERTANYAAN) {
  const b = k.batasPanjang;
  return {
    usaha: b.sedang,
    masalah: b.panjang,
    contoh: b.sedang,
    nama: b.pendek,
    kontak: b.pendek,
    namaUsaha: b.pendek,
    lanjutanTeks: b.sedang,
  };
}

// Membuang karakter kendali (kecuali baris baru), merapikan baris baru, dan memangkas spasi.
export function bersihkanTeks(x: unknown): string {
  if (typeof x !== 'string') return '';
  return x
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Nomor WhatsApp: angka 8–15 digit, boleh diawali "+", spasi/tanda hubung/titik/kurung diabaikan.
// `wa` berisi angka untuk tautan wa.me bila kode negaranya bisa dipastikan, selain itu null.
export function bacaWhatsApp(x: string, bahasa: Bahasa): { sah: boolean; wa: string | null } {
  const ringkas = x.replace(/[\s().\-]/g, '');
  if (!/^\+?\d{8,15}$/.test(ringkas)) return { sah: false, wa: null };
  const angka = ringkas.replace('+', '');
  if (ringkas.startsWith('+') || angka.startsWith('62')) return { sah: true, wa: angka };
  // Nomor lokal Indonesia (08…) hanya diubah ke 628… bila klien memakai formulir bahasa Indonesia.
  if (angka.startsWith('0') && bahasa === 'id') return { sah: true, wa: `62${angka.slice(1)}` };
  return { sah: true, wa: null };
}

export function surelSah(x: string): boolean {
  return x.length <= 254 && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>".]{2,}$/.test(x);
}

// Urutan layar formulir untuk jenis tertentu (satu pertanyaan per layar).
export function daftarLangkah(jenis: string, k: KonfigurasiPertanyaan = PERTANYAAN): string[] {
  const lanjutan = (k.lanjutan[jenis] ?? []).map((p) => `lanjutan.${p.id}`);
  return ['jenis', 'usaha', 'masalah', ...lanjutan, 'contoh', 'waktu', 'anggaran', 'kontak', 'ringkasan'];
}

export function validasi(masukan: unknown, k: KonfigurasiPertanyaan = PERTANYAAN): HasilValidasi {
  const m = (masukan && typeof masukan === 'object' ? masukan : {}) as Record<string, unknown>;
  const galat: Record<string, KodeGalat> = {};
  const batas = batasMedan(k);

  const bahasa: Bahasa = (BAHASA as readonly string[]).includes(m.bahasa as string) ? (m.bahasa as Bahasa) : 'id';

  const teks = (medan: string, panjang: number, wajib: boolean, nilai: unknown = m[medan]) => {
    const t = bersihkanTeks(nilai);
    if (wajib && !t) galat[medan] = 'wajib';
    else if (t.length > panjang) galat[medan] = 'terlalu-panjang';
    return t;
  };
  const pilih = (medan: string, daftar: Pilihan[], nilai: unknown = m[medan]) => {
    if (typeof nilai !== 'string' || nilai === '') {
      galat[medan] = 'wajib';
      return '';
    }
    if (!daftar.some((p) => p.id === nilai)) galat[medan] = 'pilihan-tidak-dikenal';
    return nilai;
  };

  const jenis = pilih('jenis', k.jenis.pilihan);
  const usaha = teks('usaha', batas.usaha, true);
  const masalah = teks('masalah', batas.masalah, true);

  // Hanya jawaban lanjutan milik jenis yang dipilih yang diterima; sisanya dibuang.
  const lanjutanMasuk = (m.lanjutan && typeof m.lanjutan === 'object' ? m.lanjutan : {}) as Record<string, unknown>;
  const lanjutan: Record<string, string> = {};
  for (const p of k.lanjutan[jenis] ?? []) {
    const medan = `lanjutan.${p.id}`;
    const nilai = lanjutanMasuk[p.id];
    if (p.tipe === 'pilihan') {
      if (!p.wajib && (nilai === undefined || nilai === '')) continue;
      lanjutan[p.id] = pilih(medan, p.pilihan ?? [], nilai);
    } else {
      const t = teks(medan, batas.lanjutanTeks, p.wajib, nilai);
      if (t) lanjutan[p.id] = t;
    }
  }

  const contoh = teks('contoh', batas.contoh, false);
  const waktu = pilih('waktu', k.waktu.pilihan);
  const anggaran = pilih('anggaran', k.anggaran.pilihan);
  const nama = teks('nama', batas.nama, true);
  const namaUsaha = teks('namaUsaha', batas.namaUsaha, false);

  let kontakJenis: JenisKontak = 'whatsapp';
  if (m.kontakJenis === 'whatsapp' || m.kontakJenis === 'surel') kontakJenis = m.kontakJenis;
  else galat.kontakJenis = 'wajib';
  const kontak = teks('kontak', batas.kontak, true);
  if (kontak && !galat.kontak) {
    const sah = kontakJenis === 'surel' ? surelSah(kontak) : bacaWhatsApp(kontak, bahasa).sah;
    if (!sah) galat.kontak = 'kontak-tidak-sah';
  }

  if (Object.keys(galat).length) return { ok: false, galat };
  return {
    ok: true,
    data: { bahasa, jenis, usaha, masalah, lanjutan, contoh, waktu, anggaran, nama, kontakJenis, kontak, namaUsaha },
  };
}

// Medan yang divalidasi pada satu layar formulir (untuk validasi per langkah di browser).
export function medanLangkah(langkah: string): string[] {
  if (langkah === 'kontak') return ['nama', 'kontakJenis', 'kontak', 'namaUsaha'];
  if (langkah === 'ringkasan') return [];
  return [langkah];
}
