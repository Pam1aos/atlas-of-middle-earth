// Drive a local Edge instance over CDP to capture screenshots.
import fs from 'node:fs';
import path from 'node:path';

const PORT = 9333;
const OUT = path.resolve('screenshots');
fs.mkdirSync(OUT, { recursive: true });

async function json(url, opts) {
  const r = await fetch(url, opts);
  return r.json();
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
      } else if (m.method) {
        (this.handlers.get(m.method) || []).forEach((h) => h(m.params));
      }
    });
  }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', rej, { once: true });
    });
    return new CDP(ws);
  }
  on(m, f) { if (!this.handlers.has(m)) this.handlers.set(m, []); this.handlers.get(m).push(f); }
  send(method, params = {}, timeout = 90000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(id); reject(new Error('timeout ' + method)); }, timeout);
      this.pending.set(id, { resolve: (v) => { clearTimeout(t); resolve(v); }, reject: (e) => { clearTimeout(t); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression, awaitPromise = true) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
    return r.result.value;
  }
}

const targets = await json(`http://127.0.0.1:${PORT}/json/list`);
const page = targets.find((t) => t.type === 'page' && t.url.startsWith('http')) || targets.find((t) => t.type === 'page');
if (!page) throw new Error('no page target');
const cdp = await CDP.connect(page.webSocketDebuggerUrl);
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

const BASE = process.env.BASE || 'http://127.0.0.1:4321';

const shots = [
  { name: 'home-desktop', url: '/', w: 1440, h: 900, full: true },
  { name: 'browse-desktop', url: '/browse/?type=character', w: 1440, h: 900, wait: 1200 },
  { name: 'entry-desktop', url: '/entry/%E9%98%BF%E6%8B%89%E8%B4%A1/', w: 1440, h: 1000 },
  { name: 'graph-desktop', url: '/graph/?focus=%E9%98%BF%E6%8B%89%E8%B4%A1', w: 1440, h: 900, wait: 3500 },
  { name: 'timeline-desktop', url: '/timeline/', w: 1440, h: 900, full: true },
  { name: 'atlas-desktop', url: '/atlas/', w: 1440, h: 900, full: true },
  { name: 'home-mobile', url: '/', w: 390, h: 844, mobile: true, full: true },
  { name: 'entry-mobile', url: '/entry/%E9%98%BF%E6%8B%89%E8%B4%A1/', w: 390, h: 844, mobile: true },
  { name: 'graph-mobile', url: '/graph/?focus=%E5%B1%B1%E5%A7%86', w: 390, h: 844, mobile: true, wait: 3000 },
  { name: 'browse-tablet', url: '/browse/', w: 768, h: 1024, mobile: true, wait: 900 },
];

const errors = [];
cdp.on('Runtime.exceptionThrown', (p) => errors.push(p?.exceptionDetails?.text || 'exception'));

for (const s of shots) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: s.w, height: s.h, deviceScaleFactor: s.mobile ? 2 : 1, mobile: !!s.mobile,
  });
  await cdp.send('Page.navigate', { url: BASE + s.url });
  await new Promise((r) => setTimeout(r, s.wait ?? 1400));
  await cdp.evaluate('document.fonts?.ready ? document.fonts.ready.then(()=>true) : true');
  await new Promise((r) => setTimeout(r, 300));

  let clip;
  let captureBeyondViewport = false;
  if (s.full) {
    const h = await cdp.evaluate('Math.min(6000, Math.max(document.body.scrollHeight, document.documentElement.scrollHeight))');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: s.w, height: Math.max(s.h, Math.min(4200, h)), deviceScaleFactor: s.mobile ? 2 : 1, mobile: !!s.mobile,
    });
    await new Promise((r) => setTimeout(r, 500));
  }
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport });
  fs.writeFileSync(path.join(OUT, `${s.name}.png`), Buffer.from(data, 'base64'));
  console.log('shot', s.name);

  if (s.full) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: s.mobile ? 2 : 1, mobile: !!s.mobile });
  }
}

// console errors on the graph page
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await cdp.send('Page.navigate', { url: BASE + '/graph/' });
await new Promise((r) => setTimeout(r, 4000));
const status = await cdp.evaluate('document.querySelector(".graph-status")?.textContent || "no status"');
console.log('graph status:', status);
console.log('runtime errors:', errors.slice(0, 5));
process.exit(0);
