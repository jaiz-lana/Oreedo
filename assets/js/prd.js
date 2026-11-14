/* =========================================================
   Oreedo — assets/js/prd.js
   Wizard pembuat PRD.md + TASKS.md. Draf di localStorage.
   ========================================================= */
(function () {
  'use strict';

  var $ = Oreedo.$;
  var $$ = Oreedo.$$;

  var STORAGE_KEY = 'prd-draft';
  var TOTAL_STEPS = 8;

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

  var PROJECT_TYPES = {
    website: {
      label: 'Website',
      halamanLabel: 'Halaman / Alur',
      halamanPlaceholder: 'Contoh:\nBeranda → Daftar → Detail\nTentang\nKontak',
      kriteriaPlaceholder: 'Ketika dibuka di 360px, maka tidak ada scroll horizontal.\nKetika tombol ditekan, maka animasi hover berjalan halus.'
    },
    reels: {
      label: 'Reels / Video',
      halamanLabel: 'Shot / Alur',
      halamanPlaceholder: 'Contoh:\nHook 3 detik → masalah → solusi → CTA\nB-roll pendukung',
      kriteriaPlaceholder: 'Ketika ditonton tanpa suara, maka teks tetap terbaca.\nKetika durasi total, maka tidak lebih dari 45 detik.'
    },
    deck: {
      label: 'Deck',
      halamanLabel: 'Slide / Alur',
      halamanPlaceholder: 'Contoh:\nSlide 1 judul → slide 2 masalah → ... → penutup\nLampiran data',
      kriteriaPlaceholder: 'Ketika dibaca 10 menit, maka audiens paham intinya.\nKetika slide terakhir, maka ada ajakan yang jelas.'
    },
    app: {
      label: 'Aplikasi Kecil',
      halamanLabel: 'Layar / Alur',
      halamanPlaceholder: 'Contoh:\nOnboarding → Beranda → Detail → Pengaturan\nPencarian',
      kriteriaPlaceholder: 'Ketika data kosong, maka tampil pesan yang jelas.\nKetika tombol simpan ditekan, maka data tersimpan.'
    }
  };

  var state = {
    projectType: 'website',
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
    updateProjectFields();
    updateKebutuhanPreview();
    goToStep(currentStep, false);
    wireEvents();
  }

  function restoreForm() {
    $$('input[name="projectType"]').forEach(function (r) {
      r.checked = (r.value === state.projectType);
    });
    $$('[data-field]').forEach(function (el) {
      var key = el.getAttribute('data-field');
      if (state[key] != null) el.value = state[key];
    });
  }

  /* ---------- Event wiring ---------- */
  function wireEvents() {
    $$('input[name="projectType"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        state.projectType = r.value;
        updateProjectFields();
        saveDraft();
        if (currentStep === TOTAL_STEPS) renderOutput();
      });
    });

    $$('[data-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        var key = el.getAttribute('data-field');
        state[key] = el.value;
        if (key === 'kebutuhan') updateKebutuhanPreview();
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

    $$('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-tab');
        $$('.tab').forEach(function (t) {
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        $$('.tab-panel').forEach(function (p) {
          p.classList.toggle('is-active', p.id === 'panel-' + target);
        });
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

  /* ---------- Navigasi ---------- */
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

    var wizard = $('#prd-wizard');
    if (wizard) {
      var top = wizard.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  function saveDraft() {
    state._step = currentStep;
    Oreedo.storage.set(STORAGE_KEY, state);
  }

  /* ---------- Aksi ---------- */
  function fillExample() {
    var data = {
      namaProyek: 'Tanam',
      ide: 'Website kecil untuk mencatat kebiasaan menyiram tanaman hias dan mengingatkan kapan waktunya.',
      tujuan: 'Pengguna bisa mencatat tanaman dan melihat jadwal siram dalam satu layar.',
      pengguna: 'Pemilik tanaman hias di rumah, usia 20-40, nyaman memakai browser di ponsel.',
      masalah: 'Sering lupa jadwal siram karena catatan tersebar di banyak tempat.',
      kebutuhan: 'Melihat daftar tanaman\nMenambah tanaman baru\nMenandai tanaman sudah disiram\nMelihat jadwal siram hari ini',
      halaman: 'Beranda → Daftar tanaman → Detail tanaman\nTambah tanaman\nJadwal hari ini',
      desain: 'Palet hijau-putih, sudut membulat besar, font Plus Jakarta Sans, nuansa hangat.',
      teknologi: 'HTML, CSS, JS murni. Tanpa framework. Tanpa backend. Data disimpan di localStorage.',
      larangan: 'Jangan mengarang data tanaman\nJangan memakai framework\nJangan mengubah file tahap sebelumnya',
      kriteria: 'Ketika data kosong, maka tampil pesan ajakan menambah tanaman.\nKetika tombol tandai disiram ditekan, maka status tanaman berubah.\nKetika dibuka di 360px, maka tidak ada scroll horizontal.'
    };

    Object.keys(data).forEach(function (key) {
      state[key] = data[key];
      var el = document.querySelector('[data-field="' + key + '"]');
      if (el) el.value = data[key];
    });

    updateKebutuhanPreview();
    saveDraft();
    Oreedo.toast('Contoh terisi. Sesuaikan seperlunya.');
    if (currentStep === TOTAL_STEPS) renderOutput();
  }

  function resetAll() {
    if (!window.confirm('Hapus semua isian dan mulai dari awal?')) return;

    state = {
      projectType: 'website',
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

    Oreedo.storage.remove(STORAGE_KEY);

    $$('input[name="projectType"]').forEach(function (r) {
      r.checked = (r.value === state.projectType);
    });
    $$('[data-field]').forEach(function (el) { el.value = ''; });

    updateProjectFields();
    updateKebutuhanPreview();
    goToStep(1, false);
    Oreedo.toast('Isian sudah direset.');
  }

  /* ---------- Util ---------- */
  function orIsi(val) {
    var v = String(val == null ? '' : val).trim();
    return v === '' ? '[ISI: …]' : v;
  }

  function splitLines(val) {
    return String(val || '')
      .split('\n')
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l !== ''; });
  }

  function numberList(val) {
    var items = splitLines(val);
    if (items.length === 0) return '[ISI: …]';
    return items.map(function (l, i) { return (i + 1) + '. ' + l; }).join('\n');
  }

  function bulletList(val) {
    var items = splitLines(val);
    if (items.length === 0) return '[ISI: …]';
    return items.map(function (l) { return '- ' + l; }).join('\n');
  }

  /* ---------- Bangun PRD.md ---------- */
  function buildPrd() {
    var cfg = PROJECT_TYPES[state.projectType] || PROJECT_TYPES.website;
    var nama = String(state.namaProyek || '').trim() || '[ISI: nama proyek]';

    var out = '';
    out += '# PRD: ' + nama + '\n\n';
    out += 'Jenis proyek: **' + cfg.label + '**\n\n';

    out += '## 1. Ide\n' + orIsi(state.ide) + '\n\n';
    out += '## 2. Tujuan\n' + orIsi(state.tujuan) + '\n\n';
    out += '## 3. Pengguna\n' + orIsi(state.pengguna) + '\n\n';
    out += '## 4. Masalah\n' + orIsi(state.masalah) + '\n\n';
    out += '## 5. Kebutuhan\n' + numberList(state.kebutuhan) + '\n\n';
    out += '## 6. ' + cfg.halamanLabel + '\n' + orIsi(state.halaman) + '\n\n';
    out += '## 7. Desain & Gaya\n' + orIsi(state.desain) + '\n\n';
    out += '## 8. Teknologi & Batasan\n' + orIsi(state.teknologi) + '\n\n';
    out += '## 9. Larangan\n' + bulletList(state.larangan) + '\n\n';
    out += '## 10. Kriteria Selesai\n' + bulletList(state.kriteria) + '\n';

    return out;
  }

  /* ---------- Bangun TASKS.md ---------- */
  function buildTasks() {
    var cfg = PROJECT_TYPES[state.projectType] || PROJECT_TYPES.website;
    var nama = String(state.namaProyek || '').trim() || '[ISI: nama proyek]';

    var kebutuhan = splitLines(state.kebutuhan);
    var halamanList = splitLines(state.halaman);
    var kriteriaList = splitLines(state.kriteria);
    var laranganList = splitLines(state.larangan);

    var out = '';
    out += '# TASKS: ' + nama + '\n\n';
    out += 'Aturan kerja bertahap (WAJIB):\n';
    out += '- Kerjakan per tahap. Setelah tiap tahap selesai, berhenti dan tunggu saya mengetik "lanjut".\n';
    out += '- Jangan mengubah, menulis ulang, atau mencetak ulang file dari tahap sebelumnya.\n';
    out += '- Jika satu tahap butuh perubahan file lama, sebutkan alasannya dulu dan tunggu persetujuan saya.\n';
    out += '- Jangan mengarang data. Jika informasi kurang, tanyakan dulu dan tunggu jawaban.\n\n';

    /* Tahap 1 */
    out += '## Tahap 1 — Fondasi\n';
    out += '- Baca PRD.md sampai selesai sebelum menulis apa pun.\n';
    out += '- Siapkan struktur proyek dan file dasar sesuai Teknologi & Batasan.\n';
    out += '- Konfirmasi ruang lingkup jika ada yang ambigu. Jangan berasumsi.\n';
    out += '- Jangan mengerjakan fitur sebelum fondasi disetujui.\n\n';

    /* Tahap 2 */
    out += '## Tahap 2 — Fitur inti\n';
    if (kebutuhan.length === 0) {
      out += '- [ISI: daftar kebutuhan belum diisi]\n';
    } else {
      out += 'Implementasikan kebutuhan berikut satu per satu:\n';
      kebutuhan.forEach(function (k, i) {
        out += (i + 1) + '. ' + k + '\n';
      });
    }
    out += '- Setiap kebutuhan harus punya bukti hasil yang bisa ditunjukkan.\n';
    out += '- Setelah semua kebutuhan selesai, berhenti dan tunggu "lanjut".\n\n';

    /* Tahap 3 */
    out += '## Tahap 3 — ' + cfg.halamanLabel + '\n';
    if (halamanList.length === 0) {
      out += '- [ISI: alur belum diisi]\n';
    } else {
      out += 'Bangun alur berikut:\n';
      halamanList.forEach(function (h) { out += '- ' + h + '\n'; });
    }
    out += '- Pastikan perpindahan antar bagian berjalan dan tidak ada tautan rusak.\n';
    out += '- Setelah selesai, berhenti dan tunggu "lanjut".\n\n';

    /* Tahap 4 */
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
    out += '\nPerbaiki yang belum lolos, lalu serahkan hasil akhir beserta ringkasan perubahan.\n';

    return out;
  }

  /* ---------- Render ---------- */
  function renderOutput() {
    var prd = buildPrd();
    var tasks = buildTasks();

    var prdOut = $('#prd-output');
    if (prdOut) prdOut.textContent = prd;

    var tasksOut = $('#tasks-output');
    if (tasksOut) tasksOut.textContent = tasks;

    var prdBadge = $('#prd-badge');
    if (prdBadge) {
      var missing = countMissing(prd);
      prdBadge.textContent = missing === 0
        ? 'Lengkap'
        : missing + ' isian kosong';
      prdBadge.className = missing === 0 ? 'badge badge-ok' : 'badge badge-warn';
    }

    var tasksBadge = $('#tasks-badge');
    if (tasksBadge) {
      tasksBadge.textContent = '4 tahap';
      tasksBadge.className = 'badge';
    }
  }

  function countMissing(text) {
    var matches = String(text || '').match(/\[ISI:/g);
    return matches ? matches.length : 0;
  }

  /* ---------- Salin & unduh ---------- */
  function copyFile(which) {
    var el = which === 'prd' ? $('#prd-output') : $('#tasks-output');
    if (!el) return;
    Oreedo.copy(el.textContent).then(function (ok) {
      Oreedo.toast(ok ? (which === 'prd' ? 'PRD.md disalin.' : 'TASKS.md disalin.') : 'Gagal menyalin.');
    });
  }

  function downloadFile(which) {
    var el = which === 'prd' ? $('#prd-output') : $('#tasks-output');
    if (!el) return;
    var filename = which === 'prd' ? 'PRD.md' : 'TASKS.md';
    var ok = Oreedo.download(filename, el.textContent);
    Oreedo.toast(ok ? filename + ' diunduh.' : 'Gagal mengunduh.');
  }

  function copyAllWithInstruction() {
    var prd = $('#prd-output');
    var tasks = $('#tasks-output');
    if (!prd || !tasks) return;

    var instruction =
      'Kamu adalah asisten yang akan mengerjakan proyek ini berdasarkan PRD dan daftar tugas di bawah.\n\n' +
      'Mulai dari Tahap 1. Setelah tiap tahap selesai, berhenti dan tunggu saya mengetik "lanjut". ' +
      'Jangan mengerjakan tahap berikutnya sebelum saya izinkan. ' +
      'Jangan mengarang data yang tidak ada di PRD. Jika ada informasi yang kurang, tanyakan dulu.\n';

    var combined =
      instruction + '\n\n' +
      '=== PRD.md ===\n' + prd.textContent + '\n\n' +
      '=== TASKS.md ===\n' + tasks.textContent;

    Oreedo.copy(combined).then(function (ok) {
      Oreedo.toast(ok ? 'Semua berkas + perintah disalin.' : 'Gagal menyalin.');
    });
  }

  /* ---------- Boot ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();