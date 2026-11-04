// G-003 电影感产品广告：AI 生成的产品棚拍图和以它为首帧生成的推镜视频，代码加宽银幕黑边、逐字打出的卖点细线标注，最后落版品牌名、口号、价格牌和购买按钮
// 素材：生图 ×1、生视频 ×1；配乐 CC0。品牌「山岚」和卖点都是虚构的
scene({
  id: 'G-003', name: '电影感产品广告', dur: 12, still: 10.6,
  fonts: ["700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 40px 'Noto Serif SC'", "400 40px 'Bebas Neue'", "400 40px 'JetBrains Mono'"],
  text: '山岚把清晨装进杯里不锈钢内胆小时保温单手开合限时立即购买虚构品牌画面生成配乐',
  async init() {
    return { A: await loadAssets(), hero: await loadImage('hero.jpg'), v: await loadVideo('dolly.mp4') };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, GOLD = '#d9b77a';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    // 杯子在素材里的位置（0–1），竖屏按它取景
    const fx = LAND ? .5 : .32;
    const bars = LAND ? H * .12 : H * .1;
    if (t < 5.2) {                      // ① 推镜视频
      await s.v.at(Math.min(t, s.v.dur - .05));
      drawCover(ctx, s.v.el, 0, 0, W, H, { fx, fy: .5, zoom: LAND ? 1.02 : 1.0 });
    } else {                            // ② 主图：再慢慢推近，卖点标注
      const k = inv(5.2, 12, t);
      drawCover(ctx, s.hero, 0, 0, W, H, { fx, fy: .5, zoom: lerp(1.0, 1.08, k) });
    }
    // 切点闪一下暗场
    const cut = 1 - Math.min(1, Math.abs(t - 5.2) / .18);
    if (cut > 0) { ctx.fillStyle = `rgba(0,0,0,${cut})`; ctx.fillRect(0, 0, W, H); }
    // 暗角
    const g = ctx.createRadialGradient(W / 2, H / 2, SHORT * .3, W / 2, H / 2, Math.max(W, H) * .75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 宽银幕黑边：落版时收起
    const open = eInOutCubic(inv(9.2, 10, t));
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bars * (1 - open)); ctx.fillRect(0, H - bars * (1 - open), W, bars * (1 - open));
    // ① 片头一句
    const a1 = smooth(1, 1.6, t) * (1 - smooth(4.4, 5, t));
    if (a1 > 0) {
      ctx.save(); ctx.globalAlpha = a1; ctx.fillStyle = '#f2ede4'; ctx.textAlign = LAND ? 'left' : 'center';
      ctx.font = `900 ${(LAND ? 64 : 72) * u}px 'Noto Serif SC'`;
      const x = LAND ? W * .62 : W / 2, y = LAND ? H * .46 : H * .74;
      typeOut(ctx, '把清晨', x, y, inv(1, 2, t));
      typeOut(ctx, '装进杯里', x, y + 90 * u, inv(1.6, 2.8, t));
      ctx.restore();
    }
    // ② 卖点：从杯子上的点拉出细线，文字逐字打出
    const B = (bx, by) => {             // 主图坐标 → 画面坐标（和 drawCover 同一套换算）
      const k = inv(5.2, 12, t), z = lerp(1.0, 1.08, k), iw = s.hero.width, ih = s.hero.height;
      const sc = Math.max(W / iw, H / ih) * z, ox = (W - iw * sc) * fx, oy = (H - ih * sc) * .5;
      return [ox + bx * iw * sc, oy + by * ih * sc];
    };
    const feats = [[.335, .2, '一键弹开的杯盖', 'ONE-PUSH LID'], [.35, .5, '316 不锈钢内胆', '316 STAINLESS'], [.345, .76, '12 小时保温', '12 H WARM']];
    if (t > 5.4 && t < 9.6) {
      const fade = 1 - smooth(9.1, 9.6, t);
      feats.forEach(([bx, by, zh, en], i) => {
        const t0 = 5.6 + i * .9, p = eOutCubic(inv(t0, t0 + .6, t));
        if (p <= 0) return;
        const [x, y] = B(bx, by), dir = 1;
        const len = (LAND ? 300 : 120) * u, ex = x + dir * len * p, ey = y - 40 * u * p;
        ctx.save(); ctx.globalAlpha = fade; ctx.strokeStyle = GOLD; ctx.fillStyle = GOLD; ctx.lineWidth = 2 * u;
        ctx.beginPath(); ctx.arc(x, y, 6 * u, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 6 * u + 14 * u * ((t * 1.2 + i * .3) % 1), 0, Math.PI * 2); ctx.globalAlpha = fade * (1 - (t * 1.2 + i * .3) % 1); ctx.stroke();
        ctx.globalAlpha = fade; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dir * 40 * u * Math.min(1, p * 3), ey); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.textAlign = dir > 0 ? 'left' : 'right'; ctx.fillStyle = '#f2ede4';
        ctx.font = `700 ${(LAND ? 36 : 38) * u}px 'Noto Sans SC'`; typeOut(ctx, zh, ex + dir * 10 * u - (dir > 0 ? 0 : 0), ey - 14 * u, inv(t0 + .3, t0 + .9, t), dir);
        ctx.font = `400 ${18 * u}px 'JetBrains Mono'`; ctx.fillStyle = GOLD; typeOut(ctx, en, ex + dir * 10 * u, ey + 22 * u, inv(t0 + .5, t0 + 1.1, t), dir);
        ctx.restore();
      });
    }
    // ③ 落版
    if (t > 9.4) {
      const a = smooth(9.4, 10.1, t);
      ctx.fillStyle = `rgba(6,8,7,${(LAND ? .55 : .72) * a})`; ctx.fillRect(0, 0, W, H);
      const cx = LAND ? W * .7 : W / 2, cy = LAND ? H * .4 : H * .2;
      ctx.save(); ctx.textAlign = 'center'; ctx.globalAlpha = a; ctx.fillStyle = '#f2ede4';
      ctx.font = `900 ${(LAND ? 120 : 130) * u}px 'Noto Serif SC'`; ctx.fillText('山岚', cx, cy);
      ctx.font = `400 ${30 * u}px 'Bebas Neue'`; ctx.fillStyle = GOLD; ctx.letterSpacing = `${14 * u}px`; ctx.fillText('SHANLAN', cx + 7 * u, cy + 50 * u);
      ctx.letterSpacing = '0px';
      ctx.font = `400 ${32 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(242,237,228,.85)'; ctx.fillText('把清晨装进杯里', cx, cy + 110 * u);
      ctx.restore();
      // 价格牌：弹出
      const k = eOutBack(inv(10.2, 10.7, t));
      if (k > 0) {
        const py = LAND ? H * .66 : H * .74;
        ctx.save(); ctx.translate(cx, py); ctx.scale(k, k); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `400 ${24 * u}px 'Noto Sans SC'`; ctx.fillStyle = GOLD; ctx.fillText('限时', -150 * u, -6 * u);
        ctx.font = `400 ${110 * u}px 'Bebas Neue'`; ctx.fillStyle = '#fff'; ctx.fillText('¥129', 20 * u, 0);
        ctx.restore();
      }
      const b = eOutBack(inv(10.6, 11.1, t));
      if (b > 0) {
        const by = LAND ? H * .8 : H * .83, pulse = 1 + .04 * Math.sin(t * 9) * smooth(11.1, 11.3, t);
        ctx.save(); ctx.translate(cx, by); ctx.scale(b * pulse, b * pulse);
        rr(ctx, -150 * u, -36 * u, 300 * u, 72 * u, 36 * u); ctx.fillStyle = GOLD; ctx.fill();
        ctx.fillStyle = '#14110c'; ctx.font = `700 ${32 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('立即购买', 0, 2 * u);
        ctx.restore();
      }
    }
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.textAlign = 'right';
    ctx.fillText('虚构品牌 · ' + credits(s.A), W - 28 * u, H - 20 * u); ctx.restore();
  },
});

// 逐字打出：p 是进度 0–1；dir = -1 时右对齐
function typeOut(ctx, text, x, y, p, dir = 1) {
  const n = Math.floor(text.length * clamp(p, 0, 1) + 1e-6);
  if (n > 0) ctx.fillText(text.slice(0, n), x, y);
}
