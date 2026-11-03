// C-045 玻璃质感产品：Three.js 在无限黑影棚里悬浮一个透明玻璃 + 磨砂玻璃 + 金属的产品（全部用代码建的几何体），
// 两条长条灯（发光面片）慢慢扫过表面，玻璃用高折射率和透射做出彩边，地面有一圈焦散光纹；
// 爆炸视图慢慢散开，在音乐重音处「咔」地合拢。相机、灯、零件位置全部由 t 算出。
// 风格提示词：用玻璃质感产品渲染风格：一个透明和磨砂玻璃加金属的产品悬浮在无限黑色影棚里，长条灯光慢慢扫过表面，边缘有色散彩边、地面有焦散光纹，慢速爆炸视图在音乐重音处“咔”地合拢。
// 题材：信息讲解与产品发布 · 适合：硬件发布
scene({
  id: 'C-045', name: '玻璃质感产品', dur: 5, still: 4.4, libs: ['three'], text: 'PRISM ONE 玻璃',
  fonts: ["400 60px 'Bebas Neue'", "700 40px 'Noto Sans SC'"],
  init() {
    const D = three3d({ w: Math.round(W * .7), h: Math.round(H * .7), fov: 32, shadows: false, exposure: 1.55 });
    const T = D.THREE, sc = D.scene;
    sc.background = new T.Color('#050507');
    studioEnv(D, { top: '#5b6b9c', mid: '#232a3c', floor: '#141720', bottom: '#0a0b10', bars: [[.16, .06, 1.15, '#ffffff'], [.46, .04, .85, '#cfe2ff'], [.78, .07, .7, '#ffe2bd'], [.95, .05, .6, '#ffffff']] });
    // 影棚：一张大黑地面 + 两条长条灯 + 环境光（用半球光代替贴图，不引用任何外部资源）
    const floor = new T.Mesh(new T.CircleGeometry(40, 64).rotateX(-Math.PI / 2),
      new T.MeshStandardMaterial({ color: '#15161b', roughness: .28, metalness: .55 }));
    floor.position.y = -2.4; sc.add(floor);
    sc.add(new T.HemisphereLight('#6a7fb0', '#101014', .5));
    const key = new T.RectAreaLight('#ffffff', 26, 1.1, 9); key.position.set(-3.4, 2.4, 3.2); key.lookAt(0, 0, 0); sc.add(key);
    const rim = new T.RectAreaLight('#9fc6ff', 18, .8, 8); rim.position.set(3.6, 1.2, -2.2); rim.lookAt(0, 0, 0); sc.add(rim);
    const spot = new T.PointLight('#ffd9b0', 24, 20); spot.position.set(1.6, 3.2, 2.4); sc.add(spot);
    // 长条灯本体：看得见的发光面片，扫过时在玻璃上留下长高光
    const bar = n => { const m = new T.Mesh(new T.PlaneGeometry(.16, 7), new T.MeshBasicMaterial({ color: n })); sc.add(m); return m; };
    const bars = [bar('#ffffff'), bar('#9fc6ff')];
    // 产品：三层玻璃壳 + 磨砂中段 + 金属环和按钮，爆炸视图按 y 分开
    const glass = (o = {}) => new T.MeshPhysicalMaterial({
      color: '#ffffff', metalness: 0, roughness: .02, transmission: 1, thickness: .35, ior: 1.52, side: T.DoubleSide,
      dispersion: 6, clearcoat: 1, clearcoatRoughness: .04, iridescence: .6, iridescenceIOR: 1.4, ...o });
    const metal = new T.MeshStandardMaterial({ color: '#cfd4dc', metalness: 1, roughness: .18 });
    const frost = glass({ roughness: .42, thickness: .55, transmission: .95, color: '#eaf1ff', dispersion: 0, side: T.FrontSide });
    const parts = [];
    const add = (geo, mat, y0, spread) => { const m = new T.Mesh(geo, mat); m.position.y = y0; sc.add(m); parts.push({ m, y0, spread }); return m; };
    add(new T.CylinderGeometry(1.05, 1.05, .22, 72), metal, -1.25, -1.5);                 // 底座
    add(new T.CylinderGeometry(.95, .95, 1.1, 72, 1, true), glass(), -.55, -.7);           // 下玻璃筒
    add(new T.TorusGeometry(.98, .055, 24, 80), metal, .04, 0).rotation.x = Math.PI / 2;   // 中间金属环
    add(new T.SphereGeometry(.72, 48, 32), frost, .1, .35);                                // 磨砂球
    add(new T.CylinderGeometry(.95, .95, 1.0, 72, 1, true), glass(), .72, .9);             // 上玻璃筒
    add(new T.ConeGeometry(.96, .72, 72), glass({ thickness: .5 }), 1.56, 1.5);           // 顶上的棱锥
    add(new T.TorusGeometry(.3, .035, 18, 60), metal, 1.9, 1.9).rotation.x = Math.PI / 2;  // 顶环
    D.camera.position.set(0, .6, 7.4); D.camera.lookAt(0, .1, 0);
    return { D, T, parts, bars, key, u: SHORT / 1080 };
  },
  draw(ctx, t, s) {
    const { D, T, parts, bars, u } = s;
    // 爆炸视图：0.6 秒散开，3.4 秒「咔」地合拢（回弹一点）
    const open = eOutCubic(inv(.45, 1.9, t)) * (1 - eOutBack(inv(3.35, 3.72, t)));
    parts.forEach(p => { p.m.position.y = p.y0 + p.spread * open * .75; p.m.rotation.y = t * .25 + open * .4 * Math.sign(p.spread || 1); });
    const snap = 1 - clamp(inv(3.35, 3.62, t));                                     // 合拢时整体轻轻一缩
    const sx = 1 + .035 * Math.sin(clamp(inv(3.35, 3.9, t)) * Math.PI) * (1 - snap);
    parts.forEach(p => p.m.scale.setScalar(1 - .03 * Math.sin(clamp(inv(3.35, 3.9, t)) * Math.PI) + (sx - 1) * .5));
    // 长条灯扫过
    bars.forEach((b, i) => {
      const k = (t * .33 + i * .5) % 1;
      b.position.set(lerp(-5.5, 5.5, i ? 1 - k : k), 1.2 - i * 1.4, 2.6 - i * 5.4);
      b.lookAt(D.camera.position); b.material.opacity = .9; b.material.transparent = true;
    });
    s.key.position.set(Math.cos(t * .5) * 4.2, 2.4, Math.sin(t * .5) * 3.4 + 1.2); s.key.lookAt(0, 0, 0);
    // 相机：慢慢绕半圈并压低
    const a = -.35 + eInOutCubic(clamp(t / 5)) * .8;
    D.camera.position.set(Math.sin(a) * 7.4, lerp(1.5, .35, eInOutCubic(clamp(t / 5))), Math.cos(a) * 7.4);
    D.camera.lookAt(0, .15, 0);
    D.render();
    ctx.fillStyle = '#050507'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(D.canvas, 0, 0, W, H);
    // 地面焦散：代码画的几圈亮纹，叠在渲染结果上
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const gy = H * (LAND ? .82 : .74);
    for (let k = 0; k < 7; k++) {
      const ph = t * .6 + k * .9, r = (120 + k * 60 + Math.sin(ph) * 22) * u;
      ctx.strokeStyle = `rgba(${150 + k * 12},${190 + k * 6},255,${.1 + .09 * (1 - k / 7)})`;
      ctx.lineWidth = (2 + Math.abs(Math.sin(ph * 1.4)) * 3) * u;
      ctx.beginPath(); ctx.ellipse(W / 2, gy, r * 1.8, r * .34, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
    vignette(ctx, .55, .4, '0,0,0');
    // 产品名：合拢之后出现
    const p = smooth(3.7, 4.1, t);
    if (p > 0) {
      ctx.save(); ctx.globalAlpha = p; ctx.textAlign = 'center';
      ctx.fillStyle = '#f2f5ff'; ctx.font = `400 ${Math.round(92 * u)}px 'Bebas Neue'`;
      ctx.letterSpacing = `${10 * u}px`;
      const ty = LAND ? H * .14 : H * .12;
      ctx.fillText('PRISM ONE', W / 2, ty + (1 - eOutCubic(p)) * 20 * u);
      ctx.letterSpacing = '0px';
      ctx.font = `700 ${Math.round(30 * u)}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(200,214,255,.75)';
      ctx.fillText('一整块玻璃，一体成形', W / 2, ty + 52 * u);
      ctx.restore();
    }
    grain(ctx, Math.floor(t * 30), .10);
  }
});
