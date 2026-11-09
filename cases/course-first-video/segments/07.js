// 第 7 段 原理：左边是课上那份场景代码的参数块，「颜色、文字、时长」依次高亮；天空那一行的值换三次，右边是三次各自出的画面（本仓库代码渲染）；
// 后半是风格包「分镜换画风」：生图提示词拆成镜头段、风格段、约束段（原文从 assets.json 读），只换风格段，3 个镜头 × 3 种画风排成九宫格。
const SKY = [['白天', "['#7FD4FF', '#DFF6FF']", 'var-day.jpg'], ['黄昏', "['#FF8E6E', '#FFE2B8']", 'var-dusk.jpg'], ['夜晚', "['#152A5C', '#5468B0']", 'var-night.jpg']];
const ROWS = [['photo', '写实'], ['watercolor', '水彩'], ['clay', '黏土']];
scene({
  id: 'course-first-video:7', name: '原理',
  needs: ['common.js'],
  fonts: L.FONTS,
  async init() {
    const A = JSON.parse(await xhr(`${DIR}/assets.json`)).items;
    const pr = f => A.find(a => a.file === `assets/swap/${f}.jpg`).prompt;
    const split = p => { const i = p.indexOf('画风：'), j = p.indexOf('。', p.indexOf('画风：')) + 1; return [p.slice(0, i), p.slice(i, j), p.slice(j)]; };
    const parts = ROWS.map(([k]) => split(pr(`${k}-s1`)));
    await L.init(parts.flat().join(''));
    const img = {};
    for (const [, , f] of SKY) img[f] = await loadImage(f);
    for (const [k] of ROWS) for (let n = 1; n <= 3; n++) img[`${k}-s${n}`] = await loadImage(`swap/${k}-s${n}.jpg`);
    return { img, parts };
  },
  draw(ctx, t, s) {
    const { u, K, F } = L;
    L.bg(ctx);
    const tB = L.cue('AI 生成的画面'), tSky = L.cue('把天空的颜色'), bA = smooth(tB - .5, tB + .2, t);
    if (bA < 1) {
      ctx.save(); ctx.globalAlpha = 1 - bA;
      L.title(ctx, '改一个值，重出一版', 80 * u, 170 * u, 64);
      // 当前天空：说到「把天空的颜色」后每 1.4 秒换一个值
      const k = t < tSky + .8 ? 0 : Math.min(2, 1 + Math.floor((t - tSky - .8) / 1.6));
      const kt = t < tSky + .8 ? 0 : (t - tSky - .8) - (k - 1) * 1.6;
      const code = [
        ['const P = {'], ['  sky: ' + SKY[k][1] + ',', 'c'], ["  sea: ['#2E86DE', '#1B4F9C'],"], ["  hill: '#3BB273', sun: '#FFC93C',"],
        ["  title: '水循环', steps: ['蒸发', '凝结', '降水', '汇流'],", 'w'], ['};'], [''], ["scene({ id: 'C-038', dur: 15, still: 13.5,", 'd'],
      ];
      const hlAt = { c: L.cue('颜色'), w: L.cue('文字'), d: L.cue('时长') };
      const cx = 80 * u, cy = 230 * u, cw = 960 * u, lh = 52 * u;
      ctx.fillStyle = K.term; rr(ctx, cx, cy, cw, 500 * u, 16 * u); ctx.fill();
      ctx.font = F(400, 24, L.MONO); ctx.fillStyle = K.gray; ctx.textBaseline = 'middle'; ctx.fillText('C-038/scene.js', cx + 28 * u, cy + 30 * u);
      code.forEach(([l, tag], i) => {
        const y = cy + 80 * u + i * lh;
        if (tag) {
          const on = t > hlAt[tag] && (tag === 'c' ? true : t < tSky);
          const flash = tag === 'c' && t > tSky + .8 ? Math.max(0, 1 - kt / .5) : 0;
          if (on) { ctx.fillStyle = `rgba(255,224,102,${.22 + .4 * flash})`; ctx.fillRect(cx + 10 * u, y - lh / 2, cw - 20 * u, lh); }
        }
        L.codeLine(ctx, l, cx + 28 * u, y, 25);
      });
      // 右：这一版的画面；下：三版并排
      const ix = 1090 * u, iw = 750 * u, ih = iw * 9 / 16;
      ctx.save(); rr(ctx, ix, cy, iw, ih, 14 * u); ctx.clip(); drawCover(ctx, s.img[SKY[k][2]], ix, cy, iw, ih);
      if (kt < .35 && t > tSky + .8) { ctx.fillStyle = `rgba(255,255,255,${1 - kt / .35})`; ctx.fillRect(ix, cy, iw, ih); }
      ctx.restore();
      L.chip(ctx, 'C', ix + 16 * u, cy + 16 * u, { label: `第 ${k + 1} 版 · ${SKY[k][0]}`, s: .9 });
      if (t > tSky + .8) SKY.forEach(([n, , f], i) => {
        if (i > k) return;
        const w = 340 * u, h = w * 9 / 16, x = 1090 * u + i * 380 * u - (i === 0 ? 0 : 0), y = 780 * u;
        if (x + w > W) return;
        ctx.save(); ctx.globalAlpha *= L.fadeIn(t - tSky - .8 - i * 1.6); rr(ctx, x, y, w, h, 10 * u); ctx.clip(); drawCover(ctx, s.img[f], x, y, w, h); ctx.restore();
        ctx.fillStyle = K.ink; ctx.font = F(700, 26); ctx.fillText(n, x, y - 22 * u);
      });
      if (t > L.cue('别的都不动')) { ctx.fillStyle = K.soft; ctx.font = F(400, 30); ctx.fillText('只改了第 2 行，别的都不动', 80 * u, 790 * u); }
      ctx.restore();
    }
    if (bA > 0) {
      ctx.save(); ctx.globalAlpha = bA;
      L.title(ctx, '分镜换画风：只换风格段', 80 * u, 170 * u, 64);
      L.chip(ctx, 'G', W - 520 * u, 122 * u, { label: '风格包 style-swap · AI 生图' });
      // 提示词三段
      const segAt = [L.cue('镜头段'), L.cue('风格段'), L.cue('约束段')], cols = [K.C, K.G, K.T], names = ['镜头段', '风格段', '约束段'];
      const tOne = L.cue('分镜只有一份'), rAt = ROWS.map(([, n]) => L.cue(n)), r = rAt.filter(a => t > a - .1).length - 1;
      const cur = s.parts[Math.max(0, r)];
      const px = 80 * u, py = 220 * u, pw = W - 160 * u, ph = 170 * u, ws = [.42, .3, .28];
      let x = px;
      names.forEach((n, i) => {
        const w = pw * ws[i] - 12 * u, p = t - segAt[i]; if (p < -.2) { x += pw * ws[i]; return; }
        ctx.save(); ctx.globalAlpha *= clamp((p + .2) / .3);
        L.card(ctx, x, py, w, ph, { edge: cols[i], fill: i === 1 && r >= 0 && t - rAt[r] < .4 ? '#FFF4E5' : K.paper });
        ctx.fillStyle = cols[i]; ctx.font = F(900, 30); ctx.textBaseline = 'middle'; ctx.fillText(n + (i === 1 ? '（只换这一段）' : ''), x + 30 * u, py + 36 * u);
        ctx.fillStyle = K.ink; ctx.font = F(400, 22);
        wrapCJK(ctx, cur[i], w - 60 * u).slice(0, 3).forEach((l, j) => ctx.fillText(l, x + 30 * u, py + 76 * u + j * 32 * u));
        ctx.restore(); x += pw * ws[i];
      });
      // 九宫格：一行一种画风，一列一个镜头
      if (t > tOne - .2) {
        const gx = 360 * u, gy = 440 * u, cw = 380 * u, chh = cw * 9 / 16 * .78, gap = 14 * u;
        ctx.fillStyle = K.soft; ctx.font = F(700, 26); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ['镜头 1', '镜头 2', '镜头 3'].forEach((n, c) => ctx.fillText(n, gx + c * (cw + gap) + cw / 2, gy - 22 * u));
        ctx.textAlign = 'left';
        ROWS.forEach(([k, n], ri) => {
          const p = t - (ri === 0 ? Math.min(rAt[0], tOne + .6) : rAt[ri]); if (p < 0) return;
          const y = gy + ri * (chh + gap);
          ctx.fillStyle = K.ink; ctx.font = F(900, 34); ctx.fillText(n, 160 * u, y + chh / 2);
          for (let c = 0; c < 3; c++) {
            const q = clamp((p - c * .12) / .3), xx = gx + c * (cw + gap);
            ctx.save(); ctx.globalAlpha *= q; rr(ctx, xx, y + (1 - q) * 20 * u, cw, chh, 10 * u); ctx.clip(); drawCover(ctx, s.img[`${k}-s${c + 1}`], xx, y + (1 - q) * 20 * u, cw, chh); ctx.restore();
          }
        });
      }
      ctx.restore();
    }
    L.frame(ctx, t);
    L.sub(ctx, t);
  }
});
