// G-016 分镜表短片：一张分镜表（镜号、景别、画面、旁白）→ 生图出每个镜头的关键帧，其中两格再用图生视频动起来，旁白语音合成；
// 开场先把分镜表本身铺出来（铅笔草图版的四格、景别、时长条），再一格格放大成真正的镜头。
// 每个镜头从哪一秒切，不写死：按旁白的字幕时间来——每个镜头记着它那段旁白的开头几个字，在字幕里找到这句，从这句开始切
// 素材：生图 4 张、生视频 2 段（由第 2、3 格的关键帧生成）、语音合成 1 段；配乐 CC0。故事是原创的
const ZH = '分镜表纸船镜远景特写中景雨夜的老街窗台上一只纸船落进水洼顺着水沟漂下石阶黎明看见海画面旁白时长秒静帧推拉图生视频原创短片雨停之前它从掉了下来又被水流带走一路往下天亮候第次按';
const SHOTS = [
  { img: 's1', size: '远景', desc: '雨夜老街，窗台上的纸船', vo: '雨停', z: [1.0, 1.12], fx: [.45, .55] },
  { img: 's2', vid: 's2v', size: '特写', desc: '纸船落进水洼', vo: '落进' },
  { img: 's3', vid: 's3v', size: '中景', desc: '顺着水沟漂下石阶', vo: '顺着' },
  { img: 's4', size: '远景', desc: '黎明，纸船看见海', vo: '天亮', z: [1.14, 1.0], fx: [.5, .5] },
];
const SHEET = 2.6, END = 13.6;
scene({
  id: 'G-016', name: '分镜表短片', dur: 15, still: 6.4,
  fonts: ["900 40px 'Noto Serif SC'", "700 40px 'Noto Serif SC'", "400 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "500 40px 'JetBrains Mono'"],
  text: ZH,
  async init() {
    const A = await loadAssets();
    const vo = A.items.find(i => i.kind === '语音合成');
    const imgs = await Promise.all(SHOTS.map(s => loadImage(s.img + '.jpg')));
    const vids = await Promise.all(SHOTS.map(s => s.vid ? loadVideo(s.vid + '.mp4') : null));
    // 铅笔草图版：去色、提对比、叠在纸色上
    const sketch = imgs.map(im => {
      const c = mk(480, 270), g = c.getContext('2d');
      g.fillStyle = '#efe8da'; g.fillRect(0, 0, 480, 270);
      g.filter = 'grayscale(1) contrast(1.6) brightness(1.25)'; g.globalCompositeOperation = 'multiply';
      g.drawImage(im, 0, 0, 480, 270); return c;
    });
    // 每个镜头的起止：在旁白字幕里找它那句的开头，第一镜从分镜表放大完开始，最后一镜到落版
    const starts = SHOTS.map((s, i) => i === 0 ? SHEET : vo.at + vo.lines.find(l => l.text.startsWith(s.vo)).t0 - .15);
    const cuts = starts.map((a, i) => [a, i + 1 < starts.length ? starts[i + 1] : END]);
    return { A, vo, imgs, vids, sketch, cuts };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, PAPER = '#efe8da', INK = '#2b2823', RED = '#c0392b';
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    // 分镜表的版式：横屏四格一排，竖屏两两一排
    const cols = LAND ? 4 : 2, gap = 24 * u;
    const cw = (W - 2 * 70 * u - gap * (cols - 1)) / cols, ch = cw * 9 / 16, rowH = ch + 150 * u;
    const top = LAND ? (H - rowH) / 2 + 50 * u : 330 * u;
    const cell = i => [70 * u + (i % cols) * (cw + gap), top + Math.floor(i / cols) * rowH];
    const total = END - SHEET;
    const sheet = (alpha, hi) => {
      ctx.save(); ctx.globalAlpha = alpha; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = INK; ctx.textAlign = 'left';
      ctx.font = `900 ${(LAND ? 60 : 72) * u}px 'Noto Serif SC'`; ctx.fillText('分镜表 · 《纸船》', 70 * u, top - 80 * u);
      ctx.font = `400 ${24 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#6b645a';
      ctx.fillText('4 镜 · 2 格图生视频 · 时长按旁白', 70 * u, top - 34 * u);
      SHOTS.forEach((sh, i) => {
        const k = eOutCubic(inv(.25 + i * .22, .75 + i * .22, t)), [x, y] = cell(i);
        if (k <= 0) return;
        ctx.globalAlpha = alpha * k;
        ctx.drawImage(s.sketch[i], x, y + (1 - k) * 30 * u, cw, ch);
        ctx.strokeStyle = i === hi ? RED : INK; ctx.lineWidth = (i === hi ? 4 : 2) * u; ctx.strokeRect(x, y + (1 - k) * 30 * u, cw, ch);
        ctx.fillStyle = INK; ctx.font = `700 ${(LAND ? 26 : 30) * u}px 'Noto Sans SC'`;
        ctx.fillText(`镜 ${i + 1} · ${sh.size}`, x, y + ch + 40 * u);
        ctx.font = `400 ${(LAND ? 20 : 24) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#4a443c';
        ctx.fillText(sh.desc, x, y + ch + 74 * u);
        const [a, b] = s.cuts[i];
        ctx.fillStyle = sh.vid ? '#2f6f8f' : '#8a7f70';
        ctx.fillText(`${(b - a).toFixed(1)} 秒 · ${sh.vid ? '图生视频' : '静帧推拉'}`, x, y + ch + 106 * u);
        ctx.fillRect(x, y + ch + 120 * u, cw * (b - a) / total * 2.2 * k, 6 * u);
      });
      ctx.restore();
    };
    // 当前镜头
    const cur = s.cuts.findIndex(([a, b]) => t >= a && t < b);
    const shot = async (i, ctx2, x, y, w, h, alpha = 1) => {
      const sh = SHOTS[i], [a, b] = s.cuts[i], p = clamp((t - a) / (b - a), 0, 1);
      if (sh.vid) { const v = s.vids[i]; await v.at(Math.min(Math.max(0, t - a) + .2, v.dur - .05)); drawCover(ctx2, v.el, x, y, w, h, { alpha }); }
      else drawCover(ctx2, s.imgs[i], x, y, w, h, { alpha, zoom: lerp(sh.z[0], sh.z[1], p), fx: lerp(sh.fx[0], sh.fx[1], p) });
    };
    if (t < SHEET) {
      // 分镜表：最后 0.8 秒第一格放大到全屏，草图换成彩色
      const z = eInOutCubic(inv(SHEET - .9, SHEET, t));
      sheet(1 - z, z > 0 ? 0 : -1);
      if (z > 0) {
        const [x, y] = cell(0);
        const R = [lerp(x, 0, z), lerp(y, 0, z), lerp(cw, W, z), lerp(ch, H, z)];
        ctx.save(); ctx.globalAlpha = 1; ctx.drawImage(s.sketch[0], ...((() => { const k = Math.max(R[2] / 16, R[3] / 9); return [R[0] + (R[2] - 16 * k) / 2, R[1] + (R[3] - 9 * k) / 2, 16 * k, 9 * k]; })()));
        ctx.restore();
        await shot(0, ctx, ...R, z);
      }
    } else if (cur >= 0) {
      await shot(cur, ctx, 0, 0, W, H);
      // 切镜：上一镜 0.25 秒溶过来
      const [a] = s.cuts[cur];
      if (cur > 0 && t - a < .25) await shot(cur - 1, ctx, 0, 0, W, H, 1 - (t - a) / .25);
    } else {
      await shot(3, ctx, 0, 0, W, H);
    }
    vignette(ctx, .4, .45);
    ctx.save(); ctx.textBaseline = 'alphabetic';
    // 镜头里的场记：左上角镜号、景别，右上一条四格小分镜，当前格标红
    if (t >= SHEET && t < END + .4) {
      const q = smooth(SHEET, SHEET + .4, t) * (1 - smooth(END, END + .4, t)), i = Math.max(0, cur);
      ctx.globalAlpha = q * .9; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
      ctx.font = `700 ${(LAND ? 30 : 36) * u}px 'Noto Sans SC'`;
      const mx = (LAND ? 60 : 50) * u, my = (LAND ? 70 : 150) * u;
      ctx.fillText(`镜 ${i + 1} · ${SHOTS[i].size}`, mx, my);
      ctx.font = `500 ${(LAND ? 20 : 24) * u}px 'JetBrains Mono'`; ctx.fillStyle = 'rgba(255,255,255,.75)';
      const [a, b] = s.cuts[i];
      ctx.fillText(`${(t - a).toFixed(1).padStart(4, '0')} / ${(b - a).toFixed(1)}s`, mx, my + 36 * u);
      const tw = (LAND ? 64 : 72) * u, th = tw * 9 / 16, tx0 = W - mx - 4 * (tw + 8 * u);
      SHOTS.forEach((_, k) => {
        const x = tx0 + k * (tw + 8 * u);
        ctx.globalAlpha = q * (k === i ? 1 : .55); ctx.drawImage(s.sketch[k], x, my - th, tw, th);
        ctx.strokeStyle = k === i ? RED : 'rgba(255,255,255,.7)'; ctx.lineWidth = (k === i ? 3 : 1.5) * u; ctx.strokeRect(x, my - th, tw, th);
      });
    }
    // 旁白字幕
    const vt = t - s.vo.at, line = s.vo.lines.find(l => vt >= l.t0 - .1 && vt < l.t1 - .1);
    if (line && t < END) {
      ctx.globalAlpha = 1;
      caption(ctx, line.text, { size: (LAND ? 40 : 50) * u, font: 'Noto Serif SC', color: '#fff', bg: null, stroke: 'rgba(0,0,0,.55)',
        y: H - (LAND ? 70 : 380) * u, maxW: W * .86 });
    }
    // 落版：片名
    const e = smooth(END, END + .6, t);
    if (e > 0) {
      ctx.globalAlpha = e * .5; ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = e; ctx.textAlign = 'center'; ctx.fillStyle = '#fff6e8';
      ctx.font = `900 ${(LAND ? 120 : 150) * u}px 'Noto Serif SC'`; ctx.fillText('纸船', W / 2, H * .5);
      ctx.font = `400 ${(LAND ? 28 : 32) * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,246,232,.8)';
      ctx.fillText('一张分镜表 → 原创短片', W / 2, H * .5 + 70 * u);
    }
    ctx.globalAlpha = .6; ctx.textAlign = 'right'; ctx.fillStyle = t < SHEET ? '#6b645a' : '#fff'; ctx.font = `400 ${15 * u}px 'Noto Sans SC'`;
    ctx.fillText(credits(s.A), W - 22 * u, H - 16 * u);
    ctx.restore();
  },
});
