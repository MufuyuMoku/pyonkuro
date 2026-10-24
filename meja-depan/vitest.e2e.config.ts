import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tes end-to-end: browser sungguhan + situs hasil build + worker (lihat e2e/).
export default defineConfig({
  resolve: {
    alias: { 'cloudflare:workers': fileURLToPath(new URL('./test/tiruan-cloudflare.ts', import.meta.url)) },
  },
  test: { include: ['e2e/**/*.e2e.ts'], testTimeout: 60_000, hookTimeout: 120_000, fileParallelism: false },
});
