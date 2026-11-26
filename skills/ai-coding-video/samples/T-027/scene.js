// T-027 立体地图解说（map-explainer）：Three.js 3D 真实 AWS SRTM 巴拿马地峡高程网格 + 真实卫星贴图与深度着色海域 +
// 发光跨洋运河光带与船闸 3D 标柱 + 太空地球俯冲→低空跟踪→地形剖切露 0-26m 三级水阶 + 2D 中文地标投影与 Kokoro 旁白
scene({
  id: 'T-027',
  name: '立体地图解说',
  dur: 13.5,
  still: 7.8,
  libs: ['three'],
  fonts: [
    "900 44px 'Noto Sans SC'",
    "700 32px 'Noto Sans SC'",
    "700 28px 'JetBrains Mono'",
    "400 26px 'Bebas Neue'",
  ],
  text: '巴拿马运河全长公里跨洋水阶加通湖抬升米大西洋入口科隆加通船闸库莱布拉水道佩德罗米格尔闸米拉弗洛雷斯闸太平洋入口巴博亚高程海岸线卫星',

  async init() {
    const A = await loadAssets();
    const dem = JSON.parse(await loadText('panama_dem.json'));
    const route = JSON.parse(await loadText('canal_route.json'));
    const coast = JSON.parse(await loadText('coast_ca.json'));
    const satImg = await loadImage('panama_sat.jpg');

    const D = three3d({ w: W, h: H, fov: 38, near: 0.1, far: 180, exposure: 1.08 });
    const T = D.THREE;
    D.scene.background = new T.Color('#07131D');
    D.scene.fog = new T.FogExp2('#07131D', 0.012);

    // 暖低角度太阳（22° 高度角让山脊阴影拉长）+ 柔天空半球光
    const sun = new T.DirectionalLight('#FFD9A8', 2.45);
    sun.position.set(-10, 4.8, -6);
    D.scene.add(sun);
    D.scene.add(new T.HemisphereLight('#9ED0F0', '#181410', 0.72));

    // 1. 构建外太空 3D 地球与中美洲海岸线（开场 0-2.6s 俯冲用）
    const globeGrp = new T.Group();
    const globeTexCv = mk(1024, 512), gt = globeTexCv.getContext('2d');
    gt.fillStyle = '#091B29'; gt.fillRect(0, 0, 1024, 512);
    // 经纬线网格
    gt.strokeStyle = 'rgba(130,190,225,0.16)'; gt.lineWidth = 1;
    for (let x = 0; x <= 1024; x += 64) { gt.beginPath(); gt.moveTo(x, 0); gt.lineTo(x, 512); gt.stroke(); }
    for (let y = 0; y <= 512; y += 64) { gt.beginPath(); gt.moveTo(0, y); gt.lineTo(1024, y); gt.stroke(); }
    // 把真实中美洲海岸线画在地球贴图对应经纬度区
    gt.strokeStyle = '#7AC6D8'; gt.lineWidth = 2.4;
    for (const ln of coast.lines) {
      gt.beginPath();
      ln.forEach(([lo, la], i) => {
        const u = ((lo + 180) / 360) * 1024, v = ((90 - la) / 180) * 512;
        i ? gt.lineTo(u, v) : gt.moveTo(u, v);
      });
      gt.stroke();
    }
    const globeTex = new T.CanvasTexture(globeTexCv);
    globeTex.colorSpace = T.SRGBColorSpace;
    const globeMesh = new T.Mesh(
      new T.SphereGeometry(3.2, 48, 36),
      new T.MeshStandardMaterial({ map: globeTex, roughness: 0.78, metalness: 0.05 })
    );
    globeGrp.add(globeMesh);
    // 巴拿马亮点呼吸脉冲坐标标记
    const latR = (9.1 * Math.PI) / 180, lonR = (-79.75 * Math.PI) / 180;
    const pMarker = new T.Mesh(
      new T.SphereGeometry(0.06, 16, 16),
      new T.MeshBasicMaterial({ color: '#FFA63D' })
    );
    pMarker.position.set(-3.24 * Math.cos(latR) * Math.cos(lonR), 3.24 * Math.sin(latR), 3.24 * Math.cos(latR) * Math.sin(lonR));
    globeGrp.add(pMarker);
    D.scene.add(globeGrp);

    // 2. 构建真实 SRTM 128×128 巴拿马地峡 3D 地形网格（水平跨度 ~0.68° lon x 0.60° lat）
    const mapGrp = new T.Group();
    const MW = 11.4, MH = 10.0;
    const [LON0, LAT0, LON1, LAT1] = dem.bbox;
    const toWorld = (lon, lat, elevM = 0) => {
      const u = (lon - LON0) / (LON1 - LON0);
      const v = (lat - LAT0) / (LAT1 - LAT0);
      return [(u - 0.5) * MW, Math.max(0, elevM) * 0.0042 + 0.04, (0.5 - v) * MH];
    };

    const geo = new T.PlaneGeometry(MW, MH, dem.w - 1, dem.h - 1);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);

    // 离线采样卫星图色彩 + 高程深度着色（海面深蓝→浅滩青绿；陆地融合真实卫星色与暖太阳高差）
    const satCv = mk(dem.w, dem.h), scx = satCv.getContext('2d');
    scx.drawImage(satImg, 0, 0, dem.w, dem.h);
    const satData = scx.getImageData(0, 0, dem.w, dem.h).data;

    const eoxAligned = !!route.eox_aligned;
    // 对原始 SRTM 做两次轻微 3×3 平滑（保留山脊宏观落差、消除单像素毛刺），同时锁定海洋与加通湖水域平齐
    const elevSmooth = new Float32Array(dem.elev.length);
    for (let j = 0; j < dem.h; j++) {
      for (let i = 0; i < dem.w; i++) {
        let sum = 0, cnt = 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const ni = clamp(i + di, 0, dem.w - 1), nj = clamp(j + dj, 0, dem.h - 1);
          sum += dem.elev[nj * dem.w + ni]; cnt++;
        }
        elevSmooth[j * dem.w + i] = sum / cnt;
      }
    }
    for (let j = 0; j < dem.h; j++) {
      for (let i = 0; i < dem.w; i++) {
        const idx = j * dem.w + i;
        const hRaw = dem.elev[idx];
        const hM = elevSmooth[idx];
        const isSea = hRaw <= 1;
        // 地形高程 ×3.5 夸张突出山脊与加通湖盆地（平滑过渡、无锐刺）
        const y = isSea ? 0.0 : Math.max(0, hM) * 0.0021;
        pos.setY(idx, y);

        let r, g, b;
        if (isSea) {
          const dNorm = clamp(-hRaw / 120, 0, 1);
          r = lerp(31, 14, dNorm);
          g = lerp(90, 34, dNorm);
          b = lerp(92, 48, dNorm);
        } else if (eoxAligned) {
          const p4 = idx * 4;
          r = clamp(satData[p4] * 1.06 + 8, 0, 255);
          g = clamp(satData[p4 + 1] * 0.99 + 4, 0, 255);
          b = clamp(satData[p4 + 2] * 0.88, 0, 255);
        } else {
          // 加通湖盆地水域识别（高程 22-30m 且坡度平缓处染深湖蓝绿）与热带植被/山脊自然着色
          const isLake = hRaw >= 23 && hRaw <= 28 && Math.abs(hM - hRaw) < 4;
          if (isLake) { r = 28; g = 88; b = 96; }
          else {
            const hn = clamp(hM / 380, 0, 1);
            r = lerp(64, 168, hn);
            g = lerp(96, 138, hn);
            b = lerp(62, 98, hn);
          }
        }
        cols[idx * 3] = r / 255;
        cols[idx * 3 + 1] = g / 255;
        cols[idx * 3 + 2] = b / 255;
      }
    }
    geo.setAttribute('color', new T.BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    const terrainMesh = new T.Mesh(
      geo,
      new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0.04, side: T.DoubleSide })
    );
    mapGrp.add(terrainMesh);

    // 海洋半透明波光层
    const seaMesh = new T.Mesh(
      new T.PlaneGeometry(MW, MH),
      new T.MeshStandardMaterial({ color: '#144452', roughness: 0.35, metalness: 0.15, transparent: true, opacity: 0.55 })
    );
    seaMesh.rotation.x = -Math.PI / 2;
    seaMesh.position.y = -0.01;
    mapGrp.add(seaMesh);

    // 3. 发光跨洋运河轨迹（TubeGeometry + 暗色底框 Casing）与船闸 3D 数据标柱
    const routePts = route.waypoints.map(w => new T.Vector3(...toWorld(w.lon, w.lat, w.elev_m * 3.5 + 14)));
    const curve = new T.CatmullRomCurve3(routePts);
    const casingTube = new T.Mesh(
      new T.TubeGeometry(curve, 96, 0.085, 8, false),
      new T.MeshBasicMaterial({ color: '#14110E' })
    );
    mapGrp.add(casingTube);
    const glowTube = new T.Mesh(
      new T.TubeGeometry(curve, 96, 0.046, 8, false),
      new T.MeshBasicMaterial({ color: '#FFA63D' })
    );
    mapGrp.add(glowTube);

    // 沿航线移动的亮白船只/流光头部标记
    const headDot = new T.Mesh(
      new T.SphereGeometry(0.11, 16, 16),
      new T.MeshBasicMaterial({ color: '#FFF3D1' })
    );
    mapGrp.add(headDot);

    // 三级船闸水位 3D 数据柱（层叠圆片柱：Gatun 26m / Pedro Miguel 16.5m / Miraflores 8m）
    const pillars = [];
    const pillarSpecs = [
      { wp: route.waypoints[1], h: 1.55, col: '#FFA63D', label: '+26.0 m' },
      { wp: route.waypoints[2], h: 1.55, col: '#2FA3B0', label: '加通湖 26m' },
      { wp: route.waypoints[5], h: 0.72, col: '#FFA63D', label: '+8.0 m' },
    ];
    for (const sp of pillarSpecs) {
      const [wx, wy, wz] = toWorld(sp.wp.lon, sp.wp.lat, 12);
      const grp = new T.Group();
      grp.position.set(wx, wy, wz);
      const mesh = new T.Mesh(
        new T.CylinderGeometry(0.16, 0.19, 1.0, 20),
        new T.MeshStandardMaterial({ color: sp.col, emissive: sp.col, emissiveIntensity: 0.45, roughness: 0.35 })
      );
      mesh.position.y = 0.5;
      grp.add(mesh);
      mapGrp.add(grp);
      pillars.push({ grp, fullH: sp.h, pos: new T.Vector3(wx, wy + sp.h, wz), label: sp.label });
    }

    D.scene.add(mapGrp);

    return { A, D, T, globeGrp, mapGrp, curve, headDot, pillars, route, toWorld, satImg };
  },

  draw(ctx, t, s) {
    const u = SHORT / 1080;
    const { D, T, globeGrp, mapGrp, curve, headDot, pillars, route, toWorld } = s;

    // 4 段连续运镜（太空地球俯冲 → 低空沿运河推进 → 侧斜切面抬升水阶柱 → 高空收束）
    const diveP = smooth(0.0, 2.7, t);
    globeGrp.visible = t < 2.8;
    mapGrp.visible = t >= 1.7;

    if (t < 2.8) {
      // 让地球巴拿马坐标正对相机并俯冲逼近
      globeGrp.rotation.y = lerp(0.55, 0.19, diveP);
      globeGrp.rotation.x = lerp(-0.22, -0.15, diveP);
      const dist = lerp(9.2, 3.65, eInCubic(diveP));
      D.camera.position.set(0, lerp(0.8, 0.25, diveP), dist);
      D.camera.lookAt(0, 0, 0);
    }

    if (t >= 1.7) {
      const mt = t - 1.7;
      // 相机位置 & 焦点关键帧
      const camPos = keyAt([
        [0.0, [0, 12.5, 8.8]],
        [1.1, [-2.4, 5.8, 4.6]],
        [3.8, [1.2, 3.6, 4.1]],
        [6.1, [5.6, 2.5, 4.8]],   // 停在库莱布拉与太平洋侧看水阶立体剖面 (still=7.8s -> mt=6.1s!)
        [8.9, [4.8, 3.8, 5.8]],
        [11.8, [0.4, 8.2, 9.2]],
      ], mt);
      const camLook = keyAt([
        [0.0, [0, 0, 0]],
        [1.1, [-1.4, 0.2, -1.2]],
        [3.8, [0.2, 0.25, 0.2]],
        [6.1, [1.1, 0.45, 0.6]],
        [8.9, [0.6, 0.35, 0.3]],
        [11.8, [0, 0.1, 0]],
      ], mt);
      D.camera.position.set(...camPos);
      D.camera.lookAt(...camLook);
    }

    // 发光流光点沿 82 公里运河前行（2.6 - 8.2s）
    const travelP = clamp(inv(2.5, 8.5, t));
    const hp = curve.getPointAt(travelP);
    headDot.position.copy(hp);
    headDot.visible = t >= 2.2;

    // 3D 水阶标柱按节奏逐级拔地而起（6.4 - 9.8s）
    pillars.forEach((p, i) => {
      const grow = eOutCubic(inv(6.2 + i * 0.55, 6.9 + i * 0.55, t));
      p.grp.scale.set(1, Math.max(0.01, grow * p.fullH), 1);
      p.grp.visible = grow > 0.02;
    });

    D.render();

    // 画到主 2D 画布
    ctx.fillStyle = '#07131D'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(D.canvas, 0, 0, W, H);

    // 太空到地图的大气散射过渡光（1.7 - 2.8s）与 STS-62 真实轨道卫星底片小窗
    if (t < 2.6) {
      const cardA = inv(0.2, 0.55, t) * (1 - inv(2.1, 2.6, t));
      const iw = (LAND ? 280 : 240) * u, ih = iw * (s.satImg.height / s.satImg.width);
      const ix = W - iw - 44 * u, iy = LAND ? 44 * u : 175 * u;
      ctx.save(); ctx.globalAlpha = cardA;
      ctx.fillStyle = 'rgba(11,22,34,0.88)'; rr(ctx, ix - 8 * u, iy - 8 * u, iw + 16 * u, ih + 42 * u, 8 * u); ctx.fill();
      ctx.strokeStyle = 'rgba(255,166,61,0.5)'; ctx.lineWidth = 1.5 * u; ctx.stroke();
      drawCover(ctx, s.satImg, ix, iy, iw, ih, { zoom: 1.05 });
      ctx.fillStyle = '#FFA63D'; ctx.font = `700 ${16 * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('NASA STS-62 PANAMA', ix, iy + ih + 8 * u);
      ctx.restore();
    }
    if (t >= 1.7 && t < 2.8) {
      const a = Math.sin(inv(1.7, 2.8, t) * Math.PI) * 0.38;
      ctx.fillStyle = `rgba(180,225,255,${a})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 工具：世界坐标 → 屏幕 2D 坐标
    const proj = (v3) => {
      const v = v3.clone().project(D.camera);
      if (v.z > 1 || v.x < -0.92 || v.x > 0.92 || v.y < -0.88 || v.y > 0.88) return null;
      return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H];
    };

    // 2D 地图投影标注（地名、引线、数据标尺与水阶剖面卡）
    if (t >= 2.7) {
      const alpha = inv(2.7, 3.3, t);
      ctx.save(); ctx.globalAlpha = alpha;
      const shownIds = [0, 1, 2, 3, 6];
      shownIds.forEach(idx => {
        const wp = route.waypoints[idx];
        const pt = proj(new s.T.Vector3(...toWorld(wp.lon, wp.lat, wp.elev_m * 3.5 + 40)));
        if (!pt) return;
        const [sx, sy] = pt;
        if (sy < 160 * u || sy > H - 150 * u) return;
        const upY = clamp(sy - 42 * u, 155 * u, H - 165 * u);
        ctx.strokeStyle = '#F6EEE0'; ctx.lineWidth = 2 * u;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 18 * u, upY); ctx.lineTo(sx + 44 * u, upY); ctx.stroke();
        ctx.fillStyle = '#FFA63D'; ctx.beginPath(); ctx.arc(sx, sy, 6 * u, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(11,22,34,0.82)';
        const lbl = wp.name;
        ctx.font = `700 ${24 * u}px 'Noto Sans SC'`;
        const lw = ctx.measureText(lbl).width + 22 * u;
        rr(ctx, sx + 44 * u, upY - 19 * u, lw, 38 * u, 6 * u); ctx.fill();
        ctx.fillStyle = '#F6EEE0'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(lbl, sx + 55 * u, upY);
      });
      ctx.restore();
    }

    // 右上/右上侧工程剖面图卡（展示 0m → 26m → 0m 真实船闸水阶轮廓，6.2 - 11.4s）
    if (t >= 6.0 && t < 11.6) {
      const cardIn = eOutCubic(inv(6.0, 6.45, t)) * (1 - inv(11.1, 11.6, t));
      const cw = (LAND ? 480 : 540) * u, ch = 220 * u;
      const cx = W - cw - 42 * u, cy = LAND ? 42 * u : 168 * u;
      ctx.save();
      ctx.globalAlpha = cardIn;
      ctx.fillStyle = 'rgba(14,34,48,0.88)'; rr(ctx, cx, cy, cw, ch, 10 * u); ctx.fill();
      ctx.strokeStyle = 'rgba(255,166,61,0.55)'; ctx.lineWidth = 2 * u; ctx.stroke();
      ctx.fillStyle = '#FFA63D'; ctx.font = `900 ${24 * u}px 'Noto Sans SC'`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('跨洋水阶纵剖面 · +26 m', cx + 22 * u, cy + 18 * u);
      ctx.fillStyle = '#BCDBE6'; ctx.font = `700 ${17 * u}px 'JetBrains Mono'`;
      ctx.fillText('0m ATLANTIC → 26m GATUN → 0m PACIFIC', cx + 22 * u, cy + 50 * u);
      // 剖面阶梯水位线
      const gx0 = cx + 28 * u, gy0 = cy + ch - 34 * u, gw = cw - 56 * u, gh = 86 * u;
      const steps = [[0, 0], [0.14, 0], [0.22, 1], [0.68, 1], [0.76, 0.63], [0.85, 0.30], [0.92, 0], [1, 0]];
      const drawP = inv(6.3, 7.6, t);
      ctx.strokeStyle = '#2FA3B0'; ctx.lineWidth = 4 * u;
      ctx.beginPath();
      steps.forEach(([px, py], i) => {
        if (px > drawP && i > 0) return;
        const xx = gx0 + px * gw, yy = gy0 - py * gh;
        i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      });
      ctx.stroke();
      ctx.fillStyle = '#FFA63D'; ctx.font = `700 ${20 * u}px 'JetBrains Mono'`;
      ctx.fillText('26 m', gx0 + gw * 0.45, gy0 - gh - 22 * u);
      ctx.restore();
    }

    // 开场或左下固定图例标题 + Kokoro 旁白字幕
    ctx.save();
    ctx.fillStyle = '#F6EEE0'; ctx.font = `900 ${(LAND ? 40 : 42) * u}px 'Noto Sans SC'`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('巴拿马运河 · 82 公里跨洋水阶', 44 * u, (LAND ? 40 : 64) * u);
    ctx.fillStyle = '#BCDBE6'; ctx.font = `700 ${20 * u}px 'JetBrains Mono'`;
    ctx.fillText('RELIEF ×4.5 · AWS SRTM DEM · NATURAL EARTH', 44 * u, (LAND ? 92 : 118) * u);
    ctx.restore();

    const c = cueAt(s.A, t);
    if (c) {
      caption(ctx, c.text, {
        size: LAND ? 34 : 38,
        y: H - (LAND ? 44 : 110) * u,
        bg: 'rgba(11,22,34,0.84)',
      });
    }
  },
});
