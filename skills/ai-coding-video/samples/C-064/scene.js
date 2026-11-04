// C-064 终端 ASCII：整个画面是一张等宽字符网格，旋转的甜甜圈按经典 donut 算法逐帧投影成字符，
// 再加荧光、扫描线和暗角模拟 CRT。由 opus40 的同名场景改写，网格行列按画幅调整。
scene({
  id: 'C-064', name: '终端 ASCII', dur: 3, still: 2.2,
  fonts: ["700 20px 'JetBrains Mono'"],
  init() { return { buf: mk(W, H) }; },
  draw(ctx, t, s, f) {
    // 竖屏 80×70 格；横屏 120×40 格，日志在左、甜甜圈在右
    const cols = LAND ? 120 : 80, rows = LAND ? 40 : 70, cw = W / cols, ch = H / rows;
    const Lg = LAND ? { log: 4, bar: 10, cur: 12, bin0: 16, bin1: 37, binW: 52, ox: 86, oy: 20, y0: 2, y1: 39, k: .8 }
                    : { log: 11, bar: 49, cur: 51, bin0: 54, bin1: 68, binW: 70, ox: 40, oy: 32, y0: 18, y1: 48, k: 1 };
    const grid = Array.from({ length: rows }, () => new Array(cols).fill(' '));
    const lum = Array.from({ length: rows }, () => new Float32Array(cols).fill(.85));
    const put = (r, c, str, l = .85) => { for (let i = 0; i < str.length && c + i < cols; i++) { if (r >= 0 && r < rows && c + i >= 0) { grid[r][c + i] = str[i]; lum[r][c + i] = l; } } };
    const logs = ['$ render --style ascii --fps 30', '[ ok ] glyph atlas ........... 12 glyphs', '[ ok ] mesh: torus  R=2.0  r=1.0', `[ .. ] rasterizing frame ${String(Math.floor(t * 30)).padStart(4, '0')}/0090`];
    let chars = Math.floor(t * 95);
    logs.forEach((l, i) => { const n = clamp(chars, 0, l.length); chars -= l.length + 6; put(Lg.log + i, 3, l.slice(0, n), i === 0 ? 1 : .7); });
    // donut
    const A = 1 + t * 1.6, B = .5 + t * .9, cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
    const zb = {}, oy = Lg.oy, ox = Lg.ox; const L = '.,-~:;=!*#$@';
    for (let j = 0; j < TAU; j += .045) {
      const ct = Math.cos(j), stt = Math.sin(j);
      for (let i = 0; i < TAU; i += .015) {
        const sp = Math.sin(i), cp = Math.cos(i), h = ct + 2, D = 1 / (sp * h * sA + stt * cA + 5), tt = sp * h * cA - stt * sA;
        const x = Math.floor(ox + 40 * Lg.k * D * (cp * h * cB - tt * sB)), y = Math.floor(oy + 20 * Lg.k * D * (cp * h * sB + tt * cB));
        const N = Math.floor(8 * ((stt * sA - sp * ct * cA) * cB - sp * ct * sA - stt * cA - cp * ct * sB));
        const k = y * cols + x;
        if (y >= Lg.y0 && y < Lg.y1 && x >= 0 && x < cols && D > (zb[k] || 0)) { zb[k] = D; grid[y][x] = L[Math.max(N, 0)]; lum[y][x] = .35 + .65 * Math.max(N, 0) / 11; }
      }
    }
    const pct = Math.floor(clamp(t / 2.8) * 100), bar = Math.floor(pct / 100 * 40);
    put(Lg.bar, 3, `[${'#'.repeat(bar)}${'.'.repeat(40 - bar)}] ${String(pct).padStart(3)}%`, .9);
    put(Lg.cur, 3, '> _'.slice(0, (f % 16 < 8) ? 3 : 2), 1);
    for (let r = Lg.bin0; r < Lg.bin1; r++) { let str = ''; for (let c = 0; c < Lg.binW; c++) str += hash2(c, r + Math.floor(t * 12)) > .5 ? (hash2(c * 3, r) > .5 ? '1' : '0') : ' '; put(r, 3, str, .25); }
    const g = s.buf.getContext('2d'); g.fillStyle = '#021006'; g.fillRect(0, 0, W, H);
    g.font = `700 ${Math.round(ch * .82)}px 'JetBrains Mono'`; g.textBaseline = 'top';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const k = grid[r][c]; if (k !== ' ') { g.fillStyle = `rgba(70,255,120,${lum[r][c]})`; g.fillText(k, c * cw + 1, r * ch + 2); } }
    ctx.drawImage(s.buf, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(9px)'; ctx.globalAlpha = .75; ctx.drawImage(s.buf, 0, 0); ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,.28)'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
    const fl = .04 * hash1(f * 7); ctx.fillStyle = `rgba(0,0,0,${fl})`; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(120,255,160,.05)'; ctx.fillRect(0, ((t * 700) % (H + 200)) - 200, W, 120);
    vignette(ctx, .8, .3);
  }
});
