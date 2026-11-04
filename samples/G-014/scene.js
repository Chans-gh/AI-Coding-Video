// G-014 虚构电竞集锦：两段生成的游戏画面（自带音效）剪成一条高光：开场对阵卡，比分条和倒计时一直挂着，击杀时右上弹击杀提示、中间弹大字，底部解说字幕条；两段之间用队色斜切转场，最后定格，四周压暗、只留主角一圈亮，比分翻成 3:2；竖屏时取景跟着爆炸往右移
// 素材：生视频（两段，画面和声音一起生成）；配乐 CC0；队名、选手、赛事全部虚构
const BLUE = '#3aa8ff', ORG = '#ff7a2f', INK = '#0b0f1e';
const TEAMS = [['蓝弧', 'BLA', BLUE], ['赤砂', 'RSD', ORG]];
const A0 = 1.2, B0 = 6.4, FZ = 11.35;              // 两段画面的起点、定格时刻
// 解说字幕：[起, 止, 话]
const CAST = [[1.5, 3.4, '蓝弧 Wren 冲出来了——滑铲！躲开这道光束'], [3.6, 6.1, '起身反手一炮，无人机直接打爆！'],
  [6.8, 8.6, 'Taro 跳上高台，护盾顶住四面火力'], [8.8, 11.2, '一锤砸下去——全被掀飞了！'], [11.6, 13.4, '蓝弧拿下决胜局，3 比 2 夺冠！']];
// 击杀提示：[时刻, 击杀者, 被击杀]
const FEED = [[5.15, 'Wren', '无人机'], [9.05, 'Taro', 'Kiro'], [9.2, 'Taro', 'Ash'], [9.35, 'Taro', 'Moss'], [9.5, 'Taro', 'Pell']];
// 大字：[时刻, 字, 小字]
const BIG = [[5.15, '击毁', 'DRONE DOWN'], [9.1, '四杀', 'QUADRA']];
scene({
  id: 'G-014', name: '虚构电竞集锦', dur: 13.6, still: 9.4,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'"],
  text: '蓝弧赤砂冲出来了滑铲躲开这道光束起身反手一炮无人机直接打爆跳上高台护盾顶住四面火力锤砸下去全被掀飞拿下决胜局比分夺冠击毁四杀星环杯总决赛第本选手',
  async init() {
    const A = await loadAssets();
    return { A, a: await loadVideo('dodge.mp4'), b: await loadVideo('clutch.mp4') };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080;
    ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
    // 画面：开场前 A0 秒和第一段重叠，开场卡盖在上面
    if (t < B0) {
      await s.a.at(t - A0);
      const fx = LAND ? .5 : lerp(.42, .5, smooth(A0, A0 + 2, t)) + .3 * smooth(A0 + 2.6, A0 + 3.6, t);
      drawCover(ctx, s.a.el, 0, 0, W, H, { zoom: 1.04 + .05 * shake(t, 5.15), fx });
    } else {
      const vt = Math.min(t, FZ) - B0;
      await s.b.at(vt);
      const z = 1.03 + .06 * shake(t, 9.0) + (t > FZ ? .08 * eOutCubic(inv(FZ, FZ + .6, t)) : 0);
      if (t < FZ) drawCover(ctx, s.b.el, 0, 0, W, H, { zoom: z, fy: .55 });
      else freeze(ctx, s.b.el, t, z, u);
    }
    // 转场：队色斜切扫过
    wipe(ctx, t, 6.15, BLUE);
    // 击中时的白闪
    for (const k of [5.15, 9.0]) { const f = 1 - smooth(k, k + .18, t); if (t >= k && f > 0) { ctx.fillStyle = `rgba(255,255,255,${f * .55})`; ctx.fillRect(0, 0, W, H); } }
    vignette(ctx, .45);
    if (t < A0 + .5) intro(ctx, t, u);
    if (t > A0 + .2) scorebar(ctx, t, u);
    killfeed(ctx, t, u);
    big(ctx, t, u);
    cast(ctx, t, u);
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('队名、选手、赛事均为虚构 · ' + credits(s.A), W - 24 * u, H - 14 * u); ctx.restore();
  }
});
// 击中瞬间镜头抖一下：返回 0–1 的衰减量
function shake(t, k) { return t < k ? 0 : Math.exp(-(t - k) * 5) * (1 + .3 * Math.sin((t - k) * 60)); }
// 开场对阵卡：两队色块从左右切进来，中间 VS
function intro(ctx, t, u) {
  const p = eOutExpo(inv(0, .5, t)), out = eInCubic(inv(A0 - .15, A0 + .5, t));
  ctx.save();
  ctx.fillStyle = `rgba(11,15,30,${.85 * (1 - out)})`; ctx.fillRect(0, 0, W, H);
  const cy = H / 2, bh = (LAND ? 260 : 300) * u, sk = 80 * u;
  TEAMS.forEach(([zh, ab, col], i) => {
    const dir = i ? 1 : -1, off = (1 - p + out * 1.2) * W * .6 * dir;
    ctx.save(); ctx.translate(off, 0);
    ctx.fillStyle = col; ctx.beginPath();
    const y = i ? cy + 6 * u : cy - bh - 6 * u;
    if (i) { ctx.moveTo(W * .1 + sk, y); ctx.lineTo(W, y); ctx.lineTo(W, y + bh); ctx.lineTo(W * .1, y + bh); }
    else { ctx.moveTo(0, y); ctx.lineTo(W * .9, y); ctx.lineTo(W * .9 - sk, y + bh); ctx.lineTo(0, y + bh); }
    ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.textAlign = i ? 'right' : 'left';
    const x = i ? W * .84 : W * .16;
    ctx.font = `900 ${(LAND ? 120 : 130) * u}px 'Noto Sans SC'`; ctx.fillText(zh, x, y + bh * .45);
    ctx.font = `400 ${54 * u}px 'Bebas Neue'`; ctx.globalAlpha = .8; ctx.fillText(ab, x, y + bh * .82);
    ctx.restore();
  });
  ctx.globalAlpha = p * (1 - out); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `400 ${150 * u}px 'Bebas Neue'`; ctx.lineWidth = 10 * u; ctx.strokeStyle = INK; ctx.strokeText('VS', W / 2, cy + 8 * u);
  ctx.fillStyle = '#fff'; ctx.fillText('VS', W / 2, cy + 8 * u);
  ctx.font = `700 ${34 * u}px 'Noto Sans SC'`; ctx.fillText('星环杯 · 总决赛 第 5 局', W / 2, cy - bh - 60 * u);
  ctx.restore();
}
// 顶部比分条：队名、局数、倒计时；定格后蓝弧的局数翻成 3
function scorebar(ctx, t, u) {
  const p = eOutCubic(inv(A0 + .2, A0 + .6, t)), y = (LAND ? 36 : 140) * u - (1 - p) * 120 * u;
  const bw = (LAND ? 720 : 860) * u, bh = 76 * u, x = W / 2 - bw / 2;
  ctx.save(); ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(8,12,26,.82)'; rr(ctx, x, y, bw, bh, 12 * u); ctx.fill();
  const sc = [2 + (t > FZ + .6 ? 1 : 0), 2];
  TEAMS.forEach(([zh, ab, col], i) => {
    const sx = i ? x + bw - 14 * u : x + 14 * u, dir = i ? -1 : 1;
    ctx.fillStyle = col; ctx.fillRect(i ? x + bw - 10 * u : x, y, 10 * u, bh);
    ctx.textAlign = i ? 'right' : 'left'; ctx.fillStyle = '#fff';
    ctx.font = `700 ${34 * u}px 'Noto Sans SC'`; ctx.fillText(zh, sx + dir * 18 * u, y + bh / 2);
    ctx.font = `400 ${30 * u}px 'Bebas Neue'`; ctx.globalAlpha = .6; ctx.fillText(ab, sx + dir * 100 * u, y + bh / 2 + 2 * u); ctx.globalAlpha = 1;
    // 局数
    const cx = W / 2 + dir * -110 * u, k = i === 0 ? 1 + .4 * Math.sin(Math.PI * inv(FZ + .4, FZ + .9, t)) : 1;
    ctx.save(); ctx.translate(cx, y + bh / 2); ctx.scale(k, k);
    ctx.font = `400 ${64 * u}px 'Bebas Neue'`; ctx.textAlign = 'center'; ctx.fillStyle = i === 0 && t > FZ + .6 ? BLUE : '#fff';
    ctx.fillText(sc[i], 0, 4 * u); ctx.restore();
  });
  // 倒计时：这一局还剩多少
  const left = Math.max(0, 41 - Math.floor(Math.min(t, FZ) - A0));
  ctx.textAlign = 'center'; ctx.font = `400 ${38 * u}px 'Bebas Neue'`; ctx.fillStyle = left < 34 ? '#ffd34d' : '#fff';
  ctx.fillText(`0:${String(left).padStart(2, '0')}`, W / 2, y + bh / 2 + 2 * u);
  ctx.restore();
}
// 右上击杀提示：一条一条从右边滑进来，2.4 秒后退出
function killfeed(ctx, t, u) {
  const live = FEED.filter(([k]) => t >= k && t < k + 2.6);
  ctx.save(); ctx.textBaseline = 'middle';
  live.forEach(([k, who, vic], j) => {
    const p = eOutExpo(inv(k, k + .25, t)), q = smooth(k + 2.3, k + 2.6, t);
    const bw = 360 * u, bh = 52 * u, x = W - 30 * u - bw + (1 - p + q) * (bw + 40 * u), y = (LAND ? 140 : 250) * u + j * (bh + 8 * u);
    ctx.fillStyle = 'rgba(8,12,26,.8)'; rr(ctx, x, y, bw, bh, 8 * u); ctx.fill();
    ctx.fillStyle = BLUE; ctx.fillRect(x, y, 6 * u, bh);
    ctx.font = `700 ${28 * u}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.fillStyle = BLUE; ctx.fillText(who, x + 22 * u, y + bh / 2);
    // 准星图标
    const cx = x + bw / 2 + 10 * u, cy = y + bh / 2; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * u;
    ctx.beginPath(); ctx.arc(cx, cy, 12 * u, 0, TAU); ctx.moveTo(cx - 20 * u, cy); ctx.lineTo(cx + 20 * u, cy); ctx.moveTo(cx, cy - 20 * u); ctx.lineTo(cx, cy + 20 * u); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillStyle = vic === '无人机' ? '#fff' : ORG; ctx.fillText(vic, x + bw - 20 * u, y + bh / 2);
  });
  ctx.restore();
}
// 中间大字：砸进来、抖一下、淡出
function big(ctx, t, u) {
  for (const [k, zh, en] of BIG) {
    if (t < k || t > k + 1.6) continue;
    const p = eOutBack(inv(k, k + .22, t), 2.4), a = 1 - smooth(k + 1.25, k + 1.6, t), sc = lerp(2.2, 1, clamp(p));
    ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H * (LAND ? .42 : .44)); ctx.scale(sc, sc); ctx.rotate(-.06);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${(LAND ? 150 : 170) * u}px 'Noto Sans SC'`;
    ctx.lineWidth = 16 * u; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.strokeText(zh, 0, 0);
    const g = ctx.createLinearGradient(0, -80 * u, 0, 80 * u); g.addColorStop(0, '#fff'); g.addColorStop(1, BLUE); ctx.fillStyle = g; ctx.fillText(zh, 0, 0);
    ctx.font = `400 ${56 * u}px 'Bebas Neue'`; ctx.letterSpacing = `${8 * u}px`; ctx.lineWidth = 10 * u; ctx.strokeText(en, 0, 110 * u); ctx.fillStyle = '#ffd34d'; ctx.fillText(en, 0, 110 * u);
    ctx.restore();
  }
}
// 底部解说字幕条：左边一块「解说」小牌
function cast(ctx, t, u) {
  const c = CAST.find(([a, b]) => t >= a && t < b); if (!c) return;
  const [a, b, txt] = c, p = eOutCubic(inv(a, a + .2, t)) * (1 - smooth(b - .15, b, t));
  ctx.save(); ctx.globalAlpha = p;
  ctx.font = `700 ${(LAND ? 40 : 44) * u}px 'Noto Sans SC'`; ctx.textBaseline = 'middle';
  const lines = wrapCJK(ctx, txt, LAND ? W * .6 : W * .72), lh = (LAND ? 56 : 62) * u, bh = lines.length * lh + 30 * u;
  const tw = Math.max(...lines.map(l => ctx.measureText(l).width)), tag = 120 * u, bw = tw + tag + 50 * u;
  const x = W / 2 - bw / 2, y = H - (LAND ? 70 : 330) * u - bh + (1 - p) * 20 * u;
  ctx.fillStyle = 'rgba(8,12,26,.85)'; rr(ctx, x, y, bw, bh, 12 * u); ctx.fill();
  ctx.fillStyle = '#ffd34d'; rr(ctx, x, y, tag, bh, [12 * u, 0, 0, 12 * u]); ctx.fill();
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.font = `900 ${30 * u}px 'Noto Sans SC'`; ctx.fillText('解说', x + tag / 2, y + bh / 2);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = `700 ${(LAND ? 40 : 44) * u}px 'Noto Sans SC'`;
  lines.forEach((l, i) => ctx.fillText(l, x + tag + 25 * u, y + 15 * u + lh * (i + .5)));
  ctx.restore();
}
// 队色斜切转场：一条斜带从左扫到右，带子正中换画面
function wipe(ctx, t, k, col) {
  const p = inv(k - .2, k + .45, t); if (p <= 0 || p >= 1) return;
  const x = lerp(-W * .6, W * 1.4, eInOutCubic(p)), sk = H * .35, bw = W * .5;
  ctx.save();
  [[col, 0], ['#fff', bw * .82]].forEach(([c, o]) => {
    ctx.fillStyle = c; ctx.beginPath();
    ctx.moveTo(x - bw + o + sk, 0); ctx.lineTo(x + sk, 0); ctx.lineTo(x - sk, H); ctx.lineTo(x - bw + o - sk, H); ctx.fill();
  });
  ctx.restore();
}
// 定格：整帧压暗去色，主角那一圈原色，外面一圈发光描边慢慢转
function freeze(ctx, src, t, z, u) {
  const p = eOutCubic(inv(FZ, FZ + .5, t));
  ctx.save(); ctx.filter = `grayscale(${p * .85}) brightness(${1 - p * .45})`; drawCover(ctx, src, 0, 0, W, H, { zoom: z, fy: .55 }); ctx.restore();
  const cx = W / 2, cy = H * (LAND ? .62 : .56), r = (LAND ? 300 : 340) * u * (1 + .04 * Math.sin(t * 3));
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r * p, 0, TAU); ctx.clip(); drawCover(ctx, src, 0, 0, W, H, { zoom: z, fy: .55 }); ctx.restore();
  ctx.save(); ctx.shadowColor = BLUE; ctx.shadowBlur = 30 * u; ctx.strokeStyle = BLUE; ctx.lineWidth = 8 * u;
  ctx.setLineDash([60 * u, 22 * u]); ctx.lineDashOffset = -t * 120 * u;
  ctx.beginPath(); ctx.arc(cx, cy, r * p + 10 * u, 0, TAU); ctx.stroke(); ctx.restore();
  // 主角名牌
  const a = smooth(FZ + .3, FZ + .7, t);
  ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'middle';
  const nx = LAND ? cx + r + 50 * u : cx - 220 * u, ny = LAND ? cy - 60 * u : cy - r - 150 * u;
  ctx.fillStyle = BLUE; ctx.fillRect(nx, ny - 50 * u, 10 * u, 160 * u);
  ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `900 ${64 * u}px 'Noto Sans SC'`; ctx.fillText('Taro', nx + 30 * u, ny);
  ctx.font = `700 ${30 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText('蓝弧 · 本局 MVP', nx + 30 * u, ny + 56 * u);
  ctx.font = `400 ${34 * u}px 'Bebas Neue'`; ctx.fillStyle = '#ffd34d'; ctx.fillText('4 KILLS · 0 DEATHS', nx + 30 * u, ny + 98 * u);
  ctx.restore();
}
