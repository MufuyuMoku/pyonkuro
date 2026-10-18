// Semua teks situs, per bahasa. Menambah atau mengubah kalimat cukup di sini.
// Kunci yang sama harus ada di ketiga bahasa (TypeScript akan mengeluh kalau
// ada yang terlewat).

export const BAHASA = ['id', 'en', 'ja'] as const;
export type Bahasa = (typeof BAHASA)[number];

// Label di pemilih bahasa dan atribut lang HTML.
export const NAMA_BAHASA: Record<Bahasa, { label: string; lang: string }> = {
  id: { label: 'ID', lang: 'id' },
  en: { label: 'EN', lang: 'en' },
  ja: { label: '日本語', lang: 'ja' },
};

// Alamat situs per bahasa, relatif terhadap BASE.
export const JALUR: Record<Bahasa, string> = { id: '/', en: '/en/', ja: '/ja/' };

const PORTO = 'https://mufuyumoku.github.io/portofolio/';
export const PORTOFOLIO: Record<Bahasa, string> = {
  id: PORTO,
  en: `${PORTO}en/`,
  ja: `${PORTO}ja/`,
};

type Jasa = { judul: string; isi: string; contoh: string };
type Karya = { jenis: string; isi: string; aksi: string };

export type Teks = {
  judulTab: string;
  deskripsi: string;
  pilihBahasa: string;
  lead: string;
  arti: [string, string, string]; // pyon, kuro, Pyuro
  altChip: string;
  karya: { label: string; judul: string; pengantar: string; onsa: Karya; saku: Karya; lanjutSebelum: string; lanjutTautan: string; lanjutSesudah: string };
  jasa: { label: string; judul: string; daftar: [Jasa, Jasa, Jasa, Jasa]; harga: string };
  cara: { label: string; judul: string; langkah: [string, string][] };
  kontak: { label: string; judul: string; salin: string; tersalin: string; tekanSalin: string; github: string; portofolio: string };
  kaki: string;
};

export const TEKS: Record<Bahasa, Teks> = {
  id: {
    judulTab: 'Pyonkuro',
    deskripsi: 'Pyonkuro — studio dan bengkel pribadi Mufuyu Moku. Aplikasi desktop, situs web, alat audio, dan tulisan.',
    pilihBahasa: 'Pilih bahasa',
    lead: 'Studio dan bengkel pribadi. Ide yang awalnya terdengar absurd dikerjakan di sini sampai jadi sesuatu yang bisa dipakai: aplikasi desktop, situs web, alat audio, sampai tulisan.',
    arti: ['lompatan kelinci', 'hitam', 'singkatnya'],
    altChip: 'Cap Pyonkuro: chip hitam-emas berisi kepala kelinci',
    karya: {
      label: 'Sudah bisa dipakai',
      judul: 'Karya bercap Pyonkuro',
      pengantar: 'Keduanya dibangun dengan cara kerja yang sama: spesifikasi tertulis dulu, lalu tiap tahap baru diterima kalau ujinya lulus.',
      onsa: {
        jenis: 'Aplikasi desktop · Windows & Linux',
        isi: 'Pemutar musik untuk orang yang menyimpan berkas musiknya sendiri. Strip di bawah jendela menunjukkan jalur yang benar-benar dilewati suara, dari format berkas sampai keluaran.',
        aksi: 'Unduh rilis',
      },
      saku: {
        jenis: 'Situs web · bisa dipasang di HP',
        isi: 'Pencari peraturan pajak Indonesia yang tetap jalan tanpa internet. Pencariannya berjalan di perangkat, tanpa server. Bukan situs resmi pemerintah.',
        aksi: 'Buka situsnya',
      },
      lanjutSebelum: 'Karya lain, termasuk yang masih dikerjakan dan karya tulis, ada di ',
      lanjutTautan: 'portofolio Mufuyu Moku',
      lanjutSesudah: '.',
    },
    jasa: {
      label: 'Jasa',
      judul: 'Yang bisa dibuatkan',
      daftar: [
        { judul: 'Situs web', isi: 'Profil, katalog, atau alat kecil. Bisa dibuat tetap jalan tanpa internet dan tanpa biaya server.', contoh: 'Contoh: Saku Pajak, portofolio' },
        { judul: 'Aplikasi desktop', isi: 'Aplikasi Windows dan Linux yang menyimpan data di perangkat sendiri, tanpa akun.', contoh: 'Contoh: Onsa' },
        { judul: 'Aplikasi untuk HP', isi: 'Dimulai dari web yang bisa dipasang di layar utama HP dan dipakai seperti aplikasi.', contoh: 'Contoh: Saku Pajak' },
        { judul: 'IoT & server kecil', isi: 'Perangkat dan server rumahan dari perangkat keras murah, termasuk backup yang sudah diuji pemulihannya.', contoh: 'Contoh: Project HOME' },
      ],
      harga: 'Harga mengikuti lingkup pekerjaan. Ceritakan kebutuhannya lewat surel dulu.',
    },
    cara: {
      label: 'Cara kerja',
      judul: 'Dari obrolan sampai serah terima',
      langkah: [
        ['Kebutuhan ditulis', 'Apa yang harus bisa dilakukan, dituliskan bersama sebelum mulai membangun.'],
        ['Dipecah per tahap', 'Tiap tahap punya batas yang jelas, jadi kemajuannya bisa dilihat dan dicoba.'],
        ['Dicek sebelum diterima', 'Satu tahap baru dianggap selesai kalau perilakunya lulus uji.'],
        ['Diserahkan dengan catatan', 'Hasilnya diserahkan bersama catatan keputusan dan cara memakainya.'],
      ],
    },
    kontak: {
      label: 'Kontak',
      judul: 'Punya ide yang terdengar absurd?',
      salin: 'Salin surel',
      tersalin: 'Tersalin',
      tekanSalin: 'Tekan Ctrl+C',
      github: 'GitHub',
      portofolio: 'Portofolio',
    },
    kaki: 'Pyonkuro — dijalankan oleh Mufuyu Moku',
  },

  en: {
    judulTab: 'Pyonkuro',
    deskripsi: 'Pyonkuro — the personal studio and workshop of Mufuyu Moku. Desktop apps, websites, audio tools, and writing.',
    pilihBahasa: 'Choose language',
    lead: 'A one-person studio and workshop. Ideas that sound absurd at first get worked on here until they turn into something you can use: desktop apps, websites, audio tools, and writing.',
    arti: ['a rabbit’s hop', 'black', 'Pyuro for short'],
    altChip: 'The Pyonkuro mark: a black and gold chip with a rabbit’s head',
    karya: {
      label: 'Ready to use',
      judul: 'Work under the Pyonkuro mark',
      pengantar: 'Both were built the same way: a written specification first, and each stage accepted only once its tests pass.',
      onsa: {
        jenis: 'Desktop app · Windows & Linux',
        isi: 'A music player for people who keep their own music files. A strip at the bottom of the window shows the path the sound actually takes, from the file format to the output.',
        aksi: 'Download the release',
      },
      saku: {
        jenis: 'Website · installable on phones',
        isi: 'A search tool for Indonesian tax regulations that keeps working offline. Search runs on your device, with no server. Not an official government site.',
        aksi: 'Open the site',
      },
      lanjutSebelum: 'More work, including projects in progress and writing, is in ',
      lanjutTautan: 'Mufuyu Moku’s portfolio',
      lanjutSesudah: '.',
    },
    jasa: {
      label: 'Services',
      judul: 'What I can build for you',
      daftar: [
        { judul: 'Websites', isi: 'Profiles, catalogs, or small tools. They can keep working offline and need no server costs.', contoh: 'Examples: Saku Pajak, portfolio' },
        { judul: 'Desktop apps', isi: 'Windows and Linux apps that keep data on your own device, with no account needed.', contoh: 'Example: Onsa' },
        { judul: 'Apps for phones', isi: 'Starting from websites that can be installed on a phone’s home screen and used like an app.', contoh: 'Example: Saku Pajak' },
        { judul: 'IoT & small servers', isi: 'Home devices and servers built on inexpensive hardware, including backups whose restore has been tested.', contoh: 'Example: Project HOME' },
      ],
      harga: 'Pricing depends on the scope of the work. Tell me what you need by email first.',
    },
    cara: {
      label: 'How I work',
      judul: 'From the first chat to handover',
      langkah: [
        ['Write down the needs', 'What it must be able to do is written down together before anything gets built.'],
        ['Split into stages', 'Each stage has clear limits, so progress can be seen and tried.'],
        ['Check before accepting', 'A stage only counts as done once its behavior passes the tests.'],
        ['Hand over with notes', 'The result comes with a record of the decisions made and how to use it.'],
      ],
    },
    kontak: {
      label: 'Contact',
      judul: 'Got an idea that sounds absurd?',
      salin: 'Copy email',
      tersalin: 'Copied',
      tekanSalin: 'Press Ctrl+C',
      github: 'GitHub',
      portofolio: 'Portfolio',
    },
    kaki: 'Pyonkuro — run by Mufuyu Moku',
  },

  ja: {
    judulTab: 'Pyonkuro',
    deskripsi: 'Pyonkuro（ぴょんくろ）— Mufuyu Moku の個人スタジオ兼工房。デスクトップアプリ、ウェブサイト、音声ツール、そして文章。',
    pilihBahasa: '言語を選択',
    lead: '個人のスタジオ兼工房です。最初は突拍子もなく聞こえるアイデアを、実際に使えるものになるまで形にしています。デスクトップアプリ、ウェブサイト、音声ツール、そして文章まで。',
    arti: ['うさぎの跳ねる音', '黒', '略して'],
    altChip: 'Pyonkuro のしるし：うさぎの頭が入った黒と金のチップ',
    karya: {
      label: 'すぐに使えるもの',
      judul: 'Pyonkuro のしるしが付いた作品',
      pengantar: 'どちらも同じ進め方で作りました。まず仕様を書き、各段階はテストに合格してはじめて完了とします。',
      onsa: {
        jenis: 'デスクトップアプリ · Windows & Linux',
        isi: '自分で音楽ファイルを持っている人のための音楽プレーヤー。ウィンドウ下部のストリップに、音が実際に通る経路をファイル形式から出力まで表示します。',
        aksi: 'リリースをダウンロード',
      },
      saku: {
        jenis: 'ウェブサイト · スマホにインストール可能',
        isi: 'オフラインでも使えるインドネシアの税法規検索ツール。検索は端末上で動き、サーバーは使いません。政府の公式サイトではありません。',
        aksi: 'サイトを開く',
      },
      lanjutSebelum: '制作中のものや文章を含むその他の作品は、',
      lanjutTautan: 'Mufuyu Moku のポートフォリオ',
      lanjutSesudah: 'にあります。',
    },
    jasa: {
      label: 'サービス',
      judul: '作れるもの',
      daftar: [
        { judul: 'ウェブサイト', isi: 'プロフィール、カタログ、小さなツールなど。オフラインでも動き、サーバー費用のかからない形にできます。', contoh: '例：Saku Pajak、ポートフォリオ' },
        { judul: 'デスクトップアプリ', isi: 'データを自分の端末に保存する Windows・Linux 向けアプリ。アカウントは不要です。', contoh: '例：Onsa' },
        { judul: 'スマホ向けアプリ', isi: 'まずはスマホのホーム画面に追加して、アプリのように使えるウェブから。', contoh: '例：Saku Pajak' },
        { judul: 'IoT・小型サーバー', isi: '安価なハードウェアで作る家庭用の機器やサーバー。復元テスト済みのバックアップも含みます。', contoh: '例：Project HOME' },
      ],
      harga: '料金は作業範囲によって決まります。まずはメールでご相談ください。',
    },
    cara: {
      label: '進め方',
      judul: '相談から納品まで',
      langkah: [
        ['必要なことを書き出す', '何ができなければならないかを、作り始める前に一緒に書き出します。'],
        ['段階に分ける', '各段階の範囲をはっきりさせるので、進み具合を見て試せます。'],
        ['確認してから受け入れる', '動作がテストに合格して、はじめてその段階を完了とします。'],
        ['記録と一緒に納品する', '決めたことの記録と使い方を添えてお渡しします。'],
      ],
    },
    kontak: {
      label: 'お問い合わせ',
      judul: '突拍子もないアイデア、ありますか？',
      salin: 'メールをコピー',
      tersalin: 'コピーしました',
      tekanSalin: 'Ctrl+C を押してください',
      github: 'GitHub',
      portofolio: 'ポートフォリオ',
    },
    kaki: 'Pyonkuro — 運営：Mufuyu Moku',
  },
};
