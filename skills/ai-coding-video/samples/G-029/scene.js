// G-029 文字闪切（text-flash-cuts）：严格红/黑/白三色（#E01A14 / #0A0908 / #F5F3EE）、2–6 帧全屏闪切字卡、
// 单点透视符号建筑、固定角色色发言边栏、剪影转平涂 0.1rad 猛回头 + 红黑双色对调反相（绝非 RGB 反色）
scene({
  id: 'G-029',
  name: '文字闪切',
  dur: 12.0,
  still: 6.4,
  fonts: [
    "900 120px 'Noto Serif SC'",
    "700 60px 'Noto Serif SC'",
    "900 48px 'Noto Sans SC'",
    "italic 400 40px 'Playfair Display'",
    "700 48px 'JetBrains Mono'",
  ],
  text: '零点末班车别回头这班车根本没有终点站零点已过请立刻离开站台主角站务第话终紧急制动下一站空轨',

  async init() {
    const A = await loadAssets();
    const [charBack, charTurn, charEye] = await Promise.all([
      loadImage('char_back.png'),
      loadImage('char_turn.png'),
      loadImage('char_eye.png'),
    ]);
    const RED = '#E01A14', BLK = '#0A0908', WHT = '#F5F3EE';

    // 预生成纯色剪影离屏图（source-in）：黑剪影与红剪影
    const makeTint = (img, col) => {
      const c = mk(img.width, img.height), g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
      return c;
    };
    // 红黑双色对调反相图（绝非 RGB 反相出青色）：灰度阈值映射 白→黑、黑/深→红、红→白
    const makeRedBlackSwap = img => {
      const c = mk(img.width, img.height), g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 20) continue;
        const r = d[i], gr = d[i + 1], b = d[i + 2];
        const isRed = r > 125 && (r - Math.max(gr, b)) > 45;
        const lum = 0.299 * r + 0.587 * gr + 0.114 * b;
        if (isRed) { d[i] = 245; d[i + 1] = 243; d[i + 2] = 238; }       // 红 → 纸白
        else if (lum < 95) { d[i] = 224; d[i + 1] = 26; d[i + 2] = 20; } // 黑 → 红
        else { d[i] = 10; d[i + 1] = 9; d[i + 2] = 8; }                  // 白 → 黑
      }
      g.putImageData(id, 0, 0);
      return c;
    };

    return {
      A, RED, BLK, WHT, GREY: '#8D8A84',
      charBack, charTurn, charEye,
      backSil: makeTint(charBack, BLK),
      turnSil: makeTint(charTurn, BLK),
      turnSwap: makeRedBlackSwap(charTurn),
      eyeSwap: makeRedBlackSwap(charEye),
    };
  },

  draw(ctx, t, s, f) {
    const u = SHORT / 1080;
    const { RED, BLK, WHT, GREY } = s;
    const frame = Math.floor(t * FPS + 1e-4);

    // 确定性整像素震动（前 2 帧冲击强抖，之后微抖；绝无模糊）
    const slamXform = (localF, amp = 14) => {
      const sc = localF === 0 ? 1.08 : localF === 1 ? 1.02 : 1.0;
      const mag = localF < 2 ? amp : 2;
      const jx = Math.round((hash2(frame, 11) - 0.5) * 2 * mag * u);
      const jy = Math.round((hash2(frame, 29) - 0.5) * 2 * mag * u);
      return { sc, jx, jy };
    };

    // 单点透视地下铁车厢/隧道走廊
    const drawTunnel = (rect, depthShift, invert = false) => {
      const [rx, ry, rw, rh] = rect;
      const wall = invert ? RED : BLK, trim = invert ? BLK : WHT, lit = invert ? WHT : RED;
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
      ctx.fillStyle = wall; ctx.fillRect(rx, ry, rw, rh);
      const vx = rx + rw * 0.5, vy = ry + rh * 0.47;
      for (let i = 10; i >= 0; i--) {
        const z = ((i - (depthShift % 1) + 11) % 11) + 0.15;
        const k = 1 / (z * 0.34 + 0.10);
        const bw = rw * 0.86 * k, bh = rh * 0.84 * k;
        const x = vx - bw / 2, y = vy - bh / 2;
        ctx.fillStyle = i % 2 === 0 ? (invert ? '#B8130E' : '#161518') : wall;
        ctx.fillRect(x, y, bw, bh);
        ctx.strokeStyle = trim; ctx.lineWidth = Math.max(2, 6 * k * u);
        ctx.strokeRect(x, y, bw, bh);
        // 车窗与头顶红色拉环几何
        const winW = bw * 0.14, winH = bh * 0.42;
        ctx.fillStyle = (i % 3 === 0) ? lit : trim;
        ctx.fillRect(x + bw * 0.04, y + bh * 0.24, winW, winH);
        ctx.fillRect(x + bw - bw * 0.04 - winW, y + bh * 0.24, winW, winH);
        // 顶部吊环
        ctx.strokeStyle = lit; ctx.lineWidth = Math.max(1.5, 4 * k * u);
        for (const side of [-0.26, 0.26]) {
          const hx = vx + bw * side, hy = y + bh * 0.02;
          ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx, hy + bh * 0.14); ctx.stroke();
          ctx.beginPath(); ctx.arc(hx, hy + bh * 0.17, Math.max(3, bh * 0.045), 0, TAU); ctx.stroke();
        }
      }
      // 尽头白色车门（绝不黑剪影配黑门）
      ctx.fillStyle = trim;
      ctx.fillRect(vx - rw * 0.045, vy - rh * 0.06, rw * 0.09, rh * 0.14);
      ctx.restore();
    };

    // 无限几何楼梯（阶梯透视 + 红灯爬升）
    const drawStairs = (rect, stepPhase, climbLit) => {
      const [rx, ry, rw, rh] = rect;
      ctx.save(); ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
      ctx.fillStyle = BLK; ctx.fillRect(rx, ry, rw, rh);
      for (let k = 0; k < 18; k++) {
        const r = Math.pow(0.86, k);
        const y1 = ry + rh * (0.94 - (1 - r) * 0.88);
        const y0 = ry + rh * (0.94 - (1 - r * 0.86) * 0.88);
        const inset = rw * (1 - r) * 0.36;
        const litHere = Math.floor(climbLit) % 18 === k;
        ctx.fillStyle = litHere ? RED : WHT;
        ctx.fillRect(rx + inset, y0, rw - 2 * inset, Math.max(2, (y1 - y0) * 0.56));
        ctx.fillStyle = litHere ? '#7A0D0A' : '#1E1D21';
        ctx.fillRect(rx + inset, y0 + (y1 - y0) * 0.56, rw - 2 * inset, Math.max(2, (y1 - y0) * 0.44));
      }
      ctx.restore();
    };

    // 垂直排版文字（自动把标点放到格右上）
    const drawVertText = (str, cx, y0, size, col, stepY = 1.12) => {
      ctx.save();
      ctx.fillStyle = col; ctx.font = `900 ${size}px 'Noto Serif SC'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < str.length; i++) {
        const ch = str[i], cy = y0 + i * size * stepY;
        if (ch === '，' || ch === '。') {
          ctx.fillText(ch, cx + size * 0.24, cy - size * 0.24);
        } else {
          ctx.fillText(ch, cx, cy);
        }
      }
      ctx.restore();
    };

    // 固定角色发言边栏（主角红底黑字，站务黑底白字）
    const drawRail = (side, bg, fg, chTag, lines, eng, slamP) => {
      if (LAND) {
        const rw = 240 * u;
        const rx = side === 'left' ? lerp(-rw, 0, slamP) : lerp(W, W - rw, slamP);
        ctx.fillStyle = bg; ctx.fillRect(rx, 0, rw, H);
        ctx.fillStyle = bg === RED ? BLK : RED;
        ctx.fillRect(side === 'left' ? rx + rw - 6 * u : rx, 0, 6 * u, H);
        // 角色角标
        ctx.fillStyle = bg === RED ? BLK : RED;
        ctx.fillRect(rx + 28 * u, 42 * u, 64 * u, 64 * u);
        ctx.fillStyle = bg === RED ? RED : WHT;
        ctx.font = `900 ${34 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(chTag, rx + 60 * u, 74 * u);
        // 竖排正文
        const colX = rx + rw * 0.54;
        lines.forEach((ln, idx) => {
          drawVertText(ln, colX + (lines.length > 1 ? (idx === 0 ? 44 : -44) * u : 0), 175 * u, 52 * u, fg, 1.12);
        });
        // 单行斜体英文小注
        ctx.save(); ctx.translate(rx + 36 * u, H - 64 * u); ctx.rotate(-Math.PI / 2);
        ctx.font = `italic 400 ${22 * u}px 'Playfair Display'`; ctx.fillStyle = bg === RED ? BLK : GREY;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(eng, 0, 0);
        ctx.restore();
      } else {
        // 竖屏：边栏放在顶部或底部条，绝不压中心主画面
        const rh = 250 * u;
        const ry = side === 'left' ? lerp(-rh, 0, slamP) : lerp(H, H - rh, slamP);
        ctx.fillStyle = bg; ctx.fillRect(0, ry, W, rh);
        ctx.fillStyle = bg === RED ? BLK : RED;
        ctx.fillRect(0, side === 'left' ? ry + rh - 6 * u : ry, W, 6 * u);
        ctx.fillStyle = bg === RED ? BLK : RED;
        ctx.fillRect(46 * u, ry + 48 * u, 74 * u, 74 * u);
        ctx.fillStyle = bg === RED ? RED : WHT;
        ctx.font = `900 ${38 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(chTag, 83 * u, ry + 85 * u);
        ctx.fillStyle = fg; ctx.font = `900 ${48 * u}px 'Noto Serif SC'`; ctx.textAlign = 'left';
        ctx.fillText(lines.join(''), 148 * u, ry + 86 * u);
        ctx.fillStyle = bg === RED ? BLK : GREY;
        ctx.font = `italic 400 ${28 * u}px 'Playfair Display'`;
        ctx.fillText(eng, 148 * u, ry + 158 * u);
      }
    };

    // 全屏闪切字卡（非居中幻灯片：偏角/出血构图 + 1.08x 砸入微抖）
    const drawFlashCard = (glyph, bg, fg, subCode, corner, localF) => {
      const { sc, jx, jy } = slamXform(localF, 13);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2 + jx, H / 2 + jy); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
      ctx.fillStyle = fg;
      const big = (LAND ? 740 : 620) * u;
      ctx.font = `900 ${big}px 'Noto Serif SC'`;
      ctx.textBaseline = 'middle';
      if (corner === 'tl') { ctx.textAlign = 'left'; ctx.fillText(glyph, -30 * u, H * 0.42); }
      else if (corner === 'br') { ctx.textAlign = 'right'; ctx.fillText(glyph, W + 30 * u, H * 0.62); }
      else if (corner === 'tr') { ctx.textAlign = 'right'; ctx.fillText(glyph, W * 0.94, H * 0.38); }
      else { ctx.textAlign = 'left'; ctx.fillText(glyph, W * 0.06, H * 0.58); }
      // 角落编号
      ctx.fillStyle = bg === RED ? BLK : RED;
      ctx.font = `700 ${34 * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(subCode, 56 * u, 48 * u);
      ctx.restore();
    };

    // =========================================================================
    // 段 1 (0.0 - 2.4s)：高速单点走廊推进 + 4~6 帧红黑白文字闪切交替
    // =========================================================================
    if (t < 2.4) {
      const slots = [
        [0.00, 0.36, 'tunnel', 0],
        [0.36, 0.56, 'card', '零', RED, BLK, 'LINE // 00', 'tl'],
        [0.56, 0.96, 'tunnel', 1],
        [0.96, 1.14, 'card', '点', WHT, BLK, 'TIME // 00:00', 'br'],
        [1.14, 1.54, 'stairs', 0],
        [1.54, 1.72, 'card', '未', BLK, RED, 'NO STOP', 'tr'],
        [1.72, 2.16, 'tunnel', 2],
        [2.16, 2.40, 'card', '停', RED, WHT, 'CAR #00', 'bl'],
      ];
      const cur = slots.find(x => t >= x[0] && t < x[1]) || slots[slots.length - 1];
      const lf = Math.floor((t - cur[0]) * FPS);
      if (cur[2] === 'tunnel') {
        const invSwap = lf < 2 && cur[3] > 0; // 2帧红黑对调反相冲刺
        drawTunnel([0, 0, W, H], t * 6.5, invSwap);
        // 右上角时钟读数
        ctx.fillStyle = invSwap ? WHT : RED;
        ctx.font = `700 ${42 * u}px 'JetBrains Mono'`;
        ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillText('23:59:58', W - 56 * u, 48 * u);
      } else if (cur[2] === 'stairs') {
        drawStairs([0, 0, W, H], t * 4, (t - 1.14) * 28);
      } else {
        drawFlashCard(cur[3], cur[4], cur[5], cur[6], cur[7], lf);
      }
      return;
    }

    // =========================================================================
    // 段 2 (2.4 - 5.2s)：固定角色色发言边栏 + 中景硬切（楼梯/站台时钟/节拍跳步剪影）
    // =========================================================================
    if (t < 5.2) {
      const stageB = t >= 3.8; // 3.8s 切换到站务黑边栏回应
      const rSlam = stageB ? inv(3.8, 3.9, t) : inv(2.4, 2.5, t);
      const railW = LAND ? 240 * u : 0;
      const vp = LAND
        ? (stageB ? [0, 0, W - railW, H] : [railW, 0, W - railW, H])
        : (stageB ? [0, 0, W, H - 250 * u] : [0, 250 * u, W, H - 250 * u]);
      const [vx, vy, vw, vh] = vp;
      // 每拍（0.4s）切换不同几何景别与节拍跳近剪影（绝不平滑补间人物距离）
      const beatIdx = Math.floor((t - 2.4) / 0.4);
      if (beatIdx % 3 === 0) {
        drawStairs(vp, beatIdx, t * 14);
      } else if (beatIdx % 3 === 1) {
        drawTunnel(vp, 3 + beatIdx * 0.7 + (t - 2.4) * 3.5, (frame % 12) < 1);
      } else {
        // 站台极简网格 + 巨型跳变数字钟
        ctx.save(); ctx.beginPath(); ctx.rect(vx, vy, vw, vh); ctx.clip();
        ctx.fillStyle = BLK; ctx.fillRect(vx, vy, vw, vh);
        ctx.strokeStyle = '#26262A'; ctx.lineWidth = 2 * u;
        for (let x = vx; x < vx + vw; x += 120 * u) { ctx.beginPath(); ctx.moveTo(x, vy); ctx.lineTo(x, vy + vh); ctx.stroke(); }
        for (let y = vy; y < vy + vh; y += 120 * u) { ctx.beginPath(); ctx.moveTo(vx, y); ctx.lineTo(vx + vw, y); ctx.stroke(); }
        // 一格刺眼红窗（硬切推入元素）
        ctx.fillStyle = RED;
        ctx.fillRect(vx + vw * 0.58, vy + vh * 0.22, vw * 0.24, vh * 0.34);
        ctx.fillStyle = WHT; ctx.font = `700 ${110 * u}px 'JetBrains Mono'`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(stageB ? '00:00:00' : '23:59:59', vx + 52 * u, vy + 52 * u);
        ctx.restore();
      }

      // 节拍跳步剪影（1拍跳近1级）
      const stepScale = [0.36, 0.45, 0.56, 0.68, 0.80, 0.92, 1.04][Math.min(6, beatIdx)];
      ctx.save(); ctx.beginPath(); ctx.rect(vx, vy, vw, vh); ctx.clip();
      const ch = vh * 0.86 * stepScale, cw = ch * (s.backSil.width / s.backSil.height);
      const bob = (beatIdx % 2) * 8 * u;
      ctx.drawImage(s.backSil, vx + vw * 0.58 - cw / 2, vy + vh - ch * 0.95 + bob, cw, ch);
      ctx.restore();

      if (!stageB) {
        drawRail('left', RED, BLK, '车', ['别回头，这班车', '没有终点站。'], 'THE LAST TRAIN NEVER STOPS', rSlam);
      } else {
        drawRail('right', BLK, WHT, '站', ['零点已过，请立刻', '离开站台！'], 'VACATE THE PLATFORM NOW', rSlam);
      }
      return;
    }

    // =========================================================================
    // 段 3 (5.2 - 7.6s)：招牌绝技 —— 背身剪影 → 蓄力 → 三重残影甩头 → 2帧红黑对调切平涂回头
    // =========================================================================
    if (t < 7.6) {
      const localT = t - 5.2;
      const inTurn = t >= 5.95; // 5.95s 开始蓄力 + 甩头 + 落地定格（still=6.4s 正好看到刚猛回头的红黑高反差全彩！）
      const swapFlash = t >= 6.26 && t < 6.33; // 落地瞬间 2 帧红黑对调

      // 底景：高反差建筑走廊 + 白色门洞（保证黑剪影绝对清晰不消失！）
      ctx.fillStyle = swapFlash ? RED : BLK; ctx.fillRect(0, 0, W, H);
      // 斜切光柱 / 白色门框
      const doorW = LAND ? W * 0.38 : W * 0.66, doorH = LAND ? H * 0.92 : H * 0.72;
      const doorX = LAND ? W * 0.44 : W * 0.22, doorY = LAND ? H * 0.08 : H * 0.18;
      ctx.fillStyle = swapFlash ? BLK : WHT;
      ctx.fillRect(doorX, doorY, doorW, doorH);
      // 红色竖光带撕裂门框一侧
      ctx.fillStyle = swapFlash ? WHT : RED;
      ctx.fillRect(doorX - 18 * u, doorY, 18 * u, doorH);

      if (!inTurn) {
        // 极致偏位背影站立剪影 + 节拍微推与计时脉冲（避免静止帧）
        const img = s.backSil;
        const microZoom = lerp(1.0, 1.07, inv(5.2, 5.95, t));
        const th = (LAND ? H * 0.88 : H * 0.72) * microZoom, tw = th * (img.width / img.height);
        ctx.drawImage(img, doorX + doorW * 0.5 - tw * 0.5, H - th, tw, th);
        drawVertText('零点正。', LAND ? 130 * u : 110 * u, 110 * u, 56 * u, WHT);
        ctx.fillStyle = RED; ctx.fillRect(doorX, H - 12 * u, doorW * inv(5.2, 5.95, t), 8 * u);
      } else {
        const dt = t - 5.95; // 0..1.65s
        let rot = 0;
        let showColor = false;
        let zoom = 1.0;
        if (dt < 0.07) {
          rot = lerp(0, -0.09, dt / 0.07);
        } else if (dt < 0.31) {
          const p = (dt - 0.07) / 0.24;
          rot = lerp(-0.09, 0.11, eOutCubic(p));
          zoom = lerp(1.0, 1.07, p);
        } else {
          const settleT = dt - 0.31;
          rot = 0.095 * Math.exp(-8.5 * settleT) * Math.cos(24 * settleT);
          showColor = true;
          zoom = lerp(1.07, 1.13, clamp(settleT / 1.3));
        }

        const img = swapFlash ? s.turnSwap : (showColor ? s.charTurn : s.turnSil);
        const baseH = (LAND ? H * 0.96 : H * 0.76) * zoom;
        const baseW = baseH * (img.width / img.height);
        const cx = LAND ? W * 0.54 : W * 0.50;
        const cy = H;

        if (!showColor && dt >= 0.07) {
          for (let g = 3; g >= 1; g--) {
            ctx.save();
            ctx.globalAlpha = 0.28 / g;
            ctx.translate(cx, cy);
            ctx.rotate(rot - g * 0.045);
            ctx.drawImage(s.turnSil, -baseW * 0.5, -baseH, baseW, baseH);
            ctx.restore();
          }
        }
        const jx = showColor ? Math.round((hash2(frame, 3) - 0.5) * 3 * u) : 0;
        ctx.save();
        ctx.translate(cx + jx, cy);
        ctx.rotate(rot);
        ctx.drawImage(img, -baseW * 0.5, -baseH, baseW, baseH);
        ctx.restore();

        if (showColor && !swapFlash) {
          ctx.fillStyle = RED;
          ctx.fillRect(LAND ? 72 * u : 46 * u, 88 * u, 14 * u, 280 * u * inv(0.30, 0.90, dt));
          drawVertText('别回头。', LAND ? 142 * u : 108 * u, 118 * u, 60 * u, WHT);
          ctx.fillStyle = GREY; ctx.font = `italic 400 ${26 * u}px 'Playfair Display'`;
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.fillText('DON\'T LOOK BACK', LAND ? 72 * u : 46 * u, 396 * u);
        }
      }
      return;
    }

    // =========================================================================
    // 段 4 (7.6 - 10.0s)：倒计时加速闪切（6f→4f→3f）+ 1:1 眼部大特写横条切入
    // =========================================================================
    if (t < 10.0) {
      if (t < 8.75) {
        const seq = [
          [7.60, 7.80, 'card', '三', WHT, BLK, 'COUNT // 03', 'tl'],
          [7.80, 7.98, 'tunnel', 0],
          [7.98, 8.14, 'card', '二', RED, BLK, 'COUNT // 02', 'tr'],
          [8.14, 8.30, 'stairs', 1],
          [8.30, 8.43, 'card', '一', BLK, RED, 'COUNT // 01', 'br'],
          [8.43, 8.56, 'tunnel', 1],
          [8.56, 8.75, 'card', '零', RED, WHT, 'ZERO HOUR', 'bl'],
        ];
        const cur = seq.find(x => t >= x[0] && t < x[1]) || seq[seq.length - 1];
        const lf = Math.floor((t - cur[0]) * FPS);
        if (cur[2] === 'tunnel') drawTunnel([0, 0, W, H], 8 + t * 12, true);
        else if (cur[2] === 'stairs') drawStairs([0, 0, W, H], t * 9, t * 24);
        else drawFlashCard(cur[3], cur[4], cur[5], cur[6], cur[7], lf);
      } else {
        // 局部特写大条插入：眼部贴近 1:1 慢推 + 极速红色脉冲线
        const lt = t - 8.75;
        const lf = Math.floor(lt * FPS);
        const swap = lf === 0 || lf === 1 || lf === 18;
        ctx.fillStyle = BLK; ctx.fillRect(0, 0, W, H);
        const bandH = LAND ? H * 0.56 : H * 0.36;
        const bandY = (H - bandH) / 2;
        const { sc, jx, jy } = slamXform(lf, 16);
        ctx.save();
        ctx.beginPath(); ctx.rect(0, bandY, W, bandH); ctx.clip();
        drawCover(ctx, swap ? s.eyeSwap : s.charEye, jx, bandY + jy, W, bandH, { zoom: 1.06 * sc + lt * 0.08 });
        // 速度红线穿透视野
        ctx.strokeStyle = RED; ctx.lineWidth = 5 * u;
        for (let i = 0; i < 6; i++) {
          const ly = bandY + hash2(frame, i * 7) * bandH;
          ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
        }
        ctx.restore();
        // 上下黑框压条上的单字标签
        ctx.fillStyle = RED; ctx.fillRect(0, bandY - 8 * u, W, 8 * u);
        ctx.fillRect(0, bandY + bandH, W, 8 * u);
        ctx.fillStyle = WHT; ctx.font = `900 ${42 * u}px 'Noto Sans SC'`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('下一站：空轨', 56 * u, bandY - 26 * u);
        ctx.fillStyle = GREY; ctx.font = `italic 400 ${28 * u}px 'Playfair Display'`;
        ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillText('NEXT STATION: NOWHERE', W - 56 * u, bandY + bandH + 26 * u);
      }
      return;
    }

    // =========================================================================
    // 段 5 (10.0 - 12.0s)：红色光隙切开黑幕 → 不对称大标题终点卡
    // =========================================================================
    const dt = t - 10.0;
    const slitOpen = eOutExpo(inv(0.0, 0.24, dt));
    const endZoom = lerp(1.0, 1.03, dt / 2.0);
    ctx.fillStyle = BLK; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(endZoom, endZoom); ctx.translate(-W / 2, -H / 2);
    // 红色切条横扫展开左侧/上方版块
    if (LAND) {
      const barW = W * 0.34 * slitOpen;
      ctx.fillStyle = RED; ctx.fillRect(0, 0, barW, H);
      if (slitOpen > 0.35) {
        drawVertText('零点末班车', barW * 0.52, 160 * u, 118 * u, BLK, 1.08);
      }
      ctx.fillStyle = WHT; ctx.font = `900 ${92 * u}px 'Noto Serif SC'`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('第 00 话 · 终点', W * 0.42, H * 0.26);
      ctx.fillStyle = GREY; ctx.font = `italic 400 ${36 * u}px 'Playfair Display'`;
      ctx.fillText('Midnight Line 00 — Avant-Garde Short Drama', W * 0.42, H * 0.40);
      // 连续推进的红色信号扫描线 + 时间码（保证终点卡每帧活跃）
      ctx.fillStyle = RED; ctx.fillRect(W * 0.42, H * 0.52, W * 0.46 * (dt / 2.0), 6 * u);
      ctx.fillStyle = GREY; ctx.font = `700 ${28 * u}px 'JetBrains Mono'`;
      ctx.fillText(`00:00:${String(Math.floor(dt * 30)).padStart(2, '0')}`, W * 0.42, H * 0.55);
      // 左下红框印章「终」
      ctx.fillStyle = RED; ctx.fillRect(W * 0.42, H * 0.70, 96 * u, 96 * u);
      ctx.fillStyle = BLK; ctx.font = `900 ${54 * u}px 'Noto Serif SC'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('终', W * 0.42 + 48 * u, H * 0.70 + 48 * u);
    } else {
      const barH = H * 0.34 * slitOpen;
      ctx.fillStyle = RED; ctx.fillRect(0, 0, W, barH);
      if (slitOpen > 0.35) {
        ctx.fillStyle = BLK; ctx.font = `900 ${112 * u}px 'Noto Serif SC'`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('零点末班车', 64 * u, barH * 0.56);
      }
      ctx.fillStyle = WHT; ctx.font = `900 ${74 * u}px 'Noto Serif SC'`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('第 00 话 · 终点', 64 * u, H * 0.44);
      ctx.fillStyle = GREY; ctx.font = `italic 400 ${32 * u}px 'Playfair Display'`;
      ctx.fillText('Midnight Line 00 — Trailer', 64 * u, H * 0.53);
      ctx.fillStyle = RED; ctx.fillRect(64 * u, H * 0.62, (W - 128 * u) * (dt / 2.0), 6 * u);
      ctx.fillStyle = GREY; ctx.font = `700 ${26 * u}px 'JetBrains Mono'`;
      ctx.fillText(`00:00:${String(Math.floor(dt * 30)).padStart(2, '0')}`, 64 * u, H * 0.65);
      ctx.fillStyle = RED; ctx.fillRect(64 * u, H * 0.76, 100 * u, 100 * u);
      ctx.fillStyle = BLK; ctx.font = `900 ${58 * u}px 'Noto Serif SC'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('终', 114 * u, H * 0.76 + 50 * u);
    }
    ctx.restore();
  },
});
