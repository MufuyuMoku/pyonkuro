import { defineConfig } from 'astro/config';

// Situs dipasang di https://mufuyumoku.github.io/pyonkuro/.
// Kalau nama repo berubah, ubah BASE juga.
export default defineConfig({
  site: 'https://mufuyumoku.github.io',
  base: '/pyonkuro/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
