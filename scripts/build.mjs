#!/usr/bin/env node
/**
 * Мінімальний білдер без залежностей.
 *
 *  dist/          — звичайний статичний PWA (index.html + ES-модулі + sw.js)
 *  dist/artifact.html — той самий застосунок одним файлом, усе інлайном
 *                       (для прев'ю там, де не можна вантажити окремі файли)
 *
 * Бандлер навмисно примітивний: він розрахований на стиль імпортів саме
 * цього проєкту (статичні відносні шляхи, без циклів, без default-експортів).
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ENTRY = 'src/app/app.js';

/* ---------- 1. простий статичний білд ---------- */
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
for (const f of ['index.html', 'config.js']) cpSync(join(ROOT, f), join(DIST, f));

// sw.js копіюється НЕ як є: у нього штампується версія збірки.
// Без цього ім'я кешу лишається незмінним між версіями, і стара оболонка
// може пережити викочування нової — саме так стара збірка на localhost
// затуляла нову близько години 18.09.2026. Нове ім'я кешу означає, що
// activate-обробник вимете все попереднє.
{
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const stamp = `${pkg.version}-${Date.now().toString(36)}`;
  const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8')
    .replace(/const CACHE = '[^']*';/, `const CACHE = 'sia-${stamp}';`);
  if (!sw.includes(`sia-${stamp}`)) {
    console.error('ПОМИЛКА: не вдалося проштампувати версію в sw.js — рядок CACHE не знайдено.');
    process.exit(1);
  }
  writeFileSync(join(DIST, 'sw.js'), sw);
  console.log(`sw.js            — кеш sia-${stamp}`);
}
cpSync(join(ROOT, 'src'), join(DIST, 'src'), { recursive: true });
cpSync(join(ROOT, 'public'), join(DIST, 'public'), { recursive: true });

/* ---------- 2. однофайловий бандл ---------- */

const modules = new Map(); // id -> {code, deps}
const order = [];

function readMod(id) {
  if (modules.has(id)) return;
  const abs = join(ROOT, id);
  if (!existsSync(abs)) throw new Error('немає модуля: ' + id);
  const src = readFileSync(abs, 'utf8');
  modules.set(id, null); // маркер «в обробці»
  const deps = [];
  const transformed = transform(src, id, (spec) => {
    const depId = normalize(relative(ROOT, resolve(dirname(abs), spec)));
    deps.push(depId);
    readMod(depId);
    return depId;
  });
  modules.set(id, { code: transformed, deps });
  order.push(id);
}

const normalize = (p) => p.split('\\').join('/');

function transform(src, id, resolveDep) {
  let out = src;

  // import { a, b as c } from './x.js'
  out = out.replace(/^[ \t]*import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?[ \t]*$/gm,
    (_, names, spec) => `const {${names.replace(/\bas\b/g, ':')}} = __req(${JSON.stringify(resolveDep(spec))});`);

  // import * as ns from './x.js'
  out = out.replace(/^[ \t]*import\s*\*\s*as\s+(\w+)\s*from\s*['"]([^'"]+)['"];?[ \t]*$/gm,
    (_, ns, spec) => `const ${ns} = __req(${JSON.stringify(resolveDep(spec))});`);

  // import './x.js'   (побічний ефект)
  out = out.replace(/^[ \t]*import\s*['"]([^'"]+)['"];?[ \t]*$/gm,
    (_, spec) => `__req(${JSON.stringify(resolveDep(spec))});`);

  // export function / export async function / export class
  out = out.replace(/^[ \t]*export\s+(async\s+function|function|class)\s+(\w+)/gm,
    (_, kw, name) => `__exp.${name} = ${name}; ${kw} ${name}`);

  // export const/let/var NAME
  out = out.replace(/^[ \t]*export\s+(const|let|var)\s+(\w+)/gm,
    (_, kw, name) => `${kw} ${name}`);

  // export { a, b as c }
  const reExports = [];
  out = out.replace(/^[ \t]*export\s*\{([^}]*)\};?[ \t]*$/gm, (_, names) => {
    for (const part of names.split(',')) {
      const t = part.trim(); if (!t) continue;
      const m = /^(\w+)(?:\s+as\s+(\w+))?$/.exec(t);
      if (m) reExports.push(`__exp.${m[2] || m[1]} = ${m[1]};`);
    }
    return '';
  });

  // зібрати експортовані const/let/var імена з ОРИГІНАЛУ
  const named = [...src.matchAll(/^[ \t]*export\s+(?:const|let|var)\s+(\w+)/gm)].map(m => m[1]);

  const tail = [...named.map(n => `__exp.${n} = ${n};`), ...reExports].join('\n');
  return `${out}\n${tail}\n`;
}

readMod(ENTRY);

const bundle = `
(function(){
  "use strict";
  var __defs = {};
  var __cache = {};
  function __req(id){
    if (__cache[id]) return __cache[id];
    var __exp = {};
    __cache[id] = __exp;
    __defs[id](__exp, __req);
    return __exp;
  }
${order.map(id => `  __defs[${JSON.stringify(id)}] = function(__exp, __req){\n${modules.get(id).code}\n  };`).join('\n')}
  __req(${JSON.stringify(ENTRY)});
})();
`;

const css = readFileSync(join(ROOT, 'src/styles.css'), 'utf8');

const artifact = `<title>Не бійся говорити</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap&subset=cyrillic,latin">
<style>
${css}
</style>
<div id="root"></div>
<script>
window.__SIA_CONFIG__ = { providerMode: 'mock', apiBaseUrl: '', build: 'artifact-preview', embedded: true };
</script>
<script>
${bundle}
</script>
`;

writeFileSync(join(DIST, 'artifact.html'), artifact);

console.log('dist/            — статичний PWA');
console.log('dist/artifact.html — однофайловий бандл, ' + (artifact.length / 1024).toFixed(0) + ' KB');
console.log('модулів у бандлі: ' + order.length);
