// 第 6 段 皮料和配件：后半的讲解调子。逐句字幕，段内溶解 0.4 秒，每句一个镜头：
// 1 黑色款标出四个点 → 2 代码画牛皮剖面、头层抬起来 → 3 生成的白色皮面微距 + 浅色、苏丹棕并排圈皮纹 → 4 白色款横躺推进内里 → 5 枫叶红的珠子和五金。
// 3 层：底层照片 / 生成视频 / 代码画，中层标注（圆点、引线、圈），上层字幕。时间由旁白 5 句驱动。
// 照片上标注的位置是照片里的比例坐标（0–1），按 assets/brand/ 里裁好的图量的。
scene({
  id: 'shop-handbag:6', name: '皮料和配件',
  needs: ['common.js'],
  fonts: ["900 96px 'Noto Serif SC'", "600 96px 'Noto Serif SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  async init() {
    await C.init();
    const im = n => loadImage(`brand/${n}.jpg`);
    const P = { black: await im('08-black-top'), white: await im('09-white-top'), lying: await im('09-white-lying'), brown: await im('10-brown-top'), red: await im('11-red-top') };
    const V = await loadVideo('gen/6-3.mp4').catch(() => null);      // 还没生成时用首帧图慢推代替
    const still = await loadImage('gen/6-3.jpg');
    const s = i => SEG.vo[i].at;
    const at = { a: 0, b: s(1) - .2, c: s(2) - .2, d: C.cue('颜色越浅') - .2, e: s(3) - .2, f: s(4) - .2 };
    const vid = V ? C.clip(V, at.d - at.c) : null;
    return { P, vid, still, at };
  },
  async draw(ctx, t, s) {
    const { K, u, F } = C, { P, at } = s;
    const { bg, photo, dot, ring, label } = C;
    const list = [
      { at: at.a, draw: (c, lt, d) => {               // 1 黑色款：外皮、内里、珠子、五金四个点依次亮
        const p = photo(c, P.black, lt, d, { w: 1.25, fx: .5 });
        const pts = [['外皮', .62, .62], ['内里', .55, .2], ['珠子', .2, .32], ['五金', .37, .27]];
        pts.forEach(([name, x, y], k) => dot(c, ...p(x, y), name, lt - .25 - k * .3, k === 2 || k === 3 ? 'left' : 'right'));
      } },
      { at: at.b, mix: .4, draw: (c, lt, d) => hide(c, lt, d) },   // 2 牛皮剖面
      { at: at.c, mix: .4, prep: s.vid ? s.vid.prep : null, draw: (c, lt, d) => {   // 3 生成的白色皮面微距
        if (s.vid) s.vid.paint(c, lt);
        else { drawCover(c, s.still, 0, 0, W, H, { zoom: 1.05 + .06 * lt / d }); sweep(c, lt / d); }
        C.film(c, t, { warm: .12, vig: .3, grain: .08 });
        C.aiTag(c);
        tags(c, lt, ['生长纹', '斑点', '烙印']);
      } },
      { at: at.d, mix: .4, draw: (c, lt, d) => {      // 3 续：白色、苏丹棕并排，圈出皮面
        bg(c);
        const half = (img, x0, cx, cy, label, k) => {        // 每边一块方形，放大到包身，只看皮面
          const w = W * .46, x = x0 + W * .02, y = H * .14, h = H * .44;
          c.save(); c.beginPath(); rr(c, x, y, w, h, 16 * u); c.clip();
          drawCover(c, img, x, y, w, h, { zoom: 1.7 + .05 * lt / d, fx: cx, fy: cy }); c.restore();
          ring(c, x + w * .5, y + h * .5, 120 * u, lt - .4 - k * .3);
          c.save(); c.fillStyle = K.ink; c.font = F(700, 44); c.textAlign = 'center'; c.globalAlpha = smooth(.2, .6, lt);
          c.fillText(label, x + w / 2, y + h + 70 * u); c.restore();
        };
        half(P.white, 0, .62, .62, '白色', 0);
        half(P.brown, W * .5, .56, .66, '苏丹棕', 1);
        C.word(c, lt, '颜色越浅，越遮不住', .6, d + 1, { size: 64, y: .71, color: K.ink, weight: 900 });
      } },
      { at: at.e, mix: .4, draw: (c, lt, d) => {      // 4 内里：白色款横躺，推向包口
        const p = photo(c, P.lying, lt, d, { w: 1.5 + .5 * eInOutCubic(lt / d), push: 0, fx: .56, fy: .45 });
        ring(c, ...p(.48, .46), 150 * u, lt - .3);
        label(c, lt - .6, '超纤', '超细纤维合成革 · 人造仿真皮革', H * .66);
      } },
      { at: at.f, mix: .4, draw: (c, lt, d) => {      // 5 枫叶红：珠子、五金
        const p = photo(c, P.red, lt, d, { w: 1.35, fx: .42 });
        dot(c, ...p(.17, .42), '珠子：亚克力（有机玻璃）', lt - .2, 'right', 'below');
        dot(c, ...p(.385, .3), '五金：锌合金', lt - (C.cue('五金') - at.f) + .1, 'right');
      } },
    ];
    await C.shots(ctx, t, list);
    C.sub(ctx, t);

    // ---- 小部件 ----
    // 生成画面上方的三个词：生长纹、斑点、烙印，按旁白念到的时刻出
    function tags(c, lt, words) {
      words.forEach((w, k) => {
        const when = C.cue(w) - at.c;
        C.word(c, lt, w, when, 99, { size: 72, y: .14 + k * .07, color: K.cream });
      });
    }
    // 没有生成视频时的替身：一道柔光从左往右扫过
    function sweep(c, p) {
      const x = lerp(-.4, 1.4, p) * W, g = c.createLinearGradient(x - 300 * u, 0, x + 300 * u, 0);
      g.addColorStop(0, 'rgba(255,248,235,0)'); g.addColorStop(.5, 'rgba(255,248,235,.28)'); g.addColorStop(1, 'rgba(255,248,235,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    // 2 牛皮剖面（等距图解）：一块牛皮分成三层，最上面的头层抬起来，表面画出毛孔和纹路
    function hide(c, lt, d) {
      bg(c);
      const cx = W * .3, cy = H * .42, a = 220 * u, b = 130 * u;           // 等距：x 轴向右下、y 轴向左下
      const iso = (x, y, z) => [cx + (x - y) * a, cy + (x + y) * b * .5 - z];
      const layers = [
        { z0: 0, z1: 70 * u, col: '#B9A58A', name: '下面几层（二层皮等）' },
        { z0: 70 * u, z1: 120 * u, col: '#A88D6B', name: '' },
        { z0: 120 * u, z1: 160 * u, col: '#8C6B4B', name: '头层：最外面那一层', top: true },
      ];
      const lift = 150 * u * eInOutCubic(inv(1.2, 2.6, lt));
      for (const L of layers) {
        const up = L.top ? lift : 0, z0 = L.z0 + up, z1 = L.z1 + up;
        const P1 = iso(-.5, -.5, z1), P2 = iso(.5, -.5, z1), P3 = iso(.5, .5, z1), P4 = iso(-.5, .5, z1);
        const Q2 = iso(.5, -.5, z0), Q3 = iso(.5, .5, z0), Q4 = iso(-.5, .5, z0);
        c.fillStyle = shadeHex(L.col, -.18); poly(c, [P4, P3, Q3, Q4]);       // 左前面
        c.fillStyle = shadeHex(L.col, -.32); poly(c, [P3, P2, Q2, Q3]);       // 右前面
        c.fillStyle = L.col; poly(c, [P1, P2, P3, P4]);                       // 顶面
        if (L.top) {                                                          // 头层顶面：毛孔和生长纹
          const R = mulberry32(7);
          c.fillStyle = 'rgba(40,28,18,.55)';
          for (let k = 0; k < 140; k++) { const [x, y] = iso(R() - .5, R() - .5, z1); c.beginPath(); c.arc(x, y, (1.5 + R() * 2.5) * u, 0, TAU); c.fill(); }
          c.strokeStyle = 'rgba(40,28,18,.35)'; c.lineWidth = 2 * u;
          for (let k = 0; k < 6; k++) { c.beginPath(); for (let j = 0; j <= 20; j++) { const x = j / 20 - .5, y = -.4 + k * .15 + .03 * Math.sin(j * .9 + k); const [px, py] = iso(x, y, z1); j ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
        }
        if (L.name) {
          // 引线从右前面中间拉到方块右边外侧，字写在方块外面，不压住方块
          const [lx, ly] = iso(.5, 0, (z0 + z1) / 2), tx = iso(.5, -.5, 0)[0] + 50 * u, p = L.top ? smooth(1.6, 2.2, lt) : smooth(2.4, 3, lt);
          c.save(); c.globalAlpha = p; c.strokeStyle = K.ink; c.lineWidth = 2 * u;
          c.beginPath(); c.moveTo(lx, ly); c.lineTo(tx - 14 * u, ly); c.stroke();
          c.fillStyle = K.ink; c.beginPath(); c.arc(lx, ly, 5 * u, 0, TAU); c.fill();
          c.font = F(L.top ? 700 : 400, L.top ? 40 : 32); c.textBaseline = 'middle'; c.fillText(L.name, tx, ly);
          c.restore();
        }
      }
      C.word(c, lt, '保留天然的表皮', 3.2, d + 1, { size: 72, y: .7, color: K.ink, weight: 900 });
    }
    function poly(c, pts) { c.beginPath(); pts.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); }
    function shadeHex(h, k) { const [r, g, b] = hex2rgb(h); const f = v => Math.round(clamp(v * (1 + k), 0, 255)); return `rgb(${f(r)},${f(g)},${f(b)})`; }
  }
});
