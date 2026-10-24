// Worker Meja Depan. M0: kerangka yang bisa dipasang — hanya pemeriksaan kesehatan.

export interface Env {}

const json = (isi: unknown, status = 200) =>
  new Response(JSON.stringify(isi), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export default {
  async fetch(req: Request, _env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname === '/sehat') return json({ ok: true, layanan: 'meja-depan' });
    return json({ ok: false, galat: 'tidak-ditemukan' }, 404);
  },
} satisfies ExportedHandler<Env>;
