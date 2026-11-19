// C-151 南宋院体山水：整幅画先在 1.35 倍大的离屏画布上画好：绢底；左下角的崖石先铺一层淡赭墨，再在形状里撒点、每点一笔从深到浅渐变的楔形侧锋笔（斧劈皴），贴近轮廓的更深；老松的干和拖出去的长枝用干笔（brushStroke），松针是一簇簇放射的短线；崖边一个小小的高士，远山只是两层极淡的墨，其余全是绢的留白；每帧只做两件事：镜头从右边的空白处慢慢移向那一角，几层白雾横着飘。
// 风格提示词：用南宋院体山水风格：淡黄绢本上主景全压在一角，山石用方硬的侧锋斧劈皴扫出，其余大半画面是雾和水的留白，一棵拖枝老松斜伸出画外，小小的高士在崖边远望，淡墨加一点赭石和花青，镜头从留白处缓缓移向那一角，配洞箫。
// 题材：东方传统 · 适合：诗词意境、哲理独白、东方品牌片
function axe(g, x, y, len, wid, ang, a) {
  // 斧劈皴：一笔楔形，起笔宽、收笔尖，横截面从深到浅
  const c = Math.cos(ang), s = Math.sin(ang), nx = -s, ny = c;
  const gr = g.createLinearGradient(x + nx * wid / 2, y + ny * wid / 2, x - nx * wid / 2, y - ny * wid / 2);
  gr.addColorStop(0, `rgba(38,32,26,${a})`); gr.addColorStop(.55, `rgba(38,32,26,${a * .45})`); gr.addColorStop(1, 'rgba(38,32,26,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x + nx * wid / 2, y + ny * wid / 2); g.lineTo(x + c * len, y + s * len); g.lineTo(x - nx * wid / 2, y - ny * wid / 2); g.closePath(); g.fill();
}
scene({
  id: 'C-151', name: '南宋院体山水', dur: 5, still: 4.6,
  fonts: ["700 44px 'Noto Serif SC'"],
  init() {
    const S = 1.35, u = SHORT / 1080, CW = Math.round(W * S), CH = Math.round(H * S), k = u * S * (LAND ? 1 : 1.08);
    const cv = mk(CW, CH), g = cv.getContext('2d');
    // 绢底
    g.drawImage(makePaper('#D8C49A', { w: CW / 2, h: CH / 2, seed: 15, grain: 10, fiber: .25, blot: 16 }), 0, 0, CW, CH);
    const R = mulberry32(5); g.fillStyle = 'rgba(120,95,60,.025)'; for (let x = 0; x < CW; x += 3 * k) g.fillRect(x, 0, 1, CH);
    const P = ([x, y]) => [x * k, CH + y * k];
    // 远山：两层极淡
    const fx0 = LAND ? CW * .6 : CW * .35, fy = LAND ? CH * .6 : CH * .45;
    for (const [dy, a, amp] of [[0, .07, 260], [60, .11, 170]]) {
      g.fillStyle = `rgba(60,70,80,${a})`; g.beginPath(); g.moveTo(fx0, fy + dy * k);
      for (let x = 0; x <= 1; x += .02) g.lineTo(fx0 + x * (CW - fx0 + 50), fy + dy * k - amp * k * Math.pow(Math.sin(Math.PI * x), 1.5) * (.7 + .3 * Math.sin(x * 17)));
      g.lineTo(CW + 50, fy + (dy + 40) * k); g.closePath(); g.filter = `blur(${3 * k}px)`; g.fill(); g.filter = 'none';
    }
    // 水：几道细波纹和一叶小舟
    g.strokeStyle = 'rgba(60,55,45,.18)'; g.lineWidth = 1.5 * k;
    for (let i = 0; i < 14; i++) { const x = CW * (.45 + R() * .45), y = fy + (80 + R() * 380) * k, l = (40 + R() * 90) * k; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 4 * k, x + l, y); g.stroke(); }
    const bx = LAND ? CW * .72 : CW * .66, by = fy + 140 * k; g.fillStyle = 'rgba(40,34,28,.6)'; g.beginPath(); g.moveTo(bx - 34 * k, by); g.quadraticCurveTo(bx, by + 10 * k, bx + 34 * k, by - 3 * k); g.lineTo(bx + 20 * k, by + 5 * k); g.lineTo(bx - 22 * k, by + 5 * k); g.fill(); g.fillRect(bx - 4 * k, by - 16 * k, 3 * k, 14 * k);
    // 崖石
    const cliff = [[-40, 40], [-40, -700], [100, -760], [230, -705], [330, -745], [520, -695], [495, -625], [420, -565], [470, -430], [590, -340], [545, -235], [700, -125], [830, 40]].map(P);
    const path = new Path2D(); cliff.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y)); path.closePath();
    const wash = g.createLinearGradient(0, CH - 760 * k, 600 * k, CH); wash.addColorStop(0, 'rgba(120,90,55,.35)'); wash.addColorStop(1, 'rgba(90,70,45,.2)');
    g.fillStyle = wash; g.fill(path);
    g.save(); g.clip(path);
    const pts = samplePoints(q => { q.fill(path); }, Math.round(30 * k), 11, CW, CH);
    shuffle(pts, 3).forEach(([x, y]) => {
      const edge = !g.isPointInPath(path, x + 70 * k, y) || !g.isPointInPath(path, x, y - 60 * k);
      axe(g, x, y, (70 + R() * 110) * k, (24 + R() * 30) * k, 1.95 + (R() - .5) * .5, (edge ? .42 : .1) + R() * .16);
    });
    g.restore();
    brushStroke(g, cliff.slice(1, 12), 6 * k, 1, { color: 'rgba(30,25,20,.8)', seed: 4, dry: .6, bristles: 6 });
    for (let i = 0; i < 40; i++) { const q = cliff[1 + Math.floor(R() * 10)]; g.fillStyle = 'rgba(30,40,25,.7)'; g.beginPath(); g.ellipse(q[0] + (R() - .5) * 40 * k, q[1] + R() * 20 * k, 4 * k, 2.5 * k, R(), 0, TAU); g.fill(); }
    // 老松：干、拖枝、松针
    const trunk = [[300, -740], [330, -800], [360, -860], [400, -905], [440, -925]].map(P), drag = [[420, -915], [560, -905], [700, -850], [840, -775], [980, -720], [1110, -700]].map(P), up = [[400, -905], [380, -980], [410, -1040]].map(P);
    brushStroke(g, trunk, 26 * k, 1, { color: 'rgba(45,35,25,.9)', seed: 7, dry: .35 });
    brushStroke(g, drag, 18 * k, 1, { color: 'rgba(45,35,25,.9)', seed: 8, dry: .45 }); brushStroke(g, up, 14 * k, 1, { color: 'rgba(45,35,25,.9)', seed: 9, dry: .4 });
    g.strokeStyle = 'rgba(30,22,15,.5)'; g.lineWidth = 2 * k; for (let i = 2; i < 12; i += 3) { const q = resample(trunk, 14)[i]; g.beginPath(); g.ellipse(q.x + (R() - .5) * 8 * k, q.y, 6 * k, 3 * k, -.6, 0, 4); g.stroke(); }
    const tuft = (x, y, r) => { for (let j = 0; j < 6; j++) { const cx = x + (R() - .5) * r * 1.4, cy = y + (R() - .5) * r * .5, rr_ = r * (.5 + R() * .4); g.strokeStyle = j % 2 ? 'rgba(35,48,42,.7)' : 'rgba(70,95,100,.35)'; g.lineWidth = 1.5 * k; for (let a = -Math.PI * .9; a < -Math.PI * .1; a += .2 + R() * .1) { const l = rr_ * (.7 + R() * .3); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l * .4); g.stroke(); } } };
    for (const q of resample(drag, 12).slice(2)) tuft(q.x, q.y - 4 * k, (65 + R() * 30) * k);
    for (const q of resample(up, 5)) tuft(q.x, q.y, 75 * k);
    // 高士
    const [sx, sy] = P([485, -697]), h = 46 * k;
    g.fillStyle = 'rgba(245,238,220,.95)'; g.strokeStyle = 'rgba(35,28,22,.9)'; g.lineWidth = 1.6 * k;
    g.beginPath(); g.moveTo(sx - h * .2, sy); g.quadraticCurveTo(sx - h * .22, sy - h * .6, sx, sy - h * .75); g.quadraticCurveTo(sx + h * .2, sy - h * .55, sx + h * .25, sy); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(35,28,22,.9)'; g.beginPath(); g.arc(sx + h * .02, sy - h * .86, h * .1, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(sx + h * .2, sy - h * .45); g.lineTo(sx + h * .42, sy - h * .52); g.stroke();
    // 题字和印
    g.fillStyle = 'rgba(40,32,24,.8)'; g.font = `700 ${Math.round(44 * k)}px 'Noto Serif SC'`; g.textAlign = 'center';
    const ix = CW * (LAND ? .9 : .86), iy = CH * (LAND ? .12 : .1); [...'松下望远'].forEach((ch, i) => g.fillText(ch, ix, iy + i * 54 * k));
    g.fillStyle = 'rgba(180,40,30,.85)'; g.fillRect(ix - 22 * k, iy + 4 * 54 * k - 10 * k, 44 * k, 44 * k); g.fillStyle = '#E8D9B8'; g.font = `700 ${Math.round(30 * k)}px 'Noto Serif SC'`; g.fillText('远', ix, iy + 4 * 54 * k + 22 * k);
    const corner = P([300, -650]);
    return { cv, S, corner };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, q = eInOutCubic(inv(0, 4.8, t)), S = s.S;
    // 镜头：从右上方的空白处移向左下那一角
    const fx = lerp(W * S * (LAND ? .7 : .65), W * S * .45, q), fy = lerp(H * S * (LAND ? .42 : .36), H * S * .55, q);
    const z = lerp(.85, 1.28, q), vw = W * z, vh = H * z;
    const sx = clamp(fx - vw / 2, 0, W * S - vw), sy = clamp(fy - vh / 2, 0, H * S - vh);
    ctx.drawImage(s.cv, sx, sy, vw, vh, 0, 0, W, H);
    // 雾：几层横飘的白
    for (let i = 0; i < 4; i++) {
      const y = H * (LAND ? .58 + i * .1 : .5 + i * .1) - (sy / S - H * .2) * .3, x = ((t * (12 + i * 6) * u + i * 500 * u) % (W * 1.6)) - W * .3, w = W * .9, h = 140 * u;
      const g = ctx.createRadialGradient(x + w / 2, y, 0, x + w / 2, y, w / 2); g.addColorStop(0, `rgba(242,234,215,${.4 - i * .05})`); g.addColorStop(1, 'rgba(242,234,215,0)');
      ctx.save(); ctx.translate(x + w / 2, y); ctx.scale(1, h / (w / 2)); ctx.translate(-(x + w / 2), -y); ctx.fillStyle = g; ctx.fillRect(x, y - w / 2, w, w); ctx.restore();
    }
    vignette(ctx, .35, .5, '70,50,25');
  }
});