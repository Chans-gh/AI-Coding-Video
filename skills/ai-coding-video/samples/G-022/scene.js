// G-022 玻璃水果 ASMR 切割：两张生成的微距图（玻璃猕猴桃、紫晶苹果）当首帧，视频模型连声音一起生成切开的过程；代码按一张时间表剪：切下去之前原速，刀刃压碎的那一秒放慢到 0.35 倍，再回到原速看切面；慢放时在切口上开一个放大 2.4 倍的特写框，用细线连回原画面；两段之间、片尾回到片头都用交叉淡化，首尾同一帧，可以无缝循环
// 素材：生图 2 张、生视频 2 段（各 5 秒，带生成的切割声）。慢放、特写框、标签都是 Canvas 2D 画的；声音只用生成的原声，按同一张时间表拉慢
// 时间表：[片中起, 片中止, 哪段, 素材起点, 速度]——sound.py 用同一张
const SEGS = [
  [0, 1.4, 'kiwi', .5, 1], [1.4, 4.26, 'kiwi', 1.9, .35], [4.26, 6.0, 'kiwi', 2.9, 1],
  [6.0, 8.0, 'apple', .5, 1], [8.0, 10.29, 'apple', 2.5, .35], [10.29, 12.0, 'apple', 3.3, 1],
];
const XF = .5;   // 交叉淡化
scene({
  id: 'G-022', name: '玻璃水果 ASMR 切割', dur: 12.5, still: 2.6,
  fonts: ["700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'JetBrains Mono'"],
  text: '玻璃猕猴桃紫晶苹果慢放特写戴耳机听AI生成不可能的材质',
  async init() {
    return { A: await loadAssets(), kiwi: await loadVideo('kiwi.mp4'), apple: await loadVideo('apple.mp4'), buf: mk(720, 720) };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, INFO = { kiwi: ['玻璃猕猴桃', 'GLASS KIWI', [.56, .5]], apple: ['紫晶苹果', 'AMETHYST APPLE', [.5, .52]] };
    // 第 i 段在 t 时刻对应素材的哪一秒
    const at = (i, t) => { const [t0, , , v0, r] = SEGS[i]; return v0 + (t - t0) * r; };
    let i = SEGS.findIndex(q => t < q[1]); if (i < 0) i = SEGS.length - 1;
    const seg = SEGS[i], clip = seg[2];
    ctx.fillStyle = '#0e0c10'; ctx.fillRect(0, 0, W, H);
    const S = LAND ? 1000 * u : W - 80 * u, mx = LAND ? 80 * u : 40 * u, my = LAND ? 40 * u : 150 * u;
    // 主画面：两段之间、片尾回片头交叉淡化
    const frame = async (name, vt) => { const v = s[name]; await v.at(clamp(vt, 0, v.dur - .05)); const g = s.buf.getContext('2d'); g.drawImage(v.el, 0, 0, 720, 720); return s.buf; };
    ctx.save(); rr(ctx, mx, my, S, S, 26 * u); ctx.clip();
    ctx.drawImage(await frame(clip, at(i, t)), mx, my, S, S);
    let xf = 0, other = null;
    if (t > 6 - XF && t < 6) { xf = inv(6 - XF, 6, t); other = ['apple', .5]; }
    if (t > 12 - XF) { xf = inv(12 - XF, 12.5, t); other = ['kiwi', .5]; }
    if (other && xf > 0) { ctx.globalAlpha = eInOutCubic(xf); ctx.drawImage(await frame(other[0], other[1]), mx, my, S, S); ctx.globalAlpha = 1; }
    ctx.restore();
    // 慢放：切口上的特写框
    const slow = seg[4] < 1 ? Math.min(eOutCubic(inv(seg[0], seg[0] + .35, t)), 1 - eInCubic(inv(seg[1] - .3, seg[1], t))) : 0;
    const [nm, en, [cx, cy]] = INFO[clip];
    if (slow > 0) {
      const z = 2.4, sw = .3, sx = cx - sw / 2, sy = cy - sw / 2;            // 原画面上取的区域（0–1）
      const IS = LAND ? 640 * u : 560 * u, ix = LAND ? mx + S + 140 * u : W - IS - 40 * u, iy = LAND ? 300 * u : my + S + 60 * u;
      const rx = mx + sx * S, ry = my + sy * S, rs = sw * S;
      ctx.globalAlpha = slow; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5 * u;
      ctx.strokeRect(rx, ry, rs, rs);
      ctx.beginPath(); ctx.moveTo(rx + rs, ry); ctx.lineTo(ix, iy); ctx.moveTo(LAND ? rx + rs : rx, ry + rs); ctx.lineTo(LAND ? ix : ix, iy + IS); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
      ctx.save(); ctx.translate(ix + IS / 2, iy + IS / 2); ctx.scale(lerp(.85, 1, slow), lerp(.85, 1, slow));
      ctx.beginPath(); ctx.rect(-IS / 2, -IS / 2, IS, IS); ctx.save(); ctx.clip();
      ctx.drawImage(s.buf, sx * 720, sy * 720, sw * 720, sw * 720, -IS / 2, -IS / 2, IS, IS);
      ctx.restore(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4 * u; ctx.strokeRect(-IS / 2, -IS / 2, IS, IS);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `400 ${24 * u}px 'JetBrains Mono'`;
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(-IS / 2, -IS / 2, 260 * u, 46 * u); ctx.fillStyle = '#fff';
      ctx.fillText(`×${z.toFixed(1)}  0.35×`, -IS / 2 + 14 * u, -IS / 2 + 11 * u);
      ctx.restore(); ctx.globalAlpha = 1;
      // 慢放指示
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `700 ${34 * u}px 'Noto Sans SC'`; ctx.fillStyle = `rgba(255,255,255,${slow})`;
      ctx.fillText('慢放', mx + 30 * u, my + S - 50 * u);
    }
    // 标签：材质名
    const la = Math.min(eOutCubic(inv(seg[2] === 'kiwi' ? 0 : 6, (seg[2] === 'kiwi' ? 0 : 6) + .5, t)), 1);
    ctx.globalAlpha = la; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const tx = LAND ? mx + S + 140 * u : 60 * u, ty = LAND ? 170 * u : my + S + (slow > 0 ? 680 : 140) * u;
    if (LAND || slow <= 0) {
      ctx.font = `400 ${26 * u}px 'JetBrains Mono'`; ctx.fillStyle = clip === 'kiwi' ? '#b8e06a' : '#c9a2ff'; ctx.fillText(en, tx, ty - 70 * u);
      ctx.font = `700 ${(LAND ? 72 : 80) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff'; ctx.fillText(nm, tx, ty + 10 * u);
    }
    ctx.globalAlpha = 1;
    // 角标：ASMR 和 AI 生成
    ctx.font = `400 ${26 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.textAlign = 'right';
    ctx.fillText('ASMR · 戴耳机听', W - 40 * u, H - 40 * u);
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(ctx, mx + 24 * u, my + 24 * u, 150 * u, 46 * u, 10 * u); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.font = `700 ${24 * u}px 'Noto Sans SC'`; ctx.fillText('AI 生成', mx + 50 * u, my + 48 * u);
  }
});
