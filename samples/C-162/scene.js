// C-162 木雕彩绘微缩景：Three.js 把分形噪声的高度量化成一级级台地，像一层层刻出来的地形浮雕，按高度涂上彩漆（河、田、草坡、山岩）；所有物件都用低面数几何体加平直着色，面与面之间留硬棱，像刀削出来的；再叠一张 Canvas 画的刻刀痕凹凸贴图（成片的短弧槽）和木纹；房子、树、小木人都是方块、棱锥、圆柱拼的，小木人按一拍二（每秒 12 格）顿挫地走；只有一盏台灯的聚光从上往下照、开软阴影，四周沉在暗里；镜头像无人机低空掠过，画面上下叠模糊图做浅景深。
// 风格提示词：用木雕彩绘微缩景风格：一张地形浮雕桌上摆着手刻、上过彩漆的小木人、房子和树，表面留着刻刀痕和木纹，只有一盏台灯从上方照亮，浅景深让远处和近处都微微虚化，木偶按一拍二的节奏顿挫移动，镜头像无人机一样低空掠过整片小世界。
// 题材：纸艺、材质与定格 · 适合：俯瞰一个完整小世界、童话与寓言、旅行路线
scene({
  id: 'C-162', name: '木雕彩绘微缩景', dur: 5, still: 2.6, libs: ['three'],
  fonts: ["700 40px 'Noto Serif SC'"],
  init() {
    const D = three3d({ fov: LAND ? 38 : 56, shadows: true, exposure: 1.1 });
    const T = D.THREE, sc = D.scene, R = mulberry32(162);
    sc.background = new T.Color('#0d0906');
    sc.fog = new T.Fog('#0d0906', 12, 26);
    // 台灯：从上往下的聚光
    const lamp = new T.SpotLight('#ffe2b0', 150, 30, .7, .6, 1.6); lamp.position.set(.5, 9, 1); lamp.target.position.set(0, 0, 0);
    lamp.castShadow = true; lamp.shadow.mapSize.set(2048, 2048); lamp.shadow.bias = -.0005; lamp.shadow.radius = 4;
    sc.add(lamp, lamp.target, new T.HemisphereLight('#a08060', '#201408', 1.1));
    // 刻刀痕凹凸贴图 + 木纹
    const bc = mk(1024, 1024), bg = bc.getContext('2d');
    bg.fillStyle = '#808080'; bg.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 2600; i++) {
      const x = R() * 1024, y = R() * 1024, a = R() * Math.PI, l = 14 + R() * 26, w = 3 + R() * 5;
      bg.save(); bg.translate(x, y); bg.rotate(a);
      const gr = bg.createLinearGradient(0, -w, 0, w); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(.5, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(255,255,255,.1)');
      bg.fillStyle = gr; bg.beginPath(); bg.ellipse(0, 0, l, w, 0, 0, TAU); bg.fill(); bg.restore();
    }
    const bump = new T.CanvasTexture(bc); bump.wrapS = bump.wrapT = T.RepeatWrapping;
    const gc = mk(512, 512), gg = gc.getContext('2d'), im = gg.createImageData(512, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const v = .82 + .18 * (Math.sin((x / 512 * 30 + fbm(x / 80, y / 300, 3) * 5) * Math.PI) * .5 + .5), k = (y * 512 + x) * 4;
      im.data[k] = im.data[k + 1] = im.data[k + 2] = 255 * v; im.data[k + 3] = 255;
    }
    gg.putImageData(im, 0, 0);
    const grainT = new T.CanvasTexture(gc); grainT.wrapS = grainT.wrapT = T.RepeatWrapping;
    const lac = (color, o = {}) => new T.MeshStandardMaterial({ color, flatShading: true, roughness: .42, metalness: 0, bumpMap: bump, bumpScale: 1.2, map: grainT, ...o });
    // 桌面（深色木头）
    const desk = new T.Mesh(new T.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: '#3a2414', map: grainT, roughness: .6 }));
    desk.position.y = -.48; desk.receiveShadow = true; sc.add(desk);
    // 浮雕地形：台地
    const SX = 12, SZ = 8, river = x => .9 * Math.sin(x * .55) - .3;
    const tg = new T.PlaneGeometry(SX, SZ, 96, 64).rotateX(-Math.PI / 2);
    const P = tg.attributes.position;
    const hAt = (x, z) => {
      const dr = Math.abs(z - river(x));
      let h = fbm(x * .22 + 5, z * .22, 4) * 2.2 - .6 + Math.max(0, -z - 1) * .35;
      h *= smooth(.3, 1.4, dr);
      const edge = Math.min(SX / 2 - Math.abs(x), SZ / 2 - Math.abs(z)); h *= smooth(0, .8, edge);
      return dr < .75 && edge > .3 ? -.05 : Math.max(0, Math.floor(h * 6) / 6);
    };
    const tg2 = tg.toNonIndexed(), P2 = tg2.attributes.position, cols = [];
    for (let i = 0; i < P2.count; i++) { const x = P2.getX(i), z = P2.getZ(i); P2.setY(i, hAt(x, z)); }
    const pal = ['#2f6f9a', '#9bb04a', '#6f9a3e', '#4f7f3a', '#b08a4a', '#8a6a4a', '#d8cbb0'];
    for (let i = 0; i < P2.count; i += 3) {
      const y = (P2.getY(i) + P2.getY(i + 1) + P2.getY(i + 2)) / 3, x = P2.getX(i), z = P2.getZ(i);
      const water = y < -.01;
      const c = new T.Color(water ? pal[0] : pal[Math.min(6, 1 + Math.floor(y * 3))]); c.offsetHSL(0, 0, (hash2(i, 3) - .5) * .05);
      for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b);
    }
    tg2.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); tg2.computeVertexNormals();
    const land = new T.Mesh(tg2, lac('#ffffff', { vertexColors: true })); land.receiveShadow = land.castShadow = true; sc.add(land);
    // 台座侧面
    const base = new T.Mesh(new T.BoxGeometry(SX, .42, SZ), lac('#6a4226')); base.position.y = -.27; base.receiveShadow = true; sc.add(base);
    const put = (m, x, z, dy = 0) => { m.position.set(x, hAt(x, z) + dy, z); m.traverse(c => { if (c.isMesh) c.castShadow = c.receiveShadow = true; }); sc.add(m); return m; };
    // 房子
    const house = (wall, roof) => {
      const g = new T.Group(), w = .5 + R() * .3, d = .4 + R() * .2, h = .35 + R() * .2;
      const b = new T.Mesh(new T.BoxGeometry(w, h, d), lac(wall)); b.position.y = h / 2; g.add(b);
      const r = new T.Mesh(new T.CylinderGeometry(0, Math.max(w, d) * .78, .32, 4), lac(roof)); r.rotation.y = Math.PI / 4; r.position.y = h + .16; r.scale.set(1, 1, d / w); g.add(r);
      const door = new T.Mesh(new T.BoxGeometry(.1, .18, .02), lac('#3a2416')); door.position.set(0, .09, d / 2 + .01); g.add(door);
      g.rotation.y = (R() - .5) * .8; return g;
    };
    const spots = [[-3.6, .9], [-2.7, 1.5], [-1.4, 1.2], [1.2, 1.4], [2.4, .9], [3.6, 1.6], [-.4, -1.6], [1.8, -1.5]];
    spots.forEach(([x, z], i) => put(house(['#e9d7b0', '#d98c5f', '#f0e6c8', '#c9b28a'][i % 4], ['#b8402f', '#3f6a8a', '#7a4a2a'][i % 3]), x, z));
    // 树：两种，削成多面体
    for (let i = 0; i < 70; i++) {
      const x = (R() - .5) * (SX - 1), z = (R() - .5) * (SZ - 1); if (Math.abs(z - river(x)) < 1.1) continue;
      if (spots.some(([a, b]) => Math.hypot(a - x, b - z) < .55)) continue;
      const g = new T.Group(), s = .6 + R() * .6;
      const tr = new T.Mesh(new T.CylinderGeometry(.04, .06, .3, 5), lac('#6a4226')); tr.position.y = .15; g.add(tr);
      const crown = R() < .5 ? new T.Mesh(new T.ConeGeometry(.22, .6, 6), lac('#2f6a3a')) : new T.Mesh(new T.IcosahedronGeometry(.24, 0), lac('#5f8f3a'));
      crown.position.y = .5; g.add(crown); g.scale.setScalar(s); g.rotation.y = R() * 3; put(g, x, z);
    }
    // 桥
    const bridge = new T.Mesh(new T.BoxGeometry(.5, .08, 2.2), lac('#a0522d')); put(bridge, .4, river(.4), .18);
    // 小木人：圆柱身子 + 球头，走在固定路线上
    const folk = [];
    const route = [[-4.2, 2.6], [-2.2, 2.3], [-.3, 2.3], [.4, river(.4) + 1.2], [.4, river(.4) - 1.1], [1.2, -2.6], [3.4, -2.4]];
    const rp = resample(route, 80);   // 返回 {x, y}，y 当 z 用
    for (let i = 0; i < 5; i++) {
      const g = new T.Group(), col = ['#c0392b', '#2e86c1', '#f1c40f', '#27ae60', '#8e44ad'][i];
      const body = new T.Mesh(new T.CylinderGeometry(.07, .1, .26, 6), lac(col)); body.position.y = .13; g.add(body);
      const head = new T.Mesh(new T.IcosahedronGeometry(.075, 0), lac('#f0c8a0')); head.position.y = .33; g.add(head);
      const hat = new T.Mesh(new T.ConeGeometry(.09, .1, 6), lac(['#2a1a10', '#d8cbb0'][i % 2])); hat.position.y = .42; g.add(hat);
      g.traverse(c => { if (c.isMesh) c.castShadow = true; }); sc.add(g); folk.push({ g, off: i * .14 });
    }
    const blur = mk(W / 5, H / 5);
    return { D, T, hAt, folk, rp, blur, river };
  },
  draw(ctx, t, s) {
    const { D, hAt, folk, rp, blur } = s;
    const ts = stepT(t, 12);                       // 一拍二
    for (const p of folk) {
      const q = clamp(.04 + p.off + ts * .1) * (rp.length - 2), i = Math.floor(q), k = q - i;
      const a = rp[i], b = rp[i + 1], x = lerp(a.x, b.x, k), z = lerp(a.y, b.y, k);
      const onBridge = Math.abs(x - .4) < .3 && Math.abs(z - s.river(.4)) < 1.1;
      const y = onBridge ? .26 : hAt(x, z);
      p.g.position.set(x, y + Math.abs(Math.sin(ts * 9 + p.off * 20)) * .05, z);
      p.g.rotation.y = Math.atan2(b.x - a.x, b.y - a.y); p.g.rotation.z = Math.sin(ts * 9 + p.off * 20) * .12;
    }
    // 镜头：低空掠过
    const e = eInOutCubic(t / 5);
    const cx = lerp(-5.5, 4.5, e), cz = lerp(7.5, 5.8, e) + Math.sin(t * .7) * .3, cy = (LAND ? 2.8 : 4) + Math.sin(e * Math.PI) * .6;
    D.camera.position.set(cx, cy, cz);
    D.camera.lookAt(cx * .45 + .8, 0, cz - 6.5);
    D.render();
    ctx.drawImage(D.canvas, 0, 0, W, H);
    const b = blur.getContext('2d'); b.filter = 'blur(3px)'; b.drawImage(D.canvas, 0, 0, blur.width, blur.height); b.filter = 'none';
    const tmp = s.tmp || (s.tmp = mk(W, H)), g = tmp.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.drawImage(blur, 0, 0, W, H);
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.38, 'rgba(0,0,0,0)'); gr.addColorStop(.66, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, W, H);
    ctx.drawImage(tmp, 0, 0);
    vignette(ctx, .5, .4);
  }
});
