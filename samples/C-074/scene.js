// C-074 风格化 3D 打斗：Three.js 的卡通材质（三格明暗渐变）加背面外壳描边，绿、红两个原创火柴人各是一套层级骨骼（髋、脊、肩、肘、胯、膝），每个关节的角度用 lib 的 keyAt 按关键帧插值，跑步时再叠一层正弦摆动；前 2.5 秒在沙丘间追逐、飞踢，后 2.5 秒切到神殿石柱间，红方回身旋踢；每次击中时动作时间停住约 0.15 秒（定格），击中点投影到屏幕，Canvas 上炸出一圈加法混合的亮色粒子和放射线，整屏闪一下白；镜头按预排的机位快切，始终对准两人中点。
// 风格提示词：用风格化 3D 动作片风格：低细节模型加平滑明暗的卡通渲染，绿色和红色火柴人角色在沙漠、神殿等不同场景追逐对打，暖色氛围光、击中时亮色粒子过闪和短暂定格，镜头跟随动作快切。
// 题材：3D 与实时图形 · 适合：动作、对战
const HITS = [[1.55, .16], [3.75, .2]];     // [击中时刻, 定格秒数]（片子时间）
scene({
  id: 'C-074', name: '风格化 3D 打斗', dur: 5, still: 3.8, libs: ['three'],
  fonts: ["900 64px 'Noto Sans SC'"],
  init() {
    const D = three3d({ fov: LAND ? 40 : 58, tone: null, far: 500 });
    const T = D.THREE, sc = D.scene, R = mulberry32(74);
    D.renderer.outputColorSpace = T.SRGBColorSpace;
    const gm = new T.DataTexture(new Uint8Array([80, 80, 80, 255, 165, 165, 165, 255, 255, 255, 255, 255]), 3, 1); gm.minFilter = gm.magFilter = T.NearestFilter; gm.needsUpdate = true;
    const toon = c => new T.MeshToonMaterial({ color: c, gradientMap: gm });
    const lineM = new T.MeshBasicMaterial({ color: '#1a1014', side: T.BackSide });
    const M = (geo, c, k = 1.08) => { const m = new T.Mesh(geo, toon(c)); const o = new T.Mesh(geo, lineM); o.scale.setScalar(k); m.add(o); return m; };
    const sun = new T.DirectionalLight('#ffe0b0', 2.6); sun.position.set(-5, 8, 4); const amb = new T.AmbientLight('#ffb080', .9); sc.add(sun, amb);
    // 两个场景各一组
    const desert = new T.Group(), temple = new T.Group(); sc.add(desert, temple);
    const dg = new T.PlaneGeometry(200, 200, 80, 80).rotateX(-Math.PI / 2), dp = dg.attributes.position;
    for (let i = 0; i < dp.count; i++) { const x = dp.getX(i), z = dp.getZ(i), r = Math.hypot(x, z); dp.setY(i, smooth(8, 30, r) * (fbm(x * .03, z * .03, 3) * 9 + Math.sin(x * .08 + z * .03) * 2)); }
    dg.computeVertexNormals(); desert.add(new T.Mesh(dg, toon('#e8b070')));
    for (let i = 0; i < 9; i++) { const a = R() * TAU, r = 14 + R() * 20; const rk = M(new T.DodecahedronGeometry(1 + R() * 2, 0), '#b87048', 1.04); rk.position.set(Math.cos(a) * r, .5, Math.sin(a) * r); rk.rotation.set(R(), R(), R()); desert.add(rk); }
    for (let i = 0; i < 5; i++) { const p = M(new T.CylinderGeometry(.8, 1.2, 6 + R() * 6, 6), '#c88050', 1.04); p.position.set(-30 + i * 14, 3, -22 - R() * 10); desert.add(p); }
    const sky1 = new T.Mesh(new T.SphereGeometry(300, 24, 12), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, uniforms: { a: { value: new T.Color('#ffcf8a') }, b: { value: new T.Color('#e8603a') } },
      vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'uniform vec3 a, b; varying float h; void main(){ gl_FragColor = vec4(mix(a, b, clamp(h * 2.5, 0., 1.)), 1.); }' }));
    desert.add(sky1);
    // 神殿：石地砖、两排柱子、台阶、火盆
    const tc = mk(256, 256), tg = tc.getContext('2d'); tg.fillStyle = '#8a7a6a'; tg.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { tg.fillStyle = ['#a08c78', '#968270', '#aa957f'][(x + y * 3) % 3]; tg.fillRect(x * 64 + 3, y * 64 + 3, 58, 58); }
    const tt = new T.CanvasTexture(tc); tt.wrapS = tt.wrapT = T.RepeatWrapping; tt.repeat.set(12, 12); tt.colorSpace = T.SRGBColorSpace;
    const floor = new T.Mesh(new T.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new T.MeshToonMaterial({ map: tt, gradientMap: gm })); temple.add(floor);
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) {
      const c = M(new T.CylinderGeometry(.7, .8, 9, 10), '#c8b49a', 1.03); c.position.set(-15 + i * 6, 4.5, sd * 6); temple.add(c);
      const cap = M(new T.BoxGeometry(2, .6, 2), '#b0a088', 1.04); cap.position.set(-15 + i * 6, 9.2, sd * 6); temple.add(cap);
    }
    const beam = M(new T.BoxGeometry(34, 1, 1.6), '#a89478', 1.02); beam.position.set(-.5, 9.9, -6); temple.add(beam); const beam2 = beam.clone(); beam2.position.z = 6; temple.add(beam2);
    for (let i = 0; i < 3; i++) { const st = M(new T.BoxGeometry(6, .5, 12 - i * 2), '#9a8a76', 1.02); st.position.set(18 + i * .9, .25 + i * .5, 0); temple.add(st); }
    const fires = [];
    for (const [x, z] of [[-9, -4], [-9, 4], [9, -4], [9, 4]]) {
      const b = M(new T.CylinderGeometry(.6, .3, 1.2, 8), '#5a4030'); b.position.set(x, .6, z); temple.add(b);
      const fl = new T.Mesh(new T.ConeGeometry(.45, 1.2, 8), new T.MeshBasicMaterial({ color: '#ffb030' })); fl.position.set(x, 1.8, z); temple.add(fl); fires.push(fl);
    }
    const sky2 = new T.Mesh(new T.SphereGeometry(300, 24, 12), new T.MeshBasicMaterial({ color: '#2a1a24', side: T.BackSide })); temple.add(sky2);
    // 火柴人：层级骨骼
    const fighter = col => {
      const root = new T.Group(), J = {};
      const seg = (len, r, c = col) => { const g = new T.Group(); const m = M(new T.CapsuleGeometry(r, len, 4, 8), c, 1.12); m.position.y = -len / 2; g.add(m); return g; };
      J.hips = new T.Group(); J.hips.position.y = 1.0; root.add(J.hips);
      J.spine = new T.Group(); J.hips.add(J.spine);
      const torso = M(new T.CapsuleGeometry(.13, .62, 4, 8), col, 1.1); torso.position.y = .42; J.spine.add(torso);
      const head = M(new T.SphereGeometry(.24, 16, 12), col, 1.06); head.position.y = 1.02; J.spine.add(head);
      const mk2 = (name, parent, x, y, len, r) => { const g = seg(len, r); g.position.set(x, y, 0); parent.add(g); J[name] = g; return g; };
      for (const [sd, s] of [['l', -1], ['r', 1]]) {
        const up = mk2(sd + 'S', J.spine, s * .24, .72, .34, .07); mk2(sd + 'E', up, 0, -.42, .32, .065);
        const th = mk2(sd + 'H', J.hips, s * .13, 0, .4, .08); mk2(sd + 'K', th, 0, -.48, .4, .075);
      }
      sc.add(root); return { root, J };
    };
    const G = fighter('#3ad06a'), Rd = fighter('#e8403a');
    const flashC = mk(64, 64);
    return { D, T, desert, temple, fires, G, Rd, amb, sun };
  },
  draw(ctx, t, s, f) {
    const { D, T, desert, temple, fires, G, Rd, amb, sun } = s, u = SHORT / 1080;
    // 定格：击中后动作时间停住
    let ta = t; for (const [h, d] of HITS) if (t > h) ta -= Math.min(t - h, d);
    const sceneB = t >= 2.5;
    desert.visible = !sceneB; temple.visible = sceneB;
    amb.color.set(sceneB ? '#ff9050' : '#ffb080'); amb.intensity = sceneB ? 1.1 : .9; sun.intensity = sceneB ? 1.4 : 2.6;
    fires.forEach((fl, i) => { fl.scale.set(1, .8 + .4 * noise1(t * 6 + i * 3), 1); });
    // 姿势：关节角度（弧度）
    const Z = { lS: .2, lE: 0, rS: .2, rE: 0, lH: 0, lK: 0, rH: 0, rK: 0, sp: 0, y: 0, yaw: 0, sz: 0, rHz: 0, arms: 0 };
    const guard = { ...Z, lS: -.9, lE: -1.7, rS: -.6, rE: -1.9, lH: -.3, lK: .4, rH: .25, rK: .3, sp: .1 };
    const pose = (F, p, x, z, face, run = 0) => {
      const cyc = Math.sin(ta * 14) * run;
      const { J, root } = F;
      root.position.set(x, p.y, z); root.rotation.y = face + p.yaw;
      J.spine.rotation.x = p.sp + run * .35; J.spine.rotation.z = p.sz;
      J.lS.rotation.x = p.lS + cyc * 1.1; J.rS.rotation.x = p.rS - cyc * 1.1; J.lE.rotation.x = p.lE - run * 1.2; J.rE.rotation.x = p.rE - run * 1.2;
      J.lH.rotation.x = p.lH - cyc * 1.0; J.rH.rotation.x = p.rH + cyc * 1.0; J.lK.rotation.x = p.lK + run * (.9 + .6 * Math.max(0, cyc)); J.rK.rotation.x = p.rK + run * (.9 + .6 * Math.max(0, -cyc));
      J.rH.rotation.z = p.rHz || 0; J.lS.rotation.z = -(p.arms || 0); J.rS.rotation.z = p.arms || 0;
    };
    let hitP = null;
    if (!sceneB) {
      // 沙漠：红在前面跑，绿追；1.2 秒绿起跳飞踢，1.55 击中，红被踢飞
      const gx = keyAt([[0, -9], [1.1, -2.4], [1.5, -.6], [2.5, -.2]], ta, x => x), rx = keyAt([[0, -3], [1.1, 1.2], [1.4, 1.6], [1.6, 1.8], [2.3, 5.5], [2.5, 6]], ta, x => x);
      const gp = keyAt([[0, Z], [1.1, Z], [1.25, { ...Z, y: .9, lH: -.4, lK: 1.6, rH: -1.6, rK: 0, sp: -.3, lS: .8, rS: .6, arms: .6 }], [1.45, { ...Z, y: .9, lH: -.4, lK: 1.6, rH: -1.7, rK: 0, sp: -.35, lS: .9, rS: .7, arms: .6 }], [1.9, guard], [2.5, guard]], ta);
      const rp = keyAt([[0, Z], [1.15, Z], [1.35, { ...guard, sp: .2 }], [1.48, { ...guard, sp: .2 }], [1.62, { ...Z, sp: -.7, y: .5, lS: -2.5, rS: -2.2, arms: .7, lH: -.6, rH: -.9, lK: .6 }], [2.1, { ...Z, sp: -1.2, y: .1, lS: -2, rS: -2, arms: .8, lH: -1, rH: -1.2 }], [2.5, { ...Z, sp: -1.3, y: .05, lS: -2, rS: -2, lH: -1.2, rH: -1.2 }]], ta);
      pose(G, gp, gx, 0, Math.PI / 2, ta < 1.1 ? 1 : 0);
      pose(Rd, rp, rx, 0, ta < 1.15 ? Math.PI / 2 : -Math.PI / 2, ta < 1.1 ? 1 : 0);
      if (t > HITS[0][0]) hitP = { v: new T.Vector3(1.3, 1.7, 0), t0: HITS[0][0] };
    } else {
      // 神殿：对峙，绿先出拳被挡，红回身旋踢，3.75 击中
      const lt = ta - (2.5 - HITS[0][1]);
      const gx = keyAt([[0, -2.2], [.5, -1.4], [.9, -.9], [1.25, -.9], [1.5, 1.4], [2.4, 2.8]], lt, x => x);
      const gp = keyAt([[0, guard], [.5, guard], [.7, { ...guard, rS: -1.6, rE: 0, sp: .3 }], [.9, { ...guard, rS: -1.6, rE: 0, sp: .3 }], [1.15, guard], [1.25, guard], [1.4, { ...Z, sp: -.8, y: .6, lS: -2.4, rS: -2.4, arms: .8, lK: 1, rK: 1.4 }], [1.8, { ...Z, sp: -.3, y: .4, lH: -1.4, rH: -1.6, lK: 2, rK: 2, lS: -1, rS: -1 }], [2.2, { ...guard, sp: .3, lH: -.9, rH: -.4, lK: 1.6, rK: 1.2, y: -.3 }], [2.6, { ...guard, sp: .2, lH: -.9, rH: -.4, lK: 1.6, rK: 1.2, y: -.3 }]], lt);
      const rp = keyAt([[0, guard], [.55, guard], [.7, { ...guard, lS: -2.2, lE: -.6 }], [.9, { ...guard, lS: -2.2, lE: -.6 }], [1.0, { ...guard, yaw: -Math.PI }], [1.2, { ...Z, yaw: -TAU, y: .5, rHz: 1.5, rH: -.2, rK: 0, lK: .8, sz: -.5, arms: 1.1 }], [1.45, { ...Z, yaw: -TAU - .3, y: .2, rHz: .8, rK: .3, arms: .9 }], [1.8, { ...guard, yaw: -TAU }], [2.6, { ...guard, yaw: -TAU, sp: .2 }]], lt);
      pose(G, gp, gx, 0, Math.PI / 2);
      pose(Rd, rp, 1.2, 0, -Math.PI / 2);
      if (t > HITS[1][0]) hitP = { v: new T.Vector3(-.4, 1.8, 0), t0: HITS[1][0] };
    }
    // 镜头快切：每个机位 [起点, 位置函数]
    const mid = new T.Vector3().addVectors(G.root.position, Rd.root.position).multiplyScalar(.5);
    const shots = [[0, q => [mid.x - 6 - q * 2, 1.2, 6.5]], [.75, q => [mid.x + 1, .6, 4.2 - q]], [1.3, q => [mid.x - 2.5, 2.0, 5.2 + q * .6]], [1.9, q => [mid.x + 5, 3.5, 7 - q * 2]],
      [2.5, q => [mid.x - 1, 3.5, 5.2 - q]], [3.1, q => [mid.x + 3.5, 1.1, 3.6]], [3.6, q => [mid.x - 3.2, 1.6, 2.8 + q]], [4.2, q => [mid.x - 1 + q * 3, 2.4, 4.8 - q * .5]]];
    let si = 0; while (si < shots.length - 1 && t >= shots[si + 1][0]) si++;
    const [st, fn] = shots[si], q = (t - st) / ((shots[si + 1] || [5])[0] - st), cp = fn(q);
    const shake = hitP ? Math.exp(-(t - hitP.t0) * 10) * .12 : 0;
    D.camera.position.set(cp[0] + (hash1(f) - .5) * shake, cp[1] + (hash1(f + 99) - .5) * shake, cp[2] * (LAND ? 1 : 1.35));
    D.camera.lookAt(mid.x, 1.3, 0);
    D.render(); ctx.drawImage(D.canvas, 0, 0, W, H);
    // 击中：粒子、放射线、闪白
    if (hitP && t - hitP.t0 < .6) {
      const k = t - hitP.t0, v = hitP.v.clone().project(D.camera), hx = (v.x * .5 + .5) * W, hy = (-v.y * .5 + .5) * H;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const P = mulberry32(Math.round(hitP.t0 * 100));
      for (let i = 0; i < 46; i++) {
        const a = P() * TAU, sp = (300 + P() * 900) * u, d = sp * (1 - Math.exp(-k * 6)) / 3, r = (4 + P() * 10) * u * (1 - k / .6);
        ctx.fillStyle = ['#fff6a0', '#ffd040', '#ff8030', '#ffffff'][i % 4];
        ctx.beginPath(); ctx.arc(hx + Math.cos(a) * d, hy + Math.sin(a) * d + k * k * 300 * u, Math.max(0, r), 0, TAU); ctx.fill();
      }
      const ring = (1 - Math.exp(-k * 9)) * 240 * u;
      ctx.strokeStyle = `rgba(255,240,180,${1 - k / .6})`; ctx.lineWidth = 10 * u * (1 - k / .6); ctx.beginPath(); ctx.arc(hx, hy, ring, 0, TAU); ctx.stroke();
      if (k < .25) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4 * u; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + hitP.t0; ctx.moveTo(hx + Math.cos(a) * 80 * u, hy + Math.sin(a) * 80 * u); ctx.lineTo(hx + Math.cos(a) * (260 + 200 * (i % 2)) * u, hy + Math.sin(a) * (260 + 200 * (i % 2)) * u); } ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, .75 - k * 6)})`; ctx.fillRect(0, 0, W, H);
    }
    // 场景名
    const lab = sceneB ? '神殿' : '沙丘', lt2 = sceneB ? t - 2.5 : t, la = smooth(0, .15, lt2) * (1 - smooth(.8, 1, lt2));
    if (la > 0) { ctx.globalAlpha = la; ctx.font = `900 ${Math.round(64 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.lineWidth = 10 * u; ctx.strokeStyle = '#1a1014'; ctx.lineJoin = 'round';
      const x = 60 * u, y = (LAND ? 120 : 220) * u; ctx.strokeText(lab, x, y); ctx.fillStyle = '#fff3d0'; ctx.fillText(lab, x, y); ctx.globalAlpha = 1; }
  }
});
