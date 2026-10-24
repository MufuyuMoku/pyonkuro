// Teks halaman Titip Ide (formulir Meja Depan), per bahasa.
// Pertanyaan pilihan (jenis, lanjutan, waktu, anggaran) ada di
// meja-depan/konfigurasi/pertanyaan.json, bukan di sini.
import type { Bahasa } from './teks';

// Alamat halaman Titip Ide per bahasa, relatif terhadap BASE.
export const JALUR_TITIP: Record<Bahasa, string> = {
  id: '/titip-ide/',
  en: '/en/leave-an-idea/',
  ja: '/ja/leave-an-idea/',
};

type TanyaTeks = { tanya: string; petunjuk: string };

export type TeksTitip = {
  judulTab: string;
  deskripsi: string;
  label: string;
  tombol: string; // tombol dari halaman utama
  judul: string;
  pengantar: string;
  belumAktif: string;
  kembali: string;
  noscript: string;
  privasi: string;
  formulir: {
    langkahKe: string; // {n} dan {total}
    lanjut: string;
    sebelumnya: string;
    kirim: string;
    mengirim: string;
    opsional: string;
    usaha: TanyaTeks;
    masalah: TanyaTeks;
    contoh: TanyaTeks;
    kontak: {
      tanya: string;
      nama: string;
      lewat: string;
      whatsapp: string;
      surel: string;
      nomorWa: string;
      petunjukWa: string;
      alamatSurel: string;
      namaUsaha: string;
    };
    ringkasan: { tanya: string; petunjuk: string; ubah: string; kosong: string; jenis: string; usaha: string; masalah: string; contoh: string; waktu: string; anggaran: string; kontak: string };
  };
  galat: {
    wajib: string;
    wajibPilih: string;
    terlaluPanjang: string;
    pilihanTidakDikenal: string;
    waTidakSah: string;
    surelTidakSah: string;
    kirimGagal: string;
    terlaluSering: string;
  };
  terima: { judul: string; isi: string; kembali: string; whatsapp: string; surel: string }; // {nama}, {saluran}
};

export const TEKS_TITIP: Record<Bahasa, TeksTitip> = {
  id: {
    judulTab: 'Titip Ide — Pyonkuro',
    deskripsi: 'Ceritakan kebutuhanmu ke Pyonkuro lewat beberapa pertanyaan singkat.',
    label: 'Titip ide',
    tombol: 'Titip ide',
    judul: 'Ceritakan idemu, pelan-pelan saja',
    pengantar: 'Beberapa pertanyaan singkat, satu per layar. Pyonkuro akan membaca ceritamu lalu menghubungimu.',
    belumAktif: 'Formulir ini sedang disiapkan. Sementara itu, ceritakan kebutuhanmu lewat surel atau WhatsApp di halaman utama.',
    kembali: 'Kembali ke halaman utama',
    noscript: 'Formulir ini butuh JavaScript. Kamu juga bisa bercerita lewat surel ke mufuyumoku@gmail.com.',
    privasi: 'Yang dikirim hanya jawabanmu di sini, termasuk nama dan kontak yang kamu tulis, untuk membalas pesanmu. Formulir ini tidak menyimpannya; jawabanmu diteruskan ke Telegram dan surel Pyonkuro, lalu dihapus paling lambat 90 hari setelah percakapan selesai, atau lebih cepat kalau kamu minta. Tanpa pelacak atau analitik.',
    formulir: {
      langkahKe: 'Langkah {n} dari {total}',
      lanjut: 'Lanjut',
      sebelumnya: 'Kembali',
      kirim: 'Kirim',
      mengirim: 'Mengirim…',
      opsional: 'opsional',
      usaha: { tanya: 'Ceritakan usaha atau kegiatanmu secara singkat.', petunjuk: 'Mis. "Toko kue rumahan, jualan lewat Instagram" atau "Guru les piano privat".' },
      masalah: { tanya: 'Masalah apa yang ingin diselesaikan?', petunjuk: 'Mis. "Pesanan lewat chat sering terlewat" atau "Murid susah melihat jadwal les".' },
      contoh: { tanya: 'Ada contoh situs atau aplikasi yang kamu suka?', petunjuk: 'Tempel tautannya atau sebut namanya. Boleh dilewati.' },
      kontak: {
        tanya: 'Terakhir, bagaimana Pyonkuro bisa menghubungimu?',
        nama: 'Nama atau panggilan',
        lewat: 'Hubungi saya lewat',
        whatsapp: 'WhatsApp',
        surel: 'Surel',
        nomorWa: 'Nomor WhatsApp',
        petunjukWa: 'Mis. 0812 3456 7890 atau +62 812 3456 7890',
        alamatSurel: 'Alamat surel',
        namaUsaha: 'Nama usaha',
      },
      ringkasan: {
        tanya: 'Sudah benar?',
        petunjuk: 'Periksa lagi jawabanmu. Pilih "Ubah" untuk memperbaiki, lalu kirim.',
        ubah: 'Ubah',
        kosong: '—',
        jenis: 'Mau dibuatkan',
        usaha: 'Usaha atau kegiatan',
        masalah: 'Masalah',
        contoh: 'Contoh yang disukai',
        waktu: 'Dibutuhkan',
        anggaran: 'Anggaran',
        kontak: 'Kontak',
      },
    },
    galat: {
      wajib: 'Bagian ini perlu diisi.',
      wajibPilih: 'Pilih salah satu dulu.',
      terlaluPanjang: 'Terlalu panjang. Coba dipersingkat.',
      pilihanTidakDikenal: 'Pilihan ini tidak dikenal. Pilih lagi.',
      waTidakSah: 'Nomor WhatsApp-nya sepertinya belum benar.',
      surelTidakSah: 'Alamat surelnya sepertinya belum benar.',
      kirimGagal: 'Maaf, pesannya belum terkirim. Coba lagi sebentar lagi, atau kirim ceritamu lewat surel ke mufuyumoku@gmail.com.',
      terlaluSering: 'Terlalu banyak kiriman dari jaringan ini. Coba lagi nanti, atau kirim lewat surel ke mufuyumoku@gmail.com.',
    },
    terima: {
      judul: 'Terima kasih, {nama}!',
      isi: 'Kebutuhanmu sudah diterima. Pyonkuro akan menghubungimu lewat {saluran}.',
      kembali: 'Kembali ke halaman utama',
      whatsapp: 'WhatsApp',
      surel: 'surel',
    },
  },

  en: {
    judulTab: 'Leave an idea — Pyonkuro',
    deskripsi: 'Tell Pyonkuro what you need through a few short questions.',
    label: 'Leave an idea',
    tombol: 'Leave an idea',
    judul: 'Tell me your idea, at your own pace',
    pengantar: 'A few short questions, one per screen. Pyonkuro will read what you wrote and get back to you.',
    belumAktif: 'This form is still being set up. In the meantime, tell me what you need by email or WhatsApp from the main page.',
    kembali: 'Back to the main page',
    noscript: 'This form needs JavaScript. You can also write to mufuyumoku@gmail.com.',
    privasi: 'Only your answers here are sent, including the name and contact you give, so I can reply. This form does not keep them: they are forwarded to Pyonkuro’s Telegram and email, and deleted no later than 90 days after our conversation ends, or sooner if you ask. No trackers or analytics.',
    formulir: {
      langkahKe: 'Step {n} of {total}',
      lanjut: 'Next',
      sebelumnya: 'Back',
      kirim: 'Send',
      mengirim: 'Sending…',
      opsional: 'optional',
      usaha: { tanya: 'Briefly, what do you do?', petunjuk: 'E.g. "Home bakery selling through Instagram" or "Private piano teacher".' },
      masalah: { tanya: 'What problem do you want to solve?', petunjuk: 'E.g. "Orders over chat keep getting missed" or "Students find it hard to check their lesson schedule".' },
      contoh: { tanya: 'Any sites or apps you like?', petunjuk: 'Paste a link or just name them. You can skip this.' },
      kontak: {
        tanya: 'Last one: how can Pyonkuro reach you?',
        nama: 'Name or nickname',
        lewat: 'Contact me by',
        whatsapp: 'WhatsApp',
        surel: 'Email',
        nomorWa: 'WhatsApp number',
        petunjukWa: 'Include your country code, e.g. +62 812 3456 7890',
        alamatSurel: 'Email address',
        namaUsaha: 'Business name',
      },
      ringkasan: {
        tanya: 'All good?',
        petunjuk: 'Check your answers. Choose "Edit" to fix anything, then send.',
        ubah: 'Edit',
        kosong: '—',
        jenis: 'To build',
        usaha: 'What you do',
        masalah: 'Problem',
        contoh: 'Examples you like',
        waktu: 'Needed',
        anggaran: 'Budget',
        kontak: 'Contact',
      },
    },
    galat: {
      wajib: 'Please fill this in.',
      wajibPilih: 'Please choose one.',
      terlaluPanjang: 'That’s a bit long. Try shortening it.',
      pilihanTidakDikenal: 'That option isn’t recognized. Please choose again.',
      waTidakSah: 'That WhatsApp number doesn’t look quite right.',
      surelTidakSah: 'That email address doesn’t look quite right.',
      kirimGagal: 'Sorry, your message didn’t go through. Please try again in a moment, or email mufuyumoku@gmail.com.',
      terlaluSering: 'Too many submissions from this network. Please try again later, or email mufuyumoku@gmail.com.',
    },
    terima: {
      judul: 'Thank you, {nama}!',
      isi: 'Your request has been received. Pyonkuro will get in touch by {saluran}.',
      kembali: 'Back to the main page',
      whatsapp: 'WhatsApp',
      surel: 'email',
    },
  },

  ja: {
    judulTab: 'アイデアを預ける — Pyonkuro',
    deskripsi: 'いくつかの短い質問に答えて、Pyonkuro にご要望をお伝えください。',
    label: 'アイデアを預ける',
    tombol: 'アイデアを預ける',
    judul: 'あなたのアイデア、ゆっくり聞かせてください',
    pengantar: '短い質問が一画面にひとつずつ。内容を読んだうえで、Pyonkuro からご連絡します。',
    belumAktif: 'このフォームは準備中です。それまでは、トップページのメールまたは WhatsApp からご相談ください。',
    kembali: 'トップページに戻る',
    noscript: 'このフォームには JavaScript が必要です。mufuyumoku@gmail.com へのメールでもご相談いただけます。',
    privasi: '送信されるのは、ここでの回答（お名前と連絡先を含む）のみで、ご返信のためだけに使います。フォーム側では保存せず、Pyonkuro の Telegram とメールに転送し、やり取りの終了から 90 日以内に削除します。ご希望があればそれより早く削除します。トラッカーや解析ツールは使っていません。',
    formulir: {
      langkahKe: '{total} 問中 {n} 問目',
      lanjut: '次へ',
      sebelumnya: '戻る',
      kirim: '送信する',
      mengirim: '送信中…',
      opsional: '任意',
      usaha: { tanya: 'どんなお仕事・活動をされていますか？', petunjuk: '例：「Instagram で販売している自宅のお菓子屋」「ピアノの個人レッスン」など。' },
      masalah: { tanya: 'どんな困りごとを解決したいですか？', petunjuk: '例：「チャットでの注文を見落としてしまう」「生徒がレッスン日程を確認しにくい」など。' },
      contoh: { tanya: '気に入っているサイトやアプリはありますか？', petunjuk: 'リンクを貼るか、名前を書いてください。飛ばしても大丈夫です。' },
      kontak: {
        tanya: '最後に、ご連絡先を教えてください。',
        nama: 'お名前（ニックネーム可）',
        lewat: '連絡方法',
        whatsapp: 'WhatsApp',
        surel: 'メール',
        nomorWa: 'WhatsApp の番号',
        petunjukWa: '国番号から入力してください。例：+81 90 1234 5678',
        alamatSurel: 'メールアドレス',
        namaUsaha: '屋号・会社名',
      },
      ringkasan: {
        tanya: 'この内容でよろしいですか？',
        petunjuk: '回答をご確認ください。直したいところは「修正」から変更し、送信してください。',
        ubah: '修正',
        kosong: '—',
        jenis: '作りたいもの',
        usaha: 'お仕事・活動',
        masalah: '困りごと',
        contoh: '気に入っている例',
        waktu: '時期',
        anggaran: 'ご予算',
        kontak: 'ご連絡先',
      },
    },
    galat: {
      wajib: 'ご記入ください。',
      wajibPilih: 'ひとつ選んでください。',
      terlaluPanjang: '少し長すぎます。短くしてみてください。',
      pilihanTidakDikenal: 'この選択肢は使えません。もう一度選んでください。',
      waTidakSah: 'WhatsApp の番号をご確認ください。',
      surelTidakSah: 'メールアドレスをご確認ください。',
      kirimGagal: '申し訳ありません、送信できませんでした。少し時間をおいて再度お試しいただくか、mufuyumoku@gmail.com へメールでお送りください。',
      terlaluSering: 'このネットワークからの送信が多すぎます。時間をおいて再度お試しいただくか、mufuyumoku@gmail.com へメールでお送りください。',
    },
    terima: {
      judul: '{nama} さん、ありがとうございます！',
      isi: 'ご要望を受け付けました。Pyonkuro から {saluran} でご連絡します。',
      kembali: 'トップページに戻る',
      whatsapp: 'WhatsApp',
      surel: 'メール',
    },
  },
};
