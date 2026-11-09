// G-019 十二月插画回顾：生成一张 4 × 3 的拼图插画，代码按格子切开（格子位置事先从图里量出），一月一页翻过去；每页套同一个数字卡模板读一行月度数据，杯数滚动到位，角落累计全年；翻到八月正好卡在旁白说「八月」；最后十二格缩回原位拼成总览墙，最忙的月份描边
// 素材：生图 1 张、语音合成旁白；配乐 CC0。月度数据是虚构的，写在下面的 ROWS 里（换一张表就是另一家店的回顾）
const ROWS = [   // 月份, 杯数, 人气饮品（虚构）
  ['一月', 2700, '热可可'], ['二月', 2480, '桂花拿铁'], ['三月', 3120, '樱花拿铁'], ['四月', 3050, '美式'],
  ['五月', 3480, '冷萃'], ['六月', 3360, '冰美式'], ['七月', 4720, '冰美式'], ['八月', 5240, '冰美式'],
  ['九月', 3880, '拿铁'], ['十月', 3420, '南瓜拿铁'], ['十一月', 2800, '热拿铁'], ['十二月', 2870, '热可可'],
];
// 每格在 months.jpg（1200 × 896）里的位置：列、行的像素范围
const COLS = [[34, 303], [322, 591], [610, 879], [898, 1167]], LINES = [[29, 297], [313, 584], [600, 867]];
scene({
  id: 'G-019', name: '十二月插画回顾', dur: 13.5, still: 6.3,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'"],
  text: '街角咖啡的二〇二六年度回顾十二个月一共卖出四万一千杯最忙是八月冰咖啡了五千多谢你明年见一二三四五六七八九十热可可桂花拿铁樱花美式冷萃南瓜人气饮品全年累计插画生成旁白合成配乐',
  async init() {
    const A = await loadAssets(), img = await loadImage('months.jpg');
    const aug = cueTime(A, '八月', 5.8), STEP = (aug - 1.2) / 7;
    return { A, img, STEP, total: ROWS.reduce((a, r) => a + r[1], 0) };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, INK = '#3b2a1e', SUB = '#9a8470', ACC = '#c8553d', BG = '#f7f1e6';
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    const tile = i => { const c = COLS[i % 4], l = LINES[Math.floor(i / 4)]; return [c[0], l[0], c[1] - c[0], l[1] - l[0]]; };
    const fmt = n => Math.round(n).toLocaleString('en-US');
    const T0 = 1.2, ST = s.STEP, END = T0 + 12 * ST, WALL = END + .2;
    // 片头
    const hp = eOutCubic(inv(0, .6, t)) * (1 - inv(T0 - .2, T0 + .1, t));
    if (hp > 0) {
      ctx.globalAlpha = hp; ctx.textAlign = 'center'; ctx.fillStyle = INK;
      ctx.font = `400 ${(LAND ? 40 : 44) * u}px 'Bebas Neue'`; ctx.fillStyle = ACC; ctx.fillText('2026 · YEAR IN REVIEW', W / 2, H / 2 - 70 * u);
      ctx.font = `900 ${(LAND ? 96 : 104) * u}px 'Noto Sans SC'`; ctx.fillStyle = INK; ctx.fillText('街角咖啡的一年', W / 2, H / 2 + 30 * u);
      ctx.globalAlpha = 1;
    }
    // 翻月：每页 = 插画格 + 数字卡（同一个模板，读 ROWS 的一行）
    if (t >= T0 && t < WALL + .6) {
      const i = Math.min(11, Math.floor((t - T0) / ST)), lt = (t - T0 - i * ST) / ST;
      const [mo, cups, drink] = ROWS[i];
      // 版面
      const pw = LAND ? H * .74 : W * .84, phh = pw * .97;
      const px = LAND ? W * .1 : (W - pw) / 2, py = LAND ? (H - phh) / 2 : H * .1;
      const flip = t < WALL ? Math.min(1, lt / .22) : 1;       // 翻页：前 22% 的时间从扁到满
      const fade = 1 - inv(WALL, WALL + .5, t);
      ctx.save(); ctx.globalAlpha = fade;
      ctx.translate(px + pw / 2, py + phh / 2); ctx.scale(eOutCubic(flip), 1); ctx.translate(-(px + pw / 2), -(py + phh / 2));
      ctx.shadowColor = 'rgba(60,40,20,.25)'; ctx.shadowBlur = 30 * u; ctx.fillStyle = '#fff';
      rr(ctx, px - 14 * u, py - 14 * u, pw + 28 * u, phh + 28 * u, 10 * u); ctx.fill(); ctx.shadowBlur = 0;
      const [sx, sy, sw, sh] = tile(i), z = 1 + .06 * lt;
      ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, phh); ctx.clip();
      ctx.drawImage(s.img, sx + sw * (1 - 1 / z) / 2, sy + sh * (1 - 1 / z) / 2, sw / z, sh / z, px, py, pw, phh);
      ctx.restore(); ctx.restore();
      // 数字卡
      const cx = LAND ? W * .6 : W * .08, cy = LAND ? H * .3 : py + phh + 90 * u;
      const cp = eOutCubic(clamp((lt - .1) / .3)) * fade;
      ctx.save(); ctx.globalAlpha = cp; ctx.translate((1 - cp) * 40 * u, 0); ctx.textAlign = 'left';
      ctx.font = `400 ${(LAND ? 44 : 46) * u}px 'Bebas Neue'`; ctx.fillStyle = ACC; ctx.fillText(`${String(i + 1).padStart(2, '0')} / 12`, cx, cy);
      ctx.font = `900 ${(LAND ? 92 : 96) * u}px 'Noto Sans SC'`; ctx.fillStyle = INK; ctx.fillText(mo, cx, cy + 100 * u);
      const roll = eOutCubic(clamp((lt - .1) / .5));
      ctx.font = `400 ${(LAND ? 120 : 130) * u}px 'Bebas Neue'`; ctx.fillStyle = INK;
      const nw = ctx.measureText(fmt(cups * roll)).width;
      ctx.fillText(fmt(cups * roll), cx, cy + 230 * u);
      ctx.font = `700 ${(LAND ? 36 : 38) * u}px 'Noto Sans SC'`; ctx.fillStyle = SUB; ctx.fillText('杯', cx + nw + 14 * u, cy + 230 * u);
      ctx.font = `700 ${(LAND ? 32 : 34) * u}px 'Noto Sans SC'`; ctx.fillStyle = INK; ctx.fillText(`人气饮品 · ${drink}`, cx, cy + 300 * u);
      if (i === 7) {                                         // 八月：最忙
        ctx.fillStyle = ACC; rr(ctx, cx, cy + 330 * u, 190 * u, 52 * u, 26 * u); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `700 ${28 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText('全年最忙', cx + 95 * u, cy + 366 * u);
      }
      ctx.restore();
      // 角落：全年累计
      const acc = ROWS.slice(0, i).reduce((a, r) => a + r[1], 0) + cups * roll;
      ctx.globalAlpha = fade; ctx.textAlign = 'right'; ctx.font = `400 ${22 * u}px 'Noto Sans SC'`; ctx.fillStyle = SUB;
      ctx.fillText('全年累计', W - 50 * u, (LAND ? 60 : 80) * u);
      ctx.font = `400 ${(LAND ? 54 : 60) * u}px 'Bebas Neue'`; ctx.fillStyle = INK; ctx.fillText(fmt(acc), W - 50 * u, (LAND ? 116 : 140) * u);
      // 进度点
      for (let k = 0; k < 12; k++) {
        ctx.fillStyle = k <= i ? ACC : 'rgba(59,42,30,.15)';
        const dx = LAND ? W * .6 + k * 34 * u : W / 2 + (k - 5.5) * 34 * u, dy = LAND ? H * .86 : H * .93;
        ctx.beginPath(); ctx.arc(dx, dy, (k === i ? 9 : 6) * u, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // 总览墙：十二格从中间飞回原位
    const wp = eInOutCubic(inv(WALL, WALL + 1.0, t));
    if (wp > 0) {
      const [iw, ih] = srcSize(s.img), ww = LAND ? H * .78 * iw / ih : W * .9, wh = ww * ih / iw;
      const wx = LAND ? W * .07 : (W - ww) / 2, wy = LAND ? (H - wh) / 2 : H * .1;
      const k = ww / iw;
      for (let i = 0; i < 12; i++) {
        const [sx, sy, sw, sh] = tile(i), d = clamp((wp - i * .025) / .7);
        const e = eOutCubic(d), tx = wx + sx * k, ty = wy + sy * k;
        const fx = W / 2 - sw * k / 2, fy = H / 2 - sh * k / 2;
        ctx.globalAlpha = clamp(d * 3);
        ctx.drawImage(s.img, sx, sy, sw, sh, lerp(fx, tx, e), lerp(fy, ty, e), sw * k, sh * k);
        if (i === 7 && wp >= 1) {
          ctx.strokeStyle = ACC; ctx.lineWidth = 7 * u;
          const pp = eOutCubic(inv(WALL + 1.0, WALL + 1.5, t));
          drawPartial(ctx, rectPts(tx - 6 * u, ty - 6 * u, sw * k + 12 * u, sh * k + 12 * u, 0), pp, true); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      const fp = eOutCubic(inv(WALL + .8, WALL + 1.4, t));
      const fx = LAND ? wx + ww + 70 * u : W / 2, fy = LAND ? H * .36 : wy + wh + 120 * u;
      ctx.globalAlpha = fp; ctx.textAlign = LAND ? 'left' : 'center';
      ctx.font = `400 ${(LAND ? 40 : 44) * u}px 'Bebas Neue'`; ctx.fillStyle = ACC; ctx.fillText('2026 · TOTAL', fx, fy);
      ctx.font = `400 ${(LAND ? 140 : 160) * u}px 'Bebas Neue'`; ctx.fillStyle = INK; ctx.fillText(fmt(s.total * eOutCubic(inv(WALL + .8, WALL + 1.8, t))), fx, fy + 140 * u);
      ctx.font = `700 ${(LAND ? 34 : 38) * u}px 'Noto Sans SC'`; ctx.fillText('杯 · 最忙是八月', fx, fy + 210 * u);
      ctx.font = `900 ${(LAND ? 52 : 58) * u}px 'Noto Sans SC'`; ctx.fillStyle = ACC;
      ctx.globalAlpha = eOutCubic(inv(WALL + 1.6, WALL + 2.1, t)); ctx.fillText('明年见！', fx, fy + 310 * u);
      ctx.globalAlpha = 1;
    }
    // 字幕
    const c = cueAt(s.A, t);
    if (c) caption(ctx, c.text, { size: LAND ? 34 : 40, y: H - (LAND ? 44 : 120) * u, bg: 'rgba(59,42,30,.82)' });
    ctx.font = `400 ${(LAND ? 16 : 15) * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(59,42,30,.5)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 24 * u, H - 14 * u);
  }
});
