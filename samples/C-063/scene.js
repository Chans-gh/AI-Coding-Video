// C-063 移轴微缩：Three.js 程序生成一座小镇（街区、楼、车、行人全部用代码摆），正交俯拍三分之四视角；
// 渲染完在 Canvas 2D 上做移轴景深——只留中间一条水平带清晰，上下按距离分层模糊，再把饱和度和对比度推高；
// 车和行人按延时摄影的节奏快速移动，云影扫过街道。
// 风格提示词：用移轴微缩风格：用 Three.js 程序生成一座小镇，从高处俯拍，只有中间一条水平带清晰、上下强烈虚化（景深后处理），饱和度和对比度调高，车辆行人以延时节奏快速移动，云影扫过街道。
// 题材：电影年代与屏幕科技 · 适合：城市、交通
scene({
  id: 'C-063', name: '移轴微缩', dur: 5, still: 3.2, libs: ['three'],
  init() {
    const D = three3d({ w: Math.round(W * .62), h: Math.round(H * .62), fov: 24, shadows: true, exposure: 1.05 });
    const T = D.THREE, sc = D.scene;
    sc.background = new T.Color('#cfe0ef');
    const sun = new T.DirectionalLight('#fff3d6', 2.6); sun.position.set(14, 22, 10);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    const cam = sun.shadow.camera; cam.left = -26; cam.right = 26; cam.top = 26; cam.bottom = -26; cam.far = 70;
    sc.add(sun);
    sc.add(new T.HemisphereLight('#bcd6f2', '#5a5244', 1.1));
    const ground = new T.Mesh(new T.PlaneGeometry(120, 120).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: '#7fa05c', roughness: 1 }));
    ground.receiveShadow = true; sc.add(ground);
    // 街道：两条主路 + 网格街区
    const road = (w, h, x, z) => { const m = new T.Mesh(new T.PlaneGeometry(w, h).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: '#53565e', roughness: .9 })); m.position.set(x, .02, z); m.receiveShadow = true; sc.add(m); };
    for (let k = -2; k <= 2; k++) { road(90, 4.4, 0, k * 14); road(4.4, 90, k * 14, 0); }
    const stripe = new T.MeshStandardMaterial({ color: '#e8e4d2', roughness: .8 });
    for (let k = -2; k <= 2; k++) for (let i = -22; i <= 22; i++) {
      const a = new T.Mesh(new T.PlaneGeometry(1.4, .18).rotateX(-Math.PI / 2), stripe); a.position.set(i * 2, .03, k * 14); sc.add(a);
      const b = new T.Mesh(new T.PlaneGeometry(.18, 1.4).rotateX(-Math.PI / 2), stripe); b.position.set(k * 14, .03, i * 2); sc.add(b);
    }
    // 楼：每个街区里按种子摆几栋，颜色几种，高矮不同
    const COL = ['#d8d2c4', '#c9b7a3', '#e3dcc9', '#b9c4cc', '#d9b9a6', '#cfd6cf'];
    const R = mulberry32(2026);
    const blocks = [];
    for (let bx = -2; bx <= 2; bx++) for (let bz = -2; bz <= 2; bz++) {
      for (let k = 0; k < 7; k++) {
        const w = 1.5 + R() * 2.2, d = 1.5 + R() * 2.2, h = 1.6 + R() * (Math.abs(bx) + Math.abs(bz) < 2 ? 12 : 5);
        const x = bx * 14 + (R() - .5) * 7.4, z = bz * 14 + (R() - .5) * 7.4;
        if (Math.abs(x % 14) < 3.2 || Math.abs(z % 14) < 3.2) continue;
        const m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({ color: COL[Math.floor(R() * COL.length)], roughness: .85 }));
        m.position.set(x, h / 2, z); m.castShadow = m.receiveShadow = true; sc.add(m);
        if (R() < .5) { const roof = new T.Mesh(new T.BoxGeometry(w * .5, .5 + R(), d * .5), m.material); roof.position.set(x, h + .3, z); roof.castShadow = true; sc.add(roof); }
        blocks.push(m);
      }
    }
    // 树
    for (let k = 0; k < 90; k++) {
      const x = (R() - .5) * 80, z = (R() - .5) * 80;
      if (Math.abs(x % 14) < 3 || Math.abs(z % 14) < 3) continue;
      const tr = new T.Mesh(new T.CylinderGeometry(.12, .16, .9), new T.MeshStandardMaterial({ color: '#6b513a' }));
      const lv = new T.Mesh(new T.SphereGeometry(.65 + R() * .35, 10, 8), new T.MeshStandardMaterial({ color: '#3f7a3a', roughness: 1 }));
      tr.position.set(x, .45, z); lv.position.set(x, 1.2 + R() * .3, z); lv.castShadow = true; sc.add(tr, lv);
    }
    // 车：沿两条路来回，延时节奏（速度快）
    const cars = [];
    const CCOL = ['#e24b3e', '#f0f0f0', '#3b6fd4', '#f2c14e', '#2f3238', '#3fae7a'];
    for (let k = 0; k < 42; k++) {
      const axis = k % 2, lane = (Math.floor(k / 2) % 5) - 2, dir = k % 4 < 2 ? 1 : -1;
      const g = new T.Group();
      const body = new T.Mesh(new T.BoxGeometry(.52, .3, 1.05), new T.MeshStandardMaterial({ color: CCOL[k % CCOL.length], roughness: .45, metalness: .25 }));
      const top = new T.Mesh(new T.BoxGeometry(.46, .24, .5), new T.MeshStandardMaterial({ color: '#dfe6ee', roughness: .2, metalness: .1 }));
      body.position.y = .22; top.position.set(0, .44, -.06); body.castShadow = top.castShadow = true;
      g.add(body, top); sc.add(g);
      cars.push({ g, axis, lane, dir, off: R() * 90, speed: 10 + R() * 7 });
    }
    // 行人：小方块，走得很快
    const peds = [];
    for (let k = 0; k < 70; k++) {
      const m = new T.Mesh(new T.BoxGeometry(.16, .42, .16), new T.MeshStandardMaterial({ color: ['#e8e8e8', '#e05a5a', '#5a7fe0', '#f0c75a'][k % 4] }));
      m.position.y = .21; m.castShadow = true; sc.add(m);
      peds.push({ m, axis: k % 2, lane: (Math.floor(k / 2) % 5) - 2, side: k % 4 < 2 ? 1 : -1, off: R() * 90, speed: 2.6 + R() * 1.8 });
    }
    // 云影：几张深色面片在地面上空飘，投影扫过街道
    const clouds = [];
    for (let k = 0; k < 5; k++) {
      const m = new T.Mesh(new T.PlaneGeometry(16 + k * 5, 9 + k * 3).rotateX(-Math.PI / 2),
        new T.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: .14 }));
      m.position.set(-40 + k * 18, .05, -30 + k * 16); sc.add(m); clouds.push(m);
    }
    const blur = [mk(Math.round(W * .62 / 2), Math.round(H * .62 / 2)), mk(Math.round(W * .62 / 5), Math.round(H * .62 / 5))];
    return { D, T, cars, peds, clouds, blur, u: SHORT / 1080 };
  },
  draw(ctx, t, s) {
    const { D, cars, peds, clouds, blur, u } = s;
    const span = 90;
    cars.forEach(c => {
      const p = ((c.off + t * c.speed) % span) - span / 2, x = c.axis ? c.lane * 14 + c.dir * 1.1 : p * c.dir;
      const z = c.axis ? p * c.dir : c.lane * 14 + c.dir * 1.1;
      c.g.position.set(x, 0, z); c.g.rotation.y = c.axis ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    });
    peds.forEach(q => {
      const p = ((q.off + t * q.speed) % span) - span / 2;
      const x = q.axis ? q.lane * 14 + q.side * 2.6 : p * q.side, z = q.axis ? p * q.side : q.lane * 14 + q.side * 2.6;
      q.m.position.set(x, .21 + Math.abs(Math.sin(t * 9 + q.off)) * .04, z);
    });
    clouds.forEach((m, k) => { m.position.x = ((-40 + k * 18 + t * (3.4 + k * .5)) % 110) - 55; });
    // 相机：高处俯拍的三分之四视角，慢慢推近并侧移
    const k = eInOutCubic(clamp(t / 5));
    const a = .9 + k * .26, r = lerp(40, 32, k);
    D.camera.position.set(Math.cos(a) * r, lerp(19, 15, k), Math.sin(a) * r);
    D.camera.lookAt(0, lerp(2.2, 2.8, k), lerp(1, -3, k));
    D.render();
    // ---- 移轴景深：中间一条水平带清晰，上下按距离分层模糊 ----
    const src = D.canvas;
    const FILT = 'saturate(1.5) contrast(1.14)';                       // 微缩模型的味道：饱和度、对比度推高
    blur.forEach(b => { const g = b.getContext('2d'); g.clearRect(0, 0, b.width, b.height); g.filter = FILT; g.drawImage(src, 0, 0, b.width, b.height); g.filter = 'none'; });
    ctx.imageSmoothingEnabled = true;
    ctx.filter = FILT; ctx.drawImage(src, 0, 0, W, H); ctx.filter = 'none';
    const bandC = H * (LAND ? .56 : .5) + Math.sin(t * .6) * 14 * u, bandH = H * (LAND ? .2 : .16);
    const lay = (img, from, to) => {                                  // 用渐变遮罩把模糊层叠上去
      ctx.save();
      const g2 = ctx.createLinearGradient(0, 0, 0, H);
      const f = (y) => clamp((Math.abs(y - bandC) - bandH * from) / (bandH * (to - from)));
      for (let i = 0; i <= 20; i++) { const y = i / 20 * H; g2.addColorStop(i / 20, `rgba(255,255,255,${f(y)})`); }
      const m = mk(W, H), mg = m.getContext('2d');
      mg.drawImage(img, 0, 0, W, H);
      mg.globalCompositeOperation = 'destination-in';
      mg.fillStyle = g2; mg.fillRect(0, 0, W, H);
      ctx.drawImage(m, 0, 0);
      ctx.restore();
    };
    lay(blur[0], .5, 1.4);
    lay(blur[1], 1.3, 2.6);
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = 'rgba(255,236,200,.12)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    vignette(ctx, .4, .5, '20,24,30');
  }
});
