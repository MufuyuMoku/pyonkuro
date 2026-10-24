// Pemeriksaan token Cloudflare Turnstile di sisi server.
export async function cekTurnstile(
  token: string,
  rahasia: string,
  ip: string | null,
  hostDiizinkan: string[],
): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  const body = new FormData();
  body.append('secret', rahasia);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(8000),
    });
    const hasil = (await res.json()) as { success?: boolean; hostname?: string };
    return hasil.success === true && (!hasil.hostname || hostDiizinkan.includes(hasil.hostname));
  } catch {
    return false;
  }
}
