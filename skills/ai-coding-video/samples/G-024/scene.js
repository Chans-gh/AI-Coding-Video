// G-024 首尾帧变装卡点：生成一个虚构卡通女孩「变装前」的全身图，再以它为参考图生成同一角色换上通勤装的「变装后」，两张图当首帧和尾帧用首尾帧生视频生成转身换装；代码按配乐算出的节拍（beats.py：72.8 BPM，一拍 0.824 秒）剪：前 4 拍是变装前的定格，每拍一顿推、逐拍弹出单品标签；第 4 拍切进变装视频，转到背面的那一下落在第 6 拍并闪白；第 8 拍正好是视频的最后一帧，接上变装后的高清图，之后每拍弹一个单品价签，第 14 拍落整套价格
// 素材：生图 2 张（变装前、变装后）、生视频 1 段（grok 首尾帧，5 秒）；配乐 CC0。标签、价签、节拍推镜都是 Canvas 2D 画的
const BT = .8243, bt = n => n * BT;
scene({
  id: 'G-024', name: '首尾帧变装卡点', dur: 13.2, still: 11.7,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'"],
  text: '日常通勤变装前后灰色连帽卫衣浅蓝牛仔裤白色帆布鞋燕麦色羊毛大衣黑色高领毛衣直筒长裤棕色短靴酒红小包整套到手价AI生成虚构角色¥',
  async init() {
    const before = await loadImage('before.jpg'), after = await loadImage('after.jpg');
    const g = mk(8, 8).getContext('2d'); g.drawImage(after, 0, 0, 40, 40, 0, 0, 8, 8);   // 底色取生成图左上角，接缝看不出来
    const d = g.getImageData(0, 0, 8, 8).data; let r = 0, gg = 0, bb = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; }
    return { A: await loadAssets(), before, after, v: await loadVideo('change.mp4'), bg: `rgb(${r / 64 | 0},${gg / 64 | 0},${bb / 64 | 0})` };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, INK = '#2b1d24', RED = '#c2334d';
    const beat = Math.floor(t / BT), since = t - bt(beat), punch = 1 + .035 * Math.exp(-since * 9);
    // 画面：变装前定格（0–4 拍）→ 变装视频（4–8 拍，第 6 拍转到背面）→ 变装后定格（8 拍起）
    let src, phase;
    if (t < bt(4)) { src = s.before; phase = 0; }
    else if (t < bt(8)) {
      phase = 1; const FLIP = 1.75;                                           // 视频里转到背面的时刻
      const vt = t < bt(6) ? lerp(.3, FLIP, inv(bt(4), bt(6), t)) : lerp(FLIP, s.v.dur - .05, inv(bt(6), bt(8), t));
      await s.v.at(vt); src = s.v.el;
    } else { src = s.after; phase = 2; }
    ctx.fillStyle = s.bg; ctx.fillRect(0, 0, W, H);
    const fh = H, fw = H * 9 / 16, fx = LAND ? W * .36 - fw / 2 : (W - fw) / 2, fy = 0;
    const drift = phase === 0 ? lerp(1, 1.05, inv(0, bt(4), t)) : phase === 2 ? lerp(1, 1.05, inv(bt(8), 13.2, t)) : 1;
    const z = phase === 1 ? 1 : punch * drift;
        ctx.save(); ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
    drawCover(ctx, src, fx, fy, fw, fh, { zoom: z, fy: .4 });
    ctx.restore();
    if (LAND) for (const [x0, x1] of [[fx + 80 * u, fx], [fx + fw - 80 * u, fx + fw]]) {   // 画面左右两边羽化进底色
      const gr = ctx.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, s.bg.replace('rgb', 'rgba').replace(')', ',0)')); gr.addColorStop(1, s.bg);
      ctx.fillStyle = gr; ctx.fillRect(Math.min(x0, x1), 0, 80 * u, H);
    }
    const fl = Math.max(t > bt(6) ? 1 - inv(bt(6), bt(6) + .3, t) : 0, t > bt(4) ? 1 - inv(bt(4), bt(4) + .12, t) : 0, t > bt(8) ? (1 - inv(bt(8), bt(8) + .15, t)) * .5 : 0);
    if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
    // 图上的点 → 屏幕（跟着推镜一起放大）
    const P = (x, y) => [fx + fw / 2 + (x - .5) * fw * z, fy + fh * .4 + (y - .4) * fh * z];
    const tag = (txt, price, x, y, side, n, col) => {
      const a = eOutBack(inv(bt(n), bt(n) + .25, t)); if (a <= 0) return;
      const [px, py] = P(x, y), lx = px + side * (LAND ? 170 : 70) * u, ly = py;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(lerp(px, lx, a), ly); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, py, 8 * u, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(lx, ly); ctx.scale(a, a);
      ctx.font = `700 ${30 * u}px 'Noto Sans SC'`; const w1 = ctx.measureText(txt).width;
      ctx.font = `400 ${36 * u}px 'Bebas Neue'`; const w2 = price ? ctx.measureText(price).width + 24 * u : 0;
      const tw = w1 + w2 + 40 * u; let x0 = side > 0 ? 0 : -tw;
      x0 = clamp(x0, 20 * u - lx, W - 20 * u - tw - lx);                 // 竖屏别出画
      ctx.fillStyle = '#fff'; rr(ctx, x0, -30 * u, tw, 60 * u, 30 * u); ctx.fill();
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = INK; ctx.font = `700 ${30 * u}px 'Noto Sans SC'`; ctx.fillText(txt, x0 + 20 * u, 2 * u);
      if (price) { ctx.fillStyle = col || RED; ctx.font = `400 ${36 * u}px 'Bebas Neue'`; ctx.fillText(price, x0 + 20 * u + w1 + 16 * u, 4 * u); }
      ctx.restore();
    };
    if (phase === 0) {
      tag('灰色连帽卫衣', '', .63, .4, 1, 1); tag('浅蓝牛仔裤', '', .37, .72, -1, 2); tag('白色帆布鞋', '', .58, .94, 1, 3);
    }
    if (phase === 2) {
      tag('燕麦色羊毛大衣', '¥699', .3, .5, -1, 9); tag('黑色高领毛衣', '¥199', .53, .27, 1, 10); tag('直筒长裤', '¥259', .42, .76, -1, 11);
      tag('棕色短靴', '¥329', .56, .95, 1, 12); tag('酒红小包', '¥239', .66, .37, 1, 13);
    }
    // 标题：日常 → 通勤，第 4 拍、第 8 拍换字
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const hx = LAND ? W * .62 : 60 * u, hy = LAND ? 300 * u : 200 * u;
    ctx.font = `400 ${(LAND ? 44 : 40) * u}px 'Bebas Neue'`; ctx.fillStyle = RED; ctx.fillText(phase === 0 ? 'BEFORE' : phase === 1 ? '3 · 2 · 1' : 'AFTER', hx, hy - (LAND ? 100 : 90) * u);
    ctx.save(); ctx.translate(hx, hy); const hs = 1 + .06 * Math.exp(-since * 9); ctx.scale(hs, hs);
    ctx.font = `900 ${(LAND ? 96 : 88) * u}px 'Noto Sans SC'`; ctx.lineWidth = 10 * u; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round';
    const head = phase === 0 ? '日常' : phase === 1 ? '变装中' : '通勤';
    ctx.strokeText(head, 0, 0); ctx.fillStyle = INK; ctx.fillText(head, 0, 0); ctx.restore();
    // 节拍点：16 拍，当前拍亮
    for (let i = 0; i < 16; i++) {
      const x = LAND ? W * .62 + i * 30 * u : 66 * u + i * 20 * u, y = hy + (LAND ? 50 : 40) * u;
      ctx.fillStyle = i <= beat ? (i === beat ? RED : INK) : 'rgba(43,29,36,.2)'; ctx.beginPath(); ctx.arc(x, y, (i === beat ? 9 : 6) * u * (i % 4 === 0 ? 1.3 : 1), 0, TAU); ctx.fill();
    }
    // 第 14 拍：整套价格
    const pa = eOutBack(inv(bt(14), bt(14) + .3, t));
    if (pa > 0) {
      const cw = 440 * u, ch = 190 * u, k = LAND ? 1 : .78, cx = LAND ? W * .62 : W - cw * k - 30 * u, cy = LAND ? H - ch - 170 * u : 300 * u;
      ctx.save(); ctx.translate(cx + cw * k / 2, cy + ch * k / 2); ctx.scale(pa * k, pa * k); ctx.rotate(-.04);
      ctx.fillStyle = RED; rr(ctx, -cw / 2, -ch / 2, cw, ch, 24 * u); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.font = `700 ${32 * u}px 'Noto Sans SC'`; ctx.fillText('整套到手价', -cw / 2 + 34 * u, -ch / 2 + 62 * u);
      ctx.font = `400 ${110 * u}px 'Bebas Neue'`; ctx.fillText('¥1725', -cw / 2 + 30 * u, ch / 2 - 26 * u);
      ctx.restore();
    }
    // 常驻：AI 生成 · 虚构角色；署名
    ctx.font = `700 ${24 * u}px 'Noto Sans SC'`; const bw = ctx.measureText('AI 生成 · 虚构角色').width + 36 * u, bx = LAND ? fx + 24 * u : W - bw - 30 * u, by = LAND ? 30 * u : 60 * u;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, bx, by, bw, 46 * u, 10 * u); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('AI 生成 · 虚构角色', bx + 18 * u, by + 24 * u);
    ctx.font = `400 ${18 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(43,29,36,.6)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(credits(s.A), W - 30 * u, H - 22 * u);
  }
});
