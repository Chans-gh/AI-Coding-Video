// T-020 对局复盘：Three.js 用 Poly Haven 的 CC0 木箱、油桶搭一块俯视竞技场，按虚构对局数据表（每秒位置、击杀）回放 6 名选手的走位和轨迹；击杀处闪圈、时间线落点、数据面板跳数；第一次阵亡时暂停，像战术板一样画圈画箭头，再沿着路线用滑块对比「实际走位」和「建议走位」
// 素材：三维模型 Poly Haven（CC0）、虚构对局数据 match.csv（由 match.py 生成）；配乐 CC0。选手的点、轨迹、批注是把三维坐标投到屏幕上再用 Canvas 2D 画的
scene({
  id: 'T-020', name: '对局复盘', dur: 14, still: 6.9,
  libs: ['three'],
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'", "700 40px 'JetBrains Mono'"],
  text: '对局复盘第回合蓝队红队击杀阵亡落单走中路被架点实际走位建议走位贴着箱子推进视线被挡住存活回合结束胜三维模型数据虚构配乐时间线选手',
  async init() {
    const A = await loadAssets();
    const rows = parseCSV(await loadText('match.csv'));
    const P = {}, K = [];
    for (const r of rows) {
      if (r.event === 'kill') { K.push(r); continue; }
      (P[r.player] ||= { team: r.team, pos: [] }).pos[r.t] = [r.x, r.z];
    }
    K.sort((a, b) => a.t - b.t);
    // ---- 三维场地 ----
    const RW = Math.round(LAND ? W * .7 : W), RH = Math.round(LAND ? H : H * .6);
    const D = three3d({ w: RW, h: RH, fov: LAND ? 34 : 44, shadows: true, exposure: 1.05 });
    const T = D.THREE;
    const glb = async (name) => {
      const [g, bin, img] = await Promise.all([loadText(name + '.gltf').then(JSON.parse), xhr(asset(name + '.bin'), 'arraybuffer'), loadImage(name + '_diff.jpg')]);
      const acc = i => {
        const a = g.accessors[i], v = g.bufferViews[a.bufferView], n = { SCALAR: 1, VEC2: 2, VEC3: 3 }[a.type];
        const C = a.componentType === 5126 ? Float32Array : a.componentType === 5125 ? Uint32Array : Uint16Array;
        return new C(bin, (v.byteOffset || 0) + (a.byteOffset || 0), a.count * n);
      };
      const map = new T.Texture(img); map.needsUpdate = true; map.flipY = false; map.colorSpace = T.SRGBColorSpace; map.anisotropy = 8;
      const mat = new T.MeshStandardMaterial({ map, roughness: .85 });
      const grp = new T.Group();
      for (const nd of g.nodes) {                      // 每个节点一个网格（木箱是箱体 + 盖子）
        const pr = g.meshes[nd.mesh].primitives[0], geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.BufferAttribute(acc(pr.attributes.POSITION), 3));
        geo.setAttribute('normal', new T.BufferAttribute(acc(pr.attributes.NORMAL), 3));
        geo.setAttribute('uv', new T.BufferAttribute(acc(pr.attributes.TEXCOORD_0), 2));
        geo.setIndex(new T.BufferAttribute(acc(pr.indices), 1));
        const m = new T.Mesh(geo, mat); m.castShadow = m.receiveShadow = true;
        if (nd.translation) m.position.fromArray(nd.translation);
        grp.add(m);
      }
      return grp;
    };
    const [crate, barrel] = await Promise.all([glb('crate'), glb('barrel')]);
    // 地面：代码画的战术网格，两端出生区染队色，三条路线稍亮
    const fc = mk(1600, 960), g = fc.getContext('2d');
    g.fillStyle = '#2b3138'; g.fillRect(0, 0, 1600, 960);
    for (const z of [13, 30, 47]) { g.fillStyle = 'rgba(255,255,255,.045)'; g.fillRect(0, (z - 5) * 16, 1600, 160); }
    g.fillStyle = 'rgba(70,140,255,.22)'; g.fillRect(0, 0, 12 * 16, 960);
    g.fillStyle = 'rgba(255,80,80,.2)'; g.fillRect(88 * 16, 0, 12 * 16, 960);
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2;
    for (let x = 0; x <= 100; x += 5) { g.beginPath(); g.moveTo(x * 16, 0); g.lineTo(x * 16, 960); g.stroke(); }
    for (let z = 0; z <= 60; z += 5) { g.beginPath(); g.moveTo(0, z * 16); g.lineTo(1600, z * 16); g.stroke(); }
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${hash1(i) > .5 ? 255 : 0},${hash1(i) > .5 ? 255 : 0},${hash1(i) > .5 ? 255 : 0},.05)`; g.fillRect(hash1(i * 3 + 1) * 1600, hash1(i * 7 + 2) * 960, 3, 3); }
    const ftex = new T.CanvasTexture(fc); ftex.colorSpace = T.SRGBColorSpace; ftex.anisotropy = 8;
    const floor = new T.Mesh(new T.PlaneGeometry(100, 60), new T.MeshStandardMaterial({ map: ftex, roughness: .95 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(50, 0, 30); floor.receiveShadow = true; D.scene.add(floor);
    const wallM = new T.MeshStandardMaterial({ color: 0x4a525c, roughness: .8 });
    for (const [x, z, w, d] of [[50, -1, 102, 2], [50, 61, 102, 2], [-1, 30, 2, 64], [101, 30, 2, 64]]) {
      const b = new T.Mesh(new T.BoxGeometry(w, 2.4, d), wallM); b.position.set(x, 1.2, z); b.castShadow = b.receiveShadow = true; D.scene.add(b);
    }
    // 掩体：木箱（放大 5 倍，约 2.6 × 5.8）、油桶（放大 3.5 倍）
    const COVER = [['c', 30, 38, 1.57], ['c', 38, 40.5, 0], ['c', 46.5, 37, 1.57], ['c', 50, 20, 0], ['c', 62, 22, 1.57], ['c', 66, 41, 0], ['c', 70, 29, 1.57], ['c', 22, 21, 0], ['c', 80, 39, 0],
      ['b', 42, 22], ['b', 44.2, 23.6], ['b', 56, 44], ['b', 58.2, 45], ['b', 80, 20], ['b', 20, 41], ['b', 26, 17], ['b', 54, 9], ['b', 60, 51]];
    for (const [k, x, z, r] of COVER) {
      const o = (k === 'c' ? crate : barrel).clone(); o.scale.setScalar(k === 'c' ? 5 : 3.5);
      o.position.set(x, 0, z); o.rotation.y = r || hash1(x * 13 + z) * 3; D.scene.add(o);
    }
    D.scene.add(new T.HemisphereLight(0xdfe8ff, 0x30302c, 1.1));
    const sun = new T.DirectionalLight(0xfff0dd, 2.4);
    sun.position.set(30, 60, 10); sun.target.position.set(50, 0, 30); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 4;
    Object.assign(sun.shadow.camera, { left: -65, right: 65, top: 45, bottom: -45, near: 10, far: 140 });
    D.scene.add(sun, sun.target);
    D.scene.background = new T.Color(0x14181d);
    return { A, D, T, P, K, RW, RH, v: new T.Vector3() };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, { D, P, K } = s;
    const BLUE = '#4d9bff', RED = '#ff5a5a', GREEN = '#47e08a', INK = '#e9eef5', DIM = '#8b96a5';
    // 时间映射：0–1 秒片头；1–4.2 秒回放 0→40 秒；4.2–8.4 秒暂停批注；8.4–12 秒回放 40→90 秒；之后落版
    const g = t < 1 ? 0 : t < 4.2 ? 40 * inv(1, 4.2, t) : t < 8.4 ? 40 : t < 12 ? 40 + 50 * inv(8.4, 12, t) : 90;
    const vt = k => k <= 40 ? 1 + k / 40 * 3.2 : 8.4 + (k - 40) / 50 * 3.6;   // 对局秒 → 视频秒
    // 机位：开场从低角度慢慢升到俯视
    const rise = eInOutCubic(inv(0, 1.6, t)), cam = D.camera, C = [50, 0, 30];
    if (LAND) cam.position.set(50, 58 + 24 * rise, 30 + 66 - 18 * rise);
    else cam.position.set(50 - 58 + 16 * rise, 52 + 30 * rise, 30);
    cam.lookAt(C[0], 0, C[2]); cam.updateProjectionMatrix();
    D.render();
    const RX = 0, RY = LAND ? 0 : H * .13;
    ctx.fillStyle = '#14181d'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(D.canvas, RX, RY, s.RW, s.RH);
    const pj = (x, z, y = 0) => { s.v.set(x, y, z).project(cam); return [RX + (s.v.x + 1) / 2 * s.RW, RY + (1 - s.v.y) / 2 * s.RH]; };
    const pos = (p, k) => {                                 // 第 k 秒（可带小数）的位置；阵亡后返回 null
      const a = P[p].pos, n = a.length - 1;
      if (k > n) return null;
      const i = Math.floor(k), f = k - i, A0 = a[i], A1 = a[Math.min(n, i + 1)];
      return [lerp(A0[0], A1[0], f), lerp(A0[1], A1[1], f)];
    };
    const col = p => P[p].team === '蓝' ? BLUE : RED;
    const dead = p => K.some(k => k.target === p && k.t <= g);
    ctx.save(); ctx.beginPath(); ctx.rect(RX, RY, s.RW, s.RH); ctx.clip();
    const show = inv(1.1, 1.5, t);
    // 轨迹：最近 14 秒，越早越淡
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const p in P) {
      const end = Math.min(g, P[p].pos.length - 1);
      for (let k = Math.max(0, end - 14); k < end; k += .5) {
        const a = pos(p, k), b = pos(p, Math.min(end, k + .5)); if (!a || !b) continue;
        const [x0, y0] = pj(...a), [x1, y1] = pj(...b);
        ctx.strokeStyle = rgba(hex2rgb(col(p)), .55 * show * (1 - (end - k) / 14)); ctx.lineWidth = 5 * u;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
    }
    // 击杀：闪圈，阵亡处留叉
    for (const k of K) {
      if (k.t > g) continue;
      const [x, y] = pj(k.x, k.z), age = t - vt(k.t);
      if (age < .8) {
        const r = (14 + 70 * eOutCubic(age / .8)) * u;
        ctx.strokeStyle = rgba(hex2rgb(k.team === '蓝' ? BLUE : RED), 1 - age / .8); ctx.lineWidth = 6 * u;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(230,236,245,.75)'; ctx.lineWidth = 4 * u; const d = 9 * u;
      ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke();
    }
    // 选手
    const anno = inv(4.3, 4.6, t) * (1 - inv(8.1, 8.4, t));
    for (const p in P) {
      if (dead(p)) continue;
      const q = pos(p, Math.min(g, P[p].pos.length - 1)); if (!q) continue;
      const [x, y] = pj(...q);
      ctx.globalAlpha = show * (1 - .55 * anno);
      ctx.fillStyle = col(p); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * u;
      ctx.beginPath(); ctx.arc(x, y, 13 * u, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.font = `700 ${18 * u}px 'JetBrains Mono'`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText(p, x, y - 22 * u);
      ctx.globalAlpha = 1;
    }
    // ---- 批注：第一次阵亡（B3，40 秒）----
    if (anno > 0) {
      ctx.fillStyle = `rgba(10,12,16,${.35 * anno})`; ctx.fillRect(RX, RY, s.RW, s.RH);
      const [bx, by] = pj(46, 30), [rx, ry] = pj(54, 30);
      const real = [[22, 30], [29, 30], [36, 30], [41, 30], [46, 30]].map(a => pj(...a));
      const sug = [[22, 30], [26, 33.5], [31, 35], [36, 36.5], [41, 36.2], [44, 35.4]].map(a => pj(...a));
      // 滑块：沿 z = 33 把场地分成两半，一边实际、一边建议；5.6–7.0 秒从画面边上划到分界处
      // 横屏 z 朝下（实际在上、建议在下，分界是横线）；竖屏 z 朝右（实际在左、建议在右，分界是竖线）
      const sl = eInOutCubic(inv(5.6, 7.0, t));
      const sp = pj(35, 33), dv = lerp(LAND ? RY + s.RH : RX + s.RW, LAND ? sp[1] : sp[0], sl);
      const sideA = () => LAND ? ctx.rect(RX, RY, s.RW, dv - RY) : ctx.rect(RX, RY, dv - RX, s.RH);
      const sideB = () => LAND ? ctx.rect(RX, dv, s.RW, RY + s.RH - dv) : ctx.rect(dv, RY, RX + s.RW - dv, s.RH);
      const tele = (pts, color, dash, p) => {
        ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 7 * u; ctx.setLineDash(dash ? [16 * u, 12 * u] : []);
        const tip = drawPartial(ctx, pts.map(([x, y]) => [x, y]), p); ctx.stroke(); ctx.restore();
        return tip;
      };
      // 左侧（实际）
      ctx.save(); ctx.beginPath(); sideA(); ctx.clip();
      ctx.globalAlpha = anno;
      tele(real, RED, false, eOutCubic(inv(4.4, 5.0, t)));
      const cp = eOutCubic(inv(4.6, 5.3, t));
      ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 6 * u;
      drawPartial(ctx, circlePts(bx, by, 46 * u, 48, -1.4, -1.4 + TAU * 1.08, .12, 3), cp); ctx.stroke();
      // 视线箭头：R2 → B3
      const ap = eOutCubic(inv(4.9, 5.4, t));
      if (ap > 0) {
        const ex = lerp(rx, bx + 50 * u, ap), ey = lerp(ry, by, ap);
        ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(ex, ey); ctx.stroke();
        const a = Math.atan2(ey - ry, ex - rx), h = 18 * u;
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - h * Math.cos(a - .5), ey - h * Math.sin(a - .5));
        ctx.moveTo(ex, ey); ctx.lineTo(ex - h * Math.cos(a + .5), ey - h * Math.sin(a + .5)); ctx.stroke();
      }
      tag(ctx, '落单走中路，被 R2 架点', LAND ? bx : bx - 130 * u, LAND ? by - 70 * u : by - 90 * u, '#ffd34d', '#1a1a1a', inv(5.0, 5.4, t), u);
      ctx.restore();
      // 右侧（建议）
      if (sl > 0) {
        ctx.save(); ctx.beginPath(); sideB(); ctx.clip();
        ctx.fillStyle = `rgba(10,12,16,${.25 * anno})`; ctx.fillRect(RX, RY, s.RW, s.RH);
        ctx.globalAlpha = anno;
        const tip = tele(sug, GREEN, true, eOutCubic(inv(6.4, 7.4, t)));
        const [gx, gy] = sug[sug.length - 1];
        if (t > 7.4) {
          ctx.fillStyle = BLUE; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * u;
          ctx.beginPath(); ctx.arc(gx, gy, 13 * u, 0, TAU); ctx.fill(); ctx.stroke();
          // 视线被木箱挡住
          const [cx2, cy2] = pj(47.5, 34);
          ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4 * u; ctx.setLineDash([8 * u, 8 * u]);
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(lerp(rx, cx2, eOutCubic(inv(7.4, 7.8, t))), lerp(ry, cy2, eOutCubic(inv(7.4, 7.8, t)))); ctx.stroke(); ctx.setLineDash([]);
        } else if (tip) { ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(tip[0], tip[1], 8 * u, 0, TAU); ctx.fill(); }
        tag(ctx, '贴着箱子推进 · 视线被挡住', LAND ? gx : gx + 150 * u, gy + 62 * u, GREEN, '#0d1a12', inv(7.5, 7.9, t), u);
        ctx.restore();
        // 分隔线和两边的标签
        ctx.globalAlpha = anno;
        ctx.fillStyle = '#fff';
        const [hx, hy] = LAND ? [RX + s.RW * .5, dv] : [dv, RY + s.RH * .5];
        if (LAND) ctx.fillRect(RX, dv - 2 * u, s.RW, 4 * u); else ctx.fillRect(dv - 2 * u, RY, 4 * u, s.RH);
        ctx.beginPath(); ctx.arc(hx, hy, 20 * u, 0, TAU); ctx.fill();
        ctx.fillStyle = '#14181d';                       // 手柄上两个相对的小三角
        ctx.save(); ctx.translate(hx, hy); if (LAND) ctx.rotate(Math.PI / 2);
        for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 13 * u, 0); ctx.lineTo(d * 4 * u, -7 * u); ctx.lineTo(d * 4 * u, 7 * u); ctx.fill(); }
        ctx.restore();
        if (LAND) { tag(ctx, '实际走位', RX + 110 * u, dv - 36 * u, RED, '#fff', 1, u); tag(ctx, '建议走位', RX + 110 * u, dv + 36 * u, GREEN, '#0d1a12', 1, u); }
        else { const ly = RY + 54 * u; tag(ctx, '实际走位', dv - 90 * u, ly, RED, '#fff', 1, u); tag(ctx, '建议走位', dv + 90 * u, ly, GREEN, '#0d1a12', 1, u); }
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
    // ---- 片头字 ----
    const ti = 1 - inv(1.2, 1.7, t);
    if (ti > 0) {
      ctx.globalAlpha = ti; ctx.fillStyle = 'rgba(10,12,16,.55)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.fillStyle = INK;
      ctx.font = `900 ${(LAND ? 92 : 104) * u}px 'Noto Sans SC'`; ctx.fillText('对局复盘', W / 2, H / 2);
      ctx.font = `400 ${(LAND ? 40 : 46) * u}px 'Bebas Neue'`; ctx.fillStyle = DIM; ctx.fillText('ROUND 3 · 3V3', W / 2, H / 2 + 60 * u);
      ctx.globalAlpha = 1;
    }
    // ---- 比分、时钟、时间线、数据面板 ----
    const ui = inv(1.2, 1.7, t);
    ctx.globalAlpha = ui;
    const kb = K.filter(k => k.t <= g && k.team === '蓝').length, kr = K.filter(k => k.t <= g && k.team === '红').length;
    const clock = `${Math.floor(g / 60)}:${String(Math.floor(g % 60)).padStart(2, '0')}`;
    const sbW = (LAND ? 520 : 640) * u, sbX = LAND ? s.RW / 2 : W / 2, sbY = LAND ? 34 * u : 40 * u;
    ctx.fillStyle = 'rgba(14,17,22,.86)'; rr(ctx, sbX - sbW / 2, sbY, sbW, 84 * u, 14 * u); ctx.fill();
    ctx.textAlign = 'center';
    ctx.font = `700 ${30 * u}px 'Noto Sans SC'`; ctx.fillStyle = BLUE; ctx.fillText('蓝队', sbX - sbW * .36, sbY + 54 * u);
    ctx.fillStyle = RED; ctx.fillText('红队', sbX + sbW * .36, sbY + 54 * u);
    ctx.font = `400 ${64 * u}px 'Bebas Neue'`; ctx.fillStyle = INK; ctx.fillText(`${kb}  :  ${kr}`, sbX, sbY + 64 * u);
    ctx.font = `700 ${20 * u}px 'JetBrains Mono'`; ctx.fillStyle = t >= 4.2 && t < 8.4 ? '#ffd34d' : DIM;
    ctx.fillText(t >= 4.2 && t < 8.4 ? '❚❚ ' + clock : clock, sbX, sbY + 112 * u);
    // 时间线
    const tlX = LAND ? 60 * u : 70 * u, tlW = (LAND ? s.RW : W) - 2 * tlX, tlY = LAND ? H - 70 * u : H * .78;
    ctx.fillStyle = 'rgba(14,17,22,.86)'; rr(ctx, tlX - 30 * u, tlY - 40 * u, tlW + 60 * u, 76 * u, 12 * u); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(tlX, tlY - 2 * u, tlW, 4 * u);
    ctx.fillStyle = INK; ctx.fillRect(tlX, tlY - 2 * u, tlW * g / 90, 4 * u);
    ctx.font = `700 ${16 * u}px 'JetBrains Mono'`; ctx.fillStyle = DIM; ctx.textAlign = 'left'; ctx.fillText('0:00', tlX, tlY + 28 * u);
    ctx.textAlign = 'right'; ctx.fillText('1:30', tlX + tlW, tlY + 28 * u);
    for (const k of K) {
      if (k.t > g) continue;
      const x = tlX + tlW * k.t / 90, pop = eOutBack(clamp((t - vt(k.t)) / .35));
      ctx.fillStyle = k.team === '蓝' ? BLUE : RED; ctx.beginPath(); ctx.arc(x, tlY, 11 * u * pop, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tlX + tlW * g / 90, tlY, 6 * u, 0, TAU); ctx.fill();
    // 数据面板：每人 击杀 / 阵亡，最近的击杀记录
    const pnX = LAND ? s.RW + 40 * u : 70 * u, pnY = LAND ? 60 * u : H * .835, pnW = LAND ? W - s.RW - 80 * u : W - 140 * u;
    ctx.textAlign = 'left'; ctx.font = `700 ${(LAND ? 26 : 30) * u}px 'Noto Sans SC'`; ctx.fillStyle = INK;
    if (LAND) ctx.fillText('选手数据', pnX, pnY + 10 * u);
    const ids = ['B1', 'B2', 'B3', 'R1', 'R2', 'R3'];
    const rh = (LAND ? 50 : 44) * u;
    ids.forEach((p, i) => {
      const kk = K.filter(k => k.player === p && k.t <= g).length, dd = K.filter(k => k.target === p && k.t <= g).length;
      const x = LAND ? pnX : pnX + (i % 3) * pnW / 3, y = LAND ? pnY + 50 * u + i * rh : pnY + Math.floor(i / 3) * rh;
      const just = K.some(k => (k.player === p || k.target === p) && k.t <= g && t - vt(k.t) < .5);
      if (just) { ctx.fillStyle = 'rgba(255,211,77,.18)'; ctx.fillRect(x - 10 * u, y - rh * .7, (LAND ? pnW : pnW / 3 - 16 * u) + 20 * u, rh * .9); }
      ctx.fillStyle = col(p); ctx.fillRect(x, y - 24 * u, 6 * u, 28 * u);
      ctx.font = `700 ${24 * u}px 'JetBrains Mono'`; ctx.fillStyle = dd ? DIM : INK; ctx.fillText(p, x + 18 * u, y);
      ctx.fillStyle = INK; ctx.textAlign = 'right';
      ctx.fillText(`${kk} / ${dd}`, x + (LAND ? pnW : pnW / 3 - 30 * u), y); ctx.textAlign = 'left';
    });
    if (LAND) {
      ctx.font = `400 ${18 * u}px 'Noto Sans SC'`; ctx.fillStyle = DIM; ctx.fillText('击杀 / 阵亡', pnX + pnW - 110 * u, pnY + 10 * u);
      let y = pnY + 50 * u + 6 * rh + 40 * u;
      ctx.font = `700 ${22 * u}px 'Noto Sans SC'`; ctx.fillStyle = INK; ctx.fillText('击杀记录', pnX, y); y += 44 * u;
      for (const k of K.filter(k => k.t <= g)) {
        const a = eOutCubic(clamp((t - vt(k.t)) / .3));
        ctx.globalAlpha = ui * a;
        ctx.font = `700 ${22 * u}px 'JetBrains Mono'`;
        ctx.fillStyle = DIM; ctx.fillText(`0:${String(k.t).padStart(2, '0')}`, pnX + (1 - a) * 30 * u, y);
        ctx.fillStyle = k.team === '蓝' ? BLUE : RED; ctx.fillText(k.player, pnX + 90 * u, y);
        ctx.fillStyle = DIM; ctx.fillText('→', pnX + 150 * u, y);
        ctx.fillStyle = k.team === '蓝' ? RED : BLUE; ctx.fillText(k.target, pnX + 190 * u, y);
        y += 38 * u;
      }
      ctx.globalAlpha = ui;
    }
    ctx.globalAlpha = 1;
    // ---- 落版 ----
    const fin = eOutCubic(inv(12.1, 12.7, t));
    if (fin > 0) {
      ctx.fillStyle = `rgba(10,12,16,${.6 * fin})`; ctx.fillRect(0, 0, W, H);
      const cy = H * (LAND ? .46 : .44);
      ctx.globalAlpha = fin; ctx.textAlign = 'center';
      ctx.font = `900 ${(LAND ? 84 : 96) * u}px 'Noto Sans SC'`; ctx.fillStyle = BLUE; ctx.fillText('蓝队胜', W / 2, cy + (1 - fin) * 30 * u);
      ctx.font = `400 ${(LAND ? 120 : 140) * u}px 'Bebas Neue'`; ctx.fillStyle = INK; ctx.fillText('3 : 2', W / 2, cy + 130 * u);
      ctx.font = `400 ${26 * u}px 'Noto Sans SC'`; ctx.fillStyle = DIM; ctx.fillText('回合结束 · 1:30', W / 2, cy + 190 * u);
      ctx.globalAlpha = 1;
    }
    ctx.font = `400 ${17 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 24 * u, H - 16 * u);
  }
});

// 圆角标签：文字居中在 (x, y)，a 是出现进度
function tag(ctx, text, x, y, bg, fg, a, u) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= eOutCubic(a);
  ctx.font = `700 ${24 * u}px 'Noto Sans SC'`;
  const w = ctx.measureText(text).width + 36 * u, h = 44 * u;
  ctx.fillStyle = bg; rr(ctx, x - w / 2, y - h / 2 + (1 - a) * 10 * u, w, h, 10 * u); ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + (1 - a) * 10 * u + 1 * u);
  ctx.restore();
}
