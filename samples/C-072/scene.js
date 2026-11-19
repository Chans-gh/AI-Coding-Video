// C-072 爆炸图 / 剖面：Three.js 用代码搭一台圆柱形智能音箱的六层零件（旋转体扬声器盆、带芯片的电路板、电池、铝顶盖和灯环），影棚环境贴图给金属反光，白底上只接投影；每层按错开的时间沿竖直方向弹开，再按原路合拢；每层右缘的三维点投影到屏幕，在 Canvas 上画引线和材料标注，镜头一直慢慢环绕。
// 风格提示词：用 3D 爆炸图风格：白底干净工作室光，物体先完整展示，再沿垂直方向一层一层爆开、每层旁边出现材料标注引线，镜头慢慢环绕，最后按原路合拢；需要看内部时改成剖面切开并叠加气流或热力颜色。
// 题材：3D 与实时图形 · 适合：建筑、硬件、数据中心
scene({
  id: 'C-072', name: '爆炸图 / 剖面', dur: 5, still: 2.6, libs: ['three'],
  fonts: ["500 30px 'Noto Sans SC'", "22px 'JetBrains Mono'"],
  init() {
    const D = three3d({ shadows: true, fov: 30, exposure: 1.0 });
    const T = D.THREE, sc = D.scene;
    sc.background = new T.Color('#F4F4F2');
    studioEnv(D, { top: '#ffffff', mid: '#d8dadf', floor: '#c9cbd0', bottom: '#b8babf' });
    const key = new T.DirectionalLight('#ffffff', 2.2); key.position.set(4, 9, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, far: 30 }); key.shadow.radius = 6;
    sc.add(key, new T.HemisphereLight('#ffffff', '#d0d0d0', .9));
    const floor = new T.Mesh(new T.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new T.ShadowMaterial({ opacity: .18 })); floor.receiveShadow = true; sc.add(floor);
    const M = (o) => new T.MeshStandardMaterial(o);
    const alu = M({ color: '#C9CCD2', metalness: 1, roughness: .28 }), dark = M({ color: '#2B2D31', roughness: .55 }), rub = M({ color: '#3A3C40', roughness: .9 });
    const layers = [];
    const add = (g, y0, label, spec) => { g.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } }); g.position.y = y0; sc.add(g); layers.push({ g, y0, label, spec }); return g; };
    const R = 1.0;
    // 底座
    let g = new T.Group(); g.add(new T.Mesh(new T.CylinderGeometry(R * .98, R * .9, .14, 64), rub)); add(g, .07, '底座', '硅胶防滑');
    // 电池
    g = new T.Group(); const bat = new T.Mesh(new T.BoxGeometry(1.1, .32, .7), M({ color: '#2F6FE0', roughness: .4 })); g.add(bat);
    const lb = new T.Mesh(new T.BoxGeometry(.6, .33, .71), M({ color: '#E8ECF2', roughness: .5 })); lb.position.x = .15; g.add(lb);
    add(g, .32, '电池', '5000 mAh');
    // 主板
    g = new T.Group(); g.add(new T.Mesh(new T.CylinderGeometry(R * .9, R * .9, .05, 64), M({ color: '#1F7A4D', roughness: .5 })));
    const chip = (w, d, x, z, c = '#1B1C1F') => { const m = new T.Mesh(new T.BoxGeometry(w, .06, d), M({ color: c, roughness: .4, metalness: .2 })); m.position.set(x, .05, z); g.add(m); };
    chip(.36, .36, -.1, .05); chip(.18, .12, .35, -.3); chip(.2, .2, .3, .3); chip(.12, .3, -.5, -.25, '#B98A3A'); chip(.1, .1, -.45, .35, '#C9CCD2');
    for (let i = 0; i < 6; i++) { const c = new T.Mesh(new T.CylinderGeometry(.04, .04, .1, 12), M({ color: '#3B3D44', metalness: .6, roughness: .3 })); c.position.set(.55 + (i % 2) * .1, .07, -.1 + Math.floor(i / 2) * .12); g.add(c); }
    add(g, .62, '主板', '四核处理器');
    // 扬声器：旋转体
    g = new T.Group();
    const prof = [[.05, 0], [.2, .02], [.55, .2], [.72, .26], [.78, .25], [.8, .2]].map(([x, y]) => new T.Vector2(x, y));
    g.add(new T.Mesh(new T.LatheGeometry(prof, 64), M({ color: '#2A2C30', roughness: .7, side: T.DoubleSide })));
    const cap = new T.Mesh(new T.SphereGeometry(.18, 32, 16, 0, TAU, 0, Math.PI / 2), M({ color: '#5A5D64', roughness: .3, metalness: .5 })); cap.scale.y = .5; cap.position.y = .06; g.add(cap);
    const mag = new T.Mesh(new T.CylinderGeometry(.3, .3, .2, 48), alu); mag.position.y = -.1; g.add(mag);
    add(g, .95, '扬声器', '50 mm 全频单元');
    // 网罩
    g = new T.Group(); const grill = new T.Mesh(new T.CylinderGeometry(R, R, 1.0, 96, 1, true), M({ color: '#55585F', roughness: 1, side: T.DoubleSide }));
    g.add(grill);
    for (let i = 0; i < 24; i++) { const r = new T.Mesh(new T.TorusGeometry(R + .005, .006, 6, 96), dark); r.rotation.x = Math.PI / 2; r.position.y = -.48 + i * .042; g.add(r); }
    add(g, .82, '网罩', '声学织物');
    // 顶盖和灯环
    g = new T.Group(); g.add(new T.Mesh(new T.CylinderGeometry(R, R, .1, 96), alu));
    const ring = new T.Mesh(new T.TorusGeometry(.62, .035, 12, 96), M({ color: '#9FE8FF', emissive: '#4FD6FF', emissiveIntensity: 1.6 })); ring.rotation.x = Math.PI / 2; ring.position.y = .055; g.add(ring);
    const btn = new T.Mesh(new T.CylinderGeometry(.14, .14, .03, 48), M({ color: '#E8EAEE', metalness: .3, roughness: .4 })); btn.position.y = .06; g.add(btn);
    add(g, 1.37, '顶盖', '铝合金 · 24 颗 LED');
    return { D, T, layers };
  },
  draw(ctx, t, s) {
    const { D, T, layers } = s, u = SHORT / 1080;
    const ex = k => eInOutCubic(smooth(.8 + k * .12, 1.9 + k * .12, t)) * (1 - eInOutCubic(smooth(3.6 + (5 - k) * .06, 4.5 + (5 - k) * .06, t)));
    const gap = LAND ? .42 : .5;
    const off = [0, 1, 2, 3, 6.6, 8.6];
    layers.forEach((L, i) => { L.g.position.y = L.y0 + off[i] * gap * ex(i); L.g.rotation.y = i === 3 ? 0 : ex(i) * .25 * (i % 2 ? 1 : -1); });
    const a = .6 + t * .32, dist = LAND ? 11 : 14.5, cy = 1.0 + 1.85 * ex(3);
    D.camera.position.set(Math.sin(a) * dist, cy + 2.6, Math.cos(a) * dist); D.camera.lookAt(0, cy, 0);
    if (!LAND) D.camera.setViewOffset(W, H, W * .16, 0, W, H);
    D.render(); ctx.drawImage(D.canvas, 0, 0, W, H);
    // 引线和标注
    const k = smooth(1.5, 2.1, t) * (1 - smooth(3.4, 3.7, t));
    if (k > 0) {
      const v = new T.Vector3(), right = new T.Vector3(); D.camera.matrixWorld.extractBasis(right, new T.Vector3(), new T.Vector3());
      layers.forEach((L, i) => {
        v.copy(L.g.position).addScaledVector(right, .95); v.project(D.camera);
        const px = (v.x * .5 + .5) * W, py = (-v.y * .5 + .5) * H;
        const side = 1, lx = LAND ? W * .7 : W * .64;
        const q = clamp((k - i * .05) / .5, 0, 1); if (q <= 0) return;
        const sx = side > 0 ? px : (() => { v.copy(L.g.position).addScaledVector(right, -.95); v.project(D.camera); return (v.x * .5 + .5) * W; })();
        const sy = side > 0 ? py : (-v.y * .5 + .5) * H;
        ctx.strokeStyle = '#2B2D31'; ctx.fillStyle = '#2B2D31'; ctx.lineWidth = 1.6 * u; ctx.globalAlpha = q;
        ctx.beginPath(); ctx.arc(sx, sy, 5 * u, 0, TAU); ctx.fill();
        const ex_ = lerp(sx, lx, q);
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex_, sy); ctx.stroke();
        ctx.textBaseline = 'bottom'; ctx.textAlign = side > 0 ? 'left' : 'right';
        const tx = lx + side * 12 * u;
        ctx.font = `500 ${Math.round((LAND ? 30 : 40) * u)}px 'Noto Sans SC'`; ctx.fillText(L.label, tx, sy + 2 * u);
        ctx.textBaseline = 'top'; ctx.font = `${Math.round((LAND ? 21 : 28) * u)}px 'JetBrains Mono'`; ctx.fillStyle = '#6A6E76'; ctx.fillText(L.spec, tx, sy + 8 * u);
        ctx.globalAlpha = 1;
      });
    }
  }
});
