// C-132 哥特泥金手抄本：init 里在纸纹上排双栏的仿哥特黑体字（每个字母由带菱形头尾的竖笔拼成，段首红字），画金底刻点的巨大首字母和尖拱框里群青、朱红平涂的人物，金色部分另存一张遮罩；每帧页边藤蔓沿路径长出、小兽沿藤爬，一道斜向高光只在金色处扫过、经过时闪出四角星，3 秒时按书脊把这一页压窄、翻到背面露出下一页。
// 风格提示词：用哥特泥金手抄本风格：泛黄羊皮纸上是双栏黑体拉丁字和一个巨大的彩绘首字母，背景铺着压花金箔，一道斜向高光随时间扫过所有金色处并闪出四角星，群青和朱红平涂的人物站在尖拱框里，页边的藤蔓和小兽慢慢爬动，转场是翻过一页羊皮纸。
// 题材：印刷、版画与装饰 · 适合：中世纪传说、奇幻故事、典籍与历史讲解
scene({
  id: 'C-132', name: '哥特泥金手抄本', dur: 5, still: 2.2,
  fonts: ["900 200px 'Noto Serif SC'"],
  init() {
    const u = SHORT / 1080;
    const INK = '#1E1610', RED = '#B0281C', BLU = '#1F3C8E', GOLD0 = '#B98A2A', GOLD1 = '#F4D77C', PARCH = '#E9D7AE';
    const pw = Math.round(LAND ? W * .42 : W * .9), ph = Math.round(LAND ? H * .9 : H * .86), spine = LAND ? W / 2 : W * .05, top = Math.round(LAND ? H * .05 : H * .07);
    const paper = makePaper(PARCH, { w: pw, h: ph, grain: 9, fiber: .6, blot: 22, seed: 2 });
    const goldFill = (g, x, y, w, h) => { const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, GOLD0); gr.addColorStop(.5, '#D9B04E'); gr.addColorStop(1, GOLD0); g.fillStyle = gr; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(110,70,10,.45)'; const s = Math.max(5, w / 22); for (let yy = y + s / 2; yy < y + h; yy += s) for (let xx = x + ((yy - y) / s % 2 < 1 ? s / 2 : s); xx < x + w; xx += s) { g.beginPath(); g.arc(xx, yy, s * .12, 0, TAU); g.fill(); } };   // 刻点
    function page(seed, o) {
      const c = mk(pw, ph), g = c.getContext('2d'), gm = mk(pw, ph), m = gm.getContext('2d'), R = mulberry32(seed);
      g.drawImage(paper, 0, 0); m.fillStyle = '#fff';
      const xh = pw * .016, lh = xh * 2.9, pen = xh * .34, ml = pw * .13, mr = pw * .11, mt = ph * .08, mb = ph * .15, gut = pw * .05, cw = (pw - ml - mr - gut) / 2;
      g.strokeStyle = 'rgba(160,90,70,.18)'; g.lineWidth = .7;                                         // 刺孔划线
      for (let y = mt; y < ph - mb; y += lh) { g.beginPath(); g.moveTo(ml - 6, y); g.lineTo(pw - mr + 6, y); g.stroke(); }
      // 一个字母：1–3 根竖笔（菱形头尾），偶有升部、降部，或做成 o
      const letter = (x, y, col) => { const r = R(), n = r < .3 ? 1 : r < .75 ? 2 : 3, asc = R() < .14, desc = !asc && R() < .08, sp = xh * .62; g.fillStyle = col;
        for (let i = 0; i < n; i++) { const X = x + i * sp, y0 = y - xh - (asc && i === 0 ? xh * .9 : 0), y1 = y + (desc && i === 0 ? xh * .8 : 0);
          g.beginPath(); g.moveTo(X, y0 + pen * .5); g.lineTo(X + pen * .5, y0); g.lineTo(X + pen, y0 + pen * .5); g.lineTo(X + pen, y1 - pen * .5); g.lineTo(X + pen * .5, y1); g.lineTo(X, y1 - pen * .5); g.closePath(); g.fill();
          if (i < n - 1 && R() < .7) { g.beginPath(); g.moveTo(X + pen, y0 + pen * .5); g.lineTo(X + sp, y0 + pen * .2); g.lineTo(X + sp, y0 + pen * .9); g.lineTo(X + pen, y0 + pen * 1.2); g.fill(); } }
        return x + n * sp + xh * .18; };
      // 一行字：到 x1 为止，单词之间空一格
      const line = (x0, x1, y, col) => { let x = x0; while (x < x1 - xh * 3) { const n = 2 + (R() * 6 | 0); for (let i = 0; i < n && x < x1 - xh; i++) x = letter(x, y, col); x += xh * .9; } };
      // 小首字母（2 行高，红蓝交替）
      const small = (x, y, k) => { const s = lh * 1.7; g.fillStyle = k % 2 ? RED : BLU; g.font = `900 ${s}px 'Noto Serif SC'`; g.textBaseline = 'alphabetic'; g.fillText('ADEGMNPQST'[(R() * 10) | 0], x, y + lh * .05);
        g.strokeStyle = k % 2 ? BLU : RED; g.lineWidth = .8; g.beginPath(); for (let i = 0; i < 6; i++) { g.moveTo(x - 4, y - s * .7 + i * s * .2); g.quadraticCurveTo(x - 14, y - s * .6 + i * s * .2, x - 6, y - s * .5 + i * s * .2); } g.stroke(); return s * .78; };
      for (let ci = 0; ci < 2; ci++) {
        const cx0 = ml + ci * (cw + gut), cx1 = cx0 + cw; let y = mt + lh * .8, k = 0;
        let skipTo = 0, indentX = 0;
        if (o.initial === ci) {                                                                       // 巨大首字母
          const s = cw * .64, x = cx0, yy = mt; goldFill(g, x, yy, s, s); m.fillRect(x, yy, s, s);
          g.fillStyle = BLU; g.fillRect(x + s * .08, yy + s * .08, s * .84, s * .84);
          g.save(); g.beginPath(); g.rect(x + s * .08, yy + s * .08, s * .84, s * .84); g.clip(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1;
          for (let i = 0; i < 9; i++) { g.beginPath(); const a = x + s * (.15 + i * .09); g.moveTo(a, yy + s * .1); g.bezierCurveTo(a + s * .1, yy + s * .3, a - s * .1, yy + s * .6, a, yy + s * .92); g.stroke(); } g.restore();
          g.font = `900 ${s * .95}px 'Noto Serif SC'`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillStyle = '#F1E4C4'; g.fillText(o.letter, x + s / 2 + 2, yy + s * .54 + 2); g.fillStyle = RED; g.fillText(o.letter, x + s / 2, yy + s * .54);
          g.strokeStyle = GOLD1; g.lineWidth = 1.5; g.strokeText(o.letter, x + s / 2, yy + s * .54); g.textAlign = 'left';
          // 首字母拖出的花枝伸进页边
          g.strokeStyle = BLU; g.lineWidth = 2; g.beginPath(); g.moveTo(x, yy + s); g.bezierCurveTo(x - ml * .6, yy + s * 1.3, x - ml * .2, yy + s * 2, x - ml * .55, ph * .5); g.stroke();
          skipTo = yy + s + lh * .2; indentX = x + s + xh;
        }
        let mini = null;
        if (o.mini === ci) { const mh = (ph - mt - mb) * .46; mini = o.miniTop ? [cx0, mt, cw, mh] : [cx0, ph - mb - mh, cw, mh]; }
        while (y < ph - mb) {
          if (mini && y > mini[1] - lh * .3 && y < mini[1] + mini[3] + lh * .6) { y += lh; continue; }
          const first = R() < .1 && y > skipTo;
          let x0 = y < skipTo ? indentX : cx0;
          if (first) { x0 += small(cx0, y, k++); }
          line(x0, cx1, y, first || R() < .04 ? RED : INK); y += lh;
        }
        if (mini) {                                                                                   // 尖拱框里的人
          const [x, y0, w, h] = mini, ax = x + w / 2, sp = y0 + h * .28;
          const arch = gg => { gg.beginPath(); gg.moveTo(x + w * .06, y0 + h); gg.lineTo(x + w * .06, sp); gg.quadraticCurveTo(x + w * .06, y0 + h * .02, ax, y0); gg.quadraticCurveTo(x + w * .94, y0 + h * .02, x + w * .94, sp); gg.lineTo(x + w * .94, y0 + h); gg.closePath(); };
          g.fillStyle = '#C46A7A'; g.fillRect(x, y0 + h * .1, w, h * .9); g.fillStyle = BLU; g.fillRect(x + w * .02, y0 + h * .12, w * .96, h * .86);
          goldFill(g, x - w * .02, y0 + h * .08, w * .04, h * .92); goldFill(g, x + w * .98, y0 + h * .08, w * .04, h * .92); m.fillRect(x - w * .02, y0 + h * .08, w * .04, h * .92); m.fillRect(x + w * .98, y0 + h * .08, w * .04, h * .92);
          g.save(); arch(g); g.clip(); goldFill(g, x, y0, w, h); g.restore(); m.save(); arch(m); m.fill(); m.restore();
          g.save(); arch(g); g.lineWidth = w * .03; g.strokeStyle = o.c2; g.stroke(); g.restore();
          // 人物：长袍、斗篷、光环、手里一本书
          const fx = ax, fb = y0 + h * .97, fh = h * .78, k2 = fh / 100, P = (a, b) => [fx + a * k2, fb - b * k2];
          const poly = (pts, c) => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(...P(...q)) : g.moveTo(...P(...q))); g.closePath(); g.fillStyle = c; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke(); };
          g.fillStyle = '#3A6A3A'; g.fillRect(x + w * .06, fb - h * .05, w * .88, h * .05);
          poly([[-14, 0], [-10, 60], [-12, 74], [12, 74], [10, 60], [16, 0]], o.c1);                     // 长袍
          poly([[-17, 74], [-22, 40], [-26, 4], [-6, 8], [0, 40], [8, 74]], o.c2);                        // 斗篷
          g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(...P(-4 + i * 4, 58)); g.quadraticCurveTo(...P(-6 + i * 5, 30), ...P(-8 + i * 6, 2)); g.stroke(); }
          g.save(); g.beginPath(); g.arc(...P(0, 86), 13 * k2, 0, TAU); g.fillStyle = GOLD1; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke(); g.restore(); m.beginPath(); m.arc(...P(0, 86), 13 * k2, 0, TAU); m.fill();
          g.beginPath(); g.ellipse(...P(0, 84), 6.5 * k2, 8.5 * k2, 0, 0, TAU); g.fillStyle = '#F2DCC4'; g.fill(); g.stroke();
          g.fillStyle = '#6A4A2A'; g.beginPath(); g.arc(...P(0, 87), 6.8 * k2, Math.PI, TAU); g.fill();
          g.fillStyle = INK; [[-2.4, 84], [2.4, 84]].forEach(q => { g.beginPath(); g.arc(...P(...q), .7 * k2, 0, TAU); g.fill(); });
          g.strokeStyle = '#A0402A'; g.lineWidth = 1; g.beginPath(); g.moveTo(...P(-1.5, 79.5)); g.lineTo(...P(1.5, 79.5)); g.stroke();
          poly([[4, 56], [18, 60], [18, 46], [4, 42]], RED); g.fillStyle = GOLD1; g.fillRect(...P(10, 54), 2 * k2, 6 * k2);  // 书
          g.beginPath(); g.ellipse(...P(5, 49), 3.2 * k2, 2.6 * k2, 0, 0, TAU); g.fillStyle = '#F2DCC4'; g.fill(); g.strokeStyle = INK; g.stroke();
          // 两侧的小塔
          [x + w * .12, x + w * .88].forEach(tx => { g.fillStyle = '#D8C4A0'; g.fillRect(tx - w * .03, y0 + h * .45, w * .06, h * .5); g.fillStyle = RED; g.beginPath(); g.moveTo(tx - w * .04, y0 + h * .45); g.lineTo(tx, y0 + h * .34); g.lineTo(tx + w * .04, y0 + h * .45); g.fill(); });
        }
      }
      // 页边藤蔓的路径（外侧页边往下、再沿下边）
      const ox = o.outerRight ? pw - mr * .5 : mr * .5, vine = [];
      for (let i = 0; i <= 60; i++) { const q = i / 60; vine.push([ox + Math.sin(q * 14) * mr * .16, mt + q * (ph - mt - mb * .5)]); }
      const ex = o.outerRight ? ml : pw - mr; for (let i = 1; i <= 40; i++) { const q = i / 40; vine.push([lerp(ox, ex, q), ph - mb * .5 + Math.sin(q * 10) * mb * .12]); }
      const V = resample(vine, 260), leaves = [];
      for (let i = 6; i < V.length; i += 7) { const sd = (i / 7 | 0) % 2 ? 1 : -1; leaves.push({ i, x: V[i].x + V[i].nx * sd * xh * 1.4, y: V[i].y + V[i].ny * sd * xh * 1.4, a: Math.atan2(V[i].ny * sd, V[i].nx * sd), c: [BLU, RED, GOLD0, '#3A7A3A'][(i / 7 | 0) % 4] }); }
      g.fillStyle = 'rgba(80,50,20,.12)'; g.fillRect(o.outerRight ? 0 : pw - 18, 0, 18, ph);
      return { c, gm, V, leaves, xh, sparks: samplePoints(q => q.drawImage(gm, 0, 0), Math.round(28 * u), seed, pw, ph) };
    }
    const A = page(3, { initial: 0, letter: 'Q', mini: 1, miniTop: true, outerRight: true, c1: RED, c2: BLU });
    const B = page(7, { initial: 1, letter: 'D', mini: 0, miniTop: false, outerRight: true, c1: BLU, c2: RED });
    const L = LAND ? page(11, { initial: -1, mini: 0, miniTop: true, outerRight: false, c1: '#3A6A3A', c2: RED }) : null;
    const C = page(13, { initial: -1, mini: -1, outerRight: false });
    const desk = mk(W, H), dg = desk.getContext('2d'); dg.fillStyle = '#2C1E14'; dg.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { dg.strokeStyle = `rgba(${i % 2 ? 60 : 20},${i % 2 ? 40 : 12},20,.25)`; dg.lineWidth = 2 + hash1(i) * 6; dg.beginPath(); const y = hash1(i + 9) * H; dg.moveTo(0, y); dg.bezierCurveTo(W * .3, y + 20, W * .6, y - 20, W, y + 10); dg.stroke(); }
    return { u, desk, A, B, C, L, pw, ph, spine, top, tmp: [mk(pw, ph), mk(pw, ph)], shine: mk(pw, ph), INK, GOLD1 };
  },
  draw(ctx, t, s) {
    const { u, pw, ph, spine, top } = s;
    // 合成一页：底 + 生长中的藤蔓 + 爬的小兽 + 金色高光
    const compose = (c, P, lt, sweep) => { const g = c.getContext('2d'); g.drawImage(P.c, 0, 0);
      const pv = .35 + .65 * eOutCubic(clamp(lt / 3.4)), n = Math.floor(pv * (P.V.length - 1));
      g.strokeStyle = '#3A5A2A'; g.lineWidth = P.xh * .28; g.lineCap = 'round'; drawPartial(g, P.V.map(q => [q.x, q.y]), pv);
      for (const lf of P.leaves) { if (lf.i > n) break; const gr = clamp((n - lf.i) / 14); g.save(); g.translate(lf.x, lf.y); g.rotate(lf.a); g.scale(gr, gr);
        g.fillStyle = lf.c; g.beginPath(); g.moveTo(-P.xh * .9, 0); g.quadraticCurveTo(0, -P.xh * 1.4, P.xh * 1.2, 0); g.quadraticCurveTo(0, P.xh * 1.4, -P.xh * .9, 0); g.fill(); g.strokeStyle = s.INK; g.lineWidth = .8; g.stroke(); g.restore(); }
      // 蜗牛沿藤爬，小鸟在下边跳
      const sn = P.V[Math.floor(clamp(.18 + lt * .045, 0, .99) * (P.V.length - 1))], k = P.xh;
      g.save(); g.translate(sn.x - sn.nx * k * 1.2, sn.y - sn.ny * k * 1.2); g.rotate(Math.atan2(sn.ny, sn.nx) + Math.PI / 2);
      g.fillStyle = '#C8B08A'; g.beginPath(); g.ellipse(0, k * .6, k * 2.2, k * .5, 0, 0, TAU); g.fill(); g.strokeStyle = s.INK; g.lineWidth = .8; g.stroke();
      g.beginPath(); g.moveTo(k * 1.8, k * .4); g.lineTo(k * 2.6, -k * .8); g.stroke();
      g.fillStyle = '#C46A2A'; g.beginPath(); g.arc(0, -k * .3, k * 1.3, 0, TAU); g.fill(); g.stroke(); g.beginPath(); for (let a = 0; a < 10; a += .3) g.lineTo(Math.cos(a) * a * k * .12, -k * .3 + Math.sin(a) * a * k * .12); g.stroke(); g.restore();
      const bq = clamp(.86 + lt * .025, 0, .99), bi = Math.floor(bq * (P.V.length - 1)), bd = P.V[bi], hop = Math.abs(Math.sin(lt * 7)) * k * 1.2;
      g.save(); g.translate(bd.x, bd.y - k * 1.6 - hop); g.scale(-1, 1); g.fillStyle = '#1F3C8E'; g.beginPath(); g.ellipse(0, 0, k * 1.6, k * 1, -.2, 0, TAU); g.fill(); g.strokeStyle = s.INK; g.lineWidth = .8; g.stroke();
      g.fillStyle = '#B0281C'; g.beginPath(); g.arc(-k * 1.4, -k * .9, k * .7, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#E8B040'; g.beginPath(); g.moveTo(-k * 2, -k * 1); g.lineTo(-k * 2.7, -k * .7); g.lineTo(-k * 2, -k * .6); g.fill();
      g.beginPath(); g.moveTo(k * 1.4, -k * .2); g.lineTo(k * 2.6, -k * .9); g.lineTo(k * 2.4, k * .2); g.fillStyle = '#1F3C8E'; g.fill(); g.restore();
      // 斜向高光：只落在金色上
      if (sweep >= 0 && sweep <= 1) { const sh = s.shine, sg = sh.getContext('2d'), d = (pw + ph), pos = -d * .2 + sweep * d * 1.4;
        sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, pw, ph);
        const gr = sg.createLinearGradient(pos - 90 * u, pos * .4 - 36 * u, pos + 90 * u, pos * .4 + 36 * u); gr.addColorStop(0, 'rgba(255,250,220,0)'); gr.addColorStop(.5, 'rgba(255,250,220,.95)'); gr.addColorStop(1, 'rgba(255,250,220,0)');
        sg.fillStyle = gr; sg.fillRect(0, 0, pw, ph); sg.globalCompositeOperation = 'destination-in'; sg.drawImage(P.gm, 0, 0);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = .75; g.drawImage(sh, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        // 四角星
        for (let i = 0; i < P.sparks.length; i++) { if (hash1(i * 7 + 3) < .82) continue; const [x, y] = P.sparks[i], pr = (x + y * .4) / 1.16, a = Math.exp(-Math.pow((pr - pos) / (40 * u), 2));
          if (a < .05) continue; const r = (10 + hash1(i) * 14) * u * a; g.fillStyle = `rgba(255,252,230,${a})`; g.beginPath();
          for (let j = 0; j < 8; j++) { const ang = j * Math.PI / 4, rr = j % 2 ? r * .18 : r; g.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr); } g.fill(); }
      } };
    ctx.drawImage(s.desk, 0, 0);
    const th = eInOutCubic(inv(2.9, 3.9, t)) * Math.PI, cs = Math.cos(th);
    // 左页（横屏）：先是 L，翻过来的背面压上去
    if (LAND) { ctx.drawImage(s.L.c, spine - pw, top); const g = ctx.createLinearGradient(spine - 60 * u, 0, spine, 0); g.addColorStop(0, 'rgba(60,30,10,0)'); g.addColorStop(1, 'rgba(60,30,10,.35)'); ctx.fillStyle = g; ctx.fillRect(spine - 60 * u, top, 60 * u, ph); }
    compose(s.tmp[1], s.B, t - 3.6, inv(3.9, 4.9, t) * 1.0 + (t < 3.9 ? -1 : 0));
    ctx.drawImage(s.tmp[1], spine, top);
    const g2 = ctx.createLinearGradient(spine, 0, spine + 60 * u, 0); g2.addColorStop(0, 'rgba(60,30,10,.35)'); g2.addColorStop(1, 'rgba(60,30,10,0)'); ctx.fillStyle = g2; ctx.fillRect(spine, top, 60 * u, ph);
    if (th < Math.PI / 2) {
      compose(s.tmp[0], s.A, t, inv(.3, 2.6, t));
      if (th > 0) { ctx.fillStyle = `rgba(0,0,0,${.35 * Math.sin(th)})`; ctx.fillRect(spine, top, pw, ph); }       // 掀起的页投在下一页上的影子
      const lift = Math.sin(th) * 30 * u;
      ctx.drawImage(s.tmp[0], spine, top - lift * .5, pw * cs, ph + lift);
      ctx.fillStyle = `rgba(40,20,0,${.5 * (1 - cs)})`; ctx.fillRect(spine, top - lift * .5, pw * cs, ph + lift);
    } else if (th < Math.PI - .001 || LAND) {
      const wv = pw * -cs, lift = Math.sin(th) * 30 * u;
      ctx.drawImage(s.C.c, spine - wv, top - lift * .5, wv, ph + lift);
      ctx.fillStyle = `rgba(40,20,0,${.4 * (1 + cs) })`; ctx.fillRect(spine - wv, top - lift * .5, wv, ph + lift);
    }
    vignette(ctx, .5, .45, '20,10,0');
  }
});
