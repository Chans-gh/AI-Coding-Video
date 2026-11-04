// T-004 倒计时分屏品牌片：左边发射录像、右边发射台照片上压巨大的倒计时数字；归零起飞后录像铺满，再分成三格，照片和任务数字（读 CSV）一格格滚出来，最后落一句口号
// 素材：录像（NASA 新闻发布区跟拍的 Artemis I 发射）、照片（NASA 发射照两张）、数据（照 NASA 任务页手抄的数字）；配乐 CC0
scene({
  id: 'T-004', name: '倒计时分屏', dur: 15, still: 10.6,
  fonts: ["400 40px 'Bebas Neue'", "900 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  text: '倒计时起飞任务时长飞行总里程离地球最远发射溅落天百万公里公里去更远的地方再回来录像照片数据配乐',
  async init() {
    const A = await loadAssets();
    const facts = Object.fromEntries(parseCSV(await loadText('facts.csv')).map(r => [r.key, r]));
    return { A, facts, v: await loadVideo('launch.mp4'), pad: await loadImage('pad.jpg'), lift: await loadImage('liftoff.jpg') };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, O = '#ff7a1a', F = s.facts;
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
    await s.v.at(Math.min(t + 5, s.v.dur - .05));          // 片中 5 秒 = 录像里点火后起飞的那一刻
    const gap = 8 * u;
    if (t < 5.6) {
      // ① 分屏倒计时
      const split = eInOutCubic(inv(0, .6, t)), mid = LAND ? W * lerp(1, .5, split) : H * lerp(1, .5, split);
      const A1 = LAND ? [0, 0, mid - gap / 2, H] : [0, 0, W, mid - gap / 2];
      const A2 = LAND ? [mid + gap / 2, 0, W - mid - gap / 2, H] : [0, mid + gap / 2, W, H - mid - gap / 2];
      drawCover(ctx, s.v.el, ...A1, { zoom: lerp(1.25, 1.1, t / 5), fy: .6 });
      drawCover(ctx, s.pad, ...A2, { zoom: lerp(1.1, 1.25, t / 5), fy: .3 });
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(...A2);
      const n = Math.max(0, Math.ceil(5 - t)), f = (5 - t) % 1, cx = A2[0] + A2[2] / 2, cy = A2[1] + A2[3] / 2;
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (t < 5) {
        ctx.translate(cx, cy); const sc = 1 + .25 * Math.pow(f, 6); ctx.scale(sc, sc);
        ctx.font = `400 ${(LAND ? 520 : 440) * u}px 'Bebas Neue'`; ctx.fillStyle = '#fff'; ctx.globalAlpha = .4 + .6 * f;
        ctx.fillText(String(n), 0, 30 * u);
      } else {
        ctx.translate(cx, cy); ctx.scale(eOutBack(inv(5, 5.3, t)), eOutBack(inv(5, 5.3, t)));
        ctx.font = `400 ${(LAND ? 230 : 200) * u}px 'Bebas Neue'`; ctx.fillStyle = O; ctx.fillText('LIFTOFF', 0, 20 * u);
      }
      ctx.restore();
      ctx.save(); ctx.font = `400 ${34 * u}px 'Bebas Neue'`; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.textBaseline = 'top';
      ctx.fillText('T-MINUS · ARTEMIS I · 2022.11.16', A2[0] + 40 * u, A2[1] + 40 * u); ctx.restore();
    } else if (t < 9) {
      // ② 录像铺满，起飞
      const k = inv(5.6, 9, t);
      drawCover(ctx, s.v.el, 0, 0, W, H, { zoom: lerp(1.1, 1.3, k), fy: lerp(.6, .3, k) });
      ctx.save(); ctx.globalAlpha = smooth(6, 6.5, t) * (1 - smooth(8.5, 9, t)); ctx.textAlign = 'center';
      ctx.font = `900 ${(LAND ? 84 : 76) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 20 * u;
      ctx.fillText('起飞', W / 2, H * .82); ctx.restore();
    } else if (t < 12.6) {
      // ③ 三格：照片、照片、数字依次滚进
      drawCover(ctx, s.v.el, 0, 0, W, H, { zoom: 1.3, fy: .3 });   // 三格滚进来之前，底下还是起飞的录像
      const rows = [['days', s.lift], ['distance', s.pad], ['farthest', null]];
      rows.forEach(([key, img], i) => {
        const p = eOutCubic(inv(9 + i * .35, 9.6 + i * .35, t));
        const box = LAND ? [i * W / 3 + gap / 2, 0, W / 3 - gap, H] : [0, i * H / 3 + gap / 2, W, H / 3 - gap];
        ctx.save(); ctx.beginPath(); ctx.rect(...box); ctx.clip();
        ctx.translate(0, LAND ? (1 - p) * H : 0); ctx.translate(LAND ? 0 : (1 - p) * W, 0);
        if (img) { drawCover(ctx, img, ...box, { zoom: 1.15 + .05 * (t - 9) }); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(...box); }
        else { drawCover(ctx, s.v.el, ...box, { zoom: 1.4, fy: .25 }); ctx.fillStyle = 'rgba(255,122,26,.55)'; ctx.fillRect(...box); }
        const r = F[key], cnt = inv(9.3 + i * .35, 10.8 + i * .35, t), val = r.value * eOutCubic(cnt);
        const txt = key === 'farthest' ? Math.round(val).toLocaleString('en-US') : val.toFixed(key === 'days' ? 1 : 2);
        ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
        const cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2;
        ctx.font = `400 ${(LAND ? 150 : 130) * u}px 'Bebas Neue'`; ctx.fillText(txt, cx, cy + 20 * u);
        ctx.font = `900 ${34 * u}px 'Noto Sans SC'`; ctx.fillText(r.unit, cx, cy + 80 * u);
        ctx.font = `400 ${28 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(r.label, cx, cy - (LAND ? 120 : 100) * u);
        ctx.restore();
      });
    } else {
      // ④ 口号
      drawCover(ctx, s.lift, 0, 0, W, H, { zoom: lerp(1.3, 1.2, inv(12.6, 15, t)), fy: .2 });
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H);
      const a = smooth(12.7, 13.3, t);
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.font = `900 ${(LAND ? 96 : 84) * u}px 'Noto Sans SC'`; ctx.fillText('去更远的地方', W / 2, H * .47);
      ctx.font = `900 ${(LAND ? 96 : 84) * u}px 'Noto Sans SC'`; ctx.fillStyle = O; ctx.globalAlpha = smooth(13.3, 13.9, t);
      ctx.fillText('再回来', W / 2, H * .47 + 120 * u);
      ctx.font = `400 ${36 * u}px 'Bebas Neue'`; ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fillText(`ARTEMIS I · ${F.launch.value} → ${F.splashdown.value}`, W / 2, H * .47 + 200 * u);
      ctx.restore();
    }
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 24 * u, H - 18 * u); ctx.restore();
  },
});
