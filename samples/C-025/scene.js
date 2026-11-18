// C-025 分层卡纸剪纸：Canvas 2D 在 init 里把远山、森林、小屋、前景草丛各剪成一张比画面宽的离屏卡纸（边缘是噪声抖动的剪刀线，再沿边描一道浅色纤维线，纸面叠颗粒），draw 时每层带投影按不同速度横移形成视差；月亮和星星用细线吊着按单摆晃，小女孩是关节式剪纸，四肢和头各自绕铆钉点按正弦转动，边走边过场。
// 风格提示词：用分层卡纸剪纸风格：场景由多层彩色卡纸前后叠成，每层边缘是剪刀剪出的不规则线并露出纸纤维，层与层之间有真实投影，镜头移动时各层形成视差，星星和月亮像用线吊着，角色是关节式剪纸。
// 题材：纸艺、材质与定格 · 适合：童话、情感开场
scene({
  id: 'C-025', name: '分层卡纸剪纸', dur: 4, still: 2.4,
  text: '晚安森林',
  fonts: ["900 40px 'Noto Serif SC'"],
  init() {
    const u = SHORT / 1080, LW = Math.round(W * 1.5);
    const card = (col, seed, fill) => {
      const c = mk(LW, H), g = c.getContext('2d'), R = mulberry32(seed);
      const edge = fill(); g.beginPath(); edge.forEach(([x, y], i) => i ? g.lineTo(x + (R() - .5) * 2 * u, y + (R() - .5) * 2 * u) : g.moveTo(x, y)); g.lineTo(LW, H + 10); g.lineTo(0, H + 10); g.closePath();
      g.fillStyle = col; g.fill(); g.save(); g.clip();
      g.globalAlpha = .08; for (let i = 0; i < 2500; i++) { g.fillStyle = R() < .5 ? '#000' : '#fff'; g.fillRect(R() * LW, R() * H, 2 * u, 2 * u); }   // 纸面颗粒
      g.restore(); g.globalAlpha = .55; g.strokeStyle = '#F4EBDD'; g.lineWidth = 2 * u; g.beginPath(); edge.forEach(([x, y], i) => i ? g.lineTo(x, y + 1.5 * u + (R() - .5) * 2 * u) : g.moveTo(x, y)); g.stroke();
      g.globalAlpha = 1; return c;
    };
    const ridge = (y0, amp, sc, sd) => { const p = []; for (let x = 0; x <= LW; x += 10 * u) p.push([x, y0 - amp * fbm(x / (sc * u) + sd, sd, 3)]); return p; };
    const trees = (y0, h, n, sd) => { const p = [[0, y0]], R = mulberry32(sd); let x = 0; while (x < LW) { const w = (60 + R() * 70) * u, th = h * (.6 + R() * .6) * u; p.push([x, y0], [x + w * .5, y0 - th], [x + w, y0]); x += w * (.85 + R() * .3); } return p; };
    const Y = LAND ? [.62, .7, .8, .86, .95] : [.5, .58, .7, .78, .92], ks = LAND ? 1 : 1.3;
    const L = [
      card('#2E4A7A', 1, () => ridge(H * Y[0], 260 * u * ks, 500, 1)),
      card('#3F6E86', 2, () => ridge(H * Y[1], 200 * u * ks, 300, 5)),
      card('#2F5B4E', 3, () => trees(H * Y[2], 240 * ks, 0, 7)),
      card('#C9876A', 4, () => ridge(H * Y[3], 70 * u, 260, 9)),
      card('#5A8F4E', 5, () => { const p = []; for (let x = 0; x <= LW; x += 14 * u) { const k = x / u / 14; p.push([x, H * Y[4] - (k % 2 ? 40 : 0) * u * (.5 + hash1(k | 0))]); } return p; }),
    ];
    // 小屋：贴在第 4 层上
    const hg = L[3].getContext('2d'), hx = LW * .55, hy = H * Y[3] - 40 * u;
    hg.shadowColor = 'rgba(0,0,0,.35)'; hg.shadowBlur = 8 * u; hg.shadowOffsetY = 6 * u;
    hg.fillStyle = '#E8D6B5'; hg.fillRect(hx - 110 * u, hy - 160 * u, 220 * u, 170 * u);
    hg.fillStyle = '#A5463C'; hg.beginPath(); hg.moveTo(hx - 140 * u, hy - 150 * u); hg.lineTo(hx, hy - 270 * u); hg.lineTo(hx + 140 * u, hy - 150 * u); hg.fill();
    hg.shadowColor = 'transparent'; hg.fillStyle = '#F5C35A'; hg.fillRect(hx - 70 * u, hy - 110 * u, 56 * u, 56 * u); hg.fillRect(hx + 20 * u, hy - 110 * u, 50 * u, 110 * u);
    return { L, LW, Y, paper: makePaper('#16233F', { seed: 25, grain: 10, blot: 4 }) };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, cam = eInOutCubic(t / 4) * (s.LW - W) * .55;
    ctx.drawImage(s.paper, 0, 0, W, H);
    // 吊着的月亮和星星（细线 + 单摆）
    const hang = (x, y, len, ph, draw) => {
      const a = Math.sin(t * 1.8 + ph) * .08, ex = x + Math.sin(a) * len, ey = y + Math.cos(a) * len;
      ctx.strokeStyle = 'rgba(240,230,210,.6)'; ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(-a * 2); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 10 * u; ctx.shadowOffsetX = 8 * u; ctx.shadowOffsetY = 10 * u; draw(); ctx.restore();
    };
    const px = -cam * .15;
    hang(W * (LAND ? .78 : .7) + px, 0, H * (LAND ? .22 : .16), 0, () => { ctx.fillStyle = '#F6E3A6'; ctx.beginPath(); ctx.arc(0, 90 * u, 90 * u, 0, TAU); ctx.save(); ctx.clip(); ctx.beginPath(); ctx.rect(-100 * u, -10 * u, 200 * u, 200 * u); ctx.arc(-40 * u, 70 * u, 80 * u, 0, TAU); ctx.fill('evenodd'); ctx.restore(); });
    [[.15, .12, 1], [.35, .22, 2], [.55, .08, 3], [.92, .3, 4], [.1, .32, 5]].forEach(([fx, fl, i]) => hang(W * fx + px, 0, H * fl, i * 1.3, () => {
      ctx.fillStyle = '#F2D27A'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = (k % 2 ? 12 : 30) * u; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r + 30 * u); } ctx.fill();
    }));
    // 卡纸层：越近越快，带投影
    const sp = [.25, .4, .6, .8, 1.15];
    s.L.forEach((c, i) => {
      ctx.save(); ctx.shadowColor = 'rgba(5,10,25,.5)'; ctx.shadowBlur = (10 + i * 4) * u; ctx.shadowOffsetY = -4 * u; ctx.shadowOffsetX = 4 * u;
      ctx.drawImage(c, -cam * sp[i], (i === 4 ? 0 : 0)); ctx.restore();
      if (i === 3) girl();
    });
    // 关节式剪纸小女孩：在第 4 层前走，四肢绕铆钉转
    function girl() {
      const k = (LAND ? 1 : 1.15) * u, gx = W * .3 + t * 50 * u, gy = H * s.Y[3] - 20 * u, ph = t * 5;
      const seg = (x, y, a, w, h, col, kids) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = col; rr(ctx, -w / 2, 0, w, h, w / 2); ctx.fill(); if (kids) kids(); ctx.fillStyle = '#C9A03A'; ctx.beginPath(); ctx.arc(0, 4 * k, 4 * k, 0, TAU); ctx.fill(); ctx.restore(); };
      ctx.save(); ctx.translate(gx, gy - Math.abs(Math.sin(ph)) * 6 * k); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 8 * u; ctx.shadowOffsetX = 6 * u; ctx.shadowOffsetY = 6 * u;
      seg(-10 * k, -90 * k, Math.sin(ph) * .5, 18 * k, 92 * k, '#3B3B58'); seg(10 * k, -90 * k, -Math.sin(ph) * .5, 18 * k, 92 * k, '#3B3B58');
      seg(-22 * k, -210 * k, -Math.sin(ph) * .6, 16 * k, 80 * k, '#E4B48F');
      ctx.fillStyle = '#D9534A'; ctx.beginPath(); ctx.moveTo(-30 * k, -220 * k); ctx.lineTo(30 * k, -220 * k); ctx.lineTo(55 * k, -80 * k); ctx.lineTo(-55 * k, -80 * k); ctx.fill();
      seg(22 * k, -210 * k, Math.sin(ph) * .6, 16 * k, 80 * k, '#E4B48F');
      ctx.save(); ctx.translate(0, -225 * k); ctx.rotate(Math.sin(ph * .5) * .1);
      ctx.fillStyle = '#E4B48F'; ctx.beginPath(); ctx.arc(0, -40 * k, 40 * k, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3A2A20'; ctx.beginPath(); ctx.arc(0, -46 * k, 42 * k, Math.PI * .9, Math.PI * 2.1); ctx.fill(); ctx.beginPath(); ctx.arc(-40 * k, -30 * k, 16 * k, 0, TAU); ctx.fill();
      ctx.fillStyle = '#C9A03A'; ctx.beginPath(); ctx.arc(0, 0, 4 * k, 0, TAU); ctx.fill(); ctx.restore();
      ctx.restore();
    }
    // 标题：一张小卡纸
    const tp = eOutBack(inv(1.2, 1.7, t));
    if (tp > 0) {
      ctx.save(); ctx.translate(LAND ? W * .22 : W / 2, LAND ? H * .2 : H * .3); ctx.scale(tp, tp); ctx.rotate(-.04);
      ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 12 * u; ctx.shadowOffsetY = 10 * u; ctx.fillStyle = '#F4EBDD'; rr(ctx, -200 * u, -70 * u, 400 * u, 140 * u, 10 * u); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#2E4A7A'; ctx.font = `900 ${84 * u}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('晚安森林', 0, 4 * u); ctx.restore(); ctx.textBaseline = 'alphabetic';
    }
  }
});
