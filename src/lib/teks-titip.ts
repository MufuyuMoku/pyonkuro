// Teks halaman Titip Ide (formulir Meja Depan), per bahasa.
// Pertanyaan dan pilihan jawaban ada di meja-depan/konfigurasi/, bukan di sini.
import type { Bahasa } from './teks';

// Alamat halaman Titip Ide per bahasa, relatif terhadap BASE.
export const JALUR_TITIP: Record<Bahasa, string> = {
  id: '/titip-ide/',
  en: '/en/leave-an-idea/',
  ja: '/ja/leave-an-idea/',
};

export type TeksTitip = {
  judulTab: string;
  deskripsi: string;
  label: string;
  judul: string;
  pengantar: string;
  belumAktif: string;
  kembali: string;
};

export const TEKS_TITIP: Record<Bahasa, TeksTitip> = {
  id: {
    judulTab: 'Titip Ide — Pyonkuro',
    deskripsi: 'Ceritakan kebutuhanmu ke Pyonkuro lewat beberapa pertanyaan singkat.',
    label: 'Titip ide',
    judul: 'Ceritakan idemu, pelan-pelan saja',
    pengantar: 'Beberapa pertanyaan singkat, satu per layar. Pyonkuro akan membaca ceritamu dan menghubungimu.',
    belumAktif: 'Formulir ini sedang disiapkan. Sementara itu, ceritakan kebutuhanmu lewat surel atau WhatsApp di halaman utama.',
    kembali: 'Kembali ke halaman utama',
  },
  en: {
    judulTab: 'Leave an idea — Pyonkuro',
    deskripsi: 'Tell Pyonkuro what you need through a few short questions.',
    label: 'Leave an idea',
    judul: 'Tell me your idea, at your own pace',
    pengantar: 'A few short questions, one per screen. Pyonkuro will read what you wrote and get back to you.',
    belumAktif: 'This form is still being set up. In the meantime, tell me what you need by email or WhatsApp from the main page.',
    kembali: 'Back to the main page',
  },
  ja: {
    judulTab: 'アイデアを預ける — Pyonkuro',
    deskripsi: 'いくつかの短い質問に答えて、Pyonkuro にご要望をお伝えください。',
    label: 'アイデアを預ける',
    judul: 'あなたのアイデア、ゆっくり聞かせてください',
    pengantar: '短い質問が一画面にひとつずつ。内容を読んだうえで、Pyonkuro からご連絡します。',
    belumAktif: 'このフォームは準備中です。それまでは、トップページのメールまたは WhatsApp からご相談ください。',
    kembali: 'トップページに戻る',
  },
};
