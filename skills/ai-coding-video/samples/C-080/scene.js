// C-080 3D 动画电影式卡通：Three.js 实时渲染一个原创的圆团子角色：橙色身体用带绒感（sheen）的物理材质，大眼睛是白球加黑瞳加一颗高光小球，瞳孔每帧朝星星的方向偏，眉毛是两根小胶囊；三点布光（暖主光带阴影、冷补光、身后强烈的暖色轮廓光）；动作全按时间算：看见飘落的星星先挑眉，压扁身体做预备，起跳时拉长、空中接住星星，落地压扁后按衰减余弦回弹，最后脸红、星星在头顶闪；远景单独一层渲染后模糊，假装浅景深。
// 风格提示词：用 3D 动画电影式卡通风格（Three.js 实时渲染）：圆润夸张的角色造型、大而有高光的眼睛、柔软的材质，三点布光加暖色轮廓光，浅景深，角色动作有挤压拉伸、预备和跟随，表情靠眼睛和眉毛表演，场景是温暖的小世界。
// 题材：3D 与实时图形 · 适合：品牌吉祥物、儿童内容、产品拟人化
function starShape(T, r1, r2) {
  const s = new T.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const g = new T.ExtrudeGeometry(s, { depth: .12, bevelEnabled: true, bevelThickness: .08, bevelSize: .06, bevelSegments: 4 }); g.center(); return g;
}
// 时间表（sound.py 用同一组数）
const TB = { star: 1.0, brow: 1.25, crouch: 1.6, jump: 2.1, catch: 2.47, land: 2.85, blush: 3.2 };
function body(t) {
  // 返回 [x, y, 纵向缩放]
  const idle = 1 + .03 * Math.sin(t * 4.2);
  if (t < TB.crouch) return [-1.3, 0, idle];
  if (t < TB.jump) { const k = eOutCubic(clamp((t - TB.crouch) / .45, 0, 1)); return [-1.3, 0, 1 - .32 * k]; }
  if (t < TB.land) {
    const u = (t - TB.jump) / (TB.land - TB.jump);
    const sy = u < .12 ? lerp(.68, 1.32, u / .12) : lerp(1.32, 1.05, smooth(.12, .8, u)) - .1 * smooth(.85, 1, u);
    return [lerp(-1.3, 1.2, eInOutCubic(u)), 1.5 * 4 * u * (1 - u), sy];
  }
  const d = t - TB.land, hop = t > 3.6 ? Math.max(0, Math.sin((t - 3.6) * 6.5)) * .35 * (t < 4.6 ? 1 : 0) : 0;
  return [1.2, hop, 1 - .34 * Math.exp(-d * 6) * Math.cos(d * 20) + (hop > 0 ? .06 : 0)];
}
scene({
  id: 'C-080', name: '3D 动画电影式卡通', dur: 5, still: 4.2, libs: ['three'],
  fonts: [],
  init() {
    const D = three3d({ shadows: true, alpha: true, exposure: 1.05, fov: LAND ? 36 : 46 });
    const T = D.THREE, sc = D.scene, cam = D.camera;
    D.renderer.setClearColor(0x000000, 0);
    sc.environment = studioEnv(D, { top: '#FFE2B8', mid: '#E8B98A', floor: '#7A9A5A', bottom: '#3A4A2A', bars: [[.2, .08, 1, '#FFF2DC'], [.7, .06, .7, '#FFD0A0']] });
    const all = (o) => { o.layers.enableAll(); return o; };
    const key = all(new T.DirectionalLight('#FFE6C4', 2.6)); key.position.set(-5, 8, 7); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, far: 40 }); key.shadow.radius = 6;
    const fill = all(new T.HemisphereLight('#BFE2FF', '#6C8A4A', .9));
    const rim = all(new T.DirectionalLight('#FFB060', 5.5)); rim.position.set(3, 5, -8);
    const rim2 = all(new T.DirectionalLight('#FFC890', 3)); rim2.position.set(-6, 3, -6);
    sc.add(key, fill, rim, rim2);
    const std = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .7 }, o));
    // 前景：小草岛、蘑菇、草丛
    const isle = new T.Mesh(new T.CylinderGeometry(6, 5.6, 1, 64), std('#8CCB5E', { roughness: .9 })); isle.position.y = -.5; isle.receiveShadow = true; sc.add(isle);
    const lip = new T.Mesh(new T.TorusGeometry(5.8, .32, 16, 80), std('#7DBB52', { roughness: .9 })); lip.rotation.x = Math.PI / 2; lip.position.y = -.12; sc.add(lip);
    const soil = new T.Mesh(new T.CylinderGeometry(5.6, 4.2, 1.6, 64), std('#9A6A44')); soil.position.y = -1.8; sc.add(soil);
    const mush = new T.Group(); mush.position.set(3.4, 0, -1.4); sc.add(mush);
    const stem = new T.Mesh(new T.CylinderGeometry(.32, .42, 1.6, 24), std('#FFF1DC')); stem.position.y = .8;
    const cap = new T.Mesh(new T.SphereGeometry(1.15, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), std('#E8473C', { roughness: .45 })); cap.position.y = 1.5; cap.scale.y = .75;
    mush.add(stem, cap);
    const R = mulberry32(80);
    for (let i = 0; i < 9; i++) { const a = R() * TAU, dot = new T.Mesh(new T.SphereGeometry(.13, 12, 8), std('#FFF6EA')); const el = .3 + R() * .9; dot.position.set(Math.cos(a) * Math.sin(el) * 1.12, 1.5 + Math.cos(el) * 1.12 * .75, Math.sin(a) * Math.sin(el) * 1.12); dot.scale.y = .5; dot.lookAt(0, 0, 0); mush.add(dot); }
    for (const m of [stem, cap]) m.castShadow = true;
    const tuftM = std('#6FB24A', { roughness: .9 });
    for (let i = 0; i < 40; i++) { const a = R() * TAU, r = 1.5 + R() * 4; const b = new T.Mesh(new T.ConeGeometry(.08, .35 + R() * .3, 5), tuftM); b.position.set(Math.cos(a) * r, .15, Math.sin(a) * r); b.rotation.z = (R() - .5) * .5; sc.add(b); }
    const flowerC = ['#FFD84A', '#FF8FB0', '#FFFFFF'];
    for (let i = 0; i < 7; i++) { const a = R() * TAU, r = 2 + R() * 3.4; const f = new T.Mesh(new T.SphereGeometry(.13, 12, 8), std(flowerC[i % 3])); f.position.set(Math.cos(a) * r, .3, Math.sin(a) * r); sc.add(f); }
    // 角色
    const ch = new T.Group(); sc.add(ch);
    const squash = new T.Group(); ch.add(squash);
    const bodyM = new T.MeshPhysicalMaterial({ color: '#FF9F43', roughness: .55, sheen: 1, sheenColor: new T.Color('#FFD7A0'), sheenRoughness: .4, clearcoat: .2 });
    const bd = new T.Mesh(new T.SphereGeometry(1, 64, 40), bodyM); bd.scale.set(1, 1.08, .95); bd.position.y = 1.08; bd.castShadow = true; squash.add(bd);
    const belly = new T.Mesh(new T.SphereGeometry(.62, 40, 24), new T.MeshPhysicalMaterial({ color: '#FFE2B0', roughness: .6, sheen: 1, sheenColor: new T.Color('#FFFFFF') })); belly.position.set(0, .82, .58); belly.scale.set(1, .9, .5); squash.add(belly);
    const face = new T.Group(); face.position.set(0, 1.25, .78); squash.add(face);
    const eyes = [], brows = [];
    for (const s of [-1, 1]) {
      const e = new T.Group(); e.position.set(s * .33, 0, .04); face.add(e);
      const w = new T.Mesh(new T.SphereGeometry(.27, 32, 20), new T.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .15, clearcoat: 1 })); w.scale.z = .6; e.add(w);
      const p = new T.Group(); e.add(p);
      const pu = new T.Mesh(new T.SphereGeometry(.16, 24, 16), new T.MeshPhysicalMaterial({ color: '#1E1A2A', roughness: .1, clearcoat: 1 })); pu.scale.z = .5; pu.position.z = .1; p.add(pu);
      const hl = new T.Mesh(new T.SphereGeometry(.05, 12, 8), new T.MeshBasicMaterial({ color: '#FFFFFF' })); hl.position.set(.05, .06, .19); p.add(hl);
      const hl2 = new T.Mesh(new T.SphereGeometry(.025, 8, 6), new T.MeshBasicMaterial({ color: '#FFFFFF' })); hl2.position.set(-.05, -.05, .18); p.add(hl2);
      const lid = new T.Mesh(new T.SphereGeometry(.285, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), bodyM); lid.scale.z = .62; e.add(lid);
      const br = new T.Mesh(new T.CapsuleGeometry(.045, .22, 6, 12), std('#7A3E16')); br.rotation.z = Math.PI / 2; face.add(br);
      const ck = new T.Mesh(new T.CircleGeometry(.13, 24), new T.MeshBasicMaterial({ color: '#FF6A7A', transparent: true, opacity: 0 })); ck.position.set(s * .58, -.3, .02); ck.rotation.y = s * .5; face.add(ck);
      eyes.push({ e, p, lid, ck, s }); brows.push({ br, s });
    }
    const mouth = new T.Mesh(new T.TorusGeometry(.1, .025, 8, 20, Math.PI), std('#7A3E16')); mouth.rotation.z = Math.PI; mouth.position.set(0, -.26, .08); face.add(mouth);
    const feet = [];
    for (const s of [-1, 1]) { const f = new T.Mesh(new T.SphereGeometry(.26, 24, 16), bodyM); f.scale.set(1, .55, 1.3); f.position.set(s * .42, .1, .25); f.castShadow = true; ch.add(f); feet.push(f); }
    // 星星
    const star = new T.Mesh(starShape(T, .42, .19), new T.MeshStandardMaterial({ color: '#FFD23C', emissive: '#FFB000', emissiveIntensity: .8, roughness: .3, metalness: .2 }));
    star.castShadow = true; sc.add(star);
    const glow = all(new T.PointLight('#FFC040', 6, 6, 1.6)); sc.add(glow);
    // 远景（层 1，单独模糊）
    const bg = [];
    const hillM = std('#9FD27A', { roughness: 1 }), hillM2 = std('#B8DE8E', { roughness: 1 });
    [[-14, -22, 9, hillM], [6, -28, 12, hillM2], [22, -20, 8, hillM], [-28, -30, 11, hillM2], [-2, -18, 5, hillM]].forEach(([x, z, r, m]) => { const h = new T.Mesh(new T.SphereGeometry(r, 40, 24), m); h.position.set(x, -r * .55, z); h.scale.y = .6; bg.push(h); });
    for (let i = 0; i < 14; i++) {
      const x = -26 + i * 4 + R() * 2, z = -14 - R() * 10, tr = new T.Group();
      const tk = new T.Mesh(new T.CylinderGeometry(.25, .32, 1.6, 10), std('#8A5A3A')); tk.position.y = .8; tr.add(tk);
      const cr = new T.Mesh(new T.SphereGeometry(1.1 + R() * .5, 20, 14), std(['#5FAE4A', '#78C25A', '#4E9A40'][i % 3])); cr.position.y = 2.2; tr.add(cr);
      tr.position.set(x, -.3, z); bg.push(tr);
    }
    for (let i = 0; i < 6; i++) { const c = new T.Group(); for (let j = 0; j < 4; j++) { const p = new T.Mesh(new T.SphereGeometry(1.2 + R() * .8, 20, 14), std('#FFFFFF', { roughness: 1, emissive: '#FFF0E0', emissiveIntensity: .35 })); p.position.set(j * 1.5 - 2.2, R() * .6, R()); c.add(p); } c.position.set(-30 + i * 12 + R() * 4, 12 + R() * 5, -45); c.scale.y = .7; bg.push(c); }
    for (const o of bg) { o.traverse(m => m.layers.set(1)); sc.add(o); }
    const sky = mk(W, H), g = sky.getContext('2d'), gd = g.createLinearGradient(0, 0, 0, H);
    gd.addColorStop(0, '#8FCBE6'); gd.addColorStop(.55, '#CFE8EC'); gd.addColorStop(.75, '#FFE2B4'); gd.addColorStop(1, '#FFD39A'); g.fillStyle = gd; g.fillRect(0, 0, W, H);
    const blur = mk(W, H);
    return { D, T, cam, ch, squash, eyes, brows, mouth, feet, star, glow, sky, blur, face };
  },
  draw(ctx, t, s) {
    const { D, T, cam, ch, squash, eyes, brows, star, glow } = s;
    // 星星：飘落 → 被接住 → 停在头顶
    const [x, y, sy] = body(t), sx = 1 / Math.sqrt(sy);
    ch.position.set(x, y, .4); squash.scale.set(sx, sy, sx);
    let sp;
    if (t < TB.catch) { const u = t / TB.catch; sp = new T.Vector3(lerp(2.6, .0, u) + .5 * Math.sin(t * 3.2) * (1 - u), lerp(6.4, 1.5 + 2.45, Math.pow(u, .9)), .4 + .3 * (1 - u)); star.rotation.set(.3 * Math.sin(t * 2), t * 1.4, .4 * Math.sin(t * 2.6)); }
    else { const hb = clamp((t - TB.catch) / .25, 0, 1); sp = new T.Vector3(x, y + 2.3 * sy + .35 + .08 * Math.sin(t * 5), .4); star.rotation.set(0, TAU * eOutCubic(clamp((t - TB.catch) / .9, 0, 1)), .15 * Math.sin(t * 4)); star.scale.setScalar(1 + .35 * Math.exp(-(t - TB.catch) * 8)); }
    star.position.copy(sp); glow.position.copy(sp); glow.intensity = 5 + 3 * Math.sin(t * 8) * (t > TB.blush ? 1 : .3);
    // 朝向：转身看星星
    const look = clamp((t - .4) / .8, 0, 1) * (t < TB.land ? 1 : 1 - smooth(TB.land, TB.land + .4, t));
    ch.rotation.y = look * Math.atan2(sp.x - x, 3) * .5 + (t > 3.3 ? .2 * Math.sin((t - 3.3) * 3) : 0);
    ch.rotation.z = t > TB.jump && t < TB.land ? -.18 * Math.sin((t - TB.jump) / (TB.land - TB.jump) * Math.PI) : 0;
    // 瞳孔
    const dir = sp.clone().sub(new T.Vector3(x, y + 1.3, .4)).normalize();
    for (const E of eyes) { const k = t > TB.land + .3 ? .3 : 1; E.p.position.set(clamp(dir.x * .12 * k, -.1, .1), clamp(dir.y * .1 * k, -.08, .1), 0); }
    // 眨眼、开心眯眼
    const blink = (c) => Math.max(0, 1 - Math.abs(t - c) / .08);
    const happy = smooth(TB.blush, TB.blush + .3, t) * (1 - smooth(4.3, 4.45, t));
    const close = Math.max(blink(.7), blink(4.6), happy * .55);
    for (const E of eyes) { E.lid.visible = false; E.e.scale.y = 1 - .85 * close; E.ck.material.opacity = .7 * smooth(TB.blush, TB.blush + .5, t); }
    // 眉毛：惊讶挑高 → 预备时压低用力 → 开心上扬
    const sur = smooth(TB.brow, TB.brow + .12, t) * (1 - smooth(TB.crouch, TB.crouch + .15, t));
    const det = smooth(TB.crouch, TB.crouch + .15, t) * (1 - smooth(TB.land, TB.land + .2, t));
    for (const B of brows) { B.br.position.set(B.s * .33, .36 + .12 * sur - .05 * det + .05 * happy, .08); B.br.rotation.z = Math.PI / 2 + B.s * (.35 * det - .2 * sur - .3 * happy); }
    s.mouth.scale.set(1 + .6 * happy - .3 * det, 1 + .5 * sur + .6 * happy, 1);
    s.mouth.rotation.z = det > .5 ? 0 : Math.PI;
    for (const f of s.feet) f.position.y = .1 + (t > TB.jump && t < TB.land ? -.05 : 0);
    // 镜头
    const k = LAND ? 1 : 1.35;
    cam.position.set(-1.2 + t * .35, 2.6 + .2 * Math.sin(t * .6), 9.6 * k - t * .25);
    cam.lookAt(t * .15, LAND ? 2.2 : 2.6, 0);
    ctx.drawImage(s.sky, 0, 0);
    cam.layers.set(1); D.render();
    const b = s.blur.getContext('2d'); b.clearRect(0, 0, W, H); b.filter = `blur(${Math.round(SHORT * .006)}px)`; b.drawImage(D.canvas, 0, 0, W, H); b.filter = 'none';
    ctx.drawImage(s.blur, 0, 0);
    cam.layers.set(0); D.render(); ctx.drawImage(D.canvas, 0, 0, W, H);
    // 星星闪光
    if (t > TB.catch) {
      const v = sp.clone().project(cam), px = (v.x + 1) / 2 * W, py = (1 - v.y) / 2 * H;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + t * .7, life = ((t - TB.catch) * 1.4 + i * .13) % 1, r = SHORT * (.05 + .12 * life), sz = SHORT * .018 * Math.sin(life * Math.PI);
        const qx = px + Math.cos(a) * r, qy = py + Math.sin(a) * r;
        ctx.fillStyle = `rgba(255,230,140,${.9 * Math.sin(life * Math.PI)})`;
        ctx.beginPath(); ctx.moveTo(qx, qy - sz); ctx.quadraticCurveTo(qx, qy, qx + sz, qy); ctx.quadraticCurveTo(qx, qy, qx, qy + sz); ctx.quadraticCurveTo(qx, qy, qx - sz, qy); ctx.quadraticCurveTo(qx, qy, qx, qy - sz); ctx.fill();
      }
      ctx.restore();
    }
    vignette(ctx, .22);
  }
});
