# PROGRESS — Meja Depan

| Milestone | Status | Branch |
| --- | --- | --- |
| M0 — Kerangka | Selesai, menunggu review PR | `claude/meja-depan-m0` |
| M1 — Formulir bertahap | Selesai, menunggu review PR | `claude/meja-depan-m1` |
| M2 — Pengiriman laporan | Belum | |
| M3 — Tingkat & draf | Belum | |
| M4 — Lapisan AI | Belum | |
| M5 — Pengerasan | Belum | |

## M1 — Formulir bertahap

- Alur §5 lengkap di tiga bahasa, satu pertanyaan per layar:
  - jenis → usaha → masalah → pertanyaan lanjutan sesuai jenis → contoh →
    waktu → anggaran → kontak → ringkasan → terima kasih;
  - ada indikator kemajuan dan tombol Kembali;
  - di ringkasan, setiap jawaban punya tombol "Ubah".
- Pertanyaan pilihan (jenis, lanjutan per jenis, waktu, anggaran) ada di
  `konfigurasi/pertanyaan.json`. Rentang anggaran sesuai keputusan pemilik.
- Validasi yang sama dipakai browser dan worker (`src/formulir.ts`):
  - medan wajib, batas panjang, pilihan harus ada di konfigurasi;
  - nomor WhatsApp/surel diperiksa;
  - medan di luar daftar dibuang (data minimal).
  Tes unit: 15 kasus.
- Halaman terima kasih sesuai prinsip 1: tanpa harga, tingkat, atau tenggat.
- Catatan privasi singkat di layar ringkasan (D10).
- Draf jawaban disimpan di sessionStorage tab itu saja, lalu dihapus setelah
  terkirim (D11).
- Tombol "Titip ide" di bagian Jasa dan Kontak halaman utama; hanya muncul
  bila worker aktif (D5).
- Skrip formulir mengirim ke `<alamatWorker>/kirim`. Endpoint-nya dibuat di M2.
- Dicek di browser (Playwright, 375px dan 1280px):
  - alur lengkap jenis "toko" dan "lainnya";
  - galat per layar, Kembali, Ubah, dan pemulihan draf;
  - isi kiriman, halaman terima kasih, pesan 429;
  - tampilan JA;
  - halaman utama tidak meluber, tanpa galat JS, dan tautan internal semuanya 200.
- `npm run periksa` kini juga memeriksa tipe skrip formulir di browser.

### Menunggu pemilik

- Setujui janji masa simpan di catatan privasi (D10).

## M0 — Kerangka

- SPEC diperbarui sesuai perubahan klien (DECISIONS D1).
- Halaman Titip Ide kosong di `/titip-ide/`, `/en/leave-an-idea/`,
  `/ja/leave-an-idea/`, dengan gaya Pyonkuro. Halaman ini belum ditautkan dari
  halaman utama dan diberi `noindex` sampai worker aktif (D5).
- Kerangka halaman bersama `src/components/Kerangka.astro` (D7). Tampilan
  halaman utama tidak berubah.
- Worker kosong `meja-depan/` (Cloudflare Workers): `GET /sehat`, lainnya 404.
  Tes (vitest), typecheck, dan uji bundel `wrangler deploy --dry-run` lulus.
- `.env.example` berisi daftar rahasia tanpa nilai.
- Workflow `.github/workflows/meja-depan.yml`:
  - di setiap PR: uji worker dan build situs;
  - di `main`: memasang worker dan rahasianya dari repository secrets;
  - kalau rahasia Cloudflare belum ada, pemasangan dilewati dengan peringatan,
    bukan gagal.
- `README.md`: panduan pemilik (Cloudflare, Telegram, Turnstile, Resend, dan
  tempat memasukkan rahasia).

### Menunggu pemilik

- Repository secrets (README §1–6). Pemasangan worker pertama baru terjadi
  setelah `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` ada.
- Setelah worker terpasang: isi `alamatWorker` di `konfigurasi/umum.json`
  (README §7).
