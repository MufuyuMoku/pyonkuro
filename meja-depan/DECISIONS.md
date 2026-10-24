# DECISIONS — Meja Depan

Catatan keputusan dan asumsi. Sumber kebenaran tetap `SPEC-meja-depan.md`;
yang tidak tertulis di sana dicatat di sini.

## D1 — Perubahan dari klien (2026-10-24)

Diterima dari pemilik sebelum M0 dimulai; SPEC sudah diperbarui (§4, §5, §6, §7, §9, §11, §12).

- §12 Nama tampilan **Titip Ide** (EN "Leave an idea", JA 「アイデアを預ける」); tombol dari Jasa dan Kontak berbunyi "Titip ide"; halaman `/titip-ide/` dan padanannya per bahasa (lihat D3).
- §12 Rentang anggaran: di bawah Rp1 juta · Rp1–3 juta · Rp3–7 juta · di atas Rp7 juta · belum tahu.
- §12 Harga patokan per tingkat dikosongkan; draf penawaran menulis "[isi harga]".
- §12 Surel sebagai saluran kedua: **ya**, lewat Resend (paket gratis), hanya ke surel pemilik, rahasia `RESEND_API_KEY`. Gagalnya surel tidak menghalangi Telegram.
- §9 Penyedia AI bawaan: **Cloudflare Workers AI** (lihat D4). Claude API tetap bisa dipilih lewat konfigurasi bila `ANTHROPIC_API_KEY` ada. Batas panggilan harian tetap berlaku.

## D2 — Worker di repo yang sama

Worker ada di folder `meja-depan/` dalam repo `pyonkuro`. Alasannya: berkas
konfigurasi pertanyaan dipakai bersama oleh halaman formulir (Astro) dan
worker, jadi satu repo menghindari dua salinan yang bisa berbeda. Worker punya
`package.json` sendiri sehingga dependensinya tidak mengubah build situs.

## D3 — Alamat halaman per bahasa

`/titip-ide/` (ID), `/en/leave-an-idea/` (EN), `/ja/leave-an-idea/` (JA).
Halaman JA memakai slug ASCII yang sama dengan EN supaya alamatnya tidak
berubah menjadi deretan `%E3%...` saat dibagikan.

## D4 — Model Workers AI: `@cf/aisingapore/gemma-sea-lion-v4-27b-it`

Dipilih karena SEA-LION dilatih ulang dan di-*instruct-tune* khusus untuk
bahasa-bahasa Asia Tenggara, termasuk bahasa Indonesia. Itu yang paling
penting untuk merapikan ringkasan dan memperhalus draf WhatsApp berbahasa
Indonesia. Model ini juga cukup baik untuk EN, dan JA tetap tertangani oleh
basis Gemma-nya. Laporan ke pemilik selalu berbahasa Indonesia.

Biaya terhadap jatah gratis (data katalog Cloudflare, Oktober 2026):

- Harga: US$0,351 per juta token masukan, US$0,555 per juta token keluaran.
  Workers AI menagih US$0,011 per 1.000 *neuron*, dan setiap akun mendapat
  **10.000 neuron gratis per hari**.
- Jadi sekitar 31.900 neuron per juta token masukan dan 50.500 neuron per
  juta token keluaran.
- Satu laporan diperkirakan ±2.000 token masukan dan ±700 token keluaran, yaitu
  ±100 neuron.
- Batas bawaan **50 panggilan/hari** ≈ 5.000 neuron, separuh jatah gratis.
  Masih ada ruang untuk pemakaian Workers AI lain di akun yang sama.

Alternatif yang lebih murah bila jatah terasa sempit:
`@cf/google/gemma-4-26b-a4b-it` (US$0,10 / US$0,30 per juta token). Model ini
multibahasa umum, tidak khusus Asia Tenggara. Model bisa diganti lewat
konfigurasi tanpa mengubah kode.

Model Llama 3.x tidak dipilih karena bahasa Indonesia tidak termasuk bahasa
yang didukung resmi. Varian 70B juga jauh lebih mahal untuk token keluaran
(US$2,25 per juta).

## D5 — Alamat worker di konfigurasi, formulir aktif hanya bila terisi

Alamat worker (`https://meja-depan.<subdomain>.workers.dev`) baru diketahui
setelah pemasangan pertama, dan bukan rahasia. Alamat ini ditulis pemilik di
`meja-depan/konfigurasi/umum.json` → `alamatWorker`. Selama kosong:

- formulir tidak bisa mengirim dan menampilkan ajakan memakai surel/WhatsApp;
- tombol "Titip ide" di halaman utama tidak ditampilkan;
- halaman Titip Ide diberi `noindex`.

Dengan begitu menggabungkan milestone ke `main` tidak pernah menampilkan
formulir yang belum bisa dipakai di situs yang sudah tayang.

## D6 — Milestone berurutan dalam satu sesi, PR bertumpuk

SPEC §11 meminta berhenti dan melapor setiap selesai satu milestone. Pemilik
meminta milestone dikerjakan berurutan dalam sesi ini, masing-masing di branch
sendiri dengan PR ke `main`. Persetujuan per milestone tetap terjadi lewat
review PR, karena tidak ada yang langsung masuk ke `main`. Branch M(n+1)
dibuat dari branch M(n). PR M(n+1) karena itu juga memuat commit M(n) sampai
PR M(n) digabung, sehingga **PR perlu digabung berurutan**.

## D7 — Kerangka halaman bersama

`src/components/Kerangka.astro` memuat `<head>`, simbol logo, pemilih bahasa,
dan kaki. Halaman utama dan halaman Titip Ide memakainya. Hasil build halaman
utama sudah dibandingkan dengan sebelum perubahan: isinya sama, hanya beda
spasi dan letak skrip salin-surel (kini sebelum `<footer>`, tetap sesudah
elemen yang dipakainya).

## D8 — Tanpa log permintaan dan telemetri

`observability` worker dimatikan supaya Cloudflare tidak menyimpan log
permintaan (prinsip data minimal). Telemetri Wrangler dimatikan di workflow
(`WRANGLER_SEND_METRICS=false`).

## D9 — Pengirim surel Resend

Laporan dikirim dari `onboarding@resend.dev` ke `surelPemilik`. Tanpa domain
terverifikasi, Resend hanya mengirim ke alamat pemilik akun, jadi akun Resend
harus didaftarkan dengan `mufuyumoku@gmail.com`. Ini cukup karena surel hanya
untuk pemilik. Kalau kelak punya domain sendiri, alamat pengirim bisa diganti
di konfigurasi.

## D10 — Isi catatan privasi (diperbarui 2026-10-24)

Versi awal menjanjikan penghapusan data paling lambat 90 hari. Pemilik tidak
mau janji yang menuntut penghapusan manual, jadi kalimat itu diganti. Catatan
privasi sekarang (tiga bahasa, `src/lib/teks-titip.ts` → `privasi`) memuat:

- yang dikirim hanya jawaban di formulir, termasuk nama dan kontak;
- jawaban **hanya dipakai untuk menghubungi klien dan menyiapkan penawaran,
  dan tidak dibagikan ke pihak lain** (kalimat dari pemilik);
- formulir tidak menyimpan jawaban; jawaban langsung diantar ke Telegram dan
  surel Pyonkuro;
- layanan yang mengantarkan: Cloudflare (termasuk Turnstile dan AI yang
  merapikan jawaban tanpa nama dan kontak), Telegram, dan Resend;
- tanpa pelacak atau analitik.

Layanan pengantar sengaja disebut. Tanpa itu, kalimat "tidak dibagikan ke
pihak lain" bisa terbaca seolah tidak ada layanan luar yang memproses
jawaban, padahal jawaban melewati Cloudflare, Telegram, dan Resend. Layanan
itu bertindak sebagai pengantar atas nama Pyonkuro, bukan penerima untuk
keperluan mereka sendiri.

Yang benar-benar disimpan di sisi worker (dicek ulang, ada tesnya):

- Isi kiriman tidak disimpan sama sekali. Jawaban hanya ada di memori selama
  satu permintaan, untuk menyusun dan mengirim laporan.
- Durable Object `Penghitung` hanya menyimpan:
  - hash IP (dipotong) + cap waktu untuk batas kiriman;
  - hitungan AI per tanggal.
  Keduanya dibuang alarm harian setelah lebih dari sehari (D14).
- Log permintaan Cloudflare dimatikan (D8). Log galat hanya mencatat jenis
  galat. Log galat AI kini sengaja tidak mencetak pesan galat, karena pesan
  dari layanan luar bisa mengutip masukan.

Salinan laporan yang sampai di Telegram dan surel pemilik adalah hasil
pengantaran itu sendiri. Simpanan di sana mengikuti kebiasaan pemilik
memakai Telegram dan surel, tanpa janji batas waktu. Resend menyimpan log
surel terkirim di dasbornya untuk sementara waktu, sesuai kebijakan Resend.

## D11 — Satu pertanyaan per layar, termasuk pertanyaan lanjutan

SPEC §5 menulis pertanyaan lanjutan sebagai satu nomor (4). Supaya tetap
"satu pertanyaan per layar", tiap pertanyaan lanjutan mendapat layarnya
sendiri. Jumlah langkah karena itu bergantung pada jenis (8–11), dan
indikator kemajuan menghitung ulang setelah jenis dipilih.

Draf jawaban disimpan di `sessionStorage` (hanya tab itu, di perangkat klien)
supaya tidak hilang kalau halaman tak sengaja dimuat ulang. Draf dihapus
setelah terkirim.

## D12 — Nomor WhatsApp

Nomor diterima bila berisi 8–15 angka (boleh diawali "+"). Untuk tautan cepat
wa.me di laporan:

- nomor berawalan "+" atau "62" dipakai apa adanya;
- nomor lokal "08…" diubah ke "628…" hanya bila formulirnya berbahasa
  Indonesia;
- nomor lain ditampilkan apa adanya tanpa tautan, supaya tidak menebak kode
  negara yang salah.

## D13 — Menimpa alamat worker saat build

Variabel lingkungan `MEJA_DEPAN_URL` saat `npm run build` menimpa
`alamatWorker`. Ini hanya untuk pengujian lokal (mis. formulir diarahkan ke
worker tiruan). Situs produksi memakai nilai di `konfigurasi/umum.json`.

## D14 — Batas kiriman per IP dengan Durable Object

Batas kiriman (bawaan 5 per IP per jam, di `konfigurasi/umum.json` →
`batasKiriman`) dan nanti batas AI harian dihitung oleh satu Durable Object
berbasis SQLite (`Penghitung`).

Dipilih karena:

- tersedia di paket gratis;
- hitungannya konsisten (KV bisa terlambat sinkron);
- tidak perlu dibuat manual: cukup migrasi di `wrangler.toml`.

Yang disimpan hanya hash SHA-256 IP (dipotong) dan cap waktu. Alarm harian
membuang catatan yang lebih dari sehari. Isi kiriman tidak pernah disimpan,
jadi masa simpan 90 hari (SPEC §4) tidak berlaku untuk worker.

Hitungan hanya bertambah setelah validasi dan Turnstile lolos. Dengan begitu
bot yang gagal captcha tidak menghabiskan jatah orang lain di jaringan yang
sama.

## D15 — Format laporan Telegram

- Memakai `parse_mode: HTML`. Semua teks klien di-escape.
- Teks bebas klien (usaha, masalah, contoh, lanjutan teks) selalu di dalam
  `<blockquote>`, supaya isian seperti "Tingkat: Kecil" atau "Sudah dibayar"
  jelas terbaca sebagai tulisan klien, bukan bagian laporan.
- Pratinjau tautan dimatikan. URL yang ditulis klien tetap tampil apa adanya
  (teks = tujuan), jadi tidak ada tautan tersamar.
- Batas 4096 karakter: teks klien dipotong di Telegram (versi utuh ada di
  surel). Kalau HTML-nya tetap terlalu panjang atau ditolak Telegram, dikirim
  versi teks polos.
- Setiap laporan punya kode acak 6 huruf (#ABC123) di Telegram dan subjek
  surel, untuk mencocokkan keduanya.
- Telegram tidak mengizinkan tombol `mailto:`. Untuk kontak surel, alamatnya
  tampil sebagai teks (Telegram membuatnya bisa diketuk). Surel laporan memakai
  alamat klien sebagai `reply_to`, jadi "Balas" langsung ke klien.

## D16 — Kapan klien melihat galat

- `/kirim` menjawab **503** bila `TURNSTILE_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`,
  atau `TELEGRAM_CHAT_ID` belum ada. Formulir tidak menerima kiriman tanpa
  anti-spam dan saluran utama.
- Bila salah satu dari Telegram atau surel berhasil, klien mendapat "terima
  kasih". Galat 502 hanya bila keduanya gagal.
- Galat saluran dicatat dengan `console.error` tanpa isi kiriman. Log hanya
  terlihat lewat `wrangler tail`, karena observability dimatikan (D8).

## D17 — Tafsiran tabel tingkat SPEC §7

Tabel SPEC hanya menyebut ciri tiap tingkat. Penerapannya:

- **Besar** bila ada transaksi/pesanan, pembayaran online, atau beberapa peran
  pengguna. Jenis "Toko online & transaksi" selalu membawa ciri transaksi,
  jadi selalu Besar.
- **Sedang** bila ada login, isi yang diubah sendiri lewat panel, data yang
  dipakai bersama, atau **lebih dari 3 halaman**. Tabel menyebut Kecil =
  "1–3 halaman", jadi situs 4 halaman ke atas tidak lagi Kecil.
- **Kecil** sebagai bawaan bila tidak ada ciri di atas.
- Bila ada jawaban "belum tahu" atau jenisnya "lainnya", perkiraan tetap
  diberikan tetapi ditandai **kasar**.

Semua pemetaan jawaban → ciri → tingkat ada di `konfigurasi/tingkat.json` dan
bisa diubah tanpa menyentuh kode.

## D18 — Draf sebagai pesan Telegram kedua

- Draf dikirim sebagai pesan teks polos tersendiri, supaya bisa disalin utuh
  dengan sekali tekan-tahan.
- Bila nomor WhatsApp klien pasti (D12), pesan draf diberi tombol yang
  membuka `wa.me/<nomor>?text=<draf>`. Pemilik tinggal mengganti
  "[isi harga]" lalu mengirim. Tombol dilewati bila URL-nya lebih dari 2.000
  karakter.
- Laporan (pesan pertama) yang menentukan berhasil-tidaknya Telegram. Kalau
  pesan draf gagal, laporan yang sudah sampai tidak dianggap gagal; drafnya
  tetap ada di surel.
- Bila Telegram menolak format atau tombol (400), pesan dikirim ulang sebagai
  teks polos tanpa tombol.

## D19 — Rancangan lapisan AI

- **Yang dikirim ke AI**: jenis, usaha, masalah, rincian jawaban, contoh,
  waktu, anggaran, daftar awal hal yang belum jelas, dan draf awal.
  - Tidak dikirim: nama, kontak, dan nama usaha.
  - Draf memakai penanda `{NAMA}` yang diganti nama klien setelah AI selesai.
  - Teks bebas klien tetap bisa memuat data pribadi yang klien tulis sendiri;
    karena itu catatan privasi menyebut pemrosesan AI.
- **Anti injeksi**:
  - jawaban klien dibungkus `<data_klien>` sebagai JSON;
  - `<` dan `>` di-escape, jadi teks klien tidak bisa menutup tag;
  - instruksi sistem menyatakan isinya data saja;
  - hasil AI tidak pernah dipercaya untuk tingkat atau harga.
- **Pemeriksaan hasil, per bagian**:
  - ringkasan 1–5 poin; daftar pertanyaan ≤ 10 poin; setiap poin ≤ 300
    karakter dan harus teks;
  - draf ≤ 3.000 karakter, memuat teks harga persis dan `{NAMA}`;
  - **tidak boleh ada angka yang tidak ada di draf awal** (menutup harga,
    diskon, atau tenggat karangan) dan tidak boleh ada tautan.
  - Bagian yang gagal kembali ke hasil aturan; bagian lain tetap dipakai.
- **Di laporan**, bagian dari AI diberi tanda "(dirapikan AI)". Jawaban asli
  klien selalu ikut ditampilkan sebagai kutipan, jadi pemilik bisa
  membandingkan.
- **Batas**:
  - 50 panggilan/hari (UTC), dihitung oleh Durable Object `Penghitung`;
  - setiap percobaan dihitung, termasuk yang gagal;
  - batas waktu 15 detik, supaya klien tidak menunggu terlalu lama;
  - kalau batas tercapai, laporan tetap terkirim tanpa AI.
- **Claude API** dipanggil lewat SDK resmi `@anthropic-ai/sdk`:
  - model ringan `claude-haiku-5-5` (SPEC §9);
  - `output_config.format` berupa JSON schema, `effort: "low"`, tanpa
    `temperature` (tidak diterima model ini);
  - penolakan (`stop_reason: "refusal"`) atau galat → hasil aturan.
  - SDK menambah bundel worker menjadi ±180 KB gzip, masih jauh di bawah
    batas paket gratis.
- **Workers AI** dipanggil lewat binding `AI` dengan `response_format`
  JSON schema. Jawabannya bisa berupa teks, objek, atau format chat
  completion; ketiganya ditangani.

## D20 — Bentuk tes end-to-end

Tes e2e memakai Chromium (Playwright 1.63) terhadap situs hasil build. Situs
dibangun ke `meja-depan/.e2e-situs` dengan `MEJA_DEPAN_URL` ke worker lokal,
jadi `dist/` produksi tidak tersentuh.

Worker dijalankan dengan handler yang sama persis dengan produksi lewat adaptor
HTTP di Node, dengan Durable Object di memori. Yang ditiru hanya layanan luar
(Telegram, Resend, siteverify Turnstile, dan skrip widget Turnstile di
browser), karena layanan itu butuh rahasia asli dan jaringan.

Runtime Cloudflare (workerd) sendiri sudah dicek terpisah lewat `wrangler dev`
di M2 dan M4. Pengiriman sungguhan ke layanan luar menunggu rahasia pemilik.
