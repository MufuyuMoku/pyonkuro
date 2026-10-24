// Formulir bertahap Titip Ide: satu layar per pertanyaan, validasi yang sama
// dengan worker (meja-depan/src/formulir.ts), ringkasan, lalu kirim.
import { PERTANYAAN, daftarLangkah, medanLangkah, validasi, type Bahasa, type KodeGalat, type Kiriman } from '../../meja-depan/src/formulir';
import type { TeksTitip } from '../lib/teks-titip';

type Data = {
  bahasa: Bahasa;
  alamat: string;
  beranda: string;
  teks: Pick<TeksTitip, 'formulir' | 'galat' | 'terima'>;
};

const SIMPANAN = 'titip-ide-draf';

const form = document.getElementById('titip') as HTMLFormElement | null;
const dataEl = document.getElementById('data-titip');
if (form && dataEl) mulai(form, JSON.parse(dataEl.textContent ?? '{}') as Data);

function mulai(form: HTMLFormElement, { bahasa, alamat, teks }: Data) {
  const f = teks.formulir;
  const g = teks.galat;
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const layar = new Map([...form.querySelectorAll<HTMLElement>('[data-langkah]')].map((el) => [el.dataset.langkah!, el]));
  const tombolLanjut = $<HTMLButtonElement>('tombol-lanjut');
  const tombolKembali = $<HTMLButtonElement>('tombol-kembali');
  const galatKirim = $('galat-kirim');

  let urutan = daftarLangkah('');
  let posisi = 0;

  // --- Membaca dan mengisi jawaban -----------------------------------------
  const medan = (nama: string) => form.elements.namedItem(nama) as { value: string } | null;
  const v = (nama: string) => (medan(nama)?.value ?? '').trim() === '' ? '' : medan(nama)!.value;

  function kumpulkan(): Record<string, unknown> {
    const jenis = v('jenis');
    const lanjutan: Record<string, string> = {};
    for (const p of PERTANYAAN.lanjutan[jenis] ?? []) lanjutan[p.id] = v(`lanjutan.${p.id}`);
    return {
      bahasa, jenis, usaha: v('usaha'), masalah: v('masalah'), lanjutan, contoh: v('contoh'),
      waktu: v('waktu'), anggaran: v('anggaran'), nama: v('nama'), kontakJenis: v('kontakJenis'),
      kontak: v('kontak'), namaUsaha: v('namaUsaha'),
    };
  }

  function isi(nama: string, nilai: string) {
    const el = form.elements.namedItem(nama);
    if (el instanceof RadioNodeList) {
      for (const r of el) (r as HTMLInputElement).checked = (r as HTMLInputElement).value === nilai;
    } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.value = nilai;
  }

  // Draf disimpan di tab ini saja (sessionStorage) supaya jawaban tidak hilang
  // kalau halaman tak sengaja ditinggalkan. Dihapus setelah terkirim.
  function simpan() {
    try { sessionStorage.setItem(SIMPANAN, JSON.stringify({ jawaban: kumpulkanSemua(), posisi })); } catch { /* tidak apa-apa */ }
  }
  function kumpulkanSemua() {
    const semua: Record<string, string> = {};
    for (const el of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[name], textarea[name]')) {
      if (el instanceof HTMLInputElement && el.type === 'radio') { if (el.checked) semua[el.name] = el.value; }
      else semua[el.name] = el.value;
    }
    return semua;
  }
  function pulihkan(): number {
    try {
      const s = JSON.parse(sessionStorage.getItem(SIMPANAN) ?? 'null') as { jawaban: Record<string, string>; posisi: number } | null;
      if (!s) return 0;
      for (const [nama, nilai] of Object.entries(s.jawaban)) isi(nama, nilai);
      return s.posisi;
    } catch { return 0; }
  }

  // --- Galat --------------------------------------------------------------
  const pilihanRadio = (nama: string) => !!form.querySelector(`input[type="radio"][name="${CSS.escape(nama)}"]`);
  function pesan(nama: string, kode: KodeGalat): string {
    if (kode === 'wajib') return pilihanRadio(nama) ? g.wajibPilih : g.wajib;
    if (kode === 'terlalu-panjang') return g.terlaluPanjang;
    if (kode === 'pilihan-tidak-dikenal') return g.pilihanTidakDikenal;
    return v('kontakJenis') === 'surel' ? g.surelTidakSah : g.waTidakSah;
  }

  // Menampilkan galat untuk medan di satu layar. Mengembalikan true kalau tidak ada galat.
  function tandai(langkah: string, galat: Record<string, KodeGalat>): boolean {
    let pertama: HTMLElement | null = null;
    for (const nama of medanLangkah(langkah)) {
      const kode = galat[nama];
      const tempat = form.querySelector<HTMLElement>(`[data-galat="${CSS.escape(nama)}"]`);
      if (tempat) tempat.textContent = kode ? pesan(nama, kode) : '';
      for (const el of form.querySelectorAll<HTMLElement>(`[name="${CSS.escape(nama)}"]`)) {
        if (kode) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      }
      if (kode && !pertama) pertama = form.querySelector<HTMLElement>(`[name="${CSS.escape(nama)}"]`);
    }
    pertama?.focus();
    return !pertama;
  }

  // --- Menampilkan layar ---------------------------------------------------
  function tampilkan(i: number, fokus = true) {
    urutan = daftarLangkah(v('jenis'));
    posisi = Math.max(0, Math.min(i, urutan.length - 1));
    const langkah = urutan[posisi];
    for (const [k, el] of layar) el.hidden = k !== langkah;
    $('kemajuan-teks').textContent = f.langkahKe.replace('{n}', String(posisi + 1)).replace('{total}', String(urutan.length));
    $('kemajuan-isi').style.width = `${((posisi + 1) / urutan.length) * 100}%`;
    tombolKembali.hidden = posisi === 0;
    tombolLanjut.textContent = langkah === 'ringkasan' ? f.kirim : f.lanjut;
    galatKirim.textContent = '';
    if (langkah === 'ringkasan') isiRingkasan();
    if (fokus) {
      const el = layar.get(langkah)!;
      if (el.getBoundingClientRect().top < 0) form.scrollIntoView({ block: 'start' });
      el.querySelector<HTMLElement>('.layar__tanya')?.focus({ preventScroll: true });
    }
    simpan();
  }

  function isiRingkasan() {
    const r = f.ringkasan;
    const data = kumpulkan();
    const label = (daftar: { id: string; label: Record<Bahasa, string> }[] | undefined, id: unknown) =>
      daftar?.find((p) => p.id === id)?.label[bahasa] ?? '';
    const jenis = String(data.jenis);
    const baris: [string, string, string][] = [
      [r.jenis, label(PERTANYAAN.jenis.pilihan, jenis), 'jenis'],
      [r.usaha, String(data.usaha), 'usaha'],
      [r.masalah, String(data.masalah), 'masalah'],
      ...(PERTANYAAN.lanjutan[jenis] ?? []).map((p): [string, string, string] => {
        const nilai = (data.lanjutan as Record<string, string>)[p.id];
        return [p.pertanyaan[bahasa], p.tipe === 'pilihan' ? label(p.pilihan, nilai) : nilai, `lanjutan.${p.id}`];
      }),
      [r.contoh, String(data.contoh), 'contoh'],
      [r.waktu, label(PERTANYAAN.waktu.pilihan, data.waktu), 'waktu'],
      [r.anggaran, label(PERTANYAAN.anggaran.pilihan, data.anggaran), 'anggaran'],
      [r.kontak, [data.nama, `${data.kontakJenis === 'surel' ? f.kontak.surel : f.kontak.whatsapp}: ${data.kontak}`, data.namaUsaha].filter(Boolean).join('\n'), 'kontak'],
    ];
    const dl = $('ringkasan-isi');
    dl.replaceChildren(...baris.map(([judul, isi, ke]) => {
      const div = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      const nilai = document.createElement('span');
      const ubah = document.createElement('button');
      dt.textContent = judul;
      nilai.textContent = isi || r.kosong;
      ubah.type = 'button';
      ubah.className = 'ringkasan__ubah';
      ubah.textContent = r.ubah;
      ubah.setAttribute('aria-label', `${r.ubah}: ${judul}`);
      ubah.addEventListener('click', () => tampilkan(urutan.indexOf(ke)));
      dd.append(nilai, ubah);
      div.append(dt, dd);
      return div;
    }));
  }

  // --- Kirim ----------------------------------------------------------------
  async function kirim() {
    const h = validasi(kumpulkan());
    if (!h.ok) {
      // Kembali ke layar pertama yang bermasalah.
      const salah = urutan.find((l) => medanLangkah(l).some((m) => m in h.galat)) ?? urutan[0];
      tampilkan(urutan.indexOf(salah));
      tandai(salah, h.galat);
      return;
    }
    tombolLanjut.disabled = true;
    tombolKembali.disabled = true;
    tombolLanjut.textContent = f.mengirim;
    try {
      const res = await fetch(`${alamat}/kirim`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(h.data),
      });
      if (res.ok) return selesai(h.data);
      galatKirim.textContent = res.status === 429 ? g.terlaluSering : g.kirimGagal;
    } catch {
      galatKirim.textContent = g.kirimGagal;
    } finally {
      tombolLanjut.disabled = false;
      tombolKembali.disabled = false;
      tombolLanjut.textContent = f.kirim;
    }
  }

  function selesai(data: Kiriman) {
    try { sessionStorage.removeItem(SIMPANAN); } catch { /* tidak apa-apa */ }
    const saluran = data.kontakJenis === 'surel' ? teks.terima.surel : teks.terima.whatsapp;
    form.hidden = true;
    $('terima-judul').textContent = teks.terima.judul.replace('{nama}', data.nama);
    $('terima-isi').textContent = teks.terima.isi.replace('{saluran}', `${saluran} (${data.kontak})`);
    const terima = $('terima');
    terima.hidden = false;
    terima.scrollIntoView({ block: 'start' });
    $('terima-judul').focus({ preventScroll: true });
  }

  // --- Peristiwa ------------------------------------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const langkah = urutan[posisi];
    if (langkah === 'ringkasan') { void kirim(); return; }
    const h = validasi(kumpulkan());
    if (tandai(langkah, h.ok ? {} : h.galat)) tampilkan(posisi + 1);
  });
  tombolKembali.addEventListener('click', () => tampilkan(posisi - 1));

  // Penghitung karakter untuk kotak teks.
  for (const hitung of form.querySelectorAll<HTMLElement>('[data-hitung]')) {
    const kotak = $<HTMLTextAreaElement>(hitung.dataset.hitung!);
    const perbarui = () => { hitung.textContent = `${kotak.value.length}/${kotak.maxLength}`; };
    kotak.addEventListener('input', perbarui);
    perbarui();
  }

  // Label dan jenis isian kontak mengikuti pilihan WhatsApp/surel.
  const kontak = $<HTMLInputElement>('m-kontak');
  const labelKontak = $('l-kontak');
  const petunjukKontak = $('p-kontak');
  function aturKontak() {
    const surel = v('kontakJenis') === 'surel';
    labelKontak.textContent = (surel ? labelKontak.dataset.surel : labelKontak.dataset.wa) ?? '';
    petunjukKontak.hidden = surel;
    kontak.type = surel ? 'email' : 'tel';
    kontak.inputMode = surel ? 'email' : 'tel';
    kontak.autocomplete = surel ? 'email' : 'tel';
  }
  for (const r of form.querySelectorAll<HTMLInputElement>('input[name="kontakJenis"]')) r.addEventListener('change', aturKontak);

  // Hapus tanda galat begitu jawabannya diubah.
  form.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (!el.name) return;
    el.removeAttribute('aria-invalid');
    const tempat = form.querySelector<HTMLElement>(`[data-galat="${CSS.escape(el.name)}"]`);
    if (tempat) tempat.textContent = '';
  });

  form.hidden = false;
  const awal = pulihkan();
  aturKontak();
  for (const kotak of form.querySelectorAll('textarea')) kotak.dispatchEvent(new Event('input'));
  tampilkan(awal, false);
}
