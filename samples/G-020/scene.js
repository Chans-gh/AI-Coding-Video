// G-020 拉伸跟练：生成一位虚构教练的定妆图当首帧，图生视频做一个侧腰拉伸；代码按旁白的逐字时间控制播放——站着等口令、跟着「向左弯」放下去、「保持」时在最低点来回慢放像在呼吸、「回正」再放完；旁边叠动作名、要点清单（逐条随旁白点亮）、倒计时圆环和组数，数到「一」圆环走完，「回正」亮起「完成」
// 素材：生图 1 张、生视频 1 段（5 秒）、语音合成旁白；配乐 CC0。清单、圆环、组数都是 Canvas 2D 画的
scene({
  id: 'G-020', name: '拉伸跟练', dur: 13.5, still: 9.4,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'"],
  text: '侧腰拉伸跟我做双脚与肩同宽右手举过头顶身体向左弯保持呼吸三二一回正完成第组共要点动作生图视频旁白合成配乐每侧秒',
  async init() {
    const A = await loadAssets(), T = (k, f) => cueTime(A, k, f);
    return { A, v: await loadVideo('stretch.mp4'), c: [T('双脚', 2.3), T('右手', 4), T('向左弯', 5.9)], bend: T('身体', 5.8), hold: T('保持', 7.2), n: [T('三', 9), T('二', 9.7), T('一', 10.4)], back: T('回正', 11.4) };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, INK = '#1f3a34', MINT = '#7fc8a9', ACC = '#2e9e78', BG = '#eef6f1';
    // 视频时间：开头在站姿里轻轻晃，「右手」时把手举起来；「身体」起放到弯下最低点；保持阶段在最低点附近来回慢放；「回正」放完
    const LOW = 2.5, END = s.v.dur - .05, hEnd = s.back - .1;
    let vt;
    const UP = .9;                                         // 视频里 0.9 秒时手已举过头顶
    if (t < s.bend) vt = lerp(0, UP, eInOutCubic(inv(s.c[1], s.c[1] + 1.4, t))) + .08 * Math.sin(t * 2.2) * (1 - inv(s.c[1], s.c[1] + .3, t));
    else if (t < s.hold) vt = lerp(UP, LOW, eInOutCubic(inv(s.bend, s.hold, t)));
    else if (t < hEnd) vt = LOW + .35 * Math.sin((t - s.hold) / (hEnd - s.hold) * TAU);
    else vt = lerp(LOW, END, inv(hEnd, hEnd + 1.6, t));
    await s.v.at(clamp(vt, 0, END));
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    const zoom = 1.02 + .03 * eInOutCubic(inv(0, 13.5, t));
    let vx, vy, vw, vh;
    if (LAND) {
      vh = H - 120 * u; vw = vh * 480 / 836; vx = W * .1; vy = 60 * u;
      ctx.save(); ctx.shadowColor = 'rgba(31,58,52,.25)'; ctx.shadowBlur = 40 * u; ctx.fillStyle = '#fff';
      rr(ctx, vx, vy, vw, vh, 28 * u); ctx.fill(); ctx.shadowBlur = 0; ctx.clip();
      drawCover(ctx, s.v.el, vx, vy, vw, vh, { zoom }); ctx.restore();
    } else {
      vx = 0; vy = 0; vw = W; vh = H;
      drawCover(ctx, s.v.el, 0, 0, W, H, { zoom, fy: .45 });
      const g = ctx.createLinearGradient(0, 0, 0, H * .3); g.addColorStop(0, 'rgba(238,246,241,.95)'); g.addColorStop(1, 'rgba(238,246,241,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * .3);
    }
    // 动作名和组数
    const px = LAND ? vx + vw + 90 * u : 60 * u, a0 = eOutCubic(inv(.1, .7, t));
    ctx.globalAlpha = a0; ctx.textAlign = 'left';
    ctx.font = `400 ${(LAND ? 36 : 38) * u}px 'Bebas Neue'`; ctx.fillStyle = ACC; ctx.fillText('SIDE STRETCH · SET 1 / 3', px, (LAND ? 150 : 120) * u);
    ctx.font = `900 ${(LAND ? 100 : 96) * u}px 'Noto Sans SC'`; ctx.fillStyle = INK; ctx.fillText('侧腰拉伸', px, (LAND ? 260 : 225) * u);
    for (let k = 0; k < 3; k++) {                          // 组数点
      ctx.fillStyle = k === 0 ? ACC : 'rgba(31,58,52,.18)';
      rr(ctx, px + k * 64 * u, (LAND ? 290 : 255) * u, 52 * u, 12 * u, 6 * u); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // 要点清单：随旁白逐条点亮
    const items = ['双脚与肩同宽', '右手举过头顶', '身体向左弯'];
    const ly = LAND ? 400 * u : H * .62, lh = (LAND ? 92 : 100) * u, lw = LAND ? W - px - 90 * u : W - 120 * u;
    if (!LAND) {
      const ca = eOutCubic(inv(s.c[0] - .5, s.c[0], t));
      ctx.globalAlpha = ca; ctx.fillStyle = 'rgba(255,255,255,.88)'; rr(ctx, px - 30 * u, ly - 66 * u, lw + 60 * u, lh * 3 + 40 * u, 28 * u); ctx.fill(); ctx.globalAlpha = 1;
    }
    items.forEach((txt, i) => {
      const on = eOutCubic(inv(s.c[i], s.c[i] + .4, t)), y = ly + i * lh, show = eOutCubic(inv(s.c[0] - .5 + i * .1, s.c[0] + i * .1, t));
      if (show <= 0) return;
      ctx.globalAlpha = show;
      const r = 24 * u, cx = px + r, cy = y - 12 * u;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = on > 0 ? rgba(hex2rgb(ACC), .15 + .85 * on) : 'rgba(31,58,52,.08)'; ctx.fill();
      if (on > 0) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 5 * u; ctx.lineCap = ctx.lineJoin = 'round';
        drawPartial(ctx, [[cx - 10 * u, cy], [cx - 3 * u, cy + 8 * u], [cx + 11 * u, cy - 8 * u]], on); ctx.stroke();
      }
      ctx.font = `${on > .5 ? 700 : 400} ${(LAND ? 42 : 44) * u}px 'Noto Sans SC'`; ctx.fillStyle = on > .5 ? INK : 'rgba(31,58,52,.45)';
      ctx.fillText(txt, px + 2 * r + 28 * u, y + 2 * u);
      ctx.globalAlpha = 1;
    });
    // 倒计时圆环：「保持」起出现，按「三、二、一」走三格，「回正」亮起完成
    const rp = eOutBack(inv(s.hold - .2, s.hold + .3, t));
    if (rp > 0) {
      const R = (LAND ? 110 : 120) * u, rx = LAND ? px + R : W - R - 60 * u, ry = LAND ? ly + lh * 3 + R + 20 * u : 200 * u;
      const done = t >= s.back, prog = done ? 1 : t < s.n[0] ? 0 : Math.min(1, (t - s.n[0]) / (s.back - s.n[0]));
      ctx.save(); ctx.translate(rx, ry); ctx.scale(rp, rp);
      ctx.beginPath(); ctx.arc(0, 0, R + 16 * u, 0, TAU); ctx.fillStyle = done ? ACC : 'rgba(255,255,255,.92)'; ctx.fill();
      ctx.lineWidth = 16 * u; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, R - 10 * u, 0, TAU); ctx.strokeStyle = done ? 'rgba(255,255,255,.35)' : 'rgba(31,58,52,.1)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, R - 10 * u, -TAU / 4, -TAU / 4 + TAU * prog); ctx.strokeStyle = done ? '#fff' : MINT; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (done) {
        const dp = eOutBack(inv(s.back, s.back + .4, t));
        ctx.scale(dp, dp); ctx.fillStyle = '#fff'; ctx.font = `900 ${56 * u}px 'Noto Sans SC'`; ctx.fillText('完成', 0, 4 * u);
      } else if (t < s.n[0]) {
        ctx.fillStyle = INK; ctx.font = `700 ${40 * u}px 'Noto Sans SC'`; ctx.fillText('保持', 0, 4 * u);
      } else {
        const k = t < s.n[1] ? 0 : t < s.n[2] ? 1 : 2, kp = eOutBack(inv(s.n[k], s.n[k] + .3, t));
        ctx.scale(.6 + .4 * kp, .6 + .4 * kp); ctx.fillStyle = INK; ctx.font = `400 ${130 * u}px 'Bebas Neue'`; ctx.fillText(String(3 - k), 0, 8 * u);
      }
      ctx.restore(); ctx.textBaseline = 'alphabetic';
    }
    // 字幕
    const c = cueAt(s.A, t);
    if (c) caption(ctx, c.text, { size: LAND ? 36 : 42, x: LAND ? vx + vw / 2 : W / 2, maxW: LAND ? vw - 40 * u : W - 120 * u, y: LAND ? vy + vh - 60 * u : H - 150 * u, bg: 'rgba(31,58,52,.8)' });
    ctx.font = `400 ${(LAND ? 16 : 15) * u}px 'Noto Sans SC'`; ctx.fillStyle = LAND ? 'rgba(31,58,52,.5)' : 'rgba(255,255,255,.8)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 24 * u, H - 18 * u);
  }
});
