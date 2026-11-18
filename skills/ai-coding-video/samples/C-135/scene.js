// C-135 巴洛克明暗对照：原创的老学者在烛光下读信，脸、手、信纸和铜壶都按朝向烛火的一侧画亮（暗面边缘比较硬），init 里画好“全亮”的一张；每帧先铺近乎全黑的暖褐底，再用以烛火为圆心的径向渐变把亮图抠出来叠上，渐变半径随火苗呼吸，光里飘着灰尘，镜头慢慢推近。
// 风格提示词：用巴洛克明暗对照风格：画面八成沉在温暖的深褐黑暗里，只有一个光源（烛火或斜射的天光）照亮人物的脸、手和金属器物，明暗交界清楚、暗部几乎看不见细节，光随火苗轻轻呼吸，光束里飘着灰尘，镜头缓慢推近，转场是光慢慢暗下去再在下一幕亮起。
// 题材：绘画流派 · 适合：悬疑与历史故事、人物特写、宗教与古典题材
scene({
  id: 'C-135', name: '巴洛克明暗对照', dur: 5, still: 4.4,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    // 构图：横屏烛在左、人居中、铜壶在右；竖屏烛在左下、人在上半
    const k = (LAND ? 1 : 1.15) * u;
    const candle = LAND ? [W * .3, H * .56] : [W * .16, H * .6];
    const face = LAND ? [W * .55, H * .36] : [W * .6, H * .36];
    const paper = LAND ? [W * .47, H * .72] : [W * .56, H * .7], jug = LAND ? [W * .7, H * .62] : [W * .78, H * .8];
    const lit = mk(W, H), g = lit.getContext('2d');
    const blur = r => { g.filter = r > 0 ? `blur(${r * k}px)` : 'none'; };
    const at = (o, x, y) => [o[0] + x * k, o[1] + y * k];
    const ell = (o, x, y, rx, ry, c, rot = 0) => { g.fillStyle = c; g.beginPath(); g.ellipse(...at(o, x, y), rx * k, ry * k, rot, 0, TAU); g.fill(); };
    const poly = (o, pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...at(o, ...p)) : g.moveTo(...at(o, ...p))); g.closePath(); g.fill(); };
    // 墙和桌
    g.fillStyle = '#3E2A1A'; g.fillRect(0, 0, W, H);
    const tableY = LAND ? H * .66 : H * .64; g.fillStyle = '#6A3A1E'; g.fillRect(0, tableY, W, H - tableY);
    g.fillStyle = '#9A6436'; g.fillRect(0, tableY, W, 10 * k);
    // 斗篷：深红，朝光的一侧有亮褶
    const [fx, fy] = face;
    blur(4); poly(face, [[-60, 120], [-300, 260], [-360, 700], [360, 700], [300, 240], [60, 120]], '#6A1E14');
    blur(10); [[-230, 380, 40, 200, .3, 'rgba(200,80,50,.6)'], [-120, 420, 24, 180, .15, 'rgba(190,70,44,.45)'], [180, 400, 50, 240, -.2, 'rgba(20,6,4,.7)']].forEach(([x, y, rx, ry, r, c]) => ell(face, x, y, rx, ry, c, r));
    // 头：秃顶、白胡子，烛光从左下来
    blur(3); const sk = g.createRadialGradient(...at(face, -70, 10), 6 * k, ...at(face, -10, 0), 170 * k); sk.addColorStop(0, '#F6D2A0'); sk.addColorStop(.45, '#C88A5A'); sk.addColorStop(1, '#3A1E10');
    g.fillStyle = sk; g.beginPath(); g.ellipse(...at(face, 0, 0), 112 * k, 142 * k, -.12, 0, TAU); g.fill();
    ell(face, 100, 10, 22, 38, '#5A3018');                                                                         // 耳朵（背光）
    g.save(); g.beginPath(); g.ellipse(...at(face, 0, 0), 112 * k, 142 * k, -.12, 0, TAU); g.clip();                  // 背光那半边：交界比较清楚
    blur(5); g.fillStyle = 'rgba(34,14,6,.88)'; g.beginPath(); g.moveTo(...at(face, 40, -160)); g.bezierCurveTo(...at(face, 10, -60), ...at(face, 30, 40), ...at(face, 10, 170)); g.lineTo(...at(face, 160, 170)); g.lineTo(...at(face, 160, -160)); g.fill();
    blur(14); ell(face, -40, -110, 50, 24, 'rgba(255,236,200,.45)'); g.restore();                                     // 秃顶上的高光
    blur(2); g.strokeStyle = 'rgba(90,46,24,.6)'; g.lineWidth = 3 * k; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(...at(face, -70, -80 + i * 16)); g.quadraticCurveTo(...at(face, -20, -88 + i * 16), ...at(face, 20, -78 + i * 16)); g.stroke(); }   // 额头皱纹
    blur(6); ell(face, -46, -22, 30, 18, 'rgba(70,32,14,.6)'); ell(face, 26, -20, 24, 16, 'rgba(20,8,4,.6)');         // 眼窝
    blur(2); g.strokeStyle = 'rgba(60,26,10,.85)'; g.lineWidth = 3 * k; g.beginPath(); g.ellipse(...at(face, -46, -18), 18 * k, 6 * k, 0, .2, Math.PI - .2); g.stroke();   // 垂着眼看信
    blur(3); g.fillStyle = 'rgba(250,220,180,.7)'; g.beginPath(); g.moveTo(...at(face, -20, -16)); g.quadraticCurveTo(...at(face, -36, 30), ...at(face, -34, 62)); g.lineTo(...at(face, -22, 62)); g.quadraticCurveTo(...at(face, -18, 20), ...at(face, -10, -14)); g.fill();   // 鼻梁受光
    blur(4); g.fillStyle = 'rgba(34,14,6,.8)'; g.beginPath(); g.moveTo(...at(face, -8, -10)); g.quadraticCurveTo(...at(face, -4, 40), ...at(face, -18, 70)); g.lineTo(...at(face, 30, 80)); g.lineTo(...at(face, 24, 0)); g.fill();   // 鼻子投在右边的影
    ell(face, -30, 70, 16, 6, 'rgba(60,24,10,.6)');
    blur(8); ell(face, -66, 30, 26, 20, 'rgba(200,100,70,.2)');
    // 胡子
    blur(3); const bd = g.createLinearGradient(...at(face, -90, 0), ...at(face, 90, 0)); bd.addColorStop(0, '#F2E8D6'); bd.addColorStop(.5, '#A89A86'); bd.addColorStop(1, '#2A2018');
    g.fillStyle = bd; g.beginPath(); g.moveTo(...at(face, -96, 50)); g.quadraticCurveTo(...at(face, -90, 210), ...at(face, -10, 250)); g.quadraticCurveTo(...at(face, 70, 210), ...at(face, 100, 60)); g.quadraticCurveTo(...at(face, 0, 110), ...at(face, -96, 50)); g.fill();
    blur(1); g.strokeStyle = 'rgba(255,248,232,.28)'; g.lineWidth = 1.6 * k; for (let i = 0; i < 18; i++) { const x = -82 + i * 5.5 + (hash1(i) - .5) * 8; g.beginPath(); g.moveTo(...at(face, x, 80 + Math.abs(x) * .1)); g.quadraticCurveTo(...at(face, x - 6, 160), ...at(face, x * .4 - 8, 230)); g.stroke(); }
    blur(2); ell(face, -20, 92, 30, 6, 'rgba(60,26,14,.8)');                                                          // 嘴
    // 信和双手
    const [px, py] = paper;
    blur(1.5); const pg = g.createLinearGradient(px - 200 * k, 0, px + 200 * k, 0); pg.addColorStop(0, '#FFF2D8'); pg.addColorStop(1, '#B89A70');
    g.fillStyle = pg; g.beginPath(); g.moveTo(px - 200 * k, py - 60 * k); g.quadraticCurveTo(px, py - 90 * k, px + 180 * k, py - 50 * k); g.lineTo(px + 190 * k, py + 70 * k); g.quadraticCurveTo(px, py + 40 * k, px - 190 * k, py + 80 * k); g.fill();
    g.fillStyle = 'rgba(70,40,20,.55)'; for (let i = 0; i < 6; i++) g.fillRect(px - 150 * k, py + (-40 + i * 18) * k, (220 + hash1(i) * 60) * k, 3 * k);
    blur(2.5); [[-200, 10, 1], [190, 10, -1]].forEach(([x, y, sd]) => { const hg = g.createRadialGradient(...at(paper, x - 30, y), 4 * k, ...at(paper, x, y), 80 * k); hg.addColorStop(0, sd > 0 ? '#F2C894' : '#A8683E'); hg.addColorStop(1, sd > 0 ? '#9A5A30' : '#3A1C0E');
      g.fillStyle = hg; g.beginPath(); g.ellipse(...at(paper, x - sd * 26, y + 20), 40 * k, 60 * k, sd * .2, 0, TAU); g.fill();   // 手掌在信纸外侧
      g.strokeStyle = hg; g.lineCap = 'round'; g.lineWidth = 17 * k; g.beginPath(); g.moveTo(...at(paper, x - sd * 20, y + 10)); g.lineTo(...at(paper, x + sd * 34, y - 6)); g.stroke();   // 拇指压在信纸正面
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(...at(paper, x - sd * 30, y - 30 + i * 4)); g.lineTo(...at(paper, x - sd * 4 + sd * i * 8, y - 70 + i * 2)); g.stroke(); } });   // 其余手指从上沿露出来
    // 铜壶：朝烛火一侧有锐利的高光
    const [jx, jy] = jug;
    blur(1); const jg = g.createLinearGradient(jx - 90 * k, 0, jx + 90 * k, 0); jg.addColorStop(0, '#F2C25A'); jg.addColorStop(.25, '#B07426'); jg.addColorStop(.7, '#4A2A0E'); jg.addColorStop(1, '#1A0E06');
    g.fillStyle = jg; g.beginPath(); g.ellipse(jx, jy, 90 * k, 100 * k, 0, 0, TAU); g.fill(); g.fillRect(jx - 36 * k, jy - 170 * k, 72 * k, 90 * k); g.beginPath(); g.ellipse(jx, jy - 170 * k, 50 * k, 14 * k, 0, 0, TAU); g.fill();
    g.strokeStyle = '#6A3E14'; g.lineWidth = 12 * k; g.beginPath(); g.arc(jx + 90 * k, jy - 60 * k, 50 * k, -1.4, 1.2); g.stroke();
    g.fillStyle = 'rgba(255,240,200,.9)'; g.beginPath(); g.ellipse(jx - 56 * k, jy - 14 * k, 8 * k, 46 * k, .15, 0, TAU); g.fill(); g.beginPath(); g.ellipse(jx - 26 * k, jy - 130 * k, 5 * k, 26 * k, 0, 0, TAU); g.fill();
    // 烛台
    const [cx, cy] = candle;
    blur(1); const cg2 = g.createLinearGradient(cx - 50 * k, 0, cx + 50 * k, 0); cg2.addColorStop(0, '#E8B850'); cg2.addColorStop(1, '#4A2A0E'); g.fillStyle = cg2;
    g.beginPath(); g.ellipse(cx, tableY + 10 * k, 70 * k, 16 * k, 0, 0, TAU); g.fill(); g.fillRect(cx - 10 * k, cy + 20 * k, 20 * k, tableY - cy - 10 * k); g.beginPath(); g.ellipse(cx, cy + 22 * k, 34 * k, 8 * k, 0, 0, TAU); g.fill();
    g.fillStyle = '#F4E8CE'; g.fillRect(cx - 14 * k, cy - 70 * k, 28 * k, 92 * k);
    blur(0);
    // 光里的灰尘
    const dust = Array.from({ length: 90 }, (_, i) => [hash1(i * 3) * 2 - 1, hash1(i * 5), hash1(i * 7) * TAU, .4 + hash1(i * 11) * .8]);
    const light = mk(W, H);
    return { u, k, lit, light, candle, jug, flame: [cx, cy - 76 * k], dust, face };
  },
  draw(ctx, t, s) {
    const { u, k } = s, [cx, cy] = s.flame;
    // 光：点燃后半径展开，之后随火苗呼吸
    const on = eOutCubic(inv(.25, 1.6, t)), br = 1 + .05 * Math.sin(t * 2.2) + .025 * Math.sin(t * 9.3 + 1) + .015 * Math.sin(t * 17.1);
    const z = 1 + .07 * eInOutCubic(t / 5), [zx, zy] = s.face;
    ctx.save(); ctx.translate(zx, zy); ctx.scale(z, z); ctx.translate(-zx, -zy);
    ctx.fillStyle = '#0E0805'; ctx.fillRect(-W, -H, W * 3, H * 3);
    ctx.globalAlpha = .05 * on; ctx.drawImage(s.lit, 0, 0); ctx.globalAlpha = 1;                           // 暗处只剩一点点
    if (on > 0) {
      const lg = s.light.getContext('2d'), R = SHORT * .78 * on * br;
      lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, W, H); lg.drawImage(s.lit, 0, 0);
      lg.globalCompositeOperation = 'destination-in'; const gr = lg.createRadialGradient(cx, cy, 0, cx, cy, R);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.25, 'rgba(0,0,0,.9)'); gr.addColorStop(.5, 'rgba(0,0,0,.42)'); gr.addColorStop(.75, 'rgba(0,0,0,.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = gr; lg.fillRect(0, 0, W, H);
      ctx.drawImage(s.light, 0, 0);
      // 暖色的光晕和火苗
      ctx.globalCompositeOperation = 'lighter';
      const hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220 * k * br); hg.addColorStop(0, `rgba(255,190,90,${.35 * on})`); hg.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = hg; ctx.fillRect(cx - 240 * k, cy - 240 * k, 480 * k, 480 * k);
      ctx.globalCompositeOperation = 'source-over';
      const fl = 1 + .12 * Math.sin(t * 11) + .06 * Math.sin(t * 23.7), sw = Math.sin(t * 3.1) * 3 * k;
      ctx.fillStyle = '#FFF4D0'; ctx.beginPath(); ctx.moveTo(cx - 9 * k, cy); ctx.quadraticCurveTo(cx - 10 * k, cy - 20 * k * fl, cx + sw, cy - 44 * k * fl); ctx.quadraticCurveTo(cx + 10 * k, cy - 20 * k * fl, cx + 9 * k, cy); ctx.quadraticCurveTo(cx, cy + 8 * k, cx - 9 * k, cy); ctx.globalAlpha = on; ctx.fill();
      ctx.fillStyle = '#FFB040'; ctx.beginPath(); ctx.ellipse(cx, cy - 4 * k, 5 * k, 10 * k, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      // 灰尘：在光里慢慢往上飘、轻轻闪
      s.dust.forEach(([dx, dy, ph, sz]) => { const y = cy + 120 * k - ((dy * 600 + t * 26 * sz) % 600) * k, x = cx + dx * (180 * k + (cy - y) * .5) + Math.sin(t * .8 + ph) * 14 * k;
        const d = Math.hypot(x - cx, y - cy) / R, a = on * clamp(1 - d * 1.6) * (.4 + .4 * Math.sin(t * 2 + ph)); if (a < .03) return;
        ctx.globalAlpha = a; ctx.fillStyle = '#FFE6B0'; ctx.beginPath(); ctx.arc(x, y, 1.6 * u * sz, 0, TAU); ctx.fill(); });
      // 铜壶上的反光：金属把烛火映回来，比周围的暗亮得多
      const [jx, jy] = s.jug, ja = on * (.55 + .15 * br * Math.sin(t * 9.3 + 1));
      ctx.globalAlpha = ja; ctx.fillStyle = '#FFE8B0'; ctx.beginPath(); ctx.ellipse(jx - 56 * k, jy - 14 * k, 6 * k, 40 * k, .15, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(jx - 26 * k, jy - 130 * k, 4 * k, 20 * k, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    vignette(ctx, .55);
  }
});
