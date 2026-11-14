/* =========================================================
   Oreedo — assets/js/prompt.js
   Wizard pembuat prompt. Menyimpan draf di localStorage.
   ========================================================= */
(function () {
  'use strict';

  var $ = Oreedo.$;
  var $$ = Oreedo.$$;

  var STORAGE_KEY = 'prompt-draft';
  var TOTAL_STEPS = 6;

  /* ---------- Skema per jenis tugas ---------- */
  var TASK_TYPES = {
    kode: {
      label: 'Kode/Web',
      peran: 'Kamu adalah developer web berpengalaman yang menulis kode rapi, mudah dirawat, dan siap produksi.',
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
        langkah: '1. Susun struktur HTML\n2. Tulis CSS mobile-first\n3. Tambah pencarian dan filter dengan JS murni',
        batasan: 'Tanpa framework\nMobile-first\nTanpa dependencies',
        format: 'Satu file HTML lengkap, dengan komentar singkat di bagian penting.',
        contoh: '',
        kriteria: 'Ketika dibuka di 360px, maka tidak ada scroll horizontal.\nKetika kolom pencarian dikosongkan, maka semua kartu tampil kembali.'
      }
    },

    tulisan: {
      label: 'Tulisan',
      peran: 'Kamu adalah penulis profesional yang menulis dengan jelas, hangat, dan sesuai audiens.',
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
        batasan: '800 kata\nTanpa jargon\nPakai contoh konkret',
        format: 'Markdown dengan heading level 2 dan paragraf pendek.',
        contoh: '',
        kriteria: 'Ketika dibaca dalam 3 menit, maka pembaca paham inti dan punya satu langkah untuk dicoba.\nKetika artikel selesai, maka tiap subjudul punya satu contoh konkret.'
      }
    },

    riset: {
      label: 'Riset/Analisis',
      peran: 'Kamu adalah analis riset yang teliti, tidak berlebihan, dan selalu membedakan fakta dari asumsi.',
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
        langkah: '1. Tentukan 5 kriteria\n2. Nilai tiap alat per kriteria (1-5)\n3. Simpulkan',
        batasan: '5 kriteria\nHarga publik saja\nTanpa asumsi',
        format: 'Tabel Markdown 5 kolom + ringkasan 1 paragraf.',
        contoh: '',
        kriteria: 'Ketika tabel selesai, maka tiap alat punya skor dan alasan singkat.\nKetika rekomendasi ditulis, maka ada 1 pilihan utama dan 1 cadangan.'
      }
    },

    gambar: {
      label: 'Gambar',
      peran: 'Kamu adalah perancang visual yang peka komposisi, warna, dan nuansa.',
      fields: {
        tujuan:   { label: 'Tujuan gambar',            placeholder: 'Contoh: Ilustrasi cover artikel tentang pagi yang tenang.' },
        hasil:    { label: 'Hasil akhir',              placeholder: 'Contoh: Prompt gambar 1:1, gaya flat, palet hijau-krem.' },
        konteks:  { label: 'Konteks & audiens',        placeholder: 'Di mana gambar dipakai, siapa yang melihat.' },
        bahan:    { label: 'Bahan yang dimiliki',      placeholder: 'Referensi visual, brand guideline, mood board, dsb.' },
        langkah:  { label: 'Langkah kerja',            placeholder: '1. Tentukan subjek utama\n2. Susun komposisi\n3. Pilih palet' },
        batasan:  { label: 'Batasan',                  placeholder: 'Satu per baris, maksimal 5.\nContoh:\n1:1\nflat illustration\ntanpa teks' },
        format:   { label: 'Format output',            placeholder: 'Contoh: prompt gambar tunggal, 1:1.' },
        contoh:   { label: 'Contoh hasil (opsional)',  placeholder: 'Tempel prompt gambar yang kamu suka.' },
        kriteria: { label: 'Kriteria selesai',         placeholder: 'Ketika gambar dihasilkan, maka ada subjek utama di sepertiga kanan.' }
      },
      contohData: {
        tujuan: 'Ilustrasi cover artikel tentang pagi yang tenang.',
        hasil: 'Prompt gambar 1:1, gaya flat, palet hijau-krem.',
        konteks: 'Untuk header artikel blog, dilihat di layar ponsel.',
        bahan: 'Mood board: daun, kopi, jendela, cahaya pagi.',
        langkah: '1. Tentukan subjek utama\n2. Susun komposisi\n3. Pilih palet',
        batasan: '1:1\nFlat illustration\nTanpa teks',
        format: 'Prompt gambar tunggal, 1:1.',
        contoh: '',
        kriteria: 'Ketika gambar dihasilkan, maka subjek utama ada di sepertiga kanan.\nKetika dipotong 1:1, maka komposisi tetap enak dilihat.'
      }
    }
  };

  /* ---------- Aturan pemeriksa ---------- */
  var REQUIRED = ['tujuan', 'hasil', 'format', 'kriteria'];

  var VAGUE_WORDS = [
    'bagus', 'menarik', 'cepat', 'modern', 'keren', 'mantap',
    'luar biasa', 'sempurna', 'optimal', 'maksimal', 'profesional',
    'inovatif', 'kreatif', 'terbaik', 'efektif', 'efisien'
  ];

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
  var state = {
    taskType: 'kode',
    aiTarget: 'claude',
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

  var currentStep = 1;

  /* ---------- Inisialisasi ---------- */
  function init() {
    var saved = Oreedo.storage.get(STORAGE_KEY, null);
    if (saved && typeof saved === 'object') {
      state = Object.assign({}, state, saved);
      var step = parseInt(saved._step, 10);
      currentStep = (step >= 1 && step <= TOTAL_STEPS) ? step : 1;
    }

    restoreForm();
    updateTaskFields();
    goToStep(currentStep, false);
    wireEvents();
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
    updateBatasanCount();
  }

  /* ---------- Event wiring ---------- */
  function wireEvents() {
    $$('input[name="taskType"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        state.taskType = r.value;
        updateTaskFields();
        saveDraft();
        if (currentStep === TOTAL_STEPS) renderOutput();
      });
    });

    $$('input[name="aiTarget"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        state.aiTarget = r.value;
        saveDraft();
        if (currentStep === TOTAL_STEPS) renderOutput();
      });
    });

    $$('[data-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        state[el.getAttribute('data-field')] = el.value;
        if (el.getAttribute('data-field') === 'batasan') updateBatasanCount();
        saveDraft();
      });
    });

    $$('[data-next]').forEach(function (b) {
      b.addEventListener('click', function () { goToStep(currentStep + 1); });
    });
    $$('[data-prev]').forEach(function (b) {
      b.addEventListener('click', function () { goToStep(currentStep - 1); });
    });

    var btnExample = $('#btn-example');
    if (btnExample) btnExample.addEventListener('click', fillExample);

    var btnReset = $('#btn-reset');
    if (btnReset) btnReset.addEventListener('click', resetAll);

    var btnCopy = $('#btn-copy');
    if (btnCopy) btnCopy.addEventListener('click', copyOutput);

    var btnDownload = $('#btn-download');
    if (btnDownload) btnDownload.addEventListener('click', downloadOutput);
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

  /* ---------- Navigasi langkah ---------- */
  function goToStep(n, doSave) {
    if (n < 1 || n > TOTAL_STEPS) return;
    currentStep = n;

    $$('.step-panel').forEach(function (p) { p.classList.remove('is-active'); });
    var target = document.getElementById('panel-' + n);
    if (target) target.classList.add('is-active');

    var fill = $('#progress-fill');
    if (fill) fill.style.width = ((n / TOTAL_STEPS) * 100) + '%';

    var label = $('#progress-label');
    if (label) label.textContent = 'Langkah ' + n + ' dari ' + TOTAL_STEPS;

    var nameEl = $('#progress-step');
    if (nameEl) nameEl.textContent = STEP_NAMES[n - 1] || '';

    if (n === TOTAL_STEPS) renderOutput();

    if (doSave !== false) saveDraft();

    var wizard = $('#prompt-wizard');
    if (wizard) {
      var top = wizard.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  function saveDraft() {
    state._step = currentStep;
    Oreedo.storage.set(STORAGE_KEY, state);
  }

  /* ---------- Aksi toolbar ---------- */
  function fillExample() {
    var schema = TASK_TYPES[state.taskType];
    if (!schema) return;

    var data = schema.contohData;
    Object.keys(data).forEach(function (key) {
      state[key] = data[key];
      var el = document.querySelector('[data-field="' + key + '"]');
      if (el) el.value = data[key];
    });

    updateBatasanCount();
    saveDraft();
    Oreedo.toast('Contoh terisi. Sesuaikan seperlunya.');
    if (currentStep === TOTAL_STEPS) renderOutput();
  }

  function resetAll() {
    if (!window.confirm('Hapus semua isian dan mulai dari awal?')) return;

    state = {
      taskType: 'kode',
      aiTarget: 'claude',
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

    Oreedo.storage.remove(STORAGE_KEY);

    $$('input[name="taskType"]').forEach(function (r) {
      r.checked = (r.value === state.taskType);
    });
    $$('input[name="aiTarget"]').forEach(function (r) {
      r.checked = (r.value === state.aiTarget);
    });
    $$('[data-field]').forEach(function (el) { el.value = ''; });

    updateTaskFields();
    updateBatasanCount();
    goToStep(1, false);
    Oreedo.toast('Isian sudah direset.');
  }

  /* ---------- Bangun prompt ---------- */
  function buildPrompt() {
    var schema = TASK_TYPES[state.taskType];
    var peran = schema ? schema.peran : '';

    var s = {
      peran: peran,
      tujuan: orIsi(state.tujuan),
      konteks: orIsi(state.konteks),
      bahan: orIsi(state.bahan),
      langkah: orIsi(state.langkah),
      batasan: buildBatasan(state.batasan),
      format: orIsi(state.format),
      contoh: state.contoh && state.contoh.trim() ? state.contoh.trim() : '',
      kriteria: orIsi(state.kriteria),
      jikakurang: 'Jika ada informasi yang kurang atau tidak jelas, tanyakan dulu kepada saya. Jangan mengarang, jangan berasumsi. Tunggu jawaban saya sebelum melanjutkan.'
    };

    if (state.aiTarget === 'claude') return buildClaude(s);
    if (state.aiTarget === 'chatgpt') return buildMarkdown(s);
    return buildShort(s);
  }

  function orIsi(val) {
    var v = String(val == null ? '' : val).trim();
    return v === '' ? '[ISI: …]' : v;
  }

  function buildBatasan(val) {
    var lines = String(val || '')
      .split('\n')
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l !== ''; })
      .slice(0, 5);

    if (lines.length === 0) return '[ISI: …]';
    return lines.map(function (l) { return '- ' + l; }).join('\n');
  }

  function buildClaude(s) {
    var out = '';
    out += '<peran>\n' + s.peran + '\n</peran>\n\n';
    out += '<tujuan>\n' + s.tujuan + '\n</tujuan>\n\n';
    out += '<konteks>\n' + s.konteks + '\n</konteks>\n\n';
    out += '<bahan>\n' + s.bahan + '\n</bahan>\n\n';
    out += '<langkah>\n' + s.langkah + '\n</langkah>\n\n';
    out += '<batasan>\n' + s.batasan + '\n</batasan>\n\n';
    out += '<format_output>\n' + s.format + '\n</format_output>\n\n';
    if (s.contoh) out += '<contoh>\n' + s.contoh + '\n</contoh>\n\n';
    out += '<kriteria_selesai>\n' + s.kriteria + '\n</kriteria_selesai>\n\n';
    out += '<jika_kurang>\n' + s.jikakurang + '\n</jika_kurang>\n';
    return out;
  }

  function buildMarkdown(s) {
    var out = '';
    out += '# PERAN\n' + s.peran + '\n\n';
    out += '# TUJUAN\n' + s.tujuan + '\n\n';
    out += '# KONTEKS\n' + s.konteks + '\n\n';
    out += '# BAHAN\n' + s.bahan + '\n\n';
    out += '# LANGKAH\n' + s.langkah + '\n\n';
    out += '# BATASAN\n' + s.batasan + '\n\n';
    out += '# FORMAT OUTPUT\n' + s.format + '\n\n';
    if (s.contoh) out += '# CONTOH\n' + s.contoh + '\n\n';
    out += '# KRITERIA SELESAI\n' + s.kriteria + '\n\n';
    out += '# JIKA KURANG\n' + s.jikakurang + '\n';
    return out;
  }

  function buildShort(s) {
    var out = '';
    out += 'PERAN: ' + s.peran + '\n\n';
    out += 'TUJUAN: ' + s.tujuan + '\n\n';
    out += 'KONTEKS: ' + s.konteks + '\n\n';
    out += 'BAHAN: ' + s.bahan + '\n\n';
    out += 'LANGKAH:\n' + s.langkah + '\n\n';
    out += 'BATASAN:\n' + s.batasan + '\n\n';
    out += 'FORMAT OUTPUT: ' + s.format + '\n\n';
    if (s.contoh) out += 'CONTOH:\n' + s.contoh + '\n\n';
    out += 'KRITERIA SELESAI:\n' + s.kriteria + '\n\n';
    out += 'JIKA KURANG: ' + s.jikakurang + '\n';
    return out;
  }

  /* ---------- Render hasil ---------- */
  function renderOutput() {
    var prompt = buildPrompt();
    var out = $('#prompt-output');
    if (out) out.textContent = prompt;

    var badge = $('#output-format-badge');
    if (badge) badge.textContent = AI_LABELS[state.aiTarget] || '';

    renderChecker();
  }

  function renderChecker() {
    var list = $('#checker-list');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);

    var items = [];

    REQUIRED.forEach(function (key) {
      var val = String(state[key] || '').trim();
      if (val === '') {
        var label = (TASK_TYPES[state.taskType].fields[key] || {}).label || key;
        items.push({ type: 'bad', text: 'Field wajib masih kosong: ' + label });
      }
    });

    var haystack = [
      state.tujuan, state.hasil, state.konteks, state.bahan,
      state.langkah, state.format, state.kriteria
    ].join(' ').toLowerCase();

    var found = [];
    VAGUE_WORDS.forEach(function (w) {
      if (haystack.indexOf(w) !== -1 && found.indexOf(w) === -1) found.push(w);
    });
    if (found.length > 0) {
      items.push({ type: 'bad', text: 'Kata samar terdeteksi: ' + found.join(', ') + '. Ganti dengan kriteria terukur.' });
    }

    var batasanLines = String(state.batasan || '')
      .split('\n')
      .filter(function (l) { return l.trim() !== ''; });
    if (batasanLines.length > 5) {
      items.push({ type: 'bad', text: 'Batasan lebih dari 5 baris (' + batasanLines.length + '). Ringkas dulu.' });
    }

    if (items.length === 0) {
      var li = document.createElement('li');
      li.className = 'is-good';
      li.textContent = 'Semua pemeriksaan lolos. Prompt siap dipakai.';
      list.appendChild(li);
      return;
    }

    items.forEach(function (item) {
      var el = document.createElement('li');
      el.className = 'is-' + item.type;
      el.textContent = item.text;
      list.appendChild(el);
    });
  }

  /* ---------- Salin & unduh ---------- */
  function copyOutput() {
    var out = $('#prompt-output');
    if (!out) return;
    Oreedo.copy(out.textContent).then(function (ok) {
      if (ok) Oreedo.toast('Prompt disalin ke clipboard.');
      else Oreedo.toast('Gagal menyalin. Coba pilih manual.');
    });
  }

  function downloadOutput() {
    var out = $('#prompt-output');
    if (!out) return;
    var ok = Oreedo.download('prompt.md', out.textContent);
    if (ok) Oreedo.toast('Berkas prompt.md diunduh.');
    else Oreedo.toast('Gagal mengunduh.');
  }

  /* ---------- Boot ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();