// C-165 剧院彩绘布景：init 里把天幕、云、山、树和地排一块块画成带胶合板白边的平板（渐变打底、再铺几百笔半透明短笔触），每帧按时间摆位：山从侧幕滑进来、树绕底边的铰链立起、云挂在吊线上晃，鼓风机一开纸叶就乱颤乱飞，演员从脚到头由亮到暗上色、放大的影子投在天幕上，画架上的歌词卡按节拍翻页；镜头按对数插值从后排推到台口，前排观众放大得更快，滑出画面。
// 风格提示词：用剧院彩绘布景风格：从观众席后排望向一座小剧场，台上的山、树和云都是手绘平板和吊幕，靠铰链和吊线由看不见的工人拉动，鼓风机吹得纸叶乱颤，脚灯从下往上照亮演员，歌词写在台边画架的卡片上，镜头从后排一路推近到舞台。
// 题材：纸艺、材质与定格 · 适合：戏剧化叙事、喜剧歌曲、舞台感品牌片
scene({
  id: 'C-165', name: '剧院彩绘布景', dur: 5, still: 3.3,
  fonts: ["40px 'Ma Shan Zheng'"],
  init() {
    const R = mulberry32(165);
    const PW = LAND ? W * .62 : W * .86, PH = LAND ? PW * .56 : PW * 1.15, k = PW / 1000;
    const ox = (W - PW) / 2, oy = (LAND ? H * .4 : H * .36) - PH / 2;
    const S = 2, pad = 6 * k;
    // 平板：shape 建路径；先错开一点画胶合板的白边，再填色、铺笔触、描边
    const flat = (w, h, shape, fill, pal, n = 160, edge = '#E6D6B2') => {
      const c = mk(Math.ceil((w + pad * 2) * S), Math.ceil((h + pad * 2) * S)), g = c.getContext('2d'); g.scale(S, S); g.translate(pad, pad);
      g.save(); g.translate(3 * k, 2.5 * k); shape(g, w, h); g.fillStyle = edge; g.fill(); g.restore();
      shape(g, w, h); g.save(); g.clip(); fill(g, w, h);
      for (let i = 0; i < n; i++) { const x = R() * w, y = R() * h, l = (14 + R() * 40) * k, a = (R() - .5) * .9;
        g.strokeStyle = pal[(R() * pal.length) | 0]; g.globalAlpha = .18 + R() * .25; g.lineWidth = (3 + R() * 7) * k; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5, y + Math.sin(a) * l * .5 - 4 * k, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
      g.globalAlpha = .25; g.globalCompositeOperation = 'multiply'; g.drawImage(makePaper('#EEE6D6', { w: 400, h: 400, grain: 22, fiber: .8, blot: 14, seed: (R() * 99) | 0 }), 0, 0, w, h);
      g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      shape(g, w, h); g.strokeStyle = 'rgba(40,24,12,.7)'; g.lineWidth = 2 * k; g.lineJoin = 'round'; g.stroke();
      return { c, w, h };
    };
    const poly = (g, P) => { g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
    const lumpy = (cx, cy, rx, ry, a0, a1, n, seed, flatBottom = false) => { const P = [];
      for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n), b = 1 + .16 * Math.abs(Math.sin(a * 3.5 + seed)) + .06 * Math.sin(a * 9 + seed * 2);
        let y = Math.sin(a) * ry * b; if (flatBottom && y > 0) y *= .35; P.push([cx + Math.cos(a) * rx * b, cy + y]); } return P; };
    const vgrad = (g, h, cs) => { const gr = g.createLinearGradient(0, 0, 0, h); cs.forEach((c, i) => gr.addColorStop(i / (cs.length - 1), c)); g.fillStyle = gr; g.fillRect(-50, -50, 3000, 3000); };
    // 天幕：整块画布，不是剪影
    const dropH = PH * .8, drop = mk(Math.ceil(PW * S), Math.ceil(dropH * S)); { const g = drop.getContext('2d'); g.scale(S, S);
      vgrad(g, dropH, ['#5E86B8', '#8DB4D6', '#E9C9A0', '#F2B07A']);
      g.fillStyle = '#FFE7A8'; g.beginPath(); g.arc(PW * .72, dropH * .34, 62 * k, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,240,190,.5)'; g.lineWidth = 6 * k; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; g.beginPath(); g.moveTo(PW * .72 + Math.cos(a) * 78 * k, dropH * .34 + Math.sin(a) * 78 * k); g.lineTo(PW * .72 + Math.cos(a) * 104 * k, dropH * .34 + Math.sin(a) * 104 * k); g.stroke(); }
      g.fillStyle = '#9C8FB4'; poly(g, [[0, dropH], ...Array.from({ length: 13 }, (_, i) => [i / 12 * PW, dropH * (.7 - .08 * Math.abs(Math.sin(i * 1.7)) - (i % 3 === 1 ? .06 : 0))]), [PW, dropH]]); g.fill();
      for (let i = 0; i < 700; i++) { const x = R() * PW, y = R() * dropH, l = (20 + R() * 60) * k; g.strokeStyle = ['#F4E2C0', '#6E92C0', '#C9A6C8', '#FFFFFF'][(R() * 4) | 0]; g.globalAlpha = .08 + R() * .14; g.lineWidth = (4 + R() * 9) * k; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l * .5, y - 6 * k, x + l, y + (R() - .5) * 8 * k); g.stroke(); }
      g.globalAlpha = .3; g.globalCompositeOperation = 'multiply'; g.drawImage(makePaper('#EEE4D2', { w: 500, h: 400, grain: 20, fiber: 1, blot: 18, seed: 4 }), 0, 0, PW, dropH);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.strokeStyle = 'rgba(60,40,30,.25)'; g.lineWidth = 2 * k; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(PW * i / 4, 0); g.lineTo(PW * i / 4, dropH); g.stroke(); } }   // 拼幅的缝
    // 云
    const clouds = [0, 1, 2].map(i => { const w = (190 + i * 30) * k, h = 92 * k;
      return flat(w, h, (g, w, h) => poly(g, lumpy(w / 2, h * .62, w * .44, h * .48, 0, TAU, 40, i * 2.3, true)), (g, w, h) => vgrad(g, h, ['#FFFFFF', '#F4ECE4', '#C8C0D8']), ['#FFFFFF', '#D8D0E6', '#BFC9E0'], 50); });
    // 山
    const mount = (w, h, peaks, cA, cB, seed) => flat(w, h, (g, w, h) => { const P = [[0, h]]; peaks.forEach(([x, y]) => P.push([x * w, y * h])); P.push([w, h]); poly(g, P); },
      (g, w, h) => { vgrad(g, h, [cA, cB]); g.fillStyle = '#F6F2EC'; peaks.forEach(([x, y], i) => { if (y > .15) return; const px = x * w, py = y * h, s = w * .09;
        poly(g, [[px - s * 1.4, py + s * 1.1], [px, py - 2 * k], [px + s * 1.4, py + s * 1.1], [px + s * .6, py + s * .8], [px + s * .1, py + s * 1.3], [px - s * .5, py + s * .7]]); g.fill(); }); },
      ['#3C3A70', '#8A86C0', '#5C5A98'], 140);
    const mtA = mount(520 * k, 330 * k, [[.08, .7], [.3, .1], [.45, .45], [.62, .02], [.85, .5], [.95, .75]], '#6C64A8', '#3E3A72');
    const mtB = mount(460 * k, 270 * k, [[.1, .6], [.38, .05], [.6, .4], [.78, .18], [.94, .72]], '#5E7AA8', '#34446E');
    // 树：冠留一个底口接上树干，整体一圈外轮廓
    const tree = (w, h, cA, cB, seed) => flat(w, h, (g, w, h) => { const cx = w / 2, cy = h * .36, rx = w * .44, ry = h * .32, tw = w * .07, d = .32;
      poly(g, [...lumpy(cx, cy, rx, ry, Math.PI / 2 + d, Math.PI / 2 + TAU - d, 44, seed), [cx + tw, cy + ry * .8], [cx + tw * 1.5, h], [cx - tw * 1.5, h], [cx - tw, cy + ry * .8]]); },
      (g, w, h) => { vgrad(g, h * .7, [cA, cB]); g.fillStyle = '#7A4A26'; g.fillRect(w * .4, h * .62, w * .2, h); }, ['#2E6A2E', '#8CC060', '#C8E080', '#1E4A22'], 120);
    const trees = [tree(250 * k, 360 * k, '#5FA048', '#2A5A2A', 1), tree(210 * k, 300 * k, '#7AAE40', '#3A6A28', 4)];
    const bush = flat(PW * 1.02, 70 * k, (g, w, h) => poly(g, [[0, h], ...Array.from({ length: 26 }, (_, i) => [i / 25 * w, h * (.15 + .5 * Math.abs(Math.sin(i * 1.3 + .5)))]), [w, h]]),
      (g, w, h) => vgrad(g, h, ['#6E9A3E', '#2E4E22']), ['#9CC860', '#24401C'], 120);
    // 地板：一条条木板
    const fb = oy + PH * .78, ff = oy + PH;
    // 观众：一排排头和椅背，越近越大
    const aud = []; const nr = LAND ? 6 : 9;
    for (let r = 0; r < nr; r++) { const y = ff + (LAND ? 70 : 60) * k + Math.pow(r / (nr - 1), 1.25) * (H - ff - 40 * k), sc = 1 + r * .28, n = Math.ceil(W / (70 * k * sc)) + 2;
      for (let i = 0; i < n; i++) aud.push({ x: (i - .5 + (r % 2) * .5) * 70 * k * sc + (R() - .5) * 14 * k, y, s: sc * (.9 + R() * .2), r, h: R(), hat: R() < .15, bun: R() < .2 }); }
    // 纸叶
    const leaves = Array.from({ length: 90 }, (_, i) => ({ t0: 2.4 + R() * 2.4, sp: .45 + R() * .5, y0: .3 + R() * .5, ph: R() * TAU, spin: 4 + R() * 9, s: (10 + R() * 9) * k, c: ['#E2862C', '#D24A26', '#E8C238', '#8CB840'][(R() * 4) | 0], fall: R() }));
    const twig = Array.from({ length: 28 }, (_, i) => ({ tr: i % 2, a: R() * TAU, r: Math.sqrt(R()) * .8, ph: R() * TAU, c: ['#E2862C', '#E8C238', '#9AC448'][(R() * 3) | 0] }));
    return { PW, PH, k, ox, oy, drop, dropH, clouds, mtA, mtB, trees, bush, fb, ff, aud, leaves, twig, pad };
  },
  draw(ctx, t, s, f) {
    const { PW, PH, k, ox, oy, fb, ff, pad } = s, g = ctx;
    const put = (F, x, y, sx = 1, sy = 1) => g.drawImage(F.c, x - pad * sx, y - pad * sy, (F.w + pad * 2) * sx, (F.h + pad * 2) * sy);
    // 镜头：后排 → 台口
    const cp = eInOutCubic(inv(.25, 4.6, t)), z = Math.exp(lerp(0, Math.log(LAND ? 1.55 : 1.75), cp));
    const fx = lerp(W / 2, ox + PW / 2, cp), fy = lerp(H / 2, oy + PH * .5, cp) + Math.sin(t * 1.7) * 2 * k * cp;
    const cam = (zz) => { g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, H / 2); g.scale(zz, zz); g.translate(-fx, -fy); };
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#120806'; g.fillRect(0, 0, W, H);
    cam(z);
    const beat = t / BEAT, bf = 1 - (beat % 1), cx0 = ox + PW / 2;
    // ── 舞台里面 ──
    g.save(); g.beginPath(); g.rect(ox, oy, PW, PH); g.clip();
    g.drawImage(s.drop, ox, oy, PW, s.dropH);
    // 地板
    const vx = cx0, vy = oy - PH * .9;
    g.fillStyle = '#8A5A32'; g.fillRect(ox, fb, PW, ff - fb);
    g.strokeStyle = 'rgba(40,20,8,.45)'; g.lineWidth = 1.5 * k; for (let i = -12; i <= 12; i++) { const xf = cx0 + i * PW / 12, xb = lerp(vx, xf, (fb - vy) / (ff - vy)); g.beginPath(); g.moveTo(xb, fb); g.lineTo(xf, ff); g.stroke(); }
    for (let i = 1; i < 5; i++) { const y = lerp(fb, ff, Math.pow(i / 5, 1.4)); g.beginPath(); g.moveTo(ox, y); g.lineTo(ox + PW, y); g.stroke(); }
    // 演员：脚下亮、头上暗
    const actors = [{ x: ox + PW * .43, h: (LAND ? 300 : 380) * k, coat: '#B8342A', leg: '#2A2A40', hat: '#E8D07A', man: true, ph: 0 }, { x: ox + PW * .585, h: (LAND ? 285 : 360) * k, coat: '#3A6AB8', leg: '#3A6AB8', hat: '#E86A8A', man: false, ph: .5 }];
    const fy0 = oy + PH * .955;
    const person = (A, x, y, h, mono) => {
      const sing = Math.pow(clamp(1 - ((beat + A.ph) % 1) * 1.6), 1.5), sway = Math.sin(t * 2.6 + A.ph * 3) * .05, top = y - h;
      const col = (c) => { if (mono) return mono; const [r, gg, b] = hex2rgb(c), gr = g.createLinearGradient(0, y, 0, top);
        gr.addColorStop(0, rgba([Math.min(255, r * 1.35 + 40), Math.min(255, gg * 1.25 + 30), Math.min(255, b * 1.05 + 10)], 1)); gr.addColorStop(1, rgba([r * .55, gg * .55, b * .6], 1)); return gr; };
      g.save(); g.translate(x, y); g.rotate(sway * .3); g.translate(-x, -y);
      const sh = top + h * .26, hip = top + h * .58;
      if (A.man) { g.fillStyle = col(A.leg); g.fillRect(x - h * .07, hip, h * .055, y - hip); g.fillRect(x + h * .015, hip, h * .055, y - hip);
        g.fillStyle = col('#1A1410'); g.fillRect(x - h * .09, y - h * .02, h * .08, h * .025); g.fillRect(x + h * .01, y - h * .02, h * .08, h * .025);
        g.fillStyle = col(A.coat); poly4(x - h * .1, sh, x + h * .1, sh, x + h * .12, hip + h * .06, x - h * .12, hip + h * .06);
        if (!mono) { g.strokeStyle = 'rgba(255,240,220,.55)'; g.lineWidth = h * .012; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * h * .04, sh); g.lineTo(x + i * h * .048, hip + h * .06); g.stroke(); } }
      } else { g.fillStyle = col(A.coat); poly4(x - h * .08, sh, x + h * .08, sh, x + h * .2, y, x - h * .2, y);
        if (!mono) { g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x - h * .16 + i * h * .08, y - h * .03, h * .025, 0, TAU); g.fill(); } } }
      // 手臂：一只按拍子扬起
      const arm = (side, up) => { const ax = x + side * h * .09, ay = sh + h * .02, a = side > 0 ? lerp(1.25, -.7, up) : lerp(1.9, 2.6, up * .5), l = h * .3;
        g.strokeStyle = mono || A.coat; g.lineWidth = h * .05; g.lineCap = 'round'; const ex = ax + Math.cos(a) * l * .5, ey = ay + Math.sin(a) * l * .5;
        g.beginPath(); g.moveTo(ax, ay); g.lineTo(ex, ey); g.lineTo(ex + Math.cos(a - side * .4) * l * .5, ey + Math.sin(a - side * .4) * l * .5); g.stroke();
        g.fillStyle = mono || '#F0C8A8'; g.beginPath(); g.arc(ex + Math.cos(a - side * .4) * l * .5, ey + Math.sin(a - side * .4) * l * .5, h * .03, 0, TAU); g.fill(); };
      arm(A.man ? 1 : -1, A.man ? .3 + .7 * sing : sing); arm(A.man ? -1 : 1, A.man ? .2 : .6);
      // 头
      const hy = top + h * .14, hr = h * .085;
      g.fillStyle = mono || '#F2CCA8'; g.beginPath(); g.arc(x, hy, hr, 0, TAU); g.fill();
      if (!mono) { g.fillStyle = '#2A1810'; [-1, 1].forEach(d => { g.beginPath(); g.arc(x + d * hr * .38, hy - hr * .1, hr * .1, 0, TAU); g.fill(); });
        g.fillStyle = 'rgba(230,80,90,.45)'; [-1, 1].forEach(d => { g.beginPath(); g.arc(x + d * hr * .55, hy + hr * .25, hr * .18, 0, TAU); g.fill(); });
        g.fillStyle = '#7A1E22'; g.beginPath(); g.ellipse(x, hy + hr * .45, hr * .22, hr * (.08 + .25 * sing), 0, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,250,230,.5)'; g.beginPath(); g.ellipse(x, hy + hr * .8, hr * .5, hr * .18, 0, 0, Math.PI); g.fill(); }   // 下巴被脚灯照亮
      if (A.man) { g.fillStyle = mono || A.hat; g.fillRect(x - hr * 1.5, hy - hr * .85, hr * 3, hr * .22); g.fillRect(x - hr * .9, hy - hr * 1.5, hr * 1.8, hr * .7); if (!mono) { g.fillStyle = '#B8342A'; g.fillRect(x - hr * .9, hy - hr * 1.0, hr * 1.8, hr * .18); } }
      else { g.fillStyle = mono || '#5A3020'; g.beginPath(); g.arc(x, hy - hr * .2, hr * 1.05, Math.PI * 1.05, Math.PI * 1.95); g.fill(); g.beginPath(); g.arc(x, hy - hr * 1.1, hr * .45, 0, TAU); g.fill();
        g.fillStyle = mono || A.hat; g.beginPath(); g.arc(x + hr * .7, hy - hr * .8, hr * .3, 0, TAU); g.fill(); }
      g.restore();
    };
    function poly4(a, b, c, d, e, f2, h2, i2) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.lineTo(e, f2); g.lineTo(h2, i2); g.closePath(); g.fill(); }
    // 影子：脚灯在下面，影子放大投到天幕上
    actors.forEach(A => { g.globalAlpha = .16; person(A, A.x + (A.x - cx0) * .4, fb + 6 * k, A.h * 1.4, '#2A1E3A'); g.globalAlpha = 1; });
    // 云：挂在吊线上，被拉着走、上下晃
    const fly = oy - 10 * k;
    s.clouds.forEach((C, i) => { const x = ox + PW * [.12, .44, .7][i] + Math.sin(t * .7 + i * 2) * 26 * k + (i === 1 ? (t - 2.5) * 22 * k : 0), y = oy + PH * [.1, .2, .06][i] + Math.sin(t * 2.1 + i) * 7 * k;
      g.strokeStyle = 'rgba(30,20,14,.65)'; g.lineWidth = 1.3 * k; [.25, .75].forEach(q => { g.beginPath(); g.moveTo(x + C.w * q, y + C.h * .3); g.lineTo(x + C.w * q + Math.sin(t * 2.1 + i) * 3 * k, fly); g.stroke(); });
      put(C, x, y); });
    // 山：从侧幕被拉进来，人手拉，有点顿
    const pull = (a, b) => { const p = inv(a, b, t); return eOutCubic(p) + Math.sin(p * 14) * (1 - p) * .03 * (p > 0 && p < 1); };
    put(s.mtB, ox + PW * .48 + (1 - pull(.9, 1.9)) * PW * .62, fb - s.mtB.h + 30 * k);
    put(s.mtA, ox + PW * .02 - (1 - pull(.4, 1.4)) * PW * .62, fb - s.mtA.h + 34 * k);
    put(s.bush, ox - PW * .01, fb - s.bush.h * .55);
    // 树：底边是铰链，躺在地上→立起来，吊线拉着
    const blow = smooth(2.3, 2.8, t);
    [[.16, 1.4, 2.2], [.74, 1.75, 2.55]].forEach(([fxp, a, b], i) => { const T = s.trees[i], p = inv(a, b, t), ang = eOutBack(p, 2.2) * Math.PI / 2, sy = Math.max(.04, Math.sin(Math.min(Math.PI / 2 + .12, ang)));
      const x = ox + PW * fxp, base = oy + PH * .86 + i * 14 * k, wob = blow * Math.sin(t * 13 + i) * .012;
      g.save(); g.translate(x + T.w / 2, base); g.rotate(wob); g.strokeStyle = 'rgba(30,20,14,.65)'; g.lineWidth = 1.3 * k; g.beginPath(); g.moveTo(0, -T.h * sy); g.lineTo(T.w * .1, -base + fly); g.stroke();
      put(T, -T.w / 2, -T.h * sy, 1, sy);
      // 冠上挂的纸叶，风一吹就颤
      s.twig.filter(L => L.tr === i).forEach(L => { const lx = Math.cos(L.a) * L.r * T.w * .4, ly = (-T.h * .64 + Math.sin(L.a) * L.r * T.h * .28) * sy, rot = blow * Math.sin(t * 22 + L.ph) * .9 + L.ph;
        g.save(); g.translate(lx, ly); g.rotate(rot); g.scale(1, Math.max(.2, sy) * (1 - blow * .5 * Math.abs(Math.sin(t * 17 + L.ph)))); leaf(L.c, 13 * k); g.restore(); });
      g.restore(); });
    function leaf(c, sz) { g.fillStyle = c; g.beginPath(); g.moveTo(-sz, 0); g.quadraticCurveTo(0, -sz * .7, sz, 0); g.quadraticCurveTo(0, sz * .7, -sz, 0); g.fill(); g.strokeStyle = 'rgba(60,30,10,.6)'; g.lineWidth = .8 * k; g.beginPath(); g.moveTo(-sz, 0); g.lineTo(sz, 0); g.stroke(); }
    // 鼓风机：右侧幕边露出半个
    { const bx = ox + PW * .985, by = oy + PH * .84, br = 62 * k; g.fillStyle = '#3A3A3E'; g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill();
      g.save(); g.translate(bx, by); g.rotate(t * lerp(1, 40, blow)); g.fillStyle = '#9A9AA0'; for (let i = 0; i < 4; i++) { g.rotate(TAU / 4); g.beginPath(); g.ellipse(br * .45, 0, br * .42, br * .16, .3, 0, TAU); g.fill(); } g.restore();
      g.strokeStyle = '#6A6A70'; g.lineWidth = 2 * k; for (let r = 1; r <= 3; r++) { g.beginPath(); g.arc(bx, by, br * r / 3, 0, TAU); g.stroke(); } }
    // 演员
    actors.forEach(A => person(A, A.x, fy0, A.h));
    // 画架和歌词卡：每 1.25 秒翻一张
    const lyr = [['看那座山', '走过来'], ['树也一棵棵', '站起来'], ['风一吹', '纸叶满台飞'], ['大家跟着', '一起唱']];
    { const ex = ox + PW * (LAND ? .2 : .28), ey = oy + PH * .985, eh = 300 * k, cw = (LAND ? 210 : 170) * k, ch = 140 * k;
      g.strokeStyle = '#6A4020'; g.lineWidth = 7 * k; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 60 * k, ey); g.lineTo(ex - 8 * k, ey - eh); g.moveTo(ex + 60 * k, ey); g.lineTo(ex + 8 * k, ey - eh); g.moveTo(ex, ey - 10 * k); g.lineTo(ex, ey - eh); g.stroke();
      g.fillStyle = '#5A3418'; g.fillRect(ex - cw * .55, ey - eh * .38, cw * 1.1, 10 * k);
      const ci = Math.min(3, Math.floor(t / 1.25)), fp = t - ci * 1.25, fl = ci > 0 && fp < .25 ? fp / .25 : 1;
      const card = (j, sy) => { const top = ey - eh * .38 - ch; g.save(); g.translate(ex, top); g.scale(1, sy); g.fillStyle = '#F4EAD2'; g.fillRect(-cw / 2, 0, cw, ch);
        g.strokeStyle = '#B8342A'; g.lineWidth = 3 * k; g.strokeRect(-cw / 2 + 7 * k, 7 * k, cw - 14 * k, ch - 14 * k);
        g.fillStyle = '#2A1810'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${Math.round(36 * k)}px 'Ma Shan Zheng'`; lyr[j].forEach((l, m) => g.fillText(l, 0, ch * (.36 + m * .32)));
        g.restore(); };
      if (fl < 1) { card(ci, 1); card(ci - 1, Math.max(.02, 1 - fl * 2) * (fl < .5 ? 1 : 0)); if (fl >= .5) { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(ex - cw / 2, ey - eh * .38 - ch, cw, ch * (fl - .5) * 2); } }
      else card(ci, 1);
      g.fillStyle = '#8A5A2A'; g.fillRect(ex - 14 * k, ey - eh * .38 - ch - 12 * k, 28 * k, 14 * k); }
    // 飘的纸叶：从右边鼓风机那里吹过来
    s.leaves.forEach(L => { const p = (t - L.t0) * L.sp; if (p < 0 || p > 1.2) return;
      const x = ox + PW * (1 - p * 1.05), y = oy + PH * (L.y0 + p * .25 * L.fall) + Math.sin(t * 5 + L.ph) * 24 * k, fl = Math.cos(t * L.spin + L.ph);
      g.save(); g.translate(x, y); g.rotate(Math.sin(t * 3 + L.ph) * 1.2); g.scale(1, Math.abs(fl) * .9 + .1); leaf(L.c, L.s); g.restore(); });
    // 脚灯：上暗下亮
    let gr = g.createLinearGradient(0, oy, 0, ff); gr.addColorStop(0, 'rgba(10,6,20,.5)'); gr.addColorStop(.55, 'rgba(10,6,20,.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(ox, oy, PW, PH);
    g.globalCompositeOperation = 'lighter'; gr = g.createLinearGradient(0, ff, 0, ff - PH * .5); gr.addColorStop(0, 'rgba(255,170,70,.32)'); gr.addColorStop(1, 'rgba(255,170,70,0)'); g.fillStyle = gr; g.fillRect(ox, ff - PH * .5, PW, PH * .5);
    g.globalCompositeOperation = 'source-over';
    // 侧幕：红丝绒，束起来
    const curtain = (side) => { const cw = PW * .1, x0 = side < 0 ? ox : ox + PW - cw;
      g.save(); g.beginPath(); if (side < 0) { g.moveTo(ox, oy); g.lineTo(ox + cw * 1.3, oy); g.quadraticCurveTo(ox + cw * .9, oy + PH * .5, ox + cw * .55, oy + PH * .62); g.quadraticCurveTo(ox + cw * .7, oy + PH * .8, ox + cw * .9, ff); g.lineTo(ox, ff); }
      else { g.moveTo(ox + PW, oy); g.lineTo(ox + PW - cw * 1.3, oy); g.quadraticCurveTo(ox + PW - cw * .9, oy + PH * .5, ox + PW - cw * .55, oy + PH * .62); g.quadraticCurveTo(ox + PW - cw * .7, oy + PH * .8, ox + PW - cw * .9, ff); g.lineTo(ox + PW, ff); }
      g.closePath(); const lg = g.createLinearGradient(side < 0 ? ox : ox + PW - cw * 1.3, 0, side < 0 ? ox + cw * 1.3 : ox + PW, 0);
      for (let i = 0; i <= 10; i++) lg.addColorStop(i / 10, i % 2 ? '#8A1418' : '#C8303A'); g.fillStyle = lg; g.fill(); g.restore();
      g.fillStyle = '#E2B04A'; g.beginPath(); g.ellipse(side < 0 ? ox + cw * .55 : ox + PW - cw * .55, oy + PH * .62, 14 * k, 9 * k, 0, 0, TAU); g.fill(); };
    curtain(-1); curtain(1);
    // 檐幕：一排垂花和金穗
    g.fillStyle = '#A0202A'; g.fillRect(ox, oy, PW, PH * .07); for (let i = 0; i < 9; i++) { const x = ox + PW * i / 9, w = PW / 9; g.beginPath(); g.moveTo(x, oy + PH * .06); g.quadraticCurveTo(x + w / 2, oy + PH * .17, x + w, oy + PH * .06); g.fill(); }
    g.strokeStyle = '#E2B04A'; g.lineWidth = 4 * k; for (let i = 0; i < 9; i++) { const x = ox + PW * i / 9, w = PW / 9; g.beginPath(); g.moveTo(x, oy + PH * .06); g.quadraticCurveTo(x + w / 2, oy + PH * .17, x + w, oy + PH * .06); g.stroke(); }
    g.restore();
    // ── 台口外面 ──
    // 台口框：金边拱，墙
    g.fillStyle = '#2A1210'; g.beginPath(); g.rect(-W, -H, W * 3, H * 3); g.rect(ox, oy, PW, PH); g.fill('evenodd');
    g.strokeStyle = '#C89A3E'; g.lineWidth = 16 * k; g.strokeRect(ox - 8 * k, oy - 8 * k, PW + 16 * k, PH + 16 * k);
    g.strokeStyle = '#7A5A22'; g.lineWidth = 3 * k; g.strokeRect(ox - 22 * k, oy - 22 * k, PW + 44 * k, PH + 44 * k);
    { const cxc = cx0, cyc = oy - 70 * k; g.fillStyle = '#C89A3E'; g.beginPath(); g.arc(cxc, cyc, 42 * k, 0, TAU); g.fill(); g.strokeStyle = '#C89A3E'; g.lineWidth = 4 * k;
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.beginPath(); g.moveTo(cxc + Math.cos(a) * 50 * k, cyc + Math.sin(a) * 50 * k); g.lineTo(cxc + Math.cos(a) * (70 + (i % 2) * 18) * k, cyc + Math.sin(a) * (70 + (i % 2) * 18) * k); g.stroke(); }
      g.fillStyle = '#2A1210'; g.font = `${Math.round(40 * k)}px 'Ma Shan Zheng'`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('戏', cxc, cyc + 2 * k); }
    // 台唇和脚灯
    g.fillStyle = '#3A1E12'; g.fillRect(ox - 30 * k, ff, PW + 60 * k, 56 * k); g.fillStyle = '#5A2E1A'; g.fillRect(ox - 30 * k, ff, PW + 60 * k, 8 * k);
    const nl = 14; for (let i = 0; i < nl; i++) { const x = ox + PW * (i + .5) / nl, fl = .85 + .15 * noise1(t * 6 + i * 3);
      g.globalCompositeOperation = 'lighter'; const rg = g.createRadialGradient(x, ff - 4 * k, 0, x, ff - 4 * k, 70 * k); rg.addColorStop(0, `rgba(255,200,110,${.55 * fl})`); rg.addColorStop(1, 'rgba(255,160,60,0)'); g.fillStyle = rg; g.fillRect(x - 70 * k, ff - 74 * k, 140 * k, 80 * k);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(255,236,180,${fl})`; g.beginPath(); g.ellipse(x, ff + 2 * k, 11 * k, 6 * k, 0, Math.PI, TAU); g.fill();
      g.fillStyle = '#1A0E08'; g.beginPath(); g.moveTo(x - 20 * k, ff + 4 * k); g.quadraticCurveTo(x, ff + 26 * k, x + 20 * k, ff + 4 * k); g.closePath(); g.fill(); }
    // 观众：越近的排放大得越多，推镜时先滑出画面
    const za = Math.pow(z, 1.8);
    cam(za);
    s.aud.forEach(A => { const x = A.x + (fx - W / 2) * 0, hs = 24 * k * A.s, y = A.y + Math.sin(t * 2 + A.h * 9) * 1.2 * k + (A.h < .3 ? -Math.max(0, Math.sin((beat + A.h * 4) * Math.PI)) * 3 * k : 0);
      const lit = .12 + .12 * (1 - A.r / 10);
      g.fillStyle = '#0C0606'; rr(g, x - hs * 1.6, y + hs * .9, hs * 3.2, hs * 3, hs * .5); g.fill();   // 椅背
      g.fillStyle = '#100808'; g.beginPath(); g.ellipse(x, y + hs * 1.6, hs * 1.5, hs * .9, 0, Math.PI, TAU); g.fill(); g.beginPath(); g.ellipse(x, y, hs * .82, hs, 0, 0, TAU); g.fill();
      if (A.bun) { g.beginPath(); g.arc(x, y - hs * .95, hs * .38, 0, TAU); g.fill(); }
      if (A.hat) { g.fillRect(x - hs * 1.2, y - hs * .55, hs * 2.4, hs * .2); g.fillRect(x - hs * .7, y - hs * 1.3, hs * 1.4, hs * .8); }
      g.strokeStyle = `rgba(255,190,120,${lit})`; g.lineWidth = 2 * k; g.beginPath(); g.ellipse(x, y, hs * .82, hs, 0, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); });
    g.setTransform(1, 0, 0, 1, 0, 0);
    vignette(ctx, .55, .4); grain(ctx, f, .15);
  }
});
