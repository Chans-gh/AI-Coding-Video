// C-106 孟菲斯微缩景：Three.js 用代码摆出一座俯视的桌面小镇（街区、房子、树、运河、桥、车、鸟群），平涂的 Lambert 材质配糖果原色和粉彩，每个物件再描一圈深靛蓝边线；阴影单独渲染一遍：只留接收阴影的地面（硬边阴影图），把这张遮罩在 Canvas 2D 上填成紫色半调圆点；画面装在暖白纸面上一个颗粒边缘的圆角画框里，画框从中心张开，镜头缓慢环绕一镜到底，水波、车流、鸟群、窗灯一直在动。
// 风格提示词：用孟菲斯微缩景风格：暖白纸面上一个带颗粒边缘的圆角画框从中心张开，框里是一座俯视的桌面模型小镇，糖果原色加粉彩平涂、深靛蓝描边，硬边紫色投影里铺满半调圆点，水波、鸟群、灯火这些小动静处处在动，镜头缓慢环绕一镜到底，配钢琴与马林巴。
// 题材：3D 与实时图形 · 适合：城市介绍、季节变化、地方风物
scene({
  id: 'C-106', name: '孟菲斯微缩景', dur: 5, still: 3.6, libs: ['three'],
  fonts: ["80px 'Bebas Neue'", "700 40px 'Noto Sans SC'"],
  init() {
    const D = three3d({ shadows: true, alpha: true, tone: null });
    const T = D.THREE, sc = D.scene;
    D.renderer.shadowMap.type = T.BasicShadowMap; D.renderer.setClearColor(0, 0);
    const half = LAND ? 7.2 : 11.5, asp = W / H;
    const cam = new T.OrthographicCamera(-half * asp, half * asp, half, -half, -100, 200);
    const sun = new T.DirectionalLight('#ffffff', 1.3); sun.position.set(-6, 12, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, far: 60 }); sun.shadow.bias = -.002;
    sc.add(sun, new T.AmbientLight('#ffffff', 1.9));
    const INK = '#2B2A6B', R = mulberry32(106);
    const PAL = ['#FF5A5F', '#FFC93C', '#3D7DFF', '#FFB5C8', '#A8E6CF', '#C3B1FF', '#FFE1A8', '#7FD3F7'];
    const hide = new T.MeshBasicMaterial({ colorWrite: false }), lineM = new T.LineBasicMaterial({ color: INK });
    const meshes = [], lines = [];
    const add = (geo, col, x, y, z, par = sc) => {
      const m = new T.Mesh(geo, new T.MeshLambertMaterial({ color: col, flatShading: true })); m.position.set(x, y, z); m.castShadow = true;
      const l = new T.LineSegments(new T.EdgesGeometry(geo, 30), lineM); m.add(l); par.add(m); meshes.push(m); lines.push(l); return m;
    };
    // 桌面与道路
    const ground = new T.Mesh(new T.PlaneGeometry(40, 40), new T.MeshLambertMaterial({ color: '#BDEBD3' })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; sc.add(ground);
    const gMat = ground.material, shM = new T.ShadowMaterial({ color: 0x000000, opacity: 1 });
    const cell = 2.4, n = 3;
    const road = new T.MeshLambertMaterial({ color: '#FFF6E8' });
    for (let k = -n; k <= n + 1; k++) {
      const c = (k - .5) * cell;
      for (const vert of [0, 1]) { const r = new T.Mesh(new T.PlaneGeometry(vert ? .55 : 18, vert ? 18 : .55), road); r.rotation.x = -Math.PI / 2; r.position.set(vert ? c : 0, .01, vert ? 0 : c); r.receiveShadow = true; sc.add(r); meshes.push(r); r.userData.flat = 1; }
    }
    // 运河（第 2 列）
    const wc = mk(256, 256), wg = wc.getContext('2d'); wg.fillStyle = '#5FB8F5'; wg.fillRect(0, 0, 256, 256);
    wg.strokeStyle = '#FFFFFF'; wg.lineWidth = 7; wg.lineCap = 'round';
    for (let y = 20; y < 256; y += 64) for (let x0 = 0; x0 < 256; x0 += 128) { wg.beginPath(); for (let x = 0; x <= 60; x += 4) wg.lineTo(x0 + 20 + x, y + (x0 ? 32 : 0) + 6 * Math.sin(x / 60 * TAU)); wg.stroke(); }
    const wtex = new T.CanvasTexture(wc); wtex.wrapS = wtex.wrapT = T.RepeatWrapping; wtex.repeat.set(1, 6);
    const water = new T.Mesh(new T.PlaneGeometry(cell * .9, 18), new T.MeshBasicMaterial({ map: wtex })); water.rotation.x = -Math.PI / 2; water.position.set(2 * cell, .02, 0); sc.add(water); meshes.push(water); water.userData.flat = 1;
    add(new T.BoxGeometry(cell * 1.1, .18, .6), '#FF5A5F', 2 * cell, .2, 0);
    // 街区
    const wins = [];
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      if (i === 2) continue;
      const cx = i * cell, cz = j * cell;
      if (i === -1 && j === 1 || i === 1 && j === -2) { // 公园
        const pond = new T.Mesh(new T.CircleGeometry(.6, 24), new T.MeshBasicMaterial({ color: '#7FD3F7' })); pond.rotation.x = -Math.PI / 2; pond.position.set(cx + .4, .03, cz + .3); sc.add(pond); meshes.push(pond); pond.userData.flat = 1;
        for (let k = 0; k < 4; k++) { const x = cx - .6 + (k % 2) * .5, z = cz - .6 + (k >> 1) * 1.1; add(new T.CylinderGeometry(.06, .08, .4, 6), '#C47A4A', x, .2, z); add(new T.SphereGeometry(.32, 10, 8), PAL[[4, 1, 3, 4][k]], x, .62, z); }
        continue;
      }
      const cnt = 1 + Math.floor(R() * 3);
      for (let k = 0; k < cnt; k++) {
        const w = cnt === 1 ? 1.4 + R() * .3 : .75 + R() * .25, d = cnt === 1 ? 1.3 : .8 + R() * .3, h = .5 + R() * (Math.abs(i) + Math.abs(j) < 3 ? 2.6 : 1.2);
        const ox = cnt === 1 ? 0 : (k % 2 ? .45 : -.45), oz = cnt === 1 ? 0 : (k > 1 ? .45 : -.45) + (cnt === 2 ? 0 : 0);
        const col = PAL[Math.floor(R() * PAL.length)], x = cx + ox, z = cz + oz;
        const ty = R();
        if (ty < .15) add(new T.CylinderGeometry(w * .45, w * .45, h, 16), col, x, h / 2, z);
        else add(new T.BoxGeometry(w, h, d), col, x, h / 2, z);
        const rf = R();
        if (rf < .3) { const r = add(new T.ConeGeometry(w * .72, .55, 4), PAL[Math.floor(R() * PAL.length)], x, h + .27, z); r.rotation.y = Math.PI / 4; }
        else if (rf < .45) add(new T.SphereGeometry(w * .4, 14, 8, 0, TAU, 0, Math.PI / 2), PAL[Math.floor(R() * PAL.length)], x, h, z);
        // 窗灯
        for (let q = 0; q < Math.floor(h / .5); q++) { const wm = new T.Mesh(new T.BoxGeometry(.16, .16, .02), new T.MeshBasicMaterial({ color: '#FFF6C0' })); wm.position.set(x - w * .2 + (q % 2) * w * .4, .35 + Math.floor(q / 2) * .45 + (q % 2) * .1, z + d / 2 + .011); if (wm.position.y < h - .1 && ty >= .15) { sc.add(wm); meshes.push(wm); wins.push({ m: wm, s: R() * 100 }); } }
      }
    }
    // 车
    const cars = [];
    for (let k = 0; k < 10; k++) {
      const g = new T.Group(); sc.add(g);
      add(new T.BoxGeometry(.42, .18, .24), PAL[[0, 2, 1, 3, 5][k % 5]], 0, .14, 0, g); add(new T.BoxGeometry(.22, .12, .2), '#FFFFFF', -.02, .29, 0, g);
      cars.push({ g, lane: Math.floor(R() * 6) - 3 + .5, horiz: k % 2, sp: (R() < .5 ? -1 : 1) * (1 + R() * .8), off: R() * 18 });
    }
    // 鸟群
    const birds = [];
    for (let k = 0; k < 7; k++) { const b = new T.Group(); for (const sd of [-1, 1]) { const wgm = new T.Mesh(new T.BoxGeometry(.32, .02, .1), new T.MeshBasicMaterial({ color: INK })); wgm.position.x = sd * .15; b.add(wgm); meshes.push(wgm); } sc.add(b); birds.push({ b, k }); }
    // 纸面：暖白 + 颗粒 + 孟菲斯小图形
    const paper = mk(W, H), pg = paper.getContext('2d'); pg.fillStyle = '#FBF5EA'; pg.fillRect(0, 0, W, H);
    const id = pg.getImageData(0, 0, W, H), px = id.data;
    for (let i = 0; i < px.length; i += 4) { const v = (hash1(i * .37) - .5) * 14; px[i] += v; px[i + 1] += v; px[i + 2] += v; }
    pg.putImageData(id, 0, 0);
    const u = SHORT / 1080;
    const shapes = [];
    for (let k = 0; k < 18; k++) shapes.push({ x: R(), y: R(), t: k % 4, c: PAL[k % PAL.length], r: R() * TAU, s: (14 + R() * 18) * u });
    // 半调阴影图案
    const hcv = mk(W, H), hg = hcv.getContext('2d'); hg.fillStyle = 'rgba(122,79,208,.55)'; hg.fillRect(0, 0, W, H); hg.fillStyle = '#5B34B5';
    const sp = 9 * u; for (let y = 0, row = 0; y < H + sp; y += sp, row++) for (let x = (row % 2) * sp / 2; x < W + sp; x += sp) { hg.beginPath(); hg.arc(x, y, 2.4 * u, 0, TAU); hg.fill(); }
    return { D, T, cam, sun, ground, gMat, shM, hide, meshes, lines, wtex, cars, birds, wins, paper, shapes, hcv, sh: mk(W, H), fb: mk(W, H), cell };
  },
  draw(ctx, t, s) {
    const { D, T, cam } = s, u = SHORT / 1080;
    // 镜头环绕
    const a = .55 + t * .13;
    cam.position.set(Math.sin(a) * 20, 17, Math.cos(a) * 20); cam.lookAt(0, 0, 0);
    s.wtex.offset.y = -t * .35;
    for (const c of s.cars) { const L = 18, p = ((t * c.sp * 1.6 + c.off) % L + L) % L - L / 2, lane = c.lane * s.cell - (c.sp > 0 ? .12 : -.12); if (c.horiz) { c.g.position.set(p, 0, lane); c.g.rotation.y = c.sp > 0 ? 0 : Math.PI; } else { c.g.position.set(lane, 0, p); c.g.rotation.y = c.sp > 0 ? -Math.PI / 2 : Math.PI / 2; } }
    for (const B of s.birds) { const ang = t * .7 + B.k * .16, r = 6 + (B.k % 3) * .4; B.b.position.set(Math.cos(ang) * r, 4.2 + .2 * Math.sin(B.k), Math.sin(ang) * r - B.k * .1); B.b.rotation.y = -ang; const f = Math.sin(t * 14 + B.k) * .5; B.b.children[0].rotation.z = f; B.b.children[1].rotation.z = -f; }
    for (const w of s.wins) w.m.material.color.set(hash1(Math.floor(t * 2 + w.s) + w.s) > .35 ? '#FFF6C0' : '#3B3A7A');
    // 主画面
    s.ground.material = s.gMat; for (const l of s.lines) l.visible = true;
    D.renderer.render(D.scene, cam);
    const fb = s.fb.getContext('2d'); fb.clearRect(0, 0, W, H); fb.fillStyle = '#BDEBD3'; fb.fillRect(0, 0, W, H); fb.drawImage(D.canvas, 0, 0, W, H);
    // 阴影遮罩
    const saved = s.meshes.map(m => m.material);
    for (const m of s.meshes) m.material = s.hide; for (const l of s.lines) l.visible = false;
    s.ground.material = s.shM;
    D.renderer.render(D.scene, cam);
    s.meshes.forEach((m, i) => m.material = saved[i]);
    const sh = s.sh.getContext('2d'); sh.clearRect(0, 0, W, H); sh.drawImage(s.hcv, 0, 0); sh.globalCompositeOperation = 'destination-in'; sh.drawImage(D.canvas, 0, 0, W, H); sh.globalCompositeOperation = 'source-over';
    fb.drawImage(s.sh, 0, 0);
    // 纸面 + 小图形
    ctx.drawImage(s.paper, 0, 0);
    for (const S of s.shapes) {
      const x = S.x * W, y = S.y * H, k = eOutCubic(clamp((t - .3 - S.x * .3) / .5, 0, 1)), r = S.r + t * .4;
      if (k <= 0) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(k, k); ctx.fillStyle = S.c; ctx.strokeStyle = '#2B2A6B'; ctx.lineWidth = 3 * u;
      if (S.t === 0) { ctx.beginPath(); ctx.arc(0, 0, S.s * .6, 0, TAU); ctx.fill(); ctx.stroke(); }
      else if (S.t === 1) { ctx.beginPath(); ctx.moveTo(0, -S.s); ctx.lineTo(S.s * .9, S.s * .6); ctx.lineTo(-S.s * .9, S.s * .6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else if (S.t === 2) { ctx.beginPath(); for (let i = 0; i <= 24; i++) ctx.lineTo(-S.s * 1.4 + i * S.s * 2.8 / 24, Math.sin(i / 24 * TAU * 1.5) * S.s * .35); ctx.strokeStyle = S.c; ctx.lineWidth = 6 * u; ctx.lineCap = 'round'; ctx.stroke(); }
      else { ctx.lineWidth = 5 * u; ctx.strokeStyle = S.c; ctx.beginPath(); ctx.moveTo(-S.s * .7, 0); ctx.lineTo(S.s * .7, 0); ctx.moveTo(0, -S.s * .7); ctx.lineTo(0, S.s * .7); ctx.stroke(); }
      ctx.restore();
    }
    // 画框从中心张开
    const k = eOutCubic(clamp((t - .05) / .9, 0, 1));
    const fw = (LAND ? W * .80 : W * .86) * lerp(.08, 1, k), fh = (LAND ? H * .78 : H * .70) * lerp(.08, 1, k), fx = (W - fw) / 2, fy = (H - fh) / 2 - (LAND ? 0 : H * .03), rr0 = Math.min(fw, fh) * .09;
    ctx.save(); ctx.fillStyle = 'rgba(122,79,208,.85)'; rr(ctx, fx + 14 * u, fy + 14 * u, fw, fh, rr0); ctx.fill(); ctx.restore();
    ctx.save(); rr(ctx, fx, fy, fw, fh, rr0); ctx.clip(); ctx.drawImage(s.fb, 0, 0); ctx.restore();
    // 颗粒边缘
    ctx.save(); ctx.fillStyle = '#2B2A6B';
    const per = 2 * (fw + fh), N = Math.floor(per / (3 * u));
    for (let i = 0; i < N; i++) {
      let d = i / N * per, x, y;
      if (d < fw) { x = fx + d; y = fy; } else if ((d -= fw) < fh) { x = fx + fw; y = fy + d; } else if ((d -= fh) < fw) { x = fx + fw - d; y = fy + fh; } else { d -= fw; x = fx; y = fy + fh - d; }
      // 圆角处收到圆弧上
      const cx = clamp(x, fx + rr0, fx + fw - rr0), cy = clamp(y, fy + rr0, fy + fh - rr0);
      if (cx !== x && cy !== y) { const an = Math.atan2(y - cy, x - cx); x = cx + Math.cos(an) * rr0; y = cy + Math.sin(an) * rr0; }
      const j = (hash1(i * 7.13) - .5) * 4 * u, r = (1.6 + hash1(i * 3.7) * 1.8) * u;
      ctx.beginPath(); ctx.arc(x + j, y + (hash1(i * 1.9) - .5) * 4 * u, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // 标题
    const ta = smooth(.8, 1.3, t);
    ctx.fillStyle = `rgba(43,42,107,${ta})`; ctx.font = `${Math.round(54 * u)}px 'Bebas Neue'`; ctx.textBaseline = 'alphabetic';
    const ty = LAND ? fy + fh + 64 * u : fy + fh + 90 * u;
    ctx.fillText('LITTLE TOWN · 小镇一日', fx, ty);
  }
});
