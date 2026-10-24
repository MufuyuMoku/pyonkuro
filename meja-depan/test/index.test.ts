import { describe, expect, it } from 'vitest';
import worker from '../src/index';

const panggil = (jalur: string, init?: RequestInit) =>
  worker.fetch(new Request(`https://meja-depan.contoh.workers.dev${jalur}`, init), {});

describe('kerangka worker', () => {
  it('menjawab pemeriksaan kesehatan', async () => {
    const res = await panggil('/sehat');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, layanan: 'meja-depan' });
  });

  it('menolak jalur lain dengan 404', async () => {
    const res = await panggil('/apa-saja');
    expect(res.status).toBe(404);
  });
});
