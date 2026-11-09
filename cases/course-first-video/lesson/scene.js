// 水循环（C-038 科普扁平改写）：平涂渐变的海、山、云，长投影和边缘高光；蒸发、凝结、降水、汇流四步按时间依次亮起
// 改 P 里的一个值，重跑一次，就是新的一版。
const P = {
  sky: ['#7FD4FF', '#DFF6FF'],      // 天空：上、下
  sea: ['#2E86DE', '#1B4F9C'],      // 海：近、远
  hill: '#3BB273', sun: '#FFC93C',
  rain: 1,                          // 雨量：1 是默认，可以换成真实数据（月降水毫米 / 100）
  title: '水循环', steps: ['蒸发', '凝结', '降水', '汇流'],
};
scene({
  id: 'C-038', name: '水循环', dur: 15, still: 13.5,
  fonts: ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'"],
  init() {
    const R = mulberry32(38), drops = [], vap = [];
    for (let i = 0; i < 60; i++) drops.push([R(), R(), R()]);
    for (let i = 0; i < 28; i++) vap.push([R(), R()]);
    for (let i = 0; i < 60; i++) drops.push([R(), R(), R()]);   // 雨量大于 1 时多下的雨，排在后面，默认画面不变
    return { drops, vap };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    // 画面区域：横屏铺满，竖屏放在中间、上面留标题、下面留步骤条
    const bx = 0, by = LAND ? 0 : 330 * u, bw = W, bh = LAND ? H : H - 330 * u;
    const X = f => bx + f * bw, Y = f => by + f * bh;
    const step = Math.min(3, Math.floor(t / 3.4)), sp = (t % 3.4) / 3.4, allOn = t > 13.6;
    const on = k => allOn || step === k;
    // 天空
    let g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.sky[0]); g.addColorStop(1, P.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 太阳 + 光圈
    const sx = X(.14), sy = Y(.2), sr = 90 * u;
    for (let k = 3; k > 0; k--) { ctx.fillStyle = `rgba(255,220,120,${.12 * k})`; ctx.beginPath(); ctx.arc(sx, sy, sr * (1 + k * .35 + .05 * Math.sin(t * 2 + k)), 0, TAU); ctx.fill(); }
    ctx.fillStyle = P.sun; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    // 山（右）+ 长投影 + 边缘高光
    const mtn = [[.45, .78], [.66, .3], [.76, .42], [.86, .22], [1.02, .62], [1.02, .78]];
    ctx.fillStyle = 'rgba(20,60,40,.25)'; ctx.beginPath(); mtn.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](X(x) + 60 * u, Y(y) + 40 * u)); ctx.fill();
    g = ctx.createLinearGradient(X(.6), Y(.2), X(.9), Y(.8)); g.addColorStop(0, '#7B8FA6'); g.addColorStop(1, '#465A73');
    ctx.fillStyle = g; ctx.beginPath(); mtn.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](X(x), Y(y))); ctx.fill();
    ctx.fillStyle = '#F4F8FF'; [[.66, .3, .04], [.86, .22, .045]].forEach(([x, y, w]) => { ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(x + w), Y(y + .08)); ctx.lineTo(X(x - w * .8), Y(y + .08)); ctx.fill(); });
    // 山坡的林地
    ctx.fillStyle = P.hill; ctx.beginPath(); ctx.moveTo(X(.4), Y(.8)); ctx.quadraticCurveTo(X(.62), Y(.5), X(1.02), Y(.6)); ctx.lineTo(X(1.02), Y(.82)); ctx.fill();
    for (let i = 0; i < 9; i++) { const x = X(.6 + i * .045), y = Y(.66 - .02 * Math.sin(i)); ctx.fillStyle = '#25875A'; ctx.beginPath(); ctx.moveTo(x, y - 46 * u); ctx.lineTo(x + 20 * u, y); ctx.lineTo(x - 20 * u, y); ctx.fill(); }
    // 平地（右下）
    ctx.fillStyle = '#2E9E63'; ctx.fillRect(X(.3), Y(.8), bw, bh * .25);
    // 海（左下）
    g = ctx.createLinearGradient(0, Y(.72), 0, Y(1)); g.addColorStop(0, P.sea[1]); g.addColorStop(1, P.sea[0]);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X(0), Y(.74));
    for (let i = 0; i <= 40; i++) { const f = i / 40; ctx.lineTo(X(f * .62), Y(.74 + .012 * Math.sin(f * 18 + t * 2))); }
    ctx.quadraticCurveTo(X(.6), Y(.86), X(.46), Y(1.01)); ctx.lineTo(X(0), Y(1.01)); ctx.fill();
    // 河：从山里流进海，汇流那一步水流亮起
    const river = [[.9, .62], [.82, .72], [.7, .76], [.62, .86], [.5, .9], [.38, .92]];
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#4FA8F0'; ctx.lineWidth = 26 * u; ctx.beginPath(); river.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](X(x), Y(y))); ctx.stroke();
    if (on(3)) { ctx.setLineDash([30 * u, 40 * u]); ctx.lineDashOffset = -t * 160 * u; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 8 * u; ctx.beginPath(); river.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](X(x), Y(y))); ctx.stroke(); ctx.setLineDash([]); }
    // 蒸发：水汽从海面升起
    const evap = allOn ? 1 : step === 0 ? smooth(0, .3, sp) : step > 0 ? .35 : 0;
    for (const [a, b] of s.vap) { const p = (b + t * .25) % 1, x = X(.08 + a * .45) + Math.sin(p * 9 + a * 20) * 14 * u, y = Y(.74 - p * .42); ctx.fillStyle = `rgba(255,255,255,${evap * .8 * Math.sin(Math.PI * p)})`; ctx.beginPath(); ctx.arc(x, y, (8 + 10 * p) * u, 0, TAU); ctx.fill(); }
    // 云：凝结时长大、变灰，降水时下雨
    const grow = step >= 1 || allOn ? (step === 1 && !allOn ? smooth(0, .8, sp) : 1) : .25;
    const grey = step >= 2 || allOn ? 1 : step === 1 ? smooth(.4, 1, sp) : 0;
    const cx = X(.62) + Math.sin(t * .4) * 20 * u, cy = Y(.16), cs = (.6 + .5 * grow) * u;
    const cloud = (dx, dy, col) => { ctx.fillStyle = col; [[-150, 20, 80], [-60, -30, 110], [60, -10, 100], [150, 30, 70], [0, 40, 90]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(cx + (x + dx) * cs, cy + (y + dy) * cs, r * cs, 0, TAU); ctx.fill(); }); };
    cloud(30, 30, 'rgba(40,60,100,.18)');
    const c0 = [255, 255, 255], c1 = [150, 165, 190], cc = c0.map((v, i) => Math.round(lerp(v, c1[i], grey)));
    cloud(0, 0, `rgb(${cc})`);
    const RAIN = Q.has('rain') ? +Q.get('rain') : P.rain, nDrop = Math.min(s.drops.length, Math.round(60 * RAIN));
    const rain = allOn ? .7 : step === 2 ? smooth(0, .15, sp) : step === 3 ? .4 * (1 - sp) : 0;
    if (rain > 0) for (const [a, b, c] of s.drops.slice(0, nDrop)) { const p = (b + t * 1.6) % 1, x = cx + (a - .5) * 300 * cs - p * 30 * u, y = cy + 60 * cs + p * (Y(.62) - cy); ctx.strokeStyle = `rgba(70,140,230,${rain * (.5 + .5 * c)})`; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8 * u, y + 34 * u); ctx.stroke(); }
    // 标题
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#123'; ctx.font = `900 ${Math.round((LAND ? 64 : 96) * u)}px 'Noto Sans SC'`;
    ctx.fillText(P.title, LAND ? W / 2 : W / 2, LAND ? 80 * u : 190 * u);
    // 四步标签：横屏贴在画面里对应的位置，竖屏排在下面一条
    const pos = LAND ? [[.3, .52], [.62, .34], [.46, .46], [.52, .95]] : null;
    P.steps.forEach((txt, k) => {
      const a = allOn ? 1 : k < step ? .45 : k === step ? eOutBack(clamp(sp * 4)) : 0;
      if (a <= 0) return;
      const x = LAND ? X(pos[k][0]) : W * (.13 + k * .248), y = LAND ? Y(pos[k][1]) - 40 * u : H - 130 * u;
      ctx.save(); ctx.translate(x, y); const sc = k === step && !allOn ? lerp(.6, 1, clamp(sp * 4)) : 1; ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, a);
      ctx.font = `700 ${Math.round(54 * u)}px 'Noto Sans SC'`; const w = ctx.measureText(txt).width + 110 * u, h = 96 * u;
      ctx.fillStyle = 'rgba(0,30,60,.25)'; rr(ctx, -w / 2 + 8 * u, -h / 2 + 10 * u, w, h, h / 2); ctx.fill();
      ctx.fillStyle = '#fff'; rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
      ctx.fillStyle = '#FF6B6B'; ctx.beginPath(); ctx.arc(-w / 2 + h / 2, 0, h / 2 - 8 * u, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(String(k + 1), -w / 2 + h / 2, 2 * u);
      ctx.fillStyle = '#123'; ctx.fillText(txt, 24 * u, 2 * u); ctx.restore();
    });
  }
});
