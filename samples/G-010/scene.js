// G-010 旅行手账 vlog：两段 AI 生成的旅行镜头（清晨水乡、夜晚老街）贴在手账纸上当照片，四角胶带、微微歪着；旁边手绘路线图，虚线跟着旁白从码头走到老街，说到的地方盖一个印章；字幕是手写体，结尾盖「第一天」大章
// 素材：生视频 ×2、语音合成；配乐 CC0
scene({
  id: 'G-010', name: '旅行手账 vlog', dur: 12.5, still: 7.6,
  fonts: ["400 40px 'Ma Shan Zheng'", "400 40px 'ZCOOL KuaiLe'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'JetBrains Mono'"],
  text: '第一天坐船进镇早上的雾还没散桥下的水安静得像一面镜子晚上去老街灯笼一亮整条街都是香味码头石桥老街晨雾夜市古镇手账画面生成旁白合成配乐',
  async init() {
    const A = await loadAssets(), T = k => cueTime(A, k, 99);
    return { A, town: await loadVideo('town.mp4'), night: await loadVideo('night.mp4'), cut: T('晚上去') - .15, k2: T('早上'), k4: T('整条街'), end: T('整条街') + 2 };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, INK = '#3b3027', RED = '#c8432f';
    // 手账纸：米色底、浅横线、左边一排装订孔
    ctx.fillStyle = '#f4ecdc'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120,100,80,.12)'; ctx.lineWidth = 2 * u;
    for (let y = 60 * u; y < H; y += 56 * u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // 照片
    const night = t >= s.cut, v = night ? s.night : s.town, lt = night ? t - s.cut : t;
    await v.at(Math.min(lt * .92, v.dur - .05));
    const pw = LAND ? W * .56 : W - 140 * u, phh = pw * 9 / 16, pcx = LAND ? 80 * u + pw / 2 + 20 * u : W / 2, pcy = LAND ? H * .44 : 120 * u + phh / 2 + 40 * u;
    const drop = night ? eOutBack(inv(s.cut, s.cut + .45, t)) : eOutBack(inv(0, .5, t));
    const ang = (night ? 2.2 : -2.5) * Math.PI / 180;
    // 上一张照片：换图时它还压在底下，向左下滑走
    if (night && lt < .6) photo(ctx, s.town.el, pcx - eInOutCubic(lt / .6) * W * .5, pcy + eInOutCubic(lt / .6) * 60 * u, pw, phh, -2.5 * Math.PI / 180, u, 1);
    photo(ctx, v.el, pcx, pcy - (1 - drop) * 80 * u, pw, phh, ang, u, Math.min(1, drop * 2));
    // DAY 1 手写日期
    ctx.save(); ctx.globalAlpha = smooth(.2, .7, t); ctx.fillStyle = INK; ctx.textBaseline = 'alphabetic';
    ctx.font = `400 ${(LAND ? 64 : 70) * u}px 'Ma Shan Zheng'`; ctx.textAlign = 'left';
    ctx.fillText('第一天', LAND ? 90 * u : 70 * u, LAND ? 110 * u : 110 * u); ctx.restore();
    // 路线图
    const M = LAND ? [W * .64 + 40 * u, H * .14, W * .3, H * .62] : [90 * u, pcy + phh / 2 + 180 * u, W - 180 * u, H * .4], z = LAND ? 1.25 : 1.6;
    const P0 = [M[0] + M[2] * .15, M[1] + M[3] * .85], P1 = [M[0] + M[2] * .45, M[1] + M[3] * .45], P2 = [M[0] + M[2] * .85, M[1] + M[3] * .15];
    const pts = [P0, P1, P2];
    // 河：一条浅蓝曲线
    ctx.strokeStyle = 'rgba(80,140,180,.35)'; ctx.lineWidth = 26 * z * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(M[0], M[1] + M[3] * .7); ctx.bezierCurveTo(M[0] + M[2] * .4, M[1] + M[3] * .8, M[0] + M[2] * .5, M[1] + M[3] * .2, M[0] + M[2], M[1] + M[3] * .35); ctx.stroke();
    // 虚线路线：画到 prog 为止
    const prog = clamp(inv(.6, s.k4 + .4, t), 0, 1), n = 80;
    ctx.setLineDash([12 * u, 12 * u]); ctx.strokeStyle = INK; ctx.lineWidth = 4 * z * u; ctx.beginPath();
    let head = P0;
    for (let i = 0; i <= n * prog; i++) {
      const q = i / n, seg = q < .5 ? 0 : 1, f = q < .5 ? q * 2 : (q - .5) * 2, A = pts[seg], B = pts[seg + 1];
      const x = lerp(A[0], B[0], f) + Math.sin(f * Math.PI) * 30 * u * (seg ? -1 : 1), y = lerp(A[1], B[1], f);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); head = [x, y];
    }
    ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
    // 小船 / 小人：路线的头
    ctx.beginPath(); ctx.arc(head[0], head[1], 11 * z * u, 0, Math.PI * 2); ctx.fillStyle = RED; ctx.fill();
    [['码头', P0, .3], ['石桥', P1, s.k2], ['老街', P2, s.cut + .4]].forEach(([name, p, kt]) => {
      const a = smooth(kt, kt + .3, t); if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a; ctx.font = `400 ${32 * z * u}px 'ZCOOL KuaiLe'`; ctx.fillStyle = INK; ctx.textAlign = 'center';
      ctx.fillText(name, p[0], p[1] + 50 * z * u); ctx.beginPath(); ctx.arc(p[0], p[1], 8 * z * u, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
    // 印章：说到晨雾、夜市各盖一个
    stamp(ctx, '晨雾', M[0] + M[2] * (LAND ? .2 : .1), M[1] + M[3] * (LAND ? .3 : .25), s.k2 + .3, t, u * z, '#4f7ea8', -12);
    stamp(ctx, '夜市', M[0] + M[2] * (LAND ? .78 : .62), M[1] + M[3] * (LAND ? .62 : .75), s.k4, t, u * z, RED, 10);
    // 结尾：「第一天」大章盖在照片右下角
    const e = inv(s.end - .3, s.end, t);
    if (e > 0) {
      const k = e < 1 ? lerp(2.2, 1, eOutCubic(e)) : 1;
      ctx.save(); ctx.translate(pcx + pw * .32, pcy + phh * .3); ctx.rotate(-.18); ctx.scale(k, k); ctx.globalAlpha = Math.min(1, e * 2) * .9;
      ctx.fillStyle = 'rgba(244,236,220,.75)'; ctx.beginPath(); ctx.arc(0, 0, 114 * u, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = RED; ctx.lineWidth = 8 * u; ctx.beginPath(); ctx.arc(0, 0, 110 * u, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(0, 0, 94 * u, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = RED; ctx.font = `400 ${62 * u}px 'Ma Shan Zheng'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('第一天', 0, -6 * u);
      ctx.font = `400 ${20 * u}px 'JetBrains Mono'`; ctx.fillText('DAY 01 · DONE', 0, 50 * u); ctx.restore();
    }
    // 手写字幕
    const c = cueAt(s.A, t);
    if (c) {
      ctx.save(); ctx.font = `400 ${(LAND ? 44 : 50) * u}px 'ZCOOL KuaiLe'`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const cy = LAND ? H - 120 * u : pcy + phh / 2 + 70 * u, cx = LAND ? pcx : W / 2;
      ctx.fillText(c.text, cx, cy);
      const w = ctx.measureText(c.text).width; ctx.strokeStyle = 'rgba(200,67,47,.5)'; ctx.lineWidth = 5 * u; ctx.beginPath();
      ctx.moveTo(cx - w / 2, cy + 14 * u); ctx.quadraticCurveTo(cx, cy + 22 * u, cx + w / 2, cy + 12 * u); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.font = `400 ${15 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(59,48,39,.6)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(credits(s.A), W - 40 * u, H - 30 * u); ctx.restore();
  },
});

// 贴在纸上的照片：白边、投影、两角胶带
function photo(ctx, img, cx, cy, w, h, ang, u, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.rotate(ang);
  const b = 18 * u;
  ctx.shadowColor = 'rgba(60,40,20,.25)'; ctx.shadowBlur = 24 * u; ctx.shadowOffsetY = 8 * u;
  ctx.fillStyle = '#fff'; ctx.fillRect(-w / 2 - b, -h / 2 - b, w + 2 * b, h + 2 * b); ctx.shadowColor = 'transparent';
  drawCover(ctx, img, -w / 2, -h / 2, w, h, {});
  ctx.fillStyle = 'rgba(230,200,140,.7)';
  [[-w / 2, -h / 2, -.6], [w / 2, -h / 2, .6]].forEach(([x, y, r]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.fillRect(-60 * u, -18 * u, 120 * u, 36 * u); ctx.restore(); });
  ctx.restore();
}
// 圆形印章：在 kt 时刻从大到小盖下去
function stamp(ctx, text, x, y, kt, t, u, c, deg) {
  const e = inv(kt, kt + .22, t); if (e <= 0) return;
  const k = lerp(1.8, 1, eOutCubic(e));
  ctx.save(); ctx.translate(x, y); ctx.rotate(deg * Math.PI / 180); ctx.scale(k, k); ctx.globalAlpha = Math.min(1, e * 2) * .85;
  ctx.strokeStyle = c; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.arc(0, 0, 58 * u, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = c; ctx.font = `400 ${40 * u}px 'Ma Shan Zheng'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 2 * u); ctx.restore();
}
