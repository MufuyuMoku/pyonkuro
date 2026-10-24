import { afterEach, describe, expect, it, vi } from 'vitest';
import { Penghitung } from '../src/penghitung';
import { PenyimpananTiruan } from './tiruan-cloudflare';

const buat = () => {
  const s = new PenyimpananTiruan();
  return { s, p: new Penghitung({ storage: s } as never, {} as never) };
};
afterEach(() => vi.useRealTimers());

describe('penghitung', () => {
  it('membatasi jumlah pemakaian dalam jendela waktu', async () => {
    vi.useFakeTimers({ now: 0 });
    const { p } = buat();
    expect(await p.cobaPakai('k', 2, 1000)).toBe(true);
    expect(await p.cobaPakai('k', 2, 1000)).toBe(true);
    expect(await p.cobaPakai('k', 2, 1000)).toBe(false);
    vi.setSystemTime(1001);
    expect(await p.cobaPakai('k', 2, 1000)).toBe(true);
  });

  it('kunci yang berbeda dihitung terpisah', async () => {
    const { p } = buat();
    expect(await p.cobaPakai('a', 1, 1000)).toBe(true);
    expect(await p.cobaPakai('b', 1, 1000)).toBe(true);
    expect(await p.cobaPakai('a', 1, 1000)).toBe(false);
  });

  it('alarm harian membuang catatan lama', async () => {
    vi.useFakeTimers({ now: 0 });
    const { p, s } = buat();
    await p.cobaPakai('lama', 5, 1000);
    expect(s.alarmPada).toBe(24 * 3600 * 1000);
    vi.setSystemTime(23 * 3600 * 1000);
    await p.cobaPakai('baru', 5, 1000);
    vi.setSystemTime(25 * 3600 * 1000);
    await p.alarm();
    expect([...s.data.keys()]).toEqual(['baru']);
    expect(s.alarmPada).toBe(49 * 3600 * 1000);
  });
});
