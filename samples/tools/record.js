// 录屏：照 spec 的 steps 操作页面，录下 webm，同时记鼠标轨迹。由 tools/assets.py 的 record() 调用：
//   node tools/record.js <spec.json> <输出目录>      spec = {url, size: [宽, 高], steps}
// 输出目录里写 video.webm 和 track.json（[[秒, x, y, 是否按下], …]，坐标是 0–1）。
// 用 Node 版 Playwright：它和云端容器预装的 Chromium、录像用的 ffmpeg 版本配套；CHROME 可指定浏览器
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [specFile, out] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const [w, h] = spec.size || [1280, 720];
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const exe = process.env.CHROME;
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  const ctx = await b.newContext({ locale: spec.locale || 'zh-CN', viewport: { width: w, height: h }, recordVideo: { dir: out, size: { width: w, height: h } } });
  const t0 = Date.now(), track = [], pos = [w / 2, h / 2];
  const pg = await ctx.newPage();
  await pg.goto(spec.url); await pg.waitForLoadState('load');
  const log = (down = 0) => track.push([+((Date.now() - t0) / 1000).toFixed(3), +(pos[0] / w).toFixed(4), +(pos[1] / h).toFixed(4), down]);
  const ease = k => k * k * (3 - 2 * k);
  async function glide(x, y, dur) {
    const n = Math.max(2, Math.round(dur * 30)), [x0, y0] = pos;
    for (let i = 1; i <= n; i++) { const k = ease(i / n); pos[0] = x0 + (x - x0) * k; pos[1] = y0 + (y - y0) * k; await pg.mouse.move(pos[0], pos[1]); log(); await sleep(dur * 1000 / n); }
  }
  async function center(sel) { const bb = await pg.locator(sel).first().boundingBox(); return [bb.x + bb.width / 2, bb.y + bb.height / 2]; }
  log();
  for (const [op, ...a] of spec.steps) {
    if (op === 'wait') { const end = Date.now() + a[0] * 1000; while (Date.now() < end) { log(); await sleep(1000 / 30); } }
    else if (op === 'move' || op === 'click') {
      const [x, y] = await center(a[0]); await glide(x, y, a[1] ?? .7);
      if (op === 'click') { await pg.mouse.down(); log(1); await sleep(80); await pg.mouse.up(); log(); }
    } else if (op === 'scroll') {
      const y = await pg.evaluate(([s, off]) => document.querySelector(s).getBoundingClientRect().top + scrollY - off, [a[0], a[1] || 0]);
      await pg.evaluate(v => scrollTo({ top: v, behavior: 'smooth' }), y);     // 浏览器自己平滑滚动（逐帧调 scrollTo 在大页面上太慢）
      const end = Date.now() + (a[2] ?? 1.2) * 1000; while (Date.now() < end) { log(); await sleep(1000 / 30); }
    } else if (op === 'key') { await pg.keyboard.press(a[0]); log(); }
  }
  log();
  const v = pg.video();
  await pg.close(); await ctx.close(); await b.close();
  fs.renameSync(await v.path(), path.join(out, 'video.webm'));
  fs.writeFileSync(path.join(out, 'track.json'), JSON.stringify(track));
})().catch(e => { console.error(e.message); process.exit(1); });
