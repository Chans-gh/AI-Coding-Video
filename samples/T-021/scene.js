// T-021 环绕实景重建：Blender CC0 雕塑环绕镜头 + 相机反求位姿 AR 叠加 + Brush 3D 高斯点云重建 + 自由运镜

scene({
  id: 'T-021',
  name: '环绕实景重建',
  dur: 12,
  still: 5.5,
  libs: ['three'],
  fonts: ['Noto Sans SC', 'JetBrains Mono'],

  async init() {
    const [A, cam, vid, v1, v2, v3, splatBuf] = await Promise.all([
      loadAssets(),
      loadText('cameras.json').then(JSON.parse),
      loadVideo('orbit.mp4'),
      loadImage('view_01.jpg'),
      loadImage('view_02.jpg'),
      loadImage('view_03.jpg'),
      xhr(asset('splats.bin'), 'arraybuffer'),
    ]);

    // Parse compact binary 3D Gaussian Splat buffer
    const dv = new DataView(splatBuf);
    const count = dv.getUint32(0, true);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);

    let off = 4;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = dv.getFloat32(off, true);
      positions[i * 3 + 1] = dv.getFloat32(off + 4, true);
      positions[i * 3 + 2] = dv.getFloat32(off + 8, true);
      sizes[i] = dv.getFloat32(off + 12, true);
      colors[i * 3] = dv.getUint8(off + 16) / 255;
      colors[i * 3 + 1] = dv.getUint8(off + 17) / 255;
      colors[i * 3 + 2] = dv.getUint8(off + 18) / 255;
      alphas[i] = dv.getUint8(off + 19) / 255;
      off += 20;
    }

    // Three.js renderer (Z-up to match Blender & Brush coordinates directly)
    const D = three3d({ w: W, h: H, fov: cam.fov_y_deg, near: 0.05, far: 100, alpha: false, tone: 'none' });
    const { THREE, scene: sc, camera } = D;
    camera.up.set(0, 0, 1);

    // Twilight museum-courtyard background matching Blender world
    sc.background = new THREE.Color('#0c121c');

    // Gaussian Splat point-cloud shader (soft radial Gaussian falloff, size attenuated by distance)
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      depthTest: true,
      uniforms: {
        uScale: { value: H * 0.5 / Math.tan((cam.fov_y_deg * Math.PI / 180) * 0.5) },
        uReveal: { value: 1.0 },
      },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aAlpha;
        uniform float uScale;
        uniform float uReveal;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha * uReveal;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float dist = max(0.25, -mv.z);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(aSize * uScale / dist * 2.85, 2.5, 48.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 d = gl_PointCoord - vec2(0.5);
          float r2 = dot(d, d) * 4.0;
          if (r2 > 1.0) discard;
          float g = exp(-1.9 * r2);
          float a = g * vAlpha;
          if (a < 0.16) discard;
          gl_FragColor = vec4(vColor, a);
        }
      `,
    });
    const splats = new THREE.Points(geo, mat);
    sc.add(splats);

    // 3D solved camera frustums ring (36 training cameras)
    const frustumGroup = new THREE.Group();
    const tgt = new THREE.Vector3(...cam.target);
    const fLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
    const fDotGeo = new THREE.SphereGeometry(0.022, 8, 8);
    const fDotMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    const frustumPts = [];
    for (const tc of cam.train_cameras) {
      const p = new THREE.Vector3(...tc.pos);
      const fwd = tgt.clone().sub(p).normalize();
      const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 0, 1)).normalize();
      const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
      const d = 0.14, hw = 0.09, hh = 0.052;
      const c = p.clone().addScaledVector(fwd, d);
      const c0 = c.clone().addScaledVector(right, -hw).addScaledVector(up, hh);
      const c1 = c.clone().addScaledVector(right, hw).addScaledVector(up, hh);
      const c2 = c.clone().addScaledVector(right, hw).addScaledVector(up, -hh);
      const c3 = c.clone().addScaledVector(right, -hw).addScaledVector(up, -hh);
      const segs = [[p, c0], [p, c1], [p, c2], [p, c3], [c0, c1], [c1, c2], [c2, c3], [c3, c0]];
      for (const [a, b] of segs) frustumPts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const dot = new THREE.Mesh(fDotGeo, fDotMat);
      dot.position.copy(p);
      frustumGroup.add(dot);
    }
    const fGeo = new THREE.BufferGeometry();
    fGeo.setAttribute('position', new THREE.Float32BufferAttribute(frustumPts, 3));
    frustumGroup.add(new THREE.LineSegments(fGeo, fLineMat));
    sc.add(frustumGroup);

    // 3D AR ground calibration rings & vertical measurement axis inside Three.js
    const arGroup = new THREE.Group();
    const ringMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55 });
    for (const r of [0.55, 1.05, 1.65]) {
      const pts = [];
      for (let k = 0; k <= 72; k++) {
        const a = (k / 72) * TAU;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.012));
      }
      arGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat));
    }
    // Pedestal highlight ring
    const pedPts = [];
    for (let k = 0; k <= 64; k++) {
      const a = (k / 64) * TAU;
      pedPts.push(new THREE.Vector3(Math.cos(a) * 0.455, Math.sin(a) * 0.455, 0.422));
    }
    arGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pedPts),
      new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 })
    ));
    sc.add(arGroup);

    // 3D AR bounding box for free-camera phase
    const boxGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.92, 0.92, 1.38));
    const boxLine = new THREE.LineSegments(
      boxGeo,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.0 })
    );
    boxLine.position.set(0, 0, 0.69);
    sc.add(boxLine);

    return {
      A, cam, vid, thumbs: [v1, v2, v3], count,
      D, THREE, camera, tgt, frustumGroup, fLineMat, arGroup, boxLine, splatMat: mat,
    };
  },

  async draw(ctx, t, s) {
    const { A, cam, vid, thumbs, count, D, THREE, camera, tgt, frustumGroup, fLineMat, boxLine } = s;
    const sc = SHORT / 1080;

    // Determine orbit video time & camera pose
    const orbitEnd = 7.6;
    const vidT = Math.min(vid.dur - 0.04, t * 0.88);
    const fIdx = clamp(vidT * cam.fps, 0, cam.orbit_positions.length - 1);
    const i0 = Math.floor(fIdx), i1 = Math.min(cam.orbit_positions.length - 1, i0 + 1);
    const frac = fIdx - i0;
    const p0 = cam.orbit_positions[i0], p1 = cam.orbit_positions[i1];
    const orbitPos = new THREE.Vector3(
      lerp(p0[0], p1[0], frac),
      lerp(p0[1], p1[1], frac),
      lerp(p0[2], p1[2], frac),
    );

    // Act 3 (t >= 7.6): break free from original orbit into dramatic high-angle crane flyover
    const freeP = eInOutCubic(inv(orbitEnd, 11.8, t));
    let camPos = orbitPos.clone();
    if (freeP > 0) {
      const baseAz = Math.atan2(orbitPos.y, orbitPos.x);
      const baseR = Math.hypot(orbitPos.x, orbitPos.y);
      const baseElev = Math.atan2(orbitPos.z - tgt.z, baseR);
      const az = baseAz + freeP * 1.85;
      const elev = lerp(baseElev, 0.82, eOutCubic(freeP));
      const rad = lerp(2.35, 3.45, eInOutCubic(freeP));
      camPos.set(
        rad * Math.cos(elev) * Math.cos(az),
        rad * Math.cos(elev) * Math.sin(az),
        tgt.z + rad * Math.sin(elev),
      );
    }

    camera.position.copy(camPos);
    camera.lookAt(tgt);
    camera.updateMatrixWorld();

    // Control frustum ring & AR bounding box visibility
    const frustumVis = smooth(3.6, 4.6, t) * 0.72 + freeP * 0.28;
    frustumGroup.visible = frustumVis > 0.01;
    fLineMat.opacity = clamp(frustumVis, 0, 0.85);
    boxLine.material.opacity = smooth(7.6, 8.6, t) * 0.55;

    // Render Three.js 3DGS + frustums + AR geometry
    D.render();

    // Compute wipe position between footage (left) and 3DGS (right)
    // t < 3.8: pure footage; 3.8..7.2: wipe sweeps right->left (so 3DGS enters from right)
    // At still=5.5, wipeX is right around 0.50*W!
    const wipeP = eInOutCubic(inv(3.8, 7.2, t));
    const splitX = W * (1.0 - wipeP);

    ctx.fillStyle = '#0c121c';
    ctx.fillRect(0, 0, W, H);

    // Draw original Blender orbit footage on left side of split (while splitX > 0)
    if (splitX > 1) {
      await vid.at(vidT);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, H);
      ctx.clip();
      drawCover(ctx, vid.el, 0, 0, W, H);
      ctx.restore();
    }

    // Draw live Three.js 3DGS scene on right side of split (or full screen after wipe)
    if (splitX < W - 1) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, W - splitX, H);
      ctx.clip();
      ctx.drawImage(D.canvas, 0, 0, W, H);
      ctx.restore();
    }

    // Helper: project 3D Blender/Three.js world point to 2D canvas pixel
    const proj = (arr) => {
      const v = new THREE.Vector3(arr[0], arr[1], arr[2]).project(camera);
      return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, z: v.z };
    };

    // Draw 3D-projected AR ground calibration rings & reticle on the footage side too
    if (splitX > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, H);
      ctx.clip();
      const ringAlpha = smooth(0.3, 1.1, t) * 0.65;
      for (const [r, col, lw] of [[0.55, 'rgba(34,211,238,', 1.8], [1.05, 'rgba(34,211,238,', 1.2], [0.455, 'rgba(245,158,11,', 2.2]]) {
        const zVal = r === 0.455 ? 0.422 : 0.012;
        ctx.beginPath();
        for (let k = 0; k <= 64; k++) {
          const a = (k / 64) * TAU;
          const pt = proj([Math.cos(a) * r, Math.sin(a) * r, zVal]);
          if (k === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = `${col}${ringAlpha})`;
        ctx.lineWidth = lw * sc;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Glowing vertical scanline divider during Act 2 wipe
    if (wipeP > 0.005 && wipeP < 0.995) {
      const g = ctx.createLinearGradient(splitX - 36 * sc, 0, splitX + 36 * sc, 0);
      g.addColorStop(0, 'rgba(34,211,238,0)');
      g.addColorStop(0.5, 'rgba(34,211,238,0.45)');
      g.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = g;
      ctx.fillRect(splitX - 36 * sc, 0, 72 * sc, H);

      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2.5 * sc;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, H);
      ctx.stroke();

      // Side labels flanking scanline
      const lblY = LAND ? H * 0.14 : H * 0.15;
      ctx.font = `600 ${20 * sc}px "Noto Sans SC", sans-serif`;
      if (splitX > 180 * sc) {
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(226,232,240,0.92)';
        ctx.fillText('环绕实景 + AR 位姿', splitX - 18 * sc, lblY);
      }
      if (W - splitX > 180 * sc) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#67e8f9';
        ctx.fillText('3D 高斯点云重建', splitX + 18 * sc, lblY);
      }
    }

    // 3D-locked AR callout pins (visible Acts 1-2, fade cleanly before final title)
    const arFade = smooth(0.5, 1.2, t) * (1 - smooth(9.8, 10.6, t));
    if (arFade > 0.01) {
      const offsets = LAND
        ? [[110, -70], [135, -18], [-155, 22], [110, 48]]
        : [[85, -80], [95, -20], [-95, 40], [75, 55]];
      cam.anchors.forEach((anc, idx) => {
        const appear = smooth(0.6 + idx * 0.35, 1.05 + idx * 0.35, t) * arFade;
        if (appear <= 0.01) return;
        const p = proj(anc.pos);
        if (p.z > 1) return;
        const [ox, oy] = offsets[idx];
        const lx = clamp(p.x + ox * sc, 90 * sc, W - 210 * sc);
        const ly = clamp(p.y + oy * sc, 110 * sc, H - 180 * sc);

        ctx.save();
        ctx.globalAlpha = appear;
        // Anchor pulse ring
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2 * sc;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7 * sc, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.2 * sc, 0, TAU);
        ctx.fill();

        // Leader line
        ctx.strokeStyle = 'rgba(103,232,249,0.85)';
        ctx.lineWidth = 1.6 * sc;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(lx, ly);
        ctx.lineTo(lx + (ox >= 0 ? 150 : -150) * sc, ly);
        ctx.stroke();

        // Callout plate
        const boxW = 156 * sc, boxH = 44 * sc;
        const bx = ox >= 0 ? lx : lx - boxW;
        const by = ly - boxH - 4 * sc;
        ctx.fillStyle = 'rgba(10,16,28,0.78)';
        rr(ctx, bx, by, boxW, boxH, 6 * sc);
        ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,0.55)';
        ctx.lineWidth = 1 * sc;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#f8fafc';
        ctx.font = `600 ${15 * sc}px "Noto Sans SC", sans-serif`;
        ctx.fillText(anc.label, bx + 10 * sc, by + 19 * sc);
        ctx.fillStyle = '#67e8f9';
        ctx.font = `500 ${12 * sc}px "JetBrains Mono", monospace`;
        ctx.fillText(anc.sub, bx + 10 * sc, by + 36 * sc);
        ctx.restore();
      });
    }

    // Subtle cinematic vignette
    vignette(ctx, 0.38, 0.42, '6,10,18');

    // Top-left HUD telemetry badge
    const pad = (LAND ? 42 : 34) * sc;
    const modeLabel = t < 3.8
      ? 'STAGE 1 · 环绕实景与相机反求'
      : t < 7.6
        ? `STAGE 2 · 3D 高斯点云重建 (${(count / 1000).toFixed(1)}K SPLATS)`
        : 'STAGE 3 · 脱离原轨 · 自由运镜';

    ctx.save();
    ctx.fillStyle = 'rgba(10,16,28,0.76)';
    const hudW = (LAND ? 470 : 440) * sc, hudH = 74 * sc;
    rr(ctx, pad, pad, hudW, hudH, 10 * sc);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56,189,248,0.4)';
    ctx.lineWidth = 1.2 * sc;
    ctx.stroke();

    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(pad + 18 * sc, pad + 24 * sc, 5 * sc, 0, TAU);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = `700 ${19 * sc}px "Noto Sans SC", sans-serif`;
    ctx.fillText(modeLabel, pad + 32 * sc, pad + 31 * sc);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `500 ${13 * sc}px "JetBrains Mono", monospace`;
    ctx.fillText(
      `CAM (${camPos.x.toFixed(2)}, ${camPos.y.toFixed(2)}, ${camPos.z.toFixed(2)})  |  36 VIEWS  |  FOV ${cam.fov_y_deg.toFixed(1)}°`,
      pad + 18 * sc, pad + 56 * sc
    );
    ctx.restore();

    // Bottom-left multi-view training thumbnails strip (Acts 1 & 2)
    const stripA = smooth(0.4, 1.0, t) * (1 - smooth(8.6, 9.4, t));
    if (stripA > 0.01) {
      const tw = (LAND ? 132 : 124) * sc, th = tw * 9 / 16, gap = 10 * sc;
      const sx0 = pad;
      const sy0 = H - pad - th - 26 * sc;
      ctx.save();
      ctx.globalAlpha = stripA;
      ctx.fillStyle = '#94a3b8';
      ctx.font = `500 ${12 * sc}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'left';
      ctx.fillText('MULTI-VIEW INPUTS (36 SOLVED)', sx0, sy0 - 8 * sc);
      thumbs.forEach((im, idx) => {
        const tx = sx0 + idx * (tw + gap);
        ctx.fillStyle = 'rgba(10,16,28,0.85)';
        rr(ctx, tx - 2 * sc, sy0 - 2 * sc, tw + 4 * sc, th + 4 * sc, 5 * sc);
        ctx.fill();
        ctx.drawImage(im, tx, sy0, tw, th);
        ctx.strokeStyle = 'rgba(56,189,248,0.65)';
        ctx.lineWidth = 1.2 * sc;
        ctx.strokeRect(tx, sy0, tw, th);
        ctx.fillStyle = '#67e8f9';
        ctx.font = `600 ${11 * sc}px "JetBrains Mono", monospace`;
        ctx.fillText(`CAM #${['00', '12', '28'][idx]}`, tx + 6 * sc, sy0 + th - 6 * sc);
      });
      ctx.restore();
    }

    // Final title lockup (10.0s - 12.0s)
    const endP = smooth(10.0, 10.9, t);
    if (endP > 0.01) {
      ctx.save();
      ctx.globalAlpha = endP;
      const bandH = (LAND ? 148 : 180) * sc;
      const bg = ctx.createLinearGradient(0, H - bandH - 60 * sc, 0, H);
      bg.addColorStop(0, 'rgba(8,12,20,0)');
      bg.addColorStop(0.45, 'rgba(8,12,20,0.82)');
      bg.addColorStop(1, 'rgba(8,12,20,0.95)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, H - bandH - 60 * sc, W, bandH + 60 * sc);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#f8fafc';
      ctx.font = `700 ${(LAND ? 44 : 42) * sc}px "Noto Sans SC", sans-serif`;
      ctx.fillText('环绕实景重建 · 3DGS + AR', W / 2, H - (LAND ? 74 : 92) * sc);

      ctx.fillStyle = '#94a3b8';
      ctx.font = `500 ${(LAND ? 18 : 17) * sc}px "Noto Sans SC", sans-serif`;
      ctx.fillText('Blender 环绕渲染 · 相机位姿 AR 叠加 · Brush 3D 高斯点云自由运镜', W / 2, H - (LAND ? 42 : 56) * sc);
      ctx.restore();
    }

    // Credits line at very bottom
    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(148,163,184,0.72)';
    ctx.font = `400 ${12 * sc}px "Noto Sans SC", sans-serif`;
    ctx.fillText(credits(A), W - pad, H - 14 * sc);
    ctx.restore();
  },
});
