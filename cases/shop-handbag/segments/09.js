// 第 9 段 买前要知道的：后半的讲解调子，段内溶解 0.4 秒。一句一张须知卡片，上半是对应的产品图：
// 1 「买前须知」卡片翻开 → 2 苏丹棕皮面推近（皮纹、褶皱、小疵点）→ 3 白色款左冷右暖（色差）→ 4 白色款和一件深色衣服（别靠着）→ 5 枫叶红的白珠子推近（小孔、掉漆）。
// 2 层：底层产品图和代码画的图标，上层卡片和字幕。时间由旁白 5 句驱动。
scene({
  id: 'shop-handbag:9', name: '买前要知道的',
  needs: ['common.js'],
  fonts: ["900 96px 'Noto Serif SC'", "600 96px 'Noto Serif SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  async init() {
    await C.init();
    const im = n => loadImage(`brand/${n}.jpg`);
    const P = { brown: await im('10-brown-top'), white: await im('09-white-top'), red: await im('11-red-top') };
    const s = i => SEG.vo[i].at;
    return { P, at: [0, s(1) - .2, s(2) - .2, s(3) - .2, s(4) - .2] };
  },
  async draw(ctx, t, s) {
    const { K, u, F, bg, photo, ring } = C, { P, at } = s;
    const RED = '#B5462F';
    const list = [
      { at: at[0], draw: (c, lt, d) => {               // 1 封面卡片：从扁到圆翻开
        bg(c);
        const e = eOutBack(inv(.1, .9, lt)), w = W * .7, h = H * .36, x = (W - w) / 2, y = H * .3;
        c.save(); c.translate(W / 2, y + h / 2); c.scale(1, Math.max(.02, e)); c.translate(-W / 2, -(y + h / 2));
        c.shadowColor = 'rgba(42,38,34,.18)'; c.shadowBlur = 40 * u; c.shadowOffsetY = 12 * u;
        c.fillStyle = '#FBF8F2'; rr(c, x, y, w, h, 28 * u); c.fill(); c.shadowColor = 'transparent';
        c.strokeStyle = K.grass; c.lineWidth = 3 * u; rr(c, x + 24 * u, y + 24 * u, w - 48 * u, h - 48 * u, 18 * u); c.stroke();
        c.textAlign = 'center'; c.fillStyle = K.ink; c.font = F(900, 120, C.SERIF); c.fillText('买前须知', W / 2, y + h * .5);
        c.font = F(400, 40); c.fillStyle = K.river; c.fillText('北山的 4 条提醒', W / 2, y + h * .5 + 90 * u);
        c.restore();
      } },
      { at: at[1], mix: .4, draw: (c, lt, d) => {      // 2 苏丹棕皮面
        const p = photo(c, P.brown, lt, d, { w: 2.2, push: .1, fx: .55, fy: .6, y: .32 });
        ring(c, ...p(.55, .6), 150 * u, lt - .6);
        card(c, lt, 1, '皮纹、褶皱、小疵点', '是头层皮的正常现象');
      } },
      { at: at[2], mix: .4, draw: (c, lt, d) => {      // 3 同一只白色包，左冷右暖
        C.bg(c);
        const w = W * .9, h = w * P.white.height / P.white.width, x = (W - w) / 2, y = H * .12;
        const split = lerp(1, .5, eInOutCubic(inv(.2, 1.2, lt)));
        c.drawImage(P.white, x, y, w, h);
        tint(c, x, y, w * split, h, 'rgba(110,150,210,.55)');
        tint(c, x + w * split, y, w * (1 - split), h, 'rgba(235,170,90,.55)');
        c.fillStyle = 'rgba(42,38,34,.4)'; c.fillRect(x + w * split - 1.5 * u, y, 3 * u, h);
        c.save(); c.globalAlpha = smooth(1, 1.5, lt); c.font = F(700, 40); c.fillStyle = K.ink; c.textAlign = 'center';
        c.fillText('冷光', x + w * .25, y - 24 * u); c.fillText('暖光', x + w * .75, y - 24 * u); c.restore();
        card(c, lt, 2, '屏幕和光线不同', '颜色会有色差');
      } },
      { at: at[3], mix: .4, draw: (c, lt, d) => {      // 4 白色包和深色衣服之间打个叉
        C.bg(c);
        const w = W * .62, h = w * P.white.height / P.white.width, x = -W * .02, y = H * .16;
        c.drawImage(P.white, x, y, w, h);
        shirt(c, W * .74, y + h * .55, 1, smooth(.2, .7, lt));
        const p = smooth(.8, 1.4, lt), mx = W * .54, my = y + h * .55;
        c.save(); c.globalAlpha = p; c.strokeStyle = RED; c.lineWidth = 8 * u; c.lineCap = 'round';
        const r = 34 * u * eOutBack(inv(.8, 1.3, lt));
        c.beginPath(); c.moveTo(mx - r, my - r); c.lineTo(mx + r, my + r); c.moveTo(mx + r, my - r); c.lineTo(mx - r, my + r); c.stroke();
        c.font = F(700, 36); c.fillStyle = RED; c.textAlign = 'center'; c.fillText('串色', mx, my + 90 * u); c.restore();
        card(c, lt, 3, '浅色包别靠着深色衣服', '避免串色');
      } },
      { at: at[4], mix: .4, draw: (c, lt, d) => {      // 5 白珠子推近
        const p = photo(c, P.red, lt, d, { w: 2.4, push: .12, fx: .2, fy: .4, y: .32 });
        ring(c, ...p(.17, .42), 140 * u, lt - .6);
        card(c, lt, 4, '亚克力珠子不是天然材质', '细看会有小孔、掉漆');
      } },
    ];
    await C.shots(ctx, t, list);
    C.sub(ctx, t);

    // 须知卡片：画面中下方，编号圆 + 一行粗体 + 一行细体，切进来时从下滑上
    function card(c, lt, n, head, note) {
      const e = eOutCubic(inv(.15, .7, lt)), w = W * .84, h = 230 * u, x = (W - w) / 2, y = H * .62 + (1 - e) * 40 * u;
      c.save(); c.globalAlpha = e;
      c.shadowColor = 'rgba(42,38,34,.18)'; c.shadowBlur = 30 * u; c.shadowOffsetY = 8 * u;
      c.fillStyle = '#FBF8F2'; rr(c, x, y, w, h, 24 * u); c.fill(); c.shadowColor = 'transparent';
      c.fillStyle = K.grass; c.beginPath(); c.arc(x + 90 * u, y + h / 2, 48 * u, 0, TAU); c.fill();
      c.fillStyle = K.cream; c.font = F(900, 56, C.SERIF); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, x + 90 * u, y + h / 2 + 2 * u);
      c.textAlign = 'left'; c.fillStyle = K.ink; c.font = F(700, 48); c.fillText(head, x + 170 * u, y + h * .36);
      c.font = F(400, 38); c.fillStyle = K.river; c.fillText(note, x + 170 * u, y + h * .68);
      c.restore();
    }
    // 给一块区域上色（模拟冷光、暖光）：只染包和底，不改形状
    function tint(c, x, y, w, h, col) {
      if (w <= 0) return;
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.globalCompositeOperation = 'multiply'; c.fillStyle = col; c.fillRect(x, y, w, h); c.restore();
    }
    // 一件深色衬衫的图标
    function shirt(c, cx, cy, k, a) {
      const s = 1.6 * u * k;
      c.save(); c.globalAlpha = a; c.translate(cx, cy); c.scale(s, s);
      c.fillStyle = '#2E3440'; c.beginPath();
      c.moveTo(-40, -100); c.lineTo(-90, -80); c.lineTo(-130, -20); c.lineTo(-95, 5); c.lineTo(-75, -25); c.lineTo(-75, 110);
      c.lineTo(75, 110); c.lineTo(75, -25); c.lineTo(95, 5); c.lineTo(130, -20); c.lineTo(90, -80); c.lineTo(40, -100);
      c.quadraticCurveTo(0, -60, -40, -100); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.25)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(0, -40 + k * 40, 5, 0, TAU); c.fill(); }
      c.restore();
    }
  }
});
