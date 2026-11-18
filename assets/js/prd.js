/* =========================================================
   Oreedo — assets/js/prd.js
   Wizard pembuat PRD.md + TASKS.md: contoh adaptif 4 jenis proyek,
   stepper interaktif, pemeriksaan kualitas PRD, tab aksesibel
   (Arrow/Home/End + hidden="until-found" + beforematch), pratinjau live,
   mode edit langsung, output ID/EN, template, dan riwayat/ekspor JSON.
   ========================================================= */
(function (root) {
  'use strict';

  var hasWindow = typeof window !== 'undefined' && typeof document !== 'undefined';
  var Oreedo = hasWindow
    ? window.Oreedo
    : (typeof require === 'function' ? require('./common.js') : {});

  var $ = Oreedo.$;
  var $$ = Oreedo.$$;

  var STORAGE_KEY = 'prd-draft';
  var HISTORY_KEY = 'prd-history';
  var TOTAL_STEPS = 8;
  var MAX_HISTORY = 30;

  var STEP_NAMES = [
    'Ide & tujuan',
    'Pengguna & masalah',
    'Kebutuhan',
    'Halaman & alur',
    'Desain & gaya',
    'Teknologi & batasan',
    'Larangan',
    'Kriteria & hasil'
  ];

  var REQUIRED = ['ide', 'tujuan', 'pengguna', 'masalah', 'kebutuhan', 'kriteria'];

  var FIELD_STEP = {
    projectType: 1,
    namaProyek: 1,
    ide: 1,
    tujuan: 1,
    pengguna: 2,
    masalah: 2,
    kebutuhan: 3,
    halaman: 4,
    desain: 5,
    teknologi: 6,
    larangan: 7,
    kriteria: 8
  };

  var PROJECT_TYPES = {
    website: {
      label: 'Website',
      labelEn: 'Website',
      halamanLabel: 'Halaman / Alur',
      halamanLabelEn: 'Pages / Flows',
      halamanPlaceholder: 'Contoh:\nBeranda → Daftar → Detail\nTentang\nKontak',
      kriteriaPlaceholder: 'Ketika dibuka di 360px, maka tidak ada scroll horizontal.\nKetika tombol ditekan, maka fokus dan status tampil jelas.'
    },
    reels: {
      label: 'Reels / Video',
      labelEn: 'Reels / Video',
      halamanLabel: 'Shot / Alur',
      halamanLabelEn: 'Shots / Pacing',
      halamanPlaceholder: 'Contoh:\nHook 3 detik → masalah → solusi → CTA\nB-roll pendukung',
      kriteriaPlaceholder: 'Ketika ditonton tanpa suara, maka teks tetap terbaca.\nKetika durasi ditotal, maka tidak lebih dari 45 detik.'
    },
    deck: {
      label: 'Deck',
      labelEn: 'Pitch / Presentation Deck',
      halamanLabel: 'Slide / Alur',
      halamanLabelEn: 'Slides / Narrative',
      halamanPlaceholder: 'Contoh:\nSlide 1 judul → slide 2 masalah → ... → penutup\nLampiran data',
      kriteriaPlaceholder: 'Ketika dibaca 5 menit, maka audiens paham masalah dan penawaran.\nKetika slide terakhir ditutup, maka ada ajakan aksi yang jelas.'
    },
    app: {
      label: 'Aplikasi Kecil',
      labelEn: 'Small Web App',
      halamanLabel: 'Layar / Alur',
      halamanLabelEn: 'Screens / User Flows',
      halamanPlaceholder: 'Contoh:\nOnboarding → Beranda → Detail → Pengaturan\nPencarian',
      kriteriaPlaceholder: 'Ketika data kosong, maka tampil pesan yang jelas.\nKetika tombol simpan ditekan, maka data tersimpan di browser.'
    }
  };

  /* ---------- Contoh Adaptif per Jenis Proyek ---------- */
  var EXAMPLES = {
    website: {
      projectType: 'website',
      namaProyek: 'Tanam',
      ide: 'Website kecil untuk mencatat kebiasaan menyiram tanaman hias dan mengingatkan kapan waktunya.',
      tujuan: 'Pengguna bisa mencatat tanaman dan melihat jadwal siram dalam satu layar dalam 10 detik.',
      pengguna: 'Pemilik tanaman hias di rumah, usia 20-40, nyaman memakai browser di ponsel 360px.',
      masalah: 'Sering lupa jadwal siram karena catatan tersebar di chat dan kertas.',
      kebutuhan: 'Melihat daftar tanaman\nMenambah tanaman baru\nMenandai tanaman sudah disiram\nMelihat jadwal siram hari ini',
      halaman: 'Beranda → Daftar tanaman → Detail tanaman\nTambah tanaman\nJadwal hari ini',
      desain: 'Palet hijau-putih, sudut membulat 14px, font Plus Jakarta Sans, kontras teks minimal 4.5:1.',
      teknologi: 'HTML, CSS, JS murni. Tanpa framework. Tanpa backend. Data disimpan di localStorage.',
      larangan: 'Jangan mengarang data tanaman contoh melebihi yang tertulis\nJangan memakai framework atau bundler\nJangan mengubah file tahap sebelumnya tanpa izin',
      kriteria: 'Ketika data kosong, maka tampil pesan ajakan menambah tanaman.\nKetika tombol tandai disiram ditekan, maka tanggal siram diperbarui.\nKetika dibuka di 360px, maka tidak ada scroll horizontal.'
    },
    reels: {
      projectType: 'reels',
      namaProyek: 'KopiPagi 40 Detik',
      ide: 'Video Reels pendek yang membandingkan dua kesalahan paling sering saat menyeduh kopi tubruk di rumah dan cara membenahinya.',
      tujuan: 'Penonton menonton sampai habis minimal 75% durasi dan menyimpan video sebagai panduan seduh.',
      pengguna: 'Peminum kopi rumahan usia 18-35 tahun yang menonton Reels tanpa suara di transportasi umum.',
      masalah: 'Tutorial kopi di internet terlalu panjang (10+ menit) dan penuh istilah barista yang membingungkan pemula.',
      kebutuhan: 'Skrip narasi berdurasi total 35-42 detik\nTeks layar besar untuk mode tanpa suara\nDaftar shot visual dan transisi\nPenutup dengan ajakan simpan dan coba besok pagi',
      halaman: '0-3 detik: Hook masalah kopi pahit\n4-18 detik: Kesalahan air mendidih vs diamkan 45 detik\n19-32 detik: Perbandingan rasio sendok takar\n33-42 detik: Ringkasan + CTA simpan',
      desain: 'Rasio 9:16 vertikal, subtitle tebal kontras putih di atas bar gelap, warna hangat cokelat-krem.',
      teknologi: 'Produksi memakai kamera ponsel 1080p 30fps, edit di CapCut/Premiere tanpa efek 3D berat.',
      larangan: 'Jangan memakai jargon teknis berat seperti TDS atau ekstraksi kimia\nJangan membuat opening bertele-tele lebih dari 3 detik\nJangan letakkan teks di area tombol like/caption IG (20% bawah & kanan)',
      kriteria: 'Ketika video diputar tanpa audio, maka seluruh instruksi tetap terbaca jelas.\nKetika naskah dibaca dengan tempo normal, maka total durasi berada di 35-42 detik.\nKetika frame dicek di rasio 9:16, maka teks bebas dari area UI Instagram/TikTok.'
    },
    deck: {
      projectType: 'deck',
      namaProyek: 'Ringkasan Ekspansi NusaKopi Q3',
      ide: 'Deck presentasi 9 slide untuk memaparkan kinerja kedai Q1-Q2 dan rencana pembukaan 1 gerai satelit baru.',
      tujuan: 'Mitra investasi memahami angka unit ekonomi dan menyetujui anggaran tahap awal gerai kedua.',
      pengguna: 'Tiga calon mitra investor non-teknis yang meninjau deck lewat laptop atau PDF di tablet selama 10 menit.',
      masalah: 'Laporan keuangan mentah terlalu padat angka mentah sehingga alur keputusan tidak langsung terlihat.',
      kebutuhan: 'Ringkasan performa 6 bulan terakhir dalam 3 metrik utama\nPeta lokasi kandidat beserta sewa bulanan\nRincian kebutuhan modal dan proyeksi balik modal\nJadwal pembukaan 12 minggu dan manajemen risiko',
      halaman: 'Slide 1: Sampul & ringkasan 1 kalimat\nSlide 2: Peluang & kendala kapasitas sekarang\nSlide 3-4: Angka penjualan & biaya operasional per gelas\nSlide 5-6: Rencana lokasi satelit & rincian anggaran\nSlide 7-8: Linimasa 12 minggu & mitigasi risiko\nSlide 9: Keputusan yang diminta hari ini',
      desain: 'Rasio 16:9, maksimal 35 kata per slide, grafik batang sederhana, satu ide per slide.',
      teknologi: 'Format struktur siap pakai untuk Google Slides / PowerPoint / Pitch tanpa animasi rumit.',
      larangan: 'Jangan mengarang angka pendapatan atau proyeksi selain yang tersedia\nJangan menaruh tabel lebih dari 4 kolom dalam satu slide\nJangan memakai klaim tanpa sumber atau catatan asumsi',
      kriteria: 'Ketika dibaca per judul slide saja, maka alur cerita sudah tersambung utuh.\nKetika ada data proyeksi belum terisi, maka diberi penanda [ISI: …] alih-alih angka fiktif.\nKetika presentasi selesai di Slide 9, maka tertulis jelas jumlah modal dan keputusan yang diharapkan.'
    },
    app: {
      projectType: 'app',
      namaProyek: 'CatatSaku',
      ide: 'Aplikasi web ringan offline-first untuk mencatat pemasukan dan pengeluaran harian tanpa perlu login atau koneksi server.',
      tujuan: 'Pengguna dapat mencatat transaksi baru dalam <= 3 ketukan dan melihat saldo bulan berjalan kapan saja.',
      pengguna: 'Pekerja lepas dan mahasiswa yang ingin melacak uang jajan harian secara privat di ponsel.',
      masalah: 'Aplikasi keuangan lain mewajibkan akun cloud, penuh iklan, atau lambat dibuka saat sinyal lemah.',
      kebutuhan: 'Menambah transaksi masuk/keluar dengan nominal, kategori, dan catatan\nMelihat ringkasan total masuk, keluar, dan saldo bulan ini\nFilter riwayat berdasarkan kategori dan kata kunci\nEkspor & impor cadangan data dalam format JSON',
      halaman: 'Layar Utama (Ringkasan saldo + daftar transaksi) → Modal Tambah Transaksi\nPanel Filter & Pencarian\nMenu Ekspor/Impor JSON',
      desain: 'Mobile-first, tombol tambah utama minimal 44x44px di jempol kanan bawah, dukung dark mode sistem.',
      teknologi: 'HTML, CSS, JavaScript murni, localStorage dengan try/catch, Service Worker untuk akses offline.',
      larangan: 'Jangan kirim data transaksi ke layanan analitik atau server eksternal\nJangan hilangkan konfirmasi sebelum menghapus transaksi\nJangan memakai library eksternal',
      kriteria: 'Ketika transaksi baru disimpan lalu halaman dimuat ulang, maka data tetap muncul utuh.\nKetika offline diaktifkan, maka halaman utama tetap bisa dibuka dan dipakai mencatat.\nKetika viewport diatur ke 360px, maka semua kolom nominal dan tombol rapi tanpa meluber.'
    }
  };

  /* ---------- Pustaka Template PRD ---------- */
  var TEMPLATES = [
    {
      id: 'prd-tpl-landing',
      title: 'Website Profil & Katalog Produk',
      desc: 'Situs statis untuk UMKM, portofolio jasa, atau peluncuran produk tunggal yang ringan.',
      projectType: 'website',
      data: EXAMPLES.website
    },
    {
      id: 'prd-tpl-app',
      title: 'Aplikasi Tracker Offline-First',
      desc: 'Web app interaktif dengan penyimpanan localStorage, pencarian, filter, dan ekspor JSON.',
      projectType: 'app',
      data: EXAMPLES.app
    },
    {
      id: 'prd-tpl-reels',
      title: 'Produksi Konten Reels / TikTok 40 Detik',
      desc: 'Perencanaan naskah, hook 3 detik, daftar shot, dan tata letak teks aman dari UI sosmed.',
      projectType: 'reels',
      data: EXAMPLES.reels
    },
    {
      id: 'prd-tpl-deck',
      title: 'Deck Presentasi Proposal / Investor',
      desc: 'Struktur 9 slide ringkas dengan batas kata per slide dan transparansi asumsi.',
      projectType: 'deck',
      data: EXAMPLES.deck
    }
  ];

  /* ---------- State ---------- */
  function createDefaultState() {
    return {
      projectType: 'website',
      outputLang: 'id',
      agentMode: 'chat',
      namaProyek: '',
      ide: '',
      tujuan: '',
      pengguna: '',
      masalah: '',
      kebutuhan: '',
      halaman: '',
      desain: '',
      teknologi: '',
      larangan: '',
      kriteria: ''
    };
  }

  var state = createDefaultState();
  var currentStep = 1;
  var activeTab = 'prd';
  var activePreviewTab = 'prd';
  var customOutputs = { prd: null, tasks: null };
  var editingTabs = { prd: false, tasks: false };
  var livePreviewOpen = false;

  /* ---------- Utilitas ---------- */
  function orIsi(val, lang) {
    var v = String(val == null ? '' : val).trim();
    if (v !== '') return v;
    return lang === 'en' ? '[FILL: …]' : '[ISI: …]';
  }

  function splitLines(val) {
    return String(val || '')
      .split('\n')
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l !== ''; });
  }

  function numberList(val, lang) {
    var items = splitLines(val);
    if (items.length === 0) return lang === 'en' ? '[FILL: …]' : '[ISI: …]';
    return items.map(function (l, i) { return (i + 1) + '. ' + l; }).join('\n');
  }

  function bulletList(val, lang) {
    var items = splitLines(val);
    if (items.length === 0) return lang === 'en' ? '[FILL: …]' : '[ISI: …]';
    return items.map(function (l) { return '- ' + l; }).join('\n');
  }

  /* ---------- Bangun PRD.md ---------- */
  function buildPrd(stInput) {
    var st = stInput || state;
    var cfg = PROJECT_TYPES[st.projectType] || PROJECT_TYPES.website;
    var lang = st.outputLang === 'en' ? 'en' : 'id';

    if (lang === 'en') {
      var enName = String(st.namaProyek || '').trim() || '[FILL: project name]';
      var outEn = '';
      outEn += '# PRD: ' + enName + '\n\n';
      outEn += 'Project type: **' + cfg.labelEn + '**\n\n';
      outEn += '## 1. Concept & Idea\n' + orIsi(st.ide, 'en') + '\n\n';
      outEn += '## 2. Goal\n' + orIsi(st.tujuan, 'en') + '\n\n';
      outEn += '## 3. Target Users\n' + orIsi(st.pengguna, 'en') + '\n\n';
      outEn += '## 4. Problem Statement\n' + orIsi(st.masalah, 'en') + '\n\n';
      outEn += '## 5. Core Requirements\n' + numberList(st.kebutuhan, 'en') + '\n\n';
      outEn += '## 6. ' + cfg.halamanLabelEn + '\n' + orIsi(st.halaman, 'en') + '\n\n';
      outEn += '## 7. Design & Style\n' + orIsi(st.desain, 'en') + '\n\n';
      outEn += '## 8. Tech Stack & Constraints\n' + orIsi(st.teknologi, 'en') + '\n\n';
      outEn += '## 9. Do Not Do (Strict Guardrails)\n' + bulletList(st.larangan, 'en') + '\n\n';
      outEn += '## 10. Acceptance Criteria\n' + bulletList(st.kriteria, 'en') + '\n';
      return outEn;
    }

    var nama = String(st.namaProyek || '').trim() || '[ISI: nama proyek]';
    var out = '';
    out += '# PRD: ' + nama + '\n\n';
    out += 'Jenis proyek: **' + cfg.label + '**\n\n';
    out += '## 1. Ide\n' + orIsi(st.ide, 'id') + '\n\n';
    out += '## 2. Tujuan\n' + orIsi(st.tujuan, 'id') + '\n\n';
    out += '## 3. Pengguna\n' + orIsi(st.pengguna, 'id') + '\n\n';
    out += '## 4. Masalah\n' + orIsi(st.masalah, 'id') + '\n\n';
    out += '## 5. Kebutuhan\n' + numberList(st.kebutuhan, 'id') + '\n\n';
    out += '## 6. ' + cfg.halamanLabel + '\n' + orIsi(st.halaman, 'id') + '\n\n';
    out += '## 7. Desain & Gaya\n' + orIsi(st.desain, 'id') + '\n\n';
    out += '## 8. Teknologi & Batasan\n' + orIsi(st.teknologi, 'id') + '\n\n';
    out += '## 9. Larangan\n' + bulletList(st.larangan, 'id') + '\n\n';
    out += '## 10. Kriteria Selesai\n' + bulletList(st.kriteria, 'id') + '\n';
    return out;
  }

  /* ---------- Bangun TASKS.md ---------- */
  function buildTasks(stInput) {
    var st = stInput || state;
    var cfg = PROJECT_TYPES[st.projectType] || PROJECT_TYPES.website;
    var lang = st.outputLang === 'en' ? 'en' : 'id';
    var isAgent = st.agentMode === 'agent';

    var kebutuhan = splitLines(st.kebutuhan);
    var halamanList = splitLines(st.halaman);
    var kriteriaList = splitLines(st.kriteria);
    var laranganList = splitLines(st.larangan);

    if (lang === 'en') {
      var enName = String(st.namaProyek || '').trim() || '[FILL: project name]';
      var outEn = '';
      outEn += '# TASKS: ' + enName + '\n\n';
      outEn += 'Staged workflow rules (MANDATORY):\n';
      if (isAgent) {
        outEn += '- Work strictly phase by phase in order. Verify each phase works before advancing.\n';
        outEn += '- Do not silently rewrite or discard approved files from earlier phases; log the exact reason if a patch is strictly necessary.\n';
      } else {
        outEn += '- Work one phase at a time. After completing each phase, STOP and wait for me to say "continue".\n';
        outEn += '- Do not rewrite or reprint completed files from earlier phases.\n';
        outEn += '- If an earlier file must change, explain why first and wait for approval.\n';
      }
      outEn += '- Never fabricate data or features outside the PRD. If details are missing, ask first and wait.\n\n';

      outEn += '## Phase 1 — Foundation\n';
      outEn += '- Read PRD.md completely before writing code or content.\n';
      outEn += '- Set up the base file structure matching Tech Stack & Constraints.\n';
      outEn += '- Clarify any ambiguous requirement before continuing.\n';
      outEn += isAgent
        ? '- Verify the skeleton loads cleanly with zero errors.\n\n'
        : '- Do not start features until foundation is confirmed.\n\n';

      outEn += '## Phase 2 — Core Features\n';
      if (kebutuhan.length === 0) {
        outEn += '- [FILL: core requirements list is empty]\n';
      } else {
        outEn += 'Implement these requirements one by one:\n';
        kebutuhan.forEach(function (k, i) { outEn += (i + 1) + '. ' + k + '\n'; });
      }
      outEn += '- Provide observable evidence that every requirement works.\n';
      if (!isAgent) outEn += '- Stop after Phase 2 and wait for "continue".\n';
      outEn += '\n';

      outEn += '## Phase 3 — ' + cfg.halamanLabelEn + '\n';
      if (halamanList.length === 0) {
        outEn += '- [FILL: flow/pages list is empty]\n';
      } else {
        outEn += 'Build and wire these flows:\n';
        halamanList.forEach(function (h) { outEn += '- ' + h + '\n'; });
      }
      outEn += '- Confirm navigation, empty states, and back/forward transitions work without broken links.\n';
      if (!isAgent) outEn += '- Stop after Phase 3 and wait for "continue".\n';
      outEn += '\n';

      outEn += '## Phase 4 — Polish & Verification\n';
      outEn += 'Test against Acceptance Criteria:\n';
      if (kriteriaList.length === 0) {
        outEn += '- [FILL: acceptance criteria are empty]\n';
      } else {
        kriteriaList.forEach(function (k) { outEn += '- ' + k + '\n'; });
      }
      if (laranganList.length > 0) {
        outEn += '\nVerify zero violations against Do Not Do:\n';
        laranganList.forEach(function (l) { outEn += '- ' + l + '\n'; });
      }
      outEn += '\nFix every failing check and report only verified results along with file changes.\n';
      return outEn;
    }

    var nama = String(st.namaProyek || '').trim() || '[ISI: nama proyek]';
    var out = '';
    out += '# TASKS: ' + nama + '\n\n';
    out += 'Aturan kerja bertahap (WAJIB):\n';
    if (isAgent) {
      out += '- Kerjakan berurutan dari Tahap 1 hingga 4. Uji hasil setiap tahap sebelum berlanjut ke tahap berikutnya.\n';
      out += '- Jangan mengubah atau menulis ulang file tahap sebelumnya tanpa alasan teknis yang jelas dan tercatat.\n';
    } else {
      out += '- Kerjakan per tahap. Setelah tiap tahap selesai, berhenti dan tunggu saya mengetik "lanjut".\n';
      out += '- Jangan mengubah, menulis ulang, atau mencetak ulang file dari tahap sebelumnya.\n';
      out += '- Jika satu tahap butuh perubahan file lama, sebutkan alasannya dulu dan tunggu persetujuan saya.\n';
    }
    out += '- Jangan mengarang data. Jika informasi kurang, tanyakan dulu dan tunggu jawaban.\n\n';

    out += '## Tahap 1 — Fondasi\n';
    out += '- Baca PRD.md sampai selesai sebelum menulis apa pun.\n';
    out += '- Siapkan struktur proyek dan file dasar sesuai Teknologi & Batasan.\n';
    out += '- Konfirmasi ruang lingkup jika ada yang ambigu. Jangan berasumsi.\n';
    out += isAgent
      ? '- Pastikan fondasi berjalan tanpa error sebelum masuk ke Tahap 2.\n\n'
      : '- Jangan mengerjakan fitur sebelum fondasi disetujui.\n\n';

    out += '## Tahap 2 — Fitur inti\n';
    if (kebutuhan.length === 0) {
      out += '- [ISI: daftar kebutuhan belum diisi]\n';
    } else {
      out += 'Implementasikan kebutuhan berikut satu per satu:\n';
      kebutuhan.forEach(function (k, i) { out += (i + 1) + '. ' + k + '\n'; });
    }
    out += '- Setiap kebutuhan harus punya bukti hasil yang bisa ditunjukkan.\n';
    if (!isAgent) out += '- Setelah semua kebutuhan selesai, berhenti dan tunggu "lanjut".\n';
    out += '\n';

    out += '## Tahap 3 — ' + cfg.halamanLabel + '\n';
    if (halamanList.length === 0) {
      out += '- [ISI: alur belum diisi]\n';
    } else {
      out += 'Bangun alur berikut:\n';
      halamanList.forEach(function (h) { out += '- ' + h + '\n'; });
    }
    out += '- Pastikan perpindahan antar bagian berjalan dan tidak ada tautan rusak.\n';
    if (!isAgent) out += '- Setelah selesai, berhenti dan tunggu "lanjut".\n';
    out += '\n';

    out += '## Tahap 4 — Poles & finalisasi\n';
    out += 'Uji terhadap kriteria selesai:\n';
    if (kriteriaList.length === 0) {
      out += '- [ISI: kriteria selesai belum diisi]\n';
    } else {
      kriteriaList.forEach(function (k) { out += '- ' + k + '\n'; });
    }
    if (laranganList.length > 0) {
      out += '\nPastikan larangan berikut tidak dilanggar:\n';
      laranganList.forEach(function (l) { out += '- ' + l + '\n'; });
    }
    out += '\nPerbaiki yang belum lolos, lalu serahkan hasil akhir beserta ringkasan perubahan yang terverifikasi.\n';
    return out;
  }

  /* ---------- Evaluasi Kualitas PRD (Pemeriksa Kelengkapan) ---------- */
  var FIELD_LABELS = {
    ide: 'Ide besar proyek',
    tujuan: 'Tujuan proyek',
    pengguna: 'Target pengguna',
    masalah: 'Masalah utama',
    kebutuhan: 'Daftar kebutuhan',
    kriteria: 'Kriteria selesai'
  };

  function evaluatePrdQuality(stInput) {
    var st = stInput || state;
    var items = [];

    REQUIRED.forEach(function (key) {
      var val = String(st[key] || '').trim();
      if (val === '') {
        items.push({
          type: 'bad',
          key: key,
          step: FIELD_STEP[key],
          text: 'Bagian wajib masih kosong: ' + (FIELD_LABELS[key] || key) + '.'
        });
      }
    });

    var kebutuhanLines = splitLines(st.kebutuhan);
    if (kebutuhanLines.length > 0 && kebutuhanLines.length > 10) {
      items.push({
        type: 'warn',
        key: 'kebutuhan',
        step: FIELD_STEP.kebutuhan,
        text: 'Ada ' + kebutuhanLines.length + ' kebutuhan sekaligus. Pertimbangkan membatasi versi 1 ke 3-7 inti saja.'
      });
    }

    var allText = [
      st.namaProyek, st.ide, st.tujuan, st.pengguna, st.masalah,
      st.kebutuhan, st.halaman, st.desain, st.teknologi, st.larangan, st.kriteria
    ].join(' ');

    var vagueMatches = Oreedo.findVagueWords ? Oreedo.findVagueWords(allText) : [];
    if (vagueMatches.length > 0) {
      var words = vagueMatches.map(function (m) { return '"' + m.word + '"'; }).join(', ');
      items.push({
        type: 'warn',
        text: 'Kata samar terdeteksi (' + words + '). ' + vagueMatches[0].suggestion
      });
    }

    var kriteriaVal = String(st.kriteria || '').trim();
    if (kriteriaVal !== '' && !/(ketika|saat|jika|bila|maka|when|if|then|\d)/i.test(kriteriaVal)) {
      items.push({
        type: 'warn',
        key: 'kriteria',
        step: FIELD_STEP.kriteria,
        text: 'Kriteria selesai lebih tajam jika memakai pola terukur ("Ketika …, maka …") atau angka.'
      });
    }

    return items;
  }

  /* ---------- Inisialisasi ---------- */
  function applySharedDraft(data) {
    if (!data || typeof data !== 'object') return;
    var next = Object.assign(createDefaultState(), data);
    if (!PROJECT_TYPES[next.projectType]) next.projectType = 'website';
    next.outputLang = next.outputLang === 'en' ? 'en' : 'id';
    next.agentMode = next.agentMode === 'agent' ? 'agent' : 'chat';
    state = next;
    currentStep = 1;
    invalidateAllManualEdits();
    restoreForm();
    updateProjectFields();
    updateKebutuhanPreview();
    renderStepper();
    saveDraft();
    updateLivePreview();
    goToStep(1, false, { focusHeading: false, scroll: false });
  }

  function init() {
    var wizardEl = $('#prd-wizard');
    if (!wizardEl) return;

    var fromHash = Oreedo.hash && Oreedo.hash.decodeDraft('prd');
    var saved = Oreedo.storage.get(STORAGE_KEY, null);
    var loadedFromShare = false;

    if (fromHash) {
      var next = Object.assign(createDefaultState(), fromHash);
      if (!PROJECT_TYPES[next.projectType]) next.projectType = 'website';
      next.outputLang = next.outputLang === 'en' ? 'en' : 'id';
      next.agentMode = next.agentMode === 'agent' ? 'agent' : 'chat';
      state = next;
      currentStep = 1;
      loadedFromShare = true;
      saveDraft();
    } else if (saved && typeof saved === 'object') {
      state = Object.assign(createDefaultState(), saved);
      if (!PROJECT_TYPES[state.projectType]) state.projectType = 'website';
      state.outputLang = state.outputLang === 'en' ? 'en' : 'id';
      state.agentMode = state.agentMode === 'agent' ? 'agent' : 'chat';
      var step = parseInt(saved._step, 10);
      currentStep = (step >= 1 && step <= TOTAL_STEPS) ? step : 1;
    }

    restoreForm();
    updateProjectFields();
    updateKebutuhanPreview();
    renderStepper();
    goToStep(currentStep, false, { focusHeading: false, scroll: false });
    updateLivePreview();
    wireEvents();

    $$('dialog.oreedo-dialog').forEach(function (dlg) {
      Oreedo.dialog.setup(dlg);
    });

    if (loadedFromShare) {
      Oreedo.toast('Draf PRD dari tautan bersama berhasil dimuat.');
    }
  }

  function restoreForm() {
    $$('input[name="projectType"]').forEach(function (r) {
      r.checked = (r.value === state.projectType);
    });
    $$('[data-field]').forEach(function (el) {
      var key = el.getAttribute('data-field');
      if (state[key] != null) el.value = state[key];
    });
    var agentSelect = $('#select-agent-mode');
    if (agentSelect) agentSelect.value = state.agentMode === 'agent' ? 'agent' : 'chat';
    syncLangToggle();
  }

  function syncLangToggle() {
    $$('[data-output-lang]').forEach(function (btn) {
      var active = btn.getAttribute('data-output-lang') === state.outputLang;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /* ---------- Event wiring ---------- */
  function wireEvents() {
    window.addEventListener('hashchange', function () {
      var nextData = Oreedo.hash && Oreedo.hash.decodeDraft('prd');
      if (!nextData) return;
      applySharedDraft(nextData);
      Oreedo.toast('Draf PRD dari tautan bersama berhasil dimuat.');
    });

    $$('input[name="projectType"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        state.projectType = r.value;
        invalidateAllManualEdits();
        updateProjectFields();
        renderStepper();
        saveDraft();
        updateLivePreview();
        if (currentStep === TOTAL_STEPS) renderOutput();
      });
    });

    $$('[data-output-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = btn.getAttribute('data-output-lang');
        if (!lang || lang === state.outputLang) return;
        state.outputLang = lang;
        syncLangToggle();
        invalidateAllManualEdits();
        saveDraft();
        updateLivePreview();
        if (currentStep === TOTAL_STEPS) renderOutput();
        Oreedo.toast(lang === 'en' ? 'Output diubah ke Bahasa Inggris.' : 'Output diubah ke Bahasa Indonesia.');
      });
    });

    var agentSelect = $('#select-agent-mode');
    if (agentSelect) {
      agentSelect.addEventListener('change', function () {
        state.agentMode = agentSelect.value === 'agent' ? 'agent' : 'chat';
        customOutputs.tasks = null;
        if (editingTabs.tasks) toggleEditTab('tasks', false);
        saveDraft();
        updateLivePreview();
        if (currentStep === TOTAL_STEPS) renderOutput();
      });
    }

    $$('[data-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        var key = el.getAttribute('data-field');
        state[key] = el.value;
        invalidateAllManualEdits();
        if (key === 'kebutuhan') updateKebutuhanPreview();
        renderStepper();
        saveDraft();
        updateLivePreview();
        if (currentStep === TOTAL_STEPS) renderOutput();
      });
    });

    $$('[data-next]').forEach(function (b) {
      b.addEventListener('click', function () { goToStep(currentStep + 1); });
    });
    $$('[data-prev]').forEach(function (b) {
      b.addEventListener('click', function () { goToStep(currentStep - 1); });
    });

    var btnExample = $('#btn-example');
    if (btnExample) btnExample.addEventListener('click', handleFillExample);

    var btnReset = $('#btn-reset');
    if (btnReset) btnReset.addEventListener('click', handleResetAll);

    var btnPreview = $('#btn-preview');
    if (btnPreview) btnPreview.addEventListener('click', toggleLivePreview);

    $$('[data-preview-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activePreviewTab = btn.getAttribute('data-preview-tab') === 'tasks' ? 'tasks' : 'prd';
        $$('[data-preview-tab]').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        updateLivePreview();
      });
    });

    var btnPreviewCopy = $('#btn-preview-copy');
    if (btnPreviewCopy) {
      btnPreviewCopy.addEventListener('click', function () {
        var text = activePreviewTab === 'tasks' ? buildTasks(state) : buildPrd(state);
        var label = activePreviewTab === 'tasks' ? 'TASKS.md' : 'PRD.md';
        Oreedo.copy(text).then(function (ok) {
          Oreedo.toast(ok ? 'Pratinjau ' + label + ' disalin.' : 'Gagal menyalin.');
        });
      });
    }

    var btnCopyPrd = $('#btn-copy-prd');
    if (btnCopyPrd) btnCopyPrd.addEventListener('click', function () { copyFile('prd'); });

    var btnCopyTasks = $('#btn-copy-tasks');
    if (btnCopyTasks) btnCopyTasks.addEventListener('click', function () { copyFile('tasks'); });

    var btnCopyAll = $('#btn-copy-all');
    if (btnCopyAll) btnCopyAll.addEventListener('click', copyAllWithInstruction);

    var btnDlPrd = $('#btn-download-prd');
    if (btnDlPrd) btnDlPrd.addEventListener('click', function () { downloadFile('prd'); });

    var btnDlTasks = $('#btn-download-tasks');
    if (btnDlTasks) btnDlTasks.addEventListener('click', function () { downloadFile('tasks'); });

    var btnDlAll = $('#btn-download-all');
    if (btnDlAll) btnDlAll.addEventListener('click', downloadBundle);

    /* Mode edit PRD.md & TASKS.md */
    ['prd', 'tasks'].forEach(function (which) {
      var btnEdit = $('#btn-edit-' + which);
      if (btnEdit) {
        btnEdit.addEventListener('click', function () { toggleEditTab(which); });
      }
      var btnResetEdit = $('#btn-reset-edit-' + which);
      if (btnResetEdit) {
        btnResetEdit.addEventListener('click', function () {
          customOutputs[which] = null;
          renderOutput();
          Oreedo.toast((which === 'prd' ? 'PRD.md' : 'TASKS.md') + ' dikembalikan ke otomatis.');
        });
      }
      var editor = $('#' + which + '-editor');
      if (editor) {
        editor.addEventListener('input', function () {
          customOutputs[which] = editor.value;
          updateTabMeta(which, editor.value);
        });
      }
    });

    /* Tabs aksesibel sesuai tabs.md */
    wireTabs();

    /* Modal Template */
    var btnTemplates = $('#btn-templates');
    var tplDialog = $('#templates-dialog');
    if (btnTemplates && tplDialog) {
      btnTemplates.addEventListener('click', function () {
        renderTemplatesList();
        Oreedo.dialog.open(tplDialog);
      });
    }

    /* Modal Riwayat & Ekspor */
    var btnHistory = $('#btn-history');
    var histDialog = $('#history-dialog');
    if (btnHistory && histDialog) {
      btnHistory.addEventListener('click', function () {
        renderHistoryList();
        Oreedo.dialog.open(histDialog);
      });
    }

    var btnSaveHist = $('#btn-save-history');
    if (btnSaveHist) btnSaveHist.addEventListener('click', saveToHistory);

    var btnShareLink = $('#btn-share-link');
    if (btnShareLink) btnShareLink.addEventListener('click', copyShareLink);

    var btnExportJson = $('#btn-export-json');
    if (btnExportJson) btnExportJson.addEventListener('click', exportJson);

    var inputImport = $('#input-import-json');
    if (inputImport) inputImport.addEventListener('change', importJson);
  }

  /* ---------- Tabs Aksesibel (Arrow, Home/End, hidden="until-found", beforematch) ---------- */
  function selectTab(targetName, focusTab) {
    activeTab = targetName === 'tasks' ? 'tasks' : 'prd';
    var tabs = $$('.tabs [role="tab"]');
    var panels = $$('[role="tabpanel"]');

    tabs.forEach(function (tab) {
      var selected = tab.getAttribute('data-tab') === activeTab;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
      if (selected) {
        if (focusTab) tab.focus();
        if (typeof tab.scrollIntoView === 'function') {
          try {
            tab.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
          } catch (err) { /* abaikan */ }
        }
      }
    });

    panels.forEach(function (panel) {
      var isTarget = panel.id === 'panel-' + activeTab;
      if (isTarget) {
        panel.removeAttribute('hidden');
        panel.classList.add('is-active');
      } else {
        panel.classList.remove('is-active');
        panel.hidden = 'until-found';
      }
    });
  }

  function wireTabs() {
    var tabs = $$('.tabs [role="tab"]');
    if (tabs.length === 0) return;

    tabs.forEach(function (tab, idx) {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;

      tab.addEventListener('click', function () {
        selectTab(tab.getAttribute('data-tab'), false);
      });

      tab.addEventListener('keydown', function (e) {
        var nextIdx = idx;
        if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') nextIdx = 0;
        else if (e.key === 'End') nextIdx = tabs.length - 1;
        else return;

        e.preventDefault();
        var nextTab = tabs[nextIdx];
        selectTab(nextTab.getAttribute('data-tab'), true);
      });
    });

    /* Sinkronkan pilihan tab saat pengguna mencari teks dengan Ctrl+F (beforematch) */
    $$('[role="tabpanel"]').forEach(function (panel) {
      panel.addEventListener('beforematch', function () {
        var targetName = panel.id === 'panel-tasks' ? 'tasks' : 'prd';
        selectTab(targetName, false);
      });
    });
  }

  /* ---------- Label & placeholder dinamis ---------- */
  function updateProjectFields() {
    var cfg = PROJECT_TYPES[state.projectType];
    if (!cfg) return;

    var labelEl = document.querySelector('[data-label="halaman"]');
    if (labelEl) labelEl.textContent = cfg.halamanLabel;

    var halamanEl = document.querySelector('[data-field="halaman"]');
    if (halamanEl && cfg.halamanPlaceholder) halamanEl.placeholder = cfg.halamanPlaceholder;

    var kriteriaEl = document.querySelector('[data-field="kriteria"]');
    if (kriteriaEl && cfg.kriteriaPlaceholder) kriteriaEl.placeholder = cfg.kriteriaPlaceholder;
  }

  function updateKebutuhanPreview() {
    var list = $('#kebutuhan-preview');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);

    var items = splitLines(state.kebutuhan);
    if (items.length === 0) {
      var empty = document.createElement('li');
      empty.textContent = 'Belum ada isian.';
      empty.style.color = 'var(--text-muted)';
      empty.style.fontSize = '.85rem';
      list.appendChild(empty);
      return;
    }

    items.forEach(function (text) {
      var li = document.createElement('li');
      li.textContent = text;
      li.style.fontSize = '.88rem';
      list.appendChild(li);
    });
  }

  /* ---------- Stepper Interaktif ---------- */
  function isStepComplete(n) {
    if (n === 1) return Boolean(String(state.ide || '').trim() && String(state.tujuan || '').trim());
    if (n === 2) return Boolean(String(state.pengguna || '').trim() && String(state.masalah || '').trim());
    if (n === 3) return Boolean(String(state.kebutuhan || '').trim());
    if (n === 4) return Boolean(String(state.halaman || '').trim());
    if (n === 5) return Boolean(String(state.desain || '').trim());
    if (n === 6) return Boolean(String(state.teknologi || '').trim());
    if (n === 7) return Boolean(String(state.larangan || '').trim());
    if (n === 8) return Boolean(String(state.kriteria || '').trim());
    return false;
  }

  function hasStepMissingRequired(n) {
    if (n === 1) return !String(state.ide || '').trim() || !String(state.tujuan || '').trim();
    if (n === 2) return !String(state.pengguna || '').trim() || !String(state.masalah || '').trim();
    if (n === 3) return !String(state.kebutuhan || '').trim();
    if (n === 8) return !String(state.kriteria || '').trim();
    return false;
  }

  function renderStepper() {
    var nav = $('#wizard-steps');
    if (!nav) return;

    if (nav.childElementCount === 0) {
      STEP_NAMES.forEach(function (name, idx) {
        var stepNum = idx + 1;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'step-pill';
        btn.setAttribute('data-step-btn', String(stepNum));
        btn.innerHTML =
          '<span class="step-pill-num" aria-hidden="true">' + stepNum + '</span>' +
          '<span>' + Oreedo.escapeHtml(name) + '</span>';
        btn.addEventListener('click', function () { goToStep(stepNum); });
        nav.appendChild(btn);
      });
    }

    $$('[data-step-btn]', nav).forEach(function (btn) {
      var stepNum = parseInt(btn.getAttribute('data-step-btn'), 10);
      var isCurrent = stepNum === currentStep;
      var done = isStepComplete(stepNum);
      var missing = stepNum < currentStep && hasStepMissingRequired(stepNum);

      if (isCurrent) btn.setAttribute('aria-current', 'step');
      else btn.removeAttribute('aria-current');

      btn.classList.toggle('is-done', done && !missing);
      btn.classList.toggle('has-missing', missing);
    });
  }

  /* ---------- Navigasi ---------- */
  function goToStep(n, doSave, opts) {
    if (n < 1 || n > TOTAL_STEPS) return;
    var options = opts || {};
    currentStep = n;

    $$('.step-panel').forEach(function (p) { p.classList.remove('is-active'); });
    var target = document.getElementById('panel-' + n);
    if (target) target.classList.add('is-active');

    var progressEl = $('#wizard-progress-bar');
    if (progressEl) progressEl.value = n;

    var label = $('#progress-label');
    if (label) label.textContent = 'Langkah ' + n + ' dari ' + TOTAL_STEPS;

    var nameEl = $('#progress-step');
    if (nameEl) nameEl.textContent = STEP_NAMES[n - 1] || '';

    renderStepper();

    var activePill = $('#wizard-steps [aria-current="step"]');
    if (activePill && typeof activePill.scrollIntoView === 'function') {
      try {
        activePill.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
      } catch (err) { /* abaikan */ }
    }

    if (n === TOTAL_STEPS) renderOutput();

    if (doSave !== false) saveDraft();

    if (options.focusFieldId) {
      var focusField = document.getElementById(options.focusFieldId);
      if (focusField) focusField.focus();
    } else if (options.focusHeading !== false && target) {
      var heading = target.querySelector('.step-title');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }

    if (options.scroll !== false) {
      var wizard = $('#prd-wizard');
      if (wizard) {
        var top = wizard.getBoundingClientRect().top + window.pageYOffset - 88;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }
  }

  function saveDraft() {
    var payload = Object.assign({}, state, { _step: currentStep });
    Oreedo.storage.set(STORAGE_KEY, payload);
  }

  function hasUserContent() {
    return ['namaProyek', 'ide', 'tujuan', 'pengguna', 'masalah', 'kebutuhan', 'halaman', 'desain', 'teknologi', 'larangan', 'kriteria']
      .some(function (k) { return String(state[k] || '').trim() !== ''; });
  }

  function invalidateAllManualEdits() {
    if (customOutputs.prd !== null || customOutputs.tasks !== null) {
      customOutputs.prd = null;
      customOutputs.tasks = null;
      if (editingTabs.prd) toggleEditTab('prd', false);
      if (editingTabs.tasks) toggleEditTab('tasks', false);
    }
  }

  /* ---------- Aksi toolbar ---------- */
  function applyData(data) {
    if (data.projectType && PROJECT_TYPES[data.projectType]) {
      state.projectType = data.projectType;
    }
    if (data.outputLang === 'en' || data.outputLang === 'id') {
      state.outputLang = data.outputLang;
    }
    if (data.agentMode === 'agent' || data.agentMode === 'chat') {
      state.agentMode = data.agentMode;
    }
    Object.keys(data).forEach(function (key) {
      if (key in state && key !== 'projectType' && key !== 'outputLang' && key !== 'agentMode') {
        state[key] = data[key];
      }
    });

    invalidateAllManualEdits();
    restoreForm();
    updateProjectFields();
    updateKebutuhanPreview();
    renderStepper();
    saveDraft();
    updateLivePreview();
    if (currentStep === TOTAL_STEPS) renderOutput();
  }

  function handleFillExample() {
    var cfg = PROJECT_TYPES[state.projectType] || PROJECT_TYPES.website;
    var exampleData = EXAMPLES[state.projectType] || EXAMPLES.website;

    function apply() {
      applyData(exampleData);
      Oreedo.toast('Contoh ' + cfg.label + ' terisi. Sesuaikan seperlunya.');
    }

    if (hasUserContent()) {
      Oreedo.dialog.confirm({
        title: 'Timpa isian dengan contoh ' + cfg.label + '?',
        message: 'Isian yang sudah kamu tulis akan digantikan dengan contoh proyek ' + cfg.label + '.',
        confirmLabel: 'Pakai contoh',
        cancelLabel: 'Batal'
      }).then(function (ok) {
        if (ok) apply();
      });
    } else {
      apply();
    }
  }

  function handleResetAll() {
    Oreedo.dialog.confirm({
      title: 'Mulai ulang dari awal?',
      message: 'Semua isian pada wizard PRD akan dihapus dan dikembalikan ke awal.',
      confirmLabel: 'Hapus & reset',
      cancelLabel: 'Batal',
      danger: true
    }).then(function (ok) {
      if (!ok) return;

      state = createDefaultState();
      customOutputs = { prd: null, tasks: null };
      editingTabs = { prd: false, tasks: false };
      Oreedo.storage.remove(STORAGE_KEY);

      restoreForm();
      updateProjectFields();
      updateKebutuhanPreview();
      goToStep(1, false, { focusHeading: false });
      updateLivePreview();
      if (hasWindow && window.location.hash.indexOf('#draft=') === 0 && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      Oreedo.toast('Isian sudah direset.');
    });
  }

  /* ---------- Pratinjau Live ---------- */
  function toggleLivePreview() {
    var shell = $('#wizard-shell');
    var pane = $('#live-preview-pane');
    var btn = $('#btn-preview');
    if (!shell || !pane || !btn) return;

    livePreviewOpen = !livePreviewOpen;
    shell.classList.toggle('is-preview-open', livePreviewOpen);
    pane.hidden = !livePreviewOpen;
    btn.classList.toggle('is-active', livePreviewOpen);
    btn.setAttribute('aria-pressed', livePreviewOpen ? 'true' : 'false');
    if (livePreviewOpen) updateLivePreview();
  }

  function updateLivePreview() {
    var pre = $('#live-preview-output');
    var badge = $('#live-preview-badge');
    var statsEl = $('#live-preview-stats');
    if (!pre) return;

    var text = activePreviewTab === 'tasks' ? buildTasks(state) : buildPrd(state);
    pre.textContent = text;

    var missing = countMissing(buildPrd(state));
    if (badge) {
      badge.textContent = missing === 0 ? 'PRD lengkap' : missing + ' isian kosong';
      badge.className = missing === 0 ? 'badge badge-ok' : 'badge badge-warn';
    }

    if (statsEl && Oreedo.textStats) {
      var stats = Oreedo.textStats(text);
      statsEl.textContent = stats.words + ' kata · ~' + stats.tokens + ' token';
    }
  }

  /* ---------- Render hasil & mode edit ---------- */
  function countMissing(text) {
    var matches = String(text || '').match(/\[(ISI|FILL):/g);
    return matches ? matches.length : 0;
  }

  function getFileOutput(which) {
    if (customOutputs[which] !== null) return customOutputs[which];
    return which === 'prd' ? buildPrd(state) : buildTasks(state);
  }

  function updateTabMeta(which, text) {
    var statsEl = $('#' + which + '-stats');
    if (statsEl && Oreedo.textStats) {
      var st = Oreedo.textStats(text);
      statsEl.textContent = st.words + ' kata · ' + st.chars + ' karakter · ~' + st.tokens + ' token';
    }
    var editBadge = $('#' + which + '-edit-badge');
    if (editBadge) editBadge.hidden = customOutputs[which] === null;

    var resetBtn = $('#btn-reset-edit-' + which);
    if (resetBtn) resetBtn.hidden = customOutputs[which] === null;
  }

  function toggleEditTab(which, forceState) {
    var out = $('#' + which + '-output');
    var editor = $('#' + which + '-editor');
    var btn = $('#btn-edit-' + which);
    if (!out || !editor || !btn) return;

    var nextState = typeof forceState === 'boolean' ? forceState : !editingTabs[which];
    editingTabs[which] = nextState;

    if (nextState) {
      editor.value = getFileOutput(which);
      out.hidden = true;
      editor.hidden = false;
      btn.setAttribute('aria-pressed', 'true');
      btn.textContent = 'Selesai edit';
      editor.focus();
    } else {
      customOutputs[which] = editor.value;
      out.textContent = customOutputs[which];
      editor.hidden = true;
      out.hidden = false;
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = 'Edit langsung';
      updateTabMeta(which, customOutputs[which]);
    }
  }

  function renderOutput() {
    var prd = getFileOutput('prd');
    var tasks = getFileOutput('tasks');

    var prdOut = $('#prd-output');
    var prdEditor = $('#prd-editor');
    if (prdOut) prdOut.textContent = prd;
    if (prdEditor && prdEditor.value !== prd) prdEditor.value = prd;

    var tasksOut = $('#tasks-output');
    var tasksEditor = $('#tasks-editor');
    if (tasksOut) tasksOut.textContent = tasks;
    if (tasksEditor && tasksEditor.value !== tasks) tasksEditor.value = tasks;

    var prdBadge = $('#prd-badge');
    if (prdBadge) {
      var missing = countMissing(prd);
      prdBadge.textContent = missing === 0 ? 'Lengkap' : missing + ' isian kosong';
      prdBadge.className = missing === 0 ? 'badge badge-ok' : 'badge badge-warn';
    }

    var tasksBadge = $('#tasks-badge');
    if (tasksBadge) {
      tasksBadge.textContent = '4 tahap · ' + (state.agentMode === 'agent' ? 'Agent' : 'Chat');
      tasksBadge.className = 'badge';
    }

    updateTabMeta('prd', prd);
    updateTabMeta('tasks', tasks);
    renderChecker();
  }

  function renderChecker() {
    var list = $('#checker-list');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);

    var items = evaluatePrdQuality(state);

    if (items.length === 0) {
      var li = document.createElement('li');
      li.className = 'is-good';
      li.innerHTML = '<span class="check-item-text">✅ Semua bagian wajib terisi dan lolos pemeriksaan kualitas.</span>';
      list.appendChild(li);
      return;
    }

    items.forEach(function (item) {
      var el = document.createElement('li');
      el.className = 'is-' + item.type;

      var span = document.createElement('span');
      span.className = 'check-item-text';
      span.textContent = (item.type === 'bad' ? '⚠️ ' : '💡 ') + item.text;
      el.appendChild(span);

      if (item.step) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-ghost btn-xs';
        btn.textContent = 'Lengkapi →';
        btn.addEventListener('click', function () {
          var fieldEl = document.querySelector('[data-field="' + item.key + '"]');
          goToStep(item.step, true, { focusFieldId: fieldEl ? fieldEl.id : null });
        });
        el.appendChild(btn);
      }

      list.appendChild(el);
    });
  }

  /* ---------- Salin & unduh ---------- */
  function copyFile(which) {
    var text = getFileOutput(which);
    var label = which === 'prd' ? 'PRD.md' : 'TASKS.md';
    Oreedo.copy(text).then(function (ok) {
      Oreedo.toast(ok ? label + ' disalin ke clipboard.' : 'Gagal menyalin.');
    });
  }

  function downloadFile(which) {
    var text = getFileOutput(which);
    var filename = which === 'prd' ? 'PRD.md' : 'TASKS.md';
    var ok = Oreedo.download(filename, text);
    Oreedo.toast(ok ? filename + ' diunduh.' : 'Gagal mengunduh.');
  }

  function downloadBundle() {
    var prd = getFileOutput('prd');
    var tasks = getFileOutput('tasks');
    var rawName = String(state.namaProyek || 'proyek').trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'proyek';
    var combined =
      '<!-- Bundel dokumen proyek dari Oreedo -->\n\n' +
      prd + '\n\n---\n\n' + tasks;
    var filename = rawName + '-prd-dan-tasks.md';
    var ok = Oreedo.download(filename, combined);
    Oreedo.toast(ok ? filename + ' diunduh.' : 'Gagal mengunduh.');
  }

  function copyAllWithInstruction() {
    var prd = getFileOutput('prd');
    var tasks = getFileOutput('tasks');
    var isEn = state.outputLang === 'en';
    var isAgent = state.agentMode === 'agent';

    var instruction;
    if (isEn) {
      instruction = isAgent
        ? 'You are executing this project step-by-step based on PRD.md and TASKS.md below.\n\nWork sequentially from Phase 1 through Phase 4. Verify each phase works cleanly before moving to the next, avoid inventing unrequested facts, and report concise verified results after finishing.'
        : 'You are an assistant building this project based on PRD.md and TASKS.md below.\n\nStart at Phase 1. After finishing each phase, STOP and wait for me to say "continue". Do not start the next phase until I approve. Do not invent missing details; ask first if anything is unclear.';
    } else {
      instruction = isAgent
        ? 'Kamu adalah asisten pengembang yang mengerjakan proyek ini bertahap berdasarkan PRD.md dan TASKS.md di bawah.\n\nKerjakan berurutan dari Tahap 1 hingga 4, verifikasi bahwa setiap tahap berjalan bersih tanpa error sebelum lanjut, jangan mengarang fakta di luar PRD, dan laporkan hasil terverifikasi setelah selesai.'
        : 'Kamu adalah asisten yang akan mengerjakan proyek ini berdasarkan PRD dan daftar tugas di bawah.\n\nMulai dari Tahap 1. Setelah tiap tahap selesai, berhenti dan tunggu saya mengetik "lanjut". Jangan mengerjakan tahap berikutnya sebelum saya izinkan. Jangan mengarang data yang tidak ada di PRD. Jika ada informasi yang kurang, tanyakan dulu.';
    }

    var combined =
      instruction + '\n\n' +
      '=== PRD.md ===\n' + prd + '\n\n' +
      '=== TASKS.md ===\n' + tasks;

    Oreedo.copy(combined).then(function (ok) {
      Oreedo.toast(ok ? 'Semua berkas + perintah AI disalin.' : 'Gagal menyalin.');
    });
  }

  /* ---------- Modal Template ---------- */
  function renderTemplatesList() {
    var list = $('#templates-list');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);

    TEMPLATES.forEach(function (tpl) {
      var li = document.createElement('li');
      li.className = 'dialog-item';
      var cfg = PROJECT_TYPES[tpl.projectType] || { label: tpl.projectType };

      li.innerHTML =
        '<div class="dialog-item-head">' +
          '<h3 class="dialog-item-title">' + Oreedo.escapeHtml(tpl.title) + '</h3>' +
          '<span class="badge">' + Oreedo.escapeHtml(cfg.label) + '</span>' +
        '</div>' +
        '<p class="hint mb-0">' + Oreedo.escapeHtml(tpl.desc) + '</p>' +
        '<div class="btn-group">' +
          '<button type="button" class="btn btn-primary btn-xs">Pakai template</button>' +
        '</div>';

      li.querySelector('button').addEventListener('click', function () {
        var dlg = $('#templates-dialog');
        if (hasUserContent()) {
          Oreedo.dialog.close(dlg, 'cancel').then(function () {
            return Oreedo.dialog.confirm({
              title: 'Gunakan template "' + tpl.title + '"?',
              message: 'Isian PRD yang saat ini ada akan diganti dengan template ini.',
              confirmLabel: 'Pakai template',
              cancelLabel: 'Batal'
            });
          }).then(function (ok) {
            if (ok) {
              applyData(tpl.data);
              Oreedo.toast('Template PRD "' + tpl.title + '" diterapkan.');
            }
          });
        } else {
          applyData(tpl.data);
          Oreedo.dialog.close(dlg, 'selected').then(function () {
            Oreedo.toast('Template PRD "' + tpl.title + '" diterapkan.');
          });
        }
      });

      list.appendChild(li);
    });
  }

  /* ---------- Riwayat, Ekspor/Impor & Tautan Berbagi ---------- */
  function readHistory() {
    var arr = Oreedo.storage.get(HISTORY_KEY, []);
    return Array.isArray(arr) ? arr : [];
  }

  function writeHistory(arr) {
    Oreedo.storage.set(HISTORY_KEY, arr.slice(0, MAX_HISTORY));
  }

  function suggestDraftTitle() {
    var nama = String(state.namaProyek || '').trim();
    if (nama) return nama;
    var ide = String(state.ide || '').trim();
    if (ide) return ide.length > 48 ? ide.slice(0, 46) + '…' : ide;
    var cfg = PROJECT_TYPES[state.projectType] || { label: 'Proyek' };
    return 'PRD ' + cfg.label;
  }

  function saveToHistory() {
    var titleInput = $('#history-title-input');
    var customTitle = titleInput ? titleInput.value.trim() : '';
    var title = customTitle || suggestDraftTitle();

    var list = readHistory();
    list.unshift({
      id: 'prd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: title,
      updatedAt: new Date().toISOString(),
      state: Object.assign({}, state)
    });
    writeHistory(list);
    if (titleInput) titleInput.value = '';
    renderHistoryList();
    Oreedo.toast('Draf PRD tersimpan ke riwayat lokal.');
  }

  function renderHistoryList() {
    var listEl = $('#history-list');
    var emptyEl = $('#history-empty');
    var titleInput = $('#history-title-input');
    if (titleInput && !titleInput.placeholder) {
      titleInput.placeholder = suggestDraftTitle();
    }
    if (!listEl) return;

    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
    var items = readHistory();

    if (emptyEl) emptyEl.hidden = items.length > 0;
    if (items.length === 0) return;

    items.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'dialog-item';
      var cfg = PROJECT_TYPES[item.state && item.state.projectType] || { label: 'PRD' };
      var dateStr = '';
      try {
        dateStr = new Date(item.updatedAt).toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
      } catch (err) {
        dateStr = item.updatedAt || '';
      }

      li.innerHTML =
        '<div class="dialog-item-head">' +
          '<h3 class="dialog-item-title">' + Oreedo.escapeHtml(item.title) + '</h3>' +
          '<span class="badge">' + Oreedo.escapeHtml(cfg.label) + '</span>' +
        '</div>' +
        '<span class="dialog-item-meta">Disimpan: ' + Oreedo.escapeHtml(dateStr) + '</span>' +
        '<div class="btn-group">' +
          '<button type="button" class="btn btn-primary btn-xs" data-act="load">Buka</button>' +
          '<button type="button" class="btn btn-secondary btn-xs" data-act="dup">Duplikat</button>' +
          '<button type="button" class="btn btn-ghost btn-xs" data-act="del">Hapus</button>' +
        '</div>';

      li.querySelector('[data-act="load"]').addEventListener('click', function () {
        var dlg = $('#history-dialog');
        applyData(item.state || createDefaultState());
        Oreedo.dialog.close(dlg, 'loaded').then(function () {
          Oreedo.toast('Draf PRD "' + item.title + '" dimuat.');
        });
      });

      li.querySelector('[data-act="dup"]').addEventListener('click', function () {
        var arr = readHistory();
        arr.unshift({
          id: 'prd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          title: item.title + ' (salinan)',
          updatedAt: new Date().toISOString(),
          state: Object.assign({}, item.state)
        });
        writeHistory(arr);
        renderHistoryList();
      });

      li.querySelector('[data-act="del"]').addEventListener('click', function () {
        var arr = readHistory().filter(function (x) { return x.id !== item.id; });
        writeHistory(arr);
        renderHistoryList();
      });

      listEl.appendChild(li);
    });
  }

  function copyShareLink() {
    if (!Oreedo.hash) return;
    var url = Oreedo.hash.buildShareUrl('prd', state);
    var dlg = $('#history-dialog');
    Oreedo.copy(url).then(function (ok) {
      Oreedo.dialog.close(dlg, 'shared').then(function () {
        if (!ok) {
          Oreedo.toast('Gagal menyalin tautan draf.');
        } else if (url.length > 4000) {
          Oreedo.toast('Tautan disalin (panjang: ' + url.length + ' karakter — gunakan Ekspor JSON bila terpotong).');
        } else {
          Oreedo.toast('Tautan draf PRD siap bagikan disalin.');
        }
      });
    });
  }

  function exportJson() {
    var payload = JSON.stringify({
      app: 'Oreedo',
      type: 'prd',
      version: 1,
      exportedAt: new Date().toISOString(),
      state: state
    }, null, 2);
    var ok = Oreedo.download('oreedo-prd-draf.json', payload, 'application/json;charset=utf-8');
    if (ok) Oreedo.toast('Draf diekspor ke oreedo-prd-draf.json.');
    else Oreedo.toast('Gagal mengekspor JSON.');
  }

  function importJson(e) {
    var file = e.target && e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result || ''));
        var imported = (parsed && parsed.type === 'prd' && parsed.state) ? parsed.state : parsed;
        if (!imported || typeof imported !== 'object' || (!('ide' in imported) && !('projectType' in imported))) {
          throw new Error('Format JSON tidak dikenali');
        }
        applyData(Object.assign(createDefaultState(), imported));
        var dlg = $('#history-dialog');
        Oreedo.dialog.close(dlg, 'imported').then(function () {
          Oreedo.toast('Draf PRD JSON berhasil diimpor.');
        });
      } catch (err) {
        Oreedo.toast('File JSON tidak valid untuk PRD Oreedo.');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  /* ---------- Boot & Ekspor Test ---------- */
  if (hasWindow) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      PROJECT_TYPES: PROJECT_TYPES,
      EXAMPLES: EXAMPLES,
      TEMPLATES: TEMPLATES,
      REQUIRED: REQUIRED,
      createDefaultState: createDefaultState,
      buildPrd: buildPrd,
      buildTasks: buildTasks,
      evaluatePrdQuality: evaluatePrdQuality
    };
  }
})(this);