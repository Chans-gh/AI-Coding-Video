// T-014 讲义转片：NASA《系统工程手册》的两页扫描放在工作台上，代码读这一页的文字层（每个词的位置），自己找到要讲的那句话在哪：荧光笔划过、镜头推近、抽成引文卡（原文 + 中文译文 + 页码）；图示页按顺序圈出三块、编号配中文要点；结尾三条要点和出处
// 素材：照片（手册页面扫描两页）、数据（这两页的文字层）；配乐 CC0。中文译文和要点是本仓库写的
const Q1 = 'a methodical, multi-disciplinary approach for the design, realization, technical management, operations, and retirement of a system';
const Q2 = 'systems engineering is a logical way of thinking';
const ZONES = [ // [图示页上的标题词, 编号, 中文要点, 素材坐标外扩]
  ['System Design Processes', '设计', '需求从上往下分解成设计'],
  ['Technical Management Processes', '管理', '计划、控制、评估，贯穿全程'],
  ['Product Realization Processes', '实现', '从零件往上集成、验证、交付'],
];
const HL = 'rgba(255,214,0,.45)';
scene({
  id: 'T-014', name: '讲义转片', dur: 14, still: 4.6,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Noto Serif SC'", "700 40px 'Noto Serif SC'", "700 40px 'JetBrains Mono'"],
  text: '新人培训三分钟读懂系统工程讲义手册第页原文一套有条理跨学科的方法管一个系统从设计实现技术管理运行到退役的全过程归根结底是一种有逻辑的思考方式需求从上往下分解成设计计划控制评估贯穿全程从零件往上集成验证交付三条要点出处译文本仓库写的扫描文字层配乐',
  async init() {
    const A = await loadAssets();
    const pg = {};
    for (const n of ['16', '19']) pg[n] = { img: await loadImage(`p${n}.jpg`), words: JSON.parse(await loadText(`p${n}.json`)).map(([word, x0, y0, x1, y1]) => ({ word, x0, y0, x1, y1 })) };
    const q1 = find(pg['16'].words, Q1), q2 = find(pg['16'].words, Q2);
    const zones = ZONES.map(([label, zh, note], i) => {
      const r = find(pg['19'].words, label), b = r[0];
      return { i, zh, note, box: [b.x0 - .05, b.y0 - .012, b.x1 - b.x0 + .1, .26] };
    });
    return { A, pg, q1, q2, zones };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    ctx.fillStyle = '#e6e3dc'; ctx.fillRect(0, 0, W, H);
    const rng = mulberry32(5); ctx.fillStyle = 'rgba(0,0,0,.035)';
    for (let i = 0; i < 400; i++) ctx.fillRect(rng() * W, rng() * H, 3 * u, 3 * u);
    // 镜头：[起, 止, 第几页, 焦点框（页面坐标 0–1）, 放大倍数]
    const box1 = bounds(s.q1), box2 = bounds(s.q2), fig = [.07, .2, .86, .48];
    const SH = [[0, 1.4, '16', [0, 0, 1, 1], 1], [1.4, 2.4, '16', [0, 0, 1, 1], 1], [2.4, 3.6, '16', box1, LAND ? 1.9 : 2.2],
      [3.6, 6.0, '16', box1, LAND ? 1.9 : 2.2], [6.0, 6.8, '19', fig, 1.15], [6.8, 10.2, '19', fig, LAND ? 1.25 : 1.6],
      [10.2, 10.8, '16', box2, 1.2], [10.8, 12.4, '16', box2, LAND ? 2.2 : 2.5], [12.4, 14, '16', box2, 1]];
    let k = SH.length - 1; while (SH[k][0] > t) k--;
    const [a0, a1, pn] = SH[k], prev = SH[Math.max(0, k - 1)];
    const e = eInOutCubic(inv(a0, Math.min(a1, a0 + 1.0), t));
    const same = prev[2] === pn;
    const fb = same ? lerpBox(prev[3], SH[k][3], e) : SH[k][3], zm = (same ? lerp(prev[4], SH[k][4], e) : SH[k][4]) * (1 + .02 * (t - a0));   // 停住的镜头也慢慢推近
    const page = s.pg[pn];
    // 页面在画面里的基本位置：横屏放左边 60%，竖屏放上面
    const area = LAND ? [W * .06, H * .08, W * .5, H * .84] : [W * .07, H * .1, W * .86, H * .52];
    const ar = 1082 / 1400, ph = Math.min(area[3], area[2] / ar), pw = ph * ar;
    const bx = area[0] + (area[2] - pw) / 2, by = area[1] + (area[3] - ph) / 2;
    const fcx = fb[0] + fb[2] / 2, fcy = fb[1] + fb[3] / 2;
    const tx = (area[0] + area[2] / 2) - (bx + fcx * pw) * zm, ty = (area[1] + area[3] / 2) - (by + fcy * ph) * zm;
    const enter = eOutCubic(inv(.1, 1.0, t)), swap = pn === '19' ? eOutCubic(inv(6.0, 6.5, t)) : pn === '16' && t >= 10.2 && t < 10.7 ? eOutCubic(inv(10.2, 10.7, t)) : 1;
    ctx.save();
    ctx.beginPath(); ctx.rect(LAND ? 0 : 0, 0, LAND ? W * .62 : W, LAND ? H : H * .66); ctx.clip();
    ctx.translate(0, (1 - enter) * H * .3 + (1 - swap) * H * .15); ctx.globalAlpha = Math.min(enter, swap) * (1 - .7 * smooth(12.4, 12.8, t));
    ctx.translate(tx, ty); ctx.scale(zm, zm);
    ctx.save(); ctx.shadowColor = 'rgba(40,30,10,.28)'; ctx.shadowBlur = 30 * u / zm; ctx.shadowOffsetY = 12 * u / zm;
    ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, pw, ph); ctx.restore();
    ctx.drawImage(page.img, bx, by, pw, ph);
    const P = (x, y) => [bx + x * pw, by + y * ph];
    // 荧光笔：按行从左到右划过
    const mark = (lines, t0, t1) => {
      const tot = lines.reduce((a, l) => a + l.x1 - l.x0, 0); let acc = 0;
      const p = inv(t0, t1, t) * tot;
      for (const l of lines) {
        const w = clamp(p - acc, 0, l.x1 - l.x0); acc += l.x1 - l.x0; if (w <= 0) continue;
        const [x, y] = P(l.x0 - .003, l.y0 - .002); ctx.fillStyle = HL; ctx.fillRect(x, y, (w + .006) * pw, (l.y1 - l.y0 + .004) * ph);
      }
    };
    if (pn === '16' && t < 10.2) mark(s.q1, 1.6, 3.0);
    if (pn === '16' && t >= 10.2) mark(s.q2, 10.5, 11.2);
    if (pn === '19') s.zones.forEach(z => {
      const t0 = 6.9 + z.i * 1.1, a = eOutCubic(inv(t0, t0 + .35, t)); if (a <= 0) return;
      const [x, y] = P(z.box[0], z.box[1]), w = z.box[2] * pw, h = z.box[3] * ph;
      ctx.save(); ctx.strokeStyle = '#e8590c'; ctx.lineWidth = 4 * u / zm; ctx.globalAlpha *= a;
      rr(ctx, x, y, w, h, 14 * u / zm); ctx.stroke();
      ctx.fillStyle = '#e8590c'; ctx.beginPath(); ctx.arc(x, y, 22 * u / zm, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${26 * u / zm}px 'JetBrains Mono'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(z.i + 1, x, y + 1);
      ctx.restore();
    });
    ctx.restore();
    // 右侧（竖屏是下方）的讲解区
    const cx = LAND ? W * .66 : W * .08, cw = LAND ? W * .29 : W * .84, top = LAND ? H * .14 : H * .69;
    ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    const show = (t0, t1) => smooth(t0, t0 + .35, t) * (1 - smooth(t1 - .3, t1, t));
    // 片头
    let a = show(0, 1.6);
    if (a > 0) { ctx.globalAlpha = a; tagline(ctx, cx, top, cw, u, '新人培训 · 第 2 章', '3 分钟读懂系统工程', '讲义：NASA Systems Engineering Handbook（2016）'); }
    // 引文卡 1
    a = show(3.2, 6.0);
    if (a > 0) { ctx.globalAlpha = a; quote(ctx, cx, top, cw, u, '“…a methodical, multi-disciplinary approach for the design, realization, technical management, operations, and retirement of a system.”', '系统工程：一套有条理、跨学科的方法，管一个系统从设计、实现、技术管理、运行到退役的全过程。', '原文第 3 页'); }
    // 图示页的三块
    a = show(6.4, 10.2);
    if (a > 0) {
      ctx.globalAlpha = a;
      ctx.font = `900 ${(LAND ? 40 : 46) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#222'; ctx.fillText('系统工程的「引擎」', cx, top + 20 * u);
      ctx.font = `400 ${20 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#777'; ctx.fillText('原文第 6 页 · Figure 2.1-1', cx, top + 56 * u);
      s.zones.forEach(z => {
        const t0 = 6.9 + z.i * 1.1, b = eOutCubic(inv(t0 + .1, t0 + .45, t)); if (b <= 0) return;
        const y = top + (LAND ? 130 : 110) * u + z.i * (LAND ? 130 : 100) * u;
        ctx.globalAlpha = a * b;
        ctx.fillStyle = '#e8590c'; ctx.beginPath(); ctx.arc(cx + 24 * u + (1 - b) * 30 * u, y, 24 * u, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `700 ${26 * u}px 'JetBrains Mono'`; ctx.textAlign = 'center'; ctx.fillText(z.i + 1, cx + 24 * u + (1 - b) * 30 * u, y + 9 * u);
        ctx.textAlign = 'left'; ctx.fillStyle = '#222'; ctx.font = `700 ${34 * u}px 'Noto Sans SC'`; ctx.fillText(z.zh, cx + 66 * u, y + 12 * u);
        ctx.fillStyle = '#555'; ctx.font = `400 ${(LAND ? 24 : 28) * u}px 'Noto Sans SC'`;
        ctx.fillText(z.note, LAND ? cx + 66 * u : cx + 150 * u, LAND ? y + 52 * u : y + 12 * u);
      });
    }
    // 引文卡 2
    a = show(11.0, 12.5);
    if (a > 0) { ctx.globalAlpha = a; quote(ctx, cx, top, cw, u, '“…systems engineering is a logical way of thinking.”', '归根结底，系统工程是一种有逻辑的思考方式。', '原文第 3 页'); }
    // 结尾：三条要点
    a = smooth(12.4, 12.8, t);
    if (a > 0) {
      ctx.globalAlpha = a;
      const ox = LAND ? W * .12 : W * .08, oy = LAND ? H * .2 : H * .3, ow = LAND ? W * .76 : W * .84;
      ctx.fillStyle = 'rgba(255,255,255,.94)'; rr(ctx, ox, oy, ow, LAND ? H * .6 : H * .42, 20 * u); ctx.fill();
      ctx.fillStyle = '#e8590c'; ctx.fillRect(ox, oy, 10 * u, LAND ? H * .6 : H * .42);
      ctx.font = `900 ${48 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#222'; ctx.fillText('三条要点', ox + 50 * u, oy + 90 * u);
      ['管一个系统的一生：设计、实现、运行到退役', '设计往下分解，实现往上集成，管理贯穿全程', '它首先是一种有逻辑的思考方式'].forEach((l, i) => {
        const b = eOutCubic(inv(12.6 + i * .2, 12.9 + i * .2, t)); ctx.globalAlpha = a * b;
        ctx.font = `700 ${(LAND ? 34 : 34) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#e8590c'; ctx.fillText(`0${i + 1}`, ox + 50 * u, oy + (170 + i * 80) * u);
        ctx.fillStyle = '#333'; ctx.font = `400 ${(LAND ? 32 : 30) * u}px 'Noto Sans SC'`;
        wrapCJK(ctx, l, ow - 190 * u).forEach((s2, j) => ctx.fillText(s2, ox + 120 * u, oy + (170 + i * 80) * u + j * 40 * u));
      });
      ctx.globalAlpha = a; ctx.font = `400 ${20 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#888';
      ctx.fillText('出处：NASA Systems Engineering Handbook Rev 2（NASA/SP-2016-6105）第 2 章；译文和要点为本仓库所写', ox + 50 * u, oy + (LAND ? H * .6 - 40 * u : H * .42 - 40 * u));
    }
    ctx.restore();
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(60,50,40,.65)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(credits(s.A), W - 24 * u, H - 18 * u); ctx.restore();
  },
});

// 在文字层里找一句话：词逐个比对（不分大小写、去掉标点），返回每一行的框 [{x0, y0, x1, y1}]（页面坐标 0–1）
function find(words, phrase) {
  const norm = w => String(w).toLowerCase().replace(/[^a-z0-9-]/g, '');
  const q = phrase.split(/\s+/).map(norm), ws = words.map(w => norm(w.word));
  for (let i = 0; i + q.length <= ws.length; i++) {
    if (!q.every((x, j) => ws[i + j] === x)) continue;
    const lines = [];
    for (const w of words.slice(i, i + q.length)) {
      const l = lines.find(l => Math.abs(l.y0 - w.y0) < .006);
      if (l) { l.x0 = Math.min(l.x0, w.x0); l.x1 = Math.max(l.x1, w.x1); l.y1 = Math.max(l.y1, w.y1); }
      else lines.push({ x0: w.x0, y0: w.y0, x1: w.x1, y1: w.y1 });
    }
    return lines;
  }
  throw new Error('文字层里找不到：' + phrase);
}
function bounds(lines) {
  const x0 = Math.min(...lines.map(l => l.x0)), y0 = Math.min(...lines.map(l => l.y0)), x1 = Math.max(...lines.map(l => l.x1)), y1 = Math.max(...lines.map(l => l.y1));
  return [x0, y0, x1 - x0, y1 - y0];
}
function lerpBox(a, b, e) { return a.map((v, i) => lerp(v, b[i], e)); }
function tagline(ctx, x, y, w, u, kick, title, sub) {
  ctx.fillStyle = '#e8590c'; ctx.font = `700 ${26 * u}px 'Noto Sans SC'`; ctx.fillText(kick, x, y + 10 * u);
  ctx.fillStyle = '#222'; ctx.font = `900 ${(LAND ? 52 : 60) * u}px 'Noto Sans SC'`;
  wrapCJK(ctx, title, w).forEach((l, i) => ctx.fillText(l, x, y + (80 + i * 66) * u));
  ctx.fillStyle = '#777'; ctx.font = `400 ${20 * u}px 'Noto Sans SC'`; ctx.fillText(sub, x, y + (LAND ? 210 : 160) * u);
}
function quote(ctx, x, y, w, u, en, zh, src) {
  ctx.fillStyle = '#fff'; rr(ctx, x - 24 * u, y - 40 * u, w + 48 * u, (LAND ? 560 : 420) * u, 18 * u); ctx.fill();
  ctx.fillStyle = '#e8590c'; ctx.fillRect(x - 24 * u, y - 40 * u, 8 * u, (LAND ? 560 : 420) * u);
  ctx.fillStyle = '#555'; ctx.font = `400 italic ${(LAND ? 24 : 26) * u}px 'Noto Serif SC'`;
  let yy = y;
  const wrapEn = (txt, mw) => { const out = []; let cur = ''; for (const wd of txt.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > mw && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; };
  wrapEn(en, w).forEach(l => { ctx.fillText(l, x, yy); yy += 36 * u; });
  yy += 24 * u; ctx.fillStyle = '#222'; ctx.font = `700 ${(LAND ? 34 : 38) * u}px 'Noto Serif SC'`;
  wrapCJK(ctx, zh, w).forEach(l => { ctx.fillText(l, x, yy + 10 * u); yy += (LAND ? 50 : 54) * u; });
  ctx.fillStyle = '#e8590c'; ctx.font = `700 ${20 * u}px 'Noto Sans SC'`; ctx.fillText(src, x, yy + 24 * u);
}
