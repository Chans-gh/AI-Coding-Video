// C-187 吉卜力式手绘动画：天空、积云、远山和山坡小屋预先画进三张离屏画布，积云是几十团由亮到灰的渐变圆团叠出体积、再沿亮边点水粉笔触，三层按不同速度横移出视差；前景几千根草叶每帧重画，一阵风从左往右按 x 的先后经过，草浪、大树、晾的衣服、女孩的裙摆和辫子依次摆动；女孩用细描线加两阶平涂（阴影＝本体减去朝光源平移的本体），帽子被吹起后她抬手按住。
// 风格提示词：用吉卜力式手绘动画风格：背景像水彩加不透明水粉画成，云、树叶和房屋都有手作的笔触与真实的生活细节，角色用干净的细描线加两三阶赛璐璐平涂，和背景在光向、透视和接触阴影上严丝合缝；风吹过时草浪、衣角和发梢按先后次序摆动，人物做饭、骑车、开窗这类生活动作有重心和前后因果，镜头多为平视的长停留和缓慢横移。只学画法，不出现任何现有角色、场景或标志。
// 题材：卡通与动漫 · 适合：成长故事、乡村与城市生活、温暖的品牌短片
const P187 = W * .1;                                   // 整段横移的距离
const T0 = 1.3, SPD = W * .62;                         // 阵风从画面左缘出发的时刻、横穿速度
function gust(xs, t) { const k = t - T0 - xs / SPD; return k < 0 ? 0 : 1.5 * (1 - Math.exp(-k / .12)) * Math.exp(-k / .85); }
function wind(xs, t) { return .12 + .1 * Math.sin(t * 1.7 + xs * .004) + gust(xs, t); }
function cam187(t) { return P187 * (.15 * eInOutCubic(t / 5) + .85 * t / 5); }

function canopy(g, x, y, r, R, pal = ['#2e5a2b', '#4b8137', '#7fb14c', '#b9d77c']) {
  const blobs = [];
  for (let i = 0; i < 14; i++) { const a = R() * TAU, d = Math.sqrt(R()); blobs.push([x + Math.cos(a) * r * .75 * d, y + Math.sin(a) * r * .55 * d, r * (.28 + .22 * R())]); }
  blobs.sort((a, b) => a[1] - b[1]);
  const dab = (bx, by, rx, ry, rot) => { g.beginPath(); g.ellipse(bx, by, rx, ry, rot, 0, TAU); g.fill(); };
  g.fillStyle = pal[0]; for (const [bx, by, br] of blobs) { g.beginPath(); g.arc(bx + br * .12, by + br * .15, br, 0, TAU); g.fill(); }
  g.fillStyle = pal[1]; for (const [bx, by, br] of blobs) for (let k = 0; k < 7; k++) { const a = -2.4 + R() * 2.2, d = br * .55 * R(); dab(bx + Math.cos(a) * d - br * .1, by + Math.sin(a) * d - br * .1, br * .42, br * .3, R() * 3); }
  g.fillStyle = pal[2]; for (const [bx, by, br] of blobs) for (let k = 0; k < 6; k++) { const a = -2.5 + R() * 1.6, d = br * (.45 + .35 * R()); dab(bx + Math.cos(a) * d, by + Math.sin(a) * d, br * .18, br * .1, a + 1.6); }
  g.fillStyle = pal[3]; for (const [bx, by, br] of blobs) for (let k = 0; k < 3; k++) { const a = -2.3 + R() * 1.0, d = br * (.6 + .3 * R()); dab(bx + Math.cos(a) * d, by + Math.sin(a) * d, br * .08, br * .045, a + 1.6); }
}

function cloud(g, cx, cy, sw, sh, R, u) {
  const c = mk(Math.ceil(sw * 1.3), Math.ceil(sh * 1.5)), q = c.getContext('2d'), ox = sw * .65, oy = sh * 1.2;
  const puffs = [];
  for (let i = 0; i < 46; i++) {
    const a = R(), dome = Math.sqrt(1 - (2 * a - 1) ** 2);
    puffs.push([ox + (a - .5) * sw, oy - dome * sh * (.15 + .75 * R()), (.14 + .22 * dome) * sh * (.6 + .5 * R())]);
  }
  q.save();
  q.fillStyle = '#9eb0c8'; for (const [x, y, r] of puffs) { q.beginPath(); q.arc(x + r * .1, y + r * .12, r, 0, TAU); q.fill(); }
  for (const [x, y, r] of puffs) {
    const gr = q.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
    gr.addColorStop(0, '#fffdf6'); gr.addColorStop(.55, '#eef1f2'); gr.addColorStop(1, 'rgba(200,210,226,0)');
    q.fillStyle = gr; q.beginPath(); q.arc(x, y, r, 0, TAU); q.fill();
  }
  q.globalCompositeOperation = 'source-atop';
  const sg = q.createLinearGradient(0, oy - sh, 0, oy + sh * .1);
  sg.addColorStop(0, 'rgba(120,140,175,0)'); sg.addColorStop(.6, 'rgba(120,140,175,.18)'); sg.addColorStop(1, 'rgba(105,122,160,.55)');
  q.fillStyle = sg; q.fillRect(0, 0, c.width, c.height);
  q.fillStyle = 'rgba(255,255,255,.75)';
  for (const [x, y, r] of puffs) for (let k = 0; k < 5; k++) { const a = -2.5 + R() * 1.7; q.beginPath(); q.ellipse(x + Math.cos(a) * r * .82, y + Math.sin(a) * r * .82, 7 * u, 3 * u, a + 1.6, 0, TAU); q.fill(); }
  q.globalCompositeOperation = 'destination-out';
  const bg = q.createLinearGradient(0, oy - sh * .06, 0, oy + sh * .12); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,1)');
  q.fillStyle = bg; q.fillRect(0, oy - sh * .06, c.width, c.height);
  q.restore();
  g.drawImage(c, cx - ox, cy - oy);
}

scene({
  id: 'C-187', name: '吉卜力式手绘动画', dur: 5, still: 3.2,
  fonts: [],
  init() {
    const u = SHORT / 1080, R = mulberry32(187);
    const top = LAND ? H * .66 : H * .6;                       // 前景草地的上沿
    // ---- 远景：天空、积云、远山 ----
    const far = mk(Math.ceil(W + P187 * .3) + 4, H); let g = far.getContext('2d');
    let gr = g.createLinearGradient(0, 0, 0, top);
    gr.addColorStop(0, '#3d7cc2'); gr.addColorStop(.55, '#7db2de'); gr.addColorStop(1, '#dcecef');
    g.fillStyle = gr; g.fillRect(0, 0, far.width, H);
    for (let i = 0; i < 60; i++) {
      const x = R() * far.width, y = R() * top * .9, r = (80 + R() * 220) * u, rg = g.createRadialGradient(x, y, 0, x, y, r), c = R() < .5 ? '40,90,170' : '235,242,246';
      rg.addColorStop(0, `rgba(${c},.10)`); rg.addColorStop(1, `rgba(${c},0)`); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    if (LAND) { cloud(g, W * .56, H * .36, W * .5, H * .3, R, u); cloud(g, W * .14, H * .22, W * .2, H * .1, R, u); cloud(g, W * .93, H * .17, W * .22, H * .1, R, u); }
    else { cloud(g, W * .55, H * .31, W * .95, H * .2, R, u); cloud(g, W * .22, H * .11, W * .38, H * .06, R, u); cloud(g, W * .9, H * .08, W * .3, H * .05, R, u); }
    const ridge = (yb, amp, col, sc) => {
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= far.width; x += 6) g.lineTo(x, yb - amp * (.5 + .5 * Math.sin(x / W * 4 + sc)) - amp * .6 * fbm(x * .004 + sc, sc, 4));
      g.lineTo(far.width, H); g.closePath(); g.fillStyle = col; g.fill();
    };
    ridge(top - (LAND ? H * .1 : H * .08), LAND ? H * .07 : H * .05, '#8fa9c2', 1);
    ridge(top - (LAND ? H * .06 : H * .05), LAND ? H * .05 : H * .035, '#7397a0', 4);
    gr = g.createLinearGradient(0, top - H * .2, 0, top); gr.addColorStop(0, 'rgba(225,236,240,0)'); gr.addColorStop(1, 'rgba(225,236,240,.55)');
    g.fillStyle = gr; g.fillRect(0, top - H * .2, far.width, H * .2);
    // ---- 中景：山坡、树丛、小屋 ----
    const mid = mk(Math.ceil(W + P187 * .65) + 4, H); g = mid.getContext('2d');
    const hh = LAND ? H * .12 : H * .085;
    const crest = x => top - hh * (.55 + .45 * Math.sin(x / W * 2.2 + .6)) - hh * .2 * noise1(x * .004);
    g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= mid.width; x += 4) g.lineTo(x, crest(x)); g.lineTo(mid.width, H); g.closePath();
    gr = g.createLinearGradient(0, top - hh, 0, top + H * .05); gr.addColorStop(0, '#7fae57'); gr.addColorStop(1, '#4e8644');
    g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    for (let i = 0; i < 9; i++) {                                 // 田垄
      g.strokeStyle = i % 2 ? 'rgba(220,214,120,.35)' : 'rgba(60,110,50,.25)'; g.lineWidth = (5 + R() * 9) * u;
      g.beginPath(); const y0 = top - hh * .5 + i * hh * .14, x0 = R() * mid.width;
      g.moveTo(x0 - W * .4, y0 + hh * .2); g.quadraticCurveTo(x0, y0 - hh * .1, x0 + W * .4, y0 + hh * .25); g.stroke();
    }
    for (let i = 0; i < 400; i++) { g.fillStyle = R() < .5 ? 'rgba(160,200,100,.35)' : 'rgba(50,95,45,.3)'; const x = R() * mid.width, y = crest(x) + R() * hh * 1.2; g.beginPath(); g.ellipse(x, y, (6 + R() * 10) * u, 2 * u, R() * .3 - .15, 0, TAU); g.fill(); }
    g.restore();
    const hx = LAND ? W * .34 : W * .3, hw = (LAND ? 120 : 105) * u, hy = crest(hx) + 6 * u;
    for (const [x, sc] of [[hx - hw * 1.6, .9], [hx + hw * 2.3, .7], [hx + hw * 3.1, .55], [W * .82, .8], [W * .97, .6], [W * .06, .7]]) {
      const by = crest(x); g.fillStyle = '#5b4632'; g.fillRect(x - 3 * u, by - 34 * u * sc, 6 * u, 34 * u * sc);
      canopy(g, x, by - 52 * u * sc, 46 * u * sc, R);
    }
    // 小屋：亮面朝左上，阴影面朝右
    g.fillStyle = '#efe6d0'; g.fillRect(hx - hw / 2, hy - hw * .55, hw * .7, hw * .55);
    g.fillStyle = '#c7bca8'; g.fillRect(hx + hw * .2, hy - hw * .55, hw * .3, hw * .55);
    g.fillStyle = '#7f5b3a'; g.fillRect(hx + hw * .32, hy - hw * .78, hw * .08, hw * .22);   // 烟囱
    g.beginPath(); g.moveTo(hx - hw * .6, hy - hw * .52); g.lineTo(hx - hw * .25, hy - hw * .9); g.lineTo(hx + hw * .25, hy - hw * .9); g.lineTo(hx + hw * .6, hy - hw * .52); g.closePath();
    g.fillStyle = '#c4553c'; g.fill();
    g.beginPath(); g.moveTo(hx + hw * .1, hy - hw * .9); g.lineTo(hx + hw * .25, hy - hw * .9); g.lineTo(hx + hw * .6, hy - hw * .52); g.lineTo(hx + hw * .3, hy - hw * .52); g.closePath();
    g.fillStyle = '#93402f'; g.fill();
    g.strokeStyle = 'rgba(255,220,190,.5)'; g.lineWidth = 1.5 * u;
    for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(hx - hw * (.6 - k * .07), hy - hw * (.52 + k * .076)); g.lineTo(hx + hw * (.1), hy - hw * (.52 + k * .076)); g.stroke(); }
    for (const wx of [-.36, -.08]) { g.fillStyle = '#f7f2e6'; g.fillRect(hx + wx * hw, hy - hw * .42, hw * .17, hw * .17); g.fillStyle = '#4b7193'; g.fillRect(hx + wx * hw + 2 * u, hy - hw * .42 + 2 * u, hw * .17 - 4 * u, hw * .17 - 4 * u); g.fillStyle = '#e9e2cf'; g.fillRect(hx + wx * hw + hw * .085 - u, hy - hw * .42, 2 * u, hw * .17); }
    g.fillStyle = '#6d4a30'; g.fillRect(hx + hw * .26, hy - hw * .32, hw * .14, hw * .32);
    g.fillStyle = 'rgba(40,70,35,.35)'; g.beginPath(); g.ellipse(hx + hw * .2, hy + 2 * u, hw * .75, 6 * u, 0, 0, TAU); g.fill();
    const lx0 = hx + hw * .75, lx1 = hx + hw * 1.85, ly = crest(lx1) - 42 * u;
    g.strokeStyle = '#5b4632'; g.lineWidth = 3 * u;
    for (const x of [lx0, lx1]) { g.beginPath(); g.moveTo(x, crest(x) + 4 * u); g.lineTo(x, ly - 4 * u); g.stroke(); }
    // ---- 前景地面（静态） ----
    const fg = mk(Math.ceil(W + P187) + 4, H); g = fg.getContext('2d');
    const fieldEdge = x => top + 10 * u * Math.sin(x / W * 5) + 8 * u * noise1(x * .01);
    g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= fg.width; x += 4) g.lineTo(x, fieldEdge(x)); g.lineTo(fg.width, H); g.closePath();
    gr = g.createLinearGradient(0, top, 0, H); gr.addColorStop(0, '#79a948'); gr.addColorStop(1, '#3f7330'); g.fillStyle = gr; g.fill();
    const pathX = y => { const d = inv(top, H, y); return lerp(W * (LAND ? .44 : .48), W * (LAND ? .28 : .22), d * d) + 18 * u * Math.sin(d * 6); };
    const pathW = y => lerp(10 * u, (LAND ? 190 : 160) * u, inv(top, H, y) ** 1.3);
    g.save(); g.clip();
    for (let i = 0; i < 1600; i++) { const x = R() * fg.width, y = top + (H - top) * R(), d = inv(top, H, y); g.fillStyle = ['rgba(150,190,80,.35)', 'rgba(55,105,40,.35)', 'rgba(110,160,60,.35)'][i % 3]; g.beginPath(); g.ellipse(x, y, (8 + 30 * d) * u, (2 + 4 * d) * u, R() * .2 - .1, 0, TAU); g.fill(); }
    g.beginPath(); for (let y = top; y <= H + 10; y += 4) g.lineTo(pathX(y) - pathW(y) / 2, y); for (let y = H + 10; y >= top; y -= 4) g.lineTo(pathX(y) + pathW(y) / 2, y); g.closePath();
    gr = g.createLinearGradient(0, top, 0, H); gr.addColorStop(0, '#d9c493'); gr.addColorStop(1, '#b89a68'); g.fillStyle = gr; g.fill();
    for (let i = 0; i < 260; i++) { const y = top + (H - top) * R(), d = inv(top, H, y); g.fillStyle = R() < .5 ? 'rgba(255,240,205,.5)' : 'rgba(130,100,65,.35)'; g.beginPath(); g.ellipse(pathX(y) + (R() - .5) * pathW(y) * .8, y, (3 + 9 * d) * u, (1 + 2 * d) * u, 0, 0, TAU); g.fill(); }
    for (let i = 0; i < 220; i++) { const x = R() * fg.width, y = top + (H - top) * R() ** 1.3, d = inv(top, H, y); if (Math.abs(x - pathX(y)) < pathW(y) * .6) continue; g.fillStyle = ['#fffaf0', '#f5d64e', '#f0f0ff'][i % 3]; g.beginPath(); g.arc(x, y, (1.5 + 3.5 * d) * u, 0, TAU); g.fill(); }
    g.restore();
    // ---- 前景大树（精灵图，绕树根摆动） ----
    const tH = LAND ? H * .74 : H * .44, cr = tH * .3, tree = mk(Math.ceil(cr * 3.2), Math.ceil(tH + cr * .2)); g = tree.getContext('2d');
    const tcx = tree.width / 2, tb = tree.height;
    g.fillStyle = '#5a4130'; g.beginPath(); g.moveTo(tcx - cr * .14, tb); g.quadraticCurveTo(tcx - cr * .05, tb - tH * .4, tcx - cr * .05, tb - tH * .65); g.lineTo(tcx + cr * .07, tb - tH * .65); g.quadraticCurveTo(tcx + cr * .05, tb - tH * .4, tcx + cr * .16, tb); g.closePath(); g.fill();
    g.fillStyle = '#3d2c22'; g.beginPath(); g.moveTo(tcx + cr * .02, tb); g.quadraticCurveTo(tcx + cr * .06, tb - tH * .4, tcx + cr * .04, tb - tH * .65); g.lineTo(tcx + cr * .07, tb - tH * .65); g.quadraticCurveTo(tcx + cr * .05, tb - tH * .4, tcx + cr * .16, tb); g.closePath(); g.fill();
    g.strokeStyle = '#4a3528'; g.lineCap = 'round';
    for (const [a, l] of [[-.9, .55], [-2.3, .5], [-1.6, .4]]) { g.lineWidth = cr * .06; g.beginPath(); g.moveTo(tcx, tb - tH * .55); g.lineTo(tcx + Math.cos(a) * cr * l * 1.6, tb - tH * .55 + Math.sin(a) * cr * l * 1.2); g.stroke(); }
    for (const [dx, dy, r] of [[-.9, -.62, .62], [.9, -.6, .6], [0, -.95, .72], [-.45, -.4, .5], [.5, -.4, .5]]) canopy(g, tcx + dx * cr, tb - tH * .62 + dy * cr, r * cr, R);
    // ---- 草叶 ----
    const N = LAND ? 4400 : 4000, blades = [];
    for (let i = 0; i < N; i++) {
      const y = top + (H - top + 30 * u) * R() ** 1.35, d = inv(top, H, y), x = -30 + R() * (W + P187 + 60);
      if (Math.abs(x - pathX(y)) < pathW(y) * .42 && R() < .92) continue;
      blades.push({ x, y, d, len: (12 + 70 * d ** 1.2) * u * (.6 + .7 * R()), tone: Math.floor(R() * 3), ph: R() * TAU, band: d < .3 ? 0 : d < .65 ? 1 : 2 });
    }
    blades.sort((a, b) => a.y - b.y);
    const gx = LAND ? W * .67 : W * .6, gy = LAND ? H * .86 : H * .79, gk = u * (LAND ? 1 : 1.25);
    const paper = makePaper('#f6efe0', { w: W / 2, h: H / 2, grain: 14, fiber: .45, blot: 9, seed: 7 });
    const leaves = Array.from({ length: 16 }, (_, i) => ({ t0: T0 + .2 + i * .07 + R() * .1, y0: (R() - .5) * cr * 1.4, x0: (R() - .3) * cr, sp: .65 + .3 * R(), ph: R() * TAU, c: R() < .5 ? '#5f9a3f' : '#8cbd52' }));
    return { u, top, far, mid, fg, tree, tH, cr, blades, gx, gy, gk, paper, leaves, chim: [hx + hw * .36, hy - hw * .8], line: [lx0, lx1, ly], tx: LAND ? W * .1 : W * .12, tby: LAND ? top + (H - top) * .22 : top + (H - top) * .15 };
  },
  draw(ctx, t, s, f) {
    const { u } = s, cam = cam187(t);
    ctx.drawImage(s.far, -cam * .3, 0);
    // 炊烟（中景层坐标）
    const mo = -cam * .65;
    for (let j = 0; j < 9; j++) {
      const a = (t * .35 + j / 9) % 1, sx = s.chim[0] + mo, wv = wind(sx, t - a * .8);
      const x = sx + a * 30 * u + wv * a * 70 * u, y = s.chim[1] - a * 110 * u;
      const r = (6 + a * 26) * u, rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, `rgba(245,245,240,${.4 * (1 - a) * smooth(0, .1, a)})`); rg.addColorStop(1, 'rgba(245,245,240,0)'); ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    ctx.drawImage(s.mid, mo, 0);
    // 晾衣绳和衣服
    const [l0, l1, ly] = s.line, sag = 8 * u;
    ctx.strokeStyle = '#6b5a48'; ctx.lineWidth = 1.2 * u; ctx.beginPath(); ctx.moveTo(l0 + mo, ly); ctx.quadraticCurveTo((l0 + l1) / 2 + mo, ly + sag * 2, l1 + mo, ly); ctx.stroke();
    [['#f6f3ea', '#cfcabd', .18, 30, 34], ['#5b86b8', '#41658f', .48, 22, 26], ['#d9634d', '#a8483a', .74, 20, 18]].forEach(([c0, c1, p, cw, ch], i) => {
      const x = l0 + (l1 - l0) * p + mo, y = ly + sag * 4 * p * (1 - p), w = wind(x, t) * (1 + .15 * Math.sin(t * 11 + i)), cwu = cw * u, chu = ch * u;
      const bx = clamp(w * .9, 0, 1.4) * chu * .8, by = chu * (1 - .45 * clamp(w * .7, 0, 1)), fl = Math.sin(t * 14 + i * 2) * clamp(w - .3, 0, 1) * 4 * u;
      ctx.beginPath(); ctx.moveTo(x - cwu / 2, y); ctx.lineTo(x + cwu / 2, y); ctx.lineTo(x + cwu / 2 + bx, y + by + fl); ctx.lineTo(x - cwu / 2 + bx * .85, y + by - fl); ctx.closePath();
      ctx.fillStyle = c0; ctx.fill(); ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(x + cwu * .2, y); ctx.lineTo(x + cwu / 2, y); ctx.lineTo(x + cwu / 2 + bx, y + by + fl); ctx.lineTo(x + cwu * .2 + bx * .9, y + by); ctx.closePath(); ctx.fill();
    });
    ctx.drawImage(s.fg, -cam, 0);
    // 大树：随风绕树根转一点
    const txs = s.tx - cam, wt = wind(txs + s.cr, t);
    ctx.save(); ctx.translate(txs, s.tby); ctx.rotate(.012 * Math.sin(t * 1.3) + wt * .035); ctx.drawImage(s.tree, -s.tree.width / 2, -s.tree.height); ctx.restore();
    // 草叶：按深度分三档线宽，按弯曲程度分五档颜色，每档一笔画完
    const COL = ['#3b7433', '#5a963d', '#82b54c', '#b5d483', '#d6e8a9'];
    const gxs = s.gx - cam;
    const drawBlades = (from, to) => {
      const buck = Array.from({ length: 15 }, () => []);
      for (let i = from; i < to; i++) {
        const b = s.blades[i], xs = b.x - cam; if (xs < -60 || xs > W + 60) continue;
        const g = gust(xs, t), bend = clamp((.12 + .1 * Math.sin(t * 1.7 + xs * .004) + g) * .85 + .08 * Math.sin(t * 3.1 + b.ph), -.3, 1.25);
        const lv = Math.min(4, b.tone + Math.floor(clamp(g - .25) * 2.6)); buck[b.band * 5 + lv].push(xs, b.y, b.len, bend);
      }
      ctx.lineCap = 'round';
      for (let k = 0; k < 15; k++) {
        const a = buck[k]; if (!a.length) continue;
        ctx.strokeStyle = COL[k % 5]; ctx.lineWidth = [1.3, 2.4, 3.6][Math.floor(k / 5)] * u; ctx.beginPath();
        for (let j = 0; j < a.length; j += 4) { const x = a[j], y = a[j + 1], l = a[j + 2], bd = a[j + 3]; ctx.moveTo(x, y); ctx.quadraticCurveTo(x + bd * l * .25, y - l * .7, x + bd * l * .75, y - l * (1 - .35 * Math.abs(bd))); }
        ctx.stroke();
      }
    };
    let split = s.blades.findIndex(b => b.y > s.gy); if (split < 0) split = s.blades.length;
    drawBlades(0, split);
    drawGirl(ctx, t, s, gxs);
    drawBlades(split, s.blades.length);
    // 被风卷起的树叶
    for (const L of s.leaves) {
      const dt = t - L.t0; if (dt < 0) continue;
      const x = txs + L.x0 + SPD * L.sp * dt, y = s.tby - s.tH * .62 + L.y0 + dt * 70 * u + Math.sin(dt * 7 + L.ph) * 22 * u;
      if (x > W + 30) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(dt * 9 + L.ph); ctx.fillStyle = L.c; ctx.beginPath(); ctx.ellipse(0, 0, 9 * u, 4 * u, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(30,60,25,.4)'; ctx.beginPath(); ctx.ellipse(0, 1.5 * u, 9 * u, 2 * u, 0, 0, Math.PI); ctx.fill(); ctx.restore();
    }
    // 纸面纹理、轻微颗粒和暗角
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .4; ctx.drawImage(s.paper, 0, 0, W, H); ctx.restore();
    grain(ctx, f, .05); vignette(ctx, .22, .45);
  }
});

// 女孩：脚底为原点、朝左站；所有部件先平涂亮面，再用「本体减去朝光源平移的本体」得到右下侧的阴影
function drawGirl(ctx, t, s, xs) {
  const k = s.gk, w0 = wind(xs, t), g0 = gust(xs, t);
  const TA = T0 + (s.gx - cam187(2.5)) / SPD;                  // 阵风到她身上的时刻
  const arm = eOutBack(inv(TA + .2, TA + .62, t), 1.2);        // 抬手按帽子
  const lift = clamp(g0 * 1.1) * (1 - clamp(arm));             // 手到之前帽子被掀起
  const LINE = '#3a2a24', SH = 7;
  const cel = (p, base, shade) => { ctx.save(); ctx.clip(p); ctx.fillStyle = shade; ctx.fill(p); ctx.translate(-SH, -SH * .8); ctx.fillStyle = base; ctx.fill(p); ctx.restore(); ctx.stroke(p); };
  ctx.save(); ctx.translate(xs, s.gy); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(30,62,25,.38)'; ctx.beginPath(); ctx.ellipse(16, 2, 74, 11, 0, 0, TAU); ctx.fill();
  ctx.rotate(-.03 * clamp(g0));                                 // 迎风微微前倾
  ctx.lineWidth = 2.2; ctx.strokeStyle = LINE; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const path = pts => { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; };
  // 后腿、前腿、鞋
  cel(path([[4, -150], [17, -150], [16, -10], [5, -10]]), '#e3b893', '#c99a78');
  cel(path([[-15, -150], [-2, -150], [-3, -10], [-14, -10]]), '#f2cba6', '#d6a986');
  for (const dx of [10, -9]) { const p = new Path2D(); p.ellipse(dx - 5, -6, 14, 7, 0, 0, TAU); cel(p, '#7b4a32', '#5a3424'); }
  // 后面那只手臂
  ctx.lineWidth = 15; ctx.strokeStyle = LINE; ctx.beginPath(); ctx.moveTo(14, -296); ctx.lineTo(20 + w0 * 3, -240); ctx.lineTo(22 + w0 * 6, -196); ctx.stroke();
  ctx.lineWidth = 11; ctx.strokeStyle = '#d6a986'; ctx.stroke(); ctx.lineWidth = 2.2; ctx.strokeStyle = LINE;
  // 裙子：腰固定，下摆按风向后飘，越靠后越飘
  const hem = []; for (let i = 0; i <= 10; i++) { const q = i / 10, x = lerp(-50, 56, q); hem.push([x + g0 * (10 + 30 * q) + Math.sin(t * 9 - i * .8) * clamp(g0) * 6, -140 - g0 * 14 * q + Math.sin(t * 7 + i) * 2]); }
  const sk = new Path2D(); sk.moveTo(-26, -232); sk.quadraticCurveTo(-40 + g0 * 8, -190, hem[0][0], hem[0][1]);
  for (const [x, y] of hem) sk.lineTo(x, y); sk.quadraticCurveTo(46 + g0 * 22, -190, 26, -232); sk.closePath();
  cel(sk, '#3f8f8a', '#2c6c6a');
  ctx.save(); ctx.strokeStyle = 'rgba(30,70,70,.6)'; ctx.lineWidth = 1.5; for (const q of [.3, .55, .8]) { const i = Math.round(q * 10); ctx.beginPath(); ctx.moveTo(lerp(-20, 22, q), -226); ctx.lineTo(hem[i][0], hem[i][1] + 2); ctx.stroke(); } ctx.restore();
  // 上衣
  const top = new Path2D(); top.moveTo(-20, -306); top.quadraticCurveTo(0, -312, 22, -304); top.quadraticCurveTo(30, -270, 27, -228); top.lineTo(-27, -228); top.quadraticCurveTo(-30, -270, -20, -306); top.closePath();
  cel(top, '#f6f1e6', '#c9ced6');
  ctx.fillStyle = '#d24b3c'; ctx.fillRect(-27, -236, 54, 7); ctx.strokeRect(-27, -236, 54, 7);
  // 脖子、头
  cel(path([[-6, -322], [7, -322], [7, -303], [-6, -303]]), '#f2cba6', '#d6a986');
  const head = new Path2D(); head.moveTo(-28, -366); head.bezierCurveTo(-36, -362, -34, -352, -38, -344); head.lineTo(-33, -340); head.bezierCurveTo(-34, -330, -28, -320, -10, -318); head.bezierCurveTo(14, -318, 30, -332, 29, -352); head.bezierCurveTo(28, -372, 10, -384, -6, -382); head.bezierCurveTo(-16, -381, -24, -374, -28, -366); head.closePath();
  cel(head, '#f6d2ae', '#dcae8a');
  // 头发（后脑和刘海）
  const hair = new Path2D(); hair.moveTo(-30, -360); hair.bezierCurveTo(-26, -384, 4, -392, 22, -376); hair.bezierCurveTo(34, -364, 32, -338, 22, -322); hair.bezierCurveTo(16, -330, 12, -342, 4, -346); hair.bezierCurveTo(-4, -356, -14, -352, -22, -354); hair.lineTo(-30, -360); hair.closePath();
  cel(hair, '#4a3226', '#2f1f18');
  // 辫子：每节晚一点响应风，做出跟随
  let bx = 22, by = -330; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const bend = .15 + .85 * clamp(wind(xs, t - i * .055) - .1, 0, 1.4) + .12 * Math.sin(t * 8 - i * .9) * clamp(g0), a = Math.PI / 2 - Math.min(bend, 1.35);
    const nx = bx + Math.cos(a) * 14, ny = by + Math.sin(a) * 14, p = new Path2D(); p.ellipse((bx + nx) / 2, (by + ny) / 2, 9 - i * .4, 6 - i * .3, a, 0, TAU); cel(p, '#4a3226', '#2f1f18'); bx = nx; by = ny;
  }
  ctx.fillStyle = '#d24b3c'; ctx.beginPath(); ctx.arc(bx, by, 5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.lineWidth = 2.2;
  // 五官：侧脸，眼、睫毛、腮红、嘴
  ctx.fillStyle = '#2b1d18'; ctx.beginPath(); ctx.ellipse(-21, -350, 3.2, 5, -.1, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-26, -357); ctx.quadraticCurveTo(-20, -360, -15, -356); ctx.stroke();
  ctx.fillStyle = 'rgba(235,120,110,.35)'; ctx.beginPath(); ctx.ellipse(-16, -337, 7, 4, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-33, -330); ctx.lineTo(-28, -329); ctx.stroke();
  ctx.beginPath(); ctx.arc(8, -346, 6, -1.2, 1.9); ctx.stroke();
  // 帽子：以后沿为轴被风掀起
  ctx.save(); ctx.translate(26, -370 - lift * 9); ctx.rotate(lift * .32 + Math.sin(t * 20) * .02 * lift); ctx.translate(-26, 370);
  const brim = new Path2D(); brim.ellipse(-8, -372, 66, 13, -.05, 0, TAU); cel(brim, '#ecd38f', '#c7a65f');
  const crown = new Path2D(); crown.moveTo(-36, -374); crown.bezierCurveTo(-36, -410, 20, -412, 22, -376); crown.closePath(); cel(crown, '#ecd38f', '#c7a65f');
  ctx.fillStyle = '#d24b3c'; ctx.beginPath(); ctx.moveTo(-36, -374); ctx.lineTo(22, -376); ctx.lineTo(22, -384); ctx.quadraticCurveTo(-8, -388, -35, -382); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(150,115,55,.6)'; ctx.lineWidth = 1; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(-8, -372, 62 - Math.abs(i) * 6, 10 - Math.abs(i), -.05, Math.PI * .05, Math.PI * .95); ctx.stroke(); }
  ctx.restore();
  // 前面那只手臂：两节反向运动学，从垂手到按住帽檐
  const sh = [-4, -298], hatT = [-40, -380 - lift * 9 + 6 * (1 - clamp(arm))], rest = [-9 - w0 * 2, -191];
  const tg = [lerp(rest[0], hatT[0], arm), lerp(rest[1], hatT[1], arm)], L1 = 54, L2 = 54;
  const dx = tg[0] - sh[0], dy = tg[1] - sh[1], d = Math.min(Math.hypot(dx, dy), L1 + L2 - .5), base = Math.atan2(dy, dx), off = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const el = [sh[0] + Math.cos(base + off) * L1, sh[1] + Math.sin(base + off) * L1], hd = [sh[0] + Math.cos(base) * d, sh[1] + Math.sin(base) * d];
  ctx.strokeStyle = LINE; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(sh[0], sh[1]); ctx.lineTo(el[0], el[1]); ctx.lineTo(hd[0], hd[1]); ctx.stroke();
  ctx.lineWidth = 12; ctx.strokeStyle = '#f2cba6'; ctx.beginPath(); ctx.moveTo(el[0], el[1]); ctx.lineTo(hd[0], hd[1]); ctx.stroke();
  ctx.lineWidth = 2.2; ctx.strokeStyle = LINE;
  const sl = new Path2D(); sl.ellipse(lerp(sh[0], el[0], .3), lerp(sh[1], el[1], .3), 11, 16, base + off - Math.PI / 2, 0, TAU); cel(sl, '#f6f1e6', '#c9ced6');
  const hand = new Path2D(); hand.arc(hd[0], hd[1], 8, 0, TAU); cel(hand, '#f2cba6', '#d6a986');
  ctx.restore();
}
