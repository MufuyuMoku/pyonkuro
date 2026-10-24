import { describe, expect, it } from 'vitest';
import { DRAF, halBelumJelas, hargaPatokan, kumpulkanCiri, perkiraTingkat, poinPekerjaan, susunDraf, TINGKAT, type KonfigurasiTingkat } from '../src/aturan';
import { BAHASA, PERTANYAAN, validasi, type Kiriman } from '../src/formulir';
import { kirimanContoh } from './contoh';

const data = (lain: object = {}): Kiriman => {
  const h = validasi({ ...kirimanContoh(), ...lain });
  if (!h.ok) throw new Error(JSON.stringify(h.galat));
  return h.data;
};
const situs = (lanjutan: object) => data({ jenis: 'situs', lanjutan: { halaman: '1-3', ubahIsi: 'jarang', login: 'tidak', ...lanjutan } });

describe('aturan tingkat (SPEC §7)', () => {
  it('Kecil: 1–3 halaman, tanpa database, tanpa login', () => {
    const t = perkiraTingkat(situs({}));
    expect(t).toMatchObject({ id: 'kecil', nama: 'Kecil', kasar: false });
    expect(t.alasan).toContain('tidak ada login');
  });

  it('Sedang: isi diubah lewat panel', () => {
    expect(perkiraTingkat(situs({ ubahIsi: 'sendiri' })).id).toBe('sedang');
  });

  it('Sedang: ada login', () => {
    expect(perkiraTingkat(situs({ login: 'ya' }))).toMatchObject({ id: 'sedang', alasan: 'ada login' });
    expect(perkiraTingkat(data({ jenis: 'hp', lanjutan: { pemakai: 'pelanggan', akun: 'ya', luring: 'tidak' } })).id).toBe('sedang');
  });

  it('Sedang: lebih dari 3 halaman walau tanpa login', () => {
    expect(perkiraTingkat(situs({ halaman: '4-10' }))).toMatchObject({ id: 'sedang', alasan: 'lebih dari 3 halaman' });
  });

  it('Sedang: aplikasi desktop dengan data bersama', () => {
    expect(perkiraTingkat(data({ jenis: 'desktop', lanjutan: { sistem: 'windows', pengguna: 'beberapa' } })).id).toBe('sedang');
  });

  it('Besar: toko online (ada transaksi), dengan atau tanpa pembayaran online', () => {
    expect(perkiraTingkat(data()).alasan).toBe('ada pesanan/transaksi, ada pembayaran online');
    expect(perkiraTingkat(data({ lanjutan: { produk: 'kurang-20', bayar: 'tidak', pengurus: 'sendiri' } })).id).toBe('besar');
  });

  it('Besar: beberapa peran pengguna', () => {
    expect(perkiraTingkat(data({ jenis: 'desktop', lanjutan: { sistem: 'linux', pengguna: 'peran' } }))).toMatchObject({
      id: 'besar', alasan: 'beberapa peran pengguna',
    });
  });

  it('tingkat tertinggi menang bila ada ciri dari beberapa tingkat', () => {
    expect(perkiraTingkat(data({ jenis: 'desktop', lanjutan: { sistem: 'linux', pengguna: 'peran' } })).id).toBe('besar');
    expect(kumpulkanCiri(data({ jenis: 'desktop', lanjutan: { sistem: 'linux', pengguna: 'peran' } }))).toEqual(new Set(['banyakPeran', 'login']));
  });

  it('jawaban "belum tahu" atau jenis lainnya menandai perkiraan kasar', () => {
    expect(perkiraTingkat(situs({ login: 'belum-tahu' })).kasar).toBe(true);
    expect(perkiraTingkat(data({ jenis: 'lainnya', lanjutan: { bayangan: 'Alat jadwal les' } }))).toMatchObject({ id: 'kecil', kasar: true });
  });

  it('aturan dibaca dari konfigurasi, bukan kode', () => {
    const kt: KonfigurasiTingkat = { ...TINGKAT, tingkat: [{ id: 'besar', nama: 'Besar', jikaAda: ['login'] }, { id: 'kecil', nama: 'Kecil', jikaAda: [] }] };
    expect(perkiraTingkat(situs({ login: 'ya' }), kt).id).toBe('besar');
  });

  it('konfigurasi tanpa tingkat bawaan ditolak dengan jelas', () => {
    const kt: KonfigurasiTingkat = { ...TINGKAT, tingkat: [{ id: 'besar', nama: 'Besar', jikaAda: ['login'] }] };
    expect(() => perkiraTingkat(situs({}), kt)).toThrow(/tingkat bawaan/);
  });
});

describe('harga patokan', () => {
  it('kosong → "[isi harga]" (keputusan pemilik)', () => {
    expect(Object.values(TINGKAT.hargaPatokan)).toEqual(['', '', '']);
    expect(hargaPatokan('besar')).toBe('[isi harga]');
  });
  it('terisi → dipakai apa adanya', () => {
    expect(hargaPatokan('kecil', { ...TINGKAT, hargaPatokan: { kecil: 'Rp1.500.000' } })).toBe('Rp1.500.000');
  });
});

describe('hal yang belum jelas', () => {
  it('menanyakan jawaban "belum tahu", anggaran, waktu, contoh, dan pertanyaan baku per jenis', () => {
    const d = data({ anggaran: 'belum-tahu', waktu: 'secepatnya', lanjutan: { produk: 'belum-tahu', bayar: 'ya', pengurus: 'sendiri' } });
    expect(halBelumJelas(d)).toEqual([
      'Kira-kira ada berapa jenis produk? (klien menjawab belum tahu)',
      'Sudah punya akun penyedia pembayaran (payment gateway) untuk QRIS?',
      'Masalahnya perlu diceritakan lebih rinci.',
      'Berapa kisaran anggarannya? (klien belum tahu)',
      'Tanggal pastinya kapan? Klien ingin secepatnya.',
      'Ada contoh situs atau aplikasi yang disukai?',
      'Pengiriman dan ongkirnya dihitung bagaimana?',
    ]);
  });

  it('jenis lainnya meminta bentuk yang cocok', () => {
    expect(halBelumJelas(data({ jenis: 'lainnya', lanjutan: { bayangan: 'x' } }))[0]).toMatch(/^Bentuk yang paling cocok/);
  });
});

describe('draf penawaran (SPEC §8)', () => {
  it('memuat apa yang dibuat, harga, cara bayar, dan kalimat penawaran tambahan', () => {
    const d = susunDraf(data(), 'besar');
    expect(d).toBe([
      'Halo Sari, terima kasih sudah menitipkan ide ke Pyonkuro.',
      'Dari ceritamu, ini yang akan dibuat:\n• Toko online dengan katalog, keranjang, dan checkout\n• Panel admin untuk produk, stok, dan pesanan\n• Katalog hingga sekitar 20 produk\n• Pembayaran QRIS',
      'Harga: [isi harga]',
      'Cara bayar: DP sebelum mulai, pelunasan saat serah terima. Revisi sesuai lingkup di atas.',
      'Permintaan di luar daftar di atas akan dibuatkan penawaran tambahan.',
      'Kalau sudah cocok, kabari saja ya.\n— Mufuyu, Pyonkuro',
    ].join('\n\n'));
  });

  it('memakai bahasa formulir klien', () => {
    expect(susunDraf(data({ bahasa: 'en', kontak: '+62 812 3456 7890' }), 'besar')).toContain('Price: [isi harga]');
    expect(susunDraf(data({ bahasa: 'ja', kontak: '+81 90 1234 5678' }), 'besar')).toContain('料金：[isi harga]');
  });

  it('memakai harga patokan bila diisi', () => {
    expect(susunDraf(data(), 'besar', DRAF, { ...TINGKAT, hargaPatokan: { besar: 'Rp8.000.000' } })).toContain('Harga: Rp8.000.000');
  });

  it('jawaban teks klien masuk sebagai poin, dipotong dan sebaris', () => {
    const p = poinPekerjaan(data({ jenis: 'desktop', lanjutan: { sistem: 'keduanya', pengguna: 'sendiri', pekerjaan: `Mencatat\nstok ${'x'.repeat(300)}` } }));
    expect(p[0]).toBe('Aplikasi desktop');
    expect(p[1]).toBe('Untuk Windows dan Linux');
    expect(p[2]).toMatch(/^Untuk: Mencatat stok x+…$/);
    expect(p[2].length).toBeLessThan(175);
  });
});

describe('konfigurasi aturan dan draf konsisten', () => {
  const idPertanyaan = new Map(Object.values(PERTANYAAN.lanjutan).flat().map((p) => [p.id, p]));

  it('setiap ciri di tingkat punya label, dan tingkat terakhir adalah bawaan', () => {
    for (const t of TINGKAT.tingkat) for (const c of t.jikaAda) expect(TINGKAT.labelCiri[c], c).toBeTruthy();
    expect(TINGKAT.tingkat.at(-1)?.jikaAda).toEqual([]);
  });

  it('ciriJawaban dan poin hanya merujuk pertanyaan dan pilihan yang ada', () => {
    for (const peta of [TINGKAT.ciriJawaban, DRAF.poin.lanjutan]) {
      for (const [id, jawaban] of Object.entries(peta)) {
        const p = idPertanyaan.get(id);
        expect(p, id).toBeDefined();
        for (const j of Object.keys(jawaban)) expect(p?.pilihan?.some((o) => o.id === j), `${id}.${j}`).toBe(true);
      }
    }
    for (const id of Object.keys(DRAF.poin.teks)) expect(idPertanyaan.get(id)?.tipe, id).toBe('teks');
    for (const kunci of Object.keys(DRAF.belumJelas.perJawaban)) {
      const [id, j] = kunci.split('.');
      expect(idPertanyaan.get(id)?.pilihan?.some((o) => o.id === j), kunci).toBe(true);
    }
  });

  it('draf tersedia di ketiga bahasa', () => {
    for (const b of BAHASA) for (const v of Object.values(DRAF.draf[b])) expect(v, b).toBeTruthy();
  });
});
