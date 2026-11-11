// 第 1 段 钩子：13 秒片头，自成一块。黑场淡入，硬切，关键词大字，逐句字幕。
// 1 黑色包立在清晨的草丛里（生视频，露珠闪）→ 2 提绳上的珠子特写（生视频）→ 3 头图里模特拎着黑色款，从全身推到包（品牌原图）
// → 4 奶白底，背后 1-1 末帧虚化，BEISHAN 字标从左往右显出、「旷野 · 布丁包」逐字落下。
// 3 层：底层镜头，中层露珠高光，上层字标、片名和字幕。时间由旁白 3 句驱动，第 3 句落在字标上。
scene({
  id: 'shop-handbag:1', name: '钩子',
  needs: ['common.js'],
  fonts: ["900 96px 'Noto Serif SC'", "600 96px 'Noto Serif SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  async init() {
    await C.init();
    const v = n => loadVideo(`gen/${n}.mp4`).catch(() => null);
    const V = { a: await v('1-1'), b: await v('1-2') };
    const P = {
      a: await loadImage('gen/1-1.jpg'), b: await loadImage('gen/1-2.jpg').catch(() => null),
      cover: await loadImage('brand/cover-black.jpg'), logo: await loadImage('brand/beishan.png'),
    };
    const q = C.cue, s = i => SEG.vo[i].at;
    const at = { a: 0, b: s(1) - .25, c: s(2) - .25, d: q('系列') - .3 };
    const clip = (k, len, o) => V[k] ? C.clip(V[k], len, o) : null;
    // 1-1 前 2 秒提手和包盖之间有一道缝（生视频的毛病），从 2 秒起用；1-2 的包盖画成了掀在一边，只放大取珠子和露珠那一块
    const lb = at.c - at.b;
    const A = clip('a', at.b, { from: 2 }), B = clip('b', lb, { zoom: lt => 2.6 + .2 * lt / lb, fx: .14, fy: .46 });
    // 片名底下垫 1-1 的末帧，虚化（只算一次）
    const blur = mk(W / 4, H / 4), g = blur.getContext('2d');
    if (V.a) { const el = await V.a.at(V.a.dur - .1); drawCover(g, el, 0, 0, W / 4, H / 4); } else drawCover(g, P.a, 0, 0, W / 4, H / 4);
    return { P, A, B, at, blur };
  },
  async draw(ctx, t, s) {
    const { K, u, F } = C, { P, A, B, at } = s, q = C.cue;
    const still = (c, img, lt, d, o = {}) => drawCover(c, img, 0, 0, W, H, { zoom: 1.04 + .05 * lt / d, ...o });
    const list = [
      { at: at.a, prep: A ? A.prep : null, draw: (c, lt, d) => { A ? A.paint(c, lt) : still(c, P.a, lt, d); sparkle(c, lt, 11); } },
      { at: at.b, prep: B ? B.prep : null, draw: (c, lt, d) => { B ? B.paint(c, lt) : still(c, P.b || P.a, lt, d, { zoom: 1.6 }); sparkle(c, lt, 5); } },
      { at: at.c, draw: (c, lt, d) => drawCover(c, P.cover, 0, 0, W, H, { zoom: 1.05 + .35 * eInOutCubic(lt / d), fx: .45, fy: lerp(.3, .8, eInOutCubic(lt / d)) }) },
      { at: at.d, draw: (c, lt, d) => title(c, lt, d) },
    ];
    const i = await C.shots(ctx, t, list);
    if (i < 3) { C.film(ctx, t); C.shade(ctx, .35, .35); }
    C.aiTag(ctx, i < 2 ? 1 : 0);
    C.word(ctx, t, '像布丁的包', q('布丁'), at.b + .1, { size: 120, y: .3 });
    C.word(ctx, t, '一串圆珠', q('圆珠') - .2, at.c + .1, { size: 120, y: .3 });
    C.word(ctx, t, '北山制包所', q('北山'), at.d + .1, { size: 96, y: .2 });
    C.sub(ctx, t);
    // 黑场淡入
    if (t < .8) { ctx.fillStyle = `rgba(0,0,0,${1 - eOutCubic(t / .8)})`; ctx.fillRect(0, 0, W, H); }

    // 露珠高光：草叶上零星几个亮点一闪一闪（位置固定，亮度随时间起伏）
    function sparkle(c, lt, n) {
      const R = mulberry32(n);
      c.save(); c.globalCompositeOperation = 'screen';
      for (let k = 0; k < n; k++) {
        const x = W * (.08 + R() * .84), y = H * (.6 + R() * .35), ph = R() * TAU, a = Math.max(0, Math.sin(lt * 2.2 + ph)) ** 6;
        if (a < .02) continue;
        const r = (10 + 14 * a) * u, g = c.createRadialGradient(x, y, 0, x, y, r * 2.2);
        g.addColorStop(0, `rgba(255,246,220,${.9 * a})`); g.addColorStop(1, 'rgba(255,246,220,0)');
        c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.2, 0, TAU); c.fill();
        c.strokeStyle = `rgba(255,250,235,${.7 * a})`; c.lineWidth = 2 * u;
        c.beginPath(); c.moveTo(x - r * 2, y); c.lineTo(x + r * 2, y); c.moveTo(x, y - r * 2); c.lineTo(x, y + r * 2); c.stroke();
      }
      c.restore();
    }
    // 片名：虚化底 + 奶白蒙层，字标从左往右显出，「旷野 · 布丁包」逐字落下
    function title(c, lt, d) {
      c.save(); c.imageSmoothingEnabled = true; c.filter = 'blur(6px)'; c.drawImage(s.blur, -20, -20, W + 40, H + 40); c.restore();
      c.fillStyle = 'rgba(244,239,230,.88)'; c.fillRect(0, 0, W, H);
      const lw = W * .62, lh = lw * P.logo.height / P.logo.width, lx = (W - lw) / 2, ly = H * .42 - lh / 2, p = eInOutCubic(inv(.1, 1.1, lt));
      c.save(); c.beginPath(); c.rect(lx - 10, ly - 20, (lw + 20) * p, lh + 40); c.clip();
      c.filter = 'brightness(0.18) sepia(0.4)'; c.drawImage(P.logo, lx, ly, lw, lh); c.restore();
      const chars = [...'旷野 · 布丁包'];
      c.save(); c.font = F(600, 64, C.SERIF); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = K.ink;
      const total = c.measureText(chars.join('')).width; let x = W / 2 - total / 2;
      chars.forEach((ch, k) => {
        const w = c.measureText(ch).width, e = eOutCubic(inv(1 + k * .12, 1.5 + k * .12, lt));
        c.globalAlpha = e; c.fillText(ch, x + w / 2, H * .52 - (1 - e) * 40 * u); x += w;
      });
      c.restore();
    }
  }
});
