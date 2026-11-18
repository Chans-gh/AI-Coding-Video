// C-140 综合主义平涂：Canvas 2D 把天、远山、橙红草地、紫色树影、蓝干绿冠的树和坐着的人各画成一块平涂色面，每块填色后再用同一支深蓝粗线描一圈（圆角接头，像掐丝珐琅）；只有树冠和草叶随风摆、人的上身随呼吸微微起伏；最后一块带粗轮廓的深蓝色面从左边滑入盖住画面，标题印在上面。
// 风格提示词：用综合主义平涂风格：大块不讲透视的平涂色面，每块用深蓝或深褐粗轮廓圈住，像掐丝珐琅一样，颜色按情绪而不按自然，草地可以是橙红、树影可以是紫，人物造型简化、姿态静止，背景常是一整片单色，只有风和呼吸在动，转场是一块色面滑入覆盖画面。
// 题材：手绘与绘画 · 适合：神话与民俗、热带风情、心理与象征叙事
scene({
  id: 'C-140', name: '综合主义平涂', dur: 4, still: 2.2,
  text: '午后的风',
  fonts: ["900 40px 'Noto Serif SC'"],
  draw(ctx, t, s) {
    const u = SHORT / 1080, LINE = '#1F2A55', lw = 11 * u;
    const sh = (path, col) => { ctx.beginPath(); path(); ctx.fillStyle = col; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = LINE; ctx.lineWidth = lw; ctx.stroke(); };
    const curve = pts => { ctx.moveTo(...pts[0]); for (let i = 1; i < pts.length - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; ctx.quadraticCurveTo(...pts[i], ...m); } ctx.lineTo(...pts[pts.length - 1]); };
    const hz = H * (LAND ? .42 : .4), wind = Math.sin(t * 1.6);
    ctx.fillStyle = '#E9B949'; ctx.fillRect(0, 0, W, H);                       // 整片单色天
    sh(() => { curve([[-20, hz + 20 * u], [W * .2, hz - 90 * u], [W * .45, hz - 30 * u], [W * .7, hz - 120 * u], [W + 20, hz - 40 * u]]); ctx.lineTo(W + 20, H); ctx.lineTo(-20, H); ctx.closePath(); }, '#4E8C7A');
    sh(() => { curve([[-20, hz + 60 * u], [W * .3, hz + 10 * u], [W * .6, hz + 70 * u], [W + 20, hz + 20 * u]]); ctx.lineTo(W + 20, H + 20); ctx.lineTo(-20, H + 20); ctx.closePath(); }, '#E0602F');
    sh(() => { curve([[-20, H * .8], [W * .25, H * .7], [W * .55, H * .78], [W + 20, H * .86]]); ctx.lineTo(W + 20, H + 20); ctx.lineTo(-20, H + 20); ctx.closePath(); }, '#F08C5A');
    // 树：紫色影子、蓝干、绿冠（冠绕干顶随风转）
    const tx = W * (LAND ? .7 : .68), tb = hz + (LAND ? 230 : 260) * u, th = (LAND ? 330 : 480) * u, ks = LAND ? 1 : 1.2;
    sh(() => ctx.ellipse(tx + 40 * u, tb + 10 * u, 230 * u * ks, 50 * u * ks, 0, 0, TAU), '#7A4E9A');
    sh(() => { ctx.moveTo(tx - 60 * u, tb); ctx.quadraticCurveTo(tx - 10 * u, tb - th * .5, tx - 50 * u, tb - th); ctx.lineTo(tx + 20 * u, tb - th); ctx.quadraticCurveTo(tx + 20 * u, tb - th * .5, tx + 60 * u, tb); ctx.closePath(); }, '#2E6F8E');
    ctx.save(); ctx.translate(tx - 15 * u, tb - th); ctx.rotate(wind * .035);
    [[-120, -40, 170, '#2B6E4A'], [90, -10, 150, '#2B6E4A'], [-20, -140, 190, '#3F8F5A'], [60, 60, 110, '#3F8F5A']].forEach(([x, y, r, c], i) =>
      sh(() => ctx.ellipse(x * u * ks + wind * 6 * u * (i + 1) * .5, y * u * ks, r * u * ks, r * u * ks * .78, .3, 0, TAU), c));
    ctx.restore();
    // 草叶：粗线描的长叶，随风弯
    for (let i = 0; i < 9; i++) { const gx = W * (.08 + i * .1), gy = H + 20 * u, gh = 1 - (i % 3) * .15, b = (wind * .5 + Math.sin(t * 2.3 + i)) * 26 * u;
      sh(() => { ctx.moveTo(gx - 26 * u, gy); ctx.quadraticCurveTo(gx - 10 * u, gy - 150 * u, gx + b * 2, gy - 300 * u * gh); ctx.quadraticCurveTo(gx + 26 * u, gy - 130 * u, gx + 26 * u, gy); ctx.closePath(); }, i % 2 ? '#F2C14E' : '#4E8C7A'); }
    // 坐着的人：只有呼吸
    const fx = W * (LAND ? .3 : .34), fy = H * (LAND ? .8 : .72), k = (LAND ? 1.25 : 1.3) * u, br = 1 + .02 * Math.sin(t * 2.6);
    sh(() => { ctx.moveTo(fx - 200 * k, fy); ctx.quadraticCurveTo(fx - 160 * k, fy - 170 * k, fx - 40 * k, fy - 190 * k); ctx.quadraticCurveTo(fx + 120 * k, fy - 180 * k, fx + 190 * k, fy); ctx.closePath(); }, '#2E4C9A');
    ctx.save(); ctx.translate(fx, fy - 180 * k); ctx.scale(1, br);
    sh(() => { ctx.moveTo(-80 * k, 0); ctx.quadraticCurveTo(-90 * k, -150 * k, -20 * k, -190 * k); ctx.lineTo(40 * k, -190 * k); ctx.quadraticCurveTo(100 * k, -140 * k, 80 * k, 0); ctx.closePath(); }, '#F3E2C0');
    sh(() => { ctx.moveTo(60 * k, -150 * k); ctx.quadraticCurveTo(130 * k, -80 * k, 40 * k, -20 * k); ctx.lineTo(10 * k, -40 * k); ctx.quadraticCurveTo(80 * k, -90 * k, 40 * k, -140 * k); ctx.closePath(); }, '#D9925A');   // 手臂
    sh(() => ctx.ellipse(5 * k, -250 * k, 55 * k, 68 * k, -.15, 0, TAU), '#D9925A');
    sh(() => { ctx.moveTo(-60 * k, -240 * k); ctx.quadraticCurveTo(-50 * k, -330 * k, 20 * k, -325 * k); ctx.quadraticCurveTo(75 * k, -315 * k, 60 * k, -270 * k); ctx.quadraticCurveTo(0, -290 * k, -20 * k, -200 * k); ctx.closePath(); }, '#C8343A');   // 头巾
    ctx.restore();
    // 转场：一块带粗轮廓的深蓝色面从左滑入
    const p = eInOutCubic(inv(2.6, 3.2, t));
    if (p > 0) {
      const ex = lerp(-W * .3, W * 1.3, p);
      sh(() => { ctx.moveTo(-40, -40); ctx.lineTo(ex, -40); ctx.bezierCurveTo(ex - W * .2, H * .35, ex + W * .1, H * .65, ex - W * .15, H + 40); ctx.lineTo(-40, H + 40); ctx.closePath(); }, '#23305E');
      const q = eOutBack(inv(3.2, 3.6, t));
      if (q > 0) { ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(q, q); ctx.font = `900 ${(LAND ? 190 : 170) * u}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 16 * u; ctx.strokeStyle = '#0F1530'; ctx.lineJoin = 'round'; ctx.strokeText('午后的风', 0, 0); ctx.fillStyle = '#E9B949'; ctx.fillText('午后的风', 0, 0); ctx.restore(); ctx.textBaseline = 'alphabetic'; }
    }
  }
});
