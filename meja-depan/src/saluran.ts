// Saluran laporan: Telegram (utama) dan surel lewat Resend (kedua).
// Keduanya berdiri sendiri; gagalnya satu tidak menghalangi yang lain.

// `html` dikirim dengan parse_mode HTML; `polos` dipakai bila HTML tidak ada atau ditolak.
export type PesanTelegram = { html?: string; polos: string; tombolWa?: string | null };

const BATAS_WAKTU = 10_000;

async function kirimSatuTelegram(token: string, chatId: string, p: PesanTelegram, pakaiHtml: boolean): Promise<Response> {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal: AbortSignal.timeout(BATAS_WAKTU),
    body: JSON.stringify({
      chat_id: chatId,
      text: pakaiHtml ? p.html : p.polos,
      ...(pakaiHtml ? { parse_mode: 'HTML' } : {}),
      link_preview_options: { is_disabled: true },
      ...(p.tombolWa
        ? { reply_markup: { inline_keyboard: [[{ text: 'Buka chat WhatsApp', url: `https://wa.me/${p.tombolWa}` }]] } }
        : {}),
    }),
  });
}

// Mengirim pesan berurutan. Kalau Telegram menolak format HTML (400), pesan
// yang sama dikirim ulang sebagai teks polos. Melempar galat kalau tetap gagal.
export async function kirimTelegram(token: string, chatId: string, daftar: PesanTelegram[]): Promise<void> {
  for (const p of daftar) {
    const pakaiHtml = p.html !== undefined;
    let res = await kirimSatuTelegram(token, chatId, p, pakaiHtml);
    if (!res.ok && res.status === 400 && pakaiHtml) res = await kirimSatuTelegram(token, chatId, p, false);
    if (!res.ok) throw new Error(`Telegram ${res.status}`);
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
