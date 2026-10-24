# Meja Depan — panduan pemilik

Meja Depan adalah formulir **Titip Ide** di situs Pyonkuro (`/titip-ide/`,
`/en/leave-an-idea/`, `/ja/leave-an-idea/`). Calon klien menjawab beberapa
pertanyaan, lalu kamu menerima laporan rapi di **Telegram** (dan salinannya di
**surel**), lengkap dengan perkiraan tingkat proyek dan draf penawaran.

Halaman formulirnya ada di situs (Astro, GitHub Pages). Yang menerima kiriman
adalah sebuah **worker** kecil di Cloudflare (folder ini). Spesifikasi lengkap:
[`../SPEC-meja-depan.md`](../SPEC-meja-depan.md). Kemajuan:
[`PROGRESS.md`](PROGRESS.md). Keputusan: [`DECISIONS.md`](DECISIONS.md).

---

## 1. Rahasia yang dibutuhkan

Semua rahasia disimpan sebagai **GitHub repository secrets**, bukan di berkas.
Workflow `.github/workflows/meja-depan.yml` memasangnya ke worker setiap kali
worker dipasang.

| Nama secret | Untuk apa | Wajib? | Cara mendapatkan |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Memasang worker | Ya | Langkah 3 |
| `CLOUDFLARE_ACCOUNT_ID` | Memasang worker | Ya | Langkah 3 |
| `TELEGRAM_BOT_TOKEN` | Mengirim laporan ke Telegram | Ya | Langkah 4 |
| `TELEGRAM_CHAT_ID` | Chat tujuan laporan (chat-mu dengan bot) | Ya | Langkah 4 |
| `TURNSTILE_SECRET_KEY` | Anti-spam (captcha ringan) | Ya | Langkah 5 |
| `RESEND_API_KEY` | Salinan laporan ke surelmu | Tidak, tapi disarankan | Langkah 6 |
| `ANTHROPIC_API_KEY` | Hanya kalau ingin memakai Claude API, bukan Workers AI | Tidak | — |

Workers AI (penyedia AI bawaan) **tidak butuh kunci tambahan**; ia memakai akun
Cloudflare yang sama dengan jatah gratis harian.

## 2. Di mana memasukkan rahasia

1. Buka repo **MufuyuMoku/pyonkuro** di GitHub.
2. **Settings** → **Secrets and variables** → **Actions**.
3. Klik **New repository secret**.
4. Isi **Name** persis seperti di tabel (huruf besar semua), tempel nilainya di
   **Secret**, lalu **Add secret**.
5. Ulangi untuk setiap rahasia.

Nilai rahasia tidak bisa dilihat lagi setelah disimpan; kalau salah, cukup
klik namanya lalu **Update**. Jangan pernah menempelkan nilai rahasia di
chat, issue, atau berkas di repo.

## 3. Cloudflare (akun, Account ID, API token)

1. Daftar atau masuk di <https://dash.cloudflare.com> (paket gratis cukup).
2. **Subdomain workers.dev (sekali saja):** buka **Workers & Pages**. Kalau
   diminta memilih subdomain `*.workers.dev`, pilih satu (mis. `mufuyu`).
   Alamat worker nanti: `https://meja-depan.<subdomain>.workers.dev`.
3. **Account ID:** di halaman **Workers & Pages** (atau halaman beranda akun),
   salin **Account ID** dari kolom kanan → simpan sebagai `CLOUDFLARE_ACCOUNT_ID`.
4. **API token:** klik ikon profil (kanan atas) → **My Profile** →
   **API Tokens** → **Create Token** → pilih templat **Edit Cloudflare Workers**
   → **Continue to summary** → **Create Token**. Salin tokennya (hanya tampil
   sekali) → simpan sebagai `CLOUDFLARE_API_TOKEN`.
   Kalau nanti pemasangan gagal dengan pesan izin soal Workers AI, sunting token
   itu dan tambahkan izin **Account → Workers AI → Read**.

## 4. Bot Telegram

1. Di Telegram, buka **@BotFather** → kirim `/newbot`.
2. Beri nama (mis. `Meja Depan Pyonkuro`) dan username yang berakhiran `bot`.
3. BotFather memberi **token** seperti `123456:ABC...` → simpan sebagai
   `TELEGRAM_BOT_TOKEN`.
4. Buka chat dengan bot barumu dan kirim pesan apa saja (mis. `halo`).
5. Di browser, buka `https://api.telegram.org/bot<TOKEN>/getUpdates` (ganti
   `<TOKEN>` dengan token tadi). Cari bagian `"chat":{"id":123456789,...}`.
   Angka itu (bisa diawali tanda minus) → simpan sebagai `TELEGRAM_CHAT_ID`.

## 5. Cloudflare Turnstile (anti-spam)

Site key publiknya sudah ada di `konfigurasi/umum.json`
(`0x4AAAAAAFjWJh9rejLeYSew`). Yang kamu perlukan adalah **secret key**-nya:

1. Di dashboard Cloudflare → **Turnstile** → buka widget dengan site key di atas.
2. Pastikan **Hostnames** memuat `mufuyumoku.github.io` (tambahkan `localhost`
   kalau ingin mencoba di komputer sendiri).
3. Salin **Secret Key** → simpan sebagai `TURNSTILE_SECRET_KEY`.

## 6. Resend (salinan laporan ke surel)

Resend dipakai hanya untuk mengirim laporan ke **surelmu sendiri**. Paket
gratisnya cukup untuk volume formulir. Kalau surel gagal, Telegram tetap
terkirim.

1. Daftar di <https://resend.com> **memakai alamat `mufuyumoku@gmail.com`**
   (alamat yang sama dengan `surelPemilik` di `konfigurasi/umum.json`). Tanpa
   domain sendiri, Resend hanya mengizinkan pengiriman ke alamat pemilik akun,
   dan itu memang yang kita perlukan.
2. Konfirmasi surel pendaftaran.
3. Buka **API Keys** → **Create API Key**. Beri nama (mis. `meja-depan`),
   pilih izin **Sending access**, lalu buat.
4. Salin kuncinya (diawali `re_`, hanya tampil sekali) → simpan sebagai
   `RESEND_API_KEY`.

Laporan akan datang dari `onboarding@resend.dev`. Periksa folder spam pada
kiriman pertama dan tandai "bukan spam".

## 7. Memasang worker dan mengaktifkan formulir

1. Setelah rahasia di atas tersimpan, buka tab **Actions** di repo →
   workflow **Meja Depan** → **Run workflow** (cabang `main`).
   Worker juga terpasang otomatis setiap ada perubahan di folder `meja-depan/`
   yang masuk ke `main`.
2. Kalau berhasil, langkah **Pasang worker** di log menampilkan alamat seperti
   `https://meja-depan.<subdomain>.workers.dev`. Cek dengan membuka
   `<alamat>/sehat` di browser. Harus muncul `{"ok":true,...}` dengan
   `"siap"` yang menunjukkan rahasia mana yang sudah terpasang. `telegram`
   dan `turnstile` harus `true`; `surel` `true` bila `RESEND_API_KEY` diisi.
3. Buka `meja-depan/konfigurasi/umum.json`, isi `"alamatWorker"` dengan alamat
   itu (tanpa garis miring di akhir), lalu commit ke `main`.
4. Situs dibangun ulang otomatis. Coba isi formulir sekali dari HP; laporan
   harus masuk ke Telegram (dan surel) dalam beberapa detik.
5. Selama `alamatWorker` masih kosong, formulir tidak aktif, tombol "Titip ide" tidak muncul di halaman utama, dan
   halaman formulir tidak diindeks mesin pencari.

## 8. Mencoba di komputer sendiri (opsional)

```bash
cd meja-depan
npm install
cp .env.example .dev.vars   # lalu isi nilainya di .dev.vars (berkas ini diabaikan git)
                            # tambahkan ASAL_TAMBAHAN=http://localhost:4321 agar situs lokal boleh mengirim
npm run dev                 # worker jalan di http://localhost:8787
npm test                    # menjalankan tes
```

## 9. Mengubah harga patokan, aturan tingkat, dan draf

Semua ada di folder `konfigurasi/`. Ubah berkasnya di GitHub (ikon pensil),
lalu commit ke `main`. Worker terpasang ulang otomatis.

- **Harga patokan** — `konfigurasi/tingkat.json`, bagian `hargaPatokan`.
  Contoh: `"kecil": "Rp1.500.000"`. Biarkan `""` supaya draf menulis
  "[isi harga]".
- **Aturan tingkat** — `konfigurasi/tingkat.json`:
  - `ciriJawaban` memetakan jawaban ke ciri. Contoh: jawaban `"ya"` pada
    pertanyaan `login` memberi ciri `"login"`.
  - `tingkat` memetakan ciri ke tingkat. Urutannya dari atas: tingkat pertama
    yang cirinya cocok yang dipakai. Tingkat terakhir harus punya
    `"jikaAda": []` sebagai bawaan.
- **Kata-kata draf penawaran** — `konfigurasi/draf.json`, bagian `draf` (tiga
  bahasa). Poin "apa yang dibuat" ada di bagian `poin`.
- **Daftar "hal yang belum jelas"** — `konfigurasi/draf.json`, bagian
  `belumJelas`.

Tes otomatis memeriksa bahwa konfigurasi tetap konsisten, mis. tidak merujuk
pertanyaan yang tidak ada. Kalau tes di pull request merah setelah mengubah
konfigurasi, baca pesan galatnya: biasanya ada nama yang salah ketik.
