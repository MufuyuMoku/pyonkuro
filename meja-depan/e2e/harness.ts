// Harness tes end-to-end:
// - situs hasil build (.e2e-situs, dibangun dengan MEJA_DEPAN_URL ke worker lokal)
//   disajikan di http://127.0.0.1:4399/pyonkuro/;
// - worker Meja Depan yang sama dengan produksi dijalankan lewat adaptor HTTP di
//   http://127.0.0.1:8799, dengan Durable Object di memori;
// - layanan luar (Turnstile, Telegram, Resend) ditiru dengan mengganti fetch global
//   proses ini. Browser memuat Turnstile tiruan lewat page.route.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from 'playwright';
import worker, { type Env } from '../src/index';
import { buatEnv } from '../test/env-tiruan';

export const SITUS = 'http://127.0.0.1:4399';
export const WORKER = 'http://127.0.0.1:8799';
const AKAR = fileURLToPath(new URL('../.e2e-situs/', import.meta.url));

export type Keluar = { url: string; body: any };
export const keluar: Keluar[] = [];
export let env: Env = buatEnv();
export function aturUlang(lain: Partial<Env> = {}) {
  keluar.length = 0;
  env = buatEnv({ ASAL_TAMBAHAN: SITUS, ...lain });
}

const fetchAsli = globalThis.fetch;
function pasangFetchTiruan() {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    const body = init?.body instanceof FormData ? Object.fromEntries(init.body) : init?.body ? JSON.parse(String(init.body)) : null;
    keluar.push({ url, body });
    if (url.includes('challenges.cloudflare.com')) return Response.json({ success: body?.response === 'token-e2e', hostname: '127.0.0.1' });
    if (url.includes('api.telegram.org')) return Response.json({ ok: true });
    if (url.includes('api.resend.com')) return Response.json({ id: 'e2e' });
    throw new Error(`fetch keluar tak terduga: ${url}`);
  }) as typeof fetch;
}

const JENIS: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

function sajikanSitus(req: IncomingMessage, res: ServerResponse) {
  const jalur = decodeURIComponent(new URL(req.url ?? '/', SITUS).pathname);
  if (!jalur.startsWith('/pyonkuro/')) { res.writeHead(404).end(); return; }
  let berkas = normalize(join(AKAR, jalur.slice('/pyonkuro/'.length)));
  if (!berkas.startsWith(AKAR)) { res.writeHead(403).end(); return; }
  if (existsSync(berkas) && statSync(berkas).isDirectory()) berkas = join(berkas, 'index.html');
  if (!existsSync(berkas)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': JENIS[extname(berkas)] ?? 'application/octet-stream' }).end(readFileSync(berkas));
}

async function adaptorWorker(req: IncomingMessage, res: ServerResponse) {
  const potongan: Buffer[] = [];
  for await (const p of req) potongan.push(p as Buffer);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  headers.set('cf-connecting-ip', String(req.headers['x-ip-uji'] ?? '127.0.0.1'));
  const permintaan = new Request(new URL(req.url ?? '/', WORKER), {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : Buffer.concat(potongan),
  });
  const jawaban = await worker.fetch(permintaan, env);
  res.writeHead(jawaban.status, Object.fromEntries(jawaban.headers)).end(Buffer.from(await jawaban.arrayBuffer()));
}

let server: Server[] = [];
export async function mulaiServer() {
  const html = join(AKAR, 'titip-ide', 'index.html');
  if (!existsSync(html) || !readFileSync(html, 'utf8').includes(WORKER)) {
    throw new Error('Situs uji belum dibangun. Jalankan "npm run e2e" (membangun .e2e-situs dulu).');
  }
  pasangFetchTiruan();
  aturUlang();
  server = [createServer(sajikanSitus), createServer((q, s) => void adaptorWorker(q, s))];
  await Promise.all([
    new Promise<void>((r) => server[0].listen(4399, '127.0.0.1', r)),
    new Promise<void>((r) => server[1].listen(8799, '127.0.0.1', r)),
  ]);
}
export async function hentikanServer() {
  globalThis.fetch = fetchAsli;
  await Promise.all(server.map((s) => new Promise((r) => s.close(r))));
}

// Turnstile tiruan di browser: langsung memberi token yang diterima siteverify tiruan.
export async function pasangTurnstileTiruan(page: Page) {
  await page.route(/challenges\.cloudflare\.com/, (r) =>
    r.fulfill({
      contentType: 'text/javascript',
      body: `window.turnstile = { render(el, o) { setTimeout(() => o.callback('token-e2e'), 30); return 'w'; }, reset() {} };`,
    }),
  );
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
}

export const ke = (bagian: string) => keluar.filter((k) => k.url.includes(bagian));
