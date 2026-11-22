// C-073 3D 战役 / 地图俯瞰：Three.js 用分形噪声位移一块地形，挖出一个口朝南的海湾，按高度上色（浅滩、草地、山岩）；半透明的海面下能看出水深；红白两支原创舰队各二十艘（船身、帆都是方块和三角面），按阵形沿预定航线移动；箭雨是一束束沿抛物线飞的短线段，潮流是海面上一排排移动的箭头，2.6 秒处整片箭头掉头、颜色由青转橙；雾是几片缓慢漂移的大块柔光精灵；镜头按三个机位硬切（高空斜俯、贴水跟拍、正俯视地图），Canvas 上叠电视特别节目式的字幕条、兵力条和潮汐表盘。
// 风格提示词：用电视特别节目式 3D 战役复盘风格：俯视真实地形和海湾，双方舰队用红白两色区分并按阵形移动，箭雨、潮流反转和雾气可视化，角落有兵力和潮汐仪表盘，多个机位切换并配字幕解说。
// 题材：3D 与实时图形 · 适合：历史纪录片、战役复盘、地理科普
scene({
  id: 'C-073', name: '3D 战役 / 地图俯瞰', dur: 5, still: 2.4, libs: ['three'],
  fonts: ["900 44px 'Noto Serif SC'", "700 30px 'Noto Sans SC'", "700 24px 'JetBrains Mono'"],
  init() {
    const D = three3d({ fov: LAND ? 40 : 58, far: 800, exposure: 1.0 });
    const T = D.THREE, sc = D.scene, R = mulberry32(73);
    sc.background = new T.Color('#c8d4dc'); sc.fog = new T.Fog('#c8d4dc', 160, 420);
    const sun = new T.DirectionalLight('#fff4e0', 2.4); sun.position.set(-60, 90, 40); sc.add(sun, new T.HemisphereLight('#dfe8f0', '#4a4a3a', 1.0));
    // 地形：海湾口朝 +z
    const S = 240, N = 160;
    const bay = (x, z) => { const dx = x / 70, dz = (z - 20) / 95; return 1 - Math.hypot(dx * (1 + .25 * Math.sin(z * .04)), Math.min(0, dz) * 1.0 + Math.max(0, dz) * .2); };
    const hAt = (x, z) => {
      const b = bay(x, z), n = fbm(x * .02 + 9, z * .02, 5);
      return -10 * smooth(-.1, .6, b) + (1 - smooth(-.25, .05, b)) * (n * 44 + 4) + n * 3 - 2;
    };
    const tg = new T.PlaneGeometry(S, S, N, N).rotateX(-Math.PI / 2), P = tg.attributes.position, cols = [];
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), z = P.getZ(i), h = hAt(x, z); P.setY(i, h);
      const c = new T.Color(h < -1 ? '#c2b48a' : h < 1.5 ? '#d8cc9a' : h < 12 ? '#7a9a5a' : h < 24 ? '#5f7a48' : '#8a8070');
      if (h < -1) c.lerp(new T.Color('#4a6a7a'), smooth(-1, -9, h));
      cols.push(c.r, c.g, c.b);
    }
    tg.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); tg.computeVertexNormals();
    sc.add(new T.Mesh(tg, new T.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: false })));
    const sea = new T.Mesh(new T.PlaneGeometry(S * 3, S * 3).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: '#2f6a8a', transparent: true, opacity: .62, roughness: .3, metalness: .1 }));
    sea.position.y = -.3; sc.add(sea);
    // 船
    const ship = (hullC, sailC) => {
      const g = new T.Group(), m = c => new T.MeshStandardMaterial({ color: c, roughness: .7, side: T.DoubleSide });
      const hull = new T.Mesh(new T.BoxGeometry(1.3, .7, 4.2), m('#4a3424')); hull.position.y = .2; g.add(hull);
      const bow = new T.Mesh(new T.ConeGeometry(.65, 1.4, 4), m('#4a3424')); bow.rotation.x = -Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.position.set(0, .2, -2.8); g.add(bow);
      const mast = new T.Mesh(new T.CylinderGeometry(.06, .06, 4, 5), m('#2a2018')); mast.position.y = 2.2; g.add(mast);
      const sg = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 4, 0), new T.Vector3(0, 1, -1.4), new T.Vector3(0, 1, 1.4)]); sg.computeVertexNormals();
      const sail = new T.Mesh(new T.PlaneGeometry(2.4, 2.6), m(sailC)); sail.position.set(0, 2.5, .1); g.add(sail);
      const flag = new T.Mesh(new T.PlaneGeometry(.8, .5), m(hullC)); flag.position.set(.4, 4.3, 0); flag.rotation.y = Math.PI / 2; g.add(flag);
      g.scale.setScalar(1.3); return g;
    };
    const fleets = { red: [], white: [] };
    for (let i = 0; i < 20; i++) {
      const r = ship('#d02a2a', '#c8342a'); sc.add(r); fleets.red.push({ g: r, i, row: Math.floor(i / 5), col: i % 5, ph: R() * 6 });
      const w = ship('#f4f2ea', '#f4f0e6'); sc.add(w); fleets.white.push({ g: w, i, row: Math.floor(i / 5), col: i % 5, ph: R() * 6 });
    }
    // 潮流箭头
    const arrowG = new T.ShapeGeometry(new T.Shape([new T.Vector2(0, 2), new T.Vector2(1.2, 0), new T.Vector2(.45, 0), new T.Vector2(.45, -1.6), new T.Vector2(-.45, -1.6), new T.Vector2(-.45, 0), new T.Vector2(-1.2, 0)])).rotateX(-Math.PI / 2);
    const arrowM = new T.MeshBasicMaterial({ color: '#5ae0e8', transparent: true, opacity: .75, depthWrite: false });
    const arrows = [];
    for (let i = 0; i < 70; i++) {
      const x = (R() - .5) * 110, z = -60 + R() * 160; if (hAt(x, z) > -1.5) continue;
      const m = new T.Mesh(arrowG, arrowM); m.position.set(x, .2, z); sc.add(m); arrows.push({ m, x, z });
    }
    // 箭雨：线段
    const NA = 600, ap = new Float32Array(NA * 6), aGeo = new T.BufferGeometry(); aGeo.setAttribute('position', new T.BufferAttribute(ap, 3));
    // 箭在 Canvas 上画（投影到屏幕），线宽才能按画面缩放
    const aSeed = Array.from({ length: NA }, () => [R(), R(), R(), R()]);
    // 雾
    const fc = mk(128, 128), fg = fc.getContext('2d'), rg = fg.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(255,255,255,.9)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); fg.fillStyle = rg; fg.fillRect(0, 0, 128, 128);
    const fogs = []; const ft = new T.CanvasTexture(fc);
    for (let i = 0; i < 14; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: ft, transparent: true, opacity: .55, depthWrite: false })); s.scale.set(50, 22, 1); s.position.set((R() - .5) * 140, 6 + R() * 6, -40 + R() * 120); sc.add(s); fogs.push({ s, x: s.position.x, sp: 2 + R() * 3 }); }
    return { D, T, fleets, arrows, ap, aGeo, aSeed, NA, fogs, hAt };
  },
  draw(ctx, t, s) {
    const { D, fleets, arrows, ap, aGeo, aSeed, NA, fogs } = s, u = SHORT / 1080;
    const tide = smooth(2.4, 2.9, t) * 2 - 1;   // -1 涨潮（向北，进湾），+1 退潮（向南，出湾）
    // 白军：0–2.6 秒驶进海湾，之后阵脚散乱、往外退
    const wAdv = smooth(0, 2.6, t) * 1, wRet = smooth(2.8, 5, t);
    for (const p of fleets.white) {
      const chaos = wRet * (hash1(p.i * 3) - .5) * 14;
      const x = (p.col - 2) * 7 + chaos + Math.sin(t + p.ph) * .3, z = 95 - wAdv * 55 + wRet * 30 + p.row * 7 + (hash1(p.i) - .5) * wRet * 10;
      p.g.position.set(x, .1 + Math.sin(t * 2 + p.ph) * .08, z); p.g.rotation.y = wRet * (hash1(p.i + 5) - .5) * 2.4 + (wRet > .5 ? Math.PI * .0 : 0); p.g.rotation.z = Math.sin(t * 1.7 + p.ph) * .05;
    }
    // 红军：在湾内排成横阵，2.6 秒后压上
    const rAdv = smooth(2.8, 5, t);
    for (const p of fleets.red) {
      const x = (p.col - 2) * 6 + (p.row % 2) * 3, z = -12 - p.row * 6 + rAdv * 22;
      p.g.position.set(x * (1 + (1 - p.row * .2) * .3), .1 + Math.sin(t * 2 + p.ph) * .08, z); p.g.rotation.y = Math.PI; p.g.rotation.z = Math.sin(t * 1.5 + p.ph) * .05;
    }
    // 潮流箭头
    for (const a of arrows) {
      const ph = ((t * 6 * -tide + a.z) % 20 + 20) % 20;
      a.m.position.z = a.z + ph * .4 * Math.sign(-tide || 1) * 0 + (t * 5 * tide) % 6;
      a.m.rotation.y = tide < 0 ? 0 : Math.PI; a.m.scale.setScalar(1.3 * Math.abs(tide) + .2);
    }
    const tc = new s.T.Color('#5ae0e8').lerp(new s.T.Color('#ff9a3a'), (tide + 1) / 2); arrows[0].m.material.color.copy(tc);
    // 箭雨：1.6–3.6 秒，红船射向白船
    for (let i = 0; i < NA; i++) {
      const [a, b, c, d] = aSeed[i], t0 = 1.6 + a * 1.6, q = (t - t0) / .9;
      const k = i * 6;
      if (q < 0 || q > 1) { ap.fill(0, k, k + 6); continue; }
      const from = fleets.red[Math.floor(b * 20)].g.position, to = fleets.white[Math.floor(c * 20)].g.position;
      const P = qq => [lerp(from.x, to.x + (d - .5) * 6, qq), 3 + Math.sin(qq * Math.PI) * 22 + lerp(0, -3, qq), lerp(from.z, to.z + (d - .5) * 6, qq)];
      const p0 = P(q), p1 = P(Math.max(0, q - .04));
      ap.set(p0, k); ap.set(p1, k + 3);
    }
    aGeo.attributes.position.needsUpdate = true;
    for (const f of fogs) { f.s.position.x = f.x + t * f.sp; f.s.material.opacity = .35 + .25 * smooth(2.6, 4, t); }
    // 三个机位
    const shot = t < 1.7 ? 0 : t < 3.3 ? 1 : 2, lt = shot === 0 ? t : shot === 1 ? t - 1.7 : t - 3.3;
    const cam = D.camera;
    if (shot === 0) { cam.position.set(-90 + lt * 12, 85 - lt * 6, 150 - lt * 10); cam.lookAt(0, 0, 20); }
    else if (shot === 1) { cam.position.set(58 - lt * 5, 16 + lt, 2 + lt * 4); cam.lookAt(0, 6, 22); }
    else { cam.position.set(0, (LAND ? 175 : 235) - lt * 10, 22.01); cam.lookAt(0, 0, 22); }
    D.render(); ctx.drawImage(D.canvas, 0, 0, W, H);
    { const v0 = new s.T.Vector3(), v1 = new s.T.Vector3(); ctx.strokeStyle = 'rgba(26,20,16,.85)'; ctx.lineWidth = (shot === 1 ? 2.6 : 1.4) * u; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i < NA; i++) { const k = i * 6; if (!ap[k + 1]) continue; v0.fromArray(ap, k).project(cam); v1.fromArray(ap, k + 3).project(cam); if (v0.z > 1 || v1.z > 1) continue;
        ctx.moveTo((v0.x * .5 + .5) * W, (-v0.y * .5 + .5) * H); ctx.lineTo((v1.x * .5 + .5) * W, (-v1.y * .5 + .5) * H); }
      ctx.stroke(); }
    // 地图模式下的标注
    if (shot === 2) {
      const v = new s.T.Vector3();
      const lab = (pos, txt, col) => { v.copy(pos).project(cam); const x = (v.x * .5 + .5) * W, y = (-v.y * .5 + .5) * H;
        ctx.font = `700 ${Math.round(26 * u)}px 'Noto Sans SC'`; const w = ctx.measureText(txt).width + 24 * u;
        ctx.fillStyle = col; rr(ctx, x - w / 2, y - 60 * u, w, 40 * u, 6 * u); ctx.fill(); ctx.fillStyle = col === '#f4f2ea' ? '#1a1a1a' : '#fff'; ctx.textAlign = 'center'; ctx.fillText(txt, x, y - 31 * u); };
      lab(fleets.red[12].g.position, '赤军', '#c8282a'); lab(fleets.white[2].g.position, '白军', '#f4f2ea');
    }
    // 字幕条
    const subs = ['白军舰队乘涨潮驶入海湾', '赤军列阵湾内，箭雨齐发', '潮水倒流，白军阵脚大乱'];
    const sk = clamp(lt / .25);
    ctx.save(); ctx.globalAlpha = sk;
    const sy = LAND ? H - 120 * u : H - 300 * u;
    ctx.font = `900 ${Math.round((LAND ? 44 : 50) * u)}px 'Noto Serif SC'`; ctx.textAlign = 'center';
    const sw = ctx.measureText(subs[shot]).width + 80 * u;
    ctx.fillStyle = 'rgba(12,14,20,.78)'; ctx.fillRect(W / 2 - sw / 2, sy - 52 * u, sw, 76 * u);
    ctx.fillStyle = '#c8282a'; ctx.fillRect(W / 2 - sw / 2, sy - 52 * u, 8 * u, 76 * u);
    ctx.fillStyle = '#fff'; ctx.fillText(subs[shot], W / 2, sy);
    ctx.restore();
    // 左上：节目角标
    ctx.fillStyle = 'rgba(12,14,20,.78)'; ctx.fillRect(30 * u, (LAND ? 30 : 80) * u, 300 * u, 56 * u);
    ctx.fillStyle = '#c8282a'; ctx.fillRect(30 * u, (LAND ? 30 : 80) * u, 56 * u, 56 * u);
    ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(30 * u)}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.fillText('战', 58 * u, (LAND ? 70 : 120) * u);
    ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(26 * u)}px 'Noto Sans SC'`; ctx.fillText('赤湾之战 · 复盘', 100 * u, (LAND ? 68 : 118) * u);
    // 右上：兵力和潮汐仪表盘
    const pw = 330 * u, px = W - pw - 30 * u, py = (LAND ? 30 : 80) * u;
    ctx.fillStyle = 'rgba(12,14,20,.78)'; rr(ctx, px, py, pw, 250 * u, 10 * u); ctx.fill();
    ctx.fillStyle = '#9aa4b0'; ctx.font = `700 ${Math.round(22 * u)}px 'Noto Sans SC'`; ctx.fillText('兵力', px + 20 * u, py + 38 * u);
    const red = 8000 - smooth(3, 5, t) * 600, white = 12000 - smooth(2, 5, t) * 5200;
    [[red, '#e0403a', '赤'], [white, '#f4f2ea', '白']].forEach(([v, c, n], i) => {
      const y = py + 60 * u + i * 44 * u;
      ctx.fillStyle = c; ctx.fillText(n, px + 20 * u, y + 20 * u);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(px + 52 * u, y + 4 * u, 170 * u, 18 * u);
      ctx.fillStyle = c; ctx.fillRect(px + 52 * u, y + 4 * u, 170 * u * v / 12000, 18 * u);
      ctx.font = `700 ${Math.round(20 * u)}px 'JetBrains Mono'`; ctx.fillText(String(Math.round(v)), px + 232 * u, y + 21 * u); ctx.font = `700 ${Math.round(22 * u)}px 'Noto Sans SC'`;
    });
    // 潮汐表盘
    const gx = px + 80 * u, gy = py + 205 * u, gr = 46 * u;
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 10 * u; ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, TAU); ctx.stroke();
    ctx.strokeStyle = tc.getStyle(); ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, Math.PI * (1.5 + tide * .5)); ctx.stroke();
    const na = Math.PI * (1.5 + tide * .5); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(na) * gr, gy + Math.sin(na) * gr); ctx.stroke();
    ctx.fillStyle = '#9aa4b0'; ctx.fillText('潮汐', px + 150 * u, gy - 18 * u);
    ctx.fillStyle = tc.getStyle(); ctx.font = `700 ${Math.round(26 * u)}px 'Noto Sans SC'`; ctx.fillText(tide < 0 ? '涨潮 ↑' : '退潮 ↓', px + 150 * u, gy + 14 * u);
  }
});
