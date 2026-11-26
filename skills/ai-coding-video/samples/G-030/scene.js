// G-030 黑白漫画分格（manga-panels）：暖纸 #F3F0E8 + G 笔墨线 + Python 预处理 45° AM 网点 + 唯一专色朱红 #F03C1E +
// 右→左斜切分格按拍推进 + 白フチ破格飞跃 + 8fps 抖动拟声字 + 1→2→4→8→16 爆裂分格 + 静默「間」落针格 + 奥付版权收尾
scene({
  id: 'G-030',
  name: '黑白漫画分格',
  dur: 12.5,
  still: 7.2,
  fonts: [
    "900 120px 'Noto Sans SC'",
    "900 48px 'Noto Serif SC'",
    "400 38px 'ZCOOL KuaiLe'",
    "400 32px 'Bebas Neue'",
    "700 26px 'JetBrains Mono'",
  ],
  text: '黑胶速递零点九号订单限时九分钟黑胶不等人唰轰咔哒第一话完极夜印刷所限量七寸黑胶',

  async init() {
    const A = await loadAssets();
    const [grab, needle, hero] = await Promise.all([
      loadImage('panel_grab.jpg'),
      loadImage('panel_needle.jpg'),
      loadImage('hero_leap.png'),
    ]);
    const PAPER = '#F3F0E8', INK = '#121212', ACC = '#F03C1E';
    const paperTex = makePaper(PAPER, { w: 512, h: 512, grain: 14, fiber: 0.45, blot: 8, seed: 30 });

    // 代码生成 45° 网点图案画布（背景渐变/情绪网点用，绝不用平滑灰渐变）
    const makeDotTone = (w, h, covFn, cell = 9) => {
      const c = mk(w, h), g = c.getContext('2d');
      const diag = Math.hypot(w, h);
      g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
      g.fillStyle = INK;
      const step = cell;
      for (let py = 0; py < h; py += step) {
        for (let px = (Math.floor(py / step) % 2) * (step / 2); px < w; px += step) {
          const cov = clamp(covFn(px / w, py / h), 0, 0.75);
          if (cov < 0.04) continue;
          const r = Math.sqrt(cov) * step * 0.46;
          g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill();
        }
      }
      return c;
    };
    const skyTone = makeDotTone(640, 360, (u, v) => 0.42 * (1 - v * 0.85), 9);
    const radialTone = makeDotTone(520, 520, (u, v) => clamp(1 - Math.hypot(u - 0.5, v - 0.5) * 1.65, 0, 0.55), 10);

    // 速度线 / 集中线（8–12fps 逐帧换种子抖动 boil）
    return { A, PAPER, INK, ACC, paperTex, skyTone, radialTone, grab, needle, hero };
  },

  draw(ctx, t, s) {
    const u = SHORT / 1080;
    const { PAPER, INK, ACC } = s;
    const boilSeed = Math.floor(stepT(t, 10) * 10) + 1;

    // 底纸铺满
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.25; ctx.drawImage(s.paperTex, 0, 0, W, H); ctx.restore();

    // 画一格带 7px 实心黑框、斜边裁剪与方向擦除进场的漫画分格
    const drawPanel = (pts, pEnter, drawInner, opts = {}) => {
      if (pEnter <= 0.01) return;
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
      const pw = x1 - x0, ph = y1 - y0;
      const wipe = eOutCubic(clamp(pEnter));
      const slide = (1 - eOutCubic(clamp(pEnter * 1.1))) * 70 * u;

      ctx.save();
      ctx.beginPath();
      pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.clip();

      // 读格方向擦除遮罩（默认右→左擦开）
      if (wipe < 0.999) {
        const ww = pw * wipe;
        ctx.beginPath();
        ctx.rect(opts.ltr ? x0 : x1 - ww, y0, ww, ph);
        ctx.clip();
      }
      ctx.fillStyle = opts.invert ? INK : PAPER;
      ctx.fillRect(x0, y0, pw, ph);
      ctx.save();
      ctx.translate(opts.ltr ? -slide : slide, 0);
      drawInner(x0, y0, pw, ph);
      ctx.restore();
      ctx.restore();

      // 7px 锐利黑框（绝不虚线，除非空镜；默认实线 G 笔外框）
      ctx.save();
      ctx.strokeStyle = opts.invert ? PAPER : INK;
      ctx.lineWidth = (opts.border || 7) * u;
      ctx.lineJoin = 'miter';
      if (opts.dashed) ctx.setLineDash([16 * u, 12 * u]);
      ctx.beginPath();
      pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath(); ctx.stroke();
      ctx.restore();
    };

    // 绘制集中线 / 速度线
    const drawFocusLines = (cx, cy, rMin, rMax, count, seed, col = INK) => {
      const R = mulberry32(seed);
      ctx.save(); ctx.fillStyle = col;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU + (R() - 0.5) * 0.04;
        const r0 = rMin * (0.85 + R() * 0.35), w = (0.008 + R() * 0.016);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a - w) * rMax, cy + Math.sin(a - w) * rMax);
        ctx.lineTo(cx + Math.cos(a + w) * rMax, cy + Math.sin(a + w) * rMax);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    };

    // 手绘立体抖动拟声字（3层：粗墨外描边 0.34x → 暖纸白描边 0.25x → 墨心，10fps boil）
    const drawSFX = (txt, x, y, size, localT, rotDeg = -10) => {
      if (localT < 0) return;
      const p = clamp(localT / 0.22);
      const sc = lerp(1.75, 1.0, eOutBack(p, 1.8));
      const jx = (hash2(boilSeed, 3) - 0.5) * 3.5 * u;
      const jy = (hash2(boilSeed, 7) - 0.5) * 3.5 * u;
      ctx.save();
      ctx.translate(x + jx, y + jy);
      ctx.rotate((rotDeg * Math.PI) / 180);
      ctx.scale(sc, sc);
      ctx.font = `900 ${size * u}px 'Noto Sans SC'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = INK; ctx.lineWidth = size * u * 0.34; ctx.strokeText(txt, 0, 0);
      ctx.strokeStyle = PAPER; ctx.lineWidth = size * u * 0.22; ctx.strokeText(txt, 0, 0);
      ctx.fillStyle = INK; ctx.fillText(txt, 0, 0);
      ctx.restore();
    };

    // 旁白叙事方框（5px 黑框 + 右下纯黑投影，逐字显现）
    const drawNarrationBox = (text, x, y, w, size, charRatio, vertical = false) => {
      const shown = text.slice(0, Math.max(1, Math.floor(text.length * clamp(charRatio))));
      ctx.save();
      ctx.font = `900 ${size * u}px 'Noto Serif SC'`;
      if (vertical) {
        const bw = size * u * 1.85, bh = (text.length + 0.8) * size * u * 1.15;
        ctx.fillStyle = INK; ctx.fillRect(x + 8 * u, y + 8 * u, bw, bh);
        ctx.fillStyle = PAPER; ctx.fillRect(x, y, bw, bh);
        ctx.strokeStyle = INK; ctx.lineWidth = 5 * u; ctx.strokeRect(x, y, bw, bh);
        ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let i = 0; i < shown.length; i++) {
          ctx.fillText(shown[i], x + bw / 2, y + (i + 0.85) * size * u * 1.12);
        }
      } else {
        const bw = w, bh = size * u * 1.7;
        ctx.fillStyle = INK; ctx.fillRect(x + 8 * u, y + 8 * u, bw, bh);
        ctx.fillStyle = PAPER; ctx.fillRect(x, y, bw, bh);
        ctx.strokeStyle = INK; ctx.lineWidth = 5 * u; ctx.strokeRect(x, y, bw, bh);
        ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(shown, x + 22 * u, y + bh / 2);
      }
      ctx.restore();
    };

    // =========================================================================
    // 段 1 (0.0 - 2.6s)：扉页与右→左斜切分格推进（抓起唯一朱红 7 寸黑胶）
    // =========================================================================
    if (t < 2.6) {
      const m = 42 * u, g = 24 * u;
      if (LAND) {
        // 第1格（右上先入！）：手抓红黑胶特写 + 旁白方框
        const p1 = inv(0.0, 0.25, t);
        const topR = [[W * 0.36, m], [W - m, m], [W - m, H * 0.54], [W * 0.28, H * 0.58]];
        drawPanel(topR, p1, (x, y, w, h) => {
          drawCover(ctx, s.grab, x, y, w, h, { zoom: lerp(1.06, 1.0, p1) });
          drawFocusLines(x + w * 0.45, y + h * 0.6, 140 * u, 680 * u, 28, boilSeed);
        });
        if (t > 0.15) drawNarrationBox('零点九号订单：', W * 0.88 - 80 * u, m + 36 * u, 0, 38, inv(0.15, 0.9, t), true);

        // 第2格（左上 0.8s 入）：城市夜幕网点天际线 + 倒计时「限时九分钟」
        const p2 = inv(0.8, 1.05, t);
        const topL = [[m, m], [W * 0.36 - g, m], [W * 0.28 - g, H * 0.58], [m, H * 0.52]];
        drawPanel(topL, p2, (x, y, w, h) => {
          ctx.drawImage(s.skyTone, x, y, w, h);
          // 建筑剪影（纯墨色剪影，绝不模糊）
          ctx.fillStyle = INK;
          for (let i = 0; i < 6; i++) {
            const bw = w * (0.14 + hash1(i + 5) * 0.12), bh = h * (0.28 + hash1(i + 20) * 0.35);
            ctx.fillRect(x + i * w * 0.17, y + h - bh, bw, bh);
          }
          // 唯一朱红指示标点
          ctx.fillStyle = ACC; ctx.beginPath(); ctx.arc(x + w * 0.5, y + h * 0.32, 22 * u, 0, TAU); ctx.fill();
        });

        // 第3格（底部宽幅 1.4s 入）：街灯速线冲击 + 拟声字「唰!!」
        const p3 = inv(1.4, 1.65, t);
        const bot = [[m, H * 0.52 + g], [W * 0.28, H * 0.58 + g], [W - m, H * 0.54 + g], [W - m, H - m], [m, H - m]];
        drawPanel(bot, p3, (x, y, w, h) => {
          ctx.fillStyle = INK; ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = PAPER; ctx.lineWidth = 3 * u;
          for (let i = 0; i < 36; i++) {
            const ly = y + (i / 36) * h;
            const off = ((t * 1800 + i * 190) % w);
            ctx.beginPath(); ctx.moveTo(x + w - off, ly); ctx.lineTo(x + w - off - 260 * u, ly); ctx.stroke();
          }
          ctx.fillStyle = PAPER; ctx.font = `900 ${96 * u}px 'Noto Sans SC'`;
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText('限时九分钟', x + 72 * u, y + h * 0.52);
          ctx.fillStyle = ACC; ctx.fillRect(x + 72 * u, y + h * 0.72, 260 * u, 10 * u);
        });
        if (t >= 1.55) drawSFX('唰!!', W * 0.74, H * 0.68, 128, t - 1.55, -12);
      } else {
        // 竖屏 9:16 漫画页三段式（上右/上左/下）
        const p1 = inv(0.0, 0.25, t);
        drawPanel([[m, m], [W - m, m], [W - m, H * 0.42], [m, H * 0.46]], p1, (x, y, w, h) => {
          drawCover(ctx, s.grab, x, y, w, h, { zoom: lerp(1.06, 1.0, p1) });
          drawFocusLines(x + w * 0.5, y + h * 0.55, 110 * u, 520 * u, 24, boilSeed);
        });
        if (t > 0.15) drawNarrationBox('零点九号订单：', W - m - 96 * u, m + 28 * u, 0, 34, inv(0.15, 0.9, t), true);
        const p2 = inv(0.8, 1.05, t);
        drawPanel([[m, H * 0.46 + g], [W - m, H * 0.42 + g], [W - m, H * 0.69], [m, H * 0.69]], p2, (x, y, w, h) => {
          ctx.drawImage(s.skyTone, x, y, w, h);
          ctx.fillStyle = INK;
          for (let i = 0; i < 7; i++) ctx.fillRect(x + i * w * 0.15, y + h * (0.45 + (i % 3) * 0.12), w * 0.13, h * 0.6);
        });
        const p3 = inv(1.4, 1.65, t);
        drawPanel([[m, H * 0.69 + g], [W - m, H * 0.69 + g], [W - m, H - m], [m, H - m]], p3, (x, y, w, h) => {
          ctx.fillStyle = INK; ctx.fillRect(x, y, w, h);
          ctx.fillStyle = PAPER; ctx.font = `900 ${78 * u}px 'Noto Sans SC'`;
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText('限时九分钟', x + 52 * u, y + h * 0.5);
          ctx.fillStyle = ACC; ctx.fillRect(x + 52 * u, y + h * 0.66, 220 * u, 10 * u);
        });
        if (t >= 1.55) drawSFX('唰!!', W * 0.78, H * 0.80, 110, t - 1.55, -12);
      }
      return;
    }

    // =========================================================================
    // 段 2 (2.6 - 6.2s)：白フチ出格（Break the Frame）+ 过沟横移 + 手绘大喊
    // =========================================================================
    if (t < 6.2) {
      const dt = t - 2.6;
      const panX = lerp(90 * u, -90 * u, smooth(0, 3.6, dt));
      const m = 48 * u, g = 34 * u;
      // 背景三格漫画沿着沟壑从右往左排列
      ctx.save();
      ctx.translate(panX, 0);
      const cols = LAND
        ? [[W * 0.64, m, W * 0.34, H - 2 * m], [W * 0.31, m, W * 0.31, H - 2 * m], [0, m, W * 0.29, H - 2 * m]]
        : [[m, m, W - 2 * m, H * 0.28], [m, m + H * 0.31, W - 2 * m, H * 0.30], [m, m + H * 0.64, W - 2 * m, H * 0.30]];

      cols.forEach((b, idx) => {
        const enter = inv(idx * 0.32, idx * 0.32 + 0.22, dt);
        const [bx, by, bw, bh] = b;
        const slant = (idx % 2 ? -1 : 1) * 18 * u;
        const poly = [[bx, by], [bx + bw, by + slant], [bx + bw - slant * 0.4, by + bh], [bx, by + bh - slant * 0.6]];
        drawPanel(poly, enter, (x, y, w, h) => {
          ctx.drawImage(idx === 1 ? s.radialTone : s.skyTone, x, y, w, h);
          // 横向高速掠影线（10fps boil）
          ctx.strokeStyle = INK; ctx.lineWidth = 3 * u;
          for (let k = 0; k < 22; k++) {
            const yy = y + (k / 22) * h;
            const len = (0.3 + hash2(boilSeed, k) * 0.6) * w;
            ctx.beginPath(); ctx.moveTo(x + w, yy); ctx.lineTo(x + w - len, yy + 18 * u); ctx.stroke();
          }
          // 唯一红标点线索（路线刻度）
          if (idx === 0) {
            ctx.fillStyle = ACC; ctx.fillRect(x + w * 0.15, y + h * 0.72, w * 0.7, 10 * u);
          }
        });
      });
      ctx.restore();

      // 破格核心（白フチ hero_leap.png 直接压在所有分格边框与沟壑上方！！）
      const heroIn = eOutBack(inv(0.45, 0.85, dt), 1.4);
      const bobY = Math.sin(dt * 12) * 8 * u;
      const hx = lerp(W * 1.18, LAND ? W * 0.52 : W * 0.52, heroIn);
      const hy = lerp(H * 0.62, LAND ? H * 0.51 : H * 0.52, heroIn) + bobY;
      const hh = (LAND ? H * 0.90 : H * 0.62), hw = hh * (s.hero.width / s.hero.height);

      // 集中线在角色背后爆开
      if (dt > 0.5) drawFocusLines(hx, hy, hw * 0.38, LONG * 0.75, 42, boilSeed);
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(-0.06);
      ctx.drawImage(s.hero, -hw / 2, -hh / 2, hw, hh);
      ctx.restore();

      // 拟声字与竖写喊话（不被白框掩盖）
      if (dt > 0.65) drawSFX('轰!!', LAND ? W * 0.22 : W * 0.22, LAND ? H * 0.30 : H * 0.24, 134, dt - 0.65, -8);
      if (dt > 0.90) {
        drawNarrationBox('「黑胶不等人！」', LAND ? W * 0.76 : W * 0.52, LAND ? H * 0.14 : H * 0.83, 0, LAND ? 46 : 40, inv(0.90, 1.45, dt), LAND);
      }
      return;
    }

    // =========================================================================
    // 段 3 (6.2 - 8.2s)：爆裂分格（1 → 2 → 4 → 8 → 16，still=7.2s 停在精彩 4/8 分裂时刻）
    // =========================================================================
    if (t < 8.2) {
      const dt = t - 6.2;
      // 0..0.4s: 1格; 0.4..0.8s: 2格; 0.8..1.25s: 4格; 1.25..1.65s: 8格; 1.65..2.0s: 16格
      const stage = dt < 0.4 ? 1 : dt < 0.8 ? 2 : dt < 1.25 ? 4 : dt < 1.65 ? 8 : 16;
      const impactInv = (dt >= 1.38 && dt < 1.45) || (dt >= 1.72 && dt < 1.78); // 2帧黑底反白冲击帧（错开 still=7.2s）
      if (impactInv) {
        ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
        drawFocusLines(W / 2, H / 2, 80 * u, LONG * 0.8, 56, boilSeed, PAPER);
        return;
      }
      const cols = stage === 1 ? 1 : stage === 2 ? (LAND ? 2 : 1) : stage === 4 ? 2 : stage === 8 ? (LAND ? 4 : 2) : 4;
      const rows = stage / cols;
      const pad = 28 * u, gap = Math.max(10 * u, 22 * u - stage * 0.7 * u);
      const cw = (W - 2 * pad - (cols - 1) * gap) / cols;
      const ch = (H - 2 * pad - (rows - 1) * gap) / rows;

      // 阅读顺序右→左，上→下编号渲染每一分格
      for (let r = 0; r < rows; r++) {
        for (let cInv = 0; cInv < cols; cInv++) {
          const c = cols - 1 - cInv; // 右→左顺序
          const cellNum = r * cols + cInv + 1;
          const x = pad + c * (cw + gap), y = pad + r * (ch + gap);
          const poly = [[x, y], [x + cw, y], [x + cw, y + ch], [x, y + ch]];
          const isAccCell = cellNum === stage || (cellNum % 3 === 0);
          drawPanel(poly, 1, (px, py, pw, ph) => {
            ctx.drawImage(isAccCell ? s.radialTone : s.skyTone, px, py, pw, ph);
            // 裁切不同倍率下的骑手动作与黑胶局部
            const useSrc = cellNum % 2 === 1 ? s.hero : s.grab;
            drawCover(ctx, useSrc, px, py, pw, ph, {
              zoom: 1.05 + (cellNum % 4) * 0.18,
              fx: 0.25 + (cellNum % 3) * 0.25,
              fy: 0.2 + (r / Math.max(1, rows)) * 0.5,
            });
            // 编号角标
            ctx.fillStyle = isAccCell ? ACC : INK;
            ctx.fillRect(px + pw - 52 * u, py, 52 * u, 36 * u);
            ctx.fillStyle = PAPER; ctx.font = `700 ${20 * u}px 'JetBrains Mono'`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(String(cellNum).padStart(2, '0'), px + pw - 26 * u, py + 18 * u);
          }, { border: Math.max(4, 8 - stage * 0.2) });
        }
      }
      if (stage >= 4) drawSFX('冲!!', W * 0.5, H * 0.5, 118, (dt - 0.8) % 0.45, -6);
      return;
    }

    // =========================================================================
    // 段 4 (8.2 - 10.5s)：静默「間」格 —— 宽阔空白、单一静谧大格、无字无特效，仅有一枚四芒星闪
    // =========================================================================
    if (t < 10.5) {
      const dt = t - 8.2;
      const pw = LAND ? W * 0.72 : W * 0.86, ph = LAND ? H * 0.56 : H * 0.42;
      const px = (W - pw) / 2, py = (H - ph) / 2;
      drawPanel([[px, py], [px + pw, py], [px + pw, py + ph], [px, py + ph]], 1, (x, y, w, h) => {
        drawCover(ctx, s.needle, x, y, w, h, { zoom: lerp(1.0, 1.06, dt / 2.3) });
      }, { border: 7 });
      // 单枚呼吸白色四芒星高光（无声音、无字、无抖动）
      const pulse = 0.5 + 0.5 * Math.sin(dt * 3.8);
      const sx = px + pw * 0.52, sy = py + ph * 0.44, sr = (18 + 10 * pulse) * u;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 3 * u;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4, rr = i % 2 === 0 ? sr : sr * 0.24;
        ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      return;
    }

    // =========================================================================
    // 段 5 (10.5 - 12.5s)：尾页奥付（Colophon 版权格 + 朱红 7 寸黑胶标记）
    // =========================================================================
    const dt = t - 10.5;
    const pCol = inv(0.0, 0.35, dt);
    const cw = LAND ? 760 * u : W * 0.84, ch = LAND ? H * 0.72 : H * 0.62;
    const cx = (W - cw) / 2, cy = (H - ch) / 2;
    drawPanel([[cx, cy], [cx + cw, cy], [cx + cw, cy + ch], [cx, cy + ch]], pCol, (x, y, w, h) => {
      ctx.fillStyle = PAPER; ctx.fillRect(x, y, w, h);
      // 内部细线版式框架
      ctx.strokeStyle = INK; ctx.lineWidth = 3 * u;
      ctx.strokeRect(x + 24 * u, y + 24 * u, w - 48 * u, h - 48 * u);
      // 朱红 7 寸黑胶圆形专色印记
      const vr = 82 * u, vx = x + w * 0.24, vy = y + h * 0.5;
      ctx.fillStyle = ACC; ctx.beginPath(); ctx.arc(vx, vy, vr, 0, TAU); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 4 * u; ctx.stroke();
      ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(vx, vy, vr * 0.28, 0, TAU); ctx.fill();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(vx, vy, vr * 0.08, 0, TAU); ctx.fill();
      // 右侧标题与奥付条目
      ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = `900 ${72 * u}px 'Noto Serif SC'`;
      ctx.fillText('黑胶速递', x + w * 0.42, y + h * 0.24);
      ctx.font = `400 ${32 * u}px 'Bebas Neue'`;
      ctx.fillText('VINYL RUNNER 09 · EPISODE 01', x + w * 0.42, y + h * 0.41);
      ctx.strokeStyle = INK; ctx.lineWidth = 2 * u;
      ctx.beginPath(); ctx.moveTo(x + w * 0.42, y + h * 0.50); ctx.lineTo(x + w - 56 * u, y + h * 0.50); ctx.stroke();
      ctx.font = `900 ${28 * u}px 'Noto Serif SC'`;
      ctx.fillText('第一话 · 完', x + w * 0.42, y + h * 0.56);
      ctx.font = `700 ${22 * u}px 'JetBrains Mono'`;
      ctx.fillStyle = '#55534D';
      ctx.fillText('45° SCREENTONE · SPOT #F03C1E', x + w * 0.42, y + h * 0.68);
    }, { border: 7 });
  },
});
