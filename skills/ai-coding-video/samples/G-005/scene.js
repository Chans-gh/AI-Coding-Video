// G-005 动漫短剧分镜：两张 AI 生成的日式动画画（女主角、进站的小火车）和以女主角图为首帧生成的转头镜头；代码排成漫画分格——格子依次滑入、格内推拉，关键一格整屏放大并加速度线和闪白，对白用气泡，心里话是旁白加竖排字，雨丝由代码画，结尾片名和「下集」字卡
// 素材：生图 ×2、生视频 ×1、语音合成；配乐 CC0
scene({
  id: 'G-005', name: '动漫短剧分镜', dur: 13, still: 5.4,
  fonts: ["700 40px 'Noto Sans SC'", "900 40px 'Noto Serif SC'", "400 40px 'Ma Shan Zheng'", "400 40px 'Noto Sans SC'"],
  text: '雨站你也在等车吗那年夏天的最后一班车我一直没等到后来才知道有些人只会在下雨的时候出现第一话完下集第二班画面生成旁白合成配乐……？',
  async init() {
    return { A: await loadAssets(), girl: await loadImage('girl.jpg'), train: await loadImage('train.jpg'), v: await loadVideo('turn.mp4') };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, M = 28 * u, G = 14 * u;     // 页边、格子间距
    ctx.fillStyle = '#f7f4ee'; ctx.fillRect(0, 0, W, H);
    if (t < 3.7) {
      // ① 第一页：上面一格宽景（车站和火车），下面一格女主角
      const P = LAND ? [[M, M, W - 2 * M, H * .5 - M - G / 2], [M, H * .5 + G / 2, W - 2 * M, H * .5 - M - G / 2]]
                     : [[M, M, W - 2 * M, H * .42], [M, M + H * .42 + G, W - 2 * M, H - 2 * M - H * .42 - G]];
      panel(ctx, s.train, P[0], { fx: .6, fy: .55, zoom: lerp(1.05, 1.15, t / 3.7) }, eOutCubic(inv(0, .6, t)), 'left', u);
      panel(ctx, s.girl, P[1], { fx: .74, fy: .4, zoom: lerp(1.35, 1.2, t / 3.7) }, eOutCubic(inv(.5, 1.1, t)), 'right', u);
      rain(ctx, t, .5, u);
    } else if (t < 8) {
      // ② 关键一格：转头镜头整屏放大，速度线、闪白、对白气泡
      await s.v.at(Math.min((t - 3.7) * 1.05, s.v.dur - .05));
      const k = eOutCubic(inv(3.7, 4.2, t));
      const box = [lerp(M, 0, k), lerp(H * .5, 0, k), lerp(W - 2 * M, W, k), lerp(H * .5 - M, H, k)];
      ctx.save(); ctx.beginPath(); ctx.rect(...box); ctx.clip();
      drawCover(ctx, s.v.el, ...box, { fx: .72, fy: .4, zoom: lerp(1.0, 1.12, inv(3.7, 8, t)) });
      ctx.restore();
      speedLines(ctx, t, smooth(3.7, 3.9, t) * (1 - smooth(4.4, 5.0, t)), u);
      rain(ctx, t, .6, u);
      const fl = 1 - smooth(3.7, 4.0, t); if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
      bubble(ctx, '……你也在等车吗？', LAND ? W * .3 : W * .5, LAND ? H * .3 : H * .22, eOutBack(inv(5.6, 5.9, t)) * (1 - smooth(7.6, 7.9, t)), u);
    } else if (t < 10.6) {
      // ③ 第二页：三格（女主角特写、车灯、她看过来的最后一帧），旁白竖排在最大那格
      await s.v.at(s.v.dur - .1);
      const lt = t - 8, P = LAND
        ? [[M, M, W * .42 - M, H - 2 * M], [W * .42 + G, M, W * .58 - M - G, H * .45], [W * .42 + G, M + H * .45 + G, W * .58 - M - G, H - 2 * M - H * .45 - G]]
        : [[M, M, W - 2 * M, H * .45], [M, M + H * .45 + G, W * .5 - M - G / 2, H * .25], [W * .5 + G / 2, M + H * .45 + G, W * .5 - M - G / 2, H * .25]];
      panel(ctx, s.girl, P[0], { fx: .73, fy: .3, zoom: lerp(2.3, 2.5, lt / 2.6) }, eOutCubic(inv(8, 8.5, t)), 'up', u);
      panel(ctx, s.train, P[1], { fx: .62, fy: .55, zoom: lerp(2.0, 2.2, lt / 2.6) }, eOutCubic(inv(8.25, 8.75, t)), 'right', u);
      panel(ctx, s.v.el, P[2], { fx: .74, fy: .35, zoom: 1.6 }, eOutCubic(inv(8.5, 9.0, t)), 'right', u);
      rain(ctx, t, .35, u);
      const c = cueAt(s.A, t);
      if (c) vertical(ctx, c.text, P[0][0] + P[0][2] - 60 * u, P[0][1] + 50 * u, smooth(8.3, 8.8, t), u);
    } else {
      // ④ 片尾字卡
      ctx.fillStyle = '#0d0f14'; ctx.fillRect(0, 0, W, H);
      rain(ctx, t, .5, u);
      const a = smooth(10.6, 11.3, t);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#f7f4ee'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `400 ${(LAND ? 220 : 240) * u}px 'Ma Shan Zheng'`; ctx.fillText('雨站', W / 2, H * .44);
      ctx.font = `700 ${30 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(247,244,238,.75)'; ctx.fillText('第一话　完', W / 2, H * .44 + 170 * u);
      ctx.globalAlpha = smooth(11.6, 12.1, t); ctx.fillStyle = '#e8b04a'; ctx.font = `900 ${36 * u}px 'Noto Serif SC'`;
      ctx.fillText('下集 ·「第二班车」', W / 2, H * .44 + 240 * u);
      ctx.restore();
    }
    // 旁白字幕（第 ③ 段已竖排在格子里）
    const c = cueAt(s.A, t);
    if (c && (t < 8 || t >= 10.6)) caption(ctx, c.text, { size: LAND ? 36 : 42, bg: null, stroke: '#111', color: '#fff', y: H - (LAND ? 60 : 140) * u });
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = t >= 10.6 ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.45)'; ctx.textAlign = 'right';
    ctx.fillText('原创角色 · ' + credits(s.A), W - 28 * u, H - 8 * u); ctx.restore();
  },
});

// 一格漫画：黑框白边，内容 cover 填满；k 是滑入进度，from 是滑入方向
function panel(ctx, src, [x, y, w, h], o, k, from, u) {
  if (k <= 0) return;
  const d = (1 - k) * 120 * u, dx = from === 'left' ? -d : from === 'right' ? d : 0, dy = from === 'up' ? -d : 0;
  ctx.save(); ctx.globalAlpha = k; ctx.translate(dx, dy);
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.save(); ctx.clip();
  drawCover(ctx, src, x, y, w, h, o); ctx.restore();
  ctx.lineWidth = 5 * u; ctx.strokeStyle = '#111'; ctx.stroke();
  ctx.restore();
}
// 雨丝：斜线，位置由帧号和编号算出
function rain(ctx, t, a, u) {
  ctx.save(); ctx.strokeStyle = `rgba(220,230,255,${a * .5})`; ctx.lineWidth = 1.5 * u;
  ctx.beginPath();
  for (let i = 0; i < 140; i++) {
    const sp = 1.6 + hash1(i * 7 + 1) * 1.2, y = ((hash1(i * 13 + 5) + t * sp) % 1) * (H + 200 * u) - 100 * u, x = hash1(i * 31 + 9) * (W + 200 * u) - 100 * u - y * .18;
    const l = (30 + hash1(i * 3) * 40) * u;
    ctx.moveTo(x, y); ctx.lineTo(x - l * .18, y + l);
  }
  ctx.stroke(); ctx.restore();
}
// 速度线：从画面边缘指向中心的黑色细三角
function speedLines(ctx, t, a, u) {
  if (a <= 0) return;
  ctx.save(); ctx.fillStyle = `rgba(10,10,14,${a * .85})`; const cx = W * (LAND ? .72 : .6), cy = H * .4, R = Math.hypot(W, H);
  for (let i = 0; i < 90; i++) {
    const ang = i / 90 * Math.PI * 2 + hash1(i * 17 + Math.floor(t * 12)) * .05, r0 = SHORT * (.32 + hash1(i * 5 + Math.floor(t * 12)) * .15), wd = .004 + hash1(i * 11) * .01;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
    ctx.lineTo(cx + Math.cos(ang - wd) * R, cy + Math.sin(ang - wd) * R); ctx.lineTo(cx + Math.cos(ang + wd) * R, cy + Math.sin(ang + wd) * R); ctx.fill();
  }
  ctx.restore();
}
// 对白气泡：白底黑边椭圆加尖角，从画外指过来
function bubble(ctx, text, x, y, k, u) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.font = `700 ${(LAND ? 44 : 50) * u}px 'Noto Sans SC'`; const tw = ctx.measureText(text).width, rx = tw / 2 + 50 * u, ry = 70 * u;
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.moveTo(-rx * .5, ry * .7); ctx.lineTo(-rx * 1.0, ry * 2.0); ctx.lineTo(-rx * .2, ry * .9);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 4 * u; ctx.strokeStyle = '#111'; ctx.stroke();
  ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 2 * u);
  ctx.restore();
}
// 竖排心里话：白底小方框，一列一列从右往左
function vertical(ctx, text, x, y, a, u) {
  const fs = (LAND ? 40 : 46) * u, chars = [...text.replace(/[，。]/g, '')], per = 10;
  const cols = Math.ceil(chars.length / per), bw = cols * fs * 1.3 + 30 * u, bh = Math.min(chars.length, per) * fs * 1.12 + 30 * u;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(x - bw + fs * .65 + 15 * u, y - 15 * u, bw, bh);
  ctx.lineWidth = 3 * u; ctx.strokeStyle = '#111'; ctx.strokeRect(x - bw + fs * .65 + 15 * u, y - 15 * u, bw, bh);
  ctx.fillStyle = '#111'; ctx.font = `900 ${fs}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  chars.forEach((ch, i) => ctx.fillText(ch, x - Math.floor(i / per) * fs * 1.3, y + (i % per) * fs * 1.12));
  ctx.restore();
}
