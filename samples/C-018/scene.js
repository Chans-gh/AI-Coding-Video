// C-018 木刻：整块版先是全黑，明暗图（灯塔、光束、海面倒影）交给 hatchLines 的 light 模式，只在亮处铺两头收尖的白色刀痕，越亮刀痕越宽、连成一片；刀痕按每秒 12 格一刀刀刻出来，唯一的颜色是灯火的橙黄，从刻掉的地方透出来。
// 风格提示词：用木刻版画风格：每一帧都是一块涂黑的木板，光只存在于被刀刻掉的地方，用密集的平行刀痕表现明暗和质感，画面是随着刻刀一道道刻出来的，最多加一种颜色，只给火、炉、灯这类“燃烧的东西”。
// 题材：印刷、版画与装饰 · 适合：严肃寓言、历史
scene({
  id: 'C-018', name: '木刻', dur: 5, still: 4.6,
  fonts: ["900 120px 'Noto Serif SC'"],
  text: '守灯人',
  init() {
    const u = SHORT / 1080;
    // 构图：横屏灯塔在右、题字在左下；竖屏灯塔居中偏上、题字在下
    const k = (LAND ? 1 : 1.05) * u, ax = LAND ? W * .66 : W * .56, hz = LAND ? H * .66 : H * .6;
    const lamp = [ax, hz - (LAND ? 470 : 640) * k];
    const tb = hz + 40 * k, tw0 = 70 * k, tw1 = 105 * k;                                   // 塔：底宽、顶窄
    const rockP = [[ax - 300 * k, hz + 150 * k], [ax - 250 * k, hz + 60 * k], [ax - 150 * k, hz + 10 * k], [ax - 40 * k, tb - 10 * k], [ax + 120 * k, tb - 30 * k], [ax + 230 * k, hz + 50 * k], [ax + 320 * k, hz + 150 * k]];
    const towerP = [[ax - tw1, tb], [ax - tw0 - 22 * k, lamp[1] + 74 * k], [ax - tw0 * .85, lamp[1] - 40 * k], [ax, lamp[1] - 40 * k - tw0 * .85], [ax + tw0 * .85, lamp[1] - 40 * k], [ax + tw0 + 22 * k, lamp[1] + 74 * k], [ax + tw1, tb]];
    const path = q => { const P = new Path2D(); q.forEach((v, i) => P[i ? 'lineTo' : 'moveTo'](...v)); P.closePath(); return P; };
    const rockPath = path(rockP), towerPath = path(towerP), hit = mk(4, 4).getContext('2d');
    const inRock = (x, y) => hit.isPointInPath(rockPath, x, y), inTower = (x, y) => hit.isPointInPath(towerPath, x, y);
    const T = toneMap(g => {
      g.fillStyle = '#141414'; g.fillRect(0, 0, W, H);
      const gl = g.createRadialGradient(...lamp, 0, ...lamp, 900 * k);                     // 灯周围的天空
      gl.addColorStop(0, '#fff'); gl.addColorStop(.1, '#d0d0d0'); gl.addColorStop(.4, '#3a3a3a'); gl.addColorStop(1, '#141414');
      g.fillStyle = gl; g.fillRect(0, 0, W, hz);
      g.filter = `blur(${10 * k}px)`; g.fillStyle = 'rgba(255,255,255,.62)';            // 两道光束
      for (const dir of [-1, 1]) { g.beginPath(); g.moveTo(...lamp); g.lineTo(lamp[0] + dir * 1600 * k, lamp[1] - 260 * k); g.lineTo(lamp[0] + dir * 1600 * k, lamp[1] + 120 * k); g.fill(); }
      g.filter = 'none';
      const sea = g.createLinearGradient(0, hz, 0, H); sea.addColorStop(0, '#8c8c8c'); sea.addColorStop(.45, '#3a3a3a'); sea.addColorStop(1, '#161616');
      g.fillStyle = sea; g.fillRect(0, hz, W, H - hz);
      const rf = g.createLinearGradient(lamp[0] - 160 * k, 0, lamp[0] + 160 * k, 0);    // 海面倒影：一竖条光
      rf.addColorStop(0, 'rgba(255,255,255,0)'); rf.addColorStop(.5, 'rgba(255,255,255,.85)'); rf.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rf; g.fillRect(lamp[0] - 220 * k, hz, 440 * k, H - hz);
      // 礁石：塔下一块，左上受光
      const rk = g.createLinearGradient(ax - 300 * k, hz - 60 * k, ax + 200 * k, hz + 200 * k); rk.addColorStop(0, '#8a8a8a'); rk.addColorStop(.4, '#333'); rk.addColorStop(1, '#111');
      g.fillStyle = rk; g.fill(rockPath);
      // 塔身：左亮右暗，两道深色环
      const tw = g.createLinearGradient(ax - tw1, 0, ax + tw1, 0); tw.addColorStop(0, '#9a9a9a'); tw.addColorStop(.35, '#e0e0e0'); tw.addColorStop(.7, '#3a3a3a'); tw.addColorStop(1, '#151515');
      g.fillStyle = tw; g.beginPath(); g.moveTo(ax - tw1, tb); g.lineTo(ax - tw0, lamp[1] + 70 * k); g.lineTo(ax + tw0, lamp[1] + 70 * k); g.lineTo(ax + tw1, tb); g.fill();
      g.fillStyle = 'rgba(0,0,0,.6)'; for (const f of [.3, .62]) { const y = lerp(tb, lamp[1] + 70 * k, f); g.fillRect(ax - tw1, y, tw1 * 2, 34 * k); }
      g.fillStyle = '#222'; g.fillRect(ax - tw0 - 22 * k, lamp[1] + 52 * k, (tw0 + 22 * k) * 2, 22 * k);  // 灯室：栏杆、亮窗、圆顶
      g.fillStyle = '#fff'; g.fillRect(ax - tw0 * .75, lamp[1] - 40 * k, tw0 * 1.5, 92 * k);
      g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(ax, lamp[1] - 40 * k, tw0 * .85, Math.PI, 0); g.fill();
    }, { res: 3, pixel: (x, y, v) => y > hz ? v * (.55 + .45 * Math.sin(y * .09 / k + Math.sin(x * .006 / k) * 2.4)) + (fbm(x * .003, y * .01, 3) - .5) * .12 : v + (fbm(x * .002, y * .002, 3) - .5) * .1 });
    // 刀痕：天和海横刻、塔身竖刻、礁石斜刻
    const ord = (x, y) => fbm(x * .0018 + 3, y * .0018, 2) * .7 + Math.hypot(x - lamp[0], y - lamp[1]) / LONG * .9;
    const C1 = hatchLines(T, { angle: 0, gap: 9 * u, thr: .18, light: true, maxLen: 150 * u, minLen: 14 * u, jitter: .25, swell: true, order: ord, seed: 3, mask: (x, y) => !inRock(x, y) && !inTower(x, y) });
    const C2 = hatchLines(T, { angle: Math.PI / 2, gap: 8 * u, thr: .3, light: true, maxLen: 90 * u, minLen: 10 * u, jitter: .2, swell: true, order: ord, seed: 4, box: [ax - tw1 - 4 * k, lamp[1] - 60 * k, ax + tw1 + 4 * k, tb], mask: (x, y) => inTower(x, y) && y > lamp[1] + 74 * k });
    const C3 = hatchLines(T, { angle: -.6, gap: 10 * u, thr: .22, light: true, maxLen: 70 * u, minLen: 12 * u, jitter: .4, swell: true, order: ord, seed: 5, box: [ax - 310 * k, hz - 30 * k, ax + 330 * k, hz + 160 * k], mask: inRock });
    // 木纹：黑版上若有若无的纹理
    const wood = mk(W / 2, H / 2), wg = wood.getContext('2d'), im = wg.createImageData(W / 2, H / 2);
    for (let y = 0; y < H / 2; y++) for (let x = 0; x < W / 2; x++) { const n = fbm(x * .004, y * .05, 3), a = Math.sin(n * 40) > .85 ? 40 : 0, i = (y * W / 2 + x) * 4; im.data[i] = 70; im.data[i + 1] = 55; im.data[i + 2] = 40; im.data[i + 3] = a; }
    wg.putImageData(im, 0, 0);
    const spk = mk(W, H), sg = spk.getContext('2d'), R = mulberry32(18);                  // 压印不实：随机白点
    for (let i = 0; i < 2600; i++) { sg.globalAlpha = .4 + R() * .6; sg.fillRect(R() * W, R() * H, 1 + R() * 3, 1 + R() * 2); }
    return { u, k, lamp, hz, tw0, C1, C2, C3, wood, spk, B: mk(W, H), paper: makePaper('#EDE5D3', { seed: 181, grain: 14, blot: 8 }) };
  },
  draw(ctx, t, s) {
    const { u, lamp, B } = s, g = B.getContext('2d');
    const tt = stepT(t, 12), p = inv(.15, 4.0, tt);
    ctx.drawImage(s.paper, 0, 0, W, H);
    // 第二色：灯火的橙黄先印在纸上，只从刻掉的地方透出来
    const m = 38 * u;
    ctx.save(); ctx.beginPath(); ctx.rect(m, m, W - 2 * m, H - 2 * m); ctx.clip(); ctx.globalCompositeOperation = 'multiply';
    const fire = ctx.createRadialGradient(...lamp, 0, ...lamp, 520 * s.k);
    fire.addColorStop(0, '#F4B23A'); fire.addColorStop(.35, '#E07A2A'); fire.addColorStop(1, 'rgba(224,122,42,0)');
    ctx.fillStyle = fire; ctx.fillRect(0, 0, W, H);
    ctx.translate(lamp[0], s.hz); ctx.scale(.35, 1); const rf = ctx.createRadialGradient(0, 0, 0, 0, 0, H - s.hz);
    rf.addColorStop(0, 'rgba(232,140,50,.75)'); rf.addColorStop(1, 'rgba(232,140,50,0)'); ctx.fillStyle = rf; ctx.fillRect(-W, 0, 2 * W, H);
    ctx.restore();
    // 黑版：留一圈纸边，刻掉的地方挖空
    g.clearRect(0, 0, W, H); g.fillStyle = '#15120F'; g.fillRect(m, m, W - 2 * m, H - 2 * m);
    g.drawImage(s.wood, m, m, W - 2 * m, H - 2 * m);
    g.save(); g.globalCompositeOperation = 'destination-out';
    const o = { color: '#000', taper: true, dur: .025, wob: 1.2 * u, bend: .02 };
    drawHatch(g, s.C1, p, { ...o, swell: [10 * u, 1.2 * u] });
    drawHatch(g, s.C2, inv(.6, 3.2, tt), { ...o, swell: [8 * u, 1.2 * u], seed: 2 });
    drawHatch(g, s.C3, inv(1.4, 3.8, tt), { ...o, swell: [8 * u, 1.4 * u], seed: 3 });
    // 灯室的窗：整块刻空，几根窗棂留着
    const wp = inv(.2, .7, tt);
    if (wp > 0) { const w0 = s.tw0 * .75, x0 = lamp[0] - w0, y0 = lamp[1] - 36 * s.k, hh = 86 * s.k;
      g.fillRect(x0, y0, w0 * 2 * wp, hh); g.save(); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#15120F';
      for (let i = 1; i < 4; i++) g.fillRect(x0 + w0 * 2 * i / 4 - 4 * s.k, y0, 8 * s.k, hh); g.restore(); }
    // 题字：最后刻出来
    const tp = inv(3.7, 4.4, tt);
    if (tp > 0) {
      const fs = Math.round((LAND ? 150 : 170) * u), tx = LAND ? W * .2 : W * .5, ty = LAND ? H * .82 : H * .88;
      g.font = `900 ${fs}px 'Noto Serif SC'`; g.textAlign = 'center';
      g.save(); g.beginPath(); g.rect(0, ty - fs, W, fs * 1.3 * tp); g.clip(); g.fillText('守灯人', tx, ty); g.restore();
      g.fillRect(tx - fs * 1.5 * tp, ty + fs * .25, fs * 3 * tp, 8 * u);
    }
    g.globalAlpha = .7; g.drawImage(s.spk, 0, 0); g.restore();
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(B, 0, 0); ctx.restore();
  }
});
