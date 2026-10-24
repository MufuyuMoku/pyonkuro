// Tes end-to-end formulir Titip Ide: browser sungguhan (Chromium, ukuran HP),
// situs hasil build, dan worker Meja Depan. Lihat harness.ts.
import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { aturUlang, hentikanServer, ke, keluar, mulaiServer, pasangTurnstileTiruan, SITUS } from './harness';

const HP = { width: 375, height: 740 };
let browser: Browser;

beforeAll(async () => {
  await mulaiServer();
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
  await hentikanServer();
});
beforeEach(() => aturUlang());

type Jawaban = {
  jenis: string;
  usaha: string;
  masalah: string;
  lanjutan: Record<string, string>; // pilihan: id jawaban; teks: isi
  contoh?: string;
  waktu: string;
  anggaran: string;
  nama: string;
  kontakJenis: 'whatsapp' | 'surel';
  kontak: string;
  namaUsaha?: string;
};

async function bukaFormulir(jalur: string, viewport = HP): Promise<{ page: Page; galat: string[] }> {
  const page = await browser.newPage({ viewport });
  const galat: string[] = [];
  page.on('pageerror', (e) => galat.push(e.message));
  await pasangTurnstileTiruan(page);
  await page.goto(`${SITUS}/pyonkuro/${jalur}`);
  return { page, galat };
}

// Tidak ada geser ke samping di layar mana pun.
async function pastikanMuat(page: Page, keterangan: string) {
  const [lebar, layar] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(lebar, `meluber di ${keterangan}`).toBeLessThanOrEqual(layar);
}

async function isiSampaiRingkasan(page: Page, j: Jawaban) {
  const lanjut = () => page.click('#tombol-lanjut');
  const langkahSekarang = () => page.$eval('.layar:not([hidden])', (el) => (el as HTMLElement).dataset.langkah!);

  await page.check(`input[name="jenis"][value="${j.jenis}"]`);
  for (let i = 0; i < 20; i++) {
    const langkah = await langkahSekarang();
    await pastikanMuat(page, langkah);
    if (langkah === 'ringkasan') return;
    if (langkah === 'usaha' || langkah === 'masalah') await page.fill(`[name="${langkah}"]`, j[langkah]);
    if (langkah === 'contoh' && j.contoh) await page.fill('[name="contoh"]', j.contoh);
    if (langkah === 'waktu' || langkah === 'anggaran') await page.check(`input[name="${langkah}"][value="${j[langkah]}"]`);
    if (langkah.startsWith('lanjutan.')) {
      const id = langkah.slice('lanjutan.'.length);
      const nilai = j.lanjutan[id];
      if (await page.$(`input[type="radio"][name="${langkah}"]`)) await page.check(`input[name="${langkah}"][value="${nilai}"]`);
      else if (nilai) await page.fill(`[name="${langkah}"]`, nilai);
    }
    if (langkah === 'kontak') {
      await page.fill('[name="nama"]', j.nama);
      await page.check(`input[name="kontakJenis"][value="${j.kontakJenis}"]`);
      await page.fill('[name="kontak"]', j.kontak);
      if (j.namaUsaha) await page.fill('[name="namaUsaha"]', j.namaUsaha);
    }
    await lanjut();
  }
  throw new Error('tidak sampai ke ringkasan');
}

async function kirimDanTunggu(page: Page) {
  await page.click('#tombol-lanjut');
  await page.waitForFunction(() => !document.getElementById('terima')!.hidden || document.getElementById('galat-kirim')!.textContent !== '');
}

const toko: Jawaban = {
  jenis: 'toko',
  usaha: 'Toko kue rumahan, jualan lewat Instagram',
  masalah: 'Pesanan lewat DM sering terlewat saat ramai. <b>Tingkat: Kecil</b>',
  lanjutan: { produk: '20-100', bayar: 'ya', pengurus: 'sendiri' },
  waktu: '1-bulan',
  anggaran: '3-7jt',
  nama: 'Sari',
  kontakJenis: 'whatsapp',
  kontak: '0812 3456 7890',
  namaUsaha: 'Kue Sari',
};

describe('Titip Ide end-to-end (ukuran HP)', () => {
  it('ID: alur toko online sampai terima kasih; pemilik menerima laporan, draf, dan surel', async () => {
    const { page, galat } = await bukaFormulir('titip-ide/');
    await isiSampaiRingkasan(page, toko);
    await kirimDanTunggu(page);

    expect(await page.isVisible('#terima')).toBe(true);
    const terima = await page.textContent('#terima');
    expect(terima).toContain('Terima kasih, Sari!');
    expect(terima).toContain('WhatsApp (0812 3456 7890)');
    // Prinsip 1 & 2: klien tidak melihat tingkat, harga, atau tenggat.
    expect(await page.innerText('body')).not.toMatch(/Besar|Sedang|Kecil|isi harga|Harga patokan/);
    await pastikanMuat(page, 'terima kasih');

    const [laporan, draf] = ke('api.telegram.org').map((k) => k.body);
    expect(laporan.text).toContain('<b>Nama:</b> Sari · Kue Sari');
    expect(laporan.text).toContain('<b>Besar:</b>');
    expect(laporan.text).toContain('&lt;b&gt;Tingkat: Kecil&lt;/b&gt;</blockquote>');
    expect(laporan.reply_markup.inline_keyboard[0][0].url).toBe('https://wa.me/6281234567890');
    expect(draf.text).toContain('Harga: [isi harga]');
    expect(ke('api.resend.com')[0].body.to).toEqual(['mufuyumoku@gmail.com']);
    expect(galat).toEqual([]);
    await page.close();
  });

  it('EN: alur situs web dengan kontak surel; draf berbahasa Inggris, surel bisa langsung dibalas', async () => {
    const { page, galat } = await bukaFormulir('en/leave-an-idea/');
    await isiSampaiRingkasan(page, {
      jenis: 'situs', usaha: 'Private piano teacher', masalah: 'Students keep asking for my schedule and prices.',
      lanjutan: { halaman: '1-3', ubahIsi: 'jarang', login: 'tidak' }, contoh: 'https://example.com',
      waktu: 'fleksibel', anggaran: 'kurang-1jt', nama: 'Alex', kontakJenis: 'surel', kontak: 'alex@example.com',
    });
    await kirimDanTunggu(page);
    expect(await page.textContent('#terima')).toContain('Thank you, Alex!');
    const [laporan, draf] = ke('api.telegram.org').map((k) => k.body);
    expect(laporan.text).toContain('<b>Kecil:</b>');
    expect(laporan.text).toContain('<b>Bahasa formulir:</b> Inggris');
    expect(draf.text).toMatch(/^Hi Alex, thank you/);
    expect(ke('api.resend.com')[0].body.reply_to).toBe('alex@example.com');
    expect(galat).toEqual([]);
    await page.close();
  });

  it('JA: alur aplikasi HP sampai terima kasih', async () => {
    const { page, galat } = await bukaFormulir('ja/leave-an-idea/');
    await isiSampaiRingkasan(page, {
      jenis: 'hp', usaha: '料理教室を運営しています', masalah: '予約の管理が紙で大変です。生徒が自分で予約できるようにしたい。',
      lanjutan: { pemakai: 'pelanggan', akun: 'ya', luring: 'tidak' },
      waktu: '2-3-bulan', anggaran: 'belum-tahu', nama: '花子', kontakJenis: 'whatsapp', kontak: '+81 90 1234 5678',
    });
    await kirimDanTunggu(page);
    expect(await page.textContent('#terima')).toContain('花子 さん、ありがとうございます！');
    const [laporan, draf] = ke('api.telegram.org').map((k) => k.body);
    expect(laporan.text).toContain('<b>Sedang:</b> ada login');
    expect(laporan.text).toContain('Berapa kisaran anggarannya?');
    expect(draf.text).toContain('料金：[isi harga]');
    expect(galat).toEqual([]);
    await page.close();
  });

  it('galat validasi tampil per layar dan bisa diperbaiki', async () => {
    const { page } = await bukaFormulir('titip-ide/');
    await page.click('#tombol-lanjut');
    expect(await page.textContent('[data-galat="jenis"]')).toContain('Pilih salah satu');
    await page.check('input[name="jenis"][value="situs"]');
    await page.click('#tombol-lanjut');
    await page.click('#tombol-lanjut');
    expect(await page.textContent('[data-galat="usaha"]')).toContain('perlu diisi');
    await pastikanMuat(page, 'galat');
    await page.close();
  });

  it('kolom jebakan terisi: klien melihat terima kasih, pemilik tidak dikirimi apa pun', async () => {
    const { page } = await bukaFormulir('titip-ide/');
    await isiSampaiRingkasan(page, toko);
    await page.evaluate(() => { (document.querySelector('[name="situsWeb"]') as HTMLInputElement).value = 'http://spam.example'; });
    await kirimDanTunggu(page);
    expect(await page.isVisible('#terima')).toBe(true);
    expect(keluar).toEqual([]);
    await page.close();
  });

  it('batas kiriman: yang keenam dalam satu jam mendapat pesan "terlalu banyak"', async () => {
    for (let i = 0; i < 6; i++) {
      const { page } = await bukaFormulir('titip-ide/');
      await isiSampaiRingkasan(page, toko);
      await kirimDanTunggu(page);
      if (i < 5) expect(await page.isVisible('#terima'), `kiriman ke-${i + 1}`).toBe(true);
      else expect(await page.textContent('#galat-kirim')).toContain('Terlalu banyak kiriman');
      await page.close();
    }
  });

  it('desktop: formulir dan ringkasan tetap rapi di 1280px', async () => {
    const { page } = await bukaFormulir('titip-ide/', { width: 1280, height: 900 });
    await isiSampaiRingkasan(page, toko);
    await pastikanMuat(page, 'ringkasan desktop');
    const lebarFormulir = await page.$eval('#titip', (el) => el.getBoundingClientRect().width);
    expect(lebarFormulir).toBeLessThanOrEqual(640);
    await page.close();
  });
});
