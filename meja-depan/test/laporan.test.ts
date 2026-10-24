import { describe, expect, it } from 'vitest';
import { validasi, type Kiriman } from '../src/formulir';
import { escapeHtml, pesanTelegram, renderPolos, renderTelegram, subjekSurel, susunLaporan } from '../src/laporan';
import { kirimanContoh } from './contoh';

const data = (lain: object = {}): Kiriman => {
  const h = validasi({ ...kirimanContoh(), ...lain });
  if (!h.ok) throw new Error(JSON.stringify(h.galat));
  return h.data;
};
const waktu = new Date('2026-10-24T03:00:00Z');
const lapor = (lain: object = {}) => susunLaporan(data(lain), { kode: 'ABC123', waktu });

describe('laporan', () => {
  it('kartu ringkas memuat nama, kontak, jenis, waktu, anggaran', () => {
    const t = renderTelegram(lapor({ namaUsaha: 'Kue Sari' }));
    expect(t).toContain('<b>Titip Ide baru</b> · #ABC123');
    expect(t).toContain('24 Okt 2026');
    expect(t).toContain('WIB');
    expect(t).toContain('<b>Nama:</b> Sari · Kue Sari');
    expect(t).toContain('<b>Kontak:</b> WhatsApp 0812-3456-7890');
    expect(t).toContain('<b>Mau dibuatkan:</b> Toko online &amp; transaksi');
    expect(t).toContain('<b>Dibutuhkan:</b> Dalam 1 bulan');
    expect(t).toContain('<b>Anggaran:</b> Rp1–3 juta');
    expect(t).toContain('<b>Jumlah produk:</b> Kurang dari 20');
    expect(t).toContain('<b>Bayar online:</b> Ya, pembeli langsung bayar di situs');
  });

  it('memakai label bahasa Indonesia walau formulir berbahasa lain', () => {
    const t = renderTelegram(lapor({ bahasa: 'ja', kontak: '+81 90 1234 5678' }));
    expect(t).toContain('<b>Bahasa formulir:</b> Jepang');
    expect(t).toContain('Toko online &amp; transaksi');
  });

  it('tautan WhatsApp hanya bila nomornya bisa dipastikan', () => {
    expect(lapor().tautanWa).toBe('6281234567890');
    expect(lapor({ bahasa: 'ja', kontak: '090-1234-5678' }).tautanWa).toBeNull();
    expect(lapor({ kontakJenis: 'surel', kontak: 'a@b.co' }).tautanWa).toBeNull();
  });

  it('teks panjang klien dipotong di Telegram tapi utuh di surel', () => {
    const masalah = 'kata '.repeat(290).trim();
    const l = lapor({ masalah });
    expect(renderTelegram(l)).toContain('…</blockquote>');
    expect(renderPolos(l, { utuh: true })).toContain(masalah);
  });

  it('pesan Telegram selalu di bawah 4096 karakter, bahkan dengan karakter yang membengkak saat di-escape', () => {
    const berat = '&'.repeat(1500);
    const l = susunLaporan(data({ usaha: '&'.repeat(500), masalah: berat, contoh: '&'.repeat(500) }), { kode: 'X', waktu });
    const p = pesanTelegram(l);
    expect(p.polos.length).toBeLessThanOrEqual(4096);
    if (p.html) expect(p.html.length).toBeLessThanOrEqual(4096);
  });

  it('subjek surel satu baris', () => {
    expect(subjekSurel(lapor({ nama: 'Sari\nBaris dua' }))).toBe('Titip Ide #ABC123: Sari Baris dua — Toko online & transaksi');
  });

  it('escapeHtml', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});
