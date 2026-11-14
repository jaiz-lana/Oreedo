<p align="center">
  <img src="assets/img/logo.svg" alt="Oreedo Logo" width="120" height="120" />
</p>

<h1 align="center">Oreedo</h1>

<p align="center">
  <strong>Mesin pembuat prompt AI dan PRD yang berjalan sepenuhnya di browser.</strong><br>
  Isi form singkat, dapatkan prompt atau <code>PRD.md</code> + <code>TASKS.md</code> yang siap tempel ke ChatGPT, Claude, Gemini, DeepSeek, atau GLM.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/License-MIT-16a34a?style=flat-square" alt="MIT License" />
</p>

---

## ✨ Fitur

- **Tanpa Framework**: HTML, CSS, dan JavaScript murni. Tanpa build tool.
- **Privasi Terjaga**: Semua proses berjalan di browser. Tidak ada data yang dikirim ke server.
- **Penyimpanan Lokal**: Draf isian tersimpan otomatis di `localStorage` (dibungkus `try/catch`).
- **Responsif**: Mobile-first, diuji tanpa scroll horizontal di layar 360px.
- **Aksesibilitas**: HTML semantik, fokus keyboard jelas, dan menghormati `prefers-reduced-motion`.
- **Siap GitHub Pages**: Semua tautan dan aset memakai path relatif, aman di subfolder repo.

## 📂 Struktur Berkas

```text
.
├── index.html          # Beranda
├── prompt.html         # Wizard Buat Prompt
├── prd.html            # Wizard Buat PRD (8 langkah)
├── lisensi.html        # Halaman Lisensi MIT
├── kontak.html         # Halaman Kontak
├── bug.html            # Form Laporan Bug
├── 404.html            # Halaman Error 404
├── README.md
└── assets
    ├── css
    │   └── style.css   # Satu CSS untuk semua halaman
    ├── js
    │   ├── common.js   # JS bersama (navbar, toast, util)
    │   ├── prompt.js   # Logika wizard prompt
    │   └── prd.js      # Logika wizard PRD
    └── img
        └── logo.svg    # Logo Oreedo
