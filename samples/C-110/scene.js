// C-110 电路板：Canvas 2D 在一块 1600×1000 的板坐标里画阻焊绿底、浅绿铜线（每条线由“横走—45° 斜走—横走”三段算出）、金色焊盘和过孔、白色丝印字和芯片、电阻、电容、指示灯；信号是一串沿折线按弧长前进的发光点，镜头用一次平移缩放在整板和主控芯片之间推拉，竖屏把整块板转 90°、丝印字单独转回来。
// 风格提示词：用电路板风格：正俯视的一块印制电路板，绿色阻焊层下是铜箔，走线只走 0/45/90° 并切斜角，金色焊盘和过孔，白色单线丝印写字，电流、货物或信号化作沿铜线奔跑的光脉冲，镜头在整张板和单个元件之间缩放，配继电器咔哒声和电源嗡鸣。
// 题材：信息讲解与产品发布 · 适合：供应链、系统架构、能源输送
scene({
  id: 'C-110', name: '电路板', dur: 5, still: 4.3,
  fonts: ["700 40px 'JetBrains Mono'", "700 40px 'Noto Sans SC'"],
  text: '电源输入主控处理三路输出',
  init() {
    const route = (x0, y0, x1, y1, xm) => { const d = Math.abs(y1 - y0); return [[x0, y0], [xm, y0], [xm + d, y1], [x1, y1]]; };
    const ins = [], outs = [], deco = [];
    for (let k = 0; k < 6; k++) ins.push(route(160, 410 + k * 36, 700, 425 + k * 30, 300 + (5 - k) * 22));
    [[440, 220], [500, 500], [560, 780]].forEach(([y0, y1], k) => outs.push(route(900, y0, 1390, y1, k === 1 ? 1000 : k ? 980 - (y1 - y0) * 0 : 980)));
    outs[0] = [[900, 440], [960, 440], [960 + 220, 220], [1390, 220]]; outs[2] = [[900, 560], [960, 560], [960 + 220, 780], [1390, 780]];
    for (let k = 0; k < 7; k++) deco.push([[220, 860 + k * 14], [1100 - k * 14, 860 + k * 14], [1160 - k * 14, 800 + k * 14], [1500, 800 + k * 14]]);
    for (let k = 0; k < 4; k++) deco.push([[740 + k * 40, 400], [740 + k * 40, 330 - k * 20], [800, 270 - k * 20], [800, 240]].map(([x, y], i) => i === 3 ? [740 + k * 40 + (k < 2 ? 30 : -30) * 0, 240] : [x, y]));
    for (let k = 0; k < 5; k++) deco.push([[740 + k * 30, 600], [740 + k * 30, 660 + k * 10], [600 - k * 20, 800 + k * 10 - 140 + 140], [300, 800 + k * 10 - 140 + 140]].slice(0, 2).concat([[740 + k * 30 - 60, 720 + k * 10], [200, 720 + k * 10]]));
    for (let k = 0; k < 6; k++) deco.push([[300 + k * 30, 80], [300 + k * 30, 160 + k * 12], [360 + k * 30, 220 + k * 12], [640, 220 + k * 12]]);
    return { ins, outs, deco };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, VW = LAND ? W : H, VH = LAND ? H : W;
    const z0 = Math.min(VW / 1720, VH / 1100), zk = smooth(1.3, 2.1, t) - smooth(3.0, 3.8, t);
    const z = z0 * Math.exp(Math.log(2.9) * zk), cx = lerp(800, 800, zk), cy = lerp(500, 500, zk);
    ctx.fillStyle = '#0C0F0D'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); if (!LAND) ctx.rotate(Math.PI / 2); ctx.scale(z, z); ctx.translate(-cx, -cy);
    const silk = (txt, x, y, size, align = 'center') => { ctx.save(); ctx.translate(x, y); if (!LAND) ctx.rotate(-Math.PI / 2); ctx.font = `700 ${size}px 'JetBrains Mono'`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = '#F2F2EA'; ctx.fillText(txt, 0, 0); ctx.restore(); };
    // 板子
    ctx.fillStyle = '#063A1C'; rr(ctx, -8, -8, 1616, 1016, 40); ctx.fill();
    const bg = ctx.createLinearGradient(0, 0, 1600, 1000); bg.addColorStop(0, '#0F6B34'); bg.addColorStop(1, '#0A5228');
    ctx.fillStyle = bg; rr(ctx, 0, 0, 1600, 1000, 34); ctx.fill();
    // 铜线
    const trace = (pts, w = 10) => { ctx.lineJoin = 'miter'; ctx.lineCap = 'round'; ctx.strokeStyle = '#2D9A4C'; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.strokeStyle = 'rgba(140,230,150,.25)'; ctx.lineWidth = w * .3; ctx.stroke(); };
    s.deco.forEach(p => trace(p, 7)); s.ins.forEach(p => trace(p)); s.outs.forEach(p => trace(p, 14));
    // 过孔、焊盘
    const via = (x, y, r = 9) => { ctx.fillStyle = '#D9A93A'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#1A1A14'; ctx.beginPath(); ctx.arc(x, y, r * .45, 0, TAU); ctx.fill(); };
    const pad = (x, y, w, h) => { ctx.fillStyle = '#E2B24A'; ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.fillStyle = 'rgba(255,240,180,.5)'; ctx.fillRect(x - w / 2, y - h / 2, w, h * .25); };
    s.deco.forEach(p => via(...p[p.length - 1], 7));
    [[40, 40], [1560, 40], [40, 960], [1560, 960]].forEach(([x, y]) => { via(x, y, 22); });
    // J1 连接器
    ctx.strokeStyle = '#F2F2EA'; ctx.lineWidth = 3; ctx.strokeRect(70, 380, 100, 250);
    for (let k = 0; k < 6; k++) { if (k) via(140, 410 + k * 36, 14); else pad(140, 410, 26, 26); }
    silk('J1', 120, 360, 26); silk('PWR IN', 120, 660, 22);
    // 主控芯片
    for (let k = 0; k < 10; k++) { pad(700 - 8, 420 + k * 18, 22, 8); pad(908, 420 + k * 18, 22, 8); pad(720 + k * 18 - 10 + 10, 392, 8, 22); pad(720 + k * 18, 608, 8, 22); }
    ctx.fillStyle = '#16171A'; rr(ctx, 708, 408, 184, 184, 8); ctx.fill(); ctx.fillStyle = '#2A2C30'; ctx.beginPath(); ctx.arc(728, 428, 7, 0, TAU); ctx.fill();
    silk('U1', 800, 640, 24); silk('MCU', 800, 488, 34); silk('AICV-32', 800, 528, 16);
    // 晶振、电容
    ctx.fillStyle = '#C9CCD1'; rr(ctx, 760, 200, 80, 40, 18); ctx.fill(); pad(745, 220, 18, 24); pad(855, 220, 18, 24); silk('Y1', 800, 180, 20);
    [[640, 330], [960, 680], [640, 690], [960, 320]].forEach(([x, y], k) => { pad(x - 18, y, 16, 22); pad(x + 18, y, 16, 22); ctx.fillStyle = '#B88A4A'; ctx.fillRect(x - 10, y - 10, 20, 20); silk('C' + (k + 1), x, y - 30, 18); });
    // 输出线上的电阻、指示灯
    const RY = [220, 500, 780];
    RY.forEach((y, k) => {
      pad(1240, y, 20, 26); pad(1300, y, 20, 26); ctx.fillStyle = '#1B1B1E'; ctx.fillRect(1250, y - 14, 40, 28); silk('R' + (k + 1), 1270, y - 40, 18);
      ctx.save(); ctx.translate(1270, y); if (!LAND) ctx.rotate(-Math.PI / 2); ctx.fillStyle = '#E8E8E8'; ctx.font = "700 12px 'JetBrains Mono'"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('103', 0, 0); ctx.restore();
    });
    // 丝印：板名、走线标记
    silk(LAND ? 'AICV-110  REV A' : 'REV A', 1360, 950, 26); silk('SIG ▸', 470, 340, 20); silk('OUT ×3', 1120, 120, 22);
    for (let k = 0; k < 18; k++) { ctx.fillStyle = '#F2F2EA'; ctx.fillRect(1460 + (k % 3) * 30, 60 + Math.floor(k / 3) * 14, 18, 3); }
    // 信号脉冲：沿折线按弧长前进
    const lens = p => { let a = 0; return p.map((q, i) => i ? (a += Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1])) : 0); };
    const at = (p, L, d) => { d = clamp(d, 0, L[L.length - 1]); for (let i = 1; i < p.length; i++) if (L[i] >= d) { const k = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); return [lerp(p[i - 1][0], p[i][0], k), lerp(p[i - 1][1], p[i][1], k)]; } return p[p.length - 1]; };
    const pulse = (p, k, col) => { if (k <= 0 || k >= 1.15) return; const L = lens(p), T = L[L.length - 1], head = k * T; ctx.globalCompositeOperation = 'lighter'; for (let j = 0; j < 14; j++) { const d = head - j * 9; if (d < 0 || d > T) continue; const [x, y] = at(p, L, d), a = (1 - j / 14) * (k > 1 ? 1 - (k - 1) / .15 : 1); ctx.fillStyle = `rgba(${col},${a * .35})`; ctx.beginPath(); ctx.arc(x, y, 22 - j, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(255,255,240,${a})`; ctx.beginPath(); ctx.arc(x, y, 6 - j * .3, 0, TAU); ctx.fill(); } ctx.globalCompositeOperation = 'source-over'; };
    s.ins.forEach((p, k) => { pulse(p, (t - .25 - k * .1) / .9, '120,255,170'); pulse(p, (t - 2.2 - k * .1) / .9 * 1.6 - 0, '120,255,170'); });
    // 芯片“处理”：针脚绕一圈依次亮
    const proc = clamp((t - 1.5) / 1.6);
    if (proc > 0 && proc < 1) { const n = 40, hd = Math.floor(proc * n * 2); for (let j = 0; j < 6; j++) { const q = (hd - j + n * 4) % n, side = Math.floor(q / 10), i = q % 10; const [x, y] = [[700 - 8, 420 + i * 18], [720 + i * 18, 608], [908, 420 + (9 - i) * 18], [720 + (9 - i) * 18, 392]][side]; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(150,255,190,${(1 - j / 6) * .9})`; ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; } }
    const core = Math.max(0, Math.sin(clamp((t - 1.5) / 1.6) * Math.PI)); if (core > 0) { const cg = ctx.createRadialGradient(800, 500, 0, 800, 500, 140); cg.addColorStop(0, `rgba(120,255,170,${.35 * core})`); cg.addColorStop(1, 'rgba(120,255,170,0)'); ctx.fillStyle = cg; ctx.fillRect(660, 360, 280, 280); }
    s.outs.forEach((p, k) => pulse(p, (t - 3.0 - k * .15) / .85, ['255,120,90', '255,200,80', '120,255,140'][k]));
    // 指示灯
    RY.forEach((y, k) => {
      const on = clamp((t - 3.85 - k * .15) / .08), col = ['255,70,60', '255,190,40', '80,255,120'][k];
      ctx.strokeStyle = '#F2F2EA'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(1440, y, 40, 0, TAU); ctx.stroke(); silk('D' + (k + 1), 1510, y, 20, 'left');
      pad(1415, y, 18, 26); pad(1465, y, 18, 26);
      ctx.fillStyle = on ? `rgb(${col})` : '#5A1A14'; ctx.fillRect(1428, y - 16, 24, 32);
      if (on) { ctx.globalCompositeOperation = 'lighter'; const lg = ctx.createRadialGradient(1440, y, 0, 1440, y, 150); lg.addColorStop(0, `rgba(${col},${.6 * on})`); lg.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = lg; ctx.fillRect(1290, y - 150, 300, 300); ctx.globalCompositeOperation = 'source-over'; }
    });
    ctx.restore();
    // 步骤标注（屏幕空间，丝印风格）
    const STEP = [[0, 1.35, '① 电源输入'], [1.35, 3.05, '② 主控处理'], [3.05, 9, '③ 三路输出']], st = STEP.find(([a, b]) => t >= a && t < b);
    const fa = smooth(st[0], st[0] + .2, t);
    ctx.font = `700 ${Math.round(52 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(st[2]).width, bx = 60 * u, by = LAND ? 70 * u : 120 * u;
    ctx.globalAlpha = fa; ctx.fillStyle = 'rgba(6,40,20,.8)'; ctx.fillRect(bx, by, tw + 60 * u, 90 * u); ctx.strokeStyle = '#F2F2EA'; ctx.lineWidth = 3 * u; ctx.strokeRect(bx, by, tw + 60 * u, 90 * u);
    ctx.fillStyle = '#F2F2EA'; ctx.fillText(st[2], bx + 30 * u, by + 47 * u); ctx.globalAlpha = 1;
    vignette(ctx, .5, .45);
  }
});
