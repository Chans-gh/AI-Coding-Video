// C-105 科幻全息线框：Three.js 把一架原创的小型无人机（机身、四根机臂、旋翼、电池、云台）全部画成发光线框（EdgesGeometry + 叠加混合），悬在一圈圈刻度的圆形投影台上；开场一道扫描面自下而上用裁剪平面把模型“扫”出来；之后四个部件按时间表逐个被锁定：Canvas 2D 画的瞄准框从大到小转正收紧，部件沿自己的方向局部弹出，引线拉到侧边标签，数字从乱码一位位滚成真实数值，锁定的那一帧变成全片唯一的暖橙色。
// 风格提示词：用科幻全息线框风格：物体被扫描成发光的线框，悬在圆形投影台上，瞄准框一个个锁定部件并局部爆炸展开，引线拉出，数字从乱码滚动成真实数值，数值锁定的那一帧变成唯一的暖色强调，整体只用一种冷色加一种暖色。
// 题材：电影年代与屏幕科技 · 适合：产品参数讲解、硬件拆解、循环展示屏
const LK = [1.35, 2.15, 2.95, 3.75]; // 锁定时间（sound.py 用同一组数）
const PARTS = [
  { name: '旋翼', en: 'ROTOR', val: '2,840', unit: 'RPM' },
  { name: '电池', en: 'BATTERY', val: '5,200', unit: 'mAh' },
  { name: '云台', en: 'GIMBAL', val: '±0.02', unit: 'DEG' },
  { name: '机臂', en: 'ARM', val: '186.4', unit: 'MM' },
];
scene({
  id: 'C-105', name: '科幻全息线框', dur: 5, still: 4.6, libs: ['three'],
  fonts: ["700 40px 'JetBrains Mono'", "700 40px 'Noto Sans SC'"],
  init() {
    const D = three3d({ alpha: true, tone: null, fov: LAND ? 34 : 44 });
    const T = D.THREE, sc = D.scene;
    D.renderer.setClearColor(0, 0); D.renderer.localClippingEnabled = true;
    const CY = new T.Color('#4FE3FF');
    const clip = new T.Plane(new T.Vector3(0, -1, 0), 0);
    const lineM = (o = .9) => new T.LineBasicMaterial({ color: CY, transparent: true, opacity: o, blending: T.AdditiveBlending, depthWrite: false, clippingPlanes: [clip] });
    const fillM = new T.MeshBasicMaterial({ color: CY, transparent: true, opacity: .045, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, clippingPlanes: [clip] });
    const wire = (geo, ang = 25, o = .9) => { const g = new T.Group(); g.add(new T.LineSegments(new T.EdgesGeometry(geo, ang), lineM(o)), new T.Mesh(geo, fillM)); return g; };
    const ring = (r, seg = 64, o = .8) => { const pts = []; for (let i = 0; i <= seg; i++) { const a = i / seg * TAU; pts.push(new T.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); } return new T.Line(new T.BufferGeometry().setFromPoints(pts), lineM(o)); };
    const model = new T.Group(); sc.add(model);
    // 机身
    const hull = new T.Group(); model.add(hull);
    hull.add(wire(new T.BoxGeometry(1.5, .42, 1.0, 3, 1, 2)));
    const dome = wire(new T.SphereGeometry(.55, 12, 6, 0, TAU, 0, Math.PI / 2), 1, .6); dome.position.y = .21; dome.scale.set(1.1, .55, .9); hull.add(dome);
    // 四根机臂 + 电机 + 旋翼 + 护圈
    const arms = [], rotors = [];
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz], i) => {
      const a = new T.Group(); model.add(a);
      const L = 1.55, ang = Math.atan2(sz, sx);
      const tube = wire(new T.CylinderGeometry(.07, .09, L, 8, 3), 30, .8); tube.rotation.z = Math.PI / 2; tube.position.x = L / 2 + .45;
      const arm = new T.Group(); arm.add(tube); arm.rotation.y = -ang; a.add(arm);
      const tip = new T.Vector3(Math.cos(ang) * (L + .45), 0, Math.sin(ang) * (L + .45));
      const mot = wire(new T.CylinderGeometry(.16, .18, .3, 12), 30); mot.position.copy(tip).setY(.08); a.add(mot);
      const rot = new T.Group(); rot.position.copy(tip).setY(.28);
      for (const r of [0, Math.PI]) { const bl = wire(new T.BoxGeometry(.72, .02, .1), 30, .9); bl.position.x = Math.cos(r) * .36; bl.rotation.y = r; const bw = new T.Group(); bw.add(bl); bw.rotation.y = r; rot.add(bw); }
      a.add(rot);
      const guard = ring(.82, 48, .55); guard.position.copy(tip).setY(.28); a.add(guard);
      const legs = wire(new T.CylinderGeometry(.03, .03, .5, 6), 30, .6); legs.position.copy(tip).multiplyScalar(.45).setY(-.42); a.add(legs);
      arms.push(a); rotors.push({ g: rot, sp: (i % 2 ? -1 : 1) });
    });
    // 电池（嵌在机身顶上）
    const bat = new T.Group(); model.add(bat);
    const bb = wire(new T.BoxGeometry(.9, .2, .5, 3, 1, 2)); bat.add(bb);
    for (let i = 0; i < 4; i++) { const c = wire(new T.BoxGeometry(.18, .14, .42), 30, .5); c.position.x = -.3 + i * .2; bat.add(c); }
    bat.position.y = .35;
    // 云台相机
    const gim = new T.Group(); model.add(gim); gim.position.set(.62, -.38, 0);
    const ball = wire(new T.IcosahedronGeometry(.24, 1), 20, .85); gim.add(ball);
    const lens = wire(new T.CylinderGeometry(.11, .13, .2, 14), 30); lens.rotation.z = Math.PI / 2; lens.position.x = .22; gim.add(lens);
    const yoke = wire(new T.TorusGeometry(.3, .02, 4, 20, Math.PI), 30, .6); yoke.rotation.x = Math.PI / 2; gim.add(yoke);
    // 被锁定的部件：[组, 弹出方向]
    const targets = [
      [arms[0].children[2], new T.Vector3(0, 1.1, 0), arms[0]],
      [bat, new T.Vector3(0, 1.0, -.4), null],
      [gim, new T.Vector3(.5, -.7, 0), null],
      [arms[3], new T.Vector3(-.7, .2, -.5), null],
    ];
    targets.forEach(tg => tg.push(tg[0].position.clone()));
    // 投影台
    const base = new T.Group(); base.position.y = -1.5; sc.add(base);
    const baseM = (o) => new T.LineBasicMaterial({ color: CY, transparent: true, opacity: o, blending: T.AdditiveBlending, depthWrite: false });
    const ringB = (r, o, seg = 96) => { const pts = []; for (let i = 0; i <= seg; i++) { const a = i / seg * TAU; pts.push(new T.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); } return new T.Line(new T.BufferGeometry().setFromPoints(pts), baseM(o)); };
    [[2.9, .9], [2.6, .45], [2.0, .3], [1.2, .25], [3.3, .25]].forEach(([r, o]) => base.add(ringB(r, o)));
    const tk = []; for (let i = 0; i < 120; i++) { const a = i / 120 * TAU, r0 = i % 10 ? 2.92 : 2.85; tk.push(new T.Vector3(Math.cos(a) * r0, 0, Math.sin(a) * r0), new T.Vector3(Math.cos(a) * 3.05, 0, Math.sin(a) * 3.05)); }
    base.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(tk), baseM(.6)));
    const beam = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; beam.push(new T.Vector3(Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6), new T.Vector3(Math.cos(a) * 2.0, 3.0, Math.sin(a) * 2.0)); }
    const beamG = new T.BufferGeometry().setFromPoints(beam), cols = [];
    for (let i = 0; i < 48; i++) cols.push(.5, .9, 1, 0, 0, 0);
    beamG.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
    base.add(new T.LineSegments(beamG, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .25, blending: T.AdditiveBlending, depthWrite: false })));
    const scanR = ringB(2.3, 1); sc.add(scanR);
    const bgc = mk(W, H), g = bgc.getContext('2d');
    const rg = g.createRadialGradient(W / 2, H * .55, 0, W / 2, H * .55, Math.max(W, H) * .7);
    rg.addColorStop(0, '#0B2230'); rg.addColorStop(.6, '#05101A'); rg.addColorStop(1, '#020509'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(79,227,255,.05)'; g.lineWidth = 1; const gs = SHORT / 24;
    for (let x = W / 2 % gs; x < W; x += gs) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = H / 2 % gs; y < H; y += gs) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    return { D, T, model, rotors, targets, clip, scanR, bgc };
  },
  draw(ctx, t, s) {
    const { D, T, model, clip, scanR } = s, cam = D.camera;
    const C = '79,227,255', O = '255,150,60';
    // 扫描
    const sy = lerp(-1.4, 1.6, smooth(.1, 1.1, t));
    clip.constant = sy; scanR.position.y = sy; scanR.material.opacity = (1 - smooth(1.0, 1.25, t)) * .9;
    scanR.scale.setScalar(1 + .1 * Math.sin(t * 9));
    model.rotation.y = -.5 + t * .22; model.position.y = .15 * Math.sin(t * 1.3);
    for (const r of s.rotors) r.g.rotation.y = t * 18 * r.sp;
    const pos = [];
    s.targets.forEach(([obj, dir, , rest], i) => {
      const e = eOutCubic(clamp((t - LK[i] - .2) / .45, 0, 1));
      obj.position.copy(rest).addScaledVector(dir, e);
    });
    const dist = LAND ? 8.4 : 11.5;
    cam.position.set(Math.sin(.35) * dist, 2.6, Math.cos(.35) * dist); cam.lookAt(0, LAND ? -.1 : .2, 0);
    D.scene.updateMatrixWorld();
    ctx.drawImage(s.bgc, 0, 0);
    D.render();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = `blur(${Math.round(SHORT * .006)}px)`; ctx.globalAlpha = .8; ctx.drawImage(D.canvas, 0, 0, W, H); ctx.restore();
    ctx.drawImage(D.canvas, 0, 0, W, H);
    // HUD
    const u = SHORT / 1080, mono = (px, w = 700) => `${w} ${Math.round(px * u)}px 'JetBrains Mono'`, frame = Math.floor(t * 30);
    const pad = 48 * u;
    ctx.strokeStyle = `rgba(${C},.5)`; ctx.lineWidth = 2 * u;
    for (const [x, y, dx, dy] of [[pad, pad, 1, 1], [W - pad, pad, -1, 1], [pad, H - pad, 1, -1], [W - pad, H - pad, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + dy * 40 * u); ctx.lineTo(x, y); ctx.lineTo(x + dx * 40 * u, y); ctx.stroke(); }
    ctx.fillStyle = `rgba(${C},.85)`; ctx.font = mono(22); ctx.textBaseline = 'top';
    ctx.fillText('HOLO-SCAN // UAV DX-7', pad + 20 * u, pad + 16 * u);
    ctx.font = mono(16, 400); ctx.fillStyle = `rgba(${C},.55)`;
    const prog = clamp(t / 4.3, 0, 1);
    ctx.fillText(`PARTS ${String(Math.min(4, LK.filter(x => t > x + .7).length)).padStart(2, '0')}/04   T+${t.toFixed(2)}s`, pad + 20 * u, pad + 48 * u);
    ctx.fillRect(pad + 20 * u, pad + 76 * u, 260 * u * prog, 4 * u); ctx.strokeRect(pad + 20 * u, pad + 76 * u, 260 * u, 4 * u);
    // 锁定
    let warm = -1; LK.forEach((lt, i) => { if (t > lt + .7) warm = i; });
    s.targets.forEach(([obj], i) => {
      const lt = LK[i]; if (t < lt) return;
      const box = new T.Box3().setFromObject(obj), c = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3()).length() * .5;
      const p = c.clone().project(cam), px = (p.x + 1) / 2 * W, py = (1 - p.y) / 2 * H;
      const q = c.clone().add(new T.Vector3(sz, 0, 0)).project(cam);
      const rad = clamp(Math.abs((q.x - p.x) / 2 * W) * 1.1, 34 * u, 140 * u);
      const k = eOutCubic(clamp((t - lt) / .3, 0, 1)), r = rad * lerp(3, 1, k), rot = lerp(Math.PI / 4, 0, k);
      const live = i === LK.length - 1 || t < LK[i + 1];
      const col = i === warm ? O : C, al = live ? 1 : .45;
      ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
      ctx.strokeStyle = `rgba(${C},${(.4 + .6 * k) * (live ? 1 : .35)})`; ctx.lineWidth = 3 * u;
      const cl = r * .35;
      for (const [sx, sy2] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.moveTo(sx * r, sy2 * (r - cl)); ctx.lineTo(sx * r, sy2 * r); ctx.lineTo(sx * (r - cl), sy2 * r); ctx.stroke(); }
      if (live && k < 1 && frame % 2) { ctx.beginPath(); ctx.arc(0, 0, 5 * u, 0, TAU); ctx.fillStyle = `rgba(${C},.9)`; ctx.fill(); }
      ctx.restore();
      // 引线 + 标签
      const L = LAND ? [[.80, .26], [.80, .50], [.06, .62], [.06, .30]][i] : [[.56, .12], [.06, .12], [.56, .76], [.06, .76]][i];
      const lx = L[0] * W, ly = L[1] * H, right = LAND ? lx > W / 2 : true;
      const ek = clamp((t - lt - .25) / .3, 0, 1); if (ek <= 0) return;
      const ax = right ? lx - 16 * u : lx + 300 * u, ay = ly + 30 * u;
      const ex = lerp(px, ax, ek), ey = lerp(py, ay, ek), mx = lerp(px, LAND ? (right ? px + (ax - px) * .6 : px - (px - ax) * .6) : px, ek);
      ctx.strokeStyle = `rgba(${C},${.8 * al})`; ctx.lineWidth = 2 * u;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(mx, ey); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, 4 * u, 0, TAU); ctx.fillStyle = `rgba(${C},${al})`; ctx.fill();
      if (ek < 1) return;
      const P = PARTS[i], tk = clamp((t - lt - .55) / .45, 0, 1), nr = Math.floor(tk * P.val.length + .001);
      let v = ''; for (let j = 0; j < P.val.length; j++) { const ch = P.val[j]; v += j < nr || !/[0-9]/.test(ch) ? ch : String(Math.floor(hash1(frame * 13 + j * 7 + i * 101) * 10)); }
      ctx.textBaseline = 'top';
      ctx.font = `700 ${Math.round(26 * u)}px 'Noto Sans SC'`; ctx.fillStyle = `rgba(${C},${.9 * al})`;
      ctx.fillText(`${P.name}  ${P.en}`, lx, ly);
      ctx.font = mono(56); const lockFlash = i === warm ? 1 : 0;
      ctx.fillStyle = tk < 1 ? `rgba(${C},${al})` : `rgba(${col},${i === warm ? 1 : .7})`;
      if (lockFlash) { ctx.shadowColor = `rgba(${O},.8)`; ctx.shadowBlur = 24 * u; }
      ctx.fillText(v, lx, ly + 40 * u); ctx.shadowBlur = 0;
      const vw = ctx.measureText(v).width; ctx.font = mono(20, 400); ctx.fillText(P.unit, lx + vw + 12 * u, ly + 72 * u);
      ctx.fillStyle = `rgba(${C},${.4 * al})`; ctx.fillRect(lx, ly + 108 * u, 280 * u, 2 * u);
      ctx.fillStyle = `rgba(${tk < 1 ? C : col},${al})`; ctx.fillRect(lx, ly + 108 * u, 280 * u * tk, 2 * u);
    });
    // 扫描线
    for (let y = 0; y < H; y += 4 * u) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(0, y, W, 1.5 * u); }
    vignette(ctx, .35);
  }
});
