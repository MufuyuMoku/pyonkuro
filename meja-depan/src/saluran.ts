// Saluran laporan: Telegram (utama) dan surel lewat Resend (kedua).
// Keduanya berdiri sendiri; gagalnya satu tidak menghalangi yang lain.

// `html` dikirim dengan parse_mode HTML; `polos` dipakai bila HTML tidak ada atau ditolak.
export type Tombol = { teks: string; url: string };
export type PesanTelegram = { html?: string; polos: string; tombol?: Tombol | null };

const BATAS_WAKTU = 10_000;

async function kirimSatuTelegram(token: string, chatId: string, p: PesanTelegram, pakaiHtml: boolean, pakaiTombol: boolean): Promise<Response> {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal: AbortSignal.timeout(BATAS_WAKTU),
    body: JSON.stringify({
      chat_id: chatId,
      text: pakaiHtml ? p.html : p.polos,
      ...(pakaiHtml ? { parse_mode: 'HTML' } : {}),
      link_preview_options: { is_disabled: true },
      ...(p.tombol && pakaiTombol ? { reply_markup: { inline_keyboard: [[{ text: p.tombol.teks, url: p.tombol.url }]] } } : {}),
    }),
  });
}

async function kirimSatuDenganCadangan(token: string, chatId: string, p: PesanTelegram): Promise<void> {
  let res = await kirimSatuTelegram(token, chatId, p, p.html !== undefined, true);
  // Telegram menolak format atau tombol (400): kirim ulang sebagai teks polos tanpa tombol.
  if (!res.ok && res.status === 400 && (p.html !== undefined || p.tombol)) {
    res = await kirimSatuTelegram(token, chatId, p, false, false);
  }
  if (!res.ok) throw new Error(`Telegram ${res.status}`);
}

// Mengirim pesan berurutan. Pesan pertama (laporan) wajib berhasil; kalau gagal,
// galat dilempar. Pesan berikutnya (mis. draf) yang gagal hanya dicatat, supaya
// laporan yang sudah sampai tidak dianggap gagal.
export async function kirimTelegram(token: string, chatId: string, daftar: PesanTelegram[]): Promise<void> {
  const [pertama, ...lain] = daftar;
  await kirimSatuDenganCadangan(token, chatId, pertama);
  for (const p of lain) {
    try { await kirimSatuDenganCadangan(token, chatId, p); } catch (e) { console.error('Pesan lanjutan Telegram gagal:', String(e)); }
  }
}

export async function kirimSurel(
  kunci: string,
  surel: { dari: string; ke: string; subjek: string; teks: string; balasKe?: string },
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${kunci}`, 'content-type': 'application/json' },
    signal: AbortSignal.timeout(BATAS_WAKTU),
    body: JSON.stringify({
      from: surel.dari,
      to: [surel.ke],
      subject: surel.subjek,
      text: surel.teks,
      ...(surel.balasKe ? { reply_to: surel.balasKe } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
}
