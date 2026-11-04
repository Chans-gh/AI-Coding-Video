// G-006 无限放大拼贴：四张 AI 生成的画，每张正中有一个圆形「洞口」（窗、漩涡、气泡），代码一直往洞口推近，把下一张画缩小后用羽化圆形遮罩嵌在洞里，快推满时圆外也渐渐显出下一张，到头正好变成下一张的全貌，一层层钻进去；歌词跟着推进一个字一个字亮起
// 素材：生图 ×4（青水）；配乐 CC0。每张图洞口的中心和半径写在 HOLES 里（量图得到）
const HOLES = [            // 洞口中心 (x, y，占图宽高的比例)、半径（占图宽）、这张图铺满画面时多放大一点（裁掉纸边）
  { x: .500, y: .390, r: .125, bz: 1.0 },
  { x: .497, y: .534, r: .140, bz: 1.0 },
  { x: .495, y: .510, r: .130, bz: 1.12 },
  { x: .497, y: .520, r: .100, bz: 1.0 },
];
const LYRICS = ['推开那扇圆窗', '落进海的漩涡', '穿过一颗气泡', '原来你在这里'];
const T0 = .8, SEG = 3.5;      // 0.8 秒起推，每层 3.5 秒
scene({
  id: 'G-006', name: '无限放大拼贴', dur: 14, still: 6.1,
  fonts: ["700 40px 'Noto Serif SC'", "400 40px 'Noto Sans SC'"],
  text: LYRICS.join('') + '画面生成配乐',
  async init() {
    const A = await loadAssets();
    const imgs = [];
    for (let i = 1; i <= 4; i++) imgs.push(await loadImage(`z${i}.jpg`));
    const off = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });
    return { A, imgs, off };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    const Z = clamp((t - T0) / SEG, 0, 3), L = Math.min(3, Math.floor(Z)), f = L < 3 ? Z - L : .35 * smooth(T0 + 3 * SEG, 14, t);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    level(ctx, s, L, f, 1, 0, 0, 0);
    // 歌词：每层一句，字随推进逐个亮起
    const li = Math.min(3, Math.floor(clamp((t - T0 + .3) / SEG, 0, 3.99)));
    const line = LYRICS[li], p = clamp((t - T0 + .3 - li * SEG) / (SEG * .7), 0, 1);
    ctx.save(); ctx.font = `700 ${(LAND ? 64 : 76) * u}px 'Noto Serif SC'`; ctx.textBaseline = 'middle';
    const cw = (LAND ? 74 : 88) * u, x0 = W / 2 - cw * (line.length - 1) / 2, y = H - (LAND ? 130 : 300) * u;
    [...line].forEach((ch, i) => {
      const k = clamp(p * line.length - i, 0, 1), a = .25 + .75 * k;
      ctx.textAlign = 'center'; ctx.shadowColor = `rgba(255,230,170,${.8 * k})`; ctx.shadowBlur = 24 * u * k;
      ctx.fillStyle = `rgba(255,248,232,${a})`; ctx.fillText(ch, x0 + i * cw, y - 10 * u * eOutBack(k) + 10 * u);
    });
    ctx.restore();
    ctx.save(); ctx.font = `400 ${17 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 28 * u, H - 22 * u); ctx.restore();
  },
});

// 画第 i 张图在推进 f（0–1）时的样子；(k, tx, ty) 把整屏坐标映射到 ctx 上（嵌套时缩小到洞口里）
function level(ctx, s, i, f, k, tx, ty, depth) {
  const img = s.imgs[i], hl = HOLES[i], iw = img.width, ih = img.height;
  const sc0 = Math.max(W / iw, H / ih) * hl.bz;
  const ox0 = W / 2 - iw / 2 * sc0, oy0 = H / 2 - ih / 2 * sc0;
  const hx = hl.x * iw, hy = hl.y * ih, R = hl.r * iw;
  const K = Math.min(W, H) / 2 * .92 / (R * sc0);         // 放大 K 倍时洞口正好是下一张整屏视图的内切圆（圆在下一张的画框里，看不到画框边）
  const z = Math.pow(K, f), g = (z - 1) / (K - 1);
  const sx0 = ox0 + hx * sc0, sy0 = oy0 + hy * sc0;        // 起始时洞口在屏幕上的位置
  const hcx = W / 2 + (sx0 - W / 2) * (1 - g), hcy = H / 2 + (sy0 - H / 2) * (1 - g);   // 推进中洞口慢慢移到屏幕中心
  const sc = sc0 * z;
  ctx.drawImage(img, k * (hcx - hx * sc) + tx, k * (hcy - hy * sc) + ty, k * iw * sc, k * ih * sc);
  if (i + 1 >= s.imgs.length || depth > 1) return;
  const rad = R * sc * k;
  if (rad < 3) return;
  // 下一张：它的整屏视图缩成 1/K 放在洞口上，用羽化的圆遮住
  const o = s.off[depth], oc = o.getContext('2d');
  oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'source-over'; oc.clearRect(0, 0, W, H);
  const k2 = k * z / K, cx = k * hcx + tx, cy = k * hcy + ty;
  level(oc, s, i + 1, 0, k2, cx - k2 * W / 2, cy - k2 * H / 2, depth + 1);
  const a = depth === 0 ? smooth(.85, 1, f) : 0;           // 快推满时圆外也慢慢显出下一张，到 f = 1 正好整屏换成它
  const gr = oc.createRadialGradient(cx, cy, rad * .8, cx, cy, rad);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, `rgba(0,0,0,${a})`);
  oc.globalCompositeOperation = 'destination-in'; oc.fillStyle = gr; oc.fillRect(0, 0, W, H);
  oc.globalCompositeOperation = 'source-over';
  ctx.drawImage(o, 0, 0);
}
