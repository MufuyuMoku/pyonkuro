// Worker Meja Depan: menerima kiriman formulir Titip Ide, memeriksanya, lalu
// mengirim laporan ke pemilik lewat Telegram dan surel. Tidak menyimpan kiriman.
import { panggilAi, PENANDA_NAMA } from './ai';
import { halBelumJelas, hargaPatokan, perkiraTingkat, susunDraf } from './aturan';
import { validasi, type Kiriman } from './formulir';
import { subjekSurel, susunPaket } from './laporan';
import { Penghitung } from './penghitung';
import { kirimSurel, kirimTelegram } from './saluran';
import { cekTurnstile } from './turnstile';
import { UMUM } from './umum';

export { Penghitung };

export interface Env {
  PENGHITUNG: DurableObjectNamespace<Penghitung>;
  AI?: Ai;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  // Asal tambahan yang diizinkan, dipisah koma (mis. http://localhost:4321 saat mencoba lokal).
  ASAL_TAMBAHAN?: string;
}

const BATAS_UKURAN = 20_000; // byte; kiriman sah jauh di bawah ini

export function asalDiizinkan(env: Env): string[] {
  const tambahan = (env.ASAL_TAMBAHAN ?? '').split(',').map((a) => a.trim()).filter(Boolean);
  return [...UMUM.asalDiizinkan, ...tambahan];
}

// Header yang selalu ikut: jawaban tidak disimpan cache dan tidak ditebak jenisnya.
const HEADER_AMAN = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };

function jawab(isi: unknown, status: number, asal: string | null): Response {
  const headers: Record<string, string> = { 'content-type': 'application/json; charset=utf-8', vary: 'Origin', ...HEADER_AMAN };
  if (asal) headers['access-control-allow-origin'] = asal;
  return new Response(JSON.stringify(isi), { status, headers });
}

async function hashIp(ip: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`meja-depan:${ip}`));
  return [...new Uint8Array(hash)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function kodeAcak(): string {
  const huruf = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return [...crypto.getRandomValues(new Uint8Array(6))].map((b) => huruf[b % huruf.length]).join('');
}

const penghitung = (env: Env) => env.PENGHITUNG.get(env.PENGHITUNG.idFromName('penghitung'));

// Laporan lengkap: aturan dulu, lalu (bila tersedia) dirapikan AI.
async function siapkanPaket(data: Kiriman, env: Env) {
  const tingkat = perkiraTingkat(data).id;
  const dasar = {
    belumJelas: halBelumJelas(data),
    drafBernama: susunDraf({ ...data, nama: PENANDA_NAMA }, tingkat),
    harga: hargaPatokan(tingkat),
  };
  const ai = await panggilAi(env, penghitung(env), data, dasar);
  const nama = data.nama.replace(/\s*\n\s*/g, ' ');
  return susunPaket(data, {
    kode: kodeAcak(),
    waktu: new Date(),
    ringkasanAi: ai?.ringkasan,
    belumJelas: ai?.belumJelas,
    draf: ai?.draf?.replaceAll(PENANDA_NAMA, () => nama),
    penyediaAi: ai?.penyedia,
  });
}

async function terimaKiriman(req: Request, env: Env, asal: string): Promise<Response> {
  if (!env.TURNSTILE_SECRET_KEY || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return jawab({ ok: false, galat: 'belum-siap' }, 503, asal);
  }

  if (Number(req.headers.get('content-length') ?? 0) > BATAS_UKURAN) return jawab({ ok: false, galat: 'ukuran' }, 413, asal);
  const mentah = await req.text();
  if (mentah.length > BATAS_UKURAN) return jawab({ ok: false, galat: 'ukuran' }, 413, asal);

  let masukan: Record<string, unknown>;
  try {
    const p = JSON.parse(mentah) as unknown;
    if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error();
    masukan = p as Record<string, unknown>;
  } catch {
    return jawab({ ok: false, galat: 'format' }, 400, asal);
  }

  // Jebakan bot: kolom tersembunyi yang tidak pernah diisi manusia. Pura-pura berhasil.
  if (typeof masukan.situsWeb === 'string' && masukan.situsWeb !== '') return jawab({ ok: true }, 200, asal);

  const hasil = validasi(masukan);
  if (!hasil.ok) return jawab({ ok: false, galat: 'validasi', medan: hasil.galat }, 400, asal);

  const ip = req.headers.get('cf-connecting-ip');
  const hostDiizinkan = asalDiizinkan(env).map((a) => new URL(a).hostname);
  if (!(await cekTurnstile(String(masukan.turnstile ?? ''), env.TURNSTILE_SECRET_KEY, ip, hostDiizinkan))) {
    return jawab({ ok: false, galat: 'turnstile' }, 403, asal);
  }

  const { jumlah, jendelaMenit } = UMUM.batasKiriman;
  if (!(await penghitung(env).cobaPakai(`ip:${await hashIp(ip ?? 'tanpa-ip')}`, jumlah, jendelaMenit * 60_000))) {
    return jawab({ ok: false, galat: 'batas' }, 429, asal);
  }

  const paket = await siapkanPaket(hasil.data, env);
  const [telegram, surel] = await Promise.allSettled([
    kirimTelegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, paket.pesan),
    env.RESEND_API_KEY
      ? kirimSurel(env.RESEND_API_KEY, {
          dari: UMUM.pengirimSurel,
          ke: UMUM.surelPemilik,
          subjek: subjekSurel(paket.laporan),
          teks: paket.surel,
          balasKe: hasil.data.kontakJenis === 'surel' ? hasil.data.kontak : undefined,
        })
      : Promise.reject(new Error('surel tidak diatur')),
  ]);

  if (telegram.status === 'rejected') console.error('Telegram gagal:', String(telegram.reason));
  if (surel.status === 'rejected' && env.RESEND_API_KEY) console.error('Surel gagal:', String(surel.reason));
  if (telegram.status === 'rejected' && surel.status === 'rejected') {
    return jawab({ ok: false, galat: 'gagal-kirim' }, 502, asal);
  }
  return jawab({ ok: true }, 200, asal);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get('origin');
    const asal = origin && asalDiizinkan(env).includes(origin) ? origin : null;

    if (url.pathname === '/sehat' && req.method === 'GET') {
      return jawab({
        ok: true,
        layanan: 'meja-depan',
        siap: {
          telegram: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
          turnstile: Boolean(env.TURNSTILE_SECRET_KEY),
          surel: Boolean(env.RESEND_API_KEY),
        },
      }, 200, asal);
    }

    if (url.pathname === '/kirim') {
      if (!asal) return jawab({ ok: false, galat: 'asal' }, 403, null);
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'access-control-allow-origin': asal,
            'access-control-allow-methods': 'POST, OPTIONS',
            'access-control-allow-headers': 'content-type',
            'access-control-max-age': '86400',
            vary: 'Origin',
            ...HEADER_AMAN,
          },
        });
      }
      if (req.method === 'POST') return terimaKiriman(req, env, asal);
      return jawab({ ok: false, galat: 'metode' }, 405, asal);
    }

    return jawab({ ok: false, galat: 'tidak-ditemukan' }, 404, asal);
  },
} satisfies ExportedHandler<Env>;
