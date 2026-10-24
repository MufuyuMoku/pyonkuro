# PROGRESS — Meja Depan

| Milestone | Status | Branch |
| --- | --- | --- |
| M0 — Kerangka | Selesai, menunggu review PR | `claude/meja-depan-m0` |
| M1 — Formulir bertahap | Belum | |
| M2 — Pengiriman laporan | Belum | |
| M3 — Tingkat & draf | Belum | |
| M4 — Lapisan AI | Belum | |
| M5 — Pengerasan | Belum | |

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
