// C-168 字雨：等宽字符网格里每列按各自速度落下两串字，列头近白、身后渐暗，字在下落途中按哈希换字；2 秒时一张文字遮罩里的格子一起亮起，雨幕排出隐藏的词，同时镜头缓慢推进、近处一层大字虚焦掠过
// 风格提示词：用字雨风格：纯黑屏幕上一列列绿色等宽字符从上往下坠落，每列最前面的字最亮、近乎白色，身后拖着渐暗的尾巴，字符在下落途中随机换字，各列速度不同，镜头偶尔推进穿过字帘，某一刻雨幕里的字排出一个隐藏的单词或轮廓，配低频电子嗡鸣。
// 题材：电影年代与屏幕科技 · 适合：黑客与 AI 题材、科技片头、数据主题转场
const GLYPHS = '0123456789ABCDEFXZ码字数据流光电零壹算=+<>';
scene({
  id: 'C-168', name: '字雨', dur: 3.5, still: 2.45,
  fonts: ["700 30px 'Noto Sans SC'", "900 30px 'Noto Sans SC'"],
  text: GLYPHS + '代码',
  init() {
    const cs = Math.round(24 * SHORT / 1080), cols = Math.ceil(W / cs) + 1, rows = Math.ceil(H / cs) + 1;
    // 隐藏的词：在列×行大小的小画布上写字，每个像素就是一格
    const m = mk(cols, rows), g = m.getContext('2d');
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (LAND) { g.font = `900 ${Math.round(rows * .62)}px 'Noto Sans SC'`; g.fillText('代码', cols / 2, rows / 2); }
    else { g.font = `900 ${Math.round(cols * .74)}px 'Noto Sans SC'`; g.fillText('代', cols / 2, rows * .36); g.fillText('码', cols / 2, rows * .62); }
    const d = g.getImageData(0, 0, cols, rows).data, mask = new Uint8Array(cols * rows);
    for (let i = 0; i < mask.length; i++) mask[i] = d[i * 4 + 3] > 110 ? 1 : 0;
    return { cs, cols, rows, mask, buf: mk(W, H), near: mk(W, H), lum: new Float32Array(cols * rows), head: new Uint8Array(cols * rows) };
  },
  draw(ctx, t, s, f) {
    const { cs, cols, rows, mask, lum, head, buf } = s;
    lum.fill(0); head.fill(0);
    for (let c = 0; c < cols; c++) for (let k = 0; k < 2; k++) {
      const h = hash1(c * 7 + k * 131);
      const sp = 9 + 20 * hash1(c * 3 + k * 17 + 1), tail = 8 + Math.floor(24 * hash1(c * 5 + k * 29 + 2));
      const per = rows + tail + 8 + Math.floor(30 * hash1(c * 13 + k));
      const hd = (t * sp + h * per * 3) % per - 4;
      for (let d = 0; d < tail; d++) {
        const r = Math.floor(hd) - d; if (r < 0 || r >= rows) continue;
        const i = r * cols + c, a = Math.pow(1 - d / tail, 1.6) * (k ? .7 : 1);
        if (a > lum[i]) lum[i] = a;
        if (d === 0) head[i] = 1;
      }
    }
    const rv = smooth(1.75, 2.25, t) * (1 - smooth(3.0, 3.45, t));      // 隐藏的词亮起又退回雨幕
    if (rv > 0) for (let i = 0; i < mask.length; i++) if (mask[i]) lum[i] = Math.max(lum[i], rv * (.72 + .28 * hash1(i * 3 + Math.floor(t * 14))));
    const g = buf.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.font = `700 ${Math.round(cs * .86)}px 'Noto Sans SC'`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, a = lum[i]; if (a < .04) continue;
      const rate = 2 + 7 * hash2(r, c), id = Math.floor(t * (head[i] ? 18 : rate) + hash2(c, r) * 50);
      const ch = GLYPHS[Math.floor(hash2(c * 13 + id, r * 7) * GLYPHS.length)];
      const inWord = rv > .05 && mask[i];
      g.fillStyle = head[i] ? `rgba(225,255,230,${Math.min(1, a + .15)})` : inWord ? `rgba(150,255,170,${a})` : `rgba(30,235,90,${a})`;
      g.fillText(ch, c * cs + cs / 2, r * cs + cs / 2);
    }
    // 镜头推进：整张字帘放大
    const z = 1 + .22 * eInOutCubic(inv(.3, 3.5, t));
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(buf, 0, 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(7px)'; ctx.globalAlpha = .7; ctx.drawImage(buf, 0, 0);
    ctx.restore();
    // 近处一层大字：快、虚、淡，像镜头穿过字帘
    const n = s.near.getContext('2d'), bc = cs * 3.2; n.clearRect(0, 0, W, H);
    n.font = `700 ${Math.round(bc * .86)}px 'Noto Sans SC'`; n.textAlign = 'center'; n.textBaseline = 'middle';
    const nearA = .25 + .35 * smooth(.8, 2.0, t);
    for (let k = 0; k < 7; k++) {
      const x = (hash1(k * 31 + 5) * 1.1 - .05) * W, sp = 900 + 700 * hash1(k * 9), len = 5 + Math.floor(hash1(k * 4) * 5);
      const hy = ((t * sp * SHORT / 1080 + hash1(k) * H * 2) % (H + len * bc + 400)) - 200;
      for (let d = 0; d < len; d++) {
        n.fillStyle = `rgba(60,255,120,${nearA * (1 - d / len)})`;
        n.fillText(GLYPHS[Math.floor(hash2(k, d + Math.floor(t * 9)) * GLYPHS.length)], x, hy - d * bc);
      }
    }
    ctx.save(); ctx.filter = 'blur(9px)'; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(s.near, 0, 0); ctx.restore();
    vignette(ctx, .7, .35);
  }
});
