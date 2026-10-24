import { describe, expect, it } from 'vitest';
import { bacaWhatsApp, bersihkanTeks, daftarLangkah, PERTANYAAN, surelSah, validasi } from '../src/formulir';
import { kirimanContoh } from './contoh';

describe('konfigurasi pertanyaan', () => {
  it('setiap jenis punya daftar lanjutan, dan setiap pertanyaan punya teks tiga bahasa', () => {
    for (const j of PERTANYAAN.jenis.pilihan) {
      expect(PERTANYAAN.lanjutan[j.id], j.id).toBeDefined();
      for (const p of PERTANYAAN.lanjutan[j.id]) {
        for (const b of ['id', 'en', 'ja'] as const) expect(p.pertanyaan[b], `${p.id} ${b}`).toBeTruthy();
        if (p.tipe === 'pilihan') expect(p.pilihan?.length, p.id).toBeGreaterThan(1);
      }
    }
  });

  it('rentang anggaran sesuai keputusan pemilik', () => {
    expect(PERTANYAAN.anggaran.pilihan.map((p) => p.label.id)).toEqual([
      'Di bawah Rp1 juta', 'Rp1–3 juta', 'Rp3–7 juta', 'Di atas Rp7 juta', 'Belum tahu',
    ]);
  });
});

describe('validasi', () => {
  it('menerima kiriman lengkap', () => {
    const h = validasi(kirimanContoh());
    expect(h.ok).toBe(true);
  });

  it('menandai medan wajib yang kosong', () => {
    const h = validasi({ ...kirimanContoh(), usaha: '   ', nama: '' });
    expect(h).toEqual({ ok: false, galat: { usaha: 'wajib', nama: 'wajib' } });
  });

  it('menolak teks yang terlalu panjang', () => {
    const h = validasi({ ...kirimanContoh(), masalah: 'x'.repeat(PERTANYAAN.batasPanjang.panjang + 1) });
    expect(h.ok).toBe(false);
    if (!h.ok) expect(h.galat.masalah).toBe('terlalu-panjang');
  });

  it('menolak pilihan yang tidak ada di konfigurasi', () => {
    const h = validasi({ ...kirimanContoh(), anggaran: 'sejuta-dolar', lanjutan: { produk: 'x', bayar: 'ya', pengurus: 'sendiri' } });
    expect(h.ok).toBe(false);
    if (!h.ok) expect(h.galat).toEqual({ anggaran: 'pilihan-tidak-dikenal', 'lanjutan.produk': 'pilihan-tidak-dikenal' });
  });

  it('mewajibkan lanjutan milik jenis yang dipilih dan membuang lanjutan jenis lain', () => {
    const h = validasi({ ...kirimanContoh(), lanjutan: { produk: 'kurang-20', halaman: '1-3', bayar: 'ya' } });
    expect(h.ok).toBe(false);
    if (!h.ok) expect(h.galat).toEqual({ 'lanjutan.pengurus': 'wajib' });
    const h2 = validasi({ ...kirimanContoh(), lanjutan: { ...kirimanContoh().lanjutan, halaman: '1-3' } });
    expect(h2.ok && h2.data.lanjutan).toEqual(kirimanContoh().lanjutan);
  });

  it('lanjutan teks opsional boleh kosong', () => {
    const h = validasi({ ...kirimanContoh(), jenis: 'desktop', lanjutan: { sistem: 'windows', pengguna: 'sendiri' } });
    expect(h.ok).toBe(true);
  });

  it('memeriksa kontak sesuai jenisnya', () => {
    expect(validasi({ ...kirimanContoh(), kontak: '12' }).ok).toBe(false);
    expect(validasi({ ...kirimanContoh(), kontakJenis: 'surel', kontak: 'sari@contoh.id' }).ok).toBe(true);
    expect(validasi({ ...kirimanContoh(), kontakJenis: 'surel', kontak: 'bukan surel' }).ok).toBe(false);
    expect(validasi({ ...kirimanContoh(), kontakJenis: 'telepon' }).ok).toBe(false);
  });

  it('mengabaikan medan tambahan yang tidak dikenal', () => {
    const h = validasi({ ...kirimanContoh(), alamat: 'Jl. Rahasia 1', ktp: '123' });
    expect(h.ok && Object.keys(h.data)).not.toContain('alamat');
  });

  it('tidak macet pada masukan bukan objek', () => {
    expect(validasi(null).ok).toBe(false);
    expect(validasi('teks').ok).toBe(false);
  });
});

describe('pembantu', () => {
  it('membersihkan karakter kendali dan baris kosong berlebih', () => {
    expect(bersihkanTeks('  a\u0000b\r\n\r\n\r\n\r\nc‮  ')).toBe('ab\n\nc');
    expect(bersihkanTeks(42)).toBe('');
  });

  it('membaca nomor WhatsApp', () => {
    expect(bacaWhatsApp('0812-3456-7890', 'id')).toEqual({ sah: true, wa: '6281234567890' });
    expect(bacaWhatsApp('+81 90 1234 5678', 'ja')).toEqual({ sah: true, wa: '819012345678' });
    expect(bacaWhatsApp('090-1234-5678', 'ja')).toEqual({ sah: true, wa: null });
    expect(bacaWhatsApp('halo', 'id').sah).toBe(false);
  });

  it('memeriksa surel', () => {
    expect(surelSah('a@b.co')).toBe(true);
    expect(surelSah('a@b')).toBe(false);
    expect(surelSah('<a@b.co>')).toBe(false);
  });

  it('menyusun urutan layar per jenis', () => {
    expect(daftarLangkah('situs')).toEqual([
      'jenis', 'usaha', 'masalah', 'lanjutan.halaman', 'lanjutan.ubahIsi', 'lanjutan.login',
      'contoh', 'waktu', 'anggaran', 'kontak', 'ringkasan',
    ]);
    expect(daftarLangkah('')).toEqual(['jenis', 'usaha', 'masalah', 'contoh', 'waktu', 'anggaran', 'kontak', 'ringkasan']);
  });
});
