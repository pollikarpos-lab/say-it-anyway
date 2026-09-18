#!/usr/bin/env node
// Статичний сервер без залежностей. node scripts/serve.mjs [port] [dir]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, normalize } from 'node:path';

const port = Number(process.argv[2] || 5173);
const base = resolve(process.argv[3] || '.');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webm': 'audio/webm',
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/') p = '/index.html';
    const file = join(base, normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(base)) { res.writeHead(403).end('forbidden'); return; }
    const s = await stat(file).catch(() => null);
    const target = s && s.isDirectory() ? join(file, 'index.html') : file;
    const body = await readFile(target);
    res.writeHead(200, {
      'content-type': TYPES[extname(target)] || 'application/octet-stream',
      'cache-control': 'no-store',
      'service-worker-allowed': '/',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404');
  }
}).listen(port, () => console.log(`http://localhost:${port}  (root: ${base})`));
