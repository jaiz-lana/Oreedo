/* =========================================================
   Oreedo — assets/js/common.js
   Dipakai di semua halaman: tema terang/gelap, navbar mobile,
   toast aksesibel, dialog native, validasi form, hash URL,
   statistik teks, deteksi kata samar, util, dan PWA.
   ========================================================= */
(function (root) {
  'use strict';

  var hasWindow = typeof window !== 'undefined' && typeof document !== 'undefined';
  var Oreedo = (hasWindow ? (window.Oreedo = window.Oreedo || {}) : {});

  /* ---------- Helper selektor ---------- */
  Oreedo.$ = function (sel, scope) {
    return (scope || document).querySelector(sel);
  };
  Oreedo.$$ = function (sel, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  };

  /* ---------- localStorage aman (dibungkus try/catch) ---------- */
  var PREFIX = 'oreedo:';

  Oreedo.storage = {
    get: function (key, fallback) {
      if (!hasWindow) return fallback;
      try {
        var raw = window.localStorage.getItem(PREFIX + key);
        if (raw === null || raw === undefined) return fallback;
        return JSON.parse(raw);
      } catch (err) {
        return fallback;
      }
    },
    set: function (key, value) {
      if (!hasWindow) return false;
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (err) {
        return false;
      }
    },
    remove: function (key) {
      if (!hasWindow) return;
      try {
        window.localStorage.removeItem(PREFIX + key);
      } catch (err) { /* diabaikan */ }
    }
  };

  /* ---------- Manajemen Tema (2-state override + ikuti OS) ---------- */
  var THEME_KEY = 'oreedo:theme';
  var memoryTheme = null;
  var themeMql = null;

  function readStoredTheme() {
    if (!hasWindow) return null;
    try {
      var val = window.localStorage.getItem(THEME_KEY);
      if (val === 'light' || val === 'dark') return val;
      return null;
    } catch (err) {
      return memoryTheme;
    }
  }

  function writeStoredTheme(val) {
    if (val === 'light' || val === 'dark') {
      memoryTheme = val;
      try {
        window.localStorage.setItem(THEME_KEY, val);
      } catch (err) { /* fallback ke memori */ }
    } else {
      memoryTheme = null;
      try {
        window.localStorage.removeItem(THEME_KEY);
      } catch (err) { /* diabaikan */ }
    }
  }

  function getSystemScheme() {
    if (!hasWindow || !window.matchMedia) return 'light';
    if (!themeMql) themeMql = window.matchMedia('(prefers-color-scheme: dark)');
    return themeMql.matches ? 'dark' : 'light';
  }

  function syncThemeMeta() {
    if (!hasWindow) return;
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) return;
    var stored = readStoredTheme();
    meta.content = stored || 'light dark';
  }

  Oreedo.theme = {
    getStored: readStoredTheme,
    getSystem: getSystemScheme,
    getEffective: function () {
      return readStoredTheme() || getSystemScheme();
    },
    toggle: function () {
      var rendered = this.getEffective();
      var target = rendered === 'dark' ? 'light' : 'dark';
      var system = getSystemScheme();
      writeStoredTheme(target !== system ? target : null);
      syncThemeMeta();
      return this.getEffective();
    }
  };

  function initTheme() {
    syncThemeMeta();
    var btn = Oreedo.$('#theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var next = Oreedo.theme.toggle();
        Oreedo.toast(next === 'dark' ? 'Mode gelap aktif.' : 'Mode terang aktif.');
      });
    }
    window.addEventListener('storage', function (e) {
      if (e.key === THEME_KEY || e.key === null) {
        syncThemeMeta();
      }
    });
  }

  /* ---------- Toast persisten yang ramah pembaca layar ---------- */
  var toastTimer = null;
  var toastClearTimer = null;
  var lastToastMsg = '';
  var lastToastAlt = false;
  var pendingToastMsg = null;

  function ensureToastEl() {
    var el = document.getElementById('oreedo-toast');
    if (!el && document.body) {
      el = document.createElement('div');
      el.id = 'oreedo-toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      document.body.appendChild(el);
    }
    return el;
  }

  Oreedo.toast = function (message) {
    if (!hasWindow) return;
    var clean = String(message == null ? '' : message).trim();
    if (!clean) return;

    /* Hindari memunculkan toast di belakang modal dialog yang membuat halaman inert */
    var openModal = document.querySelector('dialog:modal, dialog[open]');
    if (openModal) {
      pendingToastMsg = clean;
      if (!openModal._oreedoToastWait) {
        openModal._oreedoToastWait = true;
        openModal.addEventListener('close', function onModalClose() {
          openModal._oreedoToastWait = false;
          openModal.removeEventListener('close', onModalClose);
          if (pendingToastMsg) {
            var msg = pendingToastMsg;
            pendingToastMsg = null;
            window.setTimeout(function () { Oreedo.toast(msg); }, 40);
          }
        });
      }
      return;
    }

    var el = ensureToastEl();
    if (!el) return;

    window.clearTimeout(toastTimer);
    window.clearTimeout(toastClearTimer);

    /* Selang-selingkan U+00A0 bila pesan berulang agar pembaca layar membacanya setiap kali */
    lastToastAlt = clean === lastToastMsg ? !lastToastAlt : false;
    lastToastMsg = clean;
    var spoken = lastToastAlt ? clean + '\u00A0' : clean;

    el.textContent = '';
    void el.offsetWidth;
    el.textContent = spoken;
    el.classList.add('is-visible');

    toastTimer = window.setTimeout(function () {
      el.classList.remove('is-visible');
      toastClearTimer = window.setTimeout(function () {
        if (!el.classList.contains('is-visible')) {
          el.textContent = '';
        }
      }, 280);
    }, 2800);
  };

  /* ---------- Salin ke clipboard ---------- */
  Oreedo.copy = function (text) {
    if (!hasWindow) return Promise.resolve(false);
    var value = String(text == null ? '' : text);

    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value).then(function () {
        return true;
      }).catch(function () {
        return legacyCopy(value);
      });
    }
    return Promise.resolve(legacyCopy(value));
  };

  function legacyCopy(value) {
    var ta = null;
    try {
      ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;inset-block-start:0;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      return document.execCommand('copy');
    } catch (err) {
      return false;
    } finally {
      if (ta && ta.parentNode) ta.parentNode.removeChild(ta);
    }
  }

  /* ---------- Unduh berkas ---------- */
  Oreedo.download = function (filename, text, mime) {
    if (!hasWindow) return false;
    try {
      var blob = new Blob([String(text == null ? '' : text)], {
        type: mime || 'text/markdown;charset=utf-8'
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
      return true;
    } catch (err) {
      return false;
    }
  };

  /* ---------- Debounce ---------- */
  Oreedo.debounce = function (fn, wait) {
    var timer = null;
    var delay = typeof wait === 'number' ? wait : 350;
    return function () {
      var ctx = this;
      var args = arguments;
      if (hasWindow) {
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          fn.apply(ctx, args);
        }, delay);
      } else {
        fn.apply(ctx, args);
      }
    };
  };

  /* ---------- Escape HTML ---------- */
  Oreedo.escapeHtml = function (str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  /* ---------- Dialog Native + Transisi Top-Layer + Konfirmasi ---------- */
  var supportsDisplayTransition;

  function canTransitionDisplay() {
    if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
    if (!hasWindow || !window.CSS || !CSS.supports ||
        !CSS.supports('transition-behavior', 'allow-discrete') || !document.body) {
      return false;
    }
    var probe = document.createElement('div');
    probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
    document.body.appendChild(probe);
    void window.getComputedStyle(probe).display;
    probe.style.display = 'none';
    supportsDisplayTransition = window.getComputedStyle(probe).display === 'block';
    probe.remove();
    return supportsDisplayTransition;
  }

  function supportsTopLayerExit() {
    return hasWindow && window.CSS && CSS.supports &&
      CSS.supports('overlay', 'auto') && canTransitionDisplay();
  }

  function closeTopLayer(dialog, returnValue) {
    if (!dialog || !dialog.open) return Promise.resolve();

    if (supportsTopLayerExit() || typeof dialog.getAnimations !== 'function') {
      dialog.close(returnValue);
      return Promise.resolve();
    }

    dialog.setAttribute('data-closing', '');
    var animations = dialog.getAnimations({ subtree: true });
    var waiter = animations.length > 0
      ? Promise.race([
          Promise.all(animations.map(function (a) {
            return a.finished.catch(function () {});
          })),
          new Promise(function (resolve) { window.setTimeout(resolve, 600); })
        ])
      : Promise.resolve();

    return waiter.then(function () {
      if (!dialog.hasAttribute('data-closing')) return;
      dialog.removeAttribute('data-closing');
      if (dialog.open) dialog.close(returnValue);
    });
  }

  function isOutsideDialog(e, dialog) {
    var r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right ||
           e.clientY < r.top || e.clientY > r.bottom;
  }

  Oreedo.dialog = {
    open: function (dialog) {
      if (!dialog) return;
      dialog.removeAttribute('data-closing');
      dialog.returnValue = '';
      if (!dialog.open) dialog.showModal();
    },

    close: function (dialog, returnValue) {
      return closeTopLayer(dialog, returnValue);
    },

    setup: function (dialog) {
      if (!dialog || dialog._oreedoWired) return;
      dialog._oreedoWired = true;

      /* Intercept Esc/cancel agar animasi keluar tetap halus di Firefox & Safari */
      dialog.addEventListener('cancel', function (e) {
        e.preventDefault();
        closeTopLayer(dialog, '');
      });

      /* Reset returnValue setelah ditutup agar nilai lama tidak bocor ke pembukaan berikutnya */
      dialog.addEventListener('close', function () {
        dialog.removeAttribute('data-closing');
        window.setTimeout(function () {
          if (!dialog.open) dialog.returnValue = '';
        }, 0);
      });

      /* Fallback closedby="any" saat belum didukung browser (mis. Safari) */
      if (!('closedBy' in HTMLDialogElement.prototype) &&
          dialog.getAttribute('closedby') === 'any') {
        var pressedOutside = false;
        dialog.addEventListener('pointerdown', function (e) {
          pressedOutside = isOutsideDialog(e, dialog);
        });
        dialog.addEventListener('pointerup', function (e) {
          if (pressedOutside && isOutsideDialog(e, dialog)) {
            closeTopLayer(dialog, '');
          }
          pressedOutside = false;
        });
      }

      /* Tombol tutup eksplisit */
      Oreedo.$$('[data-dialog-close]', dialog).forEach(function (btn) {
        btn.addEventListener('click', function () {
          closeTopLayer(dialog, btn.value || '');
        });
      });
    },

    confirm: function (opts) {
      if (!hasWindow) return Promise.resolve(false);
      var cfg = opts || {};
      var dlg = document.getElementById('oreedo-confirm-dialog');

      if (!dlg) {
        dlg = document.createElement('dialog');
        dlg.id = 'oreedo-confirm-dialog';
        dlg.className = 'oreedo-dialog';
        dlg.setAttribute('closedby', 'any');
        dlg.setAttribute('aria-labelledby', 'oreedo-confirm-title');
        dlg.setAttribute('aria-describedby', 'oreedo-confirm-msg');

        dlg.innerHTML =
          '<div class="dialog-inner">' +
            '<div class="dialog-head">' +
              '<h2 id="oreedo-confirm-title"></h2>' +
            '</div>' +
            '<div class="dialog-body">' +
              '<p id="oreedo-confirm-msg" class="mb-0"></p>' +
            '</div>' +
            '<form method="dialog" class="dialog-foot">' +
              '<button type="button" class="btn btn-secondary btn-sm" id="oreedo-confirm-cancel" value="cancel" autofocus>Batal</button>' +
              '<button type="button" class="btn btn-primary btn-sm" id="oreedo-confirm-ok" value="confirm">Lanjutkan</button>' +
            '</form>' +
          '</div>';

        document.body.appendChild(dlg);
        Oreedo.dialog.setup(dlg);
      }

      var titleEl = document.getElementById('oreedo-confirm-title');
      var msgEl = document.getElementById('oreedo-confirm-msg');
      var cancelBtn = document.getElementById('oreedo-confirm-cancel');
      var okBtn = document.getElementById('oreedo-confirm-ok');

      titleEl.textContent = cfg.title || 'Konfirmasi';
      msgEl.textContent = cfg.message || '';
      cancelBtn.textContent = cfg.cancelLabel || 'Batal';
      okBtn.textContent = cfg.confirmLabel || 'Lanjutkan';
      okBtn.className = 'btn btn-sm ' + (cfg.danger ? 'btn-danger' : 'btn-primary');

      return new Promise(function (resolve) {
        var settled = false;

        function cleanup() {
          cancelBtn.removeEventListener('click', onCancel);
          okBtn.removeEventListener('click', onOk);
          dlg.removeEventListener('close', onClose);
        }

        function finish(result) {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(result);
        }

        function onCancel() {
          closeTopLayer(dlg, 'cancel');
        }
        function onOk() {
          closeTopLayer(dlg, 'confirm');
        }
        function onClose() {
          var accepted = dlg.returnValue === 'confirm';
          dlg.returnValue = '';
          finish(accepted);
        }

        cancelBtn.addEventListener('click', onCancel);
        okBtn.addEventListener('click', onOk);
        dlg.addEventListener('close', onClose);

        Oreedo.dialog.open(dlg);
        cancelBtn.focus();
      });
    }
  };

  /* ---------- Jembatan Validasi (:user-invalid + ARIA + Announcer) ---------- */
  var announcerEl = null;
  var announceTimer = null;
  var announcedField = null;

  function ensureAnnouncer() {
    if (announcerEl || !hasWindow || !document.body) return announcerEl;
    announcerEl = document.createElement('div');
    announcerEl.id = 'oreedo-form-announcer';
    announcerEl.setAttribute('aria-live', 'polite');
    announcerEl.className = 'visually-hidden';
    document.body.appendChild(announcerEl);
    return announcerEl;
  }

  function spokenText(node) {
    if (!node) return '';
    var copy = node.cloneNode(true);
    Oreedo.$$('[aria-hidden="true"]', copy).forEach(function (n) { n.remove(); });
    Oreedo.$$('[role="img"][aria-label]', copy).forEach(function (n) {
      var rep = document.createTextNode(n.getAttribute('aria-label') + ': ');
      n.parentNode.replaceChild(rep, n);
    });
    return String(copy.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function linkFieldError(el, shown) {
    var errorId = el.getAttribute('data-error');
    if (!errorId) return;
    var ids = String(el.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter(function (id) { return id && id !== errorId; });
    if (shown) ids.push(errorId);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
    else el.removeAttribute('aria-describedby');
  }

  function announceFieldError(el) {
    var errorId = el.getAttribute('data-error');
    var error = errorId ? document.getElementById(errorId) : null;
    if (!error) return;
    var box = ensureAnnouncer();
    if (!box) return;
    var labelText = (el.labels && el.labels[0]) ? spokenText(el.labels[0]) + ': ' : '';
    window.clearTimeout(announceTimer);
    box.textContent = '';
    announcedField = el;
    announceTimer = window.setTimeout(function () {
      box.textContent = labelText + spokenText(error);
    }, 500);
  }

  Oreedo.validation = {
    attach: function (form) {
      if (!hasWindow || !form || form._oreedoValidationWired) return;
      form._oreedoValidationWired = true;
      form.classList.add('validated-form');

      var supportsUserInvalid = window.CSS && CSS.supports && CSS.supports('selector(:user-invalid)');
      var dirtyState = new WeakMap();
      var forcedInvalid = new WeakSet();
      var flagged = new WeakSet();
      var announced = new WeakSet();

      function syncField(el, announce) {
        if (!el || !el.matches || !el.matches('input, select, textarea')) return;
        var invalid = false;

        if (el.validity && el.validity.valid) {
          forcedInvalid.delete(el);
        }

        var isForced = forcedInvalid.has(el) && el.validity && !el.validity.valid;

        if (supportsUserInvalid) {
          invalid = el.matches(':user-invalid') || isForced;
          el.classList.toggle('user-invalid-fallback', isForced);
        } else {
          var st = dirtyState.get(el);
          invalid = Boolean((st && st.hasBlurred && st.hasInteracted && !el.validity.valid) || isForced);
          el.classList.toggle('user-invalid-fallback', invalid);
          el.classList.toggle('user-valid-fallback', Boolean(st && st.hasBlurred && el.validity.valid));
        }

        if (invalid) {
          if (announce && !announced.has(el)) {
            announceFieldError(el);
            announced.add(el);
          }
          el.setAttribute('aria-invalid', 'true');
          linkFieldError(el, true);
          flagged.add(el);
        } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
          el.setAttribute('aria-invalid', 'false');
          linkFieldError(el, false);
          flagged.delete(el);
          announced.delete(el);
          if (announcedField === el && announcerEl) {
            window.clearTimeout(announceTimer);
            announcerEl.textContent = '';
          }
        }
      }

      Oreedo.$$('input, select, textarea', form).forEach(function (el) {
        syncField(el, false);
      });

      form.addEventListener('blur', function (e) {
        var el = e.target;
        if (!supportsUserInvalid && el.matches && el.matches('input, select, textarea')) {
          var st = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false };
          st.hasBlurred = true;
          dirtyState.set(el, st);
        }
        syncField(el, true);
      }, true);

      form.addEventListener('input', function (e) {
        var el = e.target;
        if (!supportsUserInvalid && el.matches && el.matches('input, select, textarea')) {
          var st = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false };
          st.hasInteracted = true;
          dirtyState.set(el, st);
        }
        if (el.hasAttribute && el.hasAttribute('aria-invalid')) {
          syncField(el, false);
        }
      });

      form.addEventListener('change', function (e) {
        var el = e.target;
        if (!supportsUserInvalid && el.matches && el.matches('input, select, textarea')) {
          var st = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false };
          st.hasInteracted = true;
          st.hasBlurred = true;
          dirtyState.set(el, st);
        }
        syncField(el, true);
      }, true);

      form.addEventListener('invalid', function (e) {
        var el = e.target;
        announced.add(el);
        if (!supportsUserInvalid) {
          dirtyState.set(el, { hasInteracted: true, hasBlurred: true });
        }
        syncField(el, false);
      }, true);

      form.addEventListener('reset', function () {
        window.setTimeout(function () {
          Oreedo.$$('input, select, textarea', form).forEach(function (el) {
            dirtyState.delete(el);
            forcedInvalid.delete(el);
            el.classList.remove('user-invalid-fallback', 'user-valid-fallback');
            syncField(el, false);
          });
        }, 0);
      }, true);

      form._oreedoForceInvalid = function (el) {
        if (!el) return;
        announced.add(el);
        forcedInvalid.add(el);
        if (!supportsUserInvalid) {
          dirtyState.set(el, { hasInteracted: true, hasBlurred: true });
        }
      };

      form._oreedoSyncAll = function () {
        Oreedo.$$('input, select, textarea', form).forEach(function (el) {
          if (!el.validity.valid && !supportsUserInvalid) {
            dirtyState.set(el, { hasInteracted: true, hasBlurred: true });
          }
          syncField(el, false);
        });
      };
    },

    checkAndFocusFirstInvalid: function (form) {
      if (!form) return true;
      var controls = Oreedo.$$('input, select, textarea', form);
      var firstInvalid = null;

      controls.forEach(function (el) {
        /* Trim spasi kosong di bidang wajib supaya isian whitespace tidak dianggap valid */
        if (el.hasAttribute('required') && typeof el.value === 'string' && el.value.trim() === '') {
          el.value = '';
        }
        if (!el.checkValidity()) {
          if (form._oreedoForceInvalid) form._oreedoForceInvalid(el);
          if (!firstInvalid) firstInvalid = el;
        }
      });

      if (form._oreedoSyncAll) form._oreedoSyncAll();

      if (firstInvalid) {
        firstInvalid.focus();
        return false;
      }
      return true;
    }
  };

  /* ---------- Utilitas Statistik & Kata Samar ---------- */
  Oreedo.VAGUE_SUGGESTIONS = {
    'bagus': 'Ganti "bagus" dengan kriteria konkret (mis. WCAG AA, nol error konsol).',
    'menarik': 'Ganti "menarik" dengan bagian atau visual yang ingin ditonjolkan.',
    'cepat': 'Ganti "cepat" dengan batas waktu atau target muat (mis. < 1 detik).',
    'modern': 'Ganti "modern" dengan gaya antarmuka atau palet spesifik.',
    'keren': 'Ganti "keren" dengan ciri kualitas atau interaksi yang diharapkan.',
    'mantap': 'Ganti "mantap" dengan standar keberhasilan yang terukur.',
    'luar biasa': 'Ganti "luar biasa" dengan hasil spesifik yang membedakannya.',
    'sempurna': 'Ganti "sempurna" dengan daftar syarat minimum agar dianggap selesai.',
    'optimal': 'Ganti "optimal" dengan metrik kinerja atau rasio yang ditargetkan.',
    'maksimal': 'Ganti "maksimal" dengan angka batas atas yang jelas.',
    'profesional': 'Ganti "profesional" dengan nada bahasa dan format penyajiannya.',
    'inovatif': 'Ganti "inovatif" dengan fitur atau ide pembeda secara spesifik.',
    'kreatif': 'Ganti "kreatif" dengan jumlah opsi/sudut pandang yang diinginkan.',
    'terbaik': 'Ganti "terbaik" dengan kriteria penilaian atau bobot pilihan.',
    'efektif': 'Ganti "efektif" dengan dampak atau target konkritnya.',
    'efisien': 'Ganti "efisien" dengan batasan langkah, ukuran, atau durasi.'
  };

  Oreedo.findVagueWords = function (text) {
    var source = String(text || '').toLowerCase();
    if (!source.trim()) return [];
    var matches = [];

    Object.keys(Oreedo.VAGUE_SUGGESTIONS).forEach(function (term) {
      var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp('(?:^|[^a-z0-9_])(' + escaped + ')(?=$|[^a-z0-9_])', 'i');
      if (re.test(source)) {
        matches.push({
          word: term,
          suggestion: Oreedo.VAGUE_SUGGESTIONS[term]
        });
      }
    });

    return matches;
  };

  Oreedo.textStats = function (text) {
    var raw = String(text == null ? '' : text);
    var trimmed = raw.trim();
    var chars = raw.length;
    var words = trimmed ? trimmed.split(/\s+/).length : 0;
    var lines = trimmed ? raw.split('\n').length : 0;
    var tokens = trimmed ? Math.max(words, Math.ceil(chars / 4)) : 0;
    return {
      chars: chars,
      words: words,
      lines: lines,
      tokens: tokens
    };
  };

  /* ---------- Berbagi draf via URL hash (#draft=...) ---------- */
  function utf8ToBase64Url(str) {
    var bytes;
    if (typeof TextEncoder !== 'undefined') {
      bytes = new TextEncoder().encode(str);
    } else {
      var binStr = unescape(encodeURIComponent(str));
      bytes = new Uint8Array(binStr.length);
      for (var i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    }
    var binary = '';
    for (var j = 0; j < bytes.length; j++) binary += String.fromCharCode(bytes[j]);
    var b64 = typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function base64UrlToUtf8(b64url) {
    var b64 = String(b64url || '').replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    if (typeof TextDecoder !== 'undefined' && typeof atob === 'function') {
      var binary = atob(b64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    }
    if (typeof atob === 'function') {
      return decodeURIComponent(escape(atob(b64)));
    }
    return Buffer.from(b64, 'base64').toString('utf8');
  }

  Oreedo.hash = {
    encodeDraft: function (type, data) {
      try {
        var payload = JSON.stringify({ v: 1, t: type, d: data });
        return '#draft=' + utf8ToBase64Url(payload);
      } catch (err) {
        return '';
      }
    },
    decodeDraft: function (expectedType, hashStr) {
      try {
        var raw = typeof hashStr === 'string'
          ? hashStr
          : (hasWindow ? window.location.hash : '');
        if (!raw || raw.indexOf('#draft=') !== 0) return null;
        var encoded = raw.slice('#draft='.length);
        if (!encoded) return null;
        var parsed = JSON.parse(base64UrlToUtf8(encoded));
        if (!parsed || parsed.t !== expectedType || !parsed.d || typeof parsed.d !== 'object') {
          return null;
        }
        return parsed.d;
      } catch (err) {
        return null;
      }
    },
    buildShareUrl: function (type, data) {
      if (!hasWindow) return '';
      var base = window.location.href.split('#')[0];
      return base + this.encodeDraft(type, data);
    }
  };

  /* ---------- Navbar mobile ---------- */
  function initNav() {
    var toggle = Oreedo.$('.nav-toggle');
    var nav = Oreedo.$('#site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    }

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    Oreedo.$$('a', nav).forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!isOpen()) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 760 && isOpen()) setOpen(false);
    });
  }

  /* ---------- Tahun otomatis di footer ---------- */
  function initYear() {
    var year = String(new Date().getFullYear());
    Oreedo.$$('[data-year]').forEach(function (el) {
      el.textContent = year;
    });
  }

  /* ---------- PWA Service Worker & Pasang Aplikasi ---------- */
  function initPwa() {
    if (!hasWindow) return;

    var proto = window.location && window.location.protocol;
    var isWebOrigin = proto === 'http:' || proto === 'https:';

    if (isWebOrigin && 'serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').catch(function () { /* abaikan offline */ });
      });
    }

    var installBtn = document.getElementById('btn-install');
    var installStatus = document.getElementById('install-status');
    if (!installBtn) return;

    var deferredPrompt = null;
    var hasNativeInstall = typeof Navigator !== 'undefined' &&
      'install' in Navigator.prototype;

    if (hasNativeInstall) {
      installBtn.hidden = false;
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.hidden = false;
    });

    window.addEventListener('appinstalled', function () {
      deferredPrompt = null;
      installBtn.hidden = true;
      installBtn.removeAttribute('aria-disabled');
      if (installStatus) installStatus.textContent = 'Oreedo berhasil dipasang.';
    });

    installBtn.addEventListener('click', function () {
      if (installBtn.getAttribute('aria-disabled') === 'true') return;

      if (hasNativeInstall && typeof navigator.install === 'function' && !deferredPrompt) {
        installBtn.setAttribute('aria-disabled', 'true');
        if (installStatus) installStatus.textContent = 'Membuka dialog pemasangan…';
        navigator.install()
          .then(function () {
            if (installStatus) installStatus.textContent = 'Oreedo berhasil dipasang.';
            installBtn.hidden = true;
          })
          .catch(function (err) {
            if (installStatus) {
              installStatus.textContent = err && err.name === 'AbortError'
                ? 'Pemasangan dibatalkan.'
                : 'Belum dapat memasang lewat fitur ini.';
            }
          })
          .finally(function () {
            installBtn.removeAttribute('aria-disabled');
          });
        return;
      }

      if (!deferredPrompt) return;
      installBtn.setAttribute('aria-disabled', 'true');
      if (installStatus) installStatus.textContent = 'Menunggu konfirmasi pemasangan…';

      deferredPrompt.prompt()
        .then(function () { return deferredPrompt.userChoice; })
        .then(function (choice) {
          if (choice && choice.outcome === 'accepted') {
            deferredPrompt = null;
            installBtn.hidden = true;
            if (installStatus) installStatus.textContent = 'Oreedo berhasil dipasang.';
          } else if (installStatus) {
            installStatus.textContent = 'Pemasangan dibatalkan.';
          }
        })
        .catch(function () {
          if (installStatus) installStatus.textContent = 'Gagal memasang aplikasi.';
        })
        .finally(function () {
          installBtn.removeAttribute('aria-disabled');
        });
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    ensureToastEl();
    initTheme();
    initNav();
    initYear();
    initPwa();
  }

  if (hasWindow) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Oreedo;
  }
})(this);