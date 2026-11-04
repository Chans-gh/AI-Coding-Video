// C-186 东方赛博：五层楼群按随机种子生成（楼身、窗格、一层层飞檐和竖招牌），每层预先画成一张长图，镜头上升时近处的层移得多、远处的移得少，形成纵深；招牌的霓虹光和字各自单独一张小图，逐帧按哈希闪烁；层与层之间叠分形噪声做的雾带，前景是摇晃的红灯笼和雨丝，升到屋顶时天上浮出一个切片错位的全息大字
// 风格提示词：用东方赛博风格：夜雨中的立体城市叠着飞檐斗拱、牌楼和霓虹招牌，红灯笼和全息汉字广告并排悬浮，主色是朱红、青绿和电光紫，楼宇之间有水墨般的雾层缓缓流动，招牌文字全部原创，镜头沿窄巷慢慢升上屋顶，配古筝加电子低音。
// 题材：3D 与实时图形 · 适合：国风科幻、游戏宣传、未来城市设想
const SIGNS = ['云栖', '灯市', '茶', '面', '夜行', '当铺', '药', '酒', '听雨', '长生', '南巷', '书', '汤', '客栈'];
const NEON = ['#ff4a32', '#19e3c0', '#a259ff', '#ffc24a', '#ff3d8b'];
// 层：视差（镜头升 1 时这一层移多少）、楼顶高度范围（开场时的屏幕位置，单位 H）、楼宽（单位 u）、窗格高、留出巷子的空档、贴图分辨率
const LAYERS = [
  { p: .12, top: [.06, .32], w: [110, 200], fh: 14, gap: null, k: .5, haze: .62 },
  { p: .25, top: [-.06, .2], w: [130, 230], fh: 19, gap: null, k: .5, haze: .45 },
  { p: .42, top: [-.18, .08], w: [150, 260], fh: 25, gap: null, k: .5, haze: .3 },
  { p: .65, top: [-.38, -.08], w: [200, 320], fh: 33, gap: [.4, .62], k: 1, haze: .14 },
  { p: 1, top: [-.58, -.3], w: [260, 380], fh: 44, gap: [.27, .73], k: 1, haze: 0 },
];
const HOLO = '夜';
scene({
  id: 'C-186', name: '东方赛博', dur: 4.5, still: 3.9,
  fonts: ["900 40px 'Noto Sans SC'", "400 40px 'Ma Shan Zheng'"],
  text: SIGNS.join('') + HOLO + '云栖城',
  init() {
    const u = SHORT / 1080, RISE = H * 1.25;
    const R = mulberry32(186);
    const pick = a => a[Math.floor(R() * a.length)];
    // 飞檐：下沿是两头上翘的弧线，上面是收窄的屋脊
    const eave = (g, x0, x1, y, eh, trim, glow) => {
      const L = x1 - x0;
      g.beginPath();
      g.moveTo(x0, y - eh * .8);
      g.quadraticCurveTo(x0 + L * .12, y + eh * .08, x0 + L * .3, y);
      g.lineTo(x1 - L * .3, y);
      g.quadraticCurveTo(x1 - L * .12, y + eh * .08, x1, y - eh * .8);
      g.quadraticCurveTo(x1 - L * .14, y - eh * .55, x1 - L * .26, y - eh * 1.4);
      g.lineTo(x0 + L * .26, y - eh * 1.4);
      g.quadraticCurveTo(x0 + L * .14, y - eh * .55, x0, y - eh * .8);
      g.closePath();
      g.fillStyle = '#0d0a16'; g.fill();
      g.save(); g.clip(); g.strokeStyle = 'rgba(120,100,160,.18)'; g.lineWidth = Math.max(1, eh * .06);
      for (let x = x0; x < x1; x += eh * .35) { g.beginPath(); g.moveTo(x, y - eh * 1.5); g.lineTo(x + (x - (x0 + x1) / 2) * .08, y + eh); g.stroke(); }   // 瓦垄
      g.restore();
      g.save(); g.shadowColor = trim; g.shadowBlur = glow; g.strokeStyle = trim; g.lineWidth = Math.max(1.5, eh * .09);
      g.beginPath(); g.moveTo(x0, y - eh * .8); g.quadraticCurveTo(x0 + L * .12, y + eh * .08, x0 + L * .3, y); g.lineTo(x1 - L * .3, y); g.quadraticCurveTo(x1 - L * .12, y + eh * .08, x1, y - eh * .8); g.stroke();
      g.lineWidth *= .6; g.beginPath(); g.moveTo(x0 + L * .26, y - eh * 1.4); g.lineTo(x1 - L * .26, y - eh * 1.4); g.stroke();
      g.restore();
    };
    const layers = LAYERS.map((Ly, li) => {
      const fh = Ly.fh * u, k = Ly.k;
      const oy = Ly.top[0] * H - fh * 8, bot = H + 20 * u;                // 贴图覆盖的屏幕范围（开场时）
      const spr = mk(Math.ceil(W * k), Math.ceil((bot - oy) * k)), g = spr.getContext('2d');
      g.scale(k, k); g.translate(0, -oy);
      const signs = [], blds = [];
      let x = -40 * u;
      while (x < W + 40 * u) {
        let w = lerp(Ly.w[0], Ly.w[1], R()) * u;
        if (Ly.gap) {                                                       // 巷子：中间留空
          const g0 = Ly.gap[0] * W, g1 = Ly.gap[1] * W;
          if (x + w > g0 && x < g1) { if (x < g0 - 40 * u) w = g0 - x; else { x = g1; continue; } }
        }
        blds.push({ x, w, top: lerp(Ly.top[0], Ly.top[1], R()) * H });
        x += w + (Ly.gap ? 0 : lerp(-.15, .1, R()) * w);
      }
      for (const b of blds) {
        const { x, w, top } = b;
        // 楼身和一列列窗
        const body = g.createLinearGradient(x, 0, x + w, 0);
        body.addColorStop(0, '#16112a'); body.addColorStop(.5, '#1d1634'); body.addColorStop(1, '#100c1e');
        g.fillStyle = body; g.fillRect(x, top, w, bot - top);
        const cols = Math.max(2, Math.floor(w / (fh * .95))), cw = w / cols, tier = 3 + Math.floor(R() * 4);
        let fl = 0;
        for (let y = top + fh * 1.2; y < bot; y += fh, fl++) {
          if (fl > 0 && fl % tier === 0) { eave(g, x - fh * .5, x + w + fh * .5, y + fh * .15, fh * .55, pick(NEON), 10 * u); continue; }
          for (let c = 0; c < cols; c++) {
            const r = R();
            g.fillStyle = r < .22 ? '#ffcf7a' : r < .3 ? '#7ff6ff' : r < .34 ? '#ff8fc8' : '#251d3a';
            g.globalAlpha = r < .34 ? .85 : 1;
            g.fillRect(x + c * cw + cw * .2, y + fh * .22, cw * .6, fh * .55);
          }
          g.globalAlpha = 1;
          if (R() < .06) { g.save(); const c = pick(NEON); g.shadowColor = c; g.shadowBlur = 12 * u; g.fillStyle = c; g.fillRect(x, y + fh * .92, w, Math.max(2, fh * .07)); g.restore(); }   // 霓虹灯带
        }
        // 楼顶：一层大檐；有的再收一层小楼、加尖顶
        eave(g, x - fh * .9, x + w + fh * .9, top, fh * 1.1, pick(NEON), 14 * u);
        if (R() < .55) {
          const w2 = w * .55, x2 = x + (w - w2) / 2, h2 = fh * 2.6;
          g.fillStyle = '#140f24'; g.fillRect(x2, top - fh * 1.5 - h2, w2, h2);
          g.fillStyle = '#ffcf7a'; for (let c = 0; c < 3; c++) if (R() < .5) g.fillRect(x2 + w2 * (.15 + c * .27), top - fh * 1.5 - h2 * .7, w2 * .14, h2 * .35);
          eave(g, x2 - fh * .7, x2 + w2 + fh * .7, top - fh * 1.5 - h2, fh * .9, pick(NEON), 12 * u);
          g.strokeStyle = '#0d0a16'; g.lineWidth = Math.max(2, fh * .12);
          g.beginPath(); g.moveTo(x + w / 2, top - fh * 3 - h2); g.lineTo(x + w / 2, top - fh * 5.5 - h2); g.stroke();
          g.save(); g.shadowColor = '#ff3d3d'; g.shadowBlur = 10 * u; g.fillStyle = '#ff4a4a'; g.beginPath(); g.arc(x + w / 2, top - fh * 5.5 - h2, fh * .14, 0, TAU); g.fill(); g.restore();
        }
        // 竖招牌：板子画进楼层贴图，亮光另做小图逐帧闪
        const ns = li >= 3 ? 2 + Math.floor(R() * 3) : li === 2 ? (R() < .85 ? 1 + (R() < .4) : 0) : (R() < .5 ? 1 : 0);
        for (let i = 0; i < ns; i++) {
          const txt = pick(SIGNS), n = txt.length, cs = fh * lerp(.9, 1.2, R()) * (li >= 3 ? 1.5 : 1);
          const sw = cs * 1.35, sh = cs * (n * 1.15 + .5);
          const sx = i % 2 ? x + w - sw * .4 : x - sw * .6 + (li < 3 ? sw * .6 : 0);
          const sy = li >= 3 ? lerp(top + fh * 2, bot - sh - fh, (i + R() * .8) / ns) : top + fh * (2 + R() * 4);
          if (sy + sh > bot) continue;
          const col = pick(NEON);
          g.fillStyle = '#0a0812'; g.fillRect(sx, sy, sw, sh);
          const pad = 18 * u * k + 4, lit = mk(Math.ceil(sw * k + pad * 2), Math.ceil(sh * k + pad * 2)), l = lit.getContext('2d');
          l.translate(pad, pad); l.scale(k, k);
          l.shadowColor = col; l.shadowBlur = 16 * u; l.strokeStyle = col; l.lineWidth = Math.max(2, cs * .07);
          l.strokeRect(cs * .08, cs * .08, sw - cs * .16, sh - cs * .16);
          l.fillStyle = '#fff6ee'; l.font = `900 ${Math.round(cs * .82)}px 'Noto Sans SC'`; l.textAlign = 'center'; l.textBaseline = 'middle';
          [...txt].forEach((c, j) => { l.shadowBlur = 18 * u; l.fillText(c, sw / 2, cs * (.25 + .6 + j * 1.15)); });
          l.globalCompositeOperation = 'source-atop'; l.fillStyle = col; l.globalAlpha = .45; l.fillRect(-pad, -pad, lit.width, lit.height);
          signs.push({ x: sx - pad / k, y: sy - pad / k, w: lit.width / k, h: lit.height / k, lit, seed: R() * 1000 });
        }
      }
      // 空气透视：远层蒙一层紫灰
      if (Ly.haze) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(92,58,128,${Ly.haze})`; g.fillRect(0, oy, W, bot - oy); g.globalCompositeOperation = 'source-over'; }
      return { ...Ly, spr, oy, bot, signs };
    });
    // 雾：分形噪声做的半透明云带，横向可平铺
    const fog = mk(512, 96), fg = fog.getContext('2d'), id = fg.createImageData(512, 96);
    for (let y = 0; y < 96; y++) for (let x = 0; x < 512; x++) {
      const a = (x / 512) * TAU, n = fbm(Math.cos(a) * 2.5 + 10, Math.sin(a) * 2.5 + y / 30, 5);
      const v = clamp((n - .38) * 2.6) * Math.sin(Math.PI * y / 96) ** 1.5, o = (y * 512 + x) * 4;
      id.data[o] = 150; id.data[o + 1] = 120; id.data[o + 2] = 175; id.data[o + 3] = v * 200;
    }
    fg.putImageData(id, 0, 0);
    // 全息字：一张亮字图，绘制时切成横条错位
    const HS = Math.round(SHORT * .5), holo = mk(HS, Math.round(HS * 1.25)), hg = holo.getContext('2d');
    hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.shadowColor = '#19e3c0'; hg.shadowBlur = 24 * u;
    const hgr = hg.createLinearGradient(0, 0, 0, HS); hgr.addColorStop(0, '#b8fff2'); hgr.addColorStop(1, '#19c8e3');
    hg.fillStyle = hgr; hg.font = `400 ${Math.round(HS * .86)}px 'Ma Shan Zheng'`; hg.fillText(HOLO, HS / 2, HS * .5);
    hg.font = `900 ${Math.round(HS * .09)}px 'Noto Sans SC'`; hg.fillStyle = '#ff5fa8'; hg.shadowColor = '#ff3d8b';
    hg.fillText('云 栖 城', HS / 2, HS * 1.08);
    hg.globalCompositeOperation = 'destination-out'; hg.fillStyle = 'rgba(0,0,0,.55)';
    for (let y = 0; y < holo.height; y += 4 * u + 2) hg.fillRect(0, y, HS, Math.max(1, 1.6 * u));    // 扫描线
    // 灯笼：挂在近处两侧楼之间的绳上
    const lanterns = [];
    for (let r = 0; r < 4; r++) {
      const y = lerp(-.5, .55, r / 3) * H + R() * 60 * u, n = LAND ? 5 : 3;
      const x0 = (LAND ? .25 : .24) * W, x1 = (LAND ? .75 : .76) * W;
      for (let i = 0; i < n; i++) lanterns.push({ x: lerp(x0, x1, (i + .5) / n), y, sag: Math.sin(Math.PI * (i + .5) / n) * 40 * u, row: r, x0, x1, ph: R() * TAU, s: (r === 3 ? 1.1 : .9) * u });
    }
    const rain = Array.from({ length: 260 }, () => ({ x: R(), ph: R(), v: lerp(1.4, 2.4, R()), l: lerp(30, 70, R()), z: R() }));
    return { RISE, layers, fog, holo, HS, lanterns, rain };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080;
    const cam = s.RISE * eInOutCubic(inv(.3, 3.7, t));                    // 镜头升了多少
    // 天：深紫到洋红的地平线辉光
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#05041a'); sky.addColorStop(.45, '#1d0d3a'); sky.addColorStop(.8, '#5a1748'); sky.addColorStop(1, '#2a0d2e');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const flick = (seed, rate = 9) => { const h = hash1(Math.floor(t * rate + seed)); return h < .05 ? .2 : h < .1 ? .6 : .9 + .1 * Math.sin(t * 40 + seed); };
    s.layers.forEach((L, li) => {
      const dy = cam * L.p;
      ctx.drawImage(L.spr, 0, L.oy + dy, W, L.bot - L.oy);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const g of L.signs) { ctx.globalAlpha = flick(g.seed) * (1 - L.haze * .6); ctx.drawImage(g.lit, g.x, g.y + dy, g.w, g.h); }
      ctx.restore();
      // 雾带：在每层楼脚一带流动
      if (li < 4) {
        const fy = lerp(.45, .95, li / 3) * H + dy * .8, fw = W * 1.6, fh2 = H * (.22 + li * .05), ox = ((t * (20 + li * 25) * u + li * 300) % fw);
        ctx.globalAlpha = .5 + li * .08;
        for (const xx of [-ox, fw - ox]) ctx.drawImage(s.fog, xx, fy - fh2 / 2, fw, fh2);
        ctx.globalAlpha = 1;
      }
      // 全息字：在第 2、3 层之间，升到屋顶时亮起
      if (li === 2) {
        const ha = smooth(2.2, 3.0, t) * (hash1(Math.floor(t * 14)) < .08 ? .4 : 1);
        if (ha > 0) {
          const hx = LAND ? W * .64 : W * .5, hy = (LAND ? -.5 : -.4) * H + cam * .42, HS = s.HS, hh = s.holo.height, N = 14;
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < N; i++) {
            const sy = hh * i / N, glitch = hash2(i, Math.floor(t * 10)) < .15 ? (hash2(i + 7, Math.floor(t * 10)) - .5) * 60 * u : 0;
            ctx.globalAlpha = ha * (.75 + .25 * Math.sin(t * 6 + i));
            ctx.drawImage(s.holo, 0, sy, HS, hh / N, hx - HS / 2 + glitch, hy + sy, HS, hh / N + 1);
          }
          ctx.globalAlpha = ha * .5; ctx.strokeStyle = '#19e3c0'; ctx.lineWidth = 2 * u;
          for (const k of [0, 1]) { ctx.beginPath(); ctx.ellipse(hx, hy + HS * 1.2, HS * (.42 + k * .1), HS * (.07 + k * .02), 0, 0, TAU); ctx.setLineDash([24 * u, 12 * u]); ctx.lineDashOffset = (k ? -1 : 1) * t * 80 * u; ctx.stroke(); }
          ctx.setLineDash([]);
          const beam = ctx.createLinearGradient(0, hy + HS * 1.2, 0, hy); beam.addColorStop(0, 'rgba(25,227,192,.18)'); beam.addColorStop(1, 'rgba(25,227,192,0)');
          ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(hx - HS * .42, hy + HS * 1.2); ctx.lineTo(hx + HS * .42, hy + HS * 1.2); ctx.lineTo(hx + HS * .6, hy); ctx.lineTo(hx - HS * .6, hy); ctx.fill();
          ctx.restore();
        }
      }
    });
    // 灯笼和绳（视差 0.95）
    const ld = cam * .95;
    const rows = new Set();
    for (const L of s.lanterns) {
      const y = L.y + ld;
      if (y < -200 * u || y > H + 200 * u) continue;
      if (!rows.has(L.row)) {
        rows.add(L.row); ctx.strokeStyle = '#05030a'; ctx.lineWidth = 3 * u;
        ctx.beginPath(); ctx.moveTo(L.x0 - 20 * u, y - 30 * u); ctx.quadraticCurveTo(W / 2, y + 60 * u, L.x1 + 20 * u, y - 30 * u); ctx.stroke();
      }
      const a = .08 * Math.sin(t * 1.8 + L.ph), sc = L.s, ly = y + L.sag - 40 * u * (1 - Math.sin(Math.PI * (L.x - L.x0) / (L.x1 - L.x0)));
      ctx.save(); ctx.translate(L.x, ly); ctx.rotate(a);
      const gl = ctx.createRadialGradient(0, 70 * sc, 0, 0, 70 * sc, 150 * sc); gl.addColorStop(0, 'rgba(255,80,40,.45)'); gl.addColorStop(1, 'rgba(255,80,40,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(-150 * sc, -80 * sc, 300 * sc, 300 * sc); ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#05030a'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22 * sc); ctx.stroke();
      const bg = ctx.createRadialGradient(-12 * sc, 60 * sc, 4 * sc, 0, 70 * sc, 60 * sc); bg.addColorStop(0, '#ffd27a'); bg.addColorStop(.45, '#ff4a26'); bg.addColorStop(1, '#8a0f16');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(0, 70 * sc, 50 * sc, 46 * sc, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(120,10,10,.6)'; ctx.lineWidth = 2 * u;
      for (const k of [-.55, 0, .55]) { ctx.beginPath(); ctx.ellipse(0, 70 * sc, 50 * sc * Math.abs(k) || 1, 46 * sc, 0, -Math.PI / 2, Math.PI / 2, k < 0); ctx.stroke(); }
      ctx.fillStyle = '#d9a23a'; ctx.fillRect(-24 * sc, 20 * sc, 48 * sc, 10 * sc); ctx.fillRect(-24 * sc, 110 * sc, 48 * sc, 10 * sc);
      ctx.strokeStyle = '#ff3a2a'; ctx.lineWidth = 3 * u;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 5 * sc, 120 * sc); ctx.lineTo(i * 6 * sc + a * 60 * sc, 165 * sc); ctx.stroke(); }
      ctx.restore();
    }
    // 街面雾：画面底部
    const bf = ctx.createLinearGradient(0, H * .6, 0, H); bf.addColorStop(0, 'rgba(60,30,80,0)'); bf.addColorStop(1, `rgba(60,30,80,${.6 * (1 - smooth(.5, 2.5, t) * .7)})`);
    ctx.fillStyle = bf; ctx.fillRect(0, H * .6, W, H * .4);
    // 雨：斜着落，近的粗、远的细
    ctx.lineCap = 'round';
    for (const pass of [0, 1]) {
      ctx.strokeStyle = pass ? 'rgba(200,230,255,.35)' : 'rgba(170,190,255,.18)'; ctx.lineWidth = (pass ? 2.2 : 1.2) * u;
      ctx.beginPath();
      for (const d of s.rain) {
        if ((d.z > .6) !== !!pass) continue;
        const yy = ((d.ph + t * d.v) % 1) * (H + 200 * u) - 100 * u, xx = d.x * W * 1.1 - yy * .12, l = d.l * u * (pass ? 1.4 : 1);
        ctx.moveTo(xx, yy); ctx.lineTo(xx - l * .12, yy + l);
      }
      ctx.stroke();
    }
    vignette(ctx, .55, .4, '8,2,20');
  }
});
