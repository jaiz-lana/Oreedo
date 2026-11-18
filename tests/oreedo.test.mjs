import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const common = require('../assets/js/common.js');
const promptMod = require('../assets/js/prompt.js');
const prdMod = require('../assets/js/prd.js');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

/* ==================== common.js ==================== */

test('common.escapeHtml meng-escape karakter berbahaya', () => {
  assert.equal(
    common.escapeHtml(`<script>alert("x" & 'y')</script>`),
    '&lt;script&gt;alert(&quot;x&quot; &amp; &#39;y&#39;)&lt;/script&gt;'
  );
  assert.equal(common.escapeHtml(null), '');
});

test('common.textStats menghitung karakter, kata, baris, dan estimasi token', () => {
  assert.deepEqual(common.textStats(''), { chars: 0, words: 0, lines: 0, tokens: 0 });
  assert.deepEqual(common.textStats('   \n  '), { chars: 6, words: 0, lines: 0, tokens: 0 });

  const stats = common.textStats('Satu dua tiga\nEmpat lima');
  assert.equal(stats.words, 5);
  assert.equal(stats.lines, 2);
  assert.equal(stats.chars, 24);
  assert.ok(stats.tokens >= 5);
});

test('common.findVagueWords menghormati batas kata penuh dan memberi saran', () => {
  // Jangan salah deteksi kata turunan/majemuk yang wajar
  const falsePositives = common.findVagueWords('Optimalkan kecepatan muat lewat optimalisasi SQL agar terasa cepatnya? Tidak: ini kecepatan!');
  assert.equal(falsePositives.length, 0);

  // Harus mendeteksi kata samar utuh termasuk frasa dua kata
  const matches = common.findVagueWords('Buat desain yang modern, cepat, optimal, dan luar biasa.');
  const words = matches.map((m) => m.word);
  assert.ok(words.includes('modern'));
  assert.ok(words.includes('cepat'));
  assert.ok(words.includes('optimal'));
  assert.ok(words.includes('luar biasa'));
  for (const m of matches) {
    assert.ok(typeof m.suggestion === 'string' && m.suggestion.length > 10);
  }
});

test('common.hash melakukan round-trip UTF-8 dan memvalidasi jenis draf', () => {
  const sample = {
    tujuan: 'Bangun web — cepat & rapi 🌱',
    hasil: '1 file HTML + CSS (≤ 50 KB)'
  };
  const encoded = common.hash.encodeDraft('prompt', sample);
  assert.ok(encoded.startsWith('#draft='));

  const decoded = common.hash.decodeDraft('prompt', encoded);
  assert.deepEqual(decoded, sample);

  // Jenis salah atau rusak harus mengembalikan null
  assert.equal(common.hash.decodeDraft('prd', encoded), null);
  assert.equal(common.hash.decodeDraft('prompt', '#other=123'), null);
  assert.equal(common.hash.decodeDraft('prompt', '#draft=%%%not-base64%%%'), null);
});

/* ==================== prompt.js ==================== */

test('prompt.buildPrompt selalu menyertakan state.hasil di ketiga format AI (ID & EN)', () => {
  const base = Object.assign(promptMod.createDefaultState(), {
    taskType: 'kode',
    tujuan: 'Membuat kalkulator zakat web.',
    hasil: 'DELIVERABLE_UNIK_HTML_MANDIRI',
    konteks: 'Dipakai di ponsel 360px.',
    bahan: 'Rumus nisab emas.',
    langkah: '1. Form\n2. Hitung',
    batasan: 'Tanpa framework',
    format: 'HTML lengkap',
    kriteria: 'Ketika nominal diisi, maka hasil tampil otomatis.'
  });

  for (const aiTarget of ['claude', 'chatgpt', 'deepseek']) {
    for (const outputLang of ['id', 'en']) {
      const out = promptMod.buildPrompt(Object.assign({}, base, { aiTarget, outputLang }));
      assert.ok(out.includes('DELIVERABLE_UNIK_HTML_MANDIRI'), `Missing hasil for ${aiTarget}/${outputLang}`);
    }
  }
});

test('prompt.buildPrompt memakai label/tag khusus untuk tugas gambar', () => {
  const st = Object.assign(promptMod.createDefaultState(), {
    taskType: 'gambar',
    aiTarget: 'claude',
    outputLang: 'id',
    tujuan: 'Ilustrasi cangkir teh di meja kayu.',
    hasil: '16:9 flat editorial'
  });
  const idOut = promptMod.buildPrompt(st);
  assert.ok(idOut.includes('<subjek_dan_tujuan>'));
  assert.ok(idOut.includes('<hasil_dan_rasio>'));
  assert.ok(idOut.includes('<arahan_komposisi>'));

  const enOut = promptMod.buildPrompt(Object.assign({}, st, { outputLang: 'en' }));
  assert.ok(enOut.includes('<subject_and_goal>'));
  assert.ok(enOut.includes('<aspect_and_deliverable>'));
  assert.ok(enOut.includes('<negative_constraints>'));
});

test('prompt.evaluateQuality memeriksa kolom wajib, batasan (>5 & kata samar), kriteria, serta step jump', () => {
  const empty = promptMod.createDefaultState();
  const resEmpty = promptMod.evaluateQuality(empty);
  const badKeys = resEmpty.filter((i) => i.type === 'bad').map((i) => i.key);
  assert.deepEqual(badKeys.sort(), ['format', 'hasil', 'kriteria', 'tujuan'].sort());
  for (const item of resEmpty) {
    assert.ok(item.step >= 1 && item.step <= 5);
  }

  const noisy = Object.assign(promptMod.createDefaultState(), {
    tujuan: 'Buat halaman profil',
    hasil: 'Satu file HTML',
    format: 'Markdown',
    batasan: 'satu\ndua\ntiga\nempat\nlima\noptimal banget',
    kriteria: 'beres semua'
  });
  const resNoisy = promptMod.evaluateQuality(noisy);
  assert.ok(resNoisy.some((i) => i.type === 'bad' && i.key === 'batasan'));
  assert.ok(resNoisy.some((i) => i.type === 'warn' && i.text.includes('"optimal"')));
  assert.ok(resNoisy.some((i) => i.type === 'warn' && i.key === 'kriteria'));
});

test('semua template prompt bebas error wajib dan kata samar', () => {
  assert.ok(promptMod.TEMPLATES.length >= 6);
  for (const tpl of promptMod.TEMPLATES) {
    const st = Object.assign(promptMod.createDefaultState(), tpl.data, {
      taskType: tpl.taskType,
      aiTarget: tpl.aiTarget
    });
    const issues = promptMod.evaluateQuality(st);
    const bad = issues.filter((i) => i.type === 'bad');
    assert.equal(bad.length, 0, `Template ${tpl.id} gagal kelengkapan wajib`);
  }
});

/* ==================== prd.js ==================== */

test('prd.EXAMPLES adaptif dan unik untuk keempat jenis proyek', () => {
  const types = ['website', 'reels', 'deck', 'app'];
  const seenNames = new Set();

  for (const type of types) {
    const ex = prdMod.EXAMPLES[type];
    assert.ok(ex, `Contoh tidak ditemukan untuk ${type}`);
    assert.equal(ex.projectType, type);
    assert.ok(!seenNames.has(ex.namaProyek), `Nama proyek duplikat di ${type}`);
    seenNames.add(ex.namaProyek);

    const st = Object.assign(prdMod.createDefaultState(), ex);
    const issues = prdMod.evaluatePrdQuality(st);
    const bad = issues.filter((i) => i.type === 'bad');
    assert.equal(bad.length, 0, `Contoh ${type} seharusnya lolos semua field wajib`);
  }
});

test('prd.buildPrd dan prd.buildTasks mendukung ID/EN dan mode chat vs coding agent', () => {
  const st = Object.assign(prdMod.createDefaultState(), prdMod.EXAMPLES.app);

  const prdId = prdMod.buildPrd(st);
  assert.ok(prdId.includes('# PRD: CatatSaku'));
  assert.ok(prdId.includes('## 6. Layar / Alur'));

  const prdEn = prdMod.buildPrd(Object.assign({}, st, { outputLang: 'en' }));
  assert.ok(prdEn.includes('# PRD: CatatSaku'));
  assert.ok(prdEn.includes('## 6. Screens / User Flows'));
  assert.ok(prdEn.includes('## 10. Acceptance Criteria'));

  const tasksChat = prdMod.buildTasks(Object.assign({}, st, { agentMode: 'chat' }));
  assert.ok(tasksChat.includes('tunggu saya mengetik "lanjut"'));

  const tasksAgent = prdMod.buildTasks(Object.assign({}, st, { agentMode: 'agent' }));
  assert.ok(!tasksAgent.includes('tunggu saya mengetik "lanjut"'));
  assert.ok(tasksAgent.includes('Tahap 1 hingga 4'));

  const tasksEnAgent = prdMod.buildTasks(Object.assign({}, st, { outputLang: 'en', agentMode: 'agent' }));
  assert.ok(tasksEnAgent.includes('# TASKS: CatatSaku'));
  assert.ok(tasksEnAgent.includes('Verify each phase works'));
});

test('prd.evaluatePrdQuality mendeteksi field wajib, kebutuhan berlebih (>10), dan kata samar', () => {
  const empty = prdMod.createDefaultState();
  const resEmpty = prdMod.evaluatePrdQuality(empty);
  const badKeys = resEmpty.filter((i) => i.type === 'bad').map((i) => i.key);
  assert.deepEqual(badKeys.sort(), prdMod.REQUIRED.slice().sort());

  const noisy = Object.assign(prdMod.createDefaultState(), prdMod.EXAMPLES.website, {
    kebutuhan: Array.from({ length: 12 }, (_, idx) => `Fitur ${idx + 1}`).join('\n'),
    ide: 'Aplikasi yang paling bagus dan keren'
  });
  const resNoisy = prdMod.evaluatePrdQuality(noisy);
  assert.ok(resNoisy.some((i) => i.key === 'kebutuhan'));
  assert.ok(resNoisy.some((i) => i.text.includes('"bagus"')));
});

/* ==================== Integritas HTML, PWA & Aset Statis ==================== */

const HTML_PAGES = [
  'index.html',
  'prompt.html',
  'prd.html',
  'bug.html',
  'kontak.html',
  'lisensi.html',
  '404.html'
];

test('semua halaman HTML memuat metadata tema adaptif, toggle tema, PWA install, dan tautan lokal valid', () => {
  for (const page of HTML_PAGES) {
    const html = readRepoFile(page);
    assert.ok(html.includes('<meta name="color-scheme" content="light dark">'), `${page}: meta color-scheme hilang`);
    assert.ok(html.includes("localStorage.getItem('oreedo:theme')"), `${page}: skrip anti-FOUC hilang`);
    assert.ok(html.includes('id="theme-toggle"'), `${page}: #theme-toggle hilang`);
    assert.ok(html.includes('id="btn-install"'), `${page}: #btn-install hilang`);
    assert.ok(html.includes('href="manifest.webmanifest"'), `${page}: link manifest hilang`);

    // Pastikan tidak ada URL relatif mengarah ke berkas lokal yang tidak ada
    const attrRegex = /\b(?:href|src)="([^"#?]+)(?:\?[^"#]*)?(?:#[^"]*)?"/g;
    let m;
    while ((m = attrRegex.exec(html)) !== null) {
      const target = m[1];
      if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(target)) continue;
      assert.ok(!target.startsWith('/'), `${page}: path absolut terlarang ditemukan: ${target}`);
      const resolved = path.join(ROOT, target);
      assert.ok(fs.existsSync(resolved), `${page}: target lokal tidak ada: ${target}`);
    }
  }
});

test('bug.html memakai repo GitHub valid, data-error dinamis, dan tombol salin Markdown', () => {
  const html = readRepoFile('bug.html');
  assert.ok(html.includes("var GITHUB_USER = 'jaiz-lana';"));
  assert.ok(html.includes("var GITHUB_REPO = 'Oreedo';"));
  assert.ok(!html.includes("GITHUB_USER = 'https://"));
  assert.ok(html.includes('id="btn-copy-report"'));
  assert.ok(html.includes('data-error="err-judul"'));
  assert.ok(!html.includes('aria-describedby="err-'));
  assert.ok(!html.includes('aria-describedby="bug-error'));
});

test('lisensi.html dan LICENSE konsisten serta bebas atribusi Nunito', () => {
  const html = readRepoFile('lisensi.html');
  const license = readRepoFile('LICENSE');
  assert.ok(license.includes('Copyright (c) 2025-2026 jaiz-lana'));
  assert.ok(html.includes('Copyright (c) 2025-2026 jaiz-lana'));
  assert.ok(!html.includes('Nunito'));
});

test('prd.html mengikuti struktur tabs aksesibel (tanpa aria-controls, panel tersembunyi pakai hidden="until-found")', () => {
  const html = readRepoFile('prd.html');
  assert.ok(html.includes('role="tablist"'));
  assert.ok(!/role="tab"[^>]*aria-controls=/.test(html));
  assert.ok(html.includes('id="panel-tasks" role="tabpanel" aria-labelledby="tab-tasks" hidden="until-found"'));
});

test('404.html memuat skrip <base> dinamis sebelum link relatif', () => {
  const html = readRepoFile('404.html');
  const baseScriptIdx = html.indexOf("document.createElement('base')");
  const cssLinkIdx = html.indexOf('href="assets/css/style.css"');
  assert.ok(baseScriptIdx !== -1 && cssLinkIdx !== -1 && baseScriptIdx < cssLinkIdx);
});

test('sw.js dan manifest.webmanifest hanya mereferensikan aset lokal yang ada di disk', () => {
  const sw = readRepoFile('sw.js');
  const assetMatches = sw.match(/'(\.\/[^']*)'/g) || [];
  assert.ok(assetMatches.length >= 10);
  for (const quoted of assetMatches) {
    const rel = quoted.slice(1, -1);
    const target = rel === './' ? 'index.html' : rel.slice(2);
    assert.ok(fs.existsSync(path.join(ROOT, target)), `Aset sw.js hilang: ${rel}`);
  }

  const manifest = JSON.parse(readRepoFile('manifest.webmanifest'));
  assert.equal(manifest.start_url, './index.html');
  assert.equal(manifest.scope, './');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3);
  for (const icon of manifest.icons) {
    assert.ok(fs.existsSync(path.join(ROOT, icon.src)), `Ikon manifest hilang: ${icon.src}`);
  }
});

test('skrip wizard menangani hashchange (#draft=), bug.html menunggu DOMContentLoaded, dan style.css memakai token --link', () => {
  const promptJs = readRepoFile('assets/js/prompt.js');
  const prdJs = readRepoFile('assets/js/prd.js');
  const bugHtml = readRepoFile('bug.html');
  const styleCss = readRepoFile('assets/css/style.css');

  assert.ok(promptJs.includes("window.addEventListener('hashchange'"), 'prompt.js harus memantau hashchange');
  assert.ok(prdJs.includes("window.addEventListener('hashchange'"), 'prd.js harus memantau hashchange');
  assert.ok(bugHtml.includes('startBugPage'), 'bug.html harus menunda akses window.Oreedo hingga siap');
  assert.ok(bugHtml.includes("document.addEventListener('DOMContentLoaded', startBugPage)"), 'bug.html harus menunggu DOMContentLoaded untuk common.js defer');
  assert.ok(styleCss.includes('color: var(--link);'), 'style.css harus memakai token --link');
  assert.ok(!/:root:has\([^)]*\)\s+a\s*\{/.test(styleCss), 'style.css tidak boleh memakai :root:has(...) a berspesifisitas tinggi yang menimpa .btn-primary');
});
