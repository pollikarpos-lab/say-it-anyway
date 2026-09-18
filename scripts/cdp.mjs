// Крихітний CDP-клієнт на вбудованому в Node 22 WebSocket. Без залежностей.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export async function launch({ width = 390, height = 844, dsf = 2 } = {}) {
  const userDataDir = mkdtempSync(join(tmpdir(), 'sia-chrome-'));
  const proc = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=0', '--no-sandbox', '--disable-gpu',
    '--disable-dev-shm-usage', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
    `--user-data-dir=${userDataDir}`,
    `--window-size=${width},${height}`,
    '--force-device-scale-factor=' + dsf,
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const t = setTimeout(() => rej(new Error('chrome не стартував')), 20000);
    proc.stderr.on('data', (d) => {
      buf += d.toString();
      const m = /ws:\/\/[^\s]+/.exec(buf);
      if (m) { clearTimeout(t); res(m[0]); }
    });
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method) listeners.forEach(fn => fn(msg));
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);

  await S('Page.enable'); await S('Runtime.enable'); await S('Log.enable');
  await S('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dsf, mobile: true });

  const logs = [];
  listeners.push((msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      logs.push({ level: 'error', text: (d.exception && (d.exception.description || d.exception.value)) || d.text });
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      logs.push({ level: msg.params.type, text: msg.params.args.map(a => a.value ?? a.description ?? '').join(' ') });
    }
    if (msg.method === 'Log.entryAdded') logs.push({ level: msg.params.entry.level, text: msg.params.entry.text });
  });

  const api = {
    logs,
    async goto(url) {
      await S('Page.navigate', { url });
      await new Promise(r => setTimeout(r, 900));
    },
    async eval(expr) {
      const r = await S('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
      return r.result.value;
    },
    async shot(path, { full = false } = {}) {
      const params = { format: 'png', captureBeyondViewport: full };
      if (full) {
        const m = await S('Page.getLayoutMetrics');
        const h = Math.min(4000, Math.ceil(m.cssContentSize.height));
        params.clip = { x: 0, y: 0, width, height: h, scale: 1 };
      }
      const { data } = await S('Page.captureScreenshot', params);
      const { writeFileSync } = await import('node:fs');
      writeFileSync(path, Buffer.from(data, 'base64'));
      return path;
    },
    async setViewport(w, hh, scale = dsf) {
      width = w; height = hh;
      await S('Emulation.setDeviceMetricsOverride', { width: w, height: hh, deviceScaleFactor: scale, mobile: true });
    },
    async close() { try { ws.close(); } catch {} proc.kill('SIGKILL'); },
  };
  return api;
}
