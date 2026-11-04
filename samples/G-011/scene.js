// G-011 高光慢放集锦：一段 AI 生成的扣篮镜头（虚构球员、无队标），代码剪成集锦：正常速度助跑 → 慢放起跳 → 最高点定格（背景去色、圈出球、弹出数据卡）→ 扣进的一下比分牌翻到 88、闪白 → 「本周最佳」收尾；角上一直挂着转播比分条
// 素材：生视频；配乐 CC0。数据卡里的数字是示意
const SEG = [ // [片中起点, 素材起点, 素材速度]
  [0, 0, 1], [2.2, 2.2, .42], [5.3, 3.2, 0], [7.0, 3.2, .95], [8.7, 4.0, .4],
];
const BALL = [.39, .09]; // 定格那一帧里球的位置（素材坐标 0–1）
scene({
  id: 'G-011', name: '高光慢放集锦', dur: 11, still: 6.2,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'", "700 40px 'JetBrains Mono'"],
  text: '红队蓝队本周最佳起跳滞空秒最高点数据为示意慢放绝杀扣篮第四节画面生成配乐',
  async init() { return { A: await loadAssets(), v: await loadVideo('dunk.mp4') }; },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, RED = '#d7263d', GOLD = '#ffc145';
    let k = SEG.length - 1; while (SEG[k][0] > t) k--;
    const [t0, v0, sp] = SEG[k], vt = Math.min(v0 + (t - t0) * sp, s.v.dur - .05);
    await s.v.at(vt);
    const frz = k === 2, slow = k === 1, zoom = slow ? lerp(1, 1.12, inv(2.2, 5.3, t)) : frz ? lerp(1.12, 1.24, eInOutCubic(inv(5.3, 7, t))) : k === 4 ? lerp(1, 1.1, inv(8.7, 11, t)) : 1;
    if (frz) ctx.filter = `saturate(${lerp(1, .15, smooth(5.3, 5.6, t))}) brightness(${lerp(1, .75, smooth(5.3, 5.6, t))})`;
    const fx = LAND ? .5 : .42, fy = frz || slow ? .08 : .5;
    drawCover(ctx, s.v.el, 0, 0, W, H, { zoom, fx, fy });
    ctx.filter = 'none';
    // 素材坐标 → 画面坐标（drawCover 居中裁切）
    const vw = s.v.el.videoWidth || 1280, vh = s.v.el.videoHeight || 720, sc = Math.max(W / vw, H / vh) * zoom;
    const map = (x, y) => [(W - vw * sc) * fx + x * vw * sc, (H - vh * sc) * fy + y * vh * sc];
    // 慢放：两边速度线、角标
    if (slow) {
      ctx.save(); ctx.globalAlpha = .5 * smooth(2.2, 2.5, t);
      for (let i = 0; i < 14; i++) { const y = (hash1(i * 7) * H + t * 900 * u) % H, x = i % 2 ? W - 60 * u : 60 * u;
        ctx.fillStyle = '#fff'; ctx.fillRect(x - 2 * u, y, 4 * u, 120 * u); }
      ctx.restore();
      tag(ctx, 'SLOW-MO  0.4×', W / 2, H - (LAND ? 90 : 420) * u, '#fff', 'rgba(0,0,0,.55)', u, 'center');
    }
    // 定格：闪一下、圈出球、数据卡
    if (frz || (k === 3 && t < 7.15)) {
      const fl = 1 - smooth(5.3, 5.5, t); if (fl > 0 && frz) { ctx.fillStyle = `rgba(255,255,255,${fl * .8})`; ctx.fillRect(0, 0, W, H); }
      const [bx, by] = map(...BALL), r = (LAND ? 70 : 80) * u * eOutBack(inv(5.45, 5.75, t));
      ctx.strokeStyle = GOLD; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.arc(bx, by + 30 * u, r, 0, Math.PI * 2); ctx.stroke();
      const lb = smooth(5.6, 5.8, t); ctx.save(); ctx.globalAlpha = lb; ctx.strokeStyle = GOLD; ctx.lineWidth = 3 * u;
      ctx.beginPath(); ctx.moveTo(bx + r * .7, by + 30 * u + r * .7); ctx.lineTo(bx + r * 1.6, by + 30 * u + r * 1.6); ctx.lineTo(bx + r * 1.6 + 140 * u, by + 30 * u + r * 1.6); ctx.stroke();
      ctx.font = `900 ${34 * u}px 'Noto Sans SC'`; ctx.fillStyle = GOLD; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('最高点', bx + r * 1.6 + 6 * u, by + 24 * u + r * 1.6); ctx.restore();
      [['起跳高度', 0.92, 'm', 5.8], ['滞空', 0.84, 's', 6.05]].forEach(([lab, val, unit, kt], i) => {
        const a = eOutCubic(inv(kt, kt + .3, t)) * (1 - smooth(6.85, 7.05, t)); if (a <= 0) return;
        const cw = 300 * u, ch = 150 * u, x = LAND ? W - cw - 80 * u + (1 - a) * 200 * u : W / 2 - cw - 10 * u + i * (cw + 20 * u),
          y = LAND ? H * .3 + i * (ch + 24 * u) : H * .62 + (1 - a) * 100 * u;
        ctx.save(); ctx.globalAlpha = a; rr(ctx, x, y, cw, ch, 14 * u); ctx.fillStyle = 'rgba(12,16,28,.85)'; ctx.fill();
        ctx.fillStyle = RED; ctx.fillRect(x, y, 8 * u, ch);
        ctx.font = `700 ${24 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#aab3c5'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(lab, x + 30 * u, y + 46 * u);
        ctx.font = `400 ${84 * u}px 'Bebas Neue'`; ctx.fillStyle = '#fff'; ctx.fillText((val * eOutCubic(inv(kt, kt + .5, t))).toFixed(2), x + 30 * u, y + 128 * u);
        ctx.font = `400 ${40 * u}px 'Bebas Neue'`; ctx.fillStyle = GOLD; ctx.fillText(unit, x + 200 * u, y + 128 * u); ctx.restore();
      });
      if (frz) { ctx.save(); ctx.globalAlpha = smooth(5.8, 6, t) * .8; ctx.font = `400 ${18 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('数据为示意', W - 40 * u, H - (LAND ? 40 : 150) * u); ctx.restore(); }
    }
    // 扣进：闪白 + 轻微震屏感（白边框）
    const hit = 7.7, fh = 1 - smooth(hit, hit + .35, t);
    if (t > hit && fh > 0) { ctx.fillStyle = `rgba(255,255,255,${fh * .7})`; ctx.fillRect(0, 0, W, H); }
    // 收尾：本周最佳
    const e = smooth(8.7, 9.1, t);
    if (e > 0) {
      ctx.fillStyle = `rgba(10,12,20,${e * .55})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, H * (LAND ? .45 : .42)); ctx.rotate(-.05);
      const x = (1 - eOutCubic(inv(8.7, 9.1, t))) * -W;
      ctx.fillStyle = RED; ctx.fillRect(-W * .6 + x, -90 * u, W * 1.2, 180 * u);
      ctx.font = `900 ${(LAND ? 130 : 120) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('本周最佳', -x * .3, 4 * u);
      ctx.globalAlpha = smooth(9.2, 9.5, t); ctx.font = `400 ${(LAND ? 56 : 52) * u}px 'Bebas Neue'`; ctx.fillStyle = GOLD;
      ctx.fillText('PLAY OF THE WEEK · #23', 0, 150 * u); ctx.restore();
    }
    // 转播比分条
    const red = t < hit ? 86 : 88, clock = Math.max(0, 3.4 - Math.min(t, hit) * .38).toFixed(1);
    const bx = LAND ? 50 * u : W / 2 - 235 * u, by = LAND ? 44 * u : H - 330 * u, bw = 470 * u, bh = 64 * u;
    ctx.save(); rr(ctx, bx, by, bw, bh, 10 * u); ctx.fillStyle = 'rgba(12,16,28,.88)'; ctx.fill();
    ctx.font = `900 ${26 * u}px 'Noto Sans SC'`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = RED; ctx.fillRect(bx, by, 10 * u, bh); ctx.fillStyle = '#fff'; ctx.fillText('红队', bx + 24 * u, by + bh / 2);
    const pop = 1 + .5 * (1 - smooth(hit, hit + .4, t)) * (t > hit);
    ctx.save(); ctx.translate(bx + 150 * u, by + bh / 2); ctx.scale(pop, pop); ctx.font = `400 ${46 * u}px 'Bebas Neue'`; ctx.fillStyle = t > hit ? GOLD : '#fff'; ctx.textAlign = 'center'; ctx.fillText(red, 0, 3 * u); ctx.restore();
    ctx.font = `400 ${46 * u}px 'Bebas Neue'`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('84', bx + 230 * u, by + bh / 2 + 3 * u);
    ctx.font = `900 ${26 * u}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.fillText('蓝队', bx + 270 * u, by + bh / 2);
    ctx.fillStyle = '#4c8bf5'; ctx.fillRect(bx + 330 * u, by + 14 * u, 4 * u, bh - 28 * u);
    ctx.font = `700 ${22 * u}px 'JetBrains Mono'`; ctx.fillStyle = GOLD; ctx.fillText(`Q4 ${clock}`, bx + 350 * u, by + bh / 2 + 2 * u);
    ctx.restore();
    ctx.save(); ctx.font = `400 ${15 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(credits(s.A), W / 2, H - (LAND ? 18 : 60) * u); ctx.restore();
  },
});

function tag(ctx, text, x, y, c, bg, u, al) {
  ctx.save(); ctx.font = `400 ${40 * u}px 'Bebas Neue'`; const w = ctx.measureText(text).width + 40 * u;
  const x0 = al === 'center' ? x - w / 2 : x; rr(ctx, x0, y - 30 * u, w, 60 * u, 30 * u); ctx.fillStyle = bg; ctx.fill();
  ctx.fillStyle = c; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + w / 2, y + 2 * u); ctx.restore();
}
