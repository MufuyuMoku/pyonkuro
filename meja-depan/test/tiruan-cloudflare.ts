// Tiruan minimal 'cloudflare:workers' untuk tes di Node, plus penyimpanan
// Durable Object di memori.

export class PenyimpananTiruan {
  data = new Map<string, unknown>();
  alarmPada: number | null = null;
  async get<T>(k: string) { return this.data.get(k) as T | undefined; }
  async put(k: string, v: unknown) { this.data.set(k, structuredClone(v)); }
  async delete(k: string | string[]) { for (const x of [k].flat()) this.data.delete(x); }
  async list<T>() { return new Map([...this.data]) as Map<string, T>; }
  async getAlarm() { return this.alarmPada; }
  async setAlarm(t: number) { this.alarmPada = t; }
}

export class DurableObject {
  ctx: { storage: PenyimpananTiruan };
  env: unknown;
  constructor(ctx: { storage: PenyimpananTiruan }, env: unknown) {
    this.ctx = ctx;
    this.env = env;
  }
}
