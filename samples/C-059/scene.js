// C-059 分屏“跑酷 + 讲解”：横屏左右分、竖屏上下分；一半是 Three.js 渲染的原创街道跑酷（三条跑道、两侧楼房、路障和旋转的金币都由几何体拼成，体素小人按正弦摆臂摆腿，跳跃和换道按关键帧），镜头跟在身后，Canvas 叠分数和金币计数；另一半是深色讲解板，按时间逐项写出起跳公式、画出高度–时间曲线，曲线上的点用跑酷里同一个跳跃函数算，所以小人每跳一次、图上的点就沿抛物线走一遍；最后亮出最大高度的结论。
// 风格提示词：用左右分屏格式：左半屏是一个原创的 3D 街道跑酷游戏一直在跑、带分数和金币，右半屏是深色背景上的公式和图表跟着旁白逐项讲解，两边同时进行。
// 题材：版式与界面 · 适合：知识科普、注意力留存型短视频
const JUMPS = [1.2, 3.1], JD = .8, V0 = 6, GR = 15;    // 起跳时刻、滞空秒数、起跳速度、重力（游戏单位）
const jumpH = t => { for (const j of JUMPS) { const q = t - j; if (q >= 0 && q <= JD) return V0 * q - GR / 2 * q * q; } return 0; };
scene({
  id: 'C-059', name: '分屏“跑酷 + 讲解”', dur: 5, still: 3.4, libs: ['three'],
  fonts: ["900 44px 'Noto Sans SC'", "500 40px 'Noto Serif SC'", "700 30px 'JetBrains Mono'"],
  init() {
    const pw = LAND ? W / 2 : W, ph = LAND ? H : H / 2;
    const D = three3d({ w: pw, h: ph, fov: 60, far: 300 });
    const T = D.THREE, sc = D.scene, R = mulberry32(59);
    sc.background = new T.Color('#9fd4ff'); sc.fog = new T.Fog('#9fd4ff', 40, 120);
    const sun = new T.DirectionalLight('#ffffff', 2.4); sun.position.set(4, 10, 6); sc.add(sun, new T.HemisphereLight('#dff0ff', '#8a7a6a', 1.1));
    const S = c => new T.MeshStandardMaterial({ color: c, roughness: .7, flatShading: true });
    const road = new T.Mesh(new T.PlaneGeometry(9, 400).rotateX(-Math.PI / 2), S('#5a5a66')); road.position.z = -180; sc.add(road);
    for (const x of [-1.5, 1.5]) for (let z = 0; z > -360; z -= 4) { const l = new T.Mesh(new T.PlaneGeometry(.12, 2).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: '#e8e8e8' })); l.position.set(x, .01, z); sc.add(l); }
    const walkM = S('#c8c0b4');
    for (const sd of [-1, 1]) { const w = new T.Mesh(new T.BoxGeometry(3, .3, 400), walkM); w.position.set(sd * 6, .15, -180); sc.add(w); }
    const cols = ['#f4a0a0', '#a0c8f4', '#f4dc8a', '#b4e4b0', '#e4b4f0', '#f0f0e8'];
    for (const sd of [-1, 1]) for (let z = 10; z > -360; z -= 7 + R() * 3) {
      const h = 5 + R() * 12, b = new T.Mesh(new T.BoxGeometry(6, h, 6), S(cols[Math.floor(R() * 6)])); b.position.set(sd * 10.5, h / 2, z); sc.add(b);
      const win = new T.Mesh(new T.PlaneGeometry(4, h * .7), new T.MeshBasicMaterial({ color: '#4a6a8a' })); win.position.set(sd * 7.49, h * .5, z); win.rotation.y = -sd * Math.PI / 2; sc.add(win);
    }
    // 路障和金币（世界坐标固定，人往 -z 跑）
    const LANE = [-3, 0, 3], speed = 14;
    const obstacles = [[0, -speed * (JUMPS[0] + .35)], [1, -speed * (JUMPS[1] + .35)], [2, -speed * 1.5], [0, -speed * 4.4], [2, -speed * 3.6]];
    for (const [l, z] of obstacles) {
      const g = new T.Group();
      const bar = new T.Mesh(new T.BoxGeometry(2.4, .5, .3), S('#e84a3a')); bar.position.y = 1.0; g.add(bar);
      const st = new T.Mesh(new T.BoxGeometry(2.4, .2, .3), S('#f8f8f8')); st.position.y = 1.0; st.scale.x = .3; g.add(st);
      for (const x of [-1, 1]) { const leg = new T.Mesh(new T.BoxGeometry(.2, 1, .2), S('#3a3a3a')); leg.position.set(x, .5, 0); g.add(leg); }
      g.position.set(LANE[l], 0, z); sc.add(g);
    }
    const coins = [], coinG = new T.CylinderGeometry(.45, .45, .12, 20).rotateX(Math.PI / 2), coinM = new T.MeshStandardMaterial({ color: '#ffd030', metalness: .6, roughness: .25, emissive: '#6a4a00' });
    const laneAt = t => keyAt([[0, 1], [2.25, 1], [2.5, 0], [3.0, 0], [3.95, 0], [4.2, 1]], t);
    for (let k = 0; k < 40; k++) {
      const tt = .4 + k * .12, z = -speed * tt, l = laneAt(tt), y = 1 + jumpH(tt) * .9;
      const c = new T.Mesh(coinG, coinM); c.position.set(lerp(-3, 3, l / 2), y, z); sc.add(c); coins.push({ c, tt });
    }
    // 小人
    const man = new T.Group(), J = {};
    const box = (w, h, d, c, y) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), S(c)); m.position.y = y; return m; };
    man.add(box(.6, .7, .36, '#3a7ae8', 1.2), box(.5, .5, .5, '#f2c9a0', 1.85), box(.54, .16, .54, '#2a2a3a', 2.13), box(.5, .5, .2, '#ff8a2a', 1.25).translateZ(.28));
    for (const [k, x, y, c, h] of [['lA', -.42, 1.5, '#f2c9a0', .55], ['rA', .42, 1.5, '#f2c9a0', .55], ['lL', -.16, .85, '#2a2a3a', .8], ['rL', .16, .85, '#2a2a3a', .8]]) {
      const g = new T.Group(); g.position.set(x, y, 0); const m = box(.2, h, .2, c, -h / 2); g.add(m); man.add(g); J[k] = g;
    }
    sc.add(man);
    return { D, T, man, J, coins, speed, laneAt, pw, ph };
  },
  draw(ctx, t, s) {
    const { D, man, J, coins, speed, laneAt, pw, ph } = s, u = SHORT / 1080;
    // ---- 跑酷 ----
    const z = -speed * t, l = laneAt(t), x = lerp(-3, 3, l / 2), y = jumpH(t);
    man.position.set(x, y, z); man.rotation.z = (laneAt(t + .05) - l) * -2;
    const air = y > 0, cyc = air ? 0 : Math.sin(t * 16);
    J.lA.rotation.x = air ? -2.6 : cyc * 1.1; J.rA.rotation.x = air ? -2.6 : -cyc * 1.1; J.lL.rotation.x = air ? -1 : -cyc; J.rL.rotation.x = air ? .6 : cyc;
    let got = 0;
    for (const c of coins) { const g = c.tt < t - .02; c.c.visible = !g; got += g; c.c.rotation.y = t * 5 + c.tt; }
    D.camera.position.set(x * .6, 4.2 + y * .4, z + 7); D.camera.lookAt(x * .8, 1.6 + y * .3, z - 6);
    D.render();
    const [ox, oy] = LAND ? [0, 0] : [0, 0];
    ctx.drawImage(D.canvas, ox, oy, pw, ph);
    // 分数和金币
    ctx.font = `700 ${Math.round(34 * u)}px 'JetBrains Mono'`; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
    const hud = (txt, hx, hy, al) => { ctx.textAlign = al; ctx.lineWidth = 8 * u; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(txt, hx, hy); ctx.fillStyle = '#fff'; ctx.fillText(txt, hx, hy); };
    hud(String(Math.floor(t * 1234 + got * 50)).padStart(6, '0'), pw - 30 * u, 30 * u, 'right');
    ctx.fillStyle = '#ffd030'; ctx.beginPath(); ctx.arc(46 * u, 50 * u, 16 * u, 0, TAU); ctx.fill();
    hud(`× ${got}`, 72 * u, 32 * u, 'left');
    // ---- 讲解板 ----
    const bx = LAND ? W / 2 : 0, by = LAND ? 0 : H / 2, bw = LAND ? W / 2 : W, bh = LAND ? H : H / 2;
    ctx.fillStyle = '#12141c'; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
    for (let gx = bx; gx < bx + bw; gx += 40 * u) { ctx.beginPath(); ctx.moveTo(gx, by); ctx.lineTo(gx, by + bh); ctx.stroke(); }
    for (let gy = by; gy < by + bh; gy += 40 * u) { ctx.beginPath(); ctx.moveTo(bx, gy); ctx.lineTo(bx + bw, gy); ctx.stroke(); }
    ctx.fillStyle = '#ff8a2a'; ctx.fillRect(LAND ? bx : 0, LAND ? 0 : by, LAND ? 6 * u : W, LAND ? H : 6 * u);
    const px = bx + 60 * u, k1 = smooth(.2, .5, t), k2 = smooth(.7, 1.0, t), k3 = smooth(1.1, 1.4, t), k4 = smooth(3.9, 4.2, t);
    let yy = by + (LAND ? 80 : 50) * u;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = k1; ctx.font = `900 ${Math.round(44 * u)}px 'Noto Sans SC'`; ctx.fillStyle = '#fff'; ctx.fillText('跳一下能有多高？', px, yy + 40 * u);
    yy += 100 * u; ctx.globalAlpha = k2;
    ctx.font = `italic 500 ${Math.round(46 * u)}px 'Noto Serif SC'`; ctx.fillStyle = '#9fd8ff';
    ctx.fillText('h(t) = v₀t − ½gt²', px + (1 - k2) * 30 * u, yy + 40 * u);
    ctx.font = `700 ${Math.round(24 * u)}px 'JetBrains Mono'`; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillText(`v₀ = ${V0}  g = ${GR}`, px, yy + 82 * u);
    // 图：高度–时间
    const gx0 = px, gw = bw - 120 * u, gy1 = yy + (LAND ? 130 : 110) * u, gh = LAND ? 360 * u : 280 * u, gy0 = gy1 + gh;
    const hmax = V0 * V0 / (2 * GR), X = q => gx0 + q / JD * gw, Y = h => gy0 - h / (hmax * 1.25) * gh;
    ctx.globalAlpha = k3; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2 * u;
    ctx.beginPath(); ctx.moveTo(gx0, gy1); ctx.lineTo(gx0, gy0); ctx.lineTo(gx0 + gw, gy0); ctx.stroke();
    ctx.font = `700 ${Math.round(22 * u)}px 'JetBrains Mono'`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillText('h', gx0 - 30 * u, gy1 + 10 * u); ctx.textAlign = 'right'; ctx.fillText('t', gx0 + gw, gy0 + 30 * u); ctx.textAlign = 'left';
    const draw = smooth(1.1, 1.9, t);
    ctx.strokeStyle = '#ff8a2a'; ctx.lineWidth = 5 * u; ctx.beginPath();
    for (let i = 0; i <= 60 * draw; i++) { const q = i / 60 * JD, h = V0 * q - GR / 2 * q * q; i ? ctx.lineTo(X(q), Y(h)) : ctx.moveTo(X(q), Y(h)); } ctx.stroke();
    // 点跟着跑酷里的跳
    let q = -1; for (const j of JUMPS) if (t >= j && t <= j + JD) q = t - j;
    if (q >= 0) {
      const h = V0 * q - GR / 2 * q * q;
      ctx.setLineDash([6 * u, 6 * u]); ctx.strokeStyle = 'rgba(159,216,255,.6)'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(X(q), gy0); ctx.lineTo(X(q), Y(h)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(q), Y(h), 12 * u, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9fd8ff'; ctx.font = `700 ${Math.round(24 * u)}px 'JetBrains Mono'`; ctx.fillText(`h = ${h.toFixed(2)}`, X(q) + 18 * u, Y(h) - 14 * u);
    }
    // 结论
    ctx.globalAlpha = k4;
    const cy = gy0 + (LAND ? 110 : 80) * u;
    ctx.fillStyle = 'rgba(255,138,42,.15)'; rr(ctx, px - 16 * u, cy - 54 * u, gw + 32 * u, 76 * u, 12 * u); ctx.fill();
    ctx.font = `italic 500 ${Math.round(40 * u)}px 'Noto Serif SC'`; ctx.fillStyle = '#ffb060';
    ctx.fillText(`h_max = v₀² / 2g = ${hmax.toFixed(1)}`, px + (1 - k4) * 30 * u, cy);
    ctx.globalAlpha = 1;
  }
});
