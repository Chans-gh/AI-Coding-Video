// C-101 海报色块动态字：Canvas 2D 每拍从一条画边甩进一整块高饱和纯色（0.18 秒指数缓动急停），新色块盖住旧色场；同一拍一个超大的粗体词从反方向撞进来，只露出一半，落地时整幅画面抖一下。
// 风格提示词：用海报色块动态字风格：巨大的、被裁掉一半的单词，大面积纯色块跟着拍子砸进画面，字体超粗、颜色高饱和，文字从画面边缘撞入，每次卡点换一块色场。
// 题材：平面设计与动态排版 · 适合：音乐节与活动预告、品牌宣言、消费类应用
scene({
  id: 'C-101', name: '海报色块动态字', dur: 3.75, still: 2.6,
  fonts: ["900 80px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  text: '夏日音乐节现在出发LIVE0808NIGHTSTAGE',
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    const COL = ['#FFE500', '#FF2E88', '#1F3CFF', '#FF5A1F', '#00D27A', '#111111', '#FFE500', '#FF2E88', '#1F3CFF', '#FF5A1F'];
    const INKC = ['#1F3CFF', '#FFE500', '#FF5A1F', '#111111', '#FF2E88', '#FFE500', '#FF2E88', '#111111', '#00D27A', '#FFE500'];
    const WORDS = [['夏日', 'zh'], ['LIVE', 'en'], ['音乐节', 'zh'], ['08.08', 'en'], ['NIGHT', 'en'], ['现在', 'zh'], ['STAGE', 'en'], ['出发', 'zh'], ['夏日音乐节', 'zh'], ['GO!', 'en']];
    const DIR = [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, 0], [1, 0], [0, -1], [-1, 0], [0, 1], [1, 0]];
    const b = Math.min(9, Math.floor(t / BEAT)), lt = t - b * BEAT;
    const hit = eOutExpo(clamp(lt / .18));
    // 落地抖动
    const sh = (1 - clamp(lt / .15)) * 14 * u * (lt > .12 ? 1 : 0);
    ctx.save(); ctx.translate(Math.sin(lt * 90) * sh, Math.cos(lt * 70) * sh);
    // 旧色场 + 甩进来的新色块
    ctx.fillStyle = b ? COL[b - 1] : '#111'; ctx.fillRect(-40, -40, W + 80, H + 80);
    const [dx, dy] = DIR[b];
    ctx.fillStyle = COL[b];
    // 色块不总是盖满：偶数拍盖满，奇数拍只盖住一大半，留一条旧色
    const part = b % 2 ? .72 : 1.02;
    const bw = dx ? W * part : W + 80, bh = dy ? H * part : H + 80;
    const bx0 = dx > 0 ? -bw : dx < 0 ? W : -40, by0 = dy > 0 ? -bh : dy < 0 ? H : -40;
    const bx1 = dx > 0 ? 0 : dx < 0 ? W - bw : -40, by1 = dy > 0 ? 0 : dy < 0 ? H - bh : -40;
    ctx.fillRect(lerp(bx0, bx1, hit), lerp(by0, by1, hit), bw, bh);
    // 巨字：从反方向撞入，只露一半
    const [w, kind] = WORDS[b], vert = !LAND && kind === 'en' && w.length > 2;
    const size = kind === 'zh' ? (LAND ? 760 : 620) * u * (w.length > 3 ? .62 : 1) : (LAND ? 1250 : 900) * u * (w.length > 4 ? .7 : 1) * (vert ? 1.45 : 1);
    ctx.font = kind === 'zh' ? `900 ${size}px 'Noto Sans SC'` : `${size}px 'Bebas Neue'`;
    const tw = ctx.measureText(w).width;
    // 落点：横屏让字的一半出画，竖屏把字转 90° 竖着出画
    const fx = LAND ? W * (b % 2 ? .62 : .38) : W * (vert ? (b % 2 ? .62 : .4) : .5), fy = LAND ? H * (b % 3 === 0 ? .78 : b % 3 === 1 ? .32 : .62) : H * (b % 2 ? .35 : .66);
    const wx = fx - dx * W * 1.2 * (1 - hit), wy = fy - dy * H * 1.2 * (1 - hit);
    ctx.save(); ctx.translate(wx, wy);
    if (vert) ctx.rotate(b % 2 ? -Math.PI / 2 : Math.PI / 2);
    const sq = 1 + (1 - clamp(lt / .2)) * .25 * (lt > .1 ? 1 : 0);
    ctx.scale(dx ? sq : 1 / sq, dy ? sq : 1 / sq);
    ctx.fillStyle = INKC[b]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(w, kind === 'en' && LAND ? tw * (b % 2 ? .22 : -.22) : 0, 0);
    ctx.restore();
    // 小字：角落的日期和场地，每拍反色
    const small = Math.round(42 * u);
    ctx.font = `${small}px 'Bebas Neue'`; ctx.fillStyle = INKC[b]; ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left'; ctx.fillText('SUMMER SOUND 2026', 50 * u, 80 * u);
    ctx.textAlign = 'right'; ctx.fillText(`${String(b + 1).padStart(2, '0')} / 10`, W - 50 * u, 80 * u);
    ctx.fillText('08.08 — 08.10  RIVERSIDE', W - 50 * u, H - 50 * u);
    ctx.restore();
  }
});
