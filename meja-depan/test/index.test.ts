import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker, { type Env } from '../src/index';
import { buatEnv } from './env-tiruan';
import { kirimanContoh } from './contoh';

const ASAL = 'https://mufuyumoku.github.io';

type Panggilan = { url: string; body: any };
let panggilan: Panggilan[] = [];
let jawabTelegram: () => Response;
let jawabResend: () => Response;
let jawabTurnstile: () => Response;

beforeEach(() => {
  panggilan = [];
  jawabTelegram = () => Response.json({ ok: true });
  jawabResend = () => Response.json({ id: 'x' });
  jawabTurnstile = () => Response.json({ success: true, hostname: 'mufuyumoku.github.io' });
  vi.stubGlobal('fetch', async (input: string, init: RequestInit) => {
    const url = String(input);
    const body = init.body instanceof FormData ? Object.fromEntries(init.body) : JSON.parse(String(init.body));
    panggilan.push({ url, body });
    if (url.includes('api.telegram.org')) return jawabTelegram();
    if (url.includes('api.resend.com')) return jawabResend();
    if (url.includes('challenges.cloudflare.com')) return jawabTurnstile();
    throw new Error(`fetch tak terduga: ${url}`);
  });
});
afterEach(() => vi.unstubAllGlobals());

const kirim = (body: unknown, env: Env = buatEnv(), header: Record<string, string> = {}) =>
  worker.fetch(
    new Request('https://meja-depan.contoh.workers.dev/kirim', {
      method: 'POST',
      headers: { origin: ASAL, 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7', ...header },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    env,
  );
const sah = (lain: object = {}) => ({ ...kirimanContoh(), turnstile: 'token-ok', ...lain });
const ke = (bagian: string) => panggilan.filter((p) => p.url.includes(bagian));

describe('rute', () => {
  it('pemeriksaan kesehatan menunjukkan rahasia mana yang sudah terpasang, tanpa nilainya', async () => {
    const res = await worker.fetch(new Request('https://x.dev/sehat'), buatEnv({ RESEND_API_KEY: undefined }));
    const isi = await res.json();
    expect(isi).toEqual({ ok: true, layanan: 'meja-depan', siap: { telegram: true, turnstile: true, surel: false } });
    expect(JSON.stringify(isi)).not.toContain('palsu');
  });

  it('404 untuk jalur lain', async () => {
    expect((await worker.fetch(new Request('https://x.dev/apa'), buatEnv())).status).toBe(404);
  });

  it('preflight CORS hanya untuk asal Pyonkuro', async () => {
    const ok = await worker.fetch(new Request('https://x.dev/kirim', { method: 'OPTIONS', headers: { origin: ASAL } }), buatEnv());
    expect(ok.status).toBe(204);
    expect(ok.headers.get('access-control-allow-origin')).toBe(ASAL);
    const tolak = await worker.fetch(new Request('https://x.dev/kirim', { method: 'OPTIONS', headers: { origin: 'https://jahat.example' } }), buatEnv());
    expect(tolak.status).toBe(403);
    expect(tolak.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('menolak kiriman dari asal lain atau tanpa Origin', async () => {
    expect((await kirim(sah(), buatEnv(), { origin: 'https://jahat.example' })).status).toBe(403);
    const tanpa = await worker.fetch(new Request('https://x.dev/kirim', { method: 'POST', body: '{}' }), buatEnv());
    expect(tanpa.status).toBe(403);
    expect(panggilan).toHaveLength(0);
  });

  it('asal tambahan bisa diizinkan lewat ASAL_TAMBAHAN', async () => {
    const res = await kirim(sah(), buatEnv({ ASAL_TAMBAHAN: 'http://localhost:4321' }), { origin: 'http://localhost:4321' });
    expect(res.status).toBe(200);
  });

  it('menolak metode selain POST', async () => {
    const res = await worker.fetch(new Request('https://x.dev/kirim', { headers: { origin: ASAL } }), buatEnv());
    expect(res.status).toBe(405);
  });
});

describe('kiriman', () => {
  it('kiriman sah: laporan ke Telegram dan surel, jawaban ok', async () => {
    const res = await kirim(sah());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get('access-control-allow-origin')).toBe(ASAL);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');

    const [tg] = ke('api.telegram.org');
    expect(tg.url).toBe('https://api.telegram.org/bottoken-palsu/sendMessage');
    expect(tg.body.chat_id).toBe('12345');
    expect(tg.body.parse_mode).toBe('HTML');
    expect(tg.body.link_preview_options).toEqual({ is_disabled: true });
    expect(tg.body.text).toContain('Toko online &amp; transaksi');
    expect(tg.body.reply_markup.inline_keyboard[0][0].url).toBe('https://wa.me/6281234567890');

    const [surel] = ke('api.resend.com');
    expect(surel.body.to).toEqual(['mufuyumoku@gmail.com']);
    expect(surel.body.from).toContain('onboarding@resend.dev');
    expect(surel.body.subject).toMatch(/^Titip Ide #[A-Z0-9]{6}: Sari — Toko online & transaksi$/);
    expect(surel.body.text).toContain('> Pesanan lewat chat sering terlewat.');
    expect(surel.body.reply_to).toBeUndefined();
  });

  it('surel klien dipakai sebagai alamat balasan surel laporan', async () => {
    await kirim(sah({ kontakJenis: 'surel', kontak: 'sari@contoh.id' }));
    expect(ke('api.resend.com')[0].body.reply_to).toBe('sari@contoh.id');
    expect(ke('api.telegram.org')[0].body.reply_markup).toBeUndefined();
  });

  it('teks klien di-escape dan tidak bisa menyisipkan format atau tautan', async () => {
    await kirim(sah({ masalah: '<a href="https://jahat.example">Klik</a> <b>Tingkat: Kecil</b>', nama: 'Sari\n<b>Admin</b>' }));
    const teks: string = ke('api.telegram.org')[0].body.text;
    expect(teks).not.toContain('<a ');
    expect(teks).not.toContain('<b>Tingkat');
    expect(teks).toContain('<blockquote>&lt;a href=&quot;https://jahat.example&quot;&gt;Klik&lt;/a&gt; &lt;b&gt;Tingkat: Kecil&lt;/b&gt;</blockquote>');
    expect(teks).toContain('<b>Nama:</b> Sari &lt;b&gt;Admin&lt;/b&gt;');
  });

  it('kolom jebakan bot terisi: pura-pura berhasil tanpa mengirim apa pun', async () => {
    const res = await kirim(sah({ situsWeb: 'http://spam.example' }));
    expect(res.status).toBe(200);
    expect(panggilan).toHaveLength(0);
  });

  it('kiriman tidak sah ditolak dengan daftar medan, sebelum Turnstile', async () => {
    const res = await kirim(sah({ nama: '' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, galat: 'validasi', medan: { nama: 'wajib' } });
    expect(panggilan).toHaveLength(0);
  });

  it('JSON rusak atau terlalu besar ditolak', async () => {
    expect((await kirim('{bukan json')).status).toBe(400);
    expect((await kirim('[1,2]')).status).toBe(400);
    expect((await kirim({ ...sah(), masalah: 'x'.repeat(30_000) })).status).toBe(413);
  });

  it('token Turnstile ditolak → 403, tanpa laporan', async () => {
    jawabTurnstile = () => Response.json({ success: false });
    const res = await kirim(sah());
    expect(res.status).toBe(403);
    expect(ke('api.telegram.org')).toHaveLength(0);
  });

  it('Turnstile dari hostname lain ditolak', async () => {
    jawabTurnstile = () => Response.json({ success: true, hostname: 'jahat.example' });
    expect((await kirim(sah())).status).toBe(403);
  });

  it('Turnstile menerima rahasia, token, dan IP', async () => {
    await kirim(sah());
    expect(ke('challenges.cloudflare.com')[0].body).toEqual({ secret: 'rahasia-palsu', response: 'token-ok', remoteip: '203.0.113.7' });
  });

  it('batas kiriman per IP: yang keenam dalam satu jam ditolak 429', async () => {
    const env = buatEnv();
    for (let i = 0; i < 5; i++) expect((await kirim(sah(), env)).status).toBe(200);
    expect((await kirim(sah(), env)).status).toBe(429);
    expect((await kirim(sah(), env, { 'cf-connecting-ip': '198.51.100.1' })).status).toBe(200);
    expect([...env.penyimpanan.data.keys()].join()).not.toContain('203.0.113.7');
  });

  it('worker tidak menyimpan jawaban klien: penyimpanan hanya berisi hash IP dan cap waktu', async () => {
    const env = buatEnv();
    await kirim(sah({ nama: 'Sari Unik', masalah: 'Masalah-rahasia-123', kontak: '0812-9999-0000' }), env);
    const isi = JSON.stringify([...env.penyimpanan.data]);
    for (const jejak of ['Sari Unik', 'Masalah-rahasia-123', '0812', '203.0.113.7']) expect(isi).not.toContain(jejak);
    for (const [kunci, nilai] of env.penyimpanan.data) {
      expect(kunci).toMatch(/^(ip:[0-9a-f]{32}|ai:\d{4}-\d{2}-\d{2})$/);
      expect((nilai as unknown[]).every((t) => typeof t === 'number')).toBe(true);
    }
  });

  it('surel gagal: Telegram tetap terkirim dan klien mendapat ok', async () => {
    jawabResend = () => new Response('err', { status: 500 });
    const res = await kirim(sah());
    expect(res.status).toBe(200);
    expect(ke('api.telegram.org')).toHaveLength(2);
  });

  it('tanpa RESEND_API_KEY: hanya Telegram', async () => {
    const res = await kirim(sah(), buatEnv({ RESEND_API_KEY: undefined }));
    expect(res.status).toBe(200);
    expect(ke('api.resend.com')).toHaveLength(0);
  });

  it('Telegram gagal tapi surel berhasil: tetap ok', async () => {
    jawabTelegram = () => new Response('err', { status: 500 });
    expect((await kirim(sah())).status).toBe(200);
  });

  it('kedua saluran gagal → 502', async () => {
    jawabTelegram = () => new Response('err', { status: 500 });
    jawabResend = () => new Response('err', { status: 500 });
    expect((await kirim(sah())).status).toBe(502);
  });

  it('Telegram menolak HTML → dikirim ulang sebagai teks polos', async () => {
    let ke1 = true;
    jawabTelegram = () => (ke1 ? ((ke1 = false), new Response('bad', { status: 400 })) : Response.json({ ok: true }));
    expect((await kirim(sah())).status).toBe(200);
    const [a, b] = ke('api.telegram.org');
    expect(a.body.parse_mode).toBe('HTML');
    expect(b.body.parse_mode).toBeUndefined();
    expect(b.body.text).toContain('> Pesanan lewat chat sering terlewat.');
  });

  it('laporan memuat tingkat dan hal yang belum jelas; draf dikirim sebagai pesan kedua', async () => {
    await kirim(sah());
    const [laporan, draf] = ke('api.telegram.org');
    expect(laporan.body.text).toContain('<b>PERKIRAAN TINGKAT (HANYA UNTUK PEMILIK)</b>');
    expect(laporan.body.text).toContain('<b>Besar:</b> ada pesanan/transaksi, ada pembayaran online');
    expect(laporan.body.text).toContain('<b>Harga patokan:</b> [isi harga]');
    expect(laporan.body.text).toContain('Sudah punya akun penyedia pembayaran');
    expect(draf.body.parse_mode).toBeUndefined();
    expect(draf.body.text).toMatch(/^Halo Sari, terima kasih/);
    expect(draf.body.text).toContain('Harga: [isi harga]');
    expect(draf.body.reply_markup.inline_keyboard[0][0].url).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=Halo%20Sari/);
    expect(ke('api.resend.com')[0].body.text).toContain('DRAF PENAWARAN (bahasa formulir klien)\nHalo Sari');
  });

  it('draf gagal terkirim tidak membuat kiriman gagal', async () => {
    let n = 0;
    jawabTelegram = () => (++n === 1 ? Response.json({ ok: true }) : new Response('err', { status: 500 }));
    const res = await kirim(sah(), buatEnv({ RESEND_API_KEY: undefined }));
    expect(res.status).toBe(200);
  });

  it('tingkat dan harga tidak pernah ada di jawaban untuk klien', async () => {
    const res = await kirim(sah());
    expect(await res.text()).toBe('{"ok":true}');
  });

  it('rahasia wajib belum ada → 503 tanpa memanggil layanan apa pun', async () => {
    const res = await kirim(sah(), buatEnv({ TURNSTILE_SECRET_KEY: undefined }));
    expect(res.status).toBe(503);
    expect(panggilan).toHaveLength(0);
  });
});
