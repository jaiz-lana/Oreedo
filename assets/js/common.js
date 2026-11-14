/* =========================================================
   Oreedo — assets/js/common.js
   Dipakai di semua halaman: navbar mobile, tahun footer,
   toast, localStorage aman, salin, unduh, debounce.
   ========================================================= */
(function () {
  'use strict';

  var Oreedo = window.Oreedo || {};
  window.Oreedo = Oreedo;

  /* ---------- Helper selektor ---------- */
  Oreedo.$ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  Oreedo.$$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ---------- localStorage aman (dibungkus try/catch) ---------- */
  var PREFIX = 'oreedo:';

  Oreedo.storage = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(PREFIX + key);
        if (raw === null || raw === undefined) return fallback;
        return JSON.parse(raw);
      } catch (err) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (err) {
        return false;
      }
    },
    remove: function (key) {
      try {
        window.localStorage.removeItem(PREFIX + key);
      } catch (err) { /* diabaikan */ }
    }
  };

  /* ---------- Toast ---------- */
  var toastTimer = null;

  Oreedo.toast = function (message) {
    var el = document.getElementById('oreedo-toast');

    if (!el) {
      el = document.createElement('div');
      el.id = 'oreedo-toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }

    el.textContent = String(message);
    /* paksa reflow supaya animasi tetap jalan saat dipanggil berulang */
    void el.offsetWidth;
    el.classList.add('is-visible');

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.classList.remove('is-visible');
    }, 2600);
  };

  /* ---------- Salin ke clipboard ---------- */
  Oreedo.copy = function (text) {
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
    try {
      var ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (err) {
      return false;
    }
  }

  /* ---------- Unduh berkas ---------- */
  Oreedo.download = function (filename, text, mime) {
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
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  };

  /* ---------- Escape HTML (untuk pratinjau aman) ---------- */
  Oreedo.escapeHtml = function (str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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

  /* ---------- Jalankan ---------- */
  function boot() {
    initNav();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();