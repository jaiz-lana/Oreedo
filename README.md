<p align="center">
  <img src="assets/img/logo.svg" alt="Oreedo Logo" width="120" height="120" />
</p>

<h1 align="center">Oreedo</h1>

<p align="center">
  <strong>Mesin pembuat prompt AI dan PRD yang berjalan sepenuhnya di browser.</strong><br>
  Isi form singkat, dapatkan prompt atau <code>PRD.md</code> + <code>TASKS.md</code> yang siap tempel ke ChatGPT, Claude, Gemini, DeepSeek, atau GLM.
</p>

<p align="center">
  <a href="https://jaiz-lana.github.io/Oreedo/"><strong>Buka Aplikasi (GitHub Pages) →</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/PWA-Offline--Ready-16a34a?style=flat-square" alt="PWA Offline Ready" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-16a34a?style=flat-square" alt="MIT License" /></a>
</p>

---

## ✨ Fitur

- **Tanpa Framework & Build Step**: HTML, CSS, dan JavaScript murni. Bisa langsung dibuka atau di-host statis (aman di subpath seperti GitHub Pages `/Oreedo/`).
- **Wizard Prompt & PRD Terstruktur**:
  - **Buat Prompt (6 langkah)**: menyesuaikan jenis tugas (`Kode/Web`, `Tulisan`, `Riset/Analisis`, `Gambar`) serta format AI (`Claude XML`, `ChatGPT/Gemini Markdown`, `DeepSeek/GLM ringkas`), lengkap dengan pilihan bahasa output **ID / EN**.
  - **Buat PRD (8 langkah)**: menghasilkan `PRD.md` dan `TASKS.md` sekaligus, dengan contoh adaptif untuk ke-4 jenis proyek (`Website`, `Reels / Video`, `Deck`, `Aplikasi Kecil`) dan mode kerja AI (`Chat Bertahap` vs `Coding Agent`).
- **Stepper Interaktif, Pratinjau Live & Edit Langsung**: lompat langsung antar langkah, pantau hasil secara real-time beserta hitungan kata/karakter/perkiraan token, dan edit langsung output sebelum menyalin atau mengunduh (`.md` satuan maupun bundel).
- **Pemeriksa Kualitas Lokal**: mendeteksi kolom wajib yang kosong (lengkap dengan tombol lompat `Lengkapi →`), batasan > 5 baris, kriteria yang belum terukur, serta kata samar dengan saran pengganti konkret.
- **Template, Riwayat Multi-Draf, Ekspor JSON & Berbagi Tautan**: simpan banyak snapshot di `localStorage`, ekspor/impor `.json`, serta bagikan draf lewat tautan hash URL (`#draft=...`) baik saat halaman baru dibuka maupun lewat `hashchange`.
- **Tema Terang/Gelap Adaptif & PWA Offline**: mengikuti `color-scheme` sistem dengan override manual anti-FOUC (`light-dark()` + fallback `@media`), Service Worker untuk akses offline (`sw.js`), serta manifest PWA siap pasang.
- **Laporan Bug Tanpa Server & Aksesibilitas**: halaman `bug.html` menyusun laporan Markdown untuk GitHub Issue, clipboard, atau email dengan validasi pasca-interaksi (`:user-invalid`, `aria-invalid`, live announcer), navigasi keyboard tablist + `hidden="until-found"`, dan responsif hingga viewport `360px` tanpa scroll horizontal.

## 🚀 Cara Menjalankan

1. **Langsung via web**: buka [jaiz-lana.github.io/Oreedo](https://jaiz-lana.github.io/Oreedo/).
2. **Secara lokal** (disarankan lewat server statis agar Service Worker & pemasangan PWA aktif):

```sh
python3 -m http.server 8080
# lalu buka http://localhost:8080/
```

## 🧪 Pengujian

Pengujian unit & integritas statis (`18` kasus uji) dapat dijalankan dengan Node.js (>= 18, tanpa dependensi eksternal):

```sh
node --test tests/oreedo.test.mjs
```

## 📂 Struktur Berkas

```text
.
├── index.html                  # Beranda
├── prompt.html                 # Wizard Buat Prompt (6 langkah)
├── prd.html                    # Wizard Buat PRD (8 langkah)
├── lisensi.html                # Halaman Lisensi MIT
├── kontak.html                 # Halaman Kontak
├── bug.html                    # Form Laporan Bug (GitHub Issue, Markdown, Email)
├── 404.html                    # Halaman Error 404 (aman untuk subpath GitHub Pages)
├── LICENSE                     # Teks MIT License
├── manifest.webmanifest        # Manifest PWA
├── sw.js                       # Service Worker untuk dukungan offline
├── README.md
├── tests
│   └── oreedo.test.mjs         # Unit & integrity tests (node:test)
└── assets
    ├── css
    │   └── style.css           # CSS adaptif light/dark & komponen untuk semua halaman
    ├── js
    │   ├── common.js           # Tema, toast, dialog, validasi form, util, PWA
    │   ├── prompt.js           # Logika wizard prompt, template, riwayat, output
    │   └── prd.js              # Logika wizard PRD/TASKS, tab aksesibel, template
    └── img
        ├── logo.svg            # Logo vektor Oreedo
        ├── icon-192.png        # Ikon PWA 192x192
        ├── icon-512.png        # Ikon PWA 512x512
        ├── apple-touch-icon.png
        └── og-image.png        # Gambar pratinjau Open Graph
```

## 📄 Lisensi

Kode Oreedo dirilis di bawah [MIT License](LICENSE) (`Copyright (c) 2025-2026 jaiz-lana`). Semua hasil prompt dan PRD yang kamu buat sepenuhnya milikmu.

## 💖 Dukung Proyek Ini

Jika **Oreedo** bermanfaat bagi Anda, dukungan Anda melalui **Saweria** akan sangat membantu pengembangan dan pemeliharaan proyek ini:

[![Dukung via Saweria](https://img.shields.io/badge/💖%20Dukung%20via-Saweria-FAAD14?style=for-the-badge)](https://saweria.co/jaizlana)
