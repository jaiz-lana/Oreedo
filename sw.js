/* =========================================================
   Oreedo — sw.js
   Service Worker ringan untuk akses offline penuh.
   Semua path relatif agar aman di subfolder GitHub Pages.
   ========================================================= */
'use strict';

var CACHE_VERSION = 'oreedo-v2';
var CORE_ASSETS = [
  './',
  './index.html',
  './prompt.html',
  './prd.html',
  './bug.html',
  './kontak.html',
  './lisensi.html',
  './404.html',
  './manifest.webmanifest',
  './assets/css/style.css',
  './assets/js/common.js',
  './assets/js/prompt.js',
  './assets/js/prd.js',
  './assets/img/logo.svg',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(CORE_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_VERSION; })
          .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* Network-first untuk dokumen navigasi agar update cepat terlihat */
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  /* Stale-while-revalidate untuk aset statis same-origin */
  event.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });

      return cached || network;
    })
  );
});
