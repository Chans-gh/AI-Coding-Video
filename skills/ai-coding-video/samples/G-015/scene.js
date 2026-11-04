// G-015 三维产品展台：Poly Haven 的 CC0 陶瓷花瓶模型（glTF 网格 + 法线、粗糙度贴图）放进 Three.js 转台；
// 生图出一张青花缠枝莲纹样，按圆柱投影包到瓶身（镜像平铺，接缝处纹样连续），着色器里一道「上釉线」从瓶底往上走，
// 白坯一路变成青花瓷；背景是生图出的米色摄影棚，三维画面透明底叠上去，地面只留影子。最后是虚构瓷器品牌的落版
// 素材：三维模型（Poly Haven，CC0）、生图 2 张（纹样、背景）；配乐 CC0。品牌是虚构的
const ZH = '素坯一转青花上釉缠枝莲高釉面镜面高光纹样生成模型青屿一器一纹手绘的花，转起来看';
scene({
  id: 'G-015', name: '三维产品展台', dur: 12, still: 6.6, libs: ['three'],
  fonts: ["900 40px 'Noto Serif SC'", "700 40px 'Noto Serif SC'", "400 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Playfair Display'"],
  text: ZH,
  async init() {
    const A = await loadAssets();
    const [gltf, bin, glaze, nor, arm, bg] = await Promise.all([loadText('vase.gltf').then(JSON.parse), xhr(asset('vase.bin'), 'arraybuffer'),
      loadImage('glaze.jpg'), loadImage('vase_nor.jpg'), loadImage('vase_arm.jpg'), loadImage('backdrop.jpg')]);
    const D = three3d({ w: Math.round(W * .75), h: Math.round(H * .75), fov: LAND ? 24 : 30, alpha: true, shadows: true, exposure: 1.0 });
    const T = D.THREE;
    // 读 glTF：只有一个网格，按 accessor 从 .bin 里切出顶点、法线、UV、索引
    const acc = i => {
      const a = gltf.accessors[i], v = gltf.bufferViews[a.bufferView], n = { SCALAR: 1, VEC2: 2, VEC3: 3 }[a.type];
      const C = a.componentType === 5126 ? Float32Array : a.componentType === 5125 ? Uint32Array : Uint16Array;
      return new C(bin, (v.byteOffset || 0) + (a.byteOffset || 0), a.count * n);
    };
    const pr = gltf.meshes[0].primitives[0];
    let geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(acc(pr.attributes.POSITION), 3));
    geo.setAttribute('normal', new T.BufferAttribute(acc(pr.attributes.NORMAL), 3));
    geo.setAttribute('uv', new T.BufferAttribute(acc(pr.attributes.TEXCOORD_0), 2));   // 原 UV：给法线、粗糙度贴图用
    geo.setIndex(new T.BufferAttribute(acc(pr.indices), 1));
    // 纹样用圆柱投影（uv1）：u 绕一圈 = 4 个镜像平铺，v 按高度；拆成独立三角形，跨接缝的三角形把小的 u 加一圈
    geo = geo.toNonIndexed();
    const P = geo.attributes.position.array, n = P.length / 3, U1 = new Float32Array(n * 2), REP = 2, TILE = .64 / REP;
    for (let i = 0; i < n; i++) {
      U1[i * 2] = (Math.atan2(P[i * 3 + 2], P[i * 3]) / (2 * Math.PI) + .5) * REP;
      U1[i * 2 + 1] = P[i * 3 + 1] / (TILE * 9 / 16);
    }
    for (let t = 0; t < n; t += 3) {
      const us = [U1[t * 2], U1[t * 2 + 2], U1[t * 2 + 4]];
      if (Math.max(...us) - Math.min(...us) > REP / 2) for (let k = 0; k < 3; k++) if (us[k] < REP / 2) U1[(t + k) * 2] += REP;
    }
    geo.setAttribute('uv1', new T.BufferAttribute(U1, 2));
    const tex = (im, srgb, mirror) => {
      const x = new T.Texture(im); x.needsUpdate = true; x.flipY = false;
      if (srgb) x.colorSpace = T.SRGBColorSpace;
      if (mirror) { x.wrapS = x.wrapT = T.MirroredRepeatWrapping; x.channel = 1; x.flipY = true; }
      x.anisotropy = 8; return x;
    };
    const uRev = { value: -1 };
    const mat = new T.MeshPhysicalMaterial({ map: tex(glaze, true, true), normalMap: tex(nor), roughnessMap: tex(arm), aoMap: tex(arm),
      roughness: .9, metalness: 0, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.1 });
    mat.normalScale.set(1, -1);
    // 上釉线：瓶身高度 vY 在 uRev 以下显示纹样，以上是白坯；线上一圈蓝光
    mat.onBeforeCompile = sh => {
      sh.uniforms.uRev = uRev;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vY;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvY = position.y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vY;\nuniform float uRev;')
        .replace('#include <map_fragment>', `vec4 tc = texture2D(map, vMapUv);
          float gk = smoothstep(uRev + .004, uRev - .004, vY);
          diffuseColor.rgb *= mix(vec3(.93, .92, .89), tc.rgb, gk);
          float edge = 1. - smoothstep(0., .007, abs(vY - uRev));`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += edge * vec3(.25, .45, 1.) * 1.4;');
    };
    const vase = new T.Mesh(geo, mat);
    vase.castShadow = true;
    const pivot = new T.Group(); pivot.add(vase); D.scene.add(pivot);
    // 地面只收影子；主光对着背景图左上的柔光箱
    const floor = new T.Mesh(new T.PlaneGeometry(4, 4), new T.ShadowMaterial({ opacity: .32 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; D.scene.add(floor);
    const key = new T.DirectionalLight(0xfff1dc, 2.2);
    key.position.set(-1.2, 2.2, 1.0); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 8;
    Object.assign(key.shadow.camera, { left: -.5, right: .5, top: .5, bottom: -.5, near: .5, far: 5 });
    D.scene.add(key);
    D.scene.environment = studioEnv(D, { top: '#d9c8ad', mid: '#8a7a64', floor: '#5a4d3e', bottom: '#2a241d',
      bars: [[.18, .08, 1, '#ffffff'], [.55, .04, .6, '#ffe9cc'], [.85, .07, .7, '#cfe0ff']] });
    return { A, D, T, pivot, uRev, bg };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, { D, T } = s;
    // 背景：生图的摄影棚，跟着机位慢慢移
    const push = eInOutCubic(inv(0, 12, t));
    drawCover(ctx, s.bg, 0, 0, W, H, { zoom: 1.08 + .06 * push, fx: LAND ? .4 + .1 * push : .42, fy: .7 });
    // 转台：一直转；上釉段（1.6–4.6 秒）从瓶底刷到瓶口
    s.pivot.rotation.y = t * .55 + .4;
    s.uRev.value = lerp(-.01, .42, eInOutCubic(inv(1.6, 4.6, t)));
    const rise = eOutCubic(inv(0, 1.2, t));
    s.pivot.position.y = (1 - rise) * -.05;
    // 机位：远景 → 中段推近看瓶口 → 结尾拉回、往右让出落版
    const near = eInOutCubic(inv(4.8, 7.0, t)) * (1 - eInOutCubic(inv(8.0, 9.6, t)));
    const out = eInOutCubic(inv(8.0, 9.6, t));
    const dist = (LAND ? 1.55 : 1.75) - .55 * near, ang = .18 * Math.sin(t * .35);
    const cam = D.camera, ty = .19 + .1 * near;
    cam.position.set(Math.sin(ang) * dist, ty + .18 - .08 * near, Math.cos(ang) * dist);
    cam.lookAt(LAND ? -.22 * out : 0, ty - (LAND ? 0 : .1 * out), 0);
    if (!LAND) cam.position.y += .1 * out;
    cam.updateProjectionMatrix();
    D.render();
    ctx.globalAlpha = rise; ctx.drawImage(D.canvas, 0, 0, W, H); ctx.globalAlpha = 1;
    vignette(ctx, .35, .45, '40,28,16');
    ctx.save(); ctx.textBaseline = 'alphabetic';
    const ink = '#1f2f5c', sub = '#5b4a36';
    const tag = (txt, a, x, y, size, col = ink, font = 'Noto Serif SC', wt = 700, al = 'left') => {
      if (a <= 0) return; ctx.globalAlpha = a; ctx.fillStyle = col; ctx.textAlign = al;
      ctx.font = `${wt} ${size * u}px '${font}'`; ctx.fillText(txt, x, y);
    };
    // 段落字幕
    const lx = LAND ? 110 * u : W / 2, la = LAND ? 'left' : 'center', ly = LAND ? H * .3 : H * .14;
    const a1 = smooth(.4, 1.0, t) * (1 - smooth(1.5, 1.9, t));
    tag('素坯 · 转起来看', a1, lx, ly, LAND ? 52 : 60, sub, 'Noto Serif SC', 700, la);
    const a2 = smooth(1.9, 2.4, t) * (1 - smooth(4.6, 5.0, t));
    tag('青花上釉', a2, lx, ly, LAND ? 64 : 72, ink, 'Noto Serif SC', 900, la);
    tag('缠枝莲 · 手绘的花', a2, lx, ly + (LAND ? 56 : 64) * u, LAND ? 30 : 34, sub, 'Noto Sans SC', 400, la);
    // 特写段：三条参数标注，细线指向瓶身
    const a3 = smooth(5.6, 6.2, t) * (1 - smooth(7.6, 8.0, t));
    if (a3 > 0) {
      const rows = [['高 40 cm', 'H 400 mm'], ['釉面 · 镜面高光', 'CLEAR GLAZE'], ['纹样 · 缠枝莲', 'LOTUS SCROLL']];
      const x0 = LAND ? W * .64 : W * .1, y0 = LAND ? H * .3 : H * .1;
      rows.forEach(([a, b], i) => {
        const k = smooth(5.6 + i * .2, 6.1 + i * .2, t) * a3, y = y0 + i * (LAND ? 120 : 112) * u;
        ctx.globalAlpha = k; ctx.strokeStyle = ink; ctx.lineWidth = 2 * u;
        ctx.beginPath(); ctx.moveTo(x0 - (LAND ? 30 : -0) * u, y - 12 * u); ctx.lineTo(x0 - (LAND ? 30 + 140 * k : 0) * u, y - 12 * u); ctx.stroke();
        tag(a, k, x0 + (LAND ? 0 : 0), y, LAND ? 40 : 40, ink, 'Noto Serif SC', 700);
        tag(b, k * .8, x0, y + 34 * u, 20, sub, 'Playfair Display', 400);
      });
    }
    // 落版
    const a4 = smooth(9.0, 9.8, t);
    if (a4 > 0) {
      const bx = LAND ? W * .3 : W / 2, by = LAND ? H * .46 : H * .16;
      tag('青屿', a4, bx, by, LAND ? 130 : 140, ink, 'Noto Serif SC', 900, 'center');
      tag('Q I N G Y U   C E R A M I C S', a4, bx, by + 62 * u, LAND ? 26 : 28, sub, 'Playfair Display', 400, 'center');
      tag('一器一纹', smooth(9.6, 10.4, t), bx, by + 140 * u, LAND ? 40 : 44, ink, 'Noto Serif SC', 700, 'center');
    }
    ctx.globalAlpha = .7; ctx.textAlign = 'right'; ctx.fillStyle = sub; ctx.font = `400 ${15 * u}px 'Noto Sans SC'`;
    ctx.fillText(credits(s.A), W - 22 * u, H - 16 * u);
    ctx.restore();
  },
});
