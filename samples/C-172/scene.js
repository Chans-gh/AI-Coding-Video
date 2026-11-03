// C-172 萤火光尘：init 里一次画好暮色天空、树林和草叶剪影；几百个光点各有深度、绕圈半径和呼吸频率，位置由噪声和正弦算出，近处的用大号柔光贴图画成失焦光斑、远处的是清晰小点；2 秒前后一部分光点飞到“你”字的取样点上聚成字，同时字形本身亮起一层淡淡的柔光，让笔画更清楚，再散开
// 风格提示词：用萤火光尘风格：暮色深蓝的草地和树林剪影里，几百颗暖黄绿的小光点慢慢浮起、明灭、绕圈飞行，靠近镜头的光点大而失焦成光斑，远处的细小清晰，每颗按各自的节奏呼吸闪烁，偶尔聚成一个形状又散开，配虫鸣和轻柔钢琴。
// 题材：3D 与实时图形 · 适合：夏夜回忆、治愈系 MV、童话开场
scene({
  id: 'C-172', name: '萤火光尘', dur: 4.2, still: 2.75,
  fonts: ["900 40px 'Noto Serif SC'"],
  text: '你',
  init() {
    const u = SHORT / 1080, R = mulberry32(23), bg = mk(W, H), g = bg.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#060c26'); sky.addColorStop(.55, '#17275a'); sky.addColorStop(.8, '#3b3f6e'); sky.addColorStop(1, '#2a2440');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(220,230,255,${.2 + .5 * R()})`; g.fillRect(R() * W, R() * H * .5, 1.6 * u, 1.6 * u); }
    const hz = H * (LAND ? .76 : .72);
    // 远树林：噪声起伏的树冠线，偏蓝灰
    g.fillStyle = '#121a38'; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, hz - 60 * u - 120 * u * fbm(x / (160 * u), 3.1, 4));
    g.lineTo(W, H); g.fill();
    // 近处几棵大树：一团团圆形树冠
    g.fillStyle = '#070b1c';
    const trees = LAND ? [[.08, .95], [.2, .7], [.9, 1.05]] : [[.05, .9], [.95, 1.0]];
    for (const [tx, sz] of trees) {
      const x = tx * W, top = hz - 520 * u * sz;
      g.fillRect(x - 14 * u * sz, top + 200 * u, 28 * u * sz, hz - top);
      for (let k = 0; k < 26; k++) { const a = R() * TAU, rr = R() * 150 * u * sz; g.beginPath(); g.arc(x + Math.cos(a) * rr, top + 170 * u * sz + Math.sin(a) * rr * 1.2, (60 + 50 * R()) * u * sz, 0, TAU); g.fill(); }
    }
    g.fillRect(0, hz, W, H - hz);
    // 草叶
    g.strokeStyle = '#04060f'; g.lineCap = 'round';
    for (let i = 0; i < 900; i++) {
      const x = R() * W, h = (30 + 110 * R()) * u * (1 + (H - hz) / H), lean = (R() - .5) * 40 * u;
      g.lineWidth = (2 + 3 * R()) * u; g.beginPath(); g.moveTo(x, hz + 20 * u + R() * 40 * u); g.quadraticCurveTo(x + lean * .3, hz - h * .5, x + lean, hz - h); g.stroke();
    }
    // 光点贴图：柔光（失焦）和亮芯
    const glow = mk(128, 128), gg = glow.getContext('2d'), rg = gg.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(225,255,140,1)'); rg.addColorStop(.25, 'rgba(210,250,120,.55)'); rg.addColorStop(1, 'rgba(180,230,90,0)');
    gg.fillStyle = rg; gg.fillRect(0, 0, 128, 128);
    const bok = mk(128, 128), bg2 = bok.getContext('2d'), rb = bg2.createRadialGradient(64, 64, 30, 64, 64, 62);
    rb.addColorStop(0, 'rgba(230,255,150,.55)'); rb.addColorStop(.85, 'rgba(240,255,170,.7)'); rb.addColorStop(1, 'rgba(240,255,170,0)');
    bg2.fillStyle = rb; bg2.fillRect(0, 0, 128, 128);
    const fs = LAND ? H * .58 : W * .7, cx = LAND ? W * .58 : W / 2, cy = LAND ? H * .37 : H * .36;
    const pts = shuffle(samplePoints(q => { q.font = `900 ${fs}px 'Noto Serif SC'`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillStyle = '#fff'; q.fillText('你', cx, cy); }, Math.round(fs / 34), 5), 3);
    // 字形本身的一层柔光：光点聚拢时淡淡亮起，让笔画轮廓更清楚
    const word = mk(W, H), wg = word.getContext('2d');
    wg.font = `900 ${fs}px 'Noto Serif SC'`; wg.textAlign = 'center'; wg.textBaseline = 'middle';
    wg.shadowColor = 'rgba(190,255,110,.9)'; wg.shadowBlur = 40 * u; wg.fillStyle = 'rgba(200,250,140,.42)'; wg.fillText('你', cx, cy);
    const flies = [];
    const n = 300 + pts.length;
    for (let i = 0; i < n; i++) {
      const z = i < pts.length ? .1 + .6 * R() : Math.pow(R(), 1.6);                                   // 0 远 … 1 近
      flies.push({ x: R() * W, y: hz - R() * H * (LAND ? .55 : .5) + 60 * u, z, ph: R() * TAU, fq: .35 + .6 * R(), rad: (10 + 40 * R()) * u, w: (R() < .5 ? -1 : 1) * (.4 + .8 * R()),
        rise: (6 + 18 * R()) * u, gather: i < pts.length ? pts[i] : null });
    }
    return { bg, glow, bok, flies, word };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080;
    ctx.drawImage(s.bg, 0, 0);
    const gat = smooth(1.3, 2.2, t) * (1 - smooth(3.3, 4.0, t));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (gat > 0) { ctx.globalAlpha = .55 * eInOutCubic(gat); ctx.drawImage(s.word, 0, 0); }
    for (const p of s.flies) {
      let z = p.z;
      let x = p.x + Math.cos(t * p.w + p.ph) * p.rad + (vnoise(p.ph * 9, t * .4) - .5) * 90 * u * (.4 + p.z);
      let y = p.y - t * p.rise + Math.sin(t * p.w * 1.3 + p.ph) * p.rad * .6;
      const blink = .15 + .85 * Math.pow(Math.max(0, Math.sin(t * TAU * p.fq + p.ph)), 3);
      let b = blink;
      if (p.gather && gat > 0) {
        const jx = Math.sin(t * 3 + p.ph) * 1.5 * u, jy = Math.cos(t * 2.6 + p.ph) * 1.5 * u, e = eInOutCubic(gat);
        x = lerp(x, p.gather[0] + jx, e); y = lerp(y, p.gather[1] + jy, e); b = lerp(blink, .85 + .15 * blink, e);
        z = lerp(p.z, .17, e);                                       // 聚拢时统一成清晰的中号光点
      }
      if (z > .82) {                                                // 近：大光斑
        const r = (40 + 70 * (z - .82) / .18) * u;
        ctx.globalAlpha = .35 * b; ctx.drawImage(s.bok, x - r, y - r, 2 * r, 2 * r);
      } else {
        const r = (3 + 16 * z) * u;
        ctx.globalAlpha = b; ctx.drawImage(s.glow, x - r * 3, y - r * 3, r * 6, r * 6);
        ctx.globalAlpha = Math.min(1, b * 1.3); ctx.fillStyle = '#f4ffd0'; ctx.fillRect(x - r * .25, y - r * .25, r * .5, r * .5);
      }
    }
    ctx.restore();
    vignette(ctx, .5, .45);
  }
});
