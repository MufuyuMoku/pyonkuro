# SPEC — Meja Depan Pyonkuro (formulir pintar penerima klien)

Nama kerja: **Meja Depan**. Dokumen ini sumber kebenaran proyek. Hal yang tidak tertulis di sini ditanyakan atau dicatat sebagai asumsi di DECISIONS.md — jangan mengarang.

## 1. Tujuan

Calon klien bisa menceritakan kebutuhannya kapan saja lewat web Pyonkuro. Pemilik (Mufuyu Moku) tidak perlu membalas satu per satu: ia menerima **laporan rapi** berisi ringkasan kebutuhan, perkiraan tingkat proyek, dan **draf penawaran singkat** yang tinggal diperiksa, disesuaikan harganya, lalu dikirim.

## 2. Peran

- **Klien / pemilik produk:** Mufuyu Moku — menentukan lingkup, menyetujui tiap milestone.
- **Konsultan:** Claude (chat).
- **Developer:** Claude Code.

## 3. Prinsip (tidak boleh dilanggar)

1. **Meja Depan menerima, tidak memutuskan.** Tidak pernah menyebut harga final, tenggat pasti, atau menyetujui apa pun atas nama pemilik. Ke klien hanya: "terima kasih, kebutuhanmu sudah diterima, Pyonkuro akan menghubungi lewat [kontak yang dipilih klien]".
2. **Perkiraan harga dan tingkat proyek hanya untuk pemilik**, tidak pernah ditampilkan ke klien.
3. **Data klien seminimal mungkin:** nama/panggilan, kontak balasan (WhatsApp atau surel), nama usaha (opsional), dan jawaban kebutuhan. Tidak meminta alamat, KTP, data keuangan, atau kata sandi apa pun.
4. **Tidak ada rahasia di repo.** Token Telegram, kunci API, dan lainnya lewat secrets/variabel lingkungan; sediakan `.env.example`.
5. **Tetap jalan tanpa AI.** Alur utama (formulir bertahap + laporan + draf berbasis aturan) berfungsi penuh tanpa kunci API AI. AI hanya lapisan tambahan.
6. **Masukan klien = data, bukan perintah.** Teks klien tidak pernah diperlakukan sebagai instruksi untuk sistem atau untuk AI.
7. Tanpa analitik atau pelacak pihak ketiga.

## 4. Arsitektur

- **Halaman:** di situs Pyonkuro yang sudah ada (Astro, GitHub Pages), halaman baru mis. `/mulai/` di ketiga bahasa (ID, EN, JA), mengikuti gaya visual Pyonkuro. Tombol "Ceritakan kebutuhanmu" dari bagian Jasa dan Kontak mengarah ke sini.
- **Backend kecil:** satu serverless function (bawaan: **Cloudflare Workers**, paket gratis) di folder `meja-depan/` dalam repo yang sama atau repo terpisah — catat pilihan di DECISIONS.md. Tugasnya: menerima kiriman, memvalidasi, (opsional) memanggil AI, menyusun laporan, mengirim ke pemilik.
- **Saluran laporan:** **Telegram** (bot milik pemilik, dibuat lewat BotFather) sebagai saluran utama. Surel sebagai saluran kedua opsional.
- **Penyimpanan:** tidak wajib. Bila dibutuhkan untuk riwayat, simpan seminimal mungkin dengan masa simpan terbatas (bawaan 90 hari) — catat di DECISIONS.md.

## 5. Alur klien (formulir bertahap)

Satu pertanyaan per layar, bahasa santai dan sederhana, bisa kembali ke langkah sebelumnya, ada indikator kemajuan.

1. Kamu mau dibuatkan apa? (pilihan: situs web · toko online & transaksi · aplikasi desktop · aplikasi untuk HP · belum tahu / lainnya)
2. Ceritakan usaha atau kegiatanmu secara singkat.
3. Masalah apa yang ingin diselesaikan? (teks bebas, dengan contoh di placeholder)
4. Pertanyaan lanjutan sesuai pilihan nomor 1 (mis. untuk toko online: kira-kira berapa jenis produk, perlu pembayaran online atau tidak, siapa yang mengurus pesanan). Daftar pertanyaan per jenis disimpan di satu berkas konfigurasi supaya mudah diubah pemilik.
5. Ada contoh situs/aplikasi yang kamu suka? (tautan, opsional)
6. Kapan kira-kira dibutuhkan? (pilihan: secepatnya · 1 bulan · 2–3 bulan · fleksibel)
7. Kisaran anggaran? (pilihan rentang yang diatur di konfigurasi, termasuk "belum tahu")
8. Nama/panggilan + cara dihubungi (WhatsApp atau surel) + nama usaha (opsional).
9. Ringkasan jawaban untuk diperiksa klien → kirim.
10. Halaman terima kasih (lihat prinsip 1).

Validasi di sisi browser **dan** server. Batas panjang setiap jawaban.

## 6. Laporan untuk pemilik

Dikirim ke Telegram dalam format yang enak dibaca di HP:

- **Kartu ringkas:** nama, kontak, jenis proyek, kapan dibutuhkan, anggaran.
- **Ringkasan kebutuhan:** 3–5 baris.
- **Perkiraan tingkat:** Kecil / Sedang / Besar, dengan alasan singkat (aturan di §7).
- **Hal yang belum jelas:** daftar pertanyaan yang perlu ditanyakan pemilik ke klien.
- **Draf penawaran singkat** (§8), siap disalin ke WhatsApp.
- **Tombol/tautan cepat:** buka chat WhatsApp atau surel ke klien.

## 7. Perkiraan tingkat (berbasis aturan)

Aturan disimpan di berkas konfigurasi yang bisa diubah pemilik tanpa menyentuh kode:

| Tingkat | Ciri-ciri |
| --- | --- |
| Kecil | 1–3 halaman, tanpa database, tanpa login |
| Sedang | Ada data yang diubah lewat panel, ada login |
| Besar | Ada transaksi/pembayaran atau beberapa peran pengguna |

Konfigurasi juga memuat **harga patokan per tingkat** (diisi pemilik; boleh kosong → draf menulis "[isi harga]").

## 8. Draf penawaran singkat

Hanya tiga hal wajib, ditulis sebagai pesan WhatsApp yang sopan dan sederhana:

1. **Apa yang dibuat** (daftar poin dari jawaban klien),
2. **Harga** (dari patokan tingkat, atau "[isi harga]"),
3. **Cara bayar:** DP sebelum mulai, pelunasan saat serah terima; revisi sesuai lingkup.

Ditambah satu kalimat: hal di luar daftar dibuatkan penawaran tambahan.

## 9. Lapisan AI (opsional)

Aktif hanya bila kunci API tersedia; mati → otomatis kembali ke alur §5–§8 tanpa AI.

- Penyedia: Claude API, model ringan (bawaan `claude-haiku-5-5`), bisa diganti lewat konfigurasi.
- Tugas AI **hanya**: (a) merapikan ringkasan kebutuhan, (b) menyusun daftar "hal yang belum jelas", (c) memperhalus bahasa draf penawaran. Tingkat proyek dan harga tetap dari aturan §7, bukan dari AI.
- AI **tidak** mengobrol langsung dengan klien di versi pertama. (Mode obrolan bisa jadi milestone nanti setelah disetujui.)
- Jawaban klien dikirim ke AI sebagai data yang dibungkus jelas, dengan instruksi sistem yang menolak perintah apa pun di dalamnya.
- Batas biaya: maksimum panggilan per hari (bawaan 50) dan panjang masukan dibatasi.

## 10. Keamanan & anti-spam

- Captcha ringan (bawaan Cloudflare Turnstile) dan batas kiriman per IP.
- Hanya menerima kiriman dari domain Pyonkuro (CORS).
- Sanitasi semua teks sebelum dikirim ke Telegram (tidak ada format atau tautan yang bisa disisipkan klien untuk menipu pemilik).
- Catatan privasi singkat di halaman formulir: data apa yang dikumpulkan, untuk apa, berapa lama disimpan.

## 11. Milestone

Kerjakan berurutan. Setiap milestone selesai: tes lulus, PROGRESS.md diperbarui, lalu berhenti dan laporkan.

- **M0 — Kerangka:** halaman `/mulai/` kosong di tiga bahasa, function kosong yang bisa di-deploy, `.env.example`, README langkah membuat bot Telegram dan menyiapkan Cloudflare (bahasa sederhana, langkah demi langkah).
- **M1 — Formulir bertahap:** alur §5 lengkap di tiga bahasa, validasi, halaman terima kasih.
- **M2 — Pengiriman laporan:** function menerima kiriman, laporan §6 tanpa AI terkirim ke Telegram; anti-spam §10.
- **M3 — Tingkat & draf:** aturan §7 dan draf §8 dari berkas konfigurasi; tes unit untuk aturan tingkat.
- **M4 — Lapisan AI:** §9 lengkap dengan fallback, batas biaya, dan tes bahwa sistem tetap jalan tanpa kunci.
- **M5 — Pengerasan:** tes end-to-end, cek tampilan HP, catatan privasi, panduan pemilik (cara mengubah pertanyaan, aturan tingkat, dan harga patokan).

## 12. Keputusan terbuka (untuk pemilik)

- Nama tampilan halaman (mis. "Mulai proyek", "Ceritakan kebutuhanmu").
- Rentang anggaran yang ditampilkan ke klien.
- Harga patokan per tingkat.
- Surel sebagai saluran kedua: ya/tidak.
- Siapa yang membayar kunci Claude API (biayanya per pemakaian, kecil untuk volume rendah).
