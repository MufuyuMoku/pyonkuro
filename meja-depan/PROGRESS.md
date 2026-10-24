# PROGRESS — Meja Depan

| Milestone | Status | Branch |
| --- | --- | --- |
| M0 — Kerangka | Digabung ke `main` | `claude/meja-depan-m0` |
| M1 — Formulir bertahap | Digabung ke `main` | `claude/meja-depan-m1` |
| M2 — Pengiriman laporan | Digabung ke `main` | `claude/meja-depan-m2` |
| M3 — Tingkat & draf | Digabung ke `main` | `claude/meja-depan-m3` |
| M4 — Lapisan AI | Digabung ke `main` | `claude/meja-depan-m4` |
| M5 — Pengerasan | Digabung ke `main` | `claude/meja-depan-m5` |
| Aktivasi | Formulir aktif, catatan privasi baru | `claude/meja-depan-aktif` |

## M5 — Pengerasan

- **Tes end-to-end** (`npm run e2e`, juga di CI): Chromium sungguhan + situs
  hasil build + worker Meja Depan. Hanya Telegram, Resend, dan Turnstile yang
  ditiru (D20). Tujuh skenario:
  - ID toko online, EN situs web dengan kontak surel, JA aplikasi HP —
    masing-masing sampai halaman terima kasih, dengan isi laporan, draf, dan
    surel diperiksa;
  - galat validasi per layar;
  - kolom jebakan bot;
  - batas kiriman (kiriman keenam);
  - tampilan desktop 1280px.
- **Cek tampilan HP**: di setiap layar formulir, di ketiga bahasa, pada lebar
  375px, tidak ada yang meluber ke samping.
- Klien tidak pernah melihat tingkat, harga, atau tenggat: diperiksa pada teks
  yang terlihat di halaman terima kasih.
- CI: job `e2e` di setiap PR. Pemasangan worker di `main` baru jalan setelah
  `uji` dan `e2e` lulus.
- Header keamanan di semua jawaban worker (`cache-control: no-store`,
  `x-content-type-options: nosniff`).
- Typecheck kini juga mencakup berkas e2e.
- Catatan privasi di layar ringkasan formulir (tiga bahasa) memuat:
  - data yang dikumpulkan dan tujuannya;
  - tempat data diteruskan dan masa simpannya;
  - pemrosesan AI dan Turnstile;
  - tanpa pelacak.
- Panduan pemilik (README):
  - daftar periksa urutan pemasangan;
  - cara mengubah pertanyaan (§11), aturan tingkat dan harga patokan (§9),
    dan AI (§10);
  - panduan saat ada masalah (§12).

## Aktivasi

- Worker terpasang di `https://meja-depan.mufuyumoku.workers.dev`. Pemilik
  sudah memeriksa `/sehat`: `telegram`, `turnstile`, dan `surel` semuanya
  `true`.
- `alamatWorker` diisi, sehingga formulir aktif, tombol "Titip ide" muncul di
  bagian Jasa dan Kontak, dan halaman Titip Ide bisa diindeks.
- Catatan privasi tidak lagi menjanjikan penghapusan manual (D10). Ada tes
  yang memastikan worker tidak menyimpan jawaban klien. Log galat AI hanya
  mencatat jenis galat.

## Yang tersisa untuk pemilik

1. Kirim satu formulir percobaan dari HP. Ini uji pertama Telegram, Resend,
   Turnstile, dan Workers AI sungguhan. Periksa juga mutu ringkasan dan draf
   dari AI.
2. Opsional: harga patokan, kata-kata draf, dan pertanyaan.

## M4 — Lapisan AI

- Penyedia bawaan **Cloudflare Workers AI** lewat binding `AI` (tanpa kunci
  tambahan), model `@cf/aisingapore/gemma-sea-lion-v4-27b-it` (D4).
- **Claude API** (`claude-haiku-5-5`, SDK resmi `@anthropic-ai/sdk`) hanya
  bila `penyedia: "claude"` di `konfigurasi/ai.json` **dan**
  `ANTHROPIC_API_KEY` ada; kalau kuncinya tidak ada, kembali ke Workers AI.
  `"mati"` mematikan AI.
- Tugas AI hanya tiga (SPEC §9): ringkasan kebutuhan, daftar hal yang belum
  jelas, dan memperhalus bahasa draf. Tingkat dan harga selalu dari aturan.
- Perlindungan (D19):
  - data klien dibungkus `<data_klien>` sebagai data, dengan instruksi
    sistem yang menolak perintah di dalamnya;
  - nama, kontak, dan nama usaha tidak dikirim (nama diganti `{NAMA}`);
  - hasil diperiksa per bagian: draf harus memuat harga persis, tanpa angka
    atau tautan baru (mencegah harga atau tenggat karangan);
  - bagian yang gagal pemeriksaan memakai hasil aturan.
- Batas pemakaian: **50 panggilan/hari** (Durable Object yang sama), masukan
  ≤ 6.000 karakter, keluaran ≤ 2.000 token, batas waktu 15 detik.
- Laporan menandai bagian yang dirapikan AI. Jawaban asli klien tetap
  disertakan di bawahnya.
- Catatan privasi formulir menyebut pemrosesan AI (tanpa nama dan kontak).
- Tes: 94 tes lulus, termasuk:
  - pemilihan penyedia;
  - isi pesan ke AI (tanpa data pribadi, tag tidak bisa ditutup);
  - pemeriksaan hasil (harga, angka, tautan, penanda nama, daftar);
  - format jawaban Workers AI, galat, batas waktu, batas harian, batas
    masukan;
  - jalur Claude (permintaan dengan SDK, penolakan, galat API);
  - laporan lengkap dengan AI, dan **sistem tetap jalan tanpa kunci/binding
    AI**.
- Bundel ber-SDK dijalankan di workerd lokal (`/sehat`, validasi) dengan
  konfigurasi tanpa binding AI. Workers AI sungguhan hanya bisa diuji setelah
  terpasang di akun Cloudflare.

### Menunggu pemilik

- Tidak ada rahasia baru untuk Workers AI. Coba satu kiriman setelah
  terpasang dan periksa mutu ringkasan/draf. Kalau kurang baik, ganti model
  di `konfigurasi/ai.json` (README §10).
- Opsional: `ANTHROPIC_API_KEY` dan `penyedia: "claude"` bila ingin memakai
  Claude.

## M3 — Tingkat & draf

- **Perkiraan tingkat** (SPEC §7) berbasis aturan di
  `konfigurasi/tingkat.json`:
  - setiap jawaban memunculkan "ciri" (login, transaksi, dll.);
  - tingkat pertama yang cirinya cocok yang dipakai;
  - alasan ditulis dari label ciri;
  - perkiraan ditandai "kasar" bila ada jawaban "belum tahu" atau jenisnya
    "lainnya" (D17).
- **Harga patokan** per tingkat di konfigurasi yang sama, bawaan kosong →
  "[isi harga]".
- **Hal yang belum jelas**: pertanyaan dari jawaban "belum tahu", anggaran,
  waktu, contoh, masalah yang terlalu singkat, dan pertanyaan baku per jenis
  atau per jawaban (`konfigurasi/draf.json`).
- **Draf penawaran** (SPEC §8) dalam bahasa formulir klien:
  - poin apa yang dibuat (dari jawaban), harga, dan cara bayar
    (DP/pelunasan, revisi sesuai lingkup);
  - kalimat penawaran tambahan.
  Teksnya ada di `konfigurasi/draf.json`.
- Laporan Telegram kini memuat tingkat dan hal yang belum jelas. Draf dikirim
  sebagai **pesan kedua** (teks polos, mudah disalin) dengan tombol
  "Kirim draf lewat WhatsApp" yang membuka chat klien dengan draf terisi
  (D18). Surel memuat laporan dan draf sekaligus.
- Tingkat dan harga tidak pernah dikirim ke klien (diuji).
- Tes: 72 tes lulus, termasuk tes unit aturan tingkat:
  - Kecil, Sedang (panel/login/halaman/data bersama), dan Besar
    (transaksi/peran);
  - urutan prioritas, perkiraan kasar, aturan dari konfigurasi;
  - konfigurasi tanpa tingkat bawaan;
  - konsistensi konfigurasi (rujukan pertanyaan/pilihan, label ciri, tiga
    bahasa draf).

### Menunggu pemilik

- Isi harga patokan bila ingin draf langsung berisi harga (README §9).
- Periksa kata-kata draf di `konfigurasi/draf.json` (tiga bahasa).

## M2 — Pengiriman laporan

- Worker `POST /kirim` memeriksa kiriman berurutan:
  1. asal (CORS, hanya `asalDiizinkan`);
  2. ukuran (≤ 20 KB) dan format JSON;
  3. kolom jebakan bot;
  4. validasi yang sama dengan browser;
  5. token Turnstile (termasuk hostname-nya);
  6. batas 5 kiriman per IP per jam (D14).
- Laporan §6 tanpa AI ke Telegram:
  - kartu ringkas (nama, kontak, jenis, waktu, anggaran, bahasa formulir);
  - ringkasan kebutuhan;
  - tombol "Buka chat WhatsApp" bila nomornya pasti.
  Tingkat, hal yang belum jelas, dan draf menyusul di M3.
- Salinan laporan utuh ke surel pemilik lewat Resend. Gagalnya satu saluran
  tidak menghalangi yang lain; klien hanya mendapat galat bila keduanya
  gagal (D16).
- Sanitasi §10:
  - semua teks klien di-escape;
  - teks bebas klien selalu tampil sebagai kutipan;
  - pratinjau tautan dimatikan;
  - ada cadangan teks polos bila Telegram menolak HTML;
  - panjang pesan dijaga di bawah 4096 karakter (D15).
- Halaman formulir: widget Turnstile (muncul hanya bila perlu interaksi) di
  layar ringkasan, kolom jebakan bot, dan pesan untuk galat 403/429.
- `GET /sehat` kini menunjukkan rahasia mana yang sudah terpasang (tanpa
  nilainya).
- Tes: 47 tes unit lulus:
  - rute, CORS, jebakan, validasi, ukuran;
  - Turnstile, batas IP;
  - kegagalan tiap saluran, cadangan teks polos, escape;
  - batas panjang, penghitung, dan alarm.
- Dicek juga di runtime Cloudflare lokal (`wrangler dev`/workerd):
  - `/sehat`, preflight, validasi, jebakan, dan penolakan asal lain;
  - Durable Object (RPC, penyimpanan, alarm) lewat worker uji sementara.
- Uji alur di browser dengan Turnstile tiruan:
  - token terkirim, kolom jebakan kosong;
  - widget diulang setelah gagal;
  - pesan 403 dan 429.

### Menunggu pemilik

- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, dan `TURNSTILE_SECRET_KEY` wajib
  ada; tanpa itu `/kirim` menjawab 503. `RESEND_API_KEY` disarankan.
- Turnstile: hostname `mufuyumoku.github.io` harus terdaftar di widget.
- Pengiriman nyata ke Telegram/Resend/Turnstile belum bisa diuji dari
  lingkungan ini (jaringan keluar dibatasi). Uji pertama sebaiknya dilakukan
  pemilik setelah rahasia terpasang (README §7).

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
