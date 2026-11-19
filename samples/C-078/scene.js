// C-078 体素世界：用分形噪声算一张高度图，Three.js 的实例化网格把每一列摆成统一尺寸的立方体（只摆表层几格），顶面草、侧面土、低处沙；每块按周围更高的邻格数压暗一点当环境光遮蔽，树、花、小屋也是方块簇，水面是一块半透明平面反射天空；三个机位依次切换，各配一套光：清晨的低角度暖光、蓝调时刻窗里亮灯、雨天灰光加 Canvas 画的雨丝。
// 风格提示词：用体素（Voxel）风格：地形、建筑、树木全部由统一尺寸的小立方体搭成，方块表面平涂、带轻微环境光遮蔽和柔和阴影，花和树叶是彩色方块簇，水面半透明并反射天空，镜头在多个机位间缓慢切换，可切换清晨、蓝调时刻、雨天等时段氛围。
// 题材：3D 与实时图形 · 适合：文旅、游戏官网、儿童科普
scene({
  id: 'C-078', name: '体素世界', dur: 5, still: 1.2, libs: ['three'],
  fonts: ["500 26px 'Noto Sans SC'"],
  init() {
    const D = three3d({ shadows: true, fov: 35, exposure: 1.0 });
    const T = D.THREE, sc = D.scene, R = mulberry32(78), N = 34, WL = 3;
    const hgt = (x, z) => { const dx = (x - N / 2) / (N / 2), dz = (z - N / 2) / (N / 2), fall = Math.max(0, Math.hypot(dx, dz) - .55) * 9; return Math.max(1, Math.floor(1 + 16 * (fbm(x * .08 + 3, z * .08 + 7, 4) - .22) - fall)); };
    const H = []; for (let x = 0; x < N; x++) { H[x] = []; for (let z = 0; z < N; z++) H[x][z] = hgt(x, z); }
    // 小屋放在一块平地上
    const hxp = 20, hzp = 14, hb = H[hxp][hzp];
    for (let x = hxp - 2; x <= hxp + 2; x++) for (let z = hzp - 2; z <= hzp + 2; z++) H[x][z] = hb;
    const cubes = [];
    const put = (x, y, z, c) => cubes.push([x, y, z, c]);
    const hs = (c, j = .06) => { const o = new T.Color(c), h = {}; o.getHSL(h); o.setHSL(h.h, h.s, clamp(h.l + (R() - .5) * j, 0, 1)); return o; };
    for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
      const h = H[x][z];
      for (let y = Math.max(0, h - 3); y < h; y++) {
        const top = y === h - 1, sand = h <= WL + 1;
        let c = top ? (sand ? '#E6D29A' : '#6DBE4B') : (sand ? '#D8C08A' : '#8A6242');
        if (top && !sand && h > 8) c = '#9AA0A6';
        // 环境光遮蔽：周围更高的邻格越多越暗
        let occ = 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nh = (H[x + a] || [])[z + b]; if (nh > y + 1) occ++; }
        const col = hs(c); col.multiplyScalar(1 - occ * .09); put(x, y, z, col);
      }
    }
    // 树和花
    const tree = (x, z) => { const b = H[x][z]; for (let y = 0; y < 3; y++) put(x, b + y, z, hs('#7A5234')); for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) for (let y = 2; y < 5; y++) { if (Math.abs(a) + Math.abs(c) + (y === 4 ? 1 : 0) > 2 && R() < .7) continue; put(x + a, b + y + 1, z + c, hs('#3E8E3E', .12)); } };
    let nt = 0; for (let k = 0; k < 400 && nt < 16; k++) { const x = 3 + Math.floor(R() * (N - 6)), z = 3 + Math.floor(R() * (N - 6)); if (H[x][z] <= WL + 1 || H[x][z] > 8 || Math.abs(x - hxp) < 4 && Math.abs(z - hzp) < 4) continue; tree(x, z); nt++; }
    for (let k = 0; k < 60; k++) { const x = Math.floor(R() * N), z = Math.floor(R() * N); if (H[x][z] <= WL + 1 || H[x][z] > 8 || Math.abs(x - hxp) < 3 && Math.abs(z - hzp) < 3) continue; const g = new T.Color(['#FF5C8A', '#FFD23F', '#FFFFFF', '#B47CFF'][k % 4]); const m = new T.Mesh(new T.BoxGeometry(.35, .35, .35), new T.MeshStandardMaterial({ color: g, roughness: .8 })); m.position.set(x - N / 2 + (R() - .5) * .4, H[x][z] + .18, z - N / 2 + (R() - .5) * .4); m.castShadow = true; sc.add(m); }
    // 小屋
    for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) for (let y = 0; y < 3; y++) { if (Math.abs(x) < 2 && Math.abs(z) < 2) continue; if (z === 2 && x === 0 && y < 2) continue; if ((x === -2 || x === 2) && z === 0 && y === 1) continue; put(hxp + x, hb + y, hzp + z, hs('#F1E7D6', .04)); }
    for (let k = 0; k < 3; k++) for (let x = -2 - (k ? 0 : 1) + k; x <= 2 + (k ? 0 : 1) - k; x++) for (let z = -3 + k; z <= 3 - k; z++) { if (k < 2 && Math.abs(x) < 2 - k && Math.abs(z) < 3 - k) continue; put(hxp + x, hb + 3 + k, hzp + z, hs('#C8503C', .05)); }
    const win = new T.MeshStandardMaterial({ color: '#FFD98A', emissive: '#FFB347', emissiveIntensity: 0 });
    for (const x of [-2.52, 2.52]) { const m = new T.Mesh(new T.BoxGeometry(.06, .9, .9), win); m.position.set(hxp - N / 2 + x * .996, hb + 1.5, hzp - N / 2); sc.add(m); }
    const geo = new T.BoxGeometry(1, 1, 1), mat = new T.MeshStandardMaterial({ roughness: .85 });
    const inst = new T.InstancedMesh(geo, mat, cubes.length), m4 = new T.Matrix4();
    cubes.forEach(([x, y, z, c], i) => { m4.makeTranslation(x - N / 2, y + .5, z - N / 2); inst.setMatrixAt(i, m4); inst.setColorAt(i, c); });
    inst.castShadow = inst.receiveShadow = true; sc.add(inst);
    // 水面
    const water = new T.Mesh(new T.PlaneGeometry(N * 3, N * 3).rotateX(-Math.PI / 2), new T.MeshPhysicalMaterial({ color: '#3D8FD1', transparent: true, opacity: .72, roughness: .08, metalness: .1, envMapIntensity: 1.2 }));
    water.position.y = WL + .85; sc.add(water);
    const sun = new T.DirectionalLight('#fff', 2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, far: 120 }); sun.shadow.radius = 4;
    const hemi = new T.HemisphereLight('#fff', '#888', 1); sc.add(sun, hemi);
    const glow = new T.PointLight('#FFB347', 0, 14); glow.position.set(hxp - N / 2, hb + 1.5, hzp - N / 2); sc.add(glow);
    // 三套光：清晨、蓝调、雨天（环境贴图跟着换，水面反射天空）
    const looks = [
      { bg: '#F7C9A0', top: '#FFD9B0', mid: '#F2B48A', sun: '#FFC58A', si: 2.6, sp: [-30, 10, 12], ht: '#FFE2C2', hb: '#7A6A5A', hi: 1.0, win: .3, fog: '#F4CFA8' },
      { bg: '#2B3A6B', top: '#3D4F8C', mid: '#24305A', sun: '#8FA8FF', si: .7, sp: [20, 25, -10], ht: '#6F86C9', hb: '#2A2F45', hi: .9, win: 2.2, fog: '#2B3A6B' },
      { bg: '#7E878E', top: '#959DA4', mid: '#6E767C', sun: '#DDE3E8', si: .35, sp: [5, 30, 10], ht: '#AEB6BC', hb: '#4A5056', hi: 1.0, win: .8, fog: '#8C969E' }];
    const envs = looks.map(L => studioEnv(D, { top: L.top, mid: L.mid, floor: L.mid, bottom: L.mid, bars: [[.3, .2, .4, '#ffffff']] }));
    sc.fog = new T.Fog('#fff', 45, 130);
    return { D, T, sc, sun, hemi, glow, win, water, looks, envs, N };
  },
  draw(ctx, t, s) {
    const { D, T, sc, sun, hemi, glow, win, looks, envs } = s, u = SHORT / 1080;
    const shot = t < 1.7 ? 0 : t < 3.4 ? 1 : 2, lt = t - [0, 1.7, 3.4][shot], L = looks[shot];
    sc.background = new T.Color(L.bg); sc.environment = envs[shot]; sc.fog.color.set(L.fog);
    sun.color.set(L.sun); sun.intensity = L.si; sun.position.set(...L.sp);
    hemi.color.set(L.ht); hemi.groundColor.set(L.hb); hemi.intensity = L.hi;
    win.emissiveIntensity = L.win; glow.intensity = L.win * 6;
    const cams = [
      [[-21 + lt * 1.5, 12, 18], [2, 4, -1]],
      [[26 - lt * 2.2, 15, 18 + lt * .6], [2, 4, -1]],
      [[-6 + lt * 1.4, 22, -24], [0, 2, 2]]];
    const [p, q] = cams[shot], k = LAND ? 1 : 1.35;
    D.camera.position.set(p[0] * k, p[1] * k, p[2] * k); D.camera.lookAt(...q);
    D.render(); ctx.drawImage(D.canvas, 0, 0, W, H);
    // 雨丝
    if (shot === 2) {
      ctx.fillStyle = 'rgba(70,80,90,.22)'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(220,230,240,.35)'; ctx.lineWidth = 1.5 * u;
      ctx.beginPath();
      for (let i = 0; i < 260; i++) { const x = (hash1(i * 3.1) * 1.2 - .1) * W, y = ((hash1(i * 7.7) + t * (1.6 + hash1(i) * .6)) % 1) * H * 1.1 - H * .05, l = (30 + hash1(i * 2.3) * 40) * u; ctx.moveTo(x, y); ctx.lineTo(x - l * .18, y + l); }
      ctx.stroke();
    }
    // 机位标签
    ctx.font = `500 ${Math.round(26 * u)}px 'Noto Sans SC'`; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    const lab = ['清晨', '蓝调时刻', '雨天'][shot], a = smooth(0, .25, lt) * (1 - smooth(1.3, 1.6, lt) * (shot < 2 ? 1 : 0));
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,.35)'; const tw = ctx.measureText(lab).width;
    rr(ctx, 40 * u, 40 * u, tw + 40 * u, 48 * u, 24 * u); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(lab, 60 * u, 51 * u); ctx.globalAlpha = 1;
  }
});
