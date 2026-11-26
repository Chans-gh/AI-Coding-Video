// T-026 视觉调查（visual-investigation）：冷峻炭黑取证桌面（#0B0C0E）+ 唯一信号红（#FF4A2E）+ 平陆运河多源实证：
// 实拍航拍冷开场定格放大倒带 + 马道枢纽 5000 吨实船过闸录像/施工照/134.2 km 梯级水位游标联动 + 工程摘录红荧光划线互证 + 省水船闸剖面与证据总览图
scene({
  id: 'T-026',
  name: '视觉调查',
  dur: 14.0,
  still: 4.8,
  fonts: [
    "700 44px 'Noto Sans SC'",
    "500 30px 'Noto Serif SC'",
    "700 28px 'JetBrains Mono'",
  ],
  text: '平陆运河落差实证马道枢纽实船试验干地开挖全长公里省水船闸出海缩短钦州入海口正式通航',

  async init() {
    const A = await loadAssets();
    const [vid, chImg, exImg, origImg, profile] = await Promise.all([
      loadVideo('madao_surge.mp4'),
      loadImage('const_channel.jpg'),
      loadImage('const_excavate.jpg'),
      loadImage('pingtang_origin.jpg'),
      loadText('canal_profile.csv').then(parseCSV),
    ]);
    // 预烘焙 256×256 单色细颗粒，只叠加在实拍录像与照片面板上
    const grainTile = mk(256, 256);
    const gctx = grainTile.getContext('2d');
    const gid = gctx.createImageData(256, 256);
    for (let i = 0; i < gid.data.length; i += 4) {
      const p = i >> 2;
      const n = (hash2(p % 256, (p / 256) | 0) - 0.5) * 44;
      const v = clamp(Math.round(128 + n), 0, 255);
      gid.data[i] = v; gid.data[i + 1] = v; gid.data[i + 2] = v; gid.data[i + 3] = 255;
    }
    gctx.putImageData(gid, 0, 0);

    return {
      A, vid, chImg, exImg, origImg, profile, grainTile,
      BG: '#0B0C0E', PANEL: '#141619', LINE: '#2E3238',
      TXT: '#ECEAE4', SEC: '#8B9097', RED: '#FF4A2E',
      PAPER: '#E4E0D4', INK: '#1D1D1B',
    };
  },

  async draw(ctx, t, s) {
    const u = SHORT / 1080;
    const { BG, PANEL, LINE, TXT, SEC, RED, PAPER, INK } = s;
    const { vid, chImg, exImg, origImg, profile, grainTile } = s;
    const frame = Math.floor(t * FPS + 1e-4);

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // 调查面板框（1.5px 边框 + 顶部来源小角标，零冗余修饰）
    const drawBoard = (x, y, w, h, tag, flash = 0) => {
      ctx.fillStyle = PANEL;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = Math.max(1, 1.5 * u);
      ctx.strokeRect(x, y, w, h);
      if (tag) {
        ctx.fillStyle = RED;
        ctx.fillRect(x, y - 22 * u, 6 * u, 14 * u);
        ctx.fillStyle = SEC;
        ctx.font = `700 ${(LAND ? 18 : 20) * u}px 'JetBrains Mono'`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(tag, x + 12 * u, y - 6 * u);
      }
      if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash})`;
        ctx.fillRect(x, y, w, h);
      }
    };

    // 实拍录像与照片统一冷峻纪实调色 + 微颗粒（绝不污染文字与线条）
    const drawMediaPlate = (box, src, opts = {}) => {
      const [bx, by, bw, bh] = box;
      const [sw, sh] = srcSize(src);
      const zoom = opts.zoom || 1, fx = opts.fx ?? 0.5, fy = opts.fy ?? 0.5;
      const k = Math.max((bw - 4) / sw, (bh - 4) / sh) * zoom;
      const dw = sw * k, dh = sh * k;
      const dx = bx + 2 + (bw - 4 - dw) * fx;
      const dy = by + 2 + (bh - 4 - dh) * fy;

      ctx.save();
      ctx.beginPath();
      ctx.rect(bx + 2, by + 2, bw - 4, bh - 4);
      ctx.clip();
      ctx.filter = opts.filter || 'grayscale(0.72) contrast(1.18) brightness(1.03)';
      ctx.drawImage(src, dx, dy, dw, dh);
      ctx.filter = 'none';

      // 只在素材上叠微细胶片颗粒
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.06;
      const ox = -Math.round(hash2(frame, 3) * 128);
      const oy = -Math.round(hash2(frame, 17) * 128);
      for (let gx = bx + ox; gx < bx + bw; gx += 256) {
        for (let gy = by + oy; gy < by + bh; gy += 256) {
          ctx.drawImage(grainTile, gx, gy);
        }
      }
      ctx.restore();
      return { dx, dy, dw, dh, sw, sh };
    };

    // 绘制顺时针圆环标注
    const drawRing = (cx, cy, r, p = 1) => {
      ctx.save();
      ctx.strokeStyle = RED;
      ctx.lineWidth = 3 * u;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(p));
      ctx.stroke();
      ctx.restore();
    };

    const marginX = (LAND ? 52 : 44) * u;
    const topY = (LAND ? 54 : 68) * u;
    const botPad = (LAND ? 102 : 155) * u;
    const contentH = H - topY - botPad;
    const contentW = W - 2 * marginX;

    // =========================================================================
    // 段 1 (0.0 - 2.6s)：实拍冷开场 —— 马道 5000T 实船过闸白闪定格 → 红圈 ×2 放大镜 → 倒带转场
    // =========================================================================
    if (t < 2.6) {
      const box = [marginX, topY, contentW, contentH];
      const isRewind = t >= 1.95;
      const isFreeze = t >= 0.75 && t < 1.95;
      const vidT = isRewind
        ? clamp(2.35 - (t - 1.95) * 3.0, 0.2, vid.dur - 0.1)
        : isFreeze
          ? 2.35
          : clamp(1.2 + t * 1.5, 0, vid.dur - 0.1);
      const vidEl = await vid.at(vidT);

      const flash = (t >= 0.75 && t < 0.87) ? (1 - (t - 0.75) / 0.12) * 0.72 : 0;
      drawBoard(...box, '录像 · 马道枢纽 5000 吨级实船试验（2026-08-12）');
      const mapInfo = drawMediaPlate(box, vidEl, { zoom: isFreeze ? 1.03 : lerp(1.0, 1.04, t / 2.6), fy: 0.54 });

      if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash})`;
        ctx.fillRect(box[0], box[1], box[2], box[3]);
      }

      // 左上角信号红实拍状态读数
      ctx.fillStyle = RED;
      ctx.fillRect(box[0] + 22 * u, box[1] + 22 * u, (LAND ? 310 : 340) * u, 42 * u);
      ctx.fillStyle = TXT;
      ctx.font = `700 ${(LAND ? 21 : 22) * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        isRewind ? 'REWIND ◄◄ 2026-02-21' : isFreeze ? 'FREEZE · 2026-08-12' : 'LIVE DRONE · MADAO LOCK',
        box[0] + 34 * u, box[1] + 43 * u
      );

      // 底部渐变暗角带与主题大标题（只用实拍角一隅，不遮主体船只）
      const grad = ctx.createLinearGradient(0, box[1] + box[3] * 0.65, 0, box[1] + box[3]);
      grad.addColorStop(0, 'rgba(11,12,14,0)');
      grad.addColorStop(1, 'rgba(11,12,14,0.86)');
      ctx.fillStyle = grad;
      ctx.fillRect(box[0] + 2, box[1] + box[3] * 0.65, box[2] - 4, box[3] * 0.35 - 2);

      ctx.fillStyle = TXT;
      ctx.font = `700 ${(LAND ? 46 : 42) * u}px 'Noto Sans SC'`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('平陆运河 · 65 m 落差跨海通道实证', box[0] + 28 * u, box[1] + box[3] - 48 * u);
      ctx.fillStyle = SEC;
      ctx.font = `700 ${(LAND ? 22 : 23) * u}px 'JetBrains Mono'`;
      ctx.fillText('134.2 KM WATERWAY · MADAO DROP 29.6 M', box[0] + 28 * u, box[1] + box[3] - 18 * u);

      // 定格阶段 (0.75–1.95s)：红圈锁定船闸实船区 + 引出 ×2 像素级放大镜
      if (isFreeze) {
        const ft = t - 0.75;
        const focusNX = 0.30, focusNY = 0.74; // 对应左闸室 5000T 实船船艏与闸墙涌流处
        const rx = mapInfo.dx + mapInfo.dw * focusNX;
        const ry = mapInfo.dy + mapInfo.dh * focusNY;
        const ringP = eOutCubic(inv(0.05, 0.50, ft));
        drawRing(rx, ry, 52 * u, ringP);

        if (ft > 0.28) {
          const lP = eOutCubic(inv(0.28, 0.65, ft));
          const loupeS = (LAND ? 260 : 270) * u;
          const lx = LAND ? box[0] + box[2] - loupeS - 36 * u : box[0] + box[2] - loupeS - 28 * u;
          const ly = LAND ? box[1] + 44 * u : box[1] + 92 * u;

          // 连线到放大镜框
          ctx.save();
          ctx.strokeStyle = RED;
          ctx.lineWidth = 2.5 * u;
          ctx.setLineDash([8 * u, 6 * u]);
          ctx.beginPath();
          ctx.moveTo(rx + 40 * u, ry - 32 * u);
          ctx.lineTo(lerp(rx + 40 * u, lx, lP), lerp(ry - 32 * u, ly + loupeS * 0.5, lP));
          ctx.stroke();
          ctx.restore();

          if (lP > 0.15) {
            ctx.save();
            ctx.globalAlpha = clamp(lP * 1.4);
            ctx.fillStyle = PANEL;
            ctx.fillRect(lx, ly, loupeS, loupeS);
            // 从原视频像素严格裁出 ×2 放大区（只取真实素材像素）
            const cropR = mapInfo.sw * 0.16;
            const csx = clamp(focusNX * mapInfo.sw - cropR, 0, mapInfo.sw - 2 * cropR);
            const csy = clamp(focusNY * mapInfo.sh - cropR, 0, mapInfo.sh - 2 * cropR);
            ctx.save();
            ctx.beginPath(); ctx.rect(lx, ly, loupeS, loupeS); ctx.clip();
            ctx.filter = 'grayscale(0.65) contrast(1.25) brightness(1.06)';
            ctx.drawImage(vidEl, csx, csy, 2 * cropR, 2 * cropR, lx, ly, loupeS, loupeS);
            ctx.restore();
            ctx.strokeStyle = RED;
            ctx.lineWidth = 3 * u;
            ctx.strokeRect(lx, ly, loupeS, loupeS);
            ctx.fillStyle = RED;
            ctx.fillRect(lx, ly + loupeS, loupeS, 36 * u);
            ctx.fillStyle = TXT;
            ctx.font = `700 ${(LAND ? 19 : 20) * u}px 'JetBrains Mono'`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('×2 · 5000T 过闸实船', lx + loupeS / 2, ly + loupeS + 18 * u);
            ctx.restore();
          }
        }
      }

      // 倒带扫描线
      if (isRewind) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,74,46,0.14)';
        for (let y = box[1] + ((frame * 17) % 24); y < box[1] + box[3]; y += 22 * u) {
          ctx.fillRect(box[0], y, box[2], 3 * u);
        }
        ctx.restore();
      }
    }
    // =========================================================================
    // 段 2 (2.6 - 6.8s, still=4.8s)：多源同步网格
    // 主实拍马道过闸 + 2026-02 干地施工对照照 + 134.2 km 三级水位剖面共享红游标
    // =========================================================================
    else if (t < 6.8) {
      const dt = t - 2.6;
      const flashIn = dt < 0.12 ? (1 - dt / 0.12) * 0.35 : 0;
      const gap = (LAND ? 26 : 22) * u;
      const rowGap = 38 * u;

      const vBox = LAND
        ? [marginX, topY, contentW * 0.58, contentH * 0.63]
        : [marginX, topY, contentW, contentH * 0.39];
      const pBox = LAND
        ? [marginX + contentW * 0.58 + gap, topY, contentW * 0.42 - gap, contentH * 0.63]
        : [marginX, topY + contentH * 0.39 + rowGap, contentW, contentH * 0.25];
      const cBox = LAND
        ? [marginX, topY + contentH * 0.63 + rowGap, contentW, contentH * 0.37 - rowGap]
        : [marginX, topY + contentH * 0.64 + rowGap * 2, contentW, contentH * 0.36 - rowGap * 2];

      // 1) 主实拍面板：马道枢纽实船连续过闸（人字门 → 双线闸室充水进船）
      drawBoard(...vBox, '录像 · 马道枢纽 5000T 实船过闸（2026-08-12）', flashIn);
      const vidEl = await vid.at(clamp(dt * 1.05, 0, vid.dur - 0.1));
      drawMediaPlate(vBox, vidEl, { zoom: lerp(1.0, 1.04, dt / 4.2), fy: 0.52 });

      // 左上角动态实时角标与锁定框
      ctx.fillStyle = RED;
      ctx.fillRect(vBox[0] + 18 * u, vBox[1] + 18 * u, 260 * u, 36 * u);
      ctx.fillStyle = TXT;
      ctx.font = `700 ${20 * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(`2026-08-12 · +${dt.toFixed(1)}s`, vBox[0] + 30 * u, vBox[1] + 36 * u);

      // 闸室动态识别框（t=3.5..6.8s 船只清晰出现后锁定）
      if (t > 3.5) {
        const bx = vBox[0] + vBox[2] * 0.22, by = vBox[1] + vBox[3] * 0.22;
        const bw = vBox[2] * 0.38, bh = vBox[3] * 0.62;
        const corner = 24 * u;
        ctx.strokeStyle = RED; ctx.lineWidth = 3 * u;
        ctx.beginPath();
        ctx.moveTo(bx, by + corner); ctx.lineTo(bx, by); ctx.lineTo(bx + corner, by);
        ctx.moveTo(bx + bw - corner, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + corner);
        ctx.moveTo(bx, by + bh - corner); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + corner, by + bh);
        ctx.moveTo(bx + bw - corner, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - corner);
        ctx.stroke();
      }

      // 2) 右侧/中栏施工照对比（2026-02-21 干地开挖成型 → 硬切切换第二视角）
      const cut2 = t >= 4.7;
      const pFlash = (t >= 4.7 && t < 4.82) ? (1 - (t - 4.7) / 0.12) * 0.45 : flashIn * 0.6;
      drawBoard(...pBox, cut2 ? '照片 · 2026-02-21 航道边坡成型' : '照片 · 2026-02-21 干地开挖现场', pFlash);
      const pSrc = cut2 ? exImg : chImg;
      const pZoom = cut2 ? lerp(1.0, 1.05, (t - 4.7) / 2.1) : lerp(1.0, 1.05, dt / 2.1);
      drawMediaPlate(pBox, pSrc, { zoom: pZoom, fy: 0.55 });
      ctx.fillStyle = 'rgba(11,12,14,0.78)';
      ctx.fillRect(pBox[0] + 16 * u, pBox[1] + pBox[3] - 46 * u, 250 * u, 32 * u);
      ctx.fillStyle = TXT;
      ctx.font = `700 ${18 * u}px 'JetBrains Mono'`;
      ctx.fillText('半年跨度 · 干地 → 通水实船', pBox[0] + 26 * u, pBox[1] + pBox[3] - 30 * u);

      // 3) 底部 134.2 km 三级梯级水位剖面图 + 共享红游标
      drawBoard(...cBox, '数据 · 全线 134.2 km 三级船闸水位落差剖面（0–65 m）');
      const px = cBox[0] + (LAND ? 68 : 54) * u;
      const py = cBox[1] + (LAND ? 34 : 30) * u;
      const pw = cBox[2] - (LAND ? 110 : 88) * u;
      const ph = cBox[3] - (LAND ? 74 : 68) * u;

      // 横向基准格线与海平面虚线
      ctx.strokeStyle = 'rgba(236,234,228,0.09)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 2; i++) {
        const y = py + (i / 2) * ph;
        ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + pw, y); ctx.stroke();
      }
      ctx.save(); ctx.strokeStyle = LINE; ctx.setLineDash([6 * u, 5 * u]);
      ctx.beginPath(); ctx.moveTo(px, py + ph); ctx.lineTo(px + pw, py + ph); ctx.stroke();
      ctx.restore();

      // 绘制阶梯水位折线与填充区
      const toX = km => px + (km / 134.2) * pw;
      const toY = wm => py + ph - (wm / 72) * ph;
      ctx.beginPath();
      profile.forEach((r, i) => {
        const x = toX(r.km), y = toY(r.water_m);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.strokeStyle = TXT;
      ctx.lineWidth = 3.5 * u;
      ctx.stroke();

      // 三级船闸节点标注（防重叠：标注错开在阶梯外侧，游标读数置于最顶轨道）
      const locks = [
        { km: 33.1, wm: 35.4, lbl: '马道 -29.6m', dx: 10, dy: 20 },
        { km: 74.1, wm: 11.0, lbl: '企石 -24.4m', dx: 10, dy: 20 },
        { km: 111.1, wm: 0.0, lbl: '青年 -11.0m', dx: -10, dy: -18 },
      ];
      locks.forEach((lk, idx) => {
        const lx = toX(lk.km), ly = toY(lk.wm);
        ctx.fillStyle = idx === 0 ? RED : SEC;
        ctx.beginPath(); ctx.arc(lx, ly, (idx === 0 ? 6.5 : 4.5) * u, 0, TAU); ctx.fill();
        ctx.font = `700 ${(LAND ? 19 : 18) * u}px 'JetBrains Mono'`;
        ctx.textAlign = idx === 2 ? 'right' : 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(lk.lbl, lx + lk.dx * u, ly + lk.dy * u);
      });

      // 游标在 still=4.8s 附近锁定马道枢纽（33.0 km），展现跨面板互证瞬间
      let curKm;
      if (dt < 1.8) curKm = lerp(0, 33.0, eOutCubic(dt / 1.8));
      else if (dt < 2.6) curKm = lerp(33.0, 36.5, (dt - 1.8) / 0.8);
      else curKm = lerp(36.5, 134.2, (dt - 2.6) / 1.6);

      const curWater = curKm < 33.05 ? 65.0 : curKm < 74.05 ? 35.4 : curKm < 111.05 ? 11.0 : 0.0;
      const playX = toX(curKm);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 3 * u;
      ctx.beginPath(); ctx.moveTo(playX, py - 18 * u); ctx.lineTo(playX, py + ph + 10 * u); ctx.stroke();

      // 当游标在马道区段时，向上拉一条红色虚线对准主视频框底部
      if (curKm >= 20 && curKm <= 55) {
        ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 2 * u; ctx.setLineDash([6 * u, 5 * u]);
        ctx.beginPath(); ctx.moveTo(playX, cBox[1]); ctx.lineTo(vBox[0] + vBox[2] * 0.45, vBox[1] + vBox[3]); ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = RED;
      ctx.font = `700 ${(LAND ? 20 : 19) * u}px 'JetBrains Mono'`;
      ctx.textAlign = curKm > 95 ? 'right' : 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`KM ${curKm.toFixed(1)} · 水位 ${curWater.toFixed(1)}m`, playX + (curKm > 95 ? -10 : 10) * u, py - 20 * u);
    }
    // =========================================================================
    // 段 3 (6.8 - 10.8s)：工程摘录纸面卡（#E4E0D4）精确荧光红划线 → 跨屏连线实拍泄水录像 + 省水船闸剖面
    // =========================================================================
    else if (t < 10.8) {
      const dt = t - 6.8;
      const gap = (LAND ? 28 : 22) * u;
      const rowGap = 38 * u;

      const dBox = LAND
        ? [marginX, topY, contentW * 0.43, contentH]
        : [marginX, topY, contentW, contentH * 0.37];
      const vBox = LAND
        ? [marginX + contentW * 0.43 + gap, topY, contentW * 0.57 - gap, contentH * 0.57]
        : [marginX, topY + contentH * 0.37 + rowGap, contentW, contentH * 0.34];
      const sBox = LAND
        ? [marginX + contentW * 0.43 + gap, topY + contentH * 0.57 + rowGap, contentW * 0.57 - gap, contentH * 0.43 - rowGap]
        : [marginX, topY + contentH * 0.71 + rowGap * 2, contentW, contentH * 0.29 - rowGap * 2];

      // 1) 纸质摘录卡（#E4E0D4 + #1D1D1B 墨水，严格使用 measureText 精确锁定荧光划线坐标）
      drawBoard(...dBox, '摘录 · 平陆运河官方工程技术参数', dt < 0.1 ? 0.25 : 0);
      const [dx, dy, dw, dh] = dBox;
      ctx.fillStyle = PAPER;
      ctx.fillRect(dx + 2, dy + 2, dw - 4, dh - 4);
      const pad = (LAND ? 34 : 28) * u;
      ctx.fillStyle = INK;
      ctx.font = `700 ${(LAND ? 20 : 21) * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('TRANSCRIPTION // PINGLU CANAL 2026', dx + pad, dy + pad * 0.75);
      ctx.fillStyle = 'rgba(29,29,27,0.22)';
      ctx.fillRect(dx + pad, dy + pad * 0.75 + 30 * u, dw - pad * 2, 2 * u);

      const bodySize = (LAND ? 26 : 27) * u;
      const lineGap = (LAND ? 52 : 66) * u;
      ctx.font = `500 ${bodySize}px 'Noto Serif SC'`;
      ctx.fillStyle = INK;
      const docLines = LAND ? [
        { text: '1. 内河Ⅰ级航道全长 134.2 km，可通航 5000 吨级船舶。', hl: false },
        { text: '2. 总落差 65 m，经马道、企石、青年三大枢纽梯级克服。', hl: false },
        { text: '3. 马道单级最大水头 29.6 m，配三级省水池节水率 >60%。', hl: true, t0: 0.15, t1: 0.85 },
        { text: '4. 2026-08-12 实船过闸试验核验：稳定运行。', hl: true, t0: 0.85, t1: 1.50 },
        { text: '5. 较经广州港出海缩短内河航程 560+ km，于 2026-09 通航。', hl: false },
      ] : [
        { text: '1. Ⅰ级航道全长 134.2 km，通航 5000 吨级船舶，总落差 65 m。', hl: false },
        { text: '2. 马道最大水头 29.6 m，配三级省水池节水率 >60%。', hl: true, t0: 0.15, t1: 0.85 },
        { text: '3. 2026-08-12 实船过闸试验完成，较经广州港缩短 560+ km。', hl: true, t0: 0.85, t1: 1.50 },
      ];

      let syncOrigin = null;
      let curY = dy + pad * 0.75 + 48 * u;
      docLines.forEach(item => {
        const wrapped = wrapCJK(ctx, item.text, dw - pad * 2);
        const startY = curY;
        wrapped.forEach((wl, wi) => {
          const ly = curY;
          ctx.fillStyle = INK;
          ctx.fillText(wl, dx + pad, ly);
          if (item.hl) {
            const p = eOutCubic(inv(item.t0, item.t1, dt));
            if (p > 0) {
              const tw = ctx.measureText(wl).width;
              const segP = clamp(p * wrapped.length - wi);
              if (segP > 0) {
                ctx.save();
                ctx.globalCompositeOperation = 'multiply';
                ctx.fillStyle = 'rgba(255,74,46,0.58)';
                ctx.fillRect(dx + pad - 4 * u, ly - 3 * u, (tw + 8 * u) * segP, bodySize + 8 * u);
                ctx.restore();
                syncOrigin = { x: dx + pad + tw * segP, y: ly + bodySize * 0.5 };
              }
            }
          }
          curY += bodySize * 1.48;
        });
        curY += lineGap * 0.36;
      });

      // 2) 右上实拍：马道枢纽后半段（5.0–9.2s，高水头泄流 + 双线闸壁大景别）
      drawBoard(...vBox, '同步实拍 · 马道闸室高水头泄水与过闸（+5.0s）');
      const vidEl = await vid.at(clamp(5.0 + dt * 1.05, 0, vid.dur - 0.1));
      drawMediaPlate(vBox, vidEl, { zoom: lerp(1.0, 1.04, dt / 4.0), fy: 0.56 });
      const ringX = vBox[0] + vBox[2] * 0.62, ringY = vBox[1] + vBox[3] * 0.68;
      drawRing(ringX, ringY, 48 * u, eOutCubic(inv(0.4, 1.1, dt)));

      // 跨面板红色虚线：从纸卡荧光划线终点直接连到实拍泄流红圈
      if (syncOrigin) {
        const linkP = eOutCubic(inv(0.8, 1.5, dt));
        if (linkP > 0) {
          ctx.fillStyle = RED;
          ctx.beginPath(); ctx.arc(syncOrigin.x, syncOrigin.y, 6 * u, 0, TAU); ctx.fill();
          ctx.save();
          ctx.strokeStyle = RED; ctx.lineWidth = 3 * u; ctx.setLineDash([10 * u, 7 * u]);
          ctx.beginPath();
          ctx.moveTo(syncOrigin.x, syncOrigin.y);
          ctx.lineTo(lerp(syncOrigin.x, ringX - 46 * u, linkP), lerp(syncOrigin.y, ringY, linkP));
          ctx.stroke();
          ctx.restore();
        }
      }

      // 3) 右下工程原理示意框（SCHEMATIC：三级省水船闸蓄放水原理）
      drawBoard(...sBox, 'SCHEMATIC · 三级省水池循环节水（>60%）');
      const [sx, sy, sw, sh] = sBox;
      const inX = sx + 28 * u, inY = sy + 24 * u, inW = sw - 56 * u, inH = sh - 44 * u;
      // 主闸室水位由 65.0m 缓降至 35.4m，三级侧池分阶蓄水
      const drainP = 0.5 - 0.5 * Math.cos(clamp(dt / 3.6) * Math.PI);
      const colW = inW * 0.14;
      const chamberX = inX + inW * 0.04;
      const chamberH = inH * 0.88;
      ctx.strokeStyle = TXT; ctx.lineWidth = 2 * u;
      ctx.strokeRect(chamberX, inY, colW, chamberH);
      const mainFillH = chamberH * lerp(0.88, 0.34, drainP);
      ctx.fillStyle = 'rgba(236,234,228,0.24)';
      ctx.fillRect(chamberX + 2, inY + chamberH - mainFillH, colW - 4, mainFillH - 2);
      ctx.fillStyle = RED;
      ctx.fillRect(chamberX + 2, inY + chamberH - mainFillH, colW - 4, 3 * u);

      // 三个省水侧池 I / II / III
      for (let b = 0; b < 3; b++) {
        const bx = chamberX + colW + 26 * u + b * (colW * 0.85 + 16 * u);
        const bw = colW * 0.85;
        const topOff = inH * (0.14 + b * 0.18);
        const bh = chamberH - topOff;
        ctx.strokeStyle = SEC; ctx.lineWidth = 1.5 * u;
        ctx.strokeRect(bx, inY + topOff, bw, bh);
        const fillLvl = clamp((drainP - b * 0.22) / 0.35);
        const fh = bh * lerp(0.18, 0.84, fillLvl);
        ctx.fillStyle = fillLvl > 0.1 ? 'rgba(255,74,46,0.34)' : 'rgba(236,234,228,0.12)';
        ctx.fillRect(bx + 1, inY + topOff + bh - fh, bw - 2, fh - 1);
        ctx.fillStyle = SEC;
        ctx.font = `700 ${16 * u}px 'JetBrains Mono'`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(`池${b + 1}`, bx + bw / 2, inY + topOff + 4 * u);
      }

      // 右侧核心结论数字读数
      const rxText = inX + inW;
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = RED;
      ctx.font = `700 ${(LAND ? 44 : 36) * u}px 'JetBrains Mono'`;
      ctx.fillText('节水 >60%', rxText, sy + sh * 0.40);
      ctx.fillStyle = TXT;
      ctx.font = `700 ${(LAND ? 26 : 22) * u}px 'Noto Sans SC'`;
      ctx.fillText('出海航程 -560 km', rxText, sy + sh * 0.72);
    }
    // =========================================================================
    // 段 4 (10.8 - 14.0s)：多源证据总览图（顶部三联实景帧 + 红色汇合虚线 + 已核实板与时间轴 + 出处）
    // =========================================================================
    else {
      const dt = t - 10.8;
      const gap = (LAND ? 24 : 16) * u;
      const evH = LAND ? contentH * 0.39 : contentH * 0.31;
      const evW = (contentW - gap * 2) / 3;

      const cards = [
        { src: chImg, tag: '01 · 2026-02 施工', sub: '干地航道成型', fy: 0.55 },
        { src: await vid.at(clamp(2.2 + dt * 1.1, 0, vid.dur - 0.1)), tag: '02 · 2026-08 实船', sub: '马道枢纽 5000T', fy: 0.54 },
        { src: origImg, tag: '03 · 2026-10 通航', sub: '平塘江口起点', fy: 0.44 },
      ];

      // 顶部 3 枚实景证据卡（含持续播放的第 2 号实拍录像帧！）
      cards.forEach((c, idx) => {
        const bx = marginX + idx * (evW + gap);
        const by = topY;
        const flash = dt < 0.12 ? (1 - dt / 0.12) * 0.25 : 0;
        drawBoard(bx, by, evW, evH, LAND ? c.tag : c.tag.slice(5), flash);
        drawMediaPlate([bx, by, evW, evH], c.src, { zoom: lerp(1.0, 1.04, dt / 3.2), fy: c.fy });
        ctx.fillStyle = 'rgba(11,12,14,0.82)';
        ctx.fillRect(bx + 10 * u, by + evH - 38 * u, evW - 20 * u, 28 * u);
        ctx.fillStyle = TXT;
        ctx.font = `700 ${(LAND ? 19 : 17) * u}px 'Noto Sans SC'`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(c.sub, bx + 18 * u, by + evH - 24 * u);
      });

      // 下方多源汇总证据板
      const sumY = topY + evH + (LAND ? 64 : 52) * u;
      const sumH = contentH - evH - (LAND ? 64 : 52) * u;
      drawBoard(marginX, sumY, contentW, sumH, '证据总览 · 2022–2026 平陆运河核验归档');

      // 3 条红色汇合虚线从上方 3 枚实景证据汇入总览板中枢
      const linkP = eOutCubic(inv(0.05, 0.55, dt));
      const hubX = marginX + contentW * 0.5, hubY = sumY + 4 * u;
      ctx.save();
      ctx.strokeStyle = RED; ctx.lineWidth = 2.5 * u; ctx.setLineDash([7 * u, 6 * u]);
      cards.forEach((_, idx) => {
        const sx = marginX + idx * (evW + gap) + evW * 0.5;
        const sy = topY + evH;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(lerp(sx, hubX, linkP), lerp(sy, hubY, linkP));
        ctx.stroke();
      });
      ctx.restore();
      ctx.fillStyle = RED;
      ctx.beginPath(); ctx.arc(hubX, hubY, 7 * u, 0, TAU); ctx.fill();

      // 左列（或上方）：3 项已核实 ✓ 勾选卡片
      const colW = LAND ? contentW * 0.56 : contentW - 48 * u;
      const facts = [
        ['134.2 km · 65 m 落差', '西津库区平塘江口至钦州入海口，三级枢纽梯级衔接'],
        ['5000 吨实船 · 节水 >60%', '马道单级最大水头 29.6 m，实船试验全工况核验'],
        ['出海缩短 560+ km', '西南地区货源经北部湾出海，2026-09 正式通航'],
      ];
      facts.forEach(([title, desc], i) => {
        const pop = inv(0.15 + i * 0.18, 0.30 + i * 0.18, dt);
        if (pop <= 0) return;
        const iy = sumY + (LAND ? 34 : 26) * u + i * (LAND ? 92 : 78) * u;
        const ix = marginX + (LAND ? 34 : 24) * u;
        ctx.save(); ctx.globalAlpha = pop;
        ctx.fillStyle = RED; ctx.fillRect(ix, iy + 2 * u, 30 * u, 30 * u);
        ctx.fillStyle = TXT; ctx.font = `700 ${22 * u}px 'JetBrains Mono'`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('✓', ix + 15 * u, iy + 17 * u);
        ctx.textAlign = 'left'; ctx.font = `700 ${(LAND ? 28 : 26) * u}px 'Noto Sans SC'`;
        ctx.fillText(title, ix + 44 * u, iy + 16 * u);
        ctx.fillStyle = SEC; ctx.font = `500 ${(LAND ? 21 : 19) * u}px 'Noto Sans SC'`;
        ctx.fillText(desc, ix + 44 * u, iy + 50 * u);
        ctx.restore();
      });

      // 右列（横屏右侧 / 竖屏下方）：关键工程时间轴
      const tlX = LAND ? marginX + contentW * 0.60 : marginX + 24 * u;
      const tlY = LAND ? sumY + 38 * u : sumY + 272 * u;
      const tlW = LAND ? contentW * 0.36 : contentW - 48 * u;
      ctx.fillStyle = SEC;
      ctx.font = `700 ${(LAND ? 19 : 18) * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('工程节点 · MILESTONES', tlX, tlY);

      const miles = [
        ['2022-08', '全线正式开工'],
        ['2026-02', '航道干地开挖成型'],
        ['2026-08', '5000T 实船过闸试验'],
        ['2026-09', '全线正式通航'],
      ];
      if (LAND) {
        const lineX = tlX + 12 * u;
        const y0 = tlY + 42 * u, y1 = tlY + 222 * u;
        ctx.strokeStyle = LINE; ctx.lineWidth = 2 * u;
        ctx.beginPath(); ctx.moveTo(lineX, y0); ctx.lineTo(lineX, y1); ctx.stroke();
        const progY = lerp(y0, y1, eOutCubic(inv(0.3, 1.4, dt)));
        ctx.strokeStyle = RED;
        ctx.beginPath(); ctx.moveTo(lineX, y0); ctx.lineTo(lineX, progY); ctx.stroke();
        miles.forEach(([yr, ev], i) => {
          const my = lerp(y0, y1, i / 3);
          const lit = progY >= my - 2;
          ctx.fillStyle = lit ? RED : LINE;
          ctx.beginPath(); ctx.arc(lineX, my, 6 * u, 0, TAU); ctx.fill();
          ctx.fillStyle = lit ? TXT : SEC;
          ctx.font = `700 ${21 * u}px 'JetBrains Mono'`;
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(`${yr}  ${ev}`, lineX + 22 * u, my);
        });
      } else {
        const y0 = tlY + 46 * u;
        ctx.strokeStyle = LINE; ctx.lineWidth = 2 * u;
        ctx.beginPath(); ctx.moveTo(tlX, y0); ctx.lineTo(tlX + tlW, y0); ctx.stroke();
        const progX = lerp(tlX, tlX + tlW, eOutCubic(inv(0.3, 1.4, dt)));
        ctx.strokeStyle = RED;
        ctx.beginPath(); ctx.moveTo(tlX, y0); ctx.lineTo(progX, y0); ctx.stroke();
        miles.forEach(([yr, ev], i) => {
          const mx = lerp(tlX + 24 * u, tlX + tlW - 24 * u, i / 3);
          const lit = progX >= mx - 4;
          ctx.fillStyle = lit ? RED : LINE;
          ctx.beginPath(); ctx.arc(mx, y0, 6 * u, 0, TAU); ctx.fill();
          ctx.fillStyle = lit ? TXT : SEC;
          ctx.font = `700 ${19 * u}px 'JetBrains Mono'`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(yr, mx, y0 + 14 * u);
          ctx.font = `500 ${17 * u}px 'Noto Sans SC'`;
          ctx.fillText(ev.slice(0, 6), mx, y0 + 38 * u);
        });
      }

      // 底部出处署名（完整标注 CC BY 4.0 与 CC0 作者）
      ctx.fillStyle = SEC;
      ctx.font = `700 ${(LAND ? 17 : 15) * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(credits(s.A), marginX + (LAND ? 34 : 24) * u, sumY + sumH - 14 * u);
    }

    // 底部 Kokoro 旁白字幕
    const c = cueAt(s.A, t);
    if (c) {
      caption(ctx, c.text, {
        size: LAND ? 31 : 28,
        maxW: W * (LAND ? 0.80 : 0.88),
        y: H - (LAND ? 20 : 28) * u,
        bg: 'rgba(11,12,14,0.90)',
      });
    }
  },
});
