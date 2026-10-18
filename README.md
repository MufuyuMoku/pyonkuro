# Pyonkuro

Situs studio Pyonkuro, dibangun dengan Astro dan dipasang di
https://mufuyumoku.github.io/pyonkuro/ dalam tiga bahasa:
Indonesia (`/`), Inggris (`/en/`), dan Jepang (`/ja/`).

## Menjalankan

```bash
npm install
npm run dev
```

## Menyunting

- Semua teks ada di `src/lib/teks.ts`, satu blok per bahasa. Kunci yang sama
  harus ada di ketiganya.
- Susunan halaman ada di `src/components/Halaman.astro`; ketiga rute di
  `src/pages/` hanya memanggilnya dengan bahasa yang berbeda.
- Warna, huruf, dan tata letak ada di `src/styles.css`. Hitam `#0e0d0b` dan
  emas chip `#C9A24D`.
- Logo: `public/pyonkuro-chip.svg` (juga favicon). Versi di dalam halaman
  ada sebagai simbol SVG `#pyonkuro` di `Halaman.astro`.

## Deploy

Setiap push ke `main` dibangun dan dipasang oleh
`.github/workflows/deploy.yml`. Setelan repo → Pages → Source harus
**GitHub Actions**.
