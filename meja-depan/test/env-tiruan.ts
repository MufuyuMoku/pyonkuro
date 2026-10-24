// Env worker tiruan untuk tes: Durable Object di memori dan rahasia palsu.
import type { Env } from '../src/index';
import { Penghitung } from '../src/penghitung';
import { PenyimpananTiruan } from './tiruan-cloudflare';

export function buatEnv(lain: Partial<Env> = {}): Env & { penyimpanan: PenyimpananTiruan } {
  const penyimpanan = new PenyimpananTiruan();
  const instans = new Penghitung({ storage: penyimpanan } as never, {} as never);
  const namespace = {
    idFromName: (n: string) => n,
    get: () => instans,
  } as unknown as Env['PENGHITUNG'];
  return {
    PENGHITUNG: namespace,
    TELEGRAM_BOT_TOKEN: 'token-palsu',
    TELEGRAM_CHAT_ID: '12345',
    TURNSTILE_SECRET_KEY: 'rahasia-palsu',
    RESEND_API_KEY: 're_palsu',
    penyimpanan,
    ...lain,
  };
}
