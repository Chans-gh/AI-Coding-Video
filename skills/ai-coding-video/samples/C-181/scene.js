// C-181 年画：胖娃娃抱鲤鱼、两侧莲花荷叶、四角云纹，都是 Path2D 形状；init 里按从后到前的顺序把每个形状“刻”到五块版上：本色的版上填色，其余版上挖掉（被前面挡住的颜色和墨线都不印），每块版再乘一层木纹噪声；出片时黄、桃红、绿、紫、墨线五块版依次带着参差的边从左往右刷印上去，每块版有固定的套版错位，用正片叠底叠在纸上
// 风格提示词：用年画风格：木版套色印出的喜庆画面，粗黑墨线框出胖娃娃、鲤鱼、门神和莲花，桃红、翠绿、柠檬黄、品紫大块平涂，套版略有错位露出白纸，构图饱满对称、四角有吉祥纹样，开场像刷墨压纸一样一色一色印出来，配锣鼓。
// 题材：东方传统 · 适合：春节与节庆、民俗科普、新年品牌片
const COL = { yellow: '#f3cf2a', pink: '#e8457c', green: '#1d9a5a', purple: '#7d3a98', black: '#1c1612' };
const PLATES = ['yellow', 'pink', 'green', 'purple', 'black'];
const OFF = { yellow: [-5, 3], pink: [4, -3], green: [-3, -5], purple: [5, 4], black: [0, 0] };     // 套版错位（1000 制）
const T0 = { yellow: .25, pink: .7, green: 1.15, purple: 1.6, black: 2.1 };                         // 每块版开印时刻（sound.py 同步）
function E(cx, cy, rx, ry, r = 0) { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, r, 0, TAU); return p; }
function Pg(pts, close = true) {                       // 过各点中点的平滑曲线
  const p = new Path2D(), n = pts.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (!close) { p.moveTo(...pts[0]); for (let i = 1; i < n - 1; i++) p.quadraticCurveTo(...pts[i], ...m(pts[i], pts[i + 1])); p.lineTo(...pts[n - 1]); return p; }
  p.moveTo(...m(pts[n - 1], pts[0])); for (let i = 0; i < n; i++) p.quadraticCurveTo(...pts[i], ...m(pts[i], pts[(i + 1) % n])); p.closePath(); return p;
}
function shapes() {
  const S = [], add = (p, c, o = {}) => S.push({ p, c, key: true, ...o });
  // 边框色带和四角云纹
  const band = new Path2D(); band.rect(18, 18, 964, 964); band.rect(52, 52, 896, 896); add(band, 'green');
  for (const [x, y] of [[52, 52], [948, 52], [52, 948], [948, 948]]) {
    const sx = x < 500 ? 1 : -1, sy = y < 500 ? 1 : -1, cx = x + sx * 52, cy = y + sy * 52;
    const sp = []; for (let i = 0; i < 40; i++) { const a = i * .32, r = 6 + i * 1.05; sp.push([cx + sx * Math.cos(a) * r, cy + sy * Math.sin(a) * r]); }
    add(E(cx, cy, 48, 48), 'yellow', { det: [Pg(sp, false)] });
  }
  // 荷叶、莲花（左右对称）
  for (const s of [-1, 1]) {
    const lx = 500 + s * 290, leaf = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = 1 + .07 * Math.sin(a * 7); leaf.push([lx + 128 * r * Math.cos(a), 805 + 98 * r * Math.sin(a)]); }
    add(Pg(leaf), 'green', { det: Array.from({ length: 9 }, (_, k) => { const a = k / 9 * TAU; return Pg([[lx, 800], [lx + 120 * Math.cos(a), 800 + 85 * Math.sin(a)]], false); }) });
    add(Pg([[lx - s * 10, 700], [lx - s * 30, 520], [lx - s * 6, 380], [lx + s * 6, 380], [lx - s * 16, 520], [lx + s * 10, 700]]), 'green');
    const fx = 500 + s * 320, fy = 320;
    for (const a of [-1.1, -.55, 0, .55, 1.1]) add(E(fx + Math.sin(a) * 52, fy - Math.cos(a) * 52, 34, 66, a), 'pink', { det: [Pg([[fx + Math.sin(a) * 20, fy - Math.cos(a) * 20], [fx + Math.sin(a) * 90, fy - Math.cos(a) * 90]], false)] });
    add(E(fx, fy + 10, 40, 24), 'yellow');
  }
  // 娃娃：腿、鞋、身子、肚兜
  add(Pg([[418, 630], [500, 615], [582, 630], [600, 790], [512, 795], [500, 700], [488, 795], [400, 790]]), 'purple', { det: [Pg([[500, 700], [500, 640]], false)] });
  add(E(450, 805, 52, 24), 'yellow'); add(E(550, 805, 52, 24), 'yellow');
  add(E(500, 545, 102, 112), 'paper');
  add(Pg([[500, 440], [600, 535], [500, 670], [400, 535]]), 'pink');
  add(E(500, 548, 30, 30), 'yellow', { det: [Pg([[500, 548], [512, 540], [506, 528], [490, 534], [488, 552], [506, 562], [522, 548]], false)] });
  // 鲤鱼：尾、身、鳍、鳞
  add(Pg([[352, 535], [236, 462], [264, 556], [228, 655], [352, 590]]), 'yellow', { det: [Pg([[340, 555], [258, 500]], false), Pg([[340, 568], [252, 612]], false)] });
  add(Pg([[540, 472], [600, 405], [652, 482]]), 'yellow');
  add(Pg([[560, 612], [600, 668], [628, 600]]), 'yellow');
  const scales = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const x = 400 + i * 50 + j * 12, y = 520 + j * 30; const p = new Path2D(); p.arc(x, y, 22, -1.2, 1.2); scales.push(p); }
  add(Pg([[322, 562], [420, 500], [560, 470], [690, 480], [770, 520], [750, 565], [650, 602], [520, 622], [400, 612]]), 'pink', { det: scales });
  add(E(722, 508, 14, 14), 'paper', { det: [E(724, 508, 5, 5)] });
  add(Pg([[748, 548], [800, 560], [828, 610]], false), 'none');
  // 手臂抱住鱼
  add(Pg([[410, 460], [372, 530], [400, 600], [455, 615], [470, 585], [432, 565], [430, 500]]), 'paper');
  add(Pg([[590, 460], [628, 530], [610, 595], [560, 612], [548, 582], [585, 560], [572, 500]]), 'paper');
  // 头、脸蛋、头发、发髻和红头绳
  add(E(500, 335, 115, 108), 'paper');
  add(E(440, 378, 26, 18), 'pink', { key: false }); add(E(560, 378, 26, 18), 'pink', { key: false });
  add(Pg([[390, 330], [400, 255], [450, 220], [500, 212], [550, 220], [600, 255], [610, 330], [585, 282], [540, 268], [500, 280], [460, 268], [415, 282]]), 'black');
  add(E(418, 214, 42, 40), 'black'); add(E(582, 214, 42, 40), 'black');
  for (const s of [-1, 1]) add(Pg([[500 + s * 82, 248], [500 + s * 70, 270], [500 + s * 105, 285], [500 + s * 96, 258]]), 'pink');
  add(E(500, 268, 14, 12), 'pink');
  // 眉眼口鼻（只有墨线和一点红）
  const face = new Path2D();
  face.moveTo(440, 340); face.quadraticCurveTo(458, 322, 476, 340); face.moveTo(524, 340); face.quadraticCurveTo(542, 322, 560, 340);
  face.moveTo(440, 312); face.quadraticCurveTo(458, 302, 474, 310); face.moveTo(526, 310); face.quadraticCurveTo(542, 302, 560, 312);
  face.moveTo(494, 362); face.quadraticCurveTo(500, 368, 506, 362);
  add(new Path2D(), 'none', { det: [face] });
  add(E(500, 395, 18, 10), 'pink');
  return S;
}
scene({
  id: 'C-181', name: '年画', dur: 4.2, still: 3.6,
  fonts: ["900 40px 'Noto Serif SC'", "400 20px 'JetBrains Mono'"],
  text: '年年有余木版套色五',
  init() {
    const A = Math.round(LAND ? H * .84 : W * .9), k = A / 1000, R = mulberry32(81);
    const pl = {}, g = {};
    for (const n of PLATES) { pl[n] = mk(A, A); g[n] = pl[n].getContext('2d'); g[n].scale(k, k); g[n].lineJoin = 'round'; g[n].lineCap = 'round'; }
    for (const s of shapes()) {
      for (const n of PLATES) {
        const c = g[n];
        if (s.c === 'none') continue;
        c.globalCompositeOperation = s.c === n ? 'source-over' : 'destination-out';
        c.fillStyle = COL[n]; c.fill(s.p, 'evenodd');
      }
      const kg = g.black; kg.globalCompositeOperation = 'source-over'; kg.strokeStyle = COL.black;
      if (s.key) { kg.lineWidth = 7; kg.stroke(s.p); }
      kg.lineWidth = 5; for (const d of s.det || []) kg.stroke(d);
    }
    // 木纹：横向拉长的噪声当透明度，墨色深浅不匀
    const grain = mk(A, A), gg = grain.getContext('2d'), id = gg.createImageData(A, A);
    for (let y = 0; y < A; y++) for (let x = 0; x < A; x++) {
      const n = fbm(x / 160, y / 9, 3), i = (y * A + x) * 4;
      id.data[i + 3] = 255 * clamp(.62 + .5 * n + (R() - .5) * .25);
    }
    gg.putImageData(id, 0, 0);
    for (const n of PLATES) if (n !== 'black') { g[n].setTransform(1, 0, 0, 1, 0, 0); g[n].globalCompositeOperation = 'destination-in'; g[n].drawImage(grain, 0, 0); }
    const paper = makePaper('#f3e8d0', { seed: 4, fiber: .6 });
    return { pl, A, paper };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, A = s.A, k = A / 1000;
    ctx.drawImage(s.paper, 0, 0, W, H);
    const z = 1 + .03 * smooth(2.4, 4.2, t), ox = (W - A * z) / 2, oy = LAND ? (H - A * z) / 2 : H * .5 - A * z / 2 + 40 * u;
    ctx.save(); ctx.translate(ox, oy); ctx.scale(z, z);
    ctx.globalCompositeOperation = 'multiply';
    for (const n of PLATES) {
      const p = inv(T0[n], T0[n] + (n === 'black' ? .45 : .38), t);
      if (p <= 0) continue;
      ctx.save();
      if (p < 1) {                                       // 刷印：参差的边从左往右扫过
        ctx.beginPath(); ctx.moveTo(-40, -40);
        for (let y = -40; y <= A + 40; y += 20) ctx.lineTo(lerp(-80, A + 80, eOutCubic(p)) + (noise1(y / 37 + T0[n] * 9) - .5) * 70 * k, y);
        ctx.lineTo(-40, A + 40); ctx.clip();
      }
      ctx.globalAlpha = n === 'black' ? 1 : .94;
      ctx.drawImage(s.pl[n], OFF[n][0] * k, OFF[n][1] * k);
      ctx.restore();
    }
    ctx.restore();
    // 题字
    const a = smooth(2.6, 3.0, t);
    if (a > 0) {
      ctx.fillStyle = `rgba(28,22,18,${a})`; ctx.font = `900 ${Math.round(86 * u)}px 'Noto Serif SC'`; ctx.textAlign = 'center';
      if (LAND) {
        [...'年年'].forEach((c, i) => ctx.fillText(c, ox / 2, H * .42 + i * 104 * u));
        [...'有余'].forEach((c, i) => ctx.fillText(c, W - ox / 2, H * .42 + i * 104 * u));
      } else ctx.fillText('年年有余', W / 2, oy - 70 * u);
      ctx.font = `400 ${Math.round(18 * u)}px 'JetBrains Mono'`; ctx.fillStyle = `rgba(28,22,18,${.6 * a})`;
      ctx.fillText('WOODBLOCK · 5 PLATES', LAND ? W / 2 : W / 2, LAND ? H - 18 * u : oy + A * z + 60 * u);
    }
  }
});
