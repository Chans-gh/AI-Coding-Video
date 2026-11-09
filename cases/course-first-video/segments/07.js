// 第 7 段 原理：前半「值也可以来自真实数据」——先是三张值卡（颜色、文字、时长）跟着旁白亮起；说到「西雅图」变成 NOAA 的
// 12 个月平均降水柱状图（T 类数据，D3 式按代码画），游标逐月走，右边是课上成片按这个月雨量（P.rain = 毫米 / 100）出的降水帧；
// 后半是风格包「分镜换画风」：生图提示词拆成镜头段、风格段、约束段（原文从 assets.json 读），只换风格段，3 个镜头 × 3 种画风排成九宫格。
const ROWS = [['photo', '写实'], ['watercolor', '水彩'], ['clay', '黏土']];
scene({
  id: 'course-first-video:7', name: '原理',
  needs: ['common.js'],
  fonts: ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() {
    const A = JSON.parse(await xhr(`${DIR}/assets.json`)).items;
    const pr = f => A.find(a => a.file === `assets/swap/${f}.jpg`).prompt;
    const split = p => { const i = p.indexOf('画风：'), j = p.indexOf('。', p.indexOf('画风：')) + 1; return [p.slice(0, i), p.slice(i, j), p.slice(j)]; };
    const parts = ROWS.map(([k]) => split(pr(`${k}-s1`)));
    await L.init(parts.flat().join(''));
    const img = {};
    for (let m = 1; m <= 12; m++) img[`m${m}`] = await loadImage(`rain/m${String(m).padStart(2, '0')}.jpg`);
    for (const [k] of ROWS) for (let n = 1; n <= 3; n++) img[`${k}-s${n}`] = await loadImage(`swap/${k}-s${n}.jpg`);
    const mm = (await loadText('rain-seattle.csv')).trim().split('\n').slice(1).map(l => +l.split(',')[1]);
    return { img, parts, mm };
  },
  draw(ctx, t, s) {
    const { u, K, F } = L;
    L.bg(ctx);
    const tB = L.cue('AI 生成的画面'), tD = L.cue('西雅图'), bA = smooth(tB - .5, tB + .2, t);
    if (bA < 1) {
      ctx.save(); ctx.globalAlpha = 1 - bA;
      L.title(ctx, t < tD ? '画面里的每样东西，都是一个值' : '值也可以来自真实数据', 80 * u, 170 * u, 64);
      const chart = eInOutCubic(inv(tD - .3, tD + .5, t));
      // 前：三张值卡
      if (chart < 1) {
        const cards = [['颜色', "sky: ['#7FD4FF', '#DFF6FF']", L.cue('颜色')], ['文字', "title: '水循环'", L.cue('文字')], ['时长', 'dur: 15', L.cue('时长')]];
        cards.forEach(([n, v, at], i) => {
          const p = t - at; if (p < 0) return;
          const x = 80 * u, y = 250 * u + i * 190 * u, e = L.pop(p);
          ctx.save(); ctx.globalAlpha *= clamp(p / .25) * (1 - chart); ctx.translate(x, y + (1 - e) * 20 * u);
          L.card(ctx, 0, 0, 900 * u, 160 * u, { edge: K.C });
          ctx.fillStyle = K.C; ctx.font = F(900, 44); ctx.textBaseline = 'middle'; ctx.fillText(n, 40 * u, 80 * u);
          ctx.fillStyle = K.term; rr(ctx, 180 * u, 40 * u, 680 * u, 80 * u, 12 * u); ctx.fill();
          L.codeLine(ctx, v, 210 * u, 80 * u, 30); ctx.restore();
        });
        if (t > L.cue('真实数据')) { ctx.save(); ctx.globalAlpha *= L.fadeIn(t - L.cue('真实数据')) * (1 - chart); L.chip(ctx, 'T', 80 * u, 850 * u, { label: '这些值，也可以直接来自真实数据' }); ctx.restore(); }
      }
      // 后：12 个月降水柱状图 + 这个月的画面
      const month = t < tD + .8 ? -1 : Math.min(11, Math.floor((t - tD - .8) / .15));
      const hiW = smooth(L.cue('冬天') - .1, L.cue('冬天') + .3, t), hiS = smooth(L.cue('夏天') - .1, L.cue('夏天') + .3, t);
      const show = month < 0 ? 10 : t > L.cue('夏天') ? 6 : t > L.cue('冬天') ? 10 : month;
      if (chart > 0) {
        ctx.save(); ctx.globalAlpha *= chart;
        const gx = 110 * u, gy = 300 * u, gw = 900 * u, gh = 440 * u, bw = gw / 12;
        ctx.fillStyle = K.soft; ctx.font = F(400, 24, L.MONO); ctx.textBaseline = 'middle';
        ctx.fillText('rain-seattle.csv · 1991–2020 各月平均降水（毫米）', gx, gy - 50 * u);
        ctx.strokeStyle = K.line; ctx.lineWidth = 2 * u;
        [0, 50, 100, 150].forEach(v => { const y = gy + gh - gh * v / 170; ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke(); ctx.fillStyle = K.soft; ctx.textAlign = 'right'; ctx.fillText(String(v), gx - 12 * u, y); ctx.textAlign = 'left'; });
        s.mm.forEach((v, i) => {
          const grow = eOutCubic(clamp((t - tD - i * .04) / .6)), h = gh * v / 170 * grow, x = gx + i * bw + 8 * u, y = gy + gh - h;
          const winter = [0, 10, 11].includes(i), summer = [6, 7].includes(i);
          ctx.fillStyle = i === show ? K.T : winter && hiW > 0 && !hiS ? K.blue : summer && hiS > 0 ? K.G : '#9DB7D8';
          rr(ctx, x, y, bw - 16 * u, h, 6 * u); ctx.fill();
          ctx.fillStyle = K.soft; ctx.textAlign = 'center'; ctx.font = F(400, 22, L.MONO); ctx.fillText(String(i + 1), x + (bw - 16 * u) / 2, gy + gh + 28 * u);
          if (i === show) { ctx.fillStyle = K.ink; ctx.font = F(700, 26, L.MONO); ctx.fillText(String(v), x + (bw - 16 * u) / 2, y - 22 * u); }
          ctx.textAlign = 'left';
        });
        ctx.fillStyle = K.soft; ctx.font = F(400, 22); ctx.fillText('月', gx + gw + 12 * u, gy + gh + 28 * u);
        L.chip(ctx, 'T', gx, gy + gh + 70 * u, { label: '数据 · NOAA 美国国家环境信息中心' });
        // 右：这个月的画面
        const ix = 1090 * u, iw = 750 * u, ih = iw * 9 / 16, iy = 250 * u, m = show;
        ctx.save(); rr(ctx, ix, iy, iw, ih, 14 * u); ctx.clip(); drawCover(ctx, s.img[`m${m + 1}`], ix, iy, iw, ih); ctx.restore();
        L.chip(ctx, 'C', ix + 16 * u, iy + 16 * u, { label: `${m + 1} 月 · ${s.mm[m]} 毫米`, s: .9 });
        ctx.fillStyle = K.term; rr(ctx, ix, iy + ih + 30 * u, iw, 80 * u, 12 * u); ctx.fill();
        L.codeLine(ctx, `rain: ${(s.mm[m] / 100).toFixed(2)},   // ${m + 1} 月降水 / 100`, ix + 28 * u, iy + ih + 70 * u, 28);
        ctx.fillStyle = K.soft; ctx.font = F(400, 26); ctx.textBaseline = 'middle'; ctx.fillText('同一份场景代码，只换这一个值', ix, iy + ih + 150 * u);
        ctx.restore();
      }
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
        ctx.fillStyle = K.ink; ctx.font = F(400, 24);
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
