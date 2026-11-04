// C-055 HD-2D：Three.js 搭一座 3D 微缩夜景（石板广场、房子、城墙、水面），像素精灵用 Canvas 2D 现画成贴图、
// 再像剪纸一样立在场景里（billboard）；每盏灯是一个点光源并投下真实阴影，雾气压住远处，
// 从高处三分之四视角拍，最后在 Canvas 2D 上做移轴景深模糊，整座城像发光的玩具模型。
// 风格提示词：用 HD-2D 风格：手工像素精灵像剪纸一样立在完整的 3D 微缩场景里，夜晚、有雾，每盏灯投下真实阴影，从高处三分之四视角拍摄并加移轴景深模糊，整个世界像一个发光的玩具模型。
// 题材：游戏 · 适合：夜景、奇幻
scene({
  id: 'C-055', name: 'HD-2D', dur: 5, still: 3.4, libs: ['three'],
  init() {
    const D = three3d({ w: Math.round(W * .62), h: Math.round(H * .62), fov: 26, shadows: true, exposure: 1.35 });
    const T = D.THREE, sc = D.scene;
    sc.background = new T.Color('#0a0e1c');
    sc.fog = new T.FogExp2('#0d1530', .021);
    sc.add(new T.HemisphereLight('#3d5290', '#0b0d16', .95));
    const moon = new T.DirectionalLight('#9fb4ff', .85); moon.position.set(-12, 16, -8); sc.add(moon);
    // 地面：石板广场 + 水面
    const stone = new T.Mesh(new T.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: '#3b3a42', roughness: .95 }));
    stone.receiveShadow = true; sc.add(stone);
    const water = new T.Mesh(new T.PlaneGeometry(60, 14).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: '#16294d', roughness: .12, metalness: .6 }));
    water.position.set(0, .02, 14); sc.add(water);
    const R = mulberry32(55);
    // 房子：方块 + 坡屋顶，错落排开，全部投阴影
    const house = (x, z, w, h, d, col, roof) => {
      const b = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({ color: col, roughness: .9 }));
      b.position.set(x, h / 2, z); b.castShadow = b.receiveShadow = true; sc.add(b);
      const r = new T.Mesh(new T.ConeGeometry(Math.max(w, d) * .82, 1.5 + R(), 4), new T.MeshStandardMaterial({ color: roof, roughness: .85 }));
      r.position.set(x, h + .75, z); r.rotation.y = Math.PI / 4; r.castShadow = true; sc.add(r);
      // 窗：发光的小面片
      for (let k = 0; k < 3; k++) if (R() < .75) {
        const win = new T.Mesh(new T.PlaneGeometry(.5, .6), new T.MeshBasicMaterial({ color: '#ffcf7a' }));
        win.position.set(x + (R() - .5) * w * .6, .8 + k * .9, z + d / 2 + .01); sc.add(win);
      }
      return b;
    };
    const COL = ['#6b5a46', '#7a6652', '#5d5244', '#6f5f4e'], ROOF = ['#7a3b35', '#4a4f6b', '#6b4a35'];
    for (let k = 0; k < 16; k++) {
      const a = Math.PI * (1.02 + k / 16 * .96), r = 7 + R() * 7;     // 只摆在广场后半圈，前面留空
      house(Math.cos(a) * r, Math.sin(a) * r - 2, 2 + R() * 2, 2 + R() * 3, 2 + R() * 2, COL[k % 4], ROOF[k % 3]);
    }
    // 城墙
    for (let k = 0; k < 24; k++) {
      const x = -26 + k * 2.2, m = new T.Mesh(new T.BoxGeometry(2.1, 3 + (k % 3) * .4, 1.4), new T.MeshStandardMaterial({ color: '#4a4650', roughness: 1 }));
      m.position.set(x, 1.6, -19); m.castShadow = m.receiveShadow = true; sc.add(m);
    }
    // 灯：每盏一个点光源 + 看得见的灯珠，各自投阴影
    const lamps = [];
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * TAU + .3, r = 5.2;
      const x = Math.cos(a) * r, z = Math.sin(a) * r - 1;
      const post = new T.Mesh(new T.CylinderGeometry(.07, .09, 2.6), new T.MeshStandardMaterial({ color: '#2c2a32', roughness: .8 }));
      post.position.set(x, 1.3, z); post.castShadow = true; sc.add(post);
      const bulb = new T.Mesh(new T.SphereGeometry(.17, 12, 10), new T.MeshBasicMaterial({ color: '#ffd79a' }));
      bulb.position.set(x, 2.75, z); sc.add(bulb);
      const li = new T.PointLight('#ffc77a', 11, 15, 1.7); li.position.set(x, 2.75, z);
      li.castShadow = k < 3; if (li.shadow) li.shadow.mapSize.set(512, 512);
      sc.add(li); lamps.push({ li, bulb, k });
    }
    // 像素精灵：一张手画的点阵图，Canvas 2D 现画成贴图，像剪纸一样立着（billboard）
    // h 头发 s 皮肤 m 眼睛 b 上衣 p 裤子 f 鞋
    const ART = [
      '...hhhh...', '..hhhhhh..', '..hssssh..', '..hssssh..', '..smssms..', '...ssss...',
      '..bbbbbb..', '.bbbbbbbb.', 'sbbbbbbbbs', 'sbbbbbbbbs', '..bbbbbb..', '..pppppp..',
      '..pp..pp..', '..pp..pp..', '..ff..ff..', '..ff..ff..'];
    const sprite = (cols, scale = 1) => {
      const w = 10, h = 16, c = mk(w, h), g = c.getContext('2d');
      const key = { h: cols[0], s: cols[1], m: '#20161a', b: cols[2], p: cols[3], f: '#2a2026' };
      ART.forEach((row, y) => [...row].forEach((ch, x) => { if (key[ch]) { g.fillStyle = key[ch]; g.fillRect(x, y, 1, 1); } }));
      const tex = new T.CanvasTexture(c); tex.magFilter = T.NearestFilter; tex.minFilter = T.NearestFilter;
      const m = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, alphaTest: .4 }));
      m.scale.set(1.25 * scale, 2.0 * scale, 1); sc.add(m); return m;
    };
    const SC = [['#3a2a22', '#f2c9a0', '#4a7fd6', '#2b3a5c'], ['#5c3a2a', '#f2c9a0', '#d64a5c', '#4a2b35'],
      ['#241c1a', '#e8bb94', '#4ad68f', '#2b4a35'], ['#7a5a2a', '#f2c9a0', '#e0c04a', '#5c4a2b']];
    const folks = Array.from({ length: 6 }, (_, k) => ({ m: sprite(SC[k % 4]), a0: k / 6 * TAU, r: 2.6 + (k % 3) * 1.1, sp: .28 + (k % 4) * .07 }));
    const hero = sprite(['#e8d24a', '#f6dcb8', '#e0944a', '#4a2f1e'], 1.3);
    // 萤火：小方块，夜里飘
    const bugs = Array.from({ length: 40 }, (_, k) => {
      const m = new T.Mesh(new T.BoxGeometry(.07, .07, .07), new T.MeshBasicMaterial({ color: '#cfff9a' }));
      sc.add(m); return { m, k };
    });
    const blur = [mk(Math.round(W * .31), Math.round(H * .31)), mk(Math.round(W * .13), Math.round(H * .13))];
    return { D, T, lamps, folks, hero, bugs, blur, u: SHORT / 1080 };
  },
  draw(ctx, t, s) {
    const { D, lamps, folks, hero, bugs, blur, u } = s;
    lamps.forEach(({ li, bulb, k }) => {                                 // 灯火跳动
      const f = .85 + .25 * noise1(t * 6 + k * 3) + .06 * Math.sin(t * 20 + k);
      li.intensity = 11 * f; bulb.material.color.setHSL(.09, .85, .55 + .12 * f);
    });
    folks.forEach(q => {                                                 // 行人绕着广场走
      const a = q.a0 + t * q.sp;
      q.m.position.set(Math.cos(a) * q.r, 1.0 + Math.abs(Math.sin(t * 7 + q.a0)) * .06, Math.sin(a) * q.r - 1);
    });
    hero.position.set(lerp(-5.5, 1.2, eInOutCubic(clamp(t / 5))), 1.35 + Math.abs(Math.sin(t * 6)) * .07, 1.6);
    bugs.forEach(({ m, k }) => {
      const a = k * 1.7 + t * (.4 + (k % 5) * .07);
      m.position.set(Math.cos(a) * (3 + (k % 7)), .6 + 1.6 * (.5 + .5 * Math.sin(t * 1.3 + k)), Math.sin(a * .8) * (3 + (k % 5)) + 1);
      m.material.color.setScalar(.6 + .4 * Math.sin(t * 5 + k));
    });
    const kk = eInOutCubic(clamp(t / 5)), a = -.5 + kk * .35;
    D.camera.position.set(Math.sin(a) * 18, lerp(11, 9, kk), Math.cos(a) * 18);
    D.camera.lookAt(0, lerp(2.4, 2.0, kk), lerp(-2, -3, kk));
    D.render();
    ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(D.canvas, 0, 0, W, H);
    // 移轴景深：只留中间一条带清晰
    blur.forEach(b => { const g = b.getContext('2d'); g.clearRect(0, 0, b.width, b.height); g.drawImage(D.canvas, 0, 0, b.width, b.height); });
    const bandC = H * (LAND ? .58 : .52), bandH = H * (LAND ? .19 : .15);
    for (const [img, from, to] of [[blur[0], .55, 1.5], [blur[1], 1.4, 2.8]]) {
      const m = mk(W, H), mg = m.getContext('2d');
      mg.drawImage(img, 0, 0, W, H);
      const g2 = mg.createLinearGradient(0, 0, 0, H);
      for (let i = 0; i <= 20; i++) { const y = i / 20 * H; g2.addColorStop(i / 20, `rgba(255,255,255,${clamp((Math.abs(y - bandC) - bandH * from) / (bandH * (to - from)))})`); }
      mg.globalCompositeOperation = 'destination-in'; mg.fillStyle = g2; mg.fillRect(0, 0, W, H);
      ctx.drawImage(m, 0, 0);
    }
    ctx.save(); ctx.globalCompositeOperation = 'screen';                 // 灯光的辉光
    const gl = ctx.createRadialGradient(W / 2, H * .55, 0, W / 2, H * .55, SHORT * .6);
    gl.addColorStop(0, 'rgba(255,190,110,.13)'); gl.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H); ctx.restore();
    vignette(ctx, .62, .4, '2,4,12');
    grain(ctx, Math.floor(t * 24), .1);
  }
});
