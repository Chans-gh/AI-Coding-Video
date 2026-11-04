// C-173 星空连线：几百颗星和一条噪声银河画在一张会绕天极缓慢旋转的天幕上，每颗星按自己的频率闪；“天秤座”的主星按顺序用发光细线一段段连起，笔尖带一个亮点，连好后浮出天平的线描轮廓和星座名又隐去，最后镜头推近顶上那颗星
// 风格提示词：用星空连线风格：深蓝黑夜空里散布着大小亮度不同的星点，细细的发光线一笔一笔把星星连成星座，连好后淡淡浮出线描轮廓又隐去，星点缓慢闪烁、整片天空缓缓旋转，镜头偶尔推近一颗星，配低沉的环境音和细碎的铃声。
// 题材：信息讲解与产品发布 · 适合：天文科普、关系与网络讲解、浪漫告白
// 天秤座：按真实赤经赤纬投影的 6 颗主星（β 在顶上），单位是星座尺寸
const LIBRA = [[-.02, -.9], [.6, -.24], [-.46, -.36], [.28, .69], [-.5, .97], [-.54, 1.14]];   // β α γ σ υ τ
const NAMES = ['β', 'α', 'γ', 'σ', 'υ', 'τ'];
const EDGES = [[3, 1], [1, 0], [0, 2], [2, 1], [2, 4], [4, 5]];
const E0 = .35, ED = .28;                           // 第一条线开始的时刻、每条线用时（sound.py 同步）
scene({
  id: 'C-173', name: '星空连线', dur: 4.2, still: 2.65,
  fonts: ["700 40px 'Noto Serif SC'", "400 20px 'JetBrains Mono'"],
  text: '天秤座LIBRA·βαγσυτ',
  init() {
    const R = mulberry32(31), stars = [];
    for (let i = 0; i < 650; i++) stars.push({ x: (R() * 1.6 - .3) * W, y: (R() * 1.6 - .3) * H, m: Math.pow(R(), 3), ph: R() * TAU, fq: .5 + 2 * R(), warm: R() < .2 });
    const mw = mk(W / 2, H / 2), g = mw.getContext('2d'), id = g.createImageData(W / 2, H / 2), d = id.data;
    for (let y = 0; y < H / 2; y++) for (let x = 0; x < W / 2; x++) {   // 斜穿天空的一条银河
      const k = (x * .6 + y * (LAND ? 1 : .35)) / (W / 2) - .55, band = Math.exp(-k * k * 16);
      const n = fbm(x / 90, y / 90, 5), v = band * Math.max(0, n - .4) * 1.6, i = (y * W / 2 + x) * 4;
      d[i] = 120 + 60 * n; d[i + 1] = 130 + 50 * n; d[i + 2] = 200; d[i + 3] = 255 * Math.min(.22, v * .5 + band * .05);
    }
    g.putImageData(id, 0, 0);
    return { stars, mw };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#03061a'); bg.addColorStop(1, '#0e1a3c');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const sc = SHORT * (LAND ? .3 : .36), kx = LAND ? W * .62 : W / 2, ky = LAND ? H * .46 : H * .36;
    const P = LIBRA.map(([x, y]) => [kx + x * sc, ky + y * sc]);
    // 镜头：最后推近顶上那颗星（β）
    const z = 1 + .55 * eInOutCubic(inv(2.9, 4.2, t));
    ctx.save(); ctx.translate(P[0][0], P[0][1]); ctx.scale(z, z); ctx.translate(-P[0][0], -P[0][1]);
    ctx.translate(W * .5, -H * .9); ctx.rotate(t * .018); ctx.translate(-W * .5, H * .9);     // 绕画面外的天极转
    ctx.drawImage(s.mw, -W * .2, -H * .2, W * 1.4, H * 1.4);
    for (const st of s.stars) {
      const tw = .55 + .45 * Math.sin(t * st.fq * TAU + st.ph), r = (.8 + 2.6 * st.m) * u;
      ctx.fillStyle = st.warm ? `rgba(255,225,190,${(.35 + .65 * st.m) * tw})` : `rgba(210,225,255,${(.35 + .65 * st.m) * tw})`;
      ctx.beginPath(); ctx.arc(st.x, st.y, r, 0, TAU); ctx.fill();
    }
    // 连线：一段段画出，笔尖一个亮点
    ctx.lineCap = 'round';
    EDGES.forEach(([a, b], k) => {
      const p = inv(E0 + k * ED, E0 + (k + 1) * ED, t); if (p <= 0) return;
      const x = lerp(P[a][0], P[b][0], eInOutCubic(p)), y = lerp(P[a][1], P[b][1], eInOutCubic(p));
      ctx.strokeStyle = 'rgba(140,200,255,.25)'; ctx.lineWidth = 7 * u;
      ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(x, y); ctx.stroke();
      ctx.strokeStyle = 'rgba(215,236,255,.9)'; ctx.lineWidth = 1.8 * u; ctx.stroke();
      if (p < 1) { const gl = ctx.createRadialGradient(x, y, 0, x, y, 22 * u); gl.addColorStop(0, 'rgba(255,255,255,.95)'); gl.addColorStop(1, 'rgba(160,210,255,0)'); ctx.fillStyle = gl; ctx.fillRect(x - 22 * u, y - 22 * u, 44 * u, 44 * u); }
    });
    // 星座的星：亮、带十字星芒
    P.forEach(([x, y], i) => {
      const lit = t > E0 + EDGES.findIndex(e => e.includes(i)) * ED;
      const r = (lit ? 5.5 : 3.5) * u * (.9 + .1 * Math.sin(t * 5 + i));
      const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 6); gl.addColorStop(0, 'rgba(235,245,255,.9)'); gl.addColorStop(1, 'rgba(150,200,255,0)');
      ctx.fillStyle = gl; ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
      ctx.strokeStyle = `rgba(230,240,255,${lit ? .7 : .3})`; ctx.lineWidth = 1.2 * u;
      ctx.beginPath(); ctx.moveTo(x - r * 4, y); ctx.lineTo(x + r * 4, y); ctx.moveTo(x, y - r * 4); ctx.lineTo(x, y + r * 4); ctx.stroke();
    });
    // 连好后浮出线描轮廓：一杆秤，β 是支点，两端挂着秤盘
    const o = smooth(2.1, 2.6, t) * (1 - smooth(3.2, 3.8, t));
    if (o > 0) {
      ctx.strokeStyle = `rgba(190,215,255,${.55 * o})`; ctx.lineWidth = 1.6 * u; ctx.setLineDash([10 * u, 7 * u]);
      const [bx, by] = P[0], L = [P[2][0] - .12 * sc, P[2][1] + .04 * sc], Rt = [P[1][0] + .12 * sc, P[1][1] - .04 * sc];
      ctx.beginPath(); ctx.moveTo(bx, by - .12 * sc); ctx.lineTo(bx, (L[1] + Rt[1]) / 2);          // 支柱
      ctx.moveTo(...L); ctx.lineTo(...Rt);                                                      // 秤杆
      for (const [e, pan] of [[L, [P[4][0] + .05 * sc, P[4][1] + .1 * sc]], [Rt, [P[3][0] + .05 * sc, P[3][1] + .1 * sc]]]) {
        const w = .42 * sc;
        ctx.moveTo(...e); ctx.lineTo(pan[0] - w, pan[1]); ctx.moveTo(...e); ctx.lineTo(pan[0] + w, pan[1]);
        ctx.moveTo(pan[0] - w, pan[1]); ctx.quadraticCurveTo(pan[0], pan[1] + .28 * sc, pan[0] + w, pan[1]);   // 秤盘
      }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.font = `400 ${Math.round(18 * u)}px 'JetBrains Mono'`; ctx.fillStyle = `rgba(170,195,240,${.8 * o})`; ctx.textAlign = 'left';
      P.forEach(([x, y], i) => ctx.fillText(NAMES[i], x + 12 * u, y - 10 * u));
      ctx.fillStyle = `rgba(225,235,255,${o})`; ctx.textAlign = LAND ? 'right' : 'center';
      const lx = LAND ? kx - sc * .95 : kx, ly = LAND ? ky + sc * .15 : ky + sc * 1.75;
      ctx.font = `700 ${Math.round(52 * u)}px 'Noto Serif SC'`; ctx.fillText('天秤座', lx, ly);
      ctx.font = `400 ${Math.round(20 * u)}px 'JetBrains Mono'`; ctx.fillStyle = `rgba(170,195,240,${o})`; ctx.fillText('LIBRA · 6 STARS', lx, ly + 40 * u);
    }
    ctx.restore();
    vignette(ctx, .6, .4);
  }
});
