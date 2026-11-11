// 第 3 段 露珠和瓜果变成包：前半的调子，硬切、关键词大字、逐句字幕。6 个镜头：
// 1 第 2 段的露珠（2-6 首帧）定格，代码沿露珠描一圈 → 2 代码画：露珠缩小、变成木色圆珠，一颗颗串上提绳 → 3 黑色款细节图推近珠串，线稿叠在上面再淡出
// → 4 代码画：甜瓜的轮廓变成上窄下宽的布丁形包身 → 5 圆盖、提绳、珠串落下，合成一只包 → 6 黑、白、枫叶红、鳄纹棕四宫格，念到哪款圈哪款的珠子。
// 3 层：底层照片 / 生成画面 / 奶白底，中层代码画的线稿和形变，上层大字和字幕。时间由旁白 4 句驱动。
scene({
  id: 'shop-handbag:3', name: '露珠和瓜果变成包',
  needs: ['common.js'],
  fonts: ["900 96px 'Noto Serif SC'", "600 96px 'Noto Serif SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  async init() {
    await C.init();
    const im = n => loadImage(n);
    const P = {
      dew: await im('gen/2-6.jpg'), black: await im('brand/08-black-top.jpg'),
      grid: await Promise.all(['01-black', '02-white', '04-maple-red', '07-croc-brown'].map(n => im(`brand/color/${n}.jpg`))),
    };
    const q = C.cue, s = i => SEG.vo[i].at;
    const at = { a: 0, b: s(1) - .2, c: q('圆珠') - .6, d: s(2) - .2, e: q('布丁') - .3, f: s(3) - .2 };
    return { P, at };
  },
  async draw(ctx, t, s) {
    const { K, u, F, bg, ring } = C, { P, at } = s, q = C.cue;
    const BEAD = '#7A4A2A', INK = K.ink;
    // 包的正面线稿（画面坐标）：上窄下宽的梯形包身、圆盖、提绳、两边各 3 颗珠子
    const bag = { cx: W / 2, top: H * .5, bot: H * .76, wt: 330 * u, wb: 440 * u };
    const bead = (x, y, r, p = 1, col = BEAD) => {               // 一颗实心圆珠，带高光
      c0.save(); c0.globalAlpha *= p;
      const g = c0.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
      g.addColorStop(0, '#C9925E'); g.addColorStop(1, col);
      c0.fillStyle = g; c0.beginPath(); c0.arc(x, y, r, 0, TAU); c0.fill();
      c0.strokeStyle = INK; c0.lineWidth = 2.5 * u; c0.stroke(); c0.restore();
    };
    let c0 = ctx;
    // 提绳的弧线和两边珠子的位置：p 0→1 珠子依次落位
    const handle = (c, p, o = {}) => {
      const y0 = o.y ?? bag.top, top = y0 - 430 * u, xl = bag.cx - 92 * u, xr = bag.cx + 92 * u;
      c.save(); c.strokeStyle = INK; c.lineWidth = 9 * u; c.lineCap = 'round';
      c.beginPath(); c.moveTo(xl, y0); c.lineTo(xl, top + 90 * u); c.bezierCurveTo(xl, top - 20 * u, xr, top - 20 * u, xr, top + 90 * u); c.lineTo(xr, y0);
      if (o.line !== false) c.stroke(); c.restore();
      const pos = []; for (let k = 0; k < 3; k++) { pos.push([xl, y0 - 62 * u - k * 94 * u]); pos.push([xr, y0 - 62 * u - k * 94 * u]); }
      pos.forEach(([x, y], k) => {
        const e = eOutCubic(clamp(p * 6 - k));
        if (e > 0) bead(x, y - (1 - e) * 300 * u, 45 * u, e);
      });
    };
    const body = (c, pts, a = 1) => {
      c.save(); c.globalAlpha *= a; c.beginPath(); pts.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
      c.fillStyle = 'rgba(42,38,34,.08)'; c.fill(); c.strokeStyle = INK; c.lineWidth = 6 * u; c.lineJoin = 'round'; c.stroke(); c.restore();
    };
    // 包身轮廓：沿周长取 n 个点（和瓜果轮廓一一对应，好做形变）
    const N = 120;
    const bodyPts = () => {
      const { cx, top, bot, wt, wb } = bag;
      const corners = [[cx - wt / 2, top], [cx + wt / 2, top], [cx + wb / 2, bot], [cx - wb / 2, bot]];
      return resample([...corners, corners[0]], N).slice(0, N).map(p => [p.x, p.y]);
    };
    const melonPts = (cx, cy, rx, ry) => {                        // 甜瓜：椭圆，起点对齐包身左上角的方向
      const out = []; for (let k = 0; k < N; k++) { const a = -Math.PI * .75 + TAU * k / N; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
      return out;
    };

    const list = [
      { at: at.a, draw: (c, lt, d) => {                // 1 露珠定格，描一圈
        const z = 1.08 + .05 * lt / d, fx = .35, fy = .5;
        drawCover(c, P.dew, 0, 0, W, H, { zoom: z, fx, fy });
        const k = Math.max(W / P.dew.width, H / P.dew.height) * z, dw = P.dew.width * k, dh = P.dew.height * k;
        const x = (W - dw) * fx + .405 * dw, y = (H - dh) * fy + .576 * dh;
        C.film(c, t); C.aiTag(c);
        c.save(); c.strokeStyle = K.cream; c.lineWidth = 4 * u; c.setLineDash([10 * u, 10 * u]);
        c.beginPath(); c.arc(x, y, 95 * u, -Math.PI / 2, -Math.PI / 2 + TAU * eInOutCubic(inv(.6, 1.8, lt))); c.stroke(); c.restore();
      } },
      { at: at.b, draw: (c, lt, d) => {                // 2 露珠缩小、变成木色圆珠，串上提绳
        bg(c); c0 = c;
        const p1 = eInOutCubic(inv(.2, 1.8, lt));        // 露珠 → 珠子
        const x = W / 2, y = lerp(H * .42, bag.top - 250 * u, p1), r = lerp(170 * u, 45 * u, p1);
        if (lt < 2.6) {
          c.save(); c.globalAlpha = 1 - p1;              // 透明的水珠
          const g = c.createRadialGradient(x - r * .3, y - r * .4, r * .05, x, y, r);
          g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.35, 'rgba(157,183,201,.35)'); g.addColorStop(1, 'rgba(126,139,116,.55)');
          c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(42,38,34,.5)'; c.lineWidth = 3 * u; c.stroke(); c.restore();
          bead(x, y, r, p1);
        }
        const p2 = inv(2.4, d - .6, lt);                 // 提绳画出来，珠子一颗颗落上去
        c.save(); c.globalAlpha = smooth(2, 2.6, lt); handle(c, p2); c.restore();
        C.word(c, lt, '露珠 → 圆珠', .4, d + 1, { size: 96, y: .2, color: INK, weight: 900 });
      } },
      { at: at.c, draw: (c, lt, d) => {                // 3 黑色款细节图推近珠串，线稿淡出
        const p = C.photo(c, P.black, lt, d, { w: 2.1, push: .12, fx: .22, fy: .3, y: .42 });
        ring(c, ...p(.22, .33), 200 * u, lt - .5);
        c.save(); c.globalAlpha = 1 - smooth(.1, 1.2, lt); c0 = c; handle(c, 1, { y: H * .62 }); c.restore();
      } },
      { at: at.d, draw: (c, lt, d) => {                // 4 甜瓜轮廓 → 布丁形包身
        bg(c);
        const m = melonPts(bag.cx, (bag.top + bag.bot) / 2, 300 * u, 250 * u), b = bodyPts();
        const p = eInOutCubic(inv(1.2, 3, lt));
        body(c, m.map(([x, y], k) => [lerp(x, b[k][0], p), lerp(y, b[k][1], p)]));
        if (p < 1) {                                     // 瓜的纹路，变形时淡掉
          c.save(); c.globalAlpha = 1 - p; c.strokeStyle = K.river; c.lineWidth = 4 * u;
          for (let k = -2; k <= 2; k++) { c.beginPath(); c.ellipse(bag.cx, (bag.top + bag.bot) / 2, Math.abs(k) * 90 * u + 25 * u, 250 * u, 0, 0, TAU); c.stroke(); }
          c.restore();
        }
        C.word(c, lt, '瓜果', .3, q('上窄') - at.d - .2, { size: 120, y: .24, color: INK, weight: 900 });
        C.word(c, lt, '上窄下宽', q('上窄') - at.d, d + 1, { size: 110, y: .24, color: INK, weight: 900 });
      } },
      { at: at.e, draw: (c, lt, d) => {                // 5 圆盖、提绳、珠串落下，合成一只包
        bg(c); c0 = c;
        body(c, bodyPts());
        const pl = eOutBack(inv(.1, .8, lt));            // 圆盖落下
        const ly = lerp(bag.top - 500 * u, bag.top, pl);
        c.save(); c.fillStyle = '#CDBBA0'; c.strokeStyle = INK; c.lineWidth = 6 * u;
        c.beginPath(); c.ellipse(bag.cx, ly, bag.wt / 2 + 14 * u, 26 * u, 0, 0, TAU); c.fill(); c.stroke(); c.restore();
        c.save(); c.globalAlpha = smooth(.8, 1.2, lt); handle(c, inv(.9, 2.4, lt)); c.restore();
        C.word(c, lt, '像一块布丁', .1, d + 1, { size: 110, y: .17, color: INK, weight: 900 });
      } },
      { at: at.f, draw: (c, lt, d) => {                // 6 四宫格：念到哪款圈哪款的珠子
        bg(c);
        const names = [['黑色', '木色珠'], ['白色', '木色珠'], ['枫叶红', '白珠'], ['鳄纹棕', '黑珠']];
        const when = [q('黑色'), q('黑色') + .6, q('枫叶红'), q('鳄纹棕')].map(v => v - at.f);
        const gw = W * .44, gh = gw * 660 / 800, gx = [W * .04, W * .52], gy = [H * .2, H * .2 + gh + 150 * u];
        P.grid.forEach((img, k) => {
          const x = gx[k % 2], y = gy[k >> 1], e = eOutCubic(inv(k * .12, k * .12 + .5, lt));
          c.save(); c.globalAlpha = e;
          c.fillStyle = '#fff'; rr(c, x, y, gw, gh, 14 * u); c.fill(); c.clip();
          c.drawImage(img, x, y, gw, gh); c.restore();
          const on = lt > when[k];
          ring(c, x + gw * .5, y + gh * .27, 95 * u, lt - when[k]);
          c.save(); c.globalAlpha = e; c.textAlign = 'center'; c.fillStyle = INK;
          c.font = F(700, 42); c.fillText(names[k][0], x + gw / 2, y + gh + 56 * u);
          c.globalAlpha = e * (on ? 1 : .35); c.font = F(400, 34); c.fillStyle = on ? '#B5462F' : INK;
          c.fillText('配' + names[k][1], x + gw / 2, y + gh + 100 * u); c.restore();
        });
      } },
    ];
    await C.shots(ctx, t, list);
    C.sub(ctx, t);
  }
});
