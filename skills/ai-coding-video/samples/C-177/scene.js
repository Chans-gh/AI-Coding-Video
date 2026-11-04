// C-177 信号故障（Glitch）：先把一张干净的台标画面画进离屏画布，再在每个节拍重音上按该拍的种子做几道损坏：红绿蓝三通道分开错位、整条横向切片撕开、低分辨率方块拖着上一位置的残影、取一行像素向下拉成竖条纹；第 5 拍整屏冻结在上一拍的画面，强度按指数衰减卡在拍点上
// 风格提示词：用信号故障风格：画面在正常和损坏之间跳动，整条像素被横向错位撕开，红绿蓝通道各自偏移，压缩方块像马赛克一样拖着残影，像素按亮度被拉成竖向条纹，偶尔整屏冻结一帧再跳回，故障严格卡在节拍重音上，配数据噪音和断续的电流声。
// 题材：电影年代与屏幕科技 · 适合：电子音乐 MV、网络安全题材、科技发布转场
const HITS = [0, 1, 2, 3, 4, 5, 6, 7].map(b => ({ b, k: [1, .45, .8, .35, 1, .5, .9, .6][b] }));   // 每拍的故障强度（sound.py 同步）
scene({
  id: 'C-177', name: '信号故障（Glitch）', dur: 3, still: 4 * BEAT + .04,
  fonts: ["900 40px 'Noto Sans SC'", "700 20px 'JetBrains Mono'"],
  text: '信号源已接入正在传输',
  init() { return { A: mk(W, H), C: mk(W, H), ch: [mk(W, H), mk(W, H), mk(W, H)], P: mk(Math.ceil(W / 24), Math.ceil(H / 24)) }; },
  base(g, t) {                                                           // 干净的画面：台标、彩条、转动的圆环
    const u = SHORT / 1080;
    g.fillStyle = '#0b0b14'; g.fillRect(0, 0, W, H);
    const bars = ['#e8e8e8', '#e8d23a', '#3ad0d8', '#3ad85a', '#d83ac8', '#d83a3a', '#3a4ad8'];
    const bh = H * (LAND ? .1 : .07);
    bars.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * W / 7, H - bh, W / 7 + 1, bh); });
    const cx = LAND ? W * .68 : W / 2, cy = LAND ? H * .45 : H * .33, r = SHORT * .26;
    g.lineWidth = 10 * u; g.strokeStyle = '#ff3d5a';
    for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(cx, cy, r, t * 1.2 + k * TAU / 6, t * 1.2 + k * TAU / 6 + .7); g.stroke(); }
    g.lineWidth = 3 * u; g.strokeStyle = '#3ad0d8'; g.beginPath(); g.arc(cx, cy, r * .78, -t * 2, -t * 2 + 4.5); g.stroke();
    g.fillStyle = '#f2f2f2'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `900 ${Math.round(r * .62)}px 'Noto Sans SC'`; g.fillText('信号', cx, cy);
    const tx = LAND ? W * .08 : W * .08, ty = LAND ? H * .3 : H * .66;
    g.textAlign = 'left'; g.font = `700 ${Math.round(30 * u)}px 'JetBrains Mono'`; g.fillStyle = '#3ad0d8';
    g.fillText(`CH-07  ${String(Math.floor(t * 30)).padStart(4, '0')}`, tx, ty);
    g.font = `900 ${Math.round(64 * u)}px 'Noto Sans SC'`; g.fillStyle = '#f2f2f2';
    g.fillText('信号源已接入', tx, ty + 90 * u); g.fillText('正在传输', tx, ty + 175 * u);
    g.fillStyle = '#ff3d5a'; g.fillRect(tx, ty + 230 * u, 260 * u * (.3 + .7 * ((t * .9) % 1)), 8 * u);
  },
  draw(ctx, t, s, f) {
    // 当前拍和故障强度：拍点上猛地出现，约 0.1 秒衰减
    const b = Math.floor(t / BEAT), tb = t - b * BEAT, hit = HITS[b % 8];
    const e = hit.k * Math.exp(-tb / .16) + .1 * Math.pow(hash1(f * 3), 3);
    const frozen = b === 5 && tb < BEAT * .8;
    const A = s.A.getContext('2d');
    this.base(A, frozen ? 5 * BEAT - .02 : t);
    const R = mulberry32(b * 101 + (tb > .12 ? 7 : 0) + (frozen ? Math.floor(tb * 15) : 0)), u = SHORT / 1080;
    // 1) 通道分离
    const C = s.C.getContext('2d'), d = e * 34 * u;
    if (e > .08) {
      C.globalCompositeOperation = 'source-over'; C.fillStyle = '#000'; C.fillRect(0, 0, W, H);
      ['#ff0000', '#00ff00', '#0000ff'].forEach((col, i) => {
        const g = s.ch[i].getContext('2d');
        g.globalCompositeOperation = 'source-over'; g.drawImage(s.A, 0, 0);
        g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, W, H);
        C.globalCompositeOperation = 'lighter'; C.drawImage(s.ch[i], [d, 0, -d][i], [0, d * .3, -d * .2][i]);
      });
      C.globalCompositeOperation = 'source-over';
    } else { C.globalCompositeOperation = 'source-over'; C.drawImage(s.A, 0, 0); }
    ctx.drawImage(s.C, 0, 0);
    if (e > .15) {
      // 2) 横向切片撕开
      for (let k = 0; k < Math.floor(e * 16); k++) {
        const y = R() * H, h = (.005 + R() * .07) * H, dx = (R() - .5) * e * W * .35;
        ctx.drawImage(s.C, 0, y, W, h, dx, y, W, h);
      }
      // 3) 压缩方块：低分辨率的块，取自偏移的位置（残影）
      const P = s.P.getContext('2d'); P.imageSmoothingEnabled = true; P.drawImage(s.C, 0, 0, s.P.width, s.P.height);
      ctx.imageSmoothingEnabled = false;
      for (let k = 0; k < Math.floor(e * 22); k++) {
        const bw = (2 + Math.floor(R() * 8)) * 24, bh = (1 + Math.floor(R() * 4)) * 24, x = Math.floor(R() * W / 24) * 24, y = Math.floor(R() * H / 24) * 24;
        const lag = (R() - .5) * 8 * 24;
        ctx.drawImage(s.P, (x + lag) / 24, y / 24, bw / 24, bh / 24, x, y, bw, bh);
      }
      ctx.imageSmoothingEnabled = true;
      // 4) 像素拉成竖条纹：取一行像素向下拉长
      for (let k = 0; k < Math.floor(e * 10); k++) {
        const x = R() * W, w = (10 + R() * 140) * u, y = R() * H * .8, len = (.1 + R() * .5) * H;
        ctx.drawImage(s.C, x, y, w, 1, x, y, w, len);
      }
    }
    // 扫描线和细雪花
    ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    if (e > .3) for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(255,255,255,${.15 + .3 * R()})`; ctx.fillRect(0, R() * H, W, (1 + R() * 3) * u); }
    if (frozen) { ctx.fillStyle = '#ff3d5a'; ctx.font = `700 ${Math.round(28 * u)}px 'JetBrains Mono'`; ctx.textAlign = 'right'; ctx.fillText('|| FREEZE', W - 40 * u, 60 * u); }
    vignette(ctx, .5, .45);
  }
});
