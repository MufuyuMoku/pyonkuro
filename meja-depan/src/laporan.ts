// Menyusun laporan untuk pemilik dari kiriman yang sudah divalidasi, lalu
// merendernya untuk Telegram (HTML terbatas) dan surel (teks polos).
//
// Aturan keamanan (SPEC §10): semua teks dari klien di-escape, dan teks panjang
// dari klien selalu tampil di dalam kutipan supaya tidak bisa menyamar sebagai
// bagian laporan (mis. menulis "Tingkat: Kecil" di kolom masalah).
import { halBelumJelas, hargaPatokan, perkiraTingkat, susunDraf } from './aturan';
import { bacaWhatsApp, PERTANYAAN, type Kiriman, type KonfigurasiPertanyaan, type Pilihan } from './formulir';
import type { PesanTelegram } from './saluran';

// Satu baris laporan. `kutipan` = teks bebas dari klien, ditampilkan sebagai kutipan.
export type Baris = { label?: string; teks: string; kutipan?: boolean; batas?: number };
export type Bagian = { judul?: string; baris: Baris[] };

export type Laporan = {
  kode: string;
  waktu: Date;
  data: Kiriman;
  tautanWa: string | null;
  bagian: Bagian[];
};

const NAMA_BAHASA = { id: 'Indonesia', en: 'Inggris', ja: 'Jepang' } as const;

export const labelPilihan = (daftar: Pilihan[] | undefined, id: string) =>
  daftar?.find((p) => p.id === id)?.label.id ?? id;

// Teks satu baris: baris baru jadi spasi (untuk nama, kontak, dll.).
const sebaris = (t: string) => t.replace(/\s*\n\s*/g, ' ');

export function potong(t: string, batas: number): string {
  return t.length <= batas ? t : `${t.slice(0, batas - 1).trimEnd()}…`;
}

export function escapeHtml(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function tanggalWib(d: Date): string {
  return `${d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB`;
}

// Kartu ringkas dan ringkasan kebutuhan (berbasis aturan, tanpa AI).
export function susunLaporan(
  data: Kiriman,
  opsi: { kode: string; waktu: Date; tambahan?: Bagian[]; ringkasanAi?: string[] },
  k: KonfigurasiPertanyaan = PERTANYAAN,
): Laporan {
  const jenis = labelPilihan(k.jenis.pilihan, data.jenis);
  const lewat = data.kontakJenis === 'surel' ? 'Surel' : 'WhatsApp';
  const wa = data.kontakJenis === 'whatsapp' ? bacaWhatsApp(data.kontak, data.bahasa).wa : null;

  const kartu: Bagian = {
    baris: [
      { label: 'Nama', teks: sebaris(data.namaUsaha ? `${data.nama} · ${data.namaUsaha}` : data.nama) },
      { label: 'Kontak', teks: `${lewat} ${sebaris(data.kontak)}` },
      { label: 'Mau dibuatkan', teks: jenis },
      { label: 'Dibutuhkan', teks: labelPilihan(k.waktu.pilihan, data.waktu) },
      { label: 'Anggaran', teks: labelPilihan(k.anggaran.pilihan, data.anggaran) },
      { label: 'Bahasa formulir', teks: NAMA_BAHASA[data.bahasa] },
    ],
  };

  const detail: Baris[] = (k.lanjutan[data.jenis] ?? []).flatMap((p): Baris[] => {
    const nilai = data.lanjutan[p.id];
    if (!nilai) return [];
    return p.tipe === 'pilihan'
      ? [{ label: p.labelLaporan, teks: labelPilihan(p.pilihan, nilai) }]
      : [{ label: p.labelLaporan, teks: nilai, kutipan: true, batas: 400 }];
  });

  // Ringkasan dari AI (bila ada) tampil di atas jawaban asli klien, yang tetap disertakan.
  const ringkasanAi: Bagian[] = opsi.ringkasanAi?.length
    ? [{ judul: 'Ringkasan kebutuhan (dirapikan AI)', baris: opsi.ringkasanAi.map((t) => ({ teks: `• ${t}` })) }]
    : [];
  const ringkasan: Bagian = {
    judul: ringkasanAi.length ? 'Jawaban klien' : 'Ringkasan kebutuhan',
    baris: [
      { label: 'Usaha', teks: data.usaha, kutipan: true, batas: 300 },
      { label: 'Masalah', teks: data.masalah, kutipan: true, batas: 900 },
      ...detail,
      ...(data.contoh ? [{ label: 'Contoh yang disukai', teks: data.contoh, kutipan: true, batas: 300 }] : []),
    ],
  };

  return { kode: opsi.kode, waktu: opsi.waktu, data, tautanWa: wa, bagian: [kartu, ...ringkasanAi, ringkasan, ...(opsi.tambahan ?? [])] };
}

// --- Render ----------------------------------------------------------------

const BATAS_TELEGRAM = 4096;

// HTML untuk Telegram (parse_mode HTML). Teks klien di-escape dan dipotong.
export function renderTelegram(l: Laporan): string {
  const kepala = `<b>Titip Ide baru</b> · #${escapeHtml(l.kode)}\n${escapeHtml(tanggalWib(l.waktu))}`;
  const isi = l.bagian.map((b) => {
    const baris = b.baris.map((r) => {
      const teks = escapeHtml(r.batas ? potong(r.teks, r.batas) : r.teks);
      const label = r.label ? `<b>${escapeHtml(r.label)}:</b>` : '';
      return r.kutipan ? `${label}\n<blockquote>${teks}</blockquote>` : `${label}${label ? ' ' : ''}${teks}`;
    });
    return (b.judul ? [`<b>${escapeHtml(b.judul.toUpperCase())}</b>`, ...baris] : baris).join('\n');
  });
  return [kepala, ...isi].join('\n\n');
}

// Teks polos: untuk surel (utuh) atau cadangan Telegram (dipotong).
export function renderPolos(l: Laporan, { utuh }: { utuh: boolean }): string {
  const kepala = `Titip Ide baru · #${l.kode}\n${tanggalWib(l.waktu)}`;
  const isi = l.bagian.map((b) => {
    const baris = b.baris.map((r) => {
      const teks = !utuh && r.batas ? potong(r.teks, r.batas) : r.teks;
      const label = r.label ? `${r.label}:` : '';
      return r.kutipan
        ? `${label}\n${teks.split('\n').map((x) => `> ${x}`).join('\n')}`
        : `${label}${label ? ' ' : ''}${teks}`;
    });
    return (b.judul ? [b.judul.toUpperCase(), ...baris] : baris).join('\n');
  });
  return [kepala, ...isi].join('\n\n');
}

export function subjekSurel(l: Laporan): string {
  return potong(sebaris(`Titip Ide #${l.kode}: ${l.data.nama} — ${labelPilihan(PERTANYAAN.jenis.pilihan, l.data.jenis)}`), 150);
}

// Pesan Telegram siap kirim: HTML bila muat, selalu dengan cadangan teks polos.
export function pesanTelegram(l: Laporan): PesanTelegram {
  const html = renderTelegram(l);
  const polos = potong(renderPolos(l, { utuh: false }), BATAS_TELEGRAM);
  const tombol = l.tautanWa ? { teks: 'Buka chat WhatsApp', url: `https://wa.me/${l.tautanWa}` } : null;
  return { ...(html.length <= BATAS_TELEGRAM ? { html } : {}), polos, tombol };
}

// --- Laporan lengkap: tingkat, hal yang belum jelas, dan draf (SPEC §6–§8) ---

const BATAS_URL_TOMBOL = 2000;

export type Paket = { laporan: Laporan; draf: string; pesan: PesanTelegram[]; surel: string };

// Bagian tambahan bisa diganti (mis. oleh lapisan AI); tingkat dan harga selalu dari aturan.
export function susunPaket(
  data: Kiriman,
  opsi: { kode: string; waktu: Date; ringkasanAi?: string[]; belumJelas?: string[]; draf?: string },
): Paket {
  const perkiraan = perkiraTingkat(data);
  const draf = opsi.draf ?? susunDraf(data, perkiraan.id);
  const belum = opsi.belumJelas ?? halBelumJelas(data);
  const tambahan: Bagian[] = [
    {
      judul: 'Perkiraan tingkat (hanya untuk pemilik)',
      baris: [
        { label: perkiraan.nama, teks: perkiraan.kasar ? `${perkiraan.alasan}. Perkiraan kasar: ada jawaban "belum tahu".` : perkiraan.alasan },
        { label: 'Harga patokan', teks: hargaPatokan(perkiraan.id) },
      ],
    },
    { judul: 'Hal yang belum jelas', baris: belum.length ? belum.map((t) => ({ teks: `• ${t}` })) : [{ teks: '—' }] },
  ];
  const laporan = susunLaporan(data, { kode: opsi.kode, waktu: opsi.waktu, tambahan, ringkasanAi: opsi.ringkasanAi });

  const urlDraf = laporan.tautanWa ? `https://wa.me/${laporan.tautanWa}?text=${encodeURIComponent(draf)}` : null;
  const pesanDraf: PesanTelegram = {
    polos: draf,
    tombol: urlDraf && urlDraf.length <= BATAS_URL_TOMBOL ? { teks: 'Kirim draf lewat WhatsApp', url: urlDraf } : null,
  };
  const keterangan: Bagian = { baris: [{ teks: 'Draf penawaran ada di pesan berikutnya. Isi harga sebelum dikirim.' }] };
  const utama = pesanTelegram({ ...laporan, bagian: [...laporan.bagian, keterangan] });

  const surel = [renderPolos(laporan, { utuh: true }), `DRAF PENAWARAN (bahasa formulir klien)\n${draf}`].join('\n\n');
  return { laporan, draf, pesan: [utama, pesanDraf], surel };
}
