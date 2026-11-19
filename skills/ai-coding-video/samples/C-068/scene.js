// C-068 低多边形等距岛：Three.js 正交相机按等距角度俯看，岛由一圈圈六棱柱地块拼成，每块颜色在基色上随机加减一点明暗；树（圆锥叠圆锥）、石头（二十面体）、小屋、灯塔都打开平面着色、不用贴图；每样东西按时间表从空中落下，用衰减的余弦做弹性落地和挤压，海面是低细分平面、每帧按两组正弦重算顶点再算法线，岛一圈圈长大。
// 风格提示词：用低多边形等距小岛风格：正交等距镜头俯看一座漂在海上的小岛，所有物体都是平面着色的几何块、没有贴图，地块颜色有轻微明暗随机，每个新出现的东西带弹性落地并响一个音符，岛屿随时间长大。
// 题材：3D 与实时图形 · 适合：成长、建造
const ISL = (() => {
  // 时间表：地块一圈圈出现，最后摆上物件；sound.py 用同一张表
  const tiles = [], objs = [];
  const ring = (k) => { const out = []; for (let q = -k; q <= k; q++) for (let r = -k; r <= k; r++) if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) === k) out.push([q, r]); return out.sort((A, B) => Math.atan2(A[1] + A[0] / 2, A[0] * .866) - Math.atan2(B[1] + B[0] / 2, B[0] * .866)); };
  const T0 = [.15, .4, 1.05, 1.95], DT = [0, .11, .07, .045];
  for (let k = 0; k <= 3; k++) ring(k).forEach(([q, r], i) => { if (k === 3 && (i % 4 === 3)) return; tiles.push({ q, r, k, t: T0[k] + i * DT[k] }); });
  [['tree', 0, 1, 2.85], ['tree', -1, 2, 3.0], ['rock', 2, -1, 3.15], ['house', 0, 0, 3.3], ['tree', 1, -2, 3.5], ['lighthouse', -2, 0, 3.7], ['tree', 2, 0, 3.85], ['rock', -1, -1, 4.0]].forEach(([type, q, r, t]) => objs.push({ type, q, r, t }));
  return { tiles, objs };
})();
scene({
  id: 'C-068', name: '低多边形等距岛', dur: 5, still: 4.5, libs: ['three'],
  fonts: [],
  init() {
    const D = three3d({ shadows: true, exposure: 1.1 });
    const T = D.THREE, sc = D.scene, R = mulberry32(68);
    sc.background = new T.Color('#BFE6EF');
    const half = LAND ? 6.4 : 9.6, asp = W / H;
    const cam = new T.OrthographicCamera(-half * asp, half * asp, half, -half, .1, 100);
    cam.position.set(14, 13, 14); cam.lookAt(0, .3, 0);
    const sun = new T.DirectionalLight('#FFF1D6', 2.4); sun.position.set(8, 14, 5); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, far: 50 });
    sc.add(sun, new T.HemisphereLight('#E6F6FF', '#6B8F7A', 1.2));
    const mat = (c, j = .06) => { const col = new T.Color(c); const hsl = {}; col.getHSL(hsl); col.setHSL(hsl.h, hsl.s, clamp(hsl.l + (R() - .5) * 2 * j, 0, 1)); return new T.MeshStandardMaterial({ color: col, flatShading: true, roughness: 1 }); };
    const isle = new T.Group(); sc.add(isle);
    const hx = (q, r) => [1.5 * q * 1.02, Math.sqrt(3) * (r + q / 2) * 1.02];
    const H0 = [1.0, .8, .6, .35], C0 = ['#7CC46A', '#6DB55D', '#8FC86A', '#E9D49A'];
    const parts = [];
    for (const tl of ISL.tiles) {
      const h = H0[tl.k] + R() * .15, g = new T.CylinderGeometry(1, 1, h, 6); g.translate(0, h / 2 - .6, 0);
      const m = new T.Mesh(g, mat(C0[tl.k], .07)); const [x, z] = hx(tl.q, tl.r); m.position.set(x, 0, z); m.rotation.y = Math.PI / 6;
      m.castShadow = m.receiveShadow = true;
      // 地块侧面一圈泥土
      const side = new T.Mesh(new T.CylinderGeometry(.99, .9, .6, 6), mat('#8A6A4A', .05)); side.position.y = -.6 - .3 + .01; m.add(side);
      isle.add(m); parts.push({ m, t: tl.t, top: h - .6 });
    }
    const topOf = (q, r) => { const p = parts.find((p, i) => ISL.tiles[i].q === q && ISL.tiles[i].r === r); return p ? p.top : .4; };
    const objs = [];
    for (const o of ISL.objs) {
      const g = new T.Group();
      if (o.type === 'tree') {
        const tr = new T.Mesh(new T.CylinderGeometry(.08, .12, .5, 5), mat('#7A5234')); tr.position.y = .25; g.add(tr);
        for (let i = 0; i < 3; i++) { const c = new T.Mesh(new T.ConeGeometry(.55 - i * .13, .7, 6), mat('#3E8E4E', .08)); c.position.y = .65 + i * .35; c.rotation.y = R() * 3; g.add(c); }
      } else if (o.type === 'rock') {
        const r = new T.Mesh(new T.IcosahedronGeometry(.42, 0), mat('#9CA3A8', .08)); r.scale.set(1, .7, 1.1); r.position.y = .2; g.add(r);
        const r2 = new T.Mesh(new T.IcosahedronGeometry(.25, 0), mat('#8C9398', .08)); r2.position.set(.4, .12, .2); g.add(r2);
      } else if (o.type === 'house') {
        const b = new T.Mesh(new T.BoxGeometry(1, .7, .8), mat('#F3E6D2', .03)); b.position.y = .35; g.add(b);
        const rf = new T.Mesh(new T.CylinderGeometry(.01, .78, .55, 4), mat('#D9604A', .04)); rf.position.y = .97; rf.rotation.y = Math.PI / 4; rf.scale.set(1.05, 1, .85); g.add(rf);
        const d = new T.Mesh(new T.BoxGeometry(.22, .36, .05), mat('#7A5234')); d.position.set(0, .18, .41); g.add(d);
        const c = new T.Mesh(new T.BoxGeometry(.14, .35, .14), mat('#B04A3A')); c.position.set(.25, 1.1, -.1); g.add(c);
      } else {
        const b = new T.Mesh(new T.CylinderGeometry(.22, .32, 1.6, 8), mat('#F4F1EA', .02)); b.position.y = .8; g.add(b);
        for (const y of [.45, 1.1]) { const s = new T.Mesh(new T.CylinderGeometry(.29 - y * .05, .3 - y * .05, .2, 8), mat('#D9604A', .03)); s.position.y = y; g.add(s); }
        const l = new T.Mesh(new T.CylinderGeometry(.18, .18, .25, 8), new T.MeshStandardMaterial({ color: '#FFE08A', emissive: '#FFC94A', emissiveIntensity: .8, flatShading: true })); l.position.y = 1.72; g.add(l);
        const rf = new T.Mesh(new T.ConeGeometry(.26, .3, 8), mat('#D9604A')); rf.position.y = 1.99; g.add(rf);
      }
      g.traverse(c => { if (c.isMesh) c.castShadow = c.receiveShadow = true; });
      const [x, z] = hx(o.q, o.r); g.position.set(x + (R() - .5) * .3, 0, z + (R() - .5) * .3); g.rotation.y = R() * TAU;
      isle.add(g); objs.push({ g, t: o.t, base: topOf(o.q, o.r) });
    }
    // 海：低细分平面，平面着色
    const seaG = new T.PlaneGeometry(70, 70, 46, 46).rotateX(-Math.PI / 2).toNonIndexed();
    const sea = new T.Mesh(seaG, new T.MeshStandardMaterial({ color: '#3FA9C9', flatShading: true, roughness: .55, metalness: .05 }));
    sea.position.y = -.55; sea.receiveShadow = true; sc.add(sea);
    const base = Float32Array.from(seaG.attributes.position.array);
    // 浪花圈
    const foam = new T.Mesh(new T.RingGeometry(1, 1.35, 6).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .55 }));
    foam.position.y = -.42; foam.rotation.y = Math.PI / 6; isle.add(foam);
    // 云
    const clouds = [];
    for (let i = 0; i < 3; i++) {
      const g = new T.Group();
      for (let k = 0; k < 3; k++) { const c = new T.Mesh(new T.IcosahedronGeometry(.6 + R() * .4, 0), new T.MeshStandardMaterial({ color: '#FFFFFF', flatShading: true, roughness: 1 })); c.position.set(k * .7 - .7, R() * .2, R() * .3); g.add(c); }
      g.position.set(-9 + i * 6, 7.5, -9 + i * 2); g.traverse(c => { if (c.isMesh) c.castShadow = true; }); sc.add(g); clouds.push(g);
    }
    return { D, T, cam, isle, parts, objs, sea, seaG, base, foam, clouds };
  },
  draw(ctx, t, s) {
    const { D, cam, isle, parts, objs, seaG, base, foam, clouds } = s;
    const el = k => k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.exp(-6 * k) * Math.cos(k * 13);
    const drop = (obj, t0, y0, dur = .7) => {
      const k = (t - t0) / dur; obj.visible = k > 0; if (k <= 0) return;
      const e = el(k); obj.position.y = y0 + (1 - eOutCubic(clamp(k * 2.2, 0, 1))) * 5;
      const sq = k < 1 ? 1 + (e - 1) * .9 : 1; obj.scale.set(1 / Math.sqrt(Math.max(.4, sq)), Math.max(.4, sq), 1 / Math.sqrt(Math.max(.4, sq)));
    };
    for (const p of parts) drop(p.m, p.t, 0);
    for (const o of objs) drop(o.g, o.t, o.base);
    isle.rotation.y = -.35 + t * .12;
    const grow = [0, 1.9, 3.6, 5.2][[.15, .4, 1.05, 1.95].filter(x => t > x + .2).length - 1] || 0;
    foam.visible = grow > 0; foam.scale.setScalar(lerp(foam.scale.x, grow || 1, 1) + .06 * Math.sin(t * 3));
    const pa = seaG.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; pa.array[i * 3 + 1] = .14 * Math.sin(x * .55 + t * 2.1) + .11 * Math.cos(z * .7 - t * 1.7) + .05 * Math.sin((x + z) * 1.3 + t * 3); }
    pa.needsUpdate = true; seaG.computeVertexNormals();
    clouds.forEach((c, i) => { c.position.x = [-11, 4, 9][i] + t * .35; c.position.z = [-3, -11, 2][i]; c.position.y = 7.5 + Math.sin(t + i) * .1; });
    D.renderer.render(D.scene, cam);
    ctx.drawImage(D.canvas, 0, 0, W, H);
  }
});
