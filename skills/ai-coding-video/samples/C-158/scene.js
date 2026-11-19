// C-158 大理石纹染纸：每一滴颜料和每一次梳子都是一个精确可逆的平面变形（滴下：圆外的点沿半径被推开，面积守恒；梳子：点沿梳齿方向平移，移动量随到最近梳齿的距离衰减）；每帧对每个像素从最后一步往前倒推回去，看它最早落在哪一滴里就取那一滴的颜色，离那一滴边缘很近的加深成纹脉，再撒一点颜料颗粒；变形量都只由时间决定，所以最后把梳子的量往回拉，图案就一丝不差地梳回原样。
// 风格提示词：用大理石纹染纸风格：颜料浮在水槽表面，被一滴滴落下的颜色推开成同心圈，再被梳子拉成羽毛纹和孔雀纹，色与色交界处有细细的深色纹脉和颜料颗粒，每次变形都能精确倒放、让图案被梳回原样，配色是靛蓝、赭红、芥末黄和象牙白。
// 题材：纸艺、材质与定格 · 适合：记忆与时间、水与风、抽象音乐 MV
scene({
  id: 'C-158', name: '大理石纹染纸', dur: 5, still: 3.9,
  fonts: [],
  init() {
    const u = SHORT / 1080, PAL = ['#26407A', '#A8432E', '#C9A23A', '#F1EADB'].map(hex2rgb), drops = [];
    const C = (LAND ? [[.5, .5, 10, 150], [.17, .25, 4, 110], [.83, .75, 4, 110], [.83, .25, 4, 105], [.17, .75, 4, 105], [.33, .12, 3, 90], [.67, .88, 3, 90], [.67, .12, 3, 90], [.33, .88, 3, 90]]
                    : [[.5, .48, 10, 150], [.25, .18, 4, 110], [.75, .8, 4, 110], [.78, .2, 4, 105], [.22, .8, 4, 105], [.2, .48, 3, 95], [.8, .5, 3, 95], [.5, .06, 3, 90], [.5, .94, 3, 90]]);
    const seq = [];
    C.forEach(([x, y, n, r], ci) => { for (let i = 0; i < n; i++) seq.push({ c: [x * W, y * H], r: r * u * (1 - i * .03), col: PAL[(i + ci) % 4], o: i + (ci ? .5 * (ci % 2) : .25) }); });
    // 交错落下：每处一滴一滴轮着来
    seq.sort((a, b) => a.o - b.o);
    seq.forEach((d, i) => { d.t0 = .1 + i * 1.6 / seq.length; d.dur = .3; drops.push(d); });
    const combs = [
      { M: [0, 1], s: 70 * u, off: 0, A: 150 * u, lam: 18 * u, t0: 1.85, t1: 2.55 },
      { M: [0, -1], s: 70 * u, off: 35 * u, A: 120 * u, lam: 14 * u, t0: 2.65, t1: 3.3 },
      { M: [1, 0], s: 140 * u, off: 0, A: 90 * u, lam: 30 * u, t0: 3.35, t1: 3.85 },
    ];
    // 倒放：4.1 秒以后后两次梳子按原路退回
    combs[1].back = [4.45, 4.9]; combs[2].back = [4.05, 4.45];
    const sc = LAND ? .75 : .75, w = Math.round(W * sc), h = Math.round(H * sc);
    return { drops, combs, w, h, sc, cv: mk(w, h), id: null, u };
  },
  draw(ctx, t, s) {
    const { drops, combs, w, h, sc } = s, u = s.u, g = s.cv.getContext('2d'); if (!s.id) s.id = g.createImageData(w, h);
    const d = s.id.data;
    // 本帧每一步的量
    const ops = [];
    for (const D of drops) { const r = D.r * eOutCubic(inv(D.t0, D.t0 + D.dur, t)); if (r > 0) ops.push({ k: 0, t: D.t0, cx: D.c[0], cy: D.c[1], r2: r * r, r, col: D.col }); }
    for (const K of combs) { let a = K.A * eInOutCubic(inv(K.t0, K.t1, t)); if (K.back) a *= 1 - eInOutCubic(inv(K.back[0], K.back[1], t)); if (a > .01) ops.push({ k: 1, t: K.t0, a, M: K.M, N: [-K.M[1], K.M[0]], s: K.s, off: K.off, lam: K.lam }); }
    ops.sort((a, b) => b.t - a.t);
    const vein = 2 * u, base = [239, 232, 216];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let px = (x + .5) / sc, py = (y + .5) / sc, col = null, e = 0;
      for (let i = 0; i < ops.length; i++) {
        const o = ops[i];
        if (o.k) { const pn = px * o.N[0] + py * o.N[1] - o.off, m = ((pn % o.s) + o.s) % o.s, dd = Math.min(m, o.s - m), z = o.a * o.lam / (dd + o.lam); px -= z * o.M[0]; py -= z * o.M[1]; }
        else { const dx = px - o.cx, dy = py - o.cy, q = dx * dx + dy * dy; if (q < o.r2) { col = o.col; e = o.r - Math.sqrt(q); break; } const f = Math.sqrt(1 - o.r2 / q); px = o.cx + dx * f; py = o.cy + dy * f; }
      }
      const j = (y * w + x) * 4, n = hash2(x * 3 + 1, y * 5), gr = n > .985 ? .7 : 1;
      if (!col) { d[j] = base[0] * gr; d[j + 1] = base[1] * gr; d[j + 2] = base[2] * gr; }
      else { const v = e < vein ? .45 + .55 * e / vein : 1, k = v * (n > .97 ? .8 : 1) * (.96 + .04 * Math.sin(px * .05 + py * .03)); d[j] = col[0] * k; d[j + 1] = col[1] * k; d[j + 2] = col[2] * k; }
      d[j + 3] = 255;
    }
    g.putImageData(s.id, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(s.cv, 0, 0, W, H);
    // 刚落下的那一滴：一圈水波
    for (const D of drops) { const q = inv(D.t0, D.t0 + .45, t); if (q <= 0 || q >= 1) continue; ctx.strokeStyle = `rgba(255,255,255,${.5 * (1 - q)})`; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(D.c[0], D.c[1], D.r * (.6 + q * .8), 0, TAU); ctx.stroke(); }
    // 梳子：横在水面上方移动
    for (const K of combs) {
      const segs = [[K.t0, K.t1, 0, 1]]; if (K.back) segs.push([K.back[0], K.back[1], 1, 0]);
      for (const [a, b, p0, p1] of segs) {
        const q = inv(a - .15, b + .15, t); if (q <= 0 || q >= 1) continue; const p = lerp(p0, p1, eInOutCubic(q));
        const along = K.M[1] ? (K.M[1] > 0 ? lerp(-.1, 1.1, p) * H : lerp(1.1, -.1, p) * H) : lerp(-.1, 1.1, p) * W;
        ctx.save(); ctx.globalAlpha = smooth(0, .12, q) * smooth(1, .88, q);
        if (K.M[1]) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, along + 14 * u, W, 26 * u); ctx.fillStyle = '#6B4A2E'; ctx.fillRect(0, along - 40 * u, W, 26 * u); ctx.fillStyle = '#B8BDC4'; for (let x = K.off % K.s; x < W; x += K.s) ctx.fillRect(x - 2 * u, along - 14 * u, 4 * u, 40 * u); }
        else { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(along + 14 * u, 0, 26 * u, H); ctx.fillStyle = '#6B4A2E'; ctx.fillRect(along - 40 * u, 0, 26 * u, H); ctx.fillStyle = '#B8BDC4'; for (let y = K.off % K.s; y < H; y += K.s) ctx.fillRect(along - 14 * u, y - 2 * u, 40 * u, 4 * u); }
        ctx.restore();
      }
    }
    // 水槽边
    ctx.strokeStyle = '#3B2A1C'; ctx.lineWidth = 36 * u; ctx.strokeRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2 * u; ctx.strokeRect(18 * u, 18 * u, W - 36 * u, H - 36 * u);
    vignette(ctx, .3, .5);
  }
});