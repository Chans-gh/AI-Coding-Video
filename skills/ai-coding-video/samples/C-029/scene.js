// C-029 积木玩具：Three.js 用代码拼出带凸点的塑料积木（方块 + 一排小圆柱），放在真实桌面上微距拍摄——
// 浅景深用 Canvas 2D 的分层模糊做，柔光箱是两张大面光，塑料高光靠高光泽材质；
// 搭建按定格动画的节奏（每秒 8 格，stepT 做顿挫）一块块卡上去，最后两块用 cannon-es 真的掉下来，
// 物理用 1/120 秒的固定步长、每帧从 0 重推，所以结果确定、可重复。
// 风格提示词：用积木玩具定格风格：所有东西由带凸点的塑料积木拼成，放在真实桌面上用微距镜头拍摄，浅景深、柔光箱光线和塑料高光，按定格动画节奏一块块搭起来，每次卡入有“哒”的声音。
// 题材：纸艺、材质与定格 · 适合：搭建、工程、儿童
scene({
  id: 'C-029', name: '积木玩具', dur: 5, still: 4.2, libs: ['three', 'cannon-es'],
  init() {
    const D = three3d({ w: Math.round(W * .62), h: Math.round(H * .62), fov: 22, shadows: true, exposure: 1.05 });
    const T = D.THREE, sc = D.scene;
    sc.background = new T.Color('#e8e2d6');
    sc.add(new T.HemisphereLight('#ffffff', '#b8ab96', .85));
    const box1 = new T.RectAreaLight('#ffffff', 10, 10, 6); box1.position.set(-6, 9, 6); box1.lookAt(0, 0, 0); sc.add(box1);
    const box2 = new T.RectAreaLight('#fff0e0', 5, 8, 5); box2.position.set(7, 6, -4); box2.lookAt(0, 0, 0); sc.add(box2);
    const key = new T.DirectionalLight('#fff6e8', 2.2); key.position.set(-5, 11, 7);
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    const c = key.shadow.camera; c.left = -12; c.right = 12; c.top = 12; c.bottom = -12; c.far = 40; sc.add(key);
    // 桌面：木色，带一点纹理（用代码画的贴图）
    const tex = (() => {
      const cv = mk(512, 512), g = cv.getContext('2d');
      g.fillStyle = '#bb9868'; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 2200; i++) {
        g.strokeStyle = `rgba(${120 + hash1(i) * 60 | 0},${86 + hash1(i + 7) * 50 | 0},${50 + hash1(i + 3) * 40 | 0},.26)`;
        g.lineWidth = .5 + hash1(i + 11) * 2;
        const y = hash1(i + 5) * 512;
        g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + (hash1(i) - .5) * 12, 340, y + (hash1(i + 2) - .5) * 12, 512, y); g.stroke();
      }
      const tx = new T.CanvasTexture(cv); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(2.2, 2.2); return tx;
    })();
    const desk = new T.Mesh(new T.PlaneGeometry(70, 70).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ map: tex, roughness: .75 }));
    desk.receiveShadow = true; sc.add(desk);
    // 一块积木：方块 + 顶上的凸点
    const U = 1.0, HGT = 1.2;
    const brick = (w, d, col) => {
      const g = new T.Group();
      const body = new T.Mesh(new T.BoxGeometry(w * U, HGT, d * U),
        new T.MeshPhysicalMaterial({ color: col, roughness: .28, clearcoat: .9, clearcoatRoughness: .12, metalness: 0 }));
      body.castShadow = body.receiveShadow = true; g.add(body);
      for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
        const st = new T.Mesh(new T.CylinderGeometry(.3, .3, .26, 20), body.material);
        st.position.set((i - (w - 1) / 2) * U, HGT / 2 + .13, (j - (d - 1) / 2) * U);
        st.castShadow = true; g.add(st);
      }
      sc.add(g); return g;
    };
    const COL = ['#D8402F', '#2D6FD8', '#F2C230', '#3FA85C', '#F2F2F2', '#E87A2E'];
    // 搭建表：[块, 宽, 深, 目标位置, 卡上的时刻]
    const plan = [
      [4, 2, [0, .6, 0], .35], [4, 2, [0, .6, 2], .62], [2, 2, [-1, 1.8, 1], .9],
      [2, 2, [1, 1.8, 1], 1.18], [4, 2, [0, 3.0, 1], 1.46], [2, 2, [-1, 4.2, 1], 1.74],
      [2, 2, [1, 4.2, 1], 2.02], [4, 2, [0, 5.4, 1], 2.3], [2, 2, [0, 6.6, 1], 2.58],
    ];
    const parts = plan.map(([w, d, pos, t0], k) => ({ g: brick(w, d, COL[k % COL.length]), pos, t0, k }));
    // 最后两块用物理掉下来（cannon-es，固定步长、每帧从 0 重推）
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -18, 0) });
    world.defaultContactMaterial.restitution = .12;
    world.defaultContactMaterial.friction = .55;
    world.addBody(new CANNON.Body({ mass: 0, shape: new CANNON.Plane() , quaternion: new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0) }));
    world.addBody(new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(2, 3.6, 1.5)), position: new CANNON.Vec3(0, 3.6, 1) }));  // 已搭好的塔
    const drops = [[-2.6, 7.6, -.4, '#D8402F', 2, 2], [2.4, 9.0, 2.2, '#2D6FD8', 2, 2]].map(([x, y, z, col, w, d], i) => {
      const g = brick(w, d, col);
      const body = new CANNON.Body({ mass: 1, shape: new CANNON.Box(new CANNON.Vec3(w / 2, .6, d / 2)), position: new CANNON.Vec3(x, y, z) });
      body.angularVelocity.set(1.6 - i * 2.4, .9, -1.2 + i * 1.8);
      world.addBody(body);
      return { g, body, i };
    });
    const blur = [mk(Math.round(W * .31), Math.round(H * .31)), mk(Math.round(W * .14), Math.round(H * .14))];
    return { D, T, parts, drops, world, blur, u: SHORT / 1080 };
  },
  draw(ctx, t, s) {
    const { D, T, parts, drops, world, blur, u } = s;
    const ts = stepT(t, 8);                                    // 定格动画：每秒 8 格的顿挫
    parts.forEach(p => {
      const k = clamp(inv(p.t0 - .3, p.t0, ts));
      if (k <= 0) { p.g.visible = false; return; }
      p.g.visible = true;
      const drop = 1 - eOutCubic(k);
      p.g.position.set(p.pos[0], p.pos[1] + drop * 5.5, p.pos[2]);
      p.g.rotation.y = drop * .5;
      const squash = k === 1 ? 1 : 1;                           // 卡上就不动了
      p.g.scale.set(squash, squash, squash);
    });
    // 物理：每帧从 0 按固定步长重推到 t（2.9 秒之后才开始掉）
    const pt = Math.max(0, ts - 2.9);
    drops.forEach(({ body, i }) => {                            // 重置到初始状态再重推
      const init = [[-2.6, 7.6, -.4], [2.4, 9.0, 2.2]][i];
      body.position.set(...init); body.velocity.set(0, 0, 0);
      body.quaternion.set(0, 0, 0, 1);
      body.angularVelocity.set(1.6 - i * 2.4, .9, -1.2 + i * 1.8);
    });
    physicsAt(world, pt, 1 / 120);
    drops.forEach(({ g, body }) => {
      g.visible = pt > 0;
      g.position.set(body.position.x, body.position.y, body.position.z);
      g.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
    });
    // 微距相机：低角度绕过来，推近
    const kk = eInOutCubic(clamp(t / 5)), a = -.9 + kk * .7;
    D.camera.position.set(Math.sin(a) * lerp(32, 27, kk), lerp(11, 8.5, kk), Math.cos(a) * lerp(32, 27, kk));
    D.camera.lookAt(0, lerp(2.2, 3.6, kk), 1);
    D.render();
    ctx.fillStyle = '#e8e2d6'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(D.canvas, 0, 0, W, H);
    // 浅景深：焦点落在塔上，上下和前景糊掉
    blur.forEach(b => { const g = b.getContext('2d'); g.clearRect(0, 0, b.width, b.height); g.drawImage(D.canvas, 0, 0, b.width, b.height); });
    const focus = H * (LAND ? .56 : .5), band = H * (LAND ? .17 : .14);
    for (const [img, from, to] of [[blur[0], .45, 1.2], [blur[1], 1.1, 2.2]]) {
      const m = mk(W, H), mg = m.getContext('2d');
      mg.drawImage(img, 0, 0, W, H);
      const g2 = mg.createLinearGradient(0, 0, 0, H);
      for (let i = 0; i <= 20; i++) { const y = i / 20 * H; g2.addColorStop(i / 20, `rgba(255,255,255,${clamp((Math.abs(y - focus) - band * from) / (band * (to - from)))})`); }
      mg.globalCompositeOperation = 'destination-in'; mg.fillStyle = g2; mg.fillRect(0, 0, W, H);
      ctx.drawImage(m, 0, 0);
    }
    vignette(ctx, .34, .55, '60,50,36');
    grain(ctx, Math.floor(ts * 8), .12);
  }
});
