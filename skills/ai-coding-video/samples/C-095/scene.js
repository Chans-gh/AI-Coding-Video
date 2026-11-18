// C-095 国风纸片拼贴：Canvas 2D 在 init 里先画好宣纸底和墨线远山，再把月亮、云、仙鹤、渔舟各画成一张离屏纸片（毛边是沿轮廓加高频抖动的多边形，白描线用墨色细线），draw 时每张纸片带硬投影从侧下方 eOutBack 回弹滑入、再按各自权重缓慢呼吸，最后朱红印章盖下。
// 风格提示词：用国风纸片拼贴动画风格：画面主体（人、动物、器物、山、云）拆成一张张白描纸片，叠在墨线山水底图上，纸片边缘撕出毛边并带硬纸投影，每张纸片从侧下方带回弹滑入、之后缓慢呼吸浮动，主角动得多、远景几乎不动，全片只有一个高饱和色：朱红印章；中文由代码渲染，不让模型把字画进图里。
// 题材：东方传统 · 适合：成语、古诗、国学与传统文化科普
scene({
  id: 'C-095', name: '国风纸片拼贴', dur: 4, still: 3.2,
  text: '孤舟蓑笠翁独钓寒江雪柳宗元',
  fonts: ["700 40px 'Noto Serif SC'", "900 40px 'Noto Serif SC'"],
  init() {
    const u = SHORT / 1080, INK = '#2B2724', PAPER = '#F5F0E3';
    const bg = mk(W, H), b = bg.getContext('2d');
    b.drawImage(makePaper('#E9E1CE', { seed: 95, grain: 14, blot: 8 }), 0, 0, W, H);
    // 墨线远山：几层起伏折线，下方淡墨晕
    for (let l = 0; l < 3; l++) {
      const y0 = H * (LAND ? .38 + l * .1 : .3 + l * .08), amp = (160 - l * 40) * u, pts = [];
      for (let x = -20; x <= W + 20; x += 8 * u) pts.push([x, y0 - amp * Math.pow(fbm(x / (420 * u) + l * 9, l * 3.1, 4), 1.6) * 2.2]);
      const g = b.createLinearGradient(0, y0 - amp * 1.5, 0, y0 + 160 * u); g.addColorStop(0, `rgba(60,55,50,${.16 - l * .03})`); g.addColorStop(1, 'rgba(60,55,50,0)');
      b.fillStyle = g; b.beginPath(); pts.forEach(([x, y], i) => i ? b.lineTo(x, y) : b.moveTo(x, y)); b.lineTo(W, y0 + 200 * u); b.lineTo(0, y0 + 200 * u); b.fill();
      b.strokeStyle = `rgba(43,39,36,${.55 - l * .12})`; b.lineWidth = (3 - l * .6) * u; b.beginPath(); pts.forEach(([x, y], i) => i ? b.lineTo(x, y) : b.moveTo(x, y)); b.stroke();
    }
    // 江面：几道淡墨水纹
    b.strokeStyle = 'rgba(43,39,36,.25)'; b.lineWidth = 2 * u;
    for (let i = 0; i < 14; i++) { const y = H * (LAND ? .72 : .66) + i * 24 * u, x = (hash1(i) * .8) * W; b.beginPath(); b.moveTo(x, y); b.bezierCurveTo(x + 60 * u, y - 6 * u, x + 120 * u, y + 6 * u, x + (160 + hash1(i + 9) * 200) * u, y); b.stroke(); }
    // 纸片：外形折线 + 白描
    const piece = (w, h, outline, art, seed) => {
      const c = mk(Math.ceil(w * u + 40), Math.ceil(h * u + 40)), g = c.getContext('2d'), R = mulberry32(seed);
      g.translate(20, 20); g.scale(u, u);
      const pts = resample(outline, 160);
      g.beginPath(); pts.forEach((p, i) => { const j = (R() - .5) * 7 + Math.sin(i * 1.7) * 2; (i ? g.lineTo : g.moveTo).call(g, p.x + p.nx * j, p.y + p.ny * j); }); g.closePath();
      g.fillStyle = PAPER; g.fill(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2.5; g.stroke();
      g.strokeStyle = INK; g.fillStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round'; art(g);
      return c;
    };
    const ell = (cx, cy, rx, ry) => { const p = []; for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; };
    const P = {};
    P.moon = piece(300, 300, ell(150, 150, 146, 146), g => {
      g.lineWidth = 3; g.beginPath(); g.arc(150, 150, 110, 0, TAU); g.stroke();
      g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(150, 150, 70 + i * 6, 2.2 + i * .1, 3.4 + i * .1); g.stroke(); }
    }, 1);
    const cloudArt = g => { g.lineWidth = 3; for (const [x, y, r] of [[80, 70, 34], [150, 52, 44], [225, 72, 32]]) { g.beginPath(); for (let a = 0; a < 3.4 * TAU / 2; a += .1) g.lineTo(x + Math.cos(a + 3) * r * (1 - a / 12), y + Math.sin(a + 3) * r * (1 - a / 12)); g.stroke(); } g.beginPath(); g.moveTo(30, 100); g.bezierCurveTo(100, 112, 200, 112, 280, 96); g.stroke(); };
    P.cloud = piece(310, 140, [[10, 100], [20, 50], [90, 20], [160, 6], [240, 24], [300, 70], [296, 118], [150, 132], [10, 100]], cloudArt, 2);
    P.crane = piece(390, 250, [[10, 180], [90, 120], [130, 10], [230, 30], [300, 80], [385, 95], [380, 140], [260, 190], [120, 220], [20, 215], [10, 180]], g => {
      g.lineWidth = 3; g.beginPath(); g.ellipse(190, 160, 62, 22, -.12, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(246, 148); g.bezierCurveTo(280, 130, 310, 116, 340, 112); g.moveTo(244, 160); g.bezierCurveTo(282, 142, 312, 126, 340, 120); g.stroke();
      g.beginPath(); g.arc(345, 114, 9, 0, TAU); g.stroke(); g.lineWidth = 3.5; g.beginPath(); g.moveTo(353, 114); g.lineTo(376, 120); g.stroke();
      g.lineWidth = 2.5; g.beginPath(); g.moveTo(135, 166); g.lineTo(30, 196); g.moveTo(138, 172); g.lineTo(34, 208); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.moveTo(215, 146); g.bezierCurveTo(225, 90, 170, 40, 100, 26); g.bezierCurveTo(140, 70, 140, 110, 160, 148); g.stroke();
      g.lineWidth = 1.6; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(160 + i * 9, 140 - i * 4); g.lineTo(150 + i * 6, 40 + i * 14); g.stroke(); }
      g.lineWidth = 2; g.beginPath(); g.moveTo(232, 146); g.bezierCurveTo(250, 100, 250, 60, 230, 34); g.stroke();
      g.lineWidth = 7; g.beginPath(); g.moveTo(140, 26); g.lineTo(158, 30); g.stroke();
    }, 3);
    P.boat = piece(520, 330, [[10, 250], [60, 200], [180, 150], [220, 40], [300, 10], [380, 80], [470, 190], [515, 240], [480, 300], [260, 322], [60, 300], [10, 250]], g => {
      g.lineWidth = 3.5; g.beginPath(); g.moveTo(30, 240); g.quadraticCurveTo(250, 310, 495, 232); g.moveTo(50, 250); g.quadraticCurveTo(250, 290, 470, 246); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.moveTo(205, 150); g.lineTo(270, 62); g.lineTo(340, 150); g.closePath(); g.stroke();   // 斗笠
      for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(232 + i * 18, 150); g.lineTo(215 + i * 26, 248); g.stroke(); }   // 蓑衣
      g.beginPath(); g.moveTo(212, 170); g.quadraticCurveTo(200, 210, 210, 248); g.moveTo(330, 160); g.quadraticCurveTo(350, 210, 338, 248); g.stroke();
      g.lineWidth = 2; g.beginPath(); g.moveTo(320, 190); g.quadraticCurveTo(420, 60, 505, 30); g.stroke();   // 钓竿
      g.lineWidth = 1; g.beginPath(); g.moveTo(505, 30); g.lineTo(505, 236); g.stroke();
    }, 4);
    P.reed = piece(180, 340, [[20, 330], [10, 200], [40, 60], [90, 6], [150, 50], [170, 200], [160, 330], [20, 330]], g => {
      g.lineWidth = 2.5; for (let i = 0; i < 6; i++) { const x = 40 + i * 20; g.beginPath(); g.moveTo(x, 320); g.quadraticCurveTo(x + 10, 180, x + 30 - i * 4, 50 + i * 14); g.stroke(); g.beginPath(); g.ellipse(x + 30 - i * 4, 50 + i * 14, 5, 18, .3, 0, TAU); g.stroke(); }
    }, 5);
    // 印章
    const seal = mk(Math.round(150 * u), Math.round(150 * u)), q = seal.getContext('2d'), sw = seal.width;
    q.fillStyle = '#C8321E'; q.beginPath(); rectPts(4, 4, sw - 8, sw - 8, 3, 7).forEach(([x, y], i) => i ? q.lineTo(x, y) : q.moveTo(x, y)); q.fill();
    q.fillStyle = '#F3E6D4'; q.font = `900 ${sw * .38}px 'Noto Serif SC'`; q.textAlign = 'center'; q.textBaseline = 'middle';
    q.fillText('寒', sw * .5, sw * .3); q.fillText('江', sw * .5, sw * .7);
    q.globalCompositeOperation = 'destination-out'; const R = mulberry32(9);
    for (let i = 0; i < 140; i++) { q.globalAlpha = R() * .8; q.beginPath(); q.arc(R() * sw, R() * sw, R() * 3 * u, 0, TAU); q.fill(); }
    return { bg, P, seal };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    ctx.drawImage(s.bg, 0, 0);
    // [纸片, 横, 纵, 进场时刻, 进场方向, 呼吸权重, 缩放]
    const L = LAND ? [['moon', .64, .2, .05, 1, .15, 1.1], ['cloud', .46, .3, .3, 1, .3, 1], ['cloud', .18, .2, .45, -1, .3, .8], ['crane', .3, .32, .7, -1, .7, 1], ['reed', .1, .74, .9, -1, .25, 1], ['boat', .5, .72, 1.1, 1, 1, 1.15]]
      : [['moon', .68, .14, .05, 1, .15, 1.05], ['cloud', .26, .13, .3, -1, .3, .9], ['cloud', .8, .26, .45, 1, .3, .7], ['crane', .36, .3, .7, -1, .7, 1.05], ['reed', .12, .56, .9, -1, .25, 1], ['boat', .5, .54, 1.1, 1, 1, 1.25]];
    L.forEach(([k, fx, fy, t0, dir, wgt, sc], i) => {
      const img = s.P[k], p = inv(t0, t0 + .9, t), e = eOutBack(p, 1.4);
      if (p <= 0) return;
      const br = Math.sin(t * 1.6 + i * 1.3) * wgt, x = fx * W + dir * (1 - e) * 360 * u + (k === 'boat' ? Math.sin(t * .9) * 18 * u : 0), y = fy * H + (1 - e) * 380 * u + br * 10 * u;
      ctx.save(); ctx.translate(x, y); ctx.rotate((1 - e) * dir * .25 + br * .02); ctx.scale(sc, sc);
      ctx.globalAlpha = clamp(p * 4);
      ctx.shadowColor = 'rgba(40,30,20,.38)'; ctx.shadowBlur = 3 * u; ctx.shadowOffsetX = 9 * u; ctx.shadowOffsetY = 11 * u;
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    });
    // 竖排诗句：逐字淡入
    const lines = ['孤舟蓑笠翁', '独钓寒江雪'], fs = (LAND ? 64 : 60) * u;
    const x0 = LAND ? W * .9 : W * .62, y0 = LAND ? H * .14 : H * .68;
    ctx.font = `700 ${fs}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    lines.forEach((ln, c) => [...ln].forEach((ch, j) => {
      const a = inv(1.6 + (c * 5 + j) * .09, 1.9 + (c * 5 + j) * .09, t); if (!a) return;
      ctx.fillStyle = `rgba(43,39,36,${a})`; ctx.fillText(ch, x0 - c * fs * 1.35, y0 + j * fs * 1.18 + (1 - a) * 10 * u);
    }));
    ctx.font = `700 ${26 * u}px 'Noto Serif SC'`; ctx.fillStyle = `rgba(43,39,36,${inv(2.6, 3, t) * .8})`;
    [...'柳宗元'].forEach((ch, j) => ctx.fillText(ch, x0 - fs * 2.6, y0 + fs * 3.4 + j * 32 * u));
    // 朱红印章：放大落下
    const sp = inv(2.9, 3.15, t);
    if (sp > 0) {
      const k = 1 + (1 - eOutCubic(sp)) * .9;
      ctx.save(); ctx.translate(x0 - fs * 2.6, y0 + fs * 3.4 + 150 * u); ctx.scale(k, k); ctx.rotate(-.05);
      ctx.globalAlpha = .4 + sp * .55; ctx.drawImage(s.seal, -s.seal.width / 2, 0); ctx.restore();
    }
    ctx.textBaseline = 'alphabetic';
  }
});
