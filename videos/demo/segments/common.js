// 三段共用的全片统一：色板、背景、字幕、段首段尾的淡入淡出（unify）。各段 needs 它
const BG = '#101418', BRAND = '#2F6FEB', GOLD = '#F2B33D', INK = '#E9EEF5';
const U = SHORT / 1080;
function backdrop(ctx, t) {                     // 缓慢流动的网格，贯穿全片
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); grid(ctx, t);
}
function grid(ctx, t) {
  ctx.strokeStyle = 'rgba(47,111,235,.14)'; ctx.lineWidth = 2 * U;
  const g = 90 * U, off = (t * 18 * U) % g;
  for (let x = -g + off; x < W + g; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = -g + off * .6; y < H + g; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}
function subtitle(ctx, t) {
  const s = subAt(t); if (!s) return;
  caption(ctx, s.text, { size: 44, bg: 'rgba(0,0,0,.5)', alpha: 1 });
}
function edgesFade(ctx, t) {                    // 转场：前后段各管一半，淡到底色（不淡到黑）
  const a = Math.max(1 - t / .35, 1 - (SEG.dur - t) / .35, 0);
  if (a > 0) { ctx.globalAlpha = clamp(a); backdrop(ctx, t); ctx.globalAlpha = 1; }   // 盖回背景（网格还在），不出黑场
}
function heading(ctx, txt, x, y, size, color, p, align = 'center') {
  ctx.font = `700 ${size * U}px 'Noto Sans SC'`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.globalAlpha = clamp(p); ctx.fillStyle = color;
  ctx.fillText(txt, x, y + (1 - eOutCubic(p)) * 30 * U); ctx.globalAlpha = 1;
}
