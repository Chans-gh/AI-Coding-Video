// C-056 微游戏快闪：Canvas 2D 按时间切成四关，每关一个画法函数：蜡笔关的线条每 1/8 秒重抖一遍、错开画三遍；蓝图关是网格加白色细线和尺寸标注；像素关先画在 1/12 大小的小画布上再关掉平滑放大；霓虹关用多层 shadowBlur 叠出发光。每关顶上一条倒计时，关越往后越短，结束时盖“成功 / 失败”章，最后一屏是总分。
// 风格提示词：用微游戏快闪风格：每关只有几秒、屏幕上一个大写指令词（如“吃！”）、只做一个动作，每一关换一种完全不同的画风（蜡笔、蓝图、像素…），关与关之间有倒计时和成败判定，节奏越来越快。
// 题材：游戏 · 适合：趣味、短视频
scene({
  id: 'C-056', name: '微游戏快闪', dur: 5, still: 2.2,
  text: '吃接跳躲！成功失败通关分第关',
  fonts: ["400 80px 'ZCOOL KuaiLe'", "900 80px 'Noto Sans SC'", "80px 'Bangers'", "20px 'Press Start 2P'"],
  init() { return { px: mk(Math.ceil(W / 12), Math.ceil(H / 12)) }; },
  draw(ctx, t, s) {
    const u = SHORT / 1080, ST = [[0, 1.4], [1.4, 2.6], [2.6, 3.6], [3.6, 4.4]], WIN = [1, 1, 1, 0];
    let k = ST.findIndex(([a, b]) => t >= a && t < b); const end = k < 0;
    const [a0, a1] = end ? [4.4, 5] : ST[k], lt = t - a0, d = a1 - a0, p = lt / d;
    const cx = W / 2, cy = H * (LAND ? .56 : .55);
    const big = (txt, col, font, stroke) => {   // 指令词：前 0.25 秒放大砸下
      const q = eOutBack(inv(0, .22, lt), 2.5); ctx.save(); ctx.translate(cx, H * (LAND ? .2 : .2)); ctx.scale(q, q); ctx.rotate(-.05);
      ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if (stroke) { ctx.lineWidth = 14 * u; ctx.strokeStyle = stroke; ctx.strokeText(txt, 0, 0); } ctx.fillStyle = col; ctx.fillText(txt, 0, 0); ctx.restore(); ctx.textBaseline = 'alphabetic';
    };
    const timer = (col, bg) => { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, 22 * u); ctx.fillStyle = col; ctx.fillRect(0, 0, W * (1 - clamp(p / .82)), 22 * u); };
    const verdict = (ok) => {   // 最后 18% 的时间盖章
      const q = inv(.82, .9, p); if (q <= 0) return; const kk = 1 + (1 - q) * 1.5;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.2); ctx.scale(kk, kk); ctx.globalAlpha = q;
      ctx.fillStyle = ok ? '#1FB86A' : '#E23B3B'; rr(ctx, -260 * u, -100 * u, 520 * u, 200 * u, 30 * u); ctx.fill();
      ctx.fillStyle = '#FFF'; ctx.font = `900 ${120 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ok ? '成功' : '失败', 0, 6 * u); ctx.restore(); ctx.textBaseline = 'alphabetic';
    };
    if (k === 0) {   // 蜡笔：吃！
      const R = mulberry32(Math.floor(t * 8) + 1), j = () => (R() - .5) * 8 * u;
      ctx.fillStyle = '#FFF4C9'; ctx.fillRect(0, 0, W, H);
      const crayon = (pts, col, w) => { for (let r = 0; r < 3; r++) { ctx.strokeStyle = col; ctx.globalAlpha = .55; ctx.lineWidth = w * u; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x + j(), y + j()) : ctx.moveTo(x + j(), y + j())); ctx.stroke(); } ctx.globalAlpha = 1; };
      const chomp = Math.abs(Math.sin(lt * 14)) * (p < .7 ? 1 : 0), mx = cx - 160 * u, ax = lerp(cx + 400 * u, cx + 160 * u, eInCubic(clamp(p / .7)));
      crayon(circlePts(mx, cy, 160 * u, 40, 0, TAU, .12, 1), '#E8564A', 12);                       // 脸
      crayon(circlePts(mx + 70 * u, cy + 30 * u, 50 * u, 24).map(([x, y]) => [x, cy + 30 * u + (y - cy - 30 * u) * (.15 + chomp)]), '#222', 10);   // 一张一合的嘴
      crayon(circlePts(mx + 10 * u, cy - 60 * u, 14 * u, 12), '#222', 10); crayon(circlePts(mx + 90 * u, cy - 60 * u, 14 * u, 12), '#222', 10);
      if (p < .72) { crayon(circlePts(ax, cy, 70 * u, 30, 0, TAU, .3, 3), '#E23B3B', 16); crayon([[ax, cy - 70 * u], [ax + 10 * u, cy - 110 * u]], '#6B4A2A', 10); crayon([[ax + 10 * u, cy - 100 * u], [ax + 50 * u, cy - 120 * u]], '#3EA04A', 12); }
      else for (let i = 0; i < 6; i++) crayon([[mx + 60 * u, cy], [mx + 60 * u + Math.cos(i) * 180 * u, cy + Math.sin(i) * 180 * u]], '#F2B632', 6);
      big('吃！', '#E8564A', `400 ${220 * u}px 'ZCOOL KuaiLe'`, '#FFF');
      timer('#E8564A', 'rgba(0,0,0,.08)'); verdict(WIN[0]);
    } else if (k === 1) {   // 蓝图：接！
      ctx.fillStyle = '#1C4E8A'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40 * u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 40 * u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.strokeStyle = '#EAF2FF'; ctx.lineWidth = 4 * u; ctx.setLineDash([]);
      const bx = cx + Math.sin(lt * 5) * 120 * u * (1 - p), by = cy + 260 * u, fy = lerp(cy - 380 * u, by - 40 * u, eInCubic(clamp(p / .78)));
      ctx.strokeRect(bx - 110 * u, by - 70 * u, 220 * u, 140 * u); ctx.beginPath(); ctx.moveTo(bx - 110 * u, by - 70 * u); ctx.lineTo(bx - 140 * u, by - 110 * u); ctx.moveTo(bx + 110 * u, by - 70 * u); ctx.lineTo(bx + 140 * u, by - 110 * u); ctx.stroke();
      ctx.strokeRect(cx - 50 * u, fy - 50 * u, 100 * u, 100 * u); ctx.beginPath(); ctx.moveTo(cx - 50 * u, fy - 50 * u); ctx.lineTo(cx + 50 * u, fy + 50 * u); ctx.moveTo(cx + 50 * u, fy - 50 * u); ctx.lineTo(cx - 50 * u, fy + 50 * u); ctx.stroke();
      ctx.setLineDash([8 * u, 8 * u]); ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(cx + 90 * u, fy - 50 * u); ctx.lineTo(cx + 90 * u, fy + 50 * u); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#EAF2FF'; ctx.font = `${30 * u}px 'Bangers'`; ctx.textAlign = 'left'; ctx.fillText('100 mm', cx + 100 * u, fy + 10 * u); ctx.fillText('A-02', bx + 130 * u, by + 60 * u);
      big('接！', '#EAF2FF', `900 ${200 * u}px 'Noto Sans SC'`);
      timer('#EAF2FF', 'rgba(255,255,255,.15)'); verdict(WIN[1]);
    } else if (k === 2) {   // 像素：跳！
      const g = s.px.getContext('2d'), pw = s.px.width, ph = s.px.height, gy = Math.round(ph * .72);
      g.fillStyle = '#5C94FC'; g.fillRect(0, 0, pw, ph); g.fillStyle = '#C84C0C'; g.fillRect(0, gy, pw, ph); g.fillStyle = '#00A800'; g.fillRect(0, gy, pw, 2);
      g.fillStyle = '#FFF'; [[.2, .3], [.7, .22]].forEach(([fx, fy]) => { const x = Math.round(fx * pw - lt * 6), y = Math.round(fy * ph); g.fillRect(x, y, 10, 3); g.fillRect(x + 2, y - 2, 6, 2); });
      const sx = Math.round(pw * .9 - p * pw * .75), jmp = Math.sin(Math.PI * clamp((p - .3) / .4)), hy = gy - 8 - Math.round(jmp * 14), hx = Math.round(pw * .3);
      g.fillStyle = '#FFF'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(sx + i * 4, gy); g.lineTo(sx + i * 4 + 2, gy - 6); g.lineTo(sx + i * 4 + 4, gy); g.fill(); }
      g.fillStyle = '#E40058'; g.fillRect(hx - 3, hy, 6, 6); g.fillStyle = '#FCB8A0'; g.fillRect(hx - 2, hy - 4, 5, 4); g.fillStyle = '#000'; g.fillRect(hx + 1, hy - 3, 1, 1);
      g.fillStyle = '#3030C0'; const step = Math.floor(lt * 10) % 2; g.fillRect(hx - 3 + step, hy + 6, 2, 2); g.fillRect(hx + 1 - step, hy + 6, 2, 2);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(s.px, 0, 0, pw * 12, ph * 12); ctx.imageSmoothingEnabled = true;
      ctx.fillStyle = '#FFF'; ctx.font = `${30 * u}px 'Press Start 2P'`; ctx.textAlign = 'left'; ctx.fillText('SCORE 0' + (300 + Math.floor(p * 200)), 40 * u, 90 * u);
      big('跳！', '#FCFC54', `900 ${200 * u}px 'Noto Sans SC'`, '#000');
      timer('#FCFC54', 'rgba(0,0,0,.3)'); verdict(WIN[2]);
    } else if (k === 3) {   // 霓虹：躲！
      ctx.fillStyle = '#07040F'; ctx.fillRect(0, 0, W, H);
      const glow = (fn, col, w) => { ctx.save(); ctx.strokeStyle = col; ctx.shadowColor = col; ctx.lineCap = 'round'; [24, 10, 0].forEach((b, i) => { ctx.shadowBlur = b * u; ctx.lineWidth = (i === 2 ? w * .4 : w) * u; ctx.beginPath(); fn(); ctx.stroke(); }); ctx.restore(); };
      const ly = lerp(-60 * u, H + 60 * u, p * 1.15);
      glow(() => { ctx.moveTo(0, ly); ctx.lineTo(W, ly); }, '#FF2E88', 10);
      const sx = cx + eOutCubic(inv(.62, .8, p)) * 260 * u, sy = cy + 120 * u;   // 躲慢了：激光扫到才往旁边跳
      glow(() => { ctx.arc(sx, sy - 120 * u, 34 * u, 0, TAU); ctx.moveTo(sx, sy - 86 * u); ctx.lineTo(sx, sy + 20 * u); ctx.moveTo(sx - 60 * u, sy - 50 * u); ctx.lineTo(sx + 60 * u, sy - 50 * u); ctx.moveTo(sx, sy + 20 * u); ctx.lineTo(sx - 40 * u, sy + 100 * u); ctx.moveTo(sx, sy + 20 * u); ctx.lineTo(sx + 40 * u, sy + 100 * u); }, ly > sy - 160 * u && ly < sy + 110 * u ? '#FF2E88' : '#2EF2FF', 8);
      big('躲！', '#2EF2FF', `900 ${200 * u}px 'Noto Sans SC'`);
      timer('#2EF2FF', 'rgba(255,255,255,.1)'); verdict(WIN[3]);
    } else {   // 总分
      const q = eOutBack(inv(4.4, 4.65, t));
      ctx.fillStyle = '#FFD23F'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#111'; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + t; ctx.globalAlpha = .08; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, LONG, a, a + TAU / 48); ctx.fill(); } ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(q, q); ctx.textAlign = 'center';
      ctx.font = `${300 * u}px 'Bangers'`; ctx.lineWidth = 16 * u; ctx.strokeStyle = '#111'; ctx.strokeText('3 / 4', 0, 40 * u); ctx.fillStyle = '#FF4F4F'; ctx.fillText('3 / 4', 0, 40 * u);
      ctx.fillStyle = '#111'; ctx.font = `900 ${80 * u}px 'Noto Sans SC'`; ctx.fillText('通关 3 关', 0, 170 * u); ctx.restore();
    }
    // 关卡号
    if (!end) { ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, W - 230 * u, 50 * u, 190 * u, 70 * u, 35 * u); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.font = `900 ${38 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText(`第 ${k + 1} 关`, W - 135 * u, 98 * u); }
  }
});
