// Penghitung pemakaian (Durable Object, satu instans). Dipakai untuk batas kiriman
// per IP dan, nanti, batas panggilan AI per hari. Yang disimpan hanya kunci
// (hash IP atau tanggal) dan cap waktu; isi kiriman tidak pernah disimpan.
import { DurableObject } from 'cloudflare:workers';

const SEHARI = 24 * 60 * 60 * 1000;

export class Penghitung extends DurableObject {
  // Mencatat satu pemakaian untuk `kunci` bila belum mencapai `jumlah` dalam `jendelaMs`.
  // Mengembalikan false bila batas sudah tercapai (pemakaian tidak dicatat).
  async cobaPakai(kunci: string, jumlah: number, jendelaMs: number): Promise<boolean> {
    const sekarang = Date.now();
    const lama = (await this.ctx.storage.get<number[]>(kunci)) ?? [];
    const masih = lama.filter((t) => sekarang - t < jendelaMs);
    const boleh = masih.length < jumlah;
    if (boleh) masih.push(sekarang);
    if (boleh || masih.length !== lama.length) await this.ctx.storage.put(kunci, masih);
    if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(sekarang + SEHARI);
    return boleh;
  }

  // Bersih-bersih harian: buang catatan yang sudah lebih dari sehari.
  async alarm(): Promise<void> {
    const batas = Date.now() - SEHARI;
    const semua = await this.ctx.storage.list<number[]>();
    const usang = [...semua].filter(([, waktu]) => Math.max(0, ...waktu) < batas).map(([k]) => k);
    if (usang.length) await this.ctx.storage.delete(usang);
    if (semua.size > usang.length) await this.ctx.storage.setAlarm(Date.now() + SEHARI);
  }
}
