import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tes berjalan di Node; modul khusus Cloudflare diganti tiruan kecil.
export default defineConfig({
  resolve: {
    alias: { 'cloudflare:workers': fileURLToPath(new URL('./test/tiruan-cloudflare.ts', import.meta.url)) },
  },
});
