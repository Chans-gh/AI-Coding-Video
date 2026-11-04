// C-193 南方公园式数字剪纸：每个部件都是一张多边形「纸片」，顶点按哈希值轻微抖动，像剪刀剪的边，底下垫一块错开的投影表示前后层级；人物只做整片平移、整片转动和嘴形切换，走路是上下小颠，说话时每两帧随机换一张嘴；镜头靠硬切在远景和反应特写之间跳，笑点放在停顿上，最后员工像一张纸板一样整片倒下。
// 风格提示词：用南方公园式数字剪纸风格：所有角色和场景都像用彩色卡纸剪出来的平面纸片，造型是几何化的大剪影、五官极少，人物几乎只做平移、整片转动和嘴形切换，走路是上下小幅颠动，纸片之间靠前后层级遮挡，背景是简单的平涂小镇或室内，纹理很克制；笑点靠停顿、反应镜头和突然的切换。角色全部原创，不复制剧中人物和地点。
// 题材：卡通与动漫 · 适合：讽刺短剧、快速成本低的连载、职场与社会话题
const CUT1 = 2.75, CUT2 = 4.0;                      // 两次硬切：远景 → 反应特写 → 远景
scene({
  id: 'C-193', name: '南方公园式数字剪纸', dur: 5, still: 2.1,
  fonts: ["700 60px 'Noto Sans SC'"],
  text: '周五之前做完。……今天就是',
  init() {
    const u = SHORT / 1080;
    const paper = makePaper('#f4efe4', { w: W / 2, h: H / 2, grain: 10, fiber: .9, blot: 6, seed: 93 });
    return { u, paper };
  },
  draw(ctx, t, s, f) {
    const { u } = s, SHD = 'rgba(40,25,10,.28)';
    // 纸片：多边形，顶点抖动像剪的边，先垫投影再填色
    let seed = 0;
    const piece = (pts, col, sh = true) => {
      seed++; const p = new Path2D();
      pts.forEach(([x, y], i) => { const j = (hash1(seed * 97 + i) - .5) * 3, k = (hash1(seed * 53 + i) - .5) * 3; i ? p.lineTo(x + j, y + k) : p.moveTo(x + j, y + k); }); p.closePath();
      if (sh) { ctx.save(); ctx.translate(4, 5); ctx.fillStyle = SHD; ctx.fill(p); ctx.restore(); }
      ctx.fillStyle = col; ctx.fill(p);
    };
    const circ = (cx, cy, rx, ry = rx, n = 26) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU) * rx, cy + Math.sin(i / n * TAU) * ry]);
    const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    const talk = (t0, t1) => t > t0 && t < t1 ? Math.floor(hash1(Math.floor(t * 15)) * 3) : 0;   // 0 闭 1 半开 2 张大
    const mouth = (x, y, w, m) => { if (m === 0) piece(rect(x - w / 2, y - 3, w, 6), '#2a1a14', false); else piece(circ(x, y + (m === 2 ? 6 : 2), w * (m === 2 ? .45 : .4), m === 2 ? 16 : 7, 14), '#2a1a14', false); };
    const closeUp = t >= CUT1 && t < CUT2;
    ctx.fillStyle = '#e8c766'; ctx.fillRect(0, 0, W, H);
    if (!closeUp) {
      // ---- 远景：办公室 ----
      const fy = LAND ? H * .8 : H * .74;
      ctx.save(); ctx.scale(u, u); const WU = W / u, HU = H / u, FY = fy / u;
      piece(rect(-10, FY, WU + 20, HU - FY + 10), '#8b6a4c', false);
      piece(rect(-10, FY - 14, WU + 20, 16), '#6e523a', false);
      const wx = LAND ? WU * .58 : WU * .44, ww = LAND ? 520 : 480, wy = LAND ? 110 : 360;
      piece(rect(wx - 14, wy - 14, ww + 28, 328), '#f7f2e4');
      piece(rect(wx, wy, ww, 300), '#9fd3e8', false);
      for (let i = 0; i < 7; i++) { const bx = wx + i * ww / 7, bh = 60 + 90 * hash1(i + 3); piece(rect(bx + 6, wy + 300 - bh, ww / 7 - 12, bh), ['#5f8f8a', '#7aa39b', '#4e7b78'][i % 3], false); }
      piece([[wx + ww * .2, wy + 300 - 140], [wx + ww * .26, wy + 300 - 190], [wx + ww * .32, wy + 300 - 140]], '#4e7b78', false);
      piece(circ(wx + ww * .85, wy + 70, 34), '#fff4b0', false);
      piece(rect(wx + ww / 2 - 6, wy, 12, 300), '#f7f2e4', false); piece(rect(wx, wy + 146, ww, 10), '#f7f2e4', false);
      const cx0 = LAND ? WU * .2 : WU * .2, cy0 = LAND ? 170 : 420;
      piece(circ(cx0, cy0, 54), '#f7f2e4'); piece(rect(cx0 - 3, cy0 - 42, 6, 44), '#2a1a14', false); piece(rect(cx0 - 2, cy0 - 3, 34, 6), '#2a1a14', false);   // 钟
      const dx = LAND ? WU * .33 : WU * .5, dw = LAND ? 360 : 340;
      piece(rect(dx - dw / 2, FY - 150, dw, 26), '#b07a4a'); piece(rect(dx - dw / 2 + 16, FY - 124, 24, 124), '#8f5e36'); piece(rect(dx + dw / 2 - 40, FY - 124, 24, 124), '#8f5e36');
      piece(rect(dx - 70, FY - 280, 140, 104), '#8e9599'); piece(rect(dx - 56, FY - 268, 112, 78), '#3b6fb5', false); piece(rect(dx - 14, FY - 176, 28, 26), '#8e9599');
      const px = LAND ? WU * .92 : WU * .9;
      piece([[px - 40, FY], [px + 40, FY], [px + 50, FY - 90], [px - 50, FY - 90]], '#c4583a');
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .45; piece([[px, FY - 90], [px + Math.cos(a - .2) * 120, FY - 90 + Math.sin(a - .2) * 160], [px + Math.cos(a + .2) * 120, FY - 90 + Math.sin(a + .2) * 160]], i % 2 ? '#3f8f4a' : '#58a85c'); }
      // ---- 员工：从左边颠着走进来；切回来后整片倒下 ----
      const ex = (LAND ? WU * .08 : WU * .05) + (LAND ? WU * .25 : WU * .22) * inv(.15, 1.3, t), walking = t > .15 && t < 1.3;
      const ebob = walking ? -Math.abs(Math.sin(t * Math.PI * 5)) * 16 : 0;
      const fall = t > CUT2 + .25 ? eInCubic(inv(CUT2 + .25, CUT2 + .55, t)) : 0, bounce = t > CUT2 + .55 ? Math.exp(-(t - CUT2 - .55) * 10) * Math.sin((t - CUT2 - .55) * 40) * .05 : 0;
      ctx.save(); ctx.translate(ex, FY + ebob); ctx.rotate(-fall * Math.PI / 2 + bounce + (walking ? Math.sin(t * Math.PI * 5) * .04 : 0)); const k = LAND ? 1.55 : 1.9; ctx.scale(k, k);
      employee(piece, circ, rect, mouth, 0, t, false);
      ctx.restore();
      // ---- 老板：站在窗边，说话；切回来后转身颠着走掉 ----
      const leave = t > CUT2 + .1, bxp = (LAND ? WU * .66 : WU * .74) + (leave ? (t - CUT2 - .1) * 520 : 0), bb = leave ? -Math.abs(Math.sin(t * Math.PI * 5)) * 16 : 0;
      ctx.save(); ctx.translate(bxp, FY + bb); const kb = LAND ? 1.55 : 1.9; ctx.scale(leave ? -kb : kb, kb);
      boss(piece, circ, rect, mouth, talk(1.45, 2.3), t);
      ctx.restore();
      // 对白：纸片气泡
      if (t > 1.4 && t < CUT1) bubble(ctx, piece, circ, '周五之前做完。', bxp - (LAND ? 300 : 230), FY - 400 * kb - 110, bxp - 30 * kb, FY - 380 * kb, t - 1.4);
      ctx.restore();
    } else {
      // ---- 反应特写：员工的大脸，停顿、眨眼、然后开口 ----
      ctx.save(); ctx.scale(u, u); const WU = W / u, HU = H / u;
      piece(rect(LAND ? WU * .62 : WU * .1, LAND ? 60 : 120, 520, 420), '#9fd3e8', false);
      const k = LAND ? 3.2 : 3.6;
      ctx.save(); ctx.translate(WU * (LAND ? .4 : .5), HU * (LAND ? .56 : .5) + 230 * k); ctx.scale(k, k);
      employee(piece, circ, rect, mouth, talk(3.35, 3.85), t, Math.abs(t - 3.05) < .06);
      ctx.restore();
      if (t > 3.3) bubble(ctx, piece, circ, '……今天就是周五。', WU * (LAND ? .74 : .5), HU * (LAND ? .2 : .14), WU * (LAND ? .6 : .55), HU * (LAND ? .38 : .3), t - 3.3);
      ctx.restore();
    }
    // 克制的纸纹
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .35; ctx.drawImage(s.paper, 0, 0, W, H); ctx.restore();
  }
});

// 员工：圆头、棕色短发、蓝衬衫红领带，手里一杯咖啡。原点在脚底
function employee(piece, circ, rect, mouth, m, t, blink) {
  piece(rect(-30, -40, 24, 40), '#4a4a55'); piece(rect(6, -40, 24, 40), '#4a4a55');
  piece([[-62, -150], [62, -150], [70, -36], [-70, -36]], '#8fc1e3');
  piece([[-8, -150], [8, -150], [12, -70], [0, -56], [-12, -70]], '#d0453a');
  piece(rect(-86, -146, 26, 84), '#8fc1e3'); piece(rect(60, -146, 26, 84), '#8fc1e3');
  piece(circ(-73, -58, 15), '#f0c9a0'); piece(circ(73, -58, 15), '#f0c9a0');
  piece(rect(68, -104, 34, 44), '#fbfbf6'); piece(rect(68, -94, 34, 10), '#8b5a36', false);
  piece(circ(0, -230, 82, 78), '#f0c9a0');
  piece([[-84, -236], [-80, -282], [-40, -314], [20, -318], [70, -296], [86, -244], [60, -270], [10, -282], [-40, -276]], '#6b4428');
  if (blink) { piece(rect(-34, -232, 20, 5), '#2a1a14', false); piece(rect(16, -232, 20, 5), '#2a1a14', false); }
  else { piece(circ(-24, -230, 7), '#2a1a14', false); piece(circ(26, -230, 7), '#2a1a14', false); }
  mouth(2, -186, 32, m);
}
// 老板：高、方脑袋、秃顶、黑胡子、深色西装
function boss(piece, circ, rect, mouth, m, t) {
  piece(rect(-34, -60, 28, 60), '#2c2c34'); piece(rect(6, -60, 28, 60), '#2c2c34');
  piece([[-80, -250], [80, -250], [74, -56], [-74, -56]], '#3d3f52');
  piece([[-26, -250], [26, -250], [0, -170]], '#fbfbf6'); piece([[-8, -246], [8, -246], [10, -190], [0, -176], [-10, -190]], '#7a2f8f');
  piece(rect(-104, -244, 28, 130), '#3d3f52'); piece(rect(76, -244, 28, 130), '#3d3f52');
  piece(circ(-90, -108, 16), '#e9bf98'); piece(circ(90, -108, 16), '#e9bf98');
  piece([[-74, -400], [74, -400], [80, -268], [-80, -268]], '#e9bf98');
  piece([[-80, -360], [-92, -340], [-80, -310]], '#9a9a9a'); piece([[80, -360], [92, -340], [80, -310]], '#9a9a9a');
  piece(rect(-46, -362, 30, 7), '#2a1a14', false); piece(rect(16, -362, 30, 7), '#2a1a14', false);
  piece(circ(-30, -342, 6), '#2a1a14', false); piece(circ(30, -342, 6), '#2a1a14', false);
  piece([[-40, -308], [40, -308], [30, -292], [-30, -292]], '#2a1a14', false);
  mouth(0, -280, 30, m);
}
// 纸片对白框：白卡纸、尖角指向说话的人；字一次全出
function bubble(ctx, piece, circ, txt, x, y, tx, ty, age) {
  const sc = age < .08 ? .6 : 1;
  ctx.save(); ctx.font = "700 46px 'Noto Sans SC'"; const w = ctx.measureText(txt).width + 70;
  ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
  piece([[x - 20, y + 40], [tx - x > 0 ? x + 40 : x - 60, y + 40], [tx, ty]], '#fbfbf6');
  piece([[x - w / 2, y - 50], [x + w / 2, y - 54], [x + w / 2 + 6, y + 48], [x - w / 2 - 4, y + 52]], '#fbfbf6');
  ctx.fillStyle = '#2a1a14'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y);
  ctx.restore();
}
