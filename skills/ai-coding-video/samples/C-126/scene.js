// C-126 虹彩玻璃泡：Three.js 的 MeshPhysicalMaterial 打开透射和薄膜干涉（iridescence，膜厚范围控制青、品红、金三色流动），由影棚环境贴图里的几块窗形亮条给出菲涅尔亮边和高光；球里是一座发光的小城（自发光窗户的方块楼 + 一盏暖色点光）；金币按时间表一枚枚从上方落进来，落地后堆在城里；之后一道裂纹沿球面上随机游走的曲线（TubeGeometry 用 drawRange 逐段显示）长出来，再被一条金线沿同一路径封合；镜头缓慢环绕。
// 风格提示词：用虹彩玻璃泡风格：深藏青影棚里悬着一个肥皂泡般的玻璃球，薄膜干涉让表面流动着青、品红、金三色虹彩，边缘有菲涅尔亮边和窗形高光，球里是一座发光的小城，金币倾泻进来，一道细裂纹出现后被金线封合，镜头缓慢环绕。
// 题材：3D 与实时图形 · 适合：AI 经济、市场泡沫、行业趋势
const TL = { coin0: .5, coinDt: .045, coins: 46, crack: 2.7, crackD: .5, seal: 3.5, sealD: .8 }; // sound.py 用同一组数
scene({
  id: 'C-126', name: '虹彩玻璃泡', dur: 5, still: 4.6, libs: ['three'],
  fonts: [],
  init() {
    const D = three3d({ exposure: 1.0, fov: LAND ? 32 : 46 });
    const T = D.THREE, sc = D.scene;
    sc.environment = studioEnv(D, { top: '#1A2A5A', mid: '#0A1430', floor: '#060C1E', bottom: '#03060F', bars: [[.12, .06, 1, '#FFFFFF'], [.38, .03, .9, '#BFE8FF'], [.62, .08, .8, '#FFD6F2'], [.88, .05, 1, '#FFF2C8']] });
    const R = mulberry32(126);
    // 泡
    const bub = new T.Mesh(new T.SphereGeometry(1.6, 128, 64), new T.MeshPhysicalMaterial({
      color: '#ffffff', metalness: 0, roughness: 0, transmission: 1, thickness: .04, ior: 1.33,
      iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 820], clearcoat: 1, envMapIntensity: 3.5, transparent: true, side: T.FrontSide }));
    sc.add(bub);
    // 薄膜干涉的流动色：额外一层叠加着色的球壳
    const film = new T.Mesh(new T.SphereGeometry(1.608, 128, 64), new T.ShaderMaterial({
      uniforms: { T: { value: 0 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: `varying vec3 vN, vV, vP; void main(){ vec4 wp = modelMatrix * vec4(position,1.); vP = position; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `uniform float T; varying vec3 vN, vV, vP;
        vec3 film(float x){ x = fract(x); vec3 c1 = vec3(.2,.95,1.), c2 = vec3(1.,.25,.85), c3 = vec3(1.,.8,.25);
          return x < .333 ? mix(c1,c2,x*3.) : x < .666 ? mix(c2,c3,(x-.333)*3.) : mix(c3,c1,(x-.666)*3.); }
        void main(){ float f = 1. - abs(dot(normalize(vN), normalize(vV)));
          float sw = sin(vP.y*2.3 + T*.9 + sin(vP.x*3.1 - T*.7)*1.2) * .5 + sin(vP.z*2.7 + T*.6) * .3;
          vec3 c = film(f*1.3 + sw*.35 + T*.05);
          float a = .05 + .55 * pow(f, 2.2) + .08 * smoothstep(.2,.9,sw);
          gl_FragColor = vec4(c * a, 1.); }` }));
    film.renderOrder = 10; sc.add(film);
    // 小城
    const city = new T.Group(); city.position.y = -.92; sc.add(city);
    const base = new T.Mesh(new T.CylinderGeometry(1.15, 1.2, .1, 64), new T.MeshStandardMaterial({ color: '#1B2347', roughness: .5, metalness: .3 })); city.add(base);
    const winTex = (() => { const c = mk(64, 128), g = c.getContext('2d'); g.fillStyle = '#10183A'; g.fillRect(0, 0, 64, 128); for (let y = 6; y < 128; y += 14) for (let x = 6; x < 64; x += 14) if (hash1(x * 13 + y) > .35) { g.fillStyle = hash1(x + y * 7) > .5 ? '#FFD27A' : '#9FE6FF'; g.fillRect(x, y, 8, 8); } const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; return tx; })();
    for (let i = 0; i < 26; i++) {
      const a = R() * TAU, r = Math.sqrt(R()) * .85, h = .15 + R() * (r < .4 ? .9 : .45), w = .12 + R() * .1;
      const b = new T.Mesh(new T.BoxGeometry(w, h, w), new T.MeshStandardMaterial({ color: '#2A3466', emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: 1.6, roughness: .4 }));
      b.position.set(Math.cos(a) * r, .05 + h / 2, Math.sin(a) * r); city.add(b);
    }
    const glow = new T.PointLight('#FFC86A', 6, 3, 1.5); glow.position.set(0, .6, 0); city.add(glow);
    // 金币
    const coinG = new T.CylinderGeometry(.075, .075, .016, 24), coinM = new T.MeshStandardMaterial({ color: '#FFC83C', metalness: 1, roughness: .22, envMapIntensity: 1.6, emissive: '#7A5200', emissiveIntensity: .8 });
    const coins = [];
    for (let i = 0; i < TL.coins; i++) { const m = new T.Mesh(coinG, coinM); sc.add(m); const a = R() * TAU, r = Math.sqrt(R()) * .8; coins.push({ m, t0: TL.coin0 + i * TL.coinDt, x0: (R() - .5) * .3, z0: (R() - .5) * .3, x1: Math.cos(a) * r, z1: Math.sin(a) * r, y1: -.85 + .02 * Math.floor(i / 12) + R() * .02, rx: R() * TAU, rz: R() * TAU, sp: 4 + R() * 6 }); }
    // 裂纹路径：球面上的随机游走
    let th = 1.15, ph = .5; const pts = [];
    for (let i = 0; i < 40; i++) { pts.push(new T.Vector3().setFromSphericalCoords(1.612, th, ph)); th += (R() - .5) * .09 + .012; ph += .035 + (R() - .5) * .06; }
    const curve = new T.CatmullRomCurve3(pts);
    const tube = (r, m) => { const g = new T.TubeGeometry(curve, 300, r, 6, false); const mesh = new T.Mesh(g, m); sc.add(mesh); return mesh; };
    const crack = tube(.0065, new T.MeshBasicMaterial({ color: '#EAF6FF', transparent: true, opacity: .95 }));
    const seal = tube(.013, new T.MeshStandardMaterial({ color: '#FFC23A', metalness: 1, roughness: .2, emissive: '#B07800', emissiveIntensity: .7 }));
    const bg = mk(W, H), g = bg.getContext('2d'), rg = g.createRadialGradient(W / 2, H * .5, 0, W / 2, H * .5, Math.max(W, H) * .65);
    rg.addColorStop(0, '#1C2E66'); rg.addColorStop(.5, '#0B1636'); rg.addColorStop(1, '#03060F'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
    const bgt = new T.CanvasTexture(bg); bgt.colorSpace = T.SRGBColorSpace; sc.background = bgt;
    return { D, T, bub, film, coins, crack, seal, bg };
  },
  draw(ctx, t, s) {
    const { D, coins } = s, cam = D.camera;
    for (const c of coins) {
      const u = t - c.t0;
      if (u < 0) { c.m.visible = false; continue; }
      c.m.visible = true;
      const fall = .62, y0 = 3.2;
      if (u < fall) { const k = u / fall; c.m.position.set(lerp(c.x0, c.x1, k), lerp(y0, c.y1, k * k), lerp(c.z0, c.z1, k)); c.m.rotation.set(c.rx + u * c.sp, 0, c.rz + u * c.sp * .7); }
      else { const b = u - fall, hop = Math.abs(Math.sin(b * 18)) * .06 * Math.exp(-b * 9); c.m.position.set(c.x1, c.y1 + hop, c.z1); c.m.rotation.set(lerp(c.rx + fall * c.sp, .05, clamp(b * 6, 0, 1)), c.rz, lerp(c.rz + fall * c.sp * .7, .04, clamp(b * 6, 0, 1))); }
    }
    const ix = s.crack.geometry.index.count, cr = clamp((t - TL.crack) / TL.crackD, 0, 1), se = clamp((t - TL.seal) / TL.sealD, 0, 1);
    s.crack.geometry.setDrawRange(0, Math.floor(eOutCubic(cr) * ix / 6) * 6); s.crack.visible = cr > 0;
    s.crack.material.opacity = .95 * (1 - smooth(TL.seal + TL.sealD * .5, TL.seal + TL.sealD + .2, t));
    s.seal.geometry.setDrawRange(0, Math.floor(eInOutCubic(se) * ix / 6) * 6); s.seal.visible = se > 0;
    s.bub.material.iridescenceThicknessRange = [180 + 60 * Math.sin(t * 1.3), 820 + 120 * Math.sin(t * .9)];
    s.bub.scale.setScalar(1 + .006 * Math.sin(t * 5) - .01 * Math.exp(-Math.max(0, t - TL.crack) * 8) * (t > TL.crack ? 1 : 0));
    s.film.material.uniforms.T.value = t; s.film.scale.copy(s.bub.scale);
    const a = -.4 + t * .22, r = LAND ? 6.4 : 7.0;
    cam.position.set(Math.sin(a) * r, .9 + .25 * Math.sin(t * .5), Math.cos(a) * r); cam.lookAt(0, -.05, 0);
    D.render(); ctx.drawImage(D.canvas, 0, 0, W, H);
    vignette(ctx, .35);
  }
});
