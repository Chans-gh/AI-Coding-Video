// C-081 三渲二 3D 动漫：Three.js 的卡通材质配一张只有三格的明暗渐变图，让光照只分亮、中、暗三档；每个物件再套一层放大、只画背面的黑色外壳当描边；街道两侧的小店（带遮阳棚和招牌）、樱花树（几团二十面体拼的花冠）、电线杆和下垂的电线都由代码排出，天空是一个渐变着色的大球，云是几团带描边的球；主角是胶囊身子加球头的原创女孩，按正弦摆腿摆臂往坡上走，镜头从侧后方跟着她自由漫游；Canvas 上飘樱花瓣，叠日文标题和游戏式的任务框、体力条和小地图。
// 风格提示词：用三渲二（卡通着色 3D）动漫风格：3D 场景和角色用 toon shading，明暗只有两三个色阶加黑色描边，天空通透、云朵有体积感，街道有樱花、电线杆、小店等生活细节，画面叠加日文标题和游戏 UI 式信息，镜头可自由漫游。
// 题材：3D 与实时图形 · 适合：二次元、游戏宣发、文旅
scene({
  id: 'C-081', name: '三渲二 3D 动漫', dur: 5, still: 3.4, libs: ['three'],
  fonts: ["900 80px 'Noto Sans SC'", "700 30px 'Noto Sans SC'", "700 24px 'JetBrains Mono'"],
  init() {
    const D = three3d({ fov: LAND ? 42 : 60, tone: null, far: 900 });
    const T = D.THREE, sc = D.scene, R = mulberry32(81);
    D.renderer.outputColorSpace = T.SRGBColorSpace;
    // 三格明暗
    const gm = new T.DataTexture(new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]), 3, 1);
    gm.minFilter = gm.magFilter = T.NearestFilter; gm.needsUpdate = true;
    const sun = new T.DirectionalLight('#fff6e8', 2.4); sun.position.set(-6, 10, 4); sc.add(sun, new T.AmbientLight('#cfe0ff', 1.0));
    const toon = c => new T.MeshToonMaterial({ color: c, gradientMap: gm });
    const lineM = new T.MeshBasicMaterial({ color: '#1c1a24', side: T.BackSide });
    const outl = (mesh, k = 1.04) => { const o = new T.Mesh(mesh.geometry, lineM); o.scale.setScalar(k); mesh.add(o); return mesh; };
    const M = (geo, c, k) => outl(new T.Mesh(geo, toon(c)), k);
    // 天空
    const sky = new T.Mesh(new T.SphereGeometry(600, 32, 16), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'varying vec3 p; void main(){ float h = clamp(normalize(p).y, 0., 1.); vec3 c = mix(vec3(.72,.88,1.), vec3(.18,.5,.95), pow(h, .6)); gl_FragColor = vec4(c, 1.); }' }));
    sc.add(sky);
    // 云
    for (let i = 0; i < 9; i++) {
      const g = new T.Group();
      for (let k = 0; k < 7; k++) { const s = 8 + R() * 10; const b = M(new T.SphereGeometry(s, 16, 12), '#ffffff', 1.03); b.material.color.set(k < 4 ? '#ffffff' : '#f4f8ff'); b.position.set((k - 3) * 9 + R() * 4, R() * 6 + (k % 3) * 3, R() * 6); g.add(b); }
      g.position.set(-260 + i * 70 + R() * 30, 70 + R() * 50, -260 - R() * 120); sc.add(g);
    }
    // 路和人行道：沿 -z 上坡
    const slope = z => Math.max(0, -z) * .06;
    const road = new T.Mesh(new T.PlaneGeometry(8, 200, 1, 50).rotateX(-Math.PI / 2), toon('#8c8a96'));
    const rp = road.geometry.attributes.position; for (let i = 0; i < rp.count; i++) rp.setY(i, slope(rp.getZ(i) - 80)); road.position.z = -80; road.geometry.computeVertexNormals(); sc.add(road);
    for (const sd of [-1, 1]) {
      const w = new T.Mesh(new T.BoxGeometry(3, .3, 200, 1, 1, 50), toon('#d8d0c4')); const wp = w.geometry.attributes.position;
      for (let i = 0; i < wp.count; i++) wp.setY(i, wp.getY(i) + slope(wp.getZ(i) - 80) + .15); w.position.set(sd * 5.5, 0, -80); w.geometry.computeVertexNormals(); sc.add(w);
    }
    for (let z = 10; z > -170; z -= 6) { const l = new T.Mesh(new T.PlaneGeometry(.25, 3).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: '#f4f0e0' })); l.position.set(0, slope(z) + .02, z); sc.add(l); }
    // 小店
    const signC = (txt, bg) => { const c = mk(256, 96), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 256, 96); g.fillStyle = '#fff'; g.font = "900 60px 'Noto Sans SC'"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 52); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return new T.MeshBasicMaterial({ map: t }); };
    const names = [['パン', '#e0703a'], ['花屋', '#d9467a'], ['本', '#3a6ad0'], ['喫茶', '#6a4a2a'], ['文具', '#2a9a7a'], ['八百屋', '#4a9a3a'], ['銭湯', '#3a7ab0'], ['団子', '#c84a4a']];
    const wallC = ['#f6efe0', '#f2e2c8', '#e8ecf2', '#f8e6e0', '#e6f0e2'], roofC = ['#4a5a7a', '#8a4a3a', '#5a7a5a', '#3a4a5a'];
    let si = 0;
    for (const sd of [-1, 1]) for (let z = 4; z > -160; z -= 9 + R() * 3) {
      const w = 7 + R() * 2, h = 5 + R() * 4, d = 6, x = sd * (7 + d / 2), y0 = slope(z);
      const b = M(new T.BoxGeometry(d, h, w), wallC[si % 5], 1.015); b.position.set(x, y0 + h / 2, z); sc.add(b);
      const roof = M(new T.BoxGeometry(d + .6, .5, w + .6), roofC[si % 4], 1.03); roof.position.set(x, y0 + h + .25, z); sc.add(roof);
      const aw = M(new T.BoxGeometry(1.6, .15, w * .8), ['#e85a5a', '#3a8ad0', '#f0b030', '#5ab05a'][si % 4], 1.05); aw.position.set(x - sd * (d / 2 + .7), y0 + 3, z); aw.rotation.z = sd * .3; sc.add(aw);
      const [txt, col] = names[si % names.length]; const sg = new T.Mesh(new T.PlaneGeometry(2.6, 1), signC(txt, col)); sg.position.set(x - sd * (d / 2 + .02), y0 + 4.1, z); sg.rotation.y = sd * -Math.PI / 2; sc.add(sg);
      const win = new T.Mesh(new T.PlaneGeometry(w * .55, 1.6), new T.MeshBasicMaterial({ color: '#9ccbe8' })); win.position.set(x - sd * (d / 2 + .02), y0 + 1.5, z); win.rotation.y = sd * -Math.PI / 2; sc.add(win);
      si++;
    }
    // 樱花树
    const pinks = ['#ffc4d8', '#ffb0c8', '#ffd8e4'];
    for (const sd of [-1, 1]) for (let z = -2; z > -150; z -= 14) {
      const x = sd * 4.8, y0 = slope(z) + .3, g = new T.Group();
      const tr = M(new T.CylinderGeometry(.18, .28, 3.2, 7), '#6a4a3a', 1.08); tr.position.y = 1.6; g.add(tr);
      for (let k = 0; k < 6; k++) { const c = M(new T.IcosahedronGeometry(1 + R() * .5, 1), pinks[k % 3], 1.04); c.position.set((R() - .5) * 2.4, 3.4 + R() * 1.2, (R() - .5) * 2.4); g.add(c); }
      g.position.set(x, y0, z + sd * 3); sc.add(g);
    }
    // 电线杆和电线
    const poles = [];
    for (let z = 0; z > -170; z -= 22) { const y0 = slope(z); const p = M(new T.CylinderGeometry(.14, .18, 9, 8), '#b8b0a4', 1.1); p.position.set(-4.2, y0 + 4.5, z); sc.add(p); const arm = M(new T.BoxGeometry(2.2, .14, .14), '#7a746a', 1.1); arm.position.set(-4.2, y0 + 8.4, z); sc.add(arm); poles.push([z, y0]); }
    const wireM = new T.LineBasicMaterial({ color: '#2a2830' });
    for (const dx of [-1, 0, 1]) for (let i = 0; i < poles.length - 1; i++) {
      const [z0, y0] = poles[i], [z1, y1] = poles[i + 1], pts = [];
      for (let k = 0; k <= 16; k++) { const q = k / 16; pts.push(new T.Vector3(-4.2 + dx * .9, lerp(y0, y1, q) + 8.45 - Math.sin(q * Math.PI) * .9, lerp(z0, z1, q))); }
      sc.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), wireM));
    }
    // 主角
    const hero = new T.Group(), parts = {};
    const body = M(new T.CapsuleGeometry(.36, .7, 6, 12), '#2a3a6a', 1.06); body.position.y = 1.25; hero.add(body);
    const skirt = M(new T.ConeGeometry(.55, .6, 12, 1, true), '#2a3a6a', 1.05); skirt.position.y = .85; hero.add(skirt);
    const scarf = M(new T.TorusGeometry(.32, .1, 8, 16), '#e8463a', 1.06); scarf.rotation.x = Math.PI / 2; scarf.position.y = 1.72; hero.add(scarf);
    const head = M(new T.SphereGeometry(.42, 20, 16), '#ffe0c8', 1.04); head.position.y = 2.15; hero.add(head);
    const hair = M(new T.SphereGeometry(.47, 20, 16, 0, TAU, 0, Math.PI * .62), '#4a2a2a', 1.04); hair.position.y = 2.2; hair.rotation.x = .25; hero.add(hair);
    const tail = M(new T.ConeGeometry(.2, .8, 10), '#4a2a2a', 1.06); tail.position.set(0, 2.0, .5); tail.rotation.x = 2.4; hero.add(tail);
    const bag = M(new T.BoxGeometry(.6, .7, .25), '#f0b030', 1.06); bag.position.set(0, 1.35, .42); hero.add(bag);
    const limb = (c, len, r) => { const g = new T.Group(); const m = M(new T.CapsuleGeometry(r, len, 4, 8), c, 1.1); m.position.y = -len / 2 - r; g.add(m); return g; };
    parts.lL = limb('#f0f0f0', .55, .1); parts.lL.position.set(-.16, .75, 0); parts.rL = limb('#f0f0f0', .55, .1); parts.rL.position.set(.16, .75, 0);
    parts.lA = limb('#ffe0c8', .5, .08); parts.lA.position.set(-.45, 1.6, 0); parts.rA = limb('#ffe0c8', .5, .08); parts.rA.position.set(.45, 1.6, 0);
    Object.values(parts).forEach(p => hero.add(p)); hero.parts = parts; sc.add(hero);
    return { D, T, hero, slope };
  },
  draw(ctx, t, s) {
    const { D, hero, slope } = s, u = SHORT / 1080;
    // 主角往坡上走
    const z = -t * 2.6, x = .8;
    hero.position.set(x, slope(z) + .02 + Math.abs(Math.sin(t * 7)) * .06, z); hero.rotation.y = 0;
    const sw = Math.sin(t * 7);
    hero.parts.lL.rotation.x = sw * .6; hero.parts.rL.rotation.x = -sw * .6; hero.parts.lA.rotation.x = -sw * .7; hero.parts.rA.rotation.x = sw * .7;
    // 镜头漫游：从侧前方绕到侧后方，再升起看远处的坡
    const a = lerp(-.9, .55, eInOutCubic(t / 5)), dist = LAND ? 6.5 : 8.5, rise = smooth(3, 5, t);
    D.camera.position.set(x + Math.sin(a) * dist, slope(z) + 2.0 + rise * 1.4, z - Math.cos(a) * dist * -1);
    D.camera.lookAt(x * .5, slope(z) + 1.4 + rise * 1.2, z - 6 - rise * 3);
    D.render(); ctx.drawImage(D.canvas, 0, 0, W, H);
    // 樱花瓣
    const P = mulberry32(5);
    for (let i = 0; i < 70; i++) {
      const sx = P() * W, sp = .5 + P(), ph = P() * TAU, sz = (6 + P() * 10) * u;
      const y = ((P() * H + t * 160 * sp * u) % (H + 40)) - 20, xx = sx + Math.sin(t * 1.5 + ph) * 40 * u - t * 60 * u * sp;
      ctx.save(); ctx.translate(((xx % W) + W) % W, y); ctx.rotate(t * 2 * sp + ph); ctx.scale(1, .55 + .45 * Math.sin(t * 3 + ph));
      ctx.fillStyle = i % 3 ? '#ffc8da' : '#ffe2ec'; ctx.strokeStyle = 'rgba(200,90,130,.5)'; ctx.lineWidth = 1.2 * u;
      ctx.beginPath(); ctx.ellipse(0, 0, sz, sz * .55, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    // 日文标题
    const k = smooth(.3, 1.1, t);
    ctx.save(); ctx.globalAlpha = k;
    const tx = LAND ? 80 * u : W / 2, ty = LAND ? H - 200 * u : H - 360 * u;
    ctx.textAlign = LAND ? 'left' : 'center'; ctx.lineJoin = 'round';
    ctx.font = `900 ${Math.round((LAND ? 96 : 110) * u)}px 'Noto Sans SC'`;
    ctx.lineWidth = 14 * u; ctx.strokeStyle = '#1c1a24'; ctx.strokeText('さくら坂の午後', tx + (1 - k) * -40 * u, ty); ctx.fillStyle = '#fff'; ctx.fillText('さくら坂の午後', tx + (1 - k) * -40 * u, ty);
    ctx.font = `700 ${Math.round(32 * u)}px 'Noto Sans SC'`; ctx.lineWidth = 8 * u;
    ctx.strokeText('第 3 話　坂の上のパン屋へ', tx, ty + 60 * u); ctx.fillStyle = '#ffd24a'; ctx.fillText('第 3 話　坂の上のパン屋へ', tx, ty + 60 * u);
    ctx.restore();
    // 游戏 UI：任务框、体力条、小地图
    const ui = smooth(.6, 1.2, t); ctx.save(); ctx.globalAlpha = ui;
    const qx = 40 * u, qy = (LAND ? 40 : 90) * u;
    ctx.fillStyle = 'rgba(20,24,40,.72)'; rr(ctx, qx, qy, 400 * u, 120 * u, 14 * u); ctx.fill(); ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 3 * u; ctx.stroke();
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffd24a'; ctx.font = `700 ${Math.round(24 * u)}px 'Noto Sans SC'`; ctx.fillText('クエスト', qx + 20 * u, qy + 38 * u);
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(28 * u)}px 'Noto Sans SC'`; ctx.fillText('パン屋まで歩く', qx + 20 * u, qy + 76 * u);
    ctx.font = `700 ${Math.round(22 * u)}px 'JetBrains Mono'`; ctx.fillStyle = '#9fd8ff'; ctx.fillText(`${Math.round(120 - t * 13)} m`, qx + 20 * u, qy + 106 * u);
    const hx = qx, hy = qy + 140 * u, hw = 300 * u;
    ctx.fillStyle = 'rgba(20,24,40,.72)'; rr(ctx, hx, hy, hw, 22 * u, 11 * u); ctx.fill();
    const g = ctx.createLinearGradient(hx, 0, hx + hw, 0); g.addColorStop(0, '#5ae07a'); g.addColorStop(1, '#c8f05a');
    ctx.fillStyle = g; rr(ctx, hx + 3 * u, hy + 3 * u, (hw - 6 * u) * (.92 - t * .03), 16 * u, 8 * u); ctx.fill();
    const mr = 90 * u, mx = W - mr - 40 * u, my = qy + mr;
    ctx.fillStyle = 'rgba(20,24,40,.72)'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * u; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(mx, my, mr - 4 * u, 0, TAU); ctx.clip();
    ctx.fillStyle = '#8c8a96'; ctx.fillRect(mx - 16 * u, my - mr, 32 * u, mr * 2);
    for (let i = -6; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f6efe0' : '#ffc4d8'; const yy = my + ((i * 30 + t * 30) % 180) * u; ctx.fillRect(mx - 50 * u, yy, 26 * u, 20 * u); ctx.fillRect(mx + 24 * u, yy + 10 * u, 26 * u, 20 * u); }
    ctx.restore();
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(mx, my - 14 * u); ctx.lineTo(mx - 10 * u, my + 10 * u); ctx.lineTo(mx + 10 * u, my + 10 * u); ctx.fill();
    ctx.restore();
  }
});
