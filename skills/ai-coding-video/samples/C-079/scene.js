// C-079 赛博朋克霓虹都市：Three.js 用代码排出一条两侧各几十栋的超高层街谷（楼身是随机种子画的窗格贴图，按楼的尺寸重设 UV 让窗格不被拉伸），楼面挂着画成发光贴图的原创招牌，横跨街道的高架轨道上有一列车驶过；整座城复制一份上下翻转放在地面下，地面是半透明的湿沥青贴图（积水处更透），所以招牌在地上拖出倒影；指数雾和加法混合的光锥做体积光，镜头沿街慢慢推进，Canvas 上再叠一层低分辨率模糊的泛光和斜飘的雨丝。
// 风格提示词：用赛博朋克霓虹都市风格：夜雨中的超高层巨型城市，湿滑地面反射粉紫和青色霓虹招牌（招牌文字全部原创、不用真实品牌），高架轨道和列车穿过楼宇，雾气和体积光，冷暗基调里只有霓虹是亮的，镜头慢速推进或跟车。
// 题材：3D 与实时图形 · 适合：科幻、游戏、电子音乐
const SIGNS = [['夜航', '#ff3d9a'], ['零号街', '#19e6ff'], ['NOVA-9', '#b45cff'], ['拉面', '#ff6a3d'], ['24H', '#19e6ff'], ['電脳', '#ff3d9a'], ['KAIRO', '#ffd23d'], ['義体', '#b45cff'], ['ZETA', '#ff3d9a'], ['回声', '#19e6ff'], ['旅馆', '#ffd23d'], ['NEON', '#ff6a3d']];
scene({
  id: 'C-079', name: '赛博朋克霓虹都市', dur: 5, still: 3.6, libs: ['three'],
  fonts: ["900 120px 'Noto Sans SC'", "700 40px 'JetBrains Mono'"],
  init() {
    const D = three3d({ fov: LAND ? 52 : 74, far: 600, tone: null });
    const T = D.THREE, sc = D.scene, R = mulberry32(79);
    sc.background = new T.Color('#160c2c');
    sc.fog = new T.FogExp2('#160c2c', .0085);
    const city = new T.Group(); sc.add(city);
    // 楼面窗格贴图：三种
    const facade = (seed, hue) => {
      const c = mk(256, 256), g = c.getContext('2d'), r = mulberry32(seed);
      g.fillStyle = '#0b0a14'; g.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) {
        const v = r();
        g.fillStyle = v < .08 ? hue[0] : v < .12 ? hue[1] : v < .14 ? '#fff2d0' : '#100e1c';
        g.fillRect(x * 32 + 5, y * 16 + 4, 22, 9);
      }
      g.fillStyle = 'rgba(0,0,0,.5)'; for (let y = 0; y < 16; y += 4) g.fillRect(0, y * 16, 256, 2);
      const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4;
      return new T.MeshBasicMaterial({ map: tx });
    };
    const fac = [facade(1, ['#3a2a66', '#1f6a8a']), facade(2, ['#6a2a5a', '#3a3a7a']), facade(3, ['#204a6a', '#5a2a7a'])];
    const roofM = new T.MeshBasicMaterial({ color: '#07060c' });
    const box = (w, h, d, mat) => {
      const g = new T.BoxGeometry(w, h, d), uv = g.attributes.uv;
      // 六个面按实际尺寸缩放 UV：±x 面宽 d，±z 面宽 w
      for (let f = 0; f < 6; f++) {
        const sw = (f < 2 ? d : w) / 8, sh = (f === 2 || f === 3) ? d / 8 : h / 8;
        for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * sw, uv.getY(i) * sh); }
      }
      const mats = [mat, mat, roofM, roofM, mat, mat];
      return new T.Mesh(g, mats);
    };
    // 两侧的楼
    const signs = [];
    const signTex = (txt, col, vert) => {
      const n = [...txt].length, big = /[^\x00-\x7f]/.test(txt);
      const cw = vert ? 160 : Math.max(256, n * (big ? 130 : 84) + 60), ch = vert ? n * 140 + 40 : 170;
      const c = mk(cw, ch), g = c.getContext('2d');
      g.fillStyle = 'rgba(10,6,20,.85)'; g.fillRect(0, 0, cw, ch);
      g.strokeStyle = col; g.lineWidth = 6; g.shadowColor = col; g.shadowBlur = 18; g.strokeRect(10, 10, cw - 20, ch - 20);
      g.fillStyle = '#fff'; g.shadowBlur = 26; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = big ? "900 120px 'Noto Sans SC'" : "700 96px 'JetBrains Mono'";
      if (vert) [...txt].forEach((ch_, i) => { g.fillText(ch_, cw / 2, 90 + i * 140); g.fillStyle = col; g.fillText(ch_, cw / 2, 90 + i * 140); g.fillStyle = '#fff'; });
      else { g.fillText(txt, cw / 2, ch / 2 + 6); g.globalAlpha = .55; g.fillStyle = col; g.fillText(txt, cw / 2, ch / 2 + 6); }
      const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
      return { tx, aspect: cw / ch };
    };
    let si = 0;
    const hc = mk(128, 128), hg = hc.getContext('2d'), rg = hg.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, '#fff'); rg.addColorStop(.4, '#666'); rg.addColorStop(1, '#000'); hg.fillStyle = rg; hg.fillRect(0, 0, 128, 128);
    const halo = new T.CanvasTexture(hc);
    for (const side of [-1, 1]) {
      let z = 20;
      while (z > -420) {
        const d = 10 + R() * 16, w = 12 + R() * 14, h = 30 + R() * R() * 170 + (z < -120 ? 60 : 0);
        const x = side * (17 + w / 2 + R() * 3);
        const b = box(w, h, d, fac[Math.floor(R() * 3)]); b.position.set(x, h / 2, z - d / 2); city.add(b);
        // 楼顶红灯
        if (R() < .6) { const l = new T.Mesh(new T.SphereGeometry(.5, 8, 6), new T.MeshBasicMaterial({ color: '#ff2a3a' })); l.position.set(x, h + 1, z - d / 2); city.add(l); signs.push({ m: l.material, base: 1, seed: si++ * 7 + 3, blink: true }); }
        // 招牌：贴在朝街的面上
        const nS = 1 + Math.floor(R() * 2.4);
        for (let k = 0; k < nS; k++) {
          const [txt, col] = SIGNS[Math.floor(R() * SIGNS.length)], vert = R() < .55;
          const { tx, aspect } = signTex(txt, col, vert);
          const sh = vert ? 8 + R() * 10 : 3.5 + R() * 3, sw = sh * aspect;
          const mat = new T.MeshBasicMaterial({ map: tx, transparent: true, side: T.DoubleSide });
          const p = new T.Mesh(new T.PlaneGeometry(sw, sh), mat);
          const face = x - side * w / 2;
          if (vert) { p.position.set(face - side * (sw / 2 + .6), 6 + R() * Math.min(40, h - 14), z - d * (.2 + R() * .6)); p.rotation.y = Math.PI / 2; }
          else { p.position.set(face - side * .15, 5 + R() * Math.min(30, h - 10), z - d * (.3 + R() * .4)); p.rotation.y = -side * Math.PI / 2; }
          city.add(p); signs.push({ m: mat, base: 1, seed: si++ * 13 + 1 });
          // 招牌下的光晕（加法混合的方片）
          const glow = new T.Mesh(new T.PlaneGeometry(sw * 2.2, sh * 2.2), new T.MeshBasicMaterial({ color: col, alphaMap: halo, transparent: true, opacity: .5, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
          glow.position.copy(p.position); glow.position.x -= side * .3; glow.rotation.copy(p.rotation); city.add(glow);
        }
        z -= d + .5 + R() * 2;
      }
    }
    // 高架轨道和列车
    const railM = new T.MeshBasicMaterial({ color: '#0c0b16' });
    const railZ = -80, railY = 24;
    const rail = new T.Mesh(new T.BoxGeometry(400, 1.2, 4), railM); rail.position.set(0, railY, railZ); city.add(rail);
    const strip = new T.Mesh(new T.BoxGeometry(400, .12, 4.2), new T.MeshBasicMaterial({ color: '#19a6c8' })); strip.position.set(0, railY - .8, railZ); city.add(strip);
    for (const px of [-24, 24]) { const c = new T.Mesh(new T.BoxGeometry(2, railY, 2), railM); c.position.set(px, railY / 2, railZ); city.add(c); }
    const train = new T.Group(); train.name = 'train';
    const winC = mk(512, 64), wg = winC.getContext('2d'); wg.fillStyle = '#1a1830'; wg.fillRect(0, 0, 512, 64);
    for (let i = 0; i < 14; i++) { wg.fillStyle = i % 5 === 2 ? '#ff9ad0' : '#fff0c8'; wg.fillRect(10 + i * 36, 18, 26, 22); }
    wg.fillStyle = '#ff3d9a'; wg.fillRect(0, 50, 512, 5);
    const winT = new T.CanvasTexture(winC); winT.colorSpace = T.SRGBColorSpace;
    const carM = [railM, railM, railM, railM, new T.MeshBasicMaterial({ map: winT }), new T.MeshBasicMaterial({ map: winT })];
    for (let i = 0; i < 4; i++) { const c = new T.Mesh(new T.BoxGeometry(22, 3.6, 3.4), carM); c.position.set(i * 23, 2.6, 0); train.add(c); }
    train.position.set(0, railY, railZ); city.add(train);
    // 体积光：从高处斜照下来的光锥
    const cones = [];
    const bc = mk(64, 256), bgc = bc.getContext('2d');
    for (let y = 0; y < 256; y++) {
      const lg = bgc.createLinearGradient(0, 0, 64, 0), a = (1 - y / 256) ** 1.5 * .9;
      lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, `rgba(255,255,255,${a})`); lg.addColorStop(1, 'rgba(255,255,255,0)');
      bgc.fillStyle = lg; bgc.fillRect(0, y, 64, 1);
    }
    const beamT = new T.CanvasTexture(bc);
    for (let i = 0; i < 9; i++) {
      const col = ['#ff3d9a', '#19e6ff', '#b45cff'][i % 3];
      const m = new T.Sprite(new T.SpriteMaterial({ map: beamT, color: col, transparent: true, opacity: .2, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
      const hgt = 50 + R() * 30; m.center.set(.5, 0); m.scale.set(8 + R() * 6, hgt, 1);
      m.position.set((R() < .5 ? -1 : 1) * (8 + R() * 10), 0, -30 - i * 38); m.material.rotation = 0; sc.add(m); cones.push(m);
    }
    // 地下的倒影：整座城上下翻转
    const mirror = city.clone(); mirror.scale.y = -1; sc.add(mirror);
    const mtrain = mirror.getObjectByName('train');
    // 湿地面：半透明沥青，积水处更透
    const gc = mk(512, 1024), gg = gc.getContext('2d');
    const im = gg.createImageData(512, 1024);
    for (let y = 0; y < 1024; y++) for (let x = 0; x < 512; x++) {
      const n = fbm(x / 60, y / 40, 4), puddle = smooth(.5, .62, n), k = (y * 512 + x) * 4;
      const v = 8 + 10 * hash2(x, y);
      im.data[k] = v; im.data[k + 1] = v; im.data[k + 2] = v + 6; im.data[k + 3] = 255 * (.6 - .45 * puddle);
    }
    gg.putImageData(im, 0, 0);
    gg.fillStyle = 'rgba(255,220,120,.5)'; for (let y = 0; y < 1024; y += 64) gg.fillRect(252, y, 8, 32);   // 中线
    const gt = new T.CanvasTexture(gc); gt.wrapS = gt.wrapT = T.RepeatWrapping; gt.repeat.set(1, 5); gt.colorSpace = T.SRGBColorSpace;
    const ground = new T.Mesh(new T.PlaneGeometry(34, 460).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: gt, transparent: true, depthWrite: false }));
    ground.position.set(0, 0, -200); ground.renderOrder = 2; sc.add(ground);
    const walk = new T.Mesh(new T.PlaneGeometry(200, 460).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: '#07060c', transparent: true, opacity: .7, depthWrite: false }));
    walk.position.set(0, -.02, -200); walk.renderOrder = 1; sc.add(walk);
    const bloom = mk(W / 6, H / 6);
    return { D, T, signs, train, mtrain, cones, bloom };
  },
  draw(ctx, t, s, f) {
    const { D, signs, train, mtrain, cones, bloom } = s, u = SHORT / 1080;
    // 招牌闪烁：偶尔一块灭两帧
    const fr = Math.floor(t * 30);
    for (const g of signs) {
      const h = hash2(g.seed, Math.floor(fr / 2));
      const on = g.blink ? (Math.floor(t * 1.5 + g.seed * .37) % 2 ? 1 : .15) : (h < .04 ? .2 : h < .07 ? .6 : 1);
      g.m.opacity = on; g.m.transparent = true;
    }
    const tx = -46 - 52 * (t - 3); train.position.x = tx; mtrain.position.x = tx;
    cones.forEach((c, i) => { c.material.opacity = .16 + .06 * Math.sin(t * 2 + i); });
    const e = eInOutCubic(t / 5) * .6 + t / 5 * .4;
    const z = 14 - 46 * e, y = 4.5 + 2.5 * e;
    D.camera.position.set(Math.sin(t * .6) * .6, y, z);
    D.camera.lookAt(Math.sin(t * .4) * 1.5, y + (LAND ? 7 : 12), z - 60);
    D.camera.rotateZ(-.03 + .02 * Math.sin(t * .8));
    D.render();
    ctx.drawImage(D.canvas, 0, 0, W, H);
    // 泛光：缩小再模糊，加法叠回
    const bg = bloom.getContext('2d'); bg.clearRect(0, 0, bloom.width, bloom.height);
    bg.filter = 'blur(3px)'; bg.drawImage(D.canvas, 0, 0, bloom.width, bloom.height); bg.filter = 'none';
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.drawImage(bloom, 0, 0, W, H);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // 雨丝
    const R = mulberry32(f * 7 + 1);
    ctx.strokeStyle = 'rgba(190,210,255,.28)'; ctx.lineWidth = 1.4 * u; ctx.beginPath();
    for (let i = 0; i < 420; i++) { const x = R() * W * 1.2 - W * .1, yy = R() * H, l = (20 + R() * 50) * u; ctx.moveTo(x, yy); ctx.lineTo(x - l * .18, yy + l); }
    ctx.stroke();
    vignette(ctx, .55, .4);
    grain(ctx, f, .12);
  }
});
