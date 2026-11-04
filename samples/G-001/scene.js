// G-001 编辑部纸拼贴讲解：两张 AI 生成的纸拼贴插图（深海背景、白底章鱼）由代码抠掉白底、叠成前后两层错开移动；旁白说到「三颗心」「鳃」「全身」「蓝色」「血蓝蛋白」时，代码在图上贴纸心、红笔圈、手写标签和剪报拼字
// 素材：生图 ×2、语音合成；配乐 CC0。关键词时刻用 cueTime 从旁白的逐字时间里取
scene({
  id: 'G-001', name: '编辑部纸拼贴讲解', dur: 14.5, still: 11.2,
  fonts: ["700 40px 'Noto Sans SC'", "900 40px 'Noto Serif SC'", "400 40px 'Ma Shan Zheng'", "700 40px 'JetBrains Mono'"],
  text: '章鱼为什么有三颗心鳃心体心全身血是蓝色的血蓝蛋白含铜示意图画面生成旁白合成配乐',
  async init() {
    const A = await loadAssets();
    const bg = await loadImage('bg.jpg'), raw = await loadImage('octopus.jpg');
    // 抠白底：离白色越远越不透明，边缘留一圈柔和过渡
    const c = document.createElement('canvas'); c.width = raw.width; c.height = raw.height;
    const g = c.getContext('2d'); g.drawImage(raw, 0, 0);
    const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const dist = 255 - Math.min(d[i], d[i + 1], d[i + 2]);
      d[i + 3] = clamp((dist - 14) / 36, 0, 1) * 255;
    }
    g.putImageData(im, 0, 0);
    const T = k => cueTime(A, k, 99);
    return { A, bg, oct: c, t3: T('三颗'), tg: T('鳃'), tb: T('全身'), tblue: T('蓝色'), tcu: T('血蓝蛋白') };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    // 背景层：慢慢横移，和章鱼层错开出纵深
    drawCover(ctx, s.bg, 0, 0, W, H, { zoom: 1.18, fx: lerp(.38, .62, t / 14.5), fy: .5 });
    ctx.fillStyle = 'rgba(4,10,24,.25)'; ctx.fillRect(0, 0, W, H);
    // 章鱼：从上方落进来，之后上下漂浮
    const sz = LAND ? H * .78 : W * .9;
    const drop = eOutBack(inv(.2, 1.3, t));
    const ox = (LAND ? W * .64 : W * .5) + Math.sin(t * .9) * 12 * u - (t / 14.5) * 30 * u;
    const oy = lerp(-sz, LAND ? H * .5 : H * .44, drop) + Math.sin(t * 1.3) * 14 * u;
    const rot = Math.sin(t * .7) * .03 + (1 - drop) * .2;
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30 * u; ctx.shadowOffsetY = 14 * u;
    ctx.drawImage(s.oct, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
    // 章鱼图上的位置（0–1）→ 画面坐标
    const P = (x, y) => { const dx = (x - .5) * sz, dy = (y - .5) * sz; return [ox + dx * Math.cos(rot) - dy * Math.sin(rot), oy + dx * Math.sin(rot) + dy * Math.cos(rot)]; };
    // 标题：两条撕边纸条
    const tIn = eOutCubic(inv(.3, 1.0, t));
    paperStrip(ctx, '章鱼为什么', LAND ? 70 * u : 60 * u, LAND ? 90 * u : 120 * u, 54 * u, '#f3ead6', '#1b1b1b', -.03, tIn, u);
    paperStrip(ctx, '有三颗心？', LAND ? 110 * u : 100 * u, LAND ? 175 * u : 205 * u, 64 * u, '#e8432e', '#fff7e8', .02, eOutCubic(inv(.5, 1.2, t)), u);
    // 三颗纸心：两颗鳃心、一颗体心
    const hearts = [[.38, .3, s.tg, '鳃心'], [.62, .3, s.tg + .25, '鳃心'], [.5, .17, s.tb, '体心']];
    const all = inv(s.t3, s.t3 + .5, t);
    hearts.forEach(([hx, hy, ht, lab], i) => {
      const k = Math.max(eOutBack(inv(s.t3 + i * .15, s.t3 + .45 + i * .15, t)) * .7, eOutBack(inv(ht, ht + .4, t)));
      if (k <= 0) return;
      const [x, y] = P(hx, hy);
      paperHeart(ctx, x, y, 34 * u * k, ht <= t ? '#d6262c' : '#f08a7e', u);
      if (t > ht) {
        const p = inv(ht, ht + .5, t);
        marker(ctx, x, y, 60 * u, p, '#ff3b30', u, i);
        ctx.save(); ctx.globalAlpha = p; ctx.font = `400 ${40 * u}px 'Ma Shan Zheng'`; ctx.fillStyle = '#fff';
        ctx.textAlign = i === 0 ? 'right' : 'left'; ctx.textBaseline = 'middle';
        const lx = x + (i === 0 ? -80 : 80) * u, ly = y - (i === 2 ? 50 : 0) * u;
        ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 8 * u; ctx.fillText(lab + (i < 2 ? ' ×2' : ''), lx, ly);
        ctx.restore();
      }
    });
    if (all > 0 && t < s.tg) {   // 「三颗心」先打一个大号数字
      ctx.save(); ctx.globalAlpha = smooth(s.t3, s.t3 + .3, t) * (1 - smooth(s.tg - .3, s.tg, t));
      ctx.font = `900 ${200 * u}px 'Noto Serif SC'`; ctx.fillStyle = '#ffd34d'; ctx.textAlign = 'center';
      const [x, y] = P(.5, .25); ctx.fillText('3', x - (LAND ? 360 : 0) * u, LAND ? y + 60 * u : y - 200 * u); ctx.restore();
    }
    // 「蓝色」：荧光笔划一道、贴一张便签
    if (t > s.tblue) {
      const p = eOutCubic(inv(s.tblue, s.tblue + .6, t));
      const nx = LAND ? 90 * u : W * .08, ny = LAND ? H * .5 : H * .74;
      ctx.save(); ctx.translate(nx, ny); ctx.rotate(-.04);
      ctx.font = `700 ${54 * u}px 'Noto Sans SC'`;
      ctx.fillStyle = 'rgba(80,170,255,.75)'; ctx.fillRect(-10 * u, 8 * u, (ctx.measureText('血是蓝色的').width + 20 * u) * p, 40 * u); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 6 * u; ctx.globalAlpha = smooth(s.tblue, s.tblue + .3, t);
      ctx.fillText('血是蓝色的', 0, 26 * u); ctx.restore();
    }
    // 「血蓝蛋白」：剪报拼字，一个字一张纸砸下来，再贴一个 Cu
    if (t > s.tcu) {
      const word = ['血', '蓝', '蛋', '白'], cols = [['#111', '#f4e04d'], ['#fff', '#1f5fbf'], ['#111', '#f3ead6'], ['#fff', '#c2272d']];
      const fs = ['Noto Serif SC', 'Noto Sans SC', 'Noto Serif SC', 'Noto Sans SC'];
      const bx = LAND ? 90 * u : W * .12, by = LAND ? H * .64 : H * .81, cell = (LAND ? 104 : 118) * u;
      word.forEach((ch, i) => {
        const k = eOutBack(inv(s.tcu + i * .12, s.tcu + i * .12 + .35, t));
        if (k <= 0) return;
        ctx.save(); ctx.translate(bx + i * cell * 1.06 + cell / 2, by + cell / 2); ctx.rotate((hash1(i * 7.3) - .5) * .22); ctx.scale(k, k);
        ctx.fillStyle = cols[i][1]; ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 10 * u; ctx.shadowOffsetY = 4 * u;
        ctx.fillRect(-cell / 2, -cell / 2, cell, cell); ctx.shadowColor = 'transparent';
        ctx.fillStyle = cols[i][0]; ctx.font = `900 ${cell * .72}px '${fs[i]}'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ch, 0, cell * .04); ctx.restore();
      });
      const k = eOutBack(inv(s.tcu + .7, s.tcu + 1.0, t));
      if (k > 0) {
        ctx.save(); ctx.translate(bx + 4.35 * cell * 1.06 + cell * .4, by + cell * .2); ctx.rotate(.15); ctx.scale(k, k);
        ctx.beginPath(); ctx.arc(0, 0, cell * .46, 0, Math.PI * 2); ctx.fillStyle = '#b87333'; ctx.fill();
        ctx.lineWidth = 4 * u; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = `700 ${cell * .42}px 'JetBrains Mono'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Cu', 0, 0);
        ctx.font = `400 ${26 * u}px 'Ma Shan Zheng'`; ctx.fillText('含铜', 0, cell * .7); ctx.restore();
      }
    }
    // 字幕、署名
    const c = cueAt(s.A, t);
    if (c) caption(ctx, c.text, { size: LAND ? 36 : 42, bg: 'rgba(10,14,24,.72)', y: H - (LAND ? 70 : 150) * u });
    ctx.save(); ctx.font = `400 ${17 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 28 * u, H - 22 * u); ctx.restore();
  },
});

// 撕边纸条：文字压在一条边缘不齐的纸上，k 是出现进度（从左边展开）
function paperStrip(ctx, text, x, y, size, paper, ink, rot, k, u) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = `900 ${size}px 'Noto Serif SC'`;
  const w = ctx.measureText(text).width + size * .8, h = size * 1.35;
  ctx.beginPath(); ctx.rect(-size * .4, -h / 2 - 10, w * k, h + 20); ctx.clip();
  ctx.beginPath(); ctx.moveTo(-size * .4, -h / 2);
  for (let i = 0; i <= 24; i++) ctx.lineTo(-size * .4 + w * i / 24, -h / 2 + (hash1(i * 3.1 + size) - .5) * 8 * u);
  for (let i = 24; i >= 0; i--) ctx.lineTo(-size * .4 + w * i / 24, h / 2 + (hash1(i * 5.7 + size) - .5) * 8 * u);
  ctx.closePath(); ctx.fillStyle = paper; ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 14 * u; ctx.shadowOffsetY = 6 * u; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.fillStyle = ink; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, size * .05);
  ctx.restore();
}
// 纸剪的心：白边 + 红心
function paperHeart(ctx, x, y, r, col, u) {
  const path = s => { ctx.beginPath(); ctx.moveTo(x, y + r * .9 * s);
    ctx.bezierCurveTo(x - r * 1.4 * s, y - r * .1 * s, x - r * .8 * s, y - r * 1.1 * s, x, y - r * .45 * s);
    ctx.bezierCurveTo(x + r * .8 * s, y - r * 1.1 * s, x + r * 1.4 * s, y - r * .1 * s, x, y + r * .9 * s); };
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 8 * u; ctx.shadowOffsetY = 3 * u;
  path(1.25); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.shadowColor = 'transparent';
  path(1); ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
// 红笔圈：手画的不闭合椭圆，p 是画到哪里
function marker(ctx, x, y, r, p, col, u, seed) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 6 * u; ctx.lineCap = 'round'; ctx.beginPath();
  const n = 40, a0 = -1.2 + hash1(seed) * .6;
  for (let i = 0; i <= n * p; i++) {
    const a = a0 + i / n * Math.PI * 2.15, rr = r * (1 + (hash1(seed * 97 + i) - .5) * .08 + i / n * .08);
    const px = x + Math.cos(a) * rr * 1.25, py = y + Math.sin(a) * rr * .9;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke(); ctx.restore();
}
