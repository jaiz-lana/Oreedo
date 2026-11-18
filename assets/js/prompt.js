/* =========================================================
   Oreedo — assets/js/prompt.js
   Wizard pembuat prompt: stepper interaktif, pratinjau live,
   mode edit, template siap pakai, riwayat & impor/ekspor,
   dukungan output ID/EN, serta pemeriksaan kualitas lokal.
   ========================================================= */
(function (root) {
  'use strict';

  var hasWindow = typeof window !== 'undefined' && typeof document !== 'undefined';
  var Oreedo = hasWindow
    ? window.Oreedo
    : (typeof require === 'function' ? require('./common.js') : {});

  var $ = Oreedo.$;
  var $$ = Oreedo.$$;

  var STORAGE_KEY = 'prompt-draft';
  var HISTORY_KEY = 'prompt-history';
  var TOTAL_STEPS = 6;
  var MAX_HISTORY = 30;

  /* ---------- Skema per jenis tugas ---------- */
  var TASK_TYPES = {
    kode: {
      label: 'Kode/Web',
      peran: 'Kamu adalah developer web berpengalaman yang menulis kode rapi, aksesibel, mudah dirawat, dan siap produksi.',
      peranEn: 'You are an experienced web developer who writes clean, accessible, maintainable, production-ready code.',
      fields: {
        tujuan:   { label: 'Tujuan kode/proyek',       placeholder: 'Contoh: Membuat halaman profil pengguna dengan filter dan pencarian.' },
        hasil:    { label: 'Hasil akhir',              placeholder: 'Contoh: Satu file HTML+CSS+JS mandiri yang langsung bisa dibuka di browser.' },
        konteks:  { label: 'Konteks & audiens',        placeholder: 'Siapa yang memakai, di lingkungan apa, level teknisnya bagaimana.' },
        bahan:    { label: 'Bahan yang dimiliki',      placeholder: 'Desain, aset, dokumentasi API, referensi kode, screenshot, dll.' },
        langkah:  { label: 'Langkah kerja',            placeholder: '1. Susun struktur HTML\n2. Tulis CSS mobile-first\n3. Tambah interaksi dengan JS murni' },
        batasan:  { label: 'Batasan',                  placeholder: 'Satu per baris, maksimal 5.\nContoh:\ntanpa framework\nmobile-first' },
        format:   { label: 'Format output',            placeholder: 'Contoh: satu file HTML lengkap, atau Markdown + blok kode.' },
        contoh:   { label: 'Contoh hasil (opsional)',  placeholder: 'Tempel contoh hasil yang kamu suka (jika ada).' },
        kriteria: { label: 'Kriteria selesai',         placeholder: 'Ketika file dibuka di browser 360px, maka tidak ada scroll horizontal.' }
      },
      contohData: {
        tujuan: 'Membuat halaman profil pengguna dengan filter dan pencarian.',
        hasil: 'Satu file HTML+CSS+JS mandiri yang langsung bisa dibuka di browser.',
        konteks: 'Untuk tim internal yang membagikan profil anggota. Pengguna paham HTML dasar, tidak pakai framework.',
        bahan: 'Sketsa profil di Figma, daftar 20 anggota contoh, logo SVG brand.',
        langkah: '1. Susun struktur HTML semantik\n2. Tulis CSS mobile-first\n3. Tambah pencarian dan filter dengan JS murni',
        batasan: 'Tanpa framework\nMobile-first 360px\nTanpa dependencies eksternal',
        format: 'Satu file HTML lengkap, dengan komentar singkat di bagian penting.',
        contoh: '',
        kriteria: 'Ketika dibuka di 360px, maka tidak ada scroll horizontal.\nKetika kolom pencarian dikosongkan, maka semua kartu tampil kembali.'
      }
    },

    tulisan: {
      label: 'Tulisan',
      peran: 'Kamu adalah penulis profesional yang menulis dengan jelas, hangat, terstruktur, dan sesuai audiens.',
      peranEn: 'You are a professional writer who writes clearly, thoughtfully, and matches the target audience and tone.',
      fields: {
        tujuan:   { label: 'Tujuan tulisan',           placeholder: 'Contoh: Menulis artikel 800 kata tentang kebiasaan membaca.' },
        hasil:    { label: 'Hasil akhir',              placeholder: 'Contoh: Artikel 800 kata dalam Markdown dengan 3 subjudul.' },
        konteks:  { label: 'Konteks & audiens',        placeholder: 'Siapa pembacanya, di mana dipublikasikan, nada yang diinginkan.' },
        bahan:    { label: 'Bahan yang dimiliki',      placeholder: 'Riset, kutipan, catatan, referensi, dsb.' },
        langkah:  { label: 'Langkah kerja',            placeholder: '1. Susun kerangka\n2. Isi tiap subjudul\n3. Tutup dengan ringkasan' },
        batasan:  { label: 'Batasan',                  placeholder: 'Satu per baris, maksimal 5.\nContoh:\n800 kata\ntanpa jargon' },
        format:   { label: 'Format output',            placeholder: 'Contoh: Markdown dengan heading level 2 dan paragraf pendek.' },
        contoh:   { label: 'Contoh hasil (opsional)',  placeholder: 'Tempel contoh tulisan yang kamu suka.' },
        kriteria: { label: 'Kriteria selesai',         placeholder: 'Ketika dibaca dalam 3 menit, maka pembaca paham intinya.' }
      },
      contohData: {
        tujuan: 'Menulis artikel 800 kata tentang kebiasaan membaca untuk pemula.',
        hasil: 'Artikel 800 kata dalam Markdown dengan 3 subjudul dan penutup.',
        konteks: 'Untuk pembaca usia 20-30 tahun yang ingin mulai membaca rutin. Nada santai, tidak menggurui.',
        bahan: 'Catatan pribadi: 5 kebiasaan yang berhasil. 2 sumber riset tentang membaca.',
        langkah: '1. Susun kerangka 3 subjudul\n2. Isi tiap subjudul 200-250 kata\n3. Tutup dengan ajakan kecil',
        batasan: 'Maksimal 800 kata\nTanpa jargon akademik\nPakai contoh konkret tiap bagian',
        format: 'Markdown dengan heading level 2 dan paragraf pendek.',
        contoh: '',
        kriteria: 'Ketika dibaca dalam 3 menit, maka pembaca paham inti dan punya satu langkah untuk dicoba.\nKetika artikel selesai, maka tiap subjudul punya satu contoh konkret.'
      }
    },

    riset: {
      label: 'Riset/Analisis',
      peran: 'Kamu adalah analis riset yang teliti, objektif, dan selalu membedakan fakta dari asumsi.',
      peranEn: 'You are a thorough research analyst who stays objective and explicitly separates verified facts from assumptions.',
      fields: {
        tujuan:   { label: 'Tujuan riset/analisis',    placeholder: 'Contoh: Membandingkan 3 alat manajemen tugas untuk tim kecil.' },
        hasil:    { label: 'Hasil akhir',              placeholder: 'Contoh: Tabel perbandingan + rekomendasi 1 paragraf.' },
        konteks:  { label: 'Konteks & audiens',        placeholder: 'Siapa yang akan membaca, keputusan apa yang akan diambil.' },
        bahan:    { label: 'Bahan yang dimiliki',      placeholder: 'Data, artikel, dokumen, observasi, dsb.' },
        langkah:  { label: 'Langkah kerja',            placeholder: '1. Tentukan kriteria\n2. Nilai tiap opsi\n3. Simpulkan' },
        batasan:  { label: 'Batasan',                  placeholder: 'Satu per baris, maksimal 5.\nContoh:\n5 kriteria\nharga publik saja' },
        format:   { label: 'Format output',            placeholder: 'Contoh: tabel Markdown + ringkasan.' },
        contoh:   { label: 'Contoh hasil (opsional)',  placeholder: 'Tempel contoh analisis yang kamu suka.' },
        kriteria: { label: 'Kriteria selesai',         placeholder: 'Ketika tabel selesai, maka tiap baris punya skor dan alasan.' }
      },
      contohData: {
        tujuan: 'Membandingkan 3 alat manajemen tugas untuk tim kecil (5 orang).',
        hasil: 'Tabel perbandingan + rekomendasi 1 paragraf.',
        konteks: 'Untuk founder yang akan memilih alat minggu depan. Budget terbatas, tidak butuh fitur enterprise.',
        bahan: 'Daftar fitur dari situs resmi tiap alat, 2 ulasan independen, harga publik.',
        langkah: '1. Tentukan 5 kriteria\n2. Nilai tiap alat per kriteria (1-5)\n3. Simpulkan pilihan utama dan cadangan',
        batasan: '5 kriteria tetap\nHanya pakai harga publik\nCantumkan asumsi secara eksplisit',
        format: 'Tabel Markdown 5 kolom + ringkasan 1 paragraf.',
        contoh: '',
        kriteria: 'Ketika tabel selesai, maka tiap alat punya skor dan alasan singkat.\nKetika rekomendasi ditulis, maka ada 1 pilihan utama dan 1 cadangan.'
      }
    },

    gambar: {
      label: 'Gambar',
      peran: 'Kamu adalah perancang visual yang peka komposisi, pencahayaan, warna, dan rasio bidang gambar.',
      peranEn: 'You are a visual designer with strong control over subject framing, lighting, palette, and aspect ratio.',
      fields: {
        tujuan:   { label: 'Subjek & tujuan gambar',    placeholder: 'Contoh: Ilustrasi cover artikel tentang pagi yang tenang di meja kerja.' },
        hasil:    { label: 'Hasil akhir & rasio',       placeholder: 'Contoh: 1 prompt gambar rasio 16:9, gaya flat vector, palet hijau-krem.' },
        konteks:  { label: 'Konteks & penempatan',      placeholder: 'Di mana gambar dipakai, ukuran tampil, dan siapa yang melihat.' },
        bahan:    { label: 'Referensi & elemen wajib',  placeholder: 'Referensi visual, brand guideline, objek kunci yang wajib muncul.' },
        langkah:  { label: 'Arahan komposisi & gaya',   placeholder: 'Subjek di sepertiga kanan, pencahayaan pagi hangat, ruang kosong di kiri untuk judul.' },
        batasan:  { label: 'Hindari / batasan visual',  placeholder: 'Satu per baris, maksimal 5.\nContoh:\ntanpa teks di gambar\ntanpa watermark' },
        format:   { label: 'Format prompt gambar',      placeholder: 'Contoh: 1 paragraf deskriptif bahasa Inggris + parameter negatif terpisah.' },
        contoh:   { label: 'Contoh gaya (opsional)',   placeholder: 'Tempel prompt gambar referensi jika ada.' },
        kriteria: { label: 'Kriteria visual selesai',   placeholder: 'Ketika gambar dihasilkan, maka subjek utama terlihat jelas di sepertiga kanan.' }
      },
      contohData: {
        tujuan: 'Ilustrasi cover artikel tentang pagi yang tenang di ruang kerja rumahan.',
        hasil: 'Prompt gambar rasio 16:9, gaya editorial flat, palet hijau-krem.',
        konteks: 'Untuk header artikel blog, dilihat di desktop dan layar ponsel 360px.',
        bahan: 'Mood board: daun tanaman hias, cangkir keramik, jendela kayu, cahaya pagi lembut.',
        langkah: 'Subjek meja kerja di sepertiga kanan, ruang lega di kiri agar mudah dibaca, sudut pandang sejajar mata, cahaya hangat dari jendela.',
        batasan: 'Rasio 16:9\nGaya flat editorial minimalis\nTanpa teks atau huruf\nTanpa watermark atau tangan berlebih',
        format: 'Satu prompt gambar utama siap tempel (bahasa Inggris) + daftar negative prompt.',
        contoh: '',
        kriteria: 'Ketika gambar dihasilkan, maka subjek utama ada di sepertiga kanan dan area kiri cukup lega.\nKetika dipotong ke kotak 1:1 di feed, maka titik fokus tetap utuh.'
      }
    }
  };

  /* ---------- Pustaka Template Siap Pakai ---------- */
  var TEMPLATES = [
    {
      id: 'tpl-landing-umkm',
      title: 'Landing Page Produk UMKM',
      desc: 'Halaman promosi satu produk lengkap dengan testimoni, daftar harga, dan tombol pesan WhatsApp.',
      taskType: 'kode',
      aiTarget: 'claude',
      data: {
        tujuan: 'Membangun landing page satu halaman untuk mempromosikan kopi sangrai kemasan lokal dan mengarahkan pesanan ke WhatsApp.',
        hasil: 'Satu halaman HTML+CSS+JS responsif (hero, 3 keunggulan, daftar varian harga, FAQ singkat, tombol CTA WhatsApp).',
        konteks: 'Pengunjung datang dari link bio Instagram di ponsel. Kecepatan akses dan keterbacaan harga adalah prioritas.',
        bahan: '3 varian kemasan (200g, 500g, 1kg), palet warna hijau-krem, nomor WhatsApp tujuan.',
        langkah: '1. Susun HTML semantik per bagian\n2. Terapkan layout mobile-first dengan kontras teks minimal 4.5:1\n3. Tambahkan kalkulator estimasi harga per varian',
        batasan: 'Tanpa framework CSS/JS\nNol scroll horizontal di 360px\nSemua aset pakai SVG atau placeholder bersih',
        format: 'File HTML mandiri lengkap dengan CSS tersemat dan komentar seperlunya.',
        contoh: '',
        kriteria: 'Ketika dibuka di layar 360px, maka semua teks terbaca tanpa zoom dan tombol pesan selalu mudah ditekan.\nKetika pengguna memilih berat kemasan, maka total harga langsung terbarui.'
      }
    },
    {
      id: 'tpl-debug-bug',
      title: 'Audit & Perbaikan Bug Kode',
      desc: 'Mencari akar masalah pada cuplikan kode dan memperbaikinya tanpa merusak bagian lain.',
      taskType: 'kode',
      aiTarget: 'claude',
      data: {
        tujuan: 'Mengidentifikasi penyebab bug dari cuplikan kode berikut dan memberikan perbaikan minimal yang tepat sasaran.',
        hasil: 'Penjelasan akar masalah (maksimal 5 kalimat) + kode hasil perbaikan + 2 kasus uji verifikasi.',
        konteks: 'Kode berjalan di browser modern tanpa build step. Perubahan tidak boleh mematahkan API publik yang sudah dipakai halaman lain.',
        bahan: '[Tempel pesan error browser dan cuplikan kode yang bermasalah di sini]',
        langkah: '1. Telusuri alur data dan kondisi tepi\n2. Jelaskan penyebab pasti error\n3. Terapkan patch seminimal mungkin\n4. Sertakan cara menguji bahwa bug tidak terulang',
        batasan: 'Jangan ubah bagian yang tidak terkait bug\nJangan tambah library baru\nJelaskan setiap asumsi jika ada informasi kurang',
        format: 'Ringkasan penyebab + diff/kode lengkap fungsi terkait + checklist uji.',
        contoh: '',
        kriteria: 'Ketika input kosong atau karakter khusus diberikan, maka tidak muncul error di konsol.\nKetika fungsi dijalankan ulang dengan data normal, maka perilaku lama tetap utuh.'
      }
    },
    {
      id: 'tpl-artikel-edukasi',
      title: 'Artikel Blog Edukatif 800 Kata',
      desc: 'Struktur artikel ringkas yang enak dibaca di ponsel dan langsung memberi langkah praktis.',
      taskType: 'tulisan',
      aiTarget: 'chatgpt',
      data: {
        tujuan: 'Menulis artikel panduan praktis sepanjang 750-850 kata tentang manajemen catatan kerja harian tanpa aplikasi rumit.',
        hasil: 'Satu artikel Markdown siap terbit dengan judul menarik, pembuka 2 paragraf, 3 subjudul inti, dan ringkasan aksi.',
        konteks: 'Untuk pekerja remote pemula yang merasa kewalahan oleh terlalu banyak alat produktivitas. Nada hangat, praktis, non-akademik.',
        bahan: 'Metode catatan 3 bagian: Tugas Hari Ini, Catatan Cepat, dan Arsip Jumat.',
        langkah: '1. Buat 3 opsi judul lalu pilih yang paling lugas\n2. Tulis pembuka berbasis masalah sehari-hari\n3. Jelaskan 3 bagian metode dengan satu contoh masing-masing\n4. Akhiri dengan daftar cek 3 menit',
        batasan: 'Panjang 750-850 kata\nMaksimal 3 kalimat per paragraf\nHindari istilah klise pemasaran',
        format: 'Markdown dengan heading H1 untuk judul utama dan H2 per subjudul.',
        contoh: '',
        kriteria: 'Ketika dibaca sekilas judul dan subjudulnya, maka pembaca langsung tahu isi tiap bagian.\nKetika selesai membaca, maka pembaca tahu langkah 5 menit yang bisa langsung dicoba hari ini.'
      }
    },
    {
      id: 'tpl-utas-sosmed',
      title: 'Utas / Skrip Konten Singkat',
      desc: 'Rangkaian 6 poin padat untuk utas X/Threads atau slide carousel Instagram.',
      taskType: 'tulisan',
      aiTarget: 'deepseek',
      data: {
        tujuan: 'Menyusun 6 bagian konten singkat untuk menjelaskan kesalahan umum saat menulis prompt AI beserta cara memperbaikinya.',
        hasil: '6 bagian berurutan (1 hook, 4 poin inti sebelum-sesudah, 1 penutup CTA simpan).',
        konteks: 'Untuk audiens kreator dan pelajar di platform media sosial, dibaca sambil gulir cepat.',
        bahan: 'Contoh prompt samar ("buatkan website bagus") vs prompt jelas (punya ukuran, batasan, kriteria).',
        langkah: '1. Tulis kalimat pembuka yang langsung memancing rasa penasaran\n2. Untuk 4 poin inti, tampilkan perbandingan Salah vs Benar\n3. Tutup dengan ajakan menyimpan',
        batasan: 'Maksimal 280 karakter per bagian\nGunakan bahasa Indonesia sehari-hari\nJangan pakai emoji berlebihan (maks 1 per poin)',
        format: 'Daftar bernomor 1 sampai 6 siap salin.',
        contoh: '',
        kriteria: 'Ketika dibaca per poin, maka tidak ada poin yang terpotong batas 280 karakter.\nKetika pembaca melihat perbandingan Salah vs Benar, maka bedanya langsung terlihat dalam 5 detik.'
      }
    },
    {
      id: 'tpl-matriks-riset',
      title: 'Matriks Perbandingan Alat/Vendor',
      desc: 'Evaluasi 3-4 opsi secara objektif lengkap dengan skor terukur dan rekomendasi akhir.',
      taskType: 'riset',
      aiTarget: 'chatgpt',
      data: {
        tujuan: 'Membandingkan 3 layanan hosting statis gratis untuk aplikasi web tanpa backend.',
        hasil: 'Tabel perbandingan berdasarkan 5 kriteria + rekomendasi pilihan utama dan cadangan.',
        konteks: 'Untuk pengembang solo yang butuh deploy cepat, dukungan HTTPS custom domain, dan kuota bulanan yang aman untuk proyek portofolio.',
        bahan: 'Kandidat: GitHub Pages, Cloudflare Pages, Vercel (tier gratis).',
        langkah: '1. Susun tabel evaluasi 5 kriteria\n2. Cantumkan batas kuota resmi tiap layanan\n3. Tandai batasan lisensi atau komersial jika ada\n4. Beri rekomendasi akhir sesuai skenario',
        batasan: 'Gunakan informasi faktual yang terverifikasi\nTandai jika data perlu dicek ulang tanggal terbarunya\nTanpa bahasa promosi',
        format: 'Tabel Markdown + 1 paragraf rekomendasi + daftar catatan penting.',
        contoh: '',
        kriteria: 'Ketika tabel dibaca, maka setiap sel memuat angka atau status spesifik.\nKetika ada fakta yang belum pasti tanggalnya, maka diberi catatan [perlu verifikasi].'
      }
    },
    {
      id: 'tpl-cover-visual',
      title: 'Ilustrasi Cover Editorial',
      desc: 'Prompt gambar terarah dengan rasio, arah cahaya, ruang judul, dan negative constraint jelas.',
      taskType: 'gambar',
      aiTarget: 'chatgpt',
      data: {
        tujuan: 'Merancang prompt gambar untuk ilustrasi cover artikel teknologi ramah lingkungan di majalah digital.',
        hasil: 'Satu prompt gambar rasio 16:9 dalam bahasa Inggris dengan gaya flat editorial dan palet hijau sage-krem.',
        konteks: 'Ditampilkan sebagai banner artikel utama dengan judul putih/hijau tua menempel di sisi kiri gambar.',
        bahan: 'Elemen utama: laptop sederhana, tunas daun hijau di meja kayu, secangkir teh hangat, jendela berbias cahaya pagi.',
        langkah: 'Letakkan objek utama di sepertiga kanan frame, jaga dua pertiga kiri tetap bersih/tenang sebagai ruang teks, gunakan bayangan lembut tanpa garis tepi tebal.',
        batasan: 'Rasio 16:9\nTanpa teks atau angka tertulis\nMaksimal 4 warna utama\nTanpa gaya fotorealistik',
        format: 'Prompt utama bahasa Inggris (maksimal 90 kata) + baris Negative Prompt terpisah.',
        contoh: '',
        kriteria: 'Ketika dipakai untuk membuat gambar, maka sisi kiri cukup kosong untuk keterbacaan judul.\nKetika dilihat pada ukuran thumbnail kecil, maka siluet tunas dan laptop masih terbaca jelas.'
      }
    }
  ];

  /* ---------- Pemetaan field ke langkah wizard ---------- */
  var FIELD_STEP = {
    taskType: 1,
    aiTarget: 1,
    tujuan: 2,
    hasil: 2,
    konteks: 3,
    bahan: 3,
    langkah: 4,
    batasan: 4,
    format: 5,
    contoh: 5,
    kriteria: 5
  };

  var REQUIRED = ['tujuan', 'hasil', 'format', 'kriteria'];

  var AI_LABELS = {
    claude:   'Claude · tag XML',
    chatgpt:  'ChatGPT / Gemini · Markdown',
    deepseek: 'DeepSeek / GLM · pendek & eksplisit'
  };

  var STEP_NAMES = [
    'Jenis tugas', 'Tujuan & hasil', 'Konteks & bahan',
    'Langkah & batasan', 'Format & kriteria', 'Hasil prompt'
  ];

  /* ---------- State ---------- */
  function createDefaultState() {
    return {
      taskType: 'kode',
      aiTarget: 'claude',
      outputLang: 'id',
      tujuan: '',
      hasil: '',
      konteks: '',
      bahan: '',
      langkah: '',
      batasan: '',
      format: '',
      contoh: '',
      kriteria: ''
    };
  }

  var state = createDefaultState();
  var currentStep = 1;
  var customOutput = null;
  var isEditingOutput = false;
  var livePreviewOpen = false;
  var activeTemplateFilter = 'all';

  /* ---------- Utilitas pembersihan ---------- */
  function orIsi(val, lang) {
    var v = String(val == null ? '' : val).trim();
    if (v !== '') return v;
    return lang === 'en' ? '[FILL: …]' : '[ISI: …]';
  }

  function buildBatasan(val, lang) {
    var lines = String(val || '')
      .split('\n')
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l !== ''; })
      .slice(0, 5);

    if (lines.length === 0) return lang === 'en' ? '[FILL: …]' : '[ISI: …]';
    return lines.map(function (l) { return '- ' + l; }).join('\n');
  }

  /* ---------- Pembangun prompt ---------- */
  function buildPrompt(stInput) {
    var st = stInput || state;
    var schema = TASK_TYPES[st.taskType] || TASK_TYPES.kode;
    var lang = st.outputLang === 'en' ? 'en' : 'id';
    var isImage = st.taskType === 'gambar';

    var peran = lang === 'en' ? schema.peranEn : schema.peran;
    var jikaKurang = lang === 'en'
      ? 'If any required information is missing or unclear, ask me clarifying questions first before continuing. Do not invent facts or make silent assumptions. Wait for my reply.'
      : 'Jika ada informasi yang kurang atau tidak jelas, tanyakan dulu kepada saya. Jangan mengarang, jangan berasumsi. Tunggu jawaban saya sebelum melanjutkan.';

    var s = {
      peran: peran,
      tujuan: orIsi(st.tujuan, lang),
      hasil: orIsi(st.hasil, lang),
      konteks: orIsi(st.konteks, lang),
      bahan: orIsi(st.bahan, lang),
      langkah: orIsi(st.langkah, lang),
      batasan: buildBatasan(st.batasan, lang),
      format: orIsi(st.format, lang),
      contoh: st.contoh && String(st.contoh).trim() ? String(st.contoh).trim() : '',
      kriteria: orIsi(st.kriteria, lang),
      jikakurang: jikaKurang
    };

    var labels = getSectionLabels(lang, isImage);

    if (st.aiTarget === 'claude') return buildClaude(s, labels);
    if (st.aiTarget === 'chatgpt') return buildMarkdown(s, labels);
    return buildShort(s, labels);
  }

  function getSectionLabels(lang, isImage) {
    if (lang === 'en') {
      if (isImage) {
        return {
          xml: ['role', 'subject_and_goal', 'aspect_and_deliverable', 'visual_context', 'visual_references', 'composition_direction', 'negative_constraints', 'output_format', 'example', 'acceptance_criteria', 'if_unclear'],
          md:  ['ROLE', 'SUBJECT & GOAL', 'DELIVERABLE & RATIO', 'VISUAL CONTEXT', 'VISUAL REFERENCES', 'COMPOSITION & DIRECTION', 'NEGATIVE CONSTRAINTS', 'OUTPUT FORMAT', 'EXAMPLE', 'ACCEPTANCE CRITERIA', 'IF UNCLEAR']
        };
      }
      return {
        xml: ['role', 'goal', 'deliverable', 'context', 'inputs', 'steps', 'constraints', 'output_format', 'example', 'acceptance_criteria', 'if_unclear'],
        md:  ['ROLE', 'GOAL', 'DELIVERABLE', 'CONTEXT', 'INPUTS', 'STEPS', 'CONSTRAINTS', 'OUTPUT FORMAT', 'EXAMPLE', 'ACCEPTANCE CRITERIA', 'IF UNCLEAR']
      };
    }

    if (isImage) {
      return {
        xml: ['peran', 'subjek_dan_tujuan', 'hasil_dan_rasio', 'konteks_visual', 'referensi_dan_elemen', 'arahan_komposisi', 'hindari_dan_batasan', 'format_output', 'contoh', 'kriteria_selesai', 'jika_kurang'],
        md:  ['PERAN', 'SUBJEK & TUJUAN', 'HASIL & RASIO', 'KONTEKS VISUAL', 'REFERENSI & ELEMEN', 'ARAHAN KOMPOSISI', 'HINDARI / BATASAN', 'FORMAT OUTPUT', 'CONTOH', 'KRITERIA SELESAI', 'JIKA KURANG']
      };
    }

    return {
      xml: ['peran', 'tujuan', 'hasil_akhir', 'konteks', 'bahan', 'langkah', 'batasan', 'format_output', 'contoh', 'kriteria_selesai', 'jika_kurang'],
      md:  ['PERAN', 'TUJUAN', 'HASIL AKHIR', 'KONTEKS', 'BAHAN', 'LANGKAH', 'BATASAN', 'FORMAT OUTPUT', 'CONTOH', 'KRITERIA SELESAI', 'JIKA KURANG']
    };
  }

  function buildClaude(s, labels) {
    var t = labels.xml;
    var vals = [s.peran, s.tujuan, s.hasil, s.konteks, s.bahan, s.langkah, s.batasan, s.format, s.contoh, s.kriteria, s.jikakurang];
    var out = '';
    for (var i = 0; i < t.length; i++) {
      if (i === 8 && !s.contoh) continue;
      out += '<' + t[i] + '>\n' + vals[i] + '\n</' + t[i] + '>\n';
      if (i < t.length - 1) out += '\n';
    }
    return out;
  }

  function buildMarkdown(s, labels) {
    var m = labels.md;
    var vals = [s.peran, s.tujuan, s.hasil, s.konteks, s.bahan, s.langkah, s.batasan, s.format, s.contoh, s.kriteria, s.jikakurang];
    var out = '';
    for (var i = 0; i < m.length; i++) {
      if (i === 8 && !s.contoh) continue;
      out += '# ' + m[i] + '\n' + vals[i] + '\n';
      if (i < m.length - 1) out += '\n';
    }
    return out;
  }

  function buildShort(s, labels) {
    var m = labels.md;
    var vals = [s.peran, s.tujuan, s.hasil, s.konteks, s.bahan, s.langkah, s.batasan, s.format, s.contoh, s.kriteria, s.jikakurang];
    var multilineIdx = { 5: true, 6: true, 8: true, 9: true };
    var out = '';
    for (var i = 0; i < m.length; i++) {
      if (i === 8 && !s.contoh) continue;
      if (multilineIdx[i] || vals[i].indexOf('\n') !== -1) {
        out += m[i] + ':\n' + vals[i] + '\n';
      } else {
        out += m[i] + ': ' + vals[i] + '\n';
      }
      if (i < m.length - 1) out += '\n';
    }
    return out;
  }

  /* ---------- Evaluasi kualitas prompt ---------- */
  function evaluateQuality(stInput) {
    var st = stInput || state;
    var schema = TASK_TYPES[st.taskType] || TASK_TYPES.kode;
    var items = [];

    REQUIRED.forEach(function (key) {
      var val = String(st[key] || '').trim();
      if (val === '') {
        var label = (schema.fields[key] && schema.fields[key].label) || key;
        items.push({
          type: 'bad',
          key: key,
          step: FIELD_STEP[key],
          text: 'Field wajib masih kosong: ' + label + '.'
        });
      }
    });

    var haystack = [
      st.tujuan, st.hasil, st.konteks, st.bahan,
      st.langkah, st.batasan, st.format, st.kriteria
    ].join(' ');

    var vagueMatches = Oreedo.findVagueWords ? Oreedo.findVagueWords(haystack) : [];
    if (vagueMatches.length > 0) {
      var wordsList = vagueMatches.map(function (m) { return '"' + m.word + '"'; }).join(', ');
      var firstTip = vagueMatches[0].suggestion;
      items.push({
        type: 'warn',
        text: 'Kata samar terdeteksi (' + wordsList + '). ' + firstTip
      });
    }

    var batasanLines = String(st.batasan || '')
      .split('\n')
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l !== ''; });
    if (batasanLines.length > 5) {
      items.push({
        type: 'bad',
        key: 'batasan',
        step: FIELD_STEP.batasan,
        text: 'Batasan lebih dari 5 baris (' + batasanLines.length + ' baris). Ringkas dulu.'
      });
    }

    var kriteriaVal = String(st.kriteria || '').trim();
    if (kriteriaVal !== '' && !/(ketika|saat|jika|bila|maka|when|if|then|\d)/i.test(kriteriaVal)) {
      items.push({
        type: 'warn',
        key: 'kriteria',
        step: FIELD_STEP.kriteria,
        text: 'Kriteria selesai sebaiknya memakai pola terukur ("Ketika …, maka …") atau angka.'
      });
    }

    return items;
  }

  /* ---------- Inisialisasi DOM ---------- */
  function applySharedDraft(data) {
    if (!data || typeof data !== 'object') return;
    var next = Object.assign(createDefaultState(), data);
    if (!TASK_TYPES[next.taskType]) next.taskType = 'kode';
    if (!AI_LABELS[next.aiTarget]) next.aiTarget = 'claude';
    next.outputLang = next.outputLang === 'en' ? 'en' : 'id';
    state = next;
    currentStep = 1;
    invalidateManualEdit();
    restoreForm();
    updateTaskFields();
    renderStepper();
    saveDraft();
    updateLivePreview();
    goToStep(1, false, { focusHeading: false, scroll: false });
  }

  function init() {
    var wizardEl = $('#prompt-wizard');
    if (!wizardEl) return;

    var fromHash = Oreedo.hash && Oreedo.hash.decodeDraft('prompt');
    var saved = Oreedo.storage.get(STORAGE_KEY, null);
    var loadedFromShare = false;

    if (fromHash) {
      var next = Object.assign(createDefaultState(), fromHash);
      if (!TASK_TYPES[next.taskType]) next.taskType = 'kode';
      if (!AI_LABELS[next.aiTarget]) next.aiTarget = 'claude';
      next.outputLang = next.outputLang === 'en' ? 'en' : 'id';
      state = next;
      currentStep = 1;
      loadedFromShare = true;
      saveDraft();
    } else if (saved && typeof saved === 'object') {
      state = Object.assign(createDefaultState(), saved);
      if (!TASK_TYPES[state.taskType]) state.taskType = 'kode';
      if (!AI_LABELS[state.aiTarget]) state.aiTarget = 'claude';
      state.outputLang = state.outputLang === 'en' ? 'en' : 'id';
      var step = parseInt(saved._step, 10);
      currentStep = (step >= 1 && step <= TOTAL_STEPS) ? step : 1;
    }

    restoreForm();
    updateTaskFields();
    renderStepper();
    goToStep(currentStep, false, { focusHeading: false, scroll: false });
    updateLivePreview();
    wireEvents();

    $$('dialog.oreedo-dialog').forEach(function (dlg) {
      Oreedo.dialog.setup(dlg);
    });

    if (loadedFromShare) {
      Oreedo.toast('Draf dari tautan bersama berhasil dimuat.');
    }
  }

  function restoreForm() {
    $$('input[name="taskType"]').forEach(function (r) {
      r.checked = (r.value === state.taskType);
    });
    $$('input[name="aiTarget"]').forEach(function (r) {
      r.checked = (r.value === state.aiTarget);
    });
    $$('[data-field]').forEach(function (el) {
      var key = el.getAttribute('data-field');
      if (state[key] != null) el.value = state[key];
    });
    syncLangToggle();
    updateBatasanCount();
  }

  function syncLangToggle() {
    $$('[data-output-lang]').forEach(function (btn) {
      var isActive = btn.getAttribute('data-output-lang') === state.outputLang;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  /* ---------- Wiring Event ---------- */
  function wireEvents() {
    window.addEventListener('hashchange', function () {
      var nextData = Oreedo.hash && Oreedo.hash.decodeDraft('prompt');
      if (!nextData) return;
      applySharedDraft(nextData);
      Oreedo.toast('Draf dari tautan bersama berhasil dimuat.');
    });

    $$('input[name="taskType"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        state.taskType = r.value;
        invalidateManualEdit();
        updateTaskFields();
        renderStepper();
        saveDraft();
        updateLivePreview();
        if (currentStep === TOTAL_STEPS) renderOutput();
      });
    });

    $$('input[name="aiTarget"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        state.aiTarget = r.value;
        invalidateManualEdit();
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
        invalidateManualEdit();
        saveDraft();
        updateLivePreview();
        if (currentStep === TOTAL_STEPS) renderOutput();
        Oreedo.toast(lang === 'en' ? 'Output diubah ke Bahasa Inggris.' : 'Output diubah ke Bahasa Indonesia.');
      });
    });

    $$('[data-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        var key = el.getAttribute('data-field');
        state[key] = el.value;
        invalidateManualEdit();
        if (key === 'batasan') updateBatasanCount();
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

    var btnPreviewCopy = $('#btn-preview-copy');
    if (btnPreviewCopy) {
      btnPreviewCopy.addEventListener('click', function () {
        copyTextWithToast(buildPrompt(state), 'Pratinjau prompt disalin ke clipboard.');
      });
    }

    var btnCopy = $('#btn-copy');
    if (btnCopy) {
      btnCopy.addEventListener('click', function () {
        copyTextWithToast(getCurrentOutputText(), 'Prompt disalin ke clipboard.');
      });
    }

    var btnDownload = $('#btn-download');
    if (btnDownload) btnDownload.addEventListener('click', downloadOutput);

    var btnEdit = $('#btn-edit-output');
    if (btnEdit) btnEdit.addEventListener('click', toggleEditMode);

    var btnResetEdit = $('#btn-reset-edit');
    if (btnResetEdit) {
      btnResetEdit.addEventListener('click', function () {
        customOutput = null;
        renderOutput();
        Oreedo.toast('Dikembalikan ke hasil otomatis.');
      });
    }

    var editor = $('#prompt-editor');
    if (editor) {
      editor.addEventListener('input', function () {
        customOutput = editor.value;
        updateOutputMeta(customOutput);
      });
    }

    /* Modal Template */
    var btnTemplates = $('#btn-templates');
    var tplDialog = $('#templates-dialog');
    if (btnTemplates && tplDialog) {
      btnTemplates.addEventListener('click', function () {
        renderTemplatesList();
        Oreedo.dialog.open(tplDialog);
      });

      $$('[data-tpl-filter]', tplDialog).forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeTemplateFilter = btn.getAttribute('data-tpl-filter') || 'all';
          $$('[data-tpl-filter]', tplDialog).forEach(function (b) {
            b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
          });
          renderTemplatesList();
        });
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

  /* ---------- Label & placeholder dinamis ---------- */
  function updateTaskFields() {
    var schema = TASK_TYPES[state.taskType];
    if (!schema) return;

    $$('[data-field]').forEach(function (el) {
      var key = el.getAttribute('data-field');
      var cfg = schema.fields[key];
      if (!cfg) return;

      var wrap = el.closest ? el.closest('.field') : null;
      if (!wrap) return;

      var label = wrap.querySelector('label');
      if (label) {
        var isReq = REQUIRED.indexOf(key) !== -1;
        while (label.firstChild) label.removeChild(label.firstChild);
        label.appendChild(document.createTextNode(cfg.label + ' '));
        if (isReq) {
          var mark = document.createElement('span');
          mark.className = 'req';
          mark.setAttribute('aria-hidden', 'true');
          mark.textContent = '*';
          label.appendChild(mark);
        }
      }

      if (cfg.placeholder != null) el.placeholder = cfg.placeholder;
    });
  }

  function updateBatasanCount() {
    var ta = $('[data-field="batasan"]');
    var counter = $('#batasan-count');
    if (!ta || !counter) return;

    var lines = ta.value.split('\n').filter(function (l) { return l.trim() !== ''; });
    var count = lines.length;

    if (count > 5) {
      counter.textContent = count + ' baris — maksimal 5. Ringkas dulu.';
      counter.style.color = 'var(--danger)';
      counter.style.fontWeight = '700';
    } else {
      counter.textContent = count + ' dari 5 batasan';
      counter.style.color = '';
      counter.style.fontWeight = '';
    }
  }

  /* ---------- Stepper Interaktif ---------- */
  function isStepComplete(stepIndex) {
    if (stepIndex === 1) return true;
    if (stepIndex === 2) return Boolean(String(state.tujuan || '').trim() && String(state.hasil || '').trim());
    if (stepIndex === 3) return Boolean(String(state.konteks || '').trim() || String(state.bahan || '').trim());
    if (stepIndex === 4) return Boolean(String(state.langkah || '').trim() || String(state.batasan || '').trim());
    if (stepIndex === 5) return Boolean(String(state.format || '').trim() && String(state.kriteria || '').trim());
    if (stepIndex === 6) {
      return REQUIRED.every(function (k) { return String(state[k] || '').trim() !== ''; });
    }
    return false;
  }

  function hasStepMissingRequired(stepIndex) {
    if (stepIndex === 2) return !String(state.tujuan || '').trim() || !String(state.hasil || '').trim();
    if (stepIndex === 5) return !String(state.format || '').trim() || !String(state.kriteria || '').trim();
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
        btn.addEventListener('click', function () {
          goToStep(stepNum);
        });
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

  /* ---------- Navigasi langkah ---------- */
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
      var wizard = $('#prompt-wizard');
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
    return ['tujuan', 'hasil', 'konteks', 'bahan', 'langkah', 'batasan', 'format', 'contoh', 'kriteria']
      .some(function (k) { return String(state[k] || '').trim() !== ''; });
  }

  function invalidateManualEdit() {
    if (customOutput !== null) {
      customOutput = null;
      if (isEditingOutput) {
        var pre = $('#prompt-output');
        var editor = $('#prompt-editor');
        var btnEdit = $('#btn-edit-output');
        isEditingOutput = false;
        if (pre) pre.hidden = false;
        if (editor) editor.hidden = true;
        if (btnEdit) {
          btnEdit.setAttribute('aria-pressed', 'false');
          btnEdit.textContent = 'Edit langsung';
        }
      }
    }
  }

  /* ---------- Aksi toolbar ---------- */
  function applyExampleData(data, taskTypeOverride, aiTargetOverride) {
    if (taskTypeOverride) state.taskType = taskTypeOverride;
    if (aiTargetOverride) state.aiTarget = aiTargetOverride;

    Object.keys(data).forEach(function (key) {
      state[key] = data[key];
    });

    invalidateManualEdit();
    restoreForm();
    updateTaskFields();
    renderStepper();
    saveDraft();
    updateLivePreview();
    if (currentStep === TOTAL_STEPS) renderOutput();
  }

  function handleFillExample() {
    var schema = TASK_TYPES[state.taskType];
    if (!schema) return;

    function apply() {
      applyExampleData(schema.contohData);
      Oreedo.toast('Contoh terisi. Sesuaikan seperlunya.');
    }

    if (hasUserContent()) {
      Oreedo.dialog.confirm({
        title: 'Timpa isian dengan contoh?',
        message: 'Isian yang sudah kamu tulis akan digantikan dengan contoh untuk jenis "' + schema.label + '".',
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
      message: 'Semua isian pada wizard prompt akan dihapus dan dikembalikan ke awal.',
      confirmLabel: 'Hapus & reset',
      cancelLabel: 'Batal',
      danger: true
    }).then(function (ok) {
      if (!ok) return;

      state = createDefaultState();
      customOutput = null;
      isEditingOutput = false;
      Oreedo.storage.remove(STORAGE_KEY);

      restoreForm();
      updateTaskFields();
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

    var prompt = buildPrompt(state);
    pre.textContent = prompt;

    var missingCount = (prompt.match(/\[(ISI|FILL):/g) || []).length;
    if (badge) {
      badge.textContent = missingCount === 0 ? 'Siap dipakai' : missingCount + ' isian kosong';
      badge.className = missingCount === 0 ? 'badge badge-ok' : 'badge badge-warn';
    }

    if (statsEl && Oreedo.textStats) {
      var stats = Oreedo.textStats(prompt);
      statsEl.textContent = stats.words + ' kata · ~' + stats.tokens + ' token';
    }
  }

  /* ---------- Render hasil & mode edit ---------- */
  function getCurrentOutputText() {
    if (customOutput !== null) return customOutput;
    return buildPrompt(state);
  }

  function updateOutputMeta(text) {
    var statsEl = $('#prompt-stats');
    if (statsEl && Oreedo.textStats) {
      var st = Oreedo.textStats(text);
      statsEl.textContent = st.words + ' kata · ' + st.chars + ' karakter · ~' + st.tokens + ' token';
    }
    var editBadge = $('#edit-status-badge');
    if (editBadge) editBadge.hidden = customOutput === null;

    var resetEditBtn = $('#btn-reset-edit');
    if (resetEditBtn) resetEditBtn.hidden = customOutput === null;
  }

  function renderOutput() {
    var prompt = getCurrentOutputText();
    var out = $('#prompt-output');
    var editor = $('#prompt-editor');
    if (out) out.textContent = prompt;
    if (editor && editor.value !== prompt) editor.value = prompt;

    var badge = $('#output-format-badge');
    if (badge) {
      var langTag = state.outputLang === 'en' ? 'EN' : 'ID';
      badge.textContent = (AI_LABELS[state.aiTarget] || '') + ' · ' + langTag;
    }

    updateOutputMeta(prompt);
    renderChecker();
  }

  function toggleEditMode() {
    var out = $('#prompt-output');
    var editor = $('#prompt-editor');
    var btn = $('#btn-edit-output');
    if (!out || !editor || !btn) return;

    isEditingOutput = !isEditingOutput;
    if (isEditingOutput) {
      editor.value = getCurrentOutputText();
      out.hidden = true;
      editor.hidden = false;
      btn.setAttribute('aria-pressed', 'true');
      btn.textContent = 'Selesai edit';
      editor.focus();
    } else {
      customOutput = editor.value;
      out.textContent = customOutput;
      editor.hidden = true;
      out.hidden = false;
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = 'Edit langsung';
      updateOutputMeta(customOutput);
    }
  }

  function renderChecker() {
    var list = $('#checker-list');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);

    var items = evaluateQuality(state);

    if (items.length === 0) {
      var li = document.createElement('li');
      li.className = 'is-good';
      li.innerHTML = '<span class="check-item-text">✅ Semua pemeriksaan lolos. Prompt siap dipakai.</span>';
      list.appendChild(li);
      return;
    }

    items.forEach(function (item) {
      var el = document.createElement('li');
      el.className = 'is-' + item.type;

      var textSpan = document.createElement('span');
      textSpan.className = 'check-item-text';
      textSpan.textContent = (item.type === 'bad' ? '⚠️ ' : '💡 ') + item.text;
      el.appendChild(textSpan);

      if (item.step) {
        var jumpBtn = document.createElement('button');
        jumpBtn.type = 'button';
        jumpBtn.className = 'btn btn-ghost btn-xs';
        jumpBtn.textContent = 'Lengkapi →';
        jumpBtn.addEventListener('click', function () {
          var fieldEl = document.querySelector('[data-field="' + item.key + '"]');
          goToStep(item.step, true, { focusFieldId: fieldEl ? fieldEl.id : null });
        });
        el.appendChild(jumpBtn);
      }

      list.appendChild(el);
    });
  }

  /* ---------- Modal Template ---------- */
  function renderTemplatesList() {
    var list = $('#templates-list');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);

    var filtered = TEMPLATES.filter(function (tpl) {
      return activeTemplateFilter === 'all' || tpl.taskType === activeTemplateFilter;
    });

    filtered.forEach(function (tpl) {
      var li = document.createElement('li');
      li.className = 'dialog-item';

      var schema = TASK_TYPES[tpl.taskType] || { label: tpl.taskType };
      li.innerHTML =
        '<div class="dialog-item-head">' +
          '<h3 class="dialog-item-title">' + Oreedo.escapeHtml(tpl.title) + '</h3>' +
          '<span class="badge">' + Oreedo.escapeHtml(schema.label) + '</span>' +
        '</div>' +
        '<p class="hint mb-0">' + Oreedo.escapeHtml(tpl.desc) + '</p>' +
        '<div class="btn-group">' +
          '<button type="button" class="btn btn-primary btn-xs">Pakai template</button>' +
        '</div>';

      var useBtn = li.querySelector('button');
      useBtn.addEventListener('click', function () {
        var dlg = $('#templates-dialog');
        function commit() {
          applyExampleData(tpl.data, tpl.taskType, tpl.aiTarget);
          Oreedo.dialog.close(dlg, 'selected').then(function () {
            Oreedo.toast('Template "' + tpl.title + '" diterapkan.');
          });
        }

        if (hasUserContent()) {
          Oreedo.dialog.close(dlg, 'cancel').then(function () {
            return Oreedo.dialog.confirm({
              title: 'Gunakan template "' + tpl.title + '"?',
              message: 'Isian yang saat ini ada akan diganti dengan template pilihanmu.',
              confirmLabel: 'Pakai template',
              cancelLabel: 'Batal'
            });
          }).then(function (ok) {
            if (ok) {
              applyExampleData(tpl.data, tpl.taskType, tpl.aiTarget);
              Oreedo.toast('Template "' + tpl.title + '" diterapkan.');
            }
          });
        } else {
          commit();
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
    var raw = String(state.tujuan || '').trim();
    if (raw) return raw.length > 52 ? raw.slice(0, 50) + '…' : raw;
    var schema = TASK_TYPES[state.taskType] || { label: 'Prompt' };
    return 'Draf ' + schema.label;
  }

  function saveToHistory() {
    var titleInput = $('#history-title-input');
    var customTitle = titleInput ? titleInput.value.trim() : '';
    var title = customTitle || suggestDraftTitle();

    var snapshot = Object.assign({}, state);
    var entry = {
      id: 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: title,
      updatedAt: new Date().toISOString(),
      state: snapshot
    };

    var list = readHistory();
    list.unshift(entry);
    writeHistory(list);
    if (titleInput) titleInput.value = '';
    renderHistoryList();
    Oreedo.toast('Draf tersimpan ke riwayat lokal.');
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
      var schema = TASK_TYPES[item.state && item.state.taskType] || { label: 'Prompt' };
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
          '<span class="badge">' + Oreedo.escapeHtml(schema.label) + '</span>' +
        '</div>' +
        '<span class="dialog-item-meta">Disimpan: ' + Oreedo.escapeHtml(dateStr) + '</span>' +
        '<div class="btn-group">' +
          '<button type="button" class="btn btn-primary btn-xs" data-act="load">Buka</button>' +
          '<button type="button" class="btn btn-secondary btn-xs" data-act="dup">Duplikat</button>' +
          '<button type="button" class="btn btn-ghost btn-xs" data-act="del">Hapus</button>' +
        '</div>';

      li.querySelector('[data-act="load"]').addEventListener('click', function () {
        var dlg = $('#history-dialog');
        applyExampleData(item.state || createDefaultState(), item.state && item.state.taskType, item.state && item.state.aiTarget);
        state.outputLang = (item.state && item.state.outputLang) || 'id';
        syncLangToggle();
        saveDraft();
        updateLivePreview();
        if (currentStep === TOTAL_STEPS) renderOutput();
        Oreedo.dialog.close(dlg, 'loaded').then(function () {
          Oreedo.toast('Draf "' + item.title + '" dimuat.');
        });
      });

      li.querySelector('[data-act="dup"]').addEventListener('click', function () {
        var arr = readHistory();
        arr.unshift({
          id: 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
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
    var url = Oreedo.hash.buildShareUrl('prompt', state);
    var dlg = $('#history-dialog');
    Oreedo.copy(url).then(function (ok) {
      Oreedo.dialog.close(dlg, 'shared').then(function () {
        if (!ok) {
          Oreedo.toast('Gagal menyalin tautan draf.');
        } else if (url.length > 4000) {
          Oreedo.toast('Tautan disalin (panjang: ' + url.length + ' karakter — gunakan Ekspor JSON bila terpotong).');
        } else {
          Oreedo.toast('Tautan draf siap bagikan disalin.');
        }
      });
    });
  }

  function exportJson() {
    var payload = JSON.stringify({
      app: 'Oreedo',
      type: 'prompt',
      version: 1,
      exportedAt: new Date().toISOString(),
      state: state
    }, null, 2);
    var ok = Oreedo.download('oreedo-prompt-draf.json', payload, 'application/json;charset=utf-8');
    if (ok) Oreedo.toast('Draf diekspor ke oreedo-prompt-draf.json.');
    else Oreedo.toast('Gagal mengekspor JSON.');
  }

  function importJson(e) {
    var file = e.target && e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result || ''));
        var imported = (parsed && parsed.type === 'prompt' && parsed.state) ? parsed.state : parsed;
        if (!imported || typeof imported !== 'object' || (!('tujuan' in imported) && !('taskType' in imported))) {
          throw new Error('Format JSON tidak dikenali');
        }
        var clean = Object.assign(createDefaultState(), imported);
        applyExampleData(clean, clean.taskType, clean.aiTarget);
        state.outputLang = clean.outputLang === 'en' ? 'en' : 'id';
        syncLangToggle();
        saveDraft();
        updateLivePreview();
        var dlg = $('#history-dialog');
        Oreedo.dialog.close(dlg, 'imported').then(function () {
          Oreedo.toast('Draf JSON berhasil diimpor.');
        });
      } catch (err) {
        Oreedo.toast('File JSON tidak valid untuk Prompt Oreedo.');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  /* ---------- Salin & unduh ---------- */
  function copyTextWithToast(text, successMsg) {
    Oreedo.copy(text).then(function (ok) {
      Oreedo.toast(ok ? successMsg : 'Gagal menyalin. Coba pilih manual.');
    });
  }

  function downloadOutput() {
    var text = getCurrentOutputText();
    var ok = Oreedo.download('prompt.md', text);
    if (ok) Oreedo.toast('Berkas prompt.md diunduh.');
    else Oreedo.toast('Gagal mengunduh.');
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
      TASK_TYPES: TASK_TYPES,
      TEMPLATES: TEMPLATES,
      REQUIRED: REQUIRED,
      createDefaultState: createDefaultState,
      buildPrompt: buildPrompt,
      evaluateQuality: evaluateQuality
    };
  }
})(this);