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

## D10 — Isi catatan privasi (perlu persetujuan pemilik)

Catatan privasi di layar ringkasan menyebut:

- data yang dikirim: jawaban, nama, dan kontak;
- tujuannya: untuk membalas;
- formulir/worker tidak menyimpan data; data diteruskan ke Telegram dan surel
  pemilik;
- data **dihapus paling lambat 90 hari setelah percakapan selesai**, atau lebih
  cepat bila diminta.

Angka 90 hari mengikuti bawaan SPEC §4. Ini janji yang harus ditepati pemilik
secara manual di Telegram dan surel. Kalau tidak cocok, ubah kalimatnya di
`src/lib/teks-titip.ts` (`privasi`). Resend juga menyimpan log surel terkirim
di dasbornya untuk sementara waktu.

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
