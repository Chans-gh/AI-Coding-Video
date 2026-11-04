// C-184 书法：字形来自毛笔字体（马善政楷书），笔顺和笔速是自己标的：每一笔是字形里的一条中线，写到哪里就沿中线画一束二十几根“笔毛”当遮罩，只露出遮罩下的字形；越到笔画末端墨越少，一部分笔毛按各自的阈值断开，露出纸纹，就是飞白。镜头放大跟着笔尖走，写完拉远看整幅，最后盖一方朱印
// 风格提示词：用书法风格：米色宣纸上一支毛笔按笔顺一笔笔写出大字，起笔藏锋、收笔回锋，墨色随笔速从浓到枯变化，飞白处露出纸纹，每幅字写完盖一方朱印，镜头跟着笔尖移动，写完再拉远看整幅，声音只有毛笔擦过纸面的沙沙声。
// 题材：东方传统 · 适合：标题与片名、诗词展示、文化品牌片
// 笔画：字、开始和结束时刻（sound.py 同步）、末端干到什么程度、中线（单位是字号，原点在字中心）
const STROKES = [
  ['山', .25, .65, .25, [[-.03, -.33], [-.02, -.1], [-.02, .15], [-.03, .37]]],
  ['山', .72, 1.25, .45, [[-.33, -.01], [-.35, .15], [-.38, .32], [-.25, .28], [-.05, .23], [.15, .23], [.27, .28]]],
  ['山', 1.3, 1.4, .2, [[-.25, .1], [-.18, .2]]],
  ['山', 1.46, 1.72, .5, [[.31, .03], [.32, .15], [.3, .33]]],
  ['水', 1.85, 2.3, .4, [[-.05, -.41], [-.04, -.15], [-.05, .1], [-.08, .3], [-.1, .43], [-.22, .34]]],
  ['水', 2.36, 2.78, .55, [[-.38, .03], [-.25, -.03], [-.13, -.05], [-.18, .1], [-.3, .25], [-.44, .4]]],
  ['水', 2.84, 3.0, .35, [[.22, -.22], [.12, -.1], [.01, .0]]],
  ['水', 3.06, 3.4, .5, [[.0, .03], [.12, .15], [.28, .28], [.44, .31]]],
];
const NB = 24;                                         // 笔毛根数
scene({
  id: 'C-184', name: '书法', dur: 4.8, still: 4.5,
  fonts: ["400 40px 'Ma Shan Zheng'", "700 40px 'Noto Serif SC'"],
  text: '山水墨戏清欢',
  init() {
    const F = LAND ? H * .6 : W * .6;
    const pos = LAND ? { '山': [W * .35, H * .47], '水': [W * .63, H * .47] } : { '山': [W * .52, H * .31], '水': [W * .52, H * .64] };
    // 字形层：两个字一次画好
    const glyph = mk(W, H), g = glyph.getContext('2d');
    g.fillStyle = '#14100c'; g.font = `400 ${F}px 'Ma Shan Zheng'`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [c, [x, y]] of Object.entries(pos)) g.fillText(c, x, y);
    // 每一笔：屏幕坐标的采样点；每根笔毛的“断墨”阈值
    const R = mulberry32(8);
    const strokes = STROKES.map(([c, t0, t1, dry, pts], k) => {
      const [cx, cy] = pos[c];
      return { t0, t1, dry, P: resample(pts.map(([x, y]) => [cx + x * F, cy + y * F]), 70), h: Array.from({ length: NB }, () => R()), k };
    });
    const paper = makePaper('#efe4cc', { seed: 6, fiber: .25, grain: 22 });
    return { F, glyph, strokes, mask: mk(W, H), ink: mk(W, H), paper, pos };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, F = s.F;
    // ---- 遮罩：已写的笔画用一束笔毛画出 ----
    const m = s.mask.getContext('2d'); m.clearRect(0, 0, W, H);
    let tip = null, tipDir = [0, 1];
    const bw = F * .17;                                  // 笔画遮罩宽度
    for (const st of s.strokes) {
      const p = eInOutCubic(inv(st.t0, st.t1, t)); if (p <= 0) continue;
      const n = Math.max(1, Math.round(p * (st.P.length - 1)));
      for (let j = 0; j < NB; j++) {
        const off = (j / (NB - 1) - .5) * bw, edge = Math.abs(j / (NB - 1) - .5) * 2;
        m.strokeStyle = '#000'; m.lineWidth = bw / NB * 1.9; m.lineCap = 'butt';
        m.beginPath(); let on = false;
        for (let i = 0; i <= n; i++) {
          const q = st.P[i], sp = i / (st.P.length - 1);
          const dry = st.dry * smooth(.5, 1, sp) * (1 + edge * .9);                  // 越往后、越靠边越干
          const gap = st.h[j] < dry || vnoise(j * 7.1 + st.k * 31, sp * 6) < dry * .3;
          const taper = Math.min(1, .55 + sp * 6, .45 + (1 - sp) * 4);              // 起笔、收笔收窄
          const x = q.x + q.nx * off * taper, y = q.y + q.ny * off * taper;
          if (!gap) { on ? m.lineTo(x, y) : m.moveTo(x, y); on = true; } else on = false;
        }
        m.stroke();
      }
      if (p < 1) { const q = st.P[n]; tip = [q.x, q.y]; tipDir = [q.ny, -q.nx]; }
    }
    // ---- 墨：字形只留遮罩下的部分 ----
    const k = s.ink.getContext('2d'); k.clearRect(0, 0, W, H);
    k.globalCompositeOperation = 'source-over'; k.drawImage(s.glyph, 0, 0);
    k.globalCompositeOperation = 'destination-in'; k.drawImage(s.mask, 0, 0);
    k.globalCompositeOperation = 'source-over';
    // ---- 镜头：写字时放大跟着笔尖（取前 0.4 秒笔尖位置的平均，所以是平滑的），写完拉远 ----
    const tipAt = tt => {                                  // tt 时刻笔尖所在（两笔之间停在上一笔的末尾）
      let st = s.strokes[0]; for (const q of s.strokes) if (q.t0 <= tt) st = q;
      const q = st.P[Math.round(eInOutCubic(inv(st.t0, st.t1, tt)) * (st.P.length - 1))]; return [q.x, q.y];
    };
    let fx = 0, fy = 0;
    for (let i = 0; i < 10; i++) { const q = tipAt(t - i * .04); fx += q[0] / 10; fy += q[1] / 10; }
    const pull = eInOutCubic(inv(3.4, 4.1, t)), Z = lerp(1.5, 1, pull);
    fx = lerp(fx, W / 2, pull); fy = lerp(fy, H / 2, pull);
    fx = clamp(fx, W / 2 / Z, W - W / 2 / Z); fy = clamp(fy, H / 2 / Z, H - H / 2 / Z);   // 镜头不出纸面
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(Z, Z); ctx.translate(-fx, -fy);
    ctx.drawImage(s.paper, 0, 0, W, H);
    ctx.save(); ctx.shadowColor = 'rgba(20,14,8,.35)'; ctx.shadowBlur = 5 * u * Z; ctx.drawImage(s.ink, 0, 0); ctx.restore();   // 墨边微微晕开
    // 落款和朱印
    const sx = LAND ? W * .84 : W * .16, sy = LAND ? H * .28 : H * .5;
    const la = smooth(3.7, 4.0, t);
    if (la > 0) {
      ctx.fillStyle = `rgba(20,16,12,${.85 * la})`; ctx.font = `400 ${Math.round(F * .13)}px 'Ma Shan Zheng'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      [...'墨戏'].forEach((c, i) => ctx.fillText(c, sx, sy + i * F * .15));
    }
    const sa = inv(4.05, 4.2, t);
    if (sa > 0) {
      const sz = F * .16, sc = 1 + .25 * (1 - eOutCubic(sa)), y0 = sy + F * .38;
      ctx.save(); ctx.translate(sx, y0 + sz / 2); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, sa * 1.5);
      ctx.fillStyle = '#b8261c'; ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
      ctx.fillStyle = '#f1e2c8'; ctx.font = `700 ${Math.round(sz * .38)}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('清', 0, -sz * .2); ctx.fillText('欢', 0, sz * .22);
      ctx.globalCompositeOperation = 'destination-out';                  // 印泥不匀：边上掉几块
      const R = mulberry32(3); for (let i = 0; i < 40; i++) { ctx.globalAlpha = .5 * R(); ctx.beginPath(); ctx.arc((R() - .5) * sz, (R() - .5) * sz, R() * sz * .05, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // 毛笔：笔尖在当前位置，笔杆斜向右上
    if (tip && t < 3.42) {
      const [x, y] = tip, a = -1.05 + tipDir[0] * .15;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(10 * u, 30 * u, F * .9, 22 * u);                       // 影子
      ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(F * .05, -14 * u, F * .14, -15 * u); ctx.lineTo(F * .14, 15 * u); ctx.quadraticCurveTo(F * .05, 14 * u, 0, 0); ctx.fill();
      const bam = ctx.createLinearGradient(0, -14 * u, 0, 14 * u); bam.addColorStop(0, '#c9a46a'); bam.addColorStop(.5, '#e8cf98'); bam.addColorStop(1, '#9c7a45');
      ctx.fillStyle = bam; ctx.fillRect(F * .14, -13 * u, F * .9, 26 * u);
      ctx.fillStyle = 'rgba(90,60,30,.5)'; for (const kx of [.45, .75]) ctx.fillRect(F * kx, -13 * u, 5 * u, 26 * u);
      ctx.restore();
    }
    ctx.restore();
  }
});
