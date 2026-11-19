// C-159 魔灯幻灯片：init 里每张玻璃片先用 toneMap 画明暗、hatchLines 铺三层雕版排线，再用模糊的透明色块按 multiply 手工上色；每帧在漆黑里裁出一个圆形光斑放这张片，光的亮度按噪声闪烁、边缘暗角，1.6 秒第二张横向滑入，3 秒叠化成两片反向旋转的彩色万花筒片，最后镜头拉远露出幕布、红帘、光束和观众剪影。
// 风格提示词：用魔灯幻灯片风格：漆黑讲堂里一盏油灯把手工上色的雕版玻璃片投在圆形光斑里，四周暗角，光随油灯不停闪烁，换片时玻璃片横向滑入或两张叠化，偶尔插进一片旋转的彩色万花筒片，镜头不时拉远露出幕布和观众剪影，旁白像一场旅行讲座。
// 题材：电影年代与屏幕科技 · 适合：历史与游记、讲故事式 MV、维多利亚时代题材
scene({
  id: 'C-159', name: '魔灯幻灯片', dur: 5, still: 1.2,
  fonts: [],
  init() {
    const u = SHORT / 1080, S = SHORT * .92, ox = W / 2 - S / 2, oy = H / 2 - S / 2, P = (x, y) => [ox + x * S, oy + y * S];
    const slide = (tone, tint, seed) => {
      const T = toneMap(tone, { res: 3, blur: 3 * u });
      const c = mk(W, H), g = c.getContext('2d'); g.fillStyle = '#F4EAD2'; g.fillRect(0, 0, W, H);
            const ink = { color: '#2A1A10', width: 1.7 * u, wob: .4 * u, seed };
      for (const [a, gap, thr] of [[.35, 7, .75], [-.7, 7, .5], [1.3, 6, .25]]) drawHatch(g, hatchLines(T, { angle: a, gap: gap * u, thr, minLen: 4 * u, seed: seed + a * 10 | 0 }), 1, ink);
      g.globalCompositeOperation = 'multiply'; g.save(); g.filter = `blur(${5 * u}px)`; g.globalAlpha = .6; tint(g); g.restore();
      g.globalCompositeOperation = 'source-over';
      const R = mulberry32(seed); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(40,25,10,${.3 + R() * .4})`; g.beginPath(); g.arc(ox + R() * S, oy + R() * S, (.6 + R() * 1.8) * u, 0, TAU); g.fill(); }   // 玻璃上的灰
      return c; };
    const blob = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(...P(x, y), rx * S, ry * S, 0, 0, TAU); g.fill(); };
    const poly = (g, pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach(q => g.lineTo(...P(...q))); g.closePath(); g.fill(); };
    // 第一张：月夜海上的帆船和灯塔
    const s1 = slide(g => {
      const sk = g.createLinearGradient(0, oy, 0, oy + S * .62); sk.addColorStop(0, '#666'); sk.addColorStop(1, '#BBB'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
      const mg = g.createRadialGradient(...P(.72, .22), 0, ...P(.72, .22), S * .22); mg.addColorStop(0, '#FFF'); mg.addColorStop(.3, '#EEE'); mg.addColorStop(1, 'rgba(200,200,200,0)'); g.fillStyle = mg; g.fillRect(0, 0, W, H);
      [[.3, .22, .18, .04], [.5, .34, .2, .035], [.18, .4, .12, .03]].forEach(([x, y, a, b]) => blob(g, x, y, a, b, '#9A9A9A'));
      const sea = g.createLinearGradient(0, oy + S * .6, 0, oy + S); sea.addColorStop(0, '#666'); sea.addColorStop(1, '#2A2A2A'); g.fillStyle = sea; g.fillRect(0, oy + S * .6, W, S);
      for (let i = 0; i < 14; i++) blob(g, .72 + Math.sin(i) * .03, .64 + i * .022, .06 - i * .003, .006, '#DDD');                    // 月光倒影
      poly(g, [[0, .78], [.06, .5], [.14, .5], [.22, .7], [.3, .8], [0, .85]], '#222');                                   // 礁石
      poly(g, [[.075, .5], [.085, .26], [.115, .26], [.125, .5]], '#BBB'); for (let k = 0; k < 4; k++) poly(g, [[.08, .44 - k * .06], [.12, .44 - k * .06], [.12, .41 - k * .06], [.08, .41 - k * .06]], '#444');
      blob(g, .1, .24, .025, .02, '#FFF');
      poly(g, [[0.295, 0.600], [0.685, 0.600], [0.610, 0.705], [0.355, 0.705]], '#151515');                                                    // 船身
      g.strokeStyle = '#111'; g.lineWidth = 4 * u; [[0.430, 0.600, .26], [0.550, 0.600, .3]].forEach(([x, y, h]) => { g.beginPath(); g.moveTo(...P(x, y)); g.lineTo(...P(x, h)); g.stroke(); });
      poly(g, [[0.438, 0.150], [0.535, 0.210], [0.520, 0.540], [0.438, 0.555]], '#FFF'); poly(g, [[0.558, 0.105], [0.655, 0.180], [0.640, 0.540], [0.558, 0.555]], '#F4F4F4'); poly(g, [[0.422, 0.180], [0.325, 0.570], [0.422, 0.570]], '#EEE');
    }, g => {
      const tg = g.createLinearGradient(0, oy, 0, oy + S * .62); tg.addColorStop(0, '#5A6AC8'); tg.addColorStop(1, '#C8A8D8'); g.fillStyle = tg; g.fillRect(ox, oy, S, S * .62);
      blob(g, .72, .22, .1, .1, '#F2D24A'); g.fillStyle = '#2A7A86'; g.fillRect(ox, oy + S * .6, S, S * .4); for (let i = 0; i < 8; i++) blob(g, .72, .66 + i * .04, .05, .01, '#E8D060');
      blob(g, .1, .38, .03, .14, '#C8402A'); blob(g, .1, .24, .04, .04, '#F2C030'); blob(g, .12, .68, .12, .1, '#6A4A2A');
      blob(g, .5, .4, .13, .2, '#F0E2B0'); blob(g, .49, .65, .2, .04, '#8A3A1A');
    }, 3);
    // 第二张：热气球飞过小镇
    const s2 = slide(g => {
      const sk = g.createLinearGradient(0, oy, 0, oy + S); sk.addColorStop(0, '#CCC'); sk.addColorStop(1, '#EEE'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
      [[.2, .2, .14, .05], [.8, .3, .16, .05], [.62, .14, .1, .03]].forEach(([x, y, a, b]) => { blob(g, x, y + .015, a, b, '#AAA'); blob(g, x, y, a * .9, b * .8, '#FFF'); });
      const bg = g.createRadialGradient(...P(.44, .28), S * .02, ...P(.5, .36), S * .2); bg.addColorStop(0, '#F8F8F8'); bg.addColorStop(.6, '#999'); bg.addColorStop(1, '#3A3A3A'); g.fillStyle = bg;
      g.beginPath(); g.moveTo(...P(.5, .56)); g.bezierCurveTo(...P(.3, .46), ...P(.3, .18), ...P(.5, .18)); g.bezierCurveTo(...P(.7, .18), ...P(.7, .46), ...P(.5, .56)); g.fill();
      g.strokeStyle = '#222'; g.lineWidth = 2 * u; [[.44, .5], [.56, .5]].forEach(([x, y]) => { g.beginPath(); g.moveTo(...P(x, y)); g.lineTo(...P(.5 + (x - .5) * .5, .62)); g.stroke(); });
      poly(g, [[.475, .62], [.525, .62], [.52, .66], [.48, .66]], '#222');
      g.fillStyle = '#888'; g.beginPath(); g.moveTo(...P(0, .82)); g.quadraticCurveTo(...P(.3, .72), ...P(.6, .8)); g.quadraticCurveTo(...P(.85, .86), ...P(1, .76)); g.lineTo(...P(1, 1)); g.lineTo(...P(0, 1)); g.fill();
      for (let i = 0; i < 9; i++) { const x = .08 + i * .1, h = .06 + (i % 3) * .03; poly(g, [[x, .95], [x, .95 - h], [x + .04, .95 - h - .04], [x + .08, .95 - h], [x + .08, .95]], '#333'); blob(g, x + .04, .93 - h * .5, .008, .012, '#EEE'); }
      poly(g, [[.62, .95], [.62, .74], [.64, .64], [.66, .74], [.66, .95]], '#2A2A2A');
    }, g => {
      g.fillStyle = '#8AB8E0'; g.fillRect(ox, oy, S, S * .8);
      g.save(); g.beginPath(); g.moveTo(...P(.5, .56)); g.bezierCurveTo(...P(.3, .46), ...P(.3, .18), ...P(.5, .18)); g.bezierCurveTo(...P(.7, .18), ...P(.7, .46), ...P(.5, .56)); g.clip();
      for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#E8B830' : '#D0302A'; g.beginPath(); g.ellipse(...P(.5, .37), (.2 - i * .034) * S, .2 * S, 0, 0, TAU); g.fill(); } g.restore();
      g.fillStyle = '#5A9A4A'; g.fillRect(ox, oy + S * .78, S, S * .22); for (let i = 0; i < 9; i++) blob(g, .12 + i * .1, .88, .035, .03, i % 2 ? '#B04A3A' : '#C8A060');
    }, 7);
    // 观众：一排头和肩的剪影
    const aud = []; const R = mulberry32(9); for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) aud.push([W * (-.25 + i * .1 + (r % 2) * .05 + (R() - .5) * .03), H * (1.18 + r * .12), (60 + R() * 16 + r * 12) * u, R()]);
    return { u, S, ox, oy, s1, s2, aud };
  },
  draw(ctx, t, s) {
    const { u, S } = s, cx = W / 2, cy = H / 2, rr = LAND ? H * .45 : W * .47;
    const fl = .82 + noise1(t * 7) * .14 + noise1(t * 23 + 5) * .06;              // 油灯闪
    const z = 1 - .46 * eInOutCubic(inv(3.6, 4.7, t)), zc = LAND ? H * .44 : H * .46;
    ctx.fillStyle = '#050403'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(cx, zc); ctx.scale(z, z); ctx.translate(-cx, -zc);
    // 幕布（被光斑周围的散光照得发灰）、红帘
    const sw = LAND ? W * .62 : W * .62, sh = LAND ? H * .55 : H * .38;
    ctx.fillStyle = `rgba(34,30,25,${fl})`; ctx.fillRect(cx - sw, cy - sh, sw * 2, sh * 2);
    const sg = ctx.createRadialGradient(cx, cy, rr * .9, cx, cy, sw); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(5,4,3,.92)'); ctx.fillStyle = sg; ctx.fillRect(cx - sw, cy - sh, sw * 2, sh * 2);
    for (const sd of [-1, 1]) { const x0 = cx + sd * sw; ctx.fillStyle = '#4A0E0E';
      ctx.beginPath(); ctx.moveTo(x0 - sd * 40 * u, cy - sh * 1.4); ctx.lineTo(x0 + sd * W * .4, cy - sh * 1.4); ctx.lineTo(x0 + sd * W * .4, cy + sh * 1.8); ctx.lineTo(x0 + sd * 30 * u, cy + sh * 1.8); ctx.quadraticCurveTo(x0 - sd * 60 * u, cy, x0 - sd * 40 * u, cy - sh * 1.4); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 8 * u; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x0 + sd * k * 50 * u, cy - sh * 1.4); ctx.quadraticCurveTo(x0 + sd * (k * 50 - 30) * u, cy, x0 + sd * k * 54 * u, cy + sh * 1.8); ctx.stroke(); } }
    ctx.fillStyle = '#3A0A0A'; ctx.fillRect(cx - sw - W * .4, cy - sh * 1.4, sw * 2 + W * .8, 70 * u);
    // 光束（拉远后才看得见）
    const ba = smooth(3.5, 4.5, t) * .16 * fl, py = H * 2.1;
    if (ba > 0) { const bg = ctx.createLinearGradient(0, py, 0, cy); bg.addColorStop(0, `rgba(255,230,170,${ba * 2})`); bg.addColorStop(1, `rgba(255,230,170,${ba * .4})`); ctx.fillStyle = bg;
      ctx.beginPath(); ctx.moveTo(cx - 20 * u, py); ctx.lineTo(cx - rr, cy); ctx.lineTo(cx + rr, cy); ctx.lineTo(cx + 20 * u, py); ctx.fill();
      for (let i = 0; i < 40; i++) { const q = hash1(i * 3), x = lerp(cx, cx + (hash1(i * 5) - .5) * 2 * rr, q), y = lerp(py, cy, q) + Math.sin(t + i) * 8 * u; ctx.fillStyle = `rgba(255,240,200,${ba * 2.5})`; ctx.fillRect(x, y - ((t * 20 + i * 13) % 40) * u, 2 * u, 2 * u); } }
    // 光斑：圆里放片
    ctx.save(); ctx.beginPath(); ctx.arc(cx + Math.sin(t * 13) * .8 * u, cy, rr, 0, TAU); ctx.clip();
    const sx = s.ox, sy = s.oy, put = (img, dx, a = 1) => { ctx.globalAlpha = a; ctx.drawImage(img, sx, sy, S, S, cx - rr + dx, cy - rr, rr * 2, rr * 2); ctx.globalAlpha = 1; };
    const sl = eInOutCubic(inv(1.55, 2.05, t)), mix = smooth(3.0, 3.5, t);
    if (mix < 1) { if (sl < 1) put(s.s1, -sl * rr * 2.2); if (sl > 0) put(s.s2, (1 - sl) * rr * 2.2);
      if (sl > 0 && sl < 1) { ctx.fillStyle = '#120C08'; ctx.fillRect(cx - rr + (1 - sl) * rr * 2.2 - rr * .2, cy - rr, rr * .2, rr * 2); } }       // 片框
    if (mix > 0) {                                                                  // 万花筒片：两片反向转
      ctx.save(); ctx.globalAlpha = mix; ctx.fillStyle = '#100A06'; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); ctx.globalCompositeOperation = 'lighter';
      const disk = (rot, cols, n, tw) => { for (let i = 0; i < n; i++) { const a0 = rot + i * TAU / n; ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(cx, cy);
        for (let k = 0; k <= 20; k++) { const q = k / 20, r = q * rr; ctx.lineTo(cx + Math.cos(a0 + q * tw) * r, cy + Math.sin(a0 + q * tw) * r); }
        for (let k = 20; k >= 0; k--) { const q = k / 20, r = q * rr; ctx.lineTo(cx + Math.cos(a0 + TAU / n * .5 + q * tw) * r, cy + Math.sin(a0 + TAU / n * .5 + q * tw) * r); } ctx.fill(); } };
      disk(t * 1.6, ['rgba(220,40,30,.85)', 'rgba(240,200,40,.85)', 'rgba(40,90,220,.85)'], 12, 2.4);
      disk(-t * 2.1, ['rgba(40,180,90,.6)', 'rgba(200,60,200,.6)'], 10, -2.8);
      ctx.globalCompositeOperation = 'source-over';
      for (let k = 1; k < 5; k++) { ctx.strokeStyle = `rgba(20,10,5,${.5 * mix})`; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(cx, cy, rr * k / 5, 0, TAU); ctx.stroke(); }
      ctx.restore(); }
    // 闪烁、暖色、圆边暗角
    ctx.fillStyle = `rgba(0,0,0,${(1 - fl) * .6})`; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#FFE6B8'; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); ctx.globalCompositeOperation = 'source-over';
    const vg = ctx.createRadialGradient(cx, cy, rr * .68, cx, cy, rr); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,3,2,.75)'); ctx.fillStyle = vg; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
    ctx.restore();
    // 观众剪影
    for (const [x, y, r, k] of s.aud) { ctx.fillStyle = '#020101'; ctx.beginPath(); ctx.ellipse(x, y + Math.sin(t * 1.5 + k * 9) * 2 * u, r * .42, r * .5, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y + r * 1.1, r * 1.1, r * .7, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(x - r * 1.1, y + r * 1.1, r * 2.2, r * 2);
      if (k > .7) { ctx.beginPath(); ctx.ellipse(x, y - r * .4, r * .7, r * .16, 0, 0, TAU); ctx.fill(); ctx.fillRect(x - r * .38, y - r * .95, r * .76, r * .6); } }   // 礼帽
    ctx.restore();
    grain(ctx, Math.floor(t * 30), .25);
  }
});
