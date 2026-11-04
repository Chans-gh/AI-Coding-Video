// C-169 光标打字：一张操作表按“打字、停顿、删字、标记、换行”排出每个按键的时刻，按 t 找到当时屏幕上的文字，光标在打字时常亮、停下时闪烁，关键词下面刷出荧光笔，换行时整页上滚
// 风格提示词：用光标打字风格：大片留白的纸色页面上只有一行等宽或衬线文字，一个闪烁的竖线光标逐字打出句子，偶尔停顿、删掉几个字再改写，节奏像真人在犹豫，关键词打完后被高亮或加粗，整页上滚换到下一句，声音只有清脆的键盘声和换行时的一声叮。
// 题材：平面设计与动态排版 · 适合：独白与书信、产品文案演示、悬念开场
// 操作表（sound.py 里有同样的一份，改一处要同步改另一处）
const OPS = [['wait', .3], ['type', '每一帧，都由'], ['wait', .4], ['del', 2], ['wait', .15], ['type', '只由时间决定。'],
  ['mark', .55], ['scroll', .4], ['type', '所以它永远可以重来。']];
const KEYWORD = '时间';
function typingPlan() {
  const jit = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  let t = 0, k = 0; const lines = [''], ev = [{ t: -1, kind: 'start', lines: [''] }];
  for (const [op, a] of OPS) {
    if (op === 'wait') t += a;
    else if (op === 'type') for (const ch of a) { t += .06 + .06 * jit(k++); lines[lines.length - 1] += ch; ev.push({ t, kind: 'key', lines: [...lines] }); }
    else if (op === 'del') for (let i = 0; i < a; i++) { t += .07; lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1); ev.push({ t, kind: 'del', lines: [...lines] }); }
    else if (op === 'mark') { ev.push({ t: t + .1, kind: 'mark', lines: [...lines] }); t += a; }
    else if (op === 'scroll') { lines.push(''); ev.push({ t, kind: 'scroll', lines: [...lines] }); t += a; }
  }
  return ev;
}
scene({
  id: 'C-169', name: '光标打字', dur: 4.5, still: 4.2,
  fonts: ["700 60px 'Noto Serif SC'", "400 24px 'Noto Sans SC'"],
  text: '每一帧，都由只时间决定。所以它永远可以重来草稿第稿·',
  init() { return { ev: typingPlan(), paper: makePaper('#f3eee4', { grain: 10, blot: 8, seed: 5 }) }; },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, fs = Math.round((LAND ? 118 : 80) * u), lh = fs * 1.9;
    ctx.drawImage(s.paper, 0, 0, W, H);
    // 页眉：文件名和字数，像编辑器
    ctx.fillStyle = 'rgba(60,55,45,.45)'; ctx.font = `400 ${Math.round(24 * u)}px 'Noto Sans SC'`; ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left'; ctx.fillText('草稿 · 第 3 稿', 64 * u, 80 * u);
    let cur = s.ev[0], last = -9, scrollT = null, markT = null;
    for (const e of s.ev) {
      if (e.t > t) break;
      cur = e;
      if (e.kind === 'key' || e.kind === 'del') last = e.t;
      if (e.kind === 'scroll') scrollT = e.t;
      if (e.kind === 'mark') markT = e.t;
    }
    const n = cur.lines.length;
    ctx.textAlign = 'right'; ctx.fillText(`${cur.lines.join('').length} 字`, W - 64 * u, 80 * u);
    ctx.font = `700 ${fs}px 'Noto Serif SC'`; ctx.textAlign = 'left';
    const finalW = Math.max(ctx.measureText('每一帧，都只由时间决定。').width, ctx.measureText('所以它永远可以重来。').width);
    const x0 = (W - finalW) / 2, y0 = LAND ? H * .56 : H * .52;
    const sh = scrollT === null ? 0 : lh * (1 - eInOutCubic((t - scrollT) / .4));
    for (let j = 0; j < n; j++) {
      const y = y0 - (n - 1 - j) * lh + sh, old = j < n - 1;
      const txt = cur.lines[j];
      if (j === 0 && markT !== null) {                          // 荧光笔：从左往右刷过关键词
        const i = txt.indexOf(KEYWORD);
        if (i >= 0) {
          const a = x0 + ctx.measureText(txt.slice(0, i)).width, w = ctx.measureText(KEYWORD).width, p = eOutCubic((t - markT) / .3);
          ctx.fillStyle = 'rgba(255,205,60,.62)';
          ctx.beginPath(); ctx.moveTo(a - 6 * u, y + fs * .18); ctx.lineTo(a - 2 * u, y - fs * .62);
          ctx.lineTo(a + (w + 10 * u) * p, y - fs * .66); ctx.lineTo(a + (w + 6 * u) * p, y + fs * .14); ctx.fill();
        }
      }
      ctx.fillStyle = old ? 'rgba(40,36,30,.42)' : '#24201b';
      ctx.fillText(txt, x0, y);
    }
    // 光标：打字时常亮，停下 0.4 秒后开始闪
    const idle = t - last, on = idle < .4 || Math.floor((idle - .4) / .5) % 2 === 1;
    if (on) {
      const cx = x0 + ctx.measureText(cur.lines[n - 1]).width + 6 * u;
      ctx.fillStyle = '#c4462c'; ctx.fillRect(cx, y0 - fs * .86 + sh, Math.max(3, fs * .07), fs * 1.08);
    }
  }
});
