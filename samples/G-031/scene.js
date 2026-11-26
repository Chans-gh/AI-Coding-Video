// G-031 搞笑历史卡通（comic-history）：18 世纪羊皮纸雕版地图底 + 绿幕抠像剪纸人偶（12fps 一拍二弹跳 + 铜质割ピン关节）+
// 三张乱码纸贴拍入 + 红柄剪刀沿虚线剪图 + 撕贴与 1.00m 纸贴层叠 2.5D 倾斜透视 + 漫画页拉远木桌收尾 + Kokoro 旁白
scene({
  id: 'G-031',
  name: '搞笑历史卡通',
  dur: 13.5,
  still: 8.0,
  fonts: [
    "900 44px 'Noto Serif SC'",
    "700 40px 'Noto Sans SC'",
    "400 38px 'ZCOOL KuaiLe'",
    "700 28px 'JetBrains Mono'",
  ],
  text: '一米之争公制米尺的百年拉锯战十八世纪的城镇各有各的尺子量起布来谁也不服谁直到巴黎测量师拿起剪刀贴上统一米尺定天下尺爷米博士我家算三寸标准巴黎子午线',

  async init() {
    const A = await loadAssets();
    const [boss, surv] = await Promise.all([
      loadImage('puppet_boss.png'),
      loadImage('puppet_surveyor.png'),
    ]);
    const PAPER = '#F1E8D2', INK = '#2B2219', SEA = '#A6CCD3', RED = '#C8463A', BRASS = '#D9B158', CARD = '#F5E9C4', TABLE = '#7B6A57';
    const paperTex = makePaper(PAPER, { w: 512, h: 512, grain: 16, fiber: 0.55, blot: 12, seed: 31 });
    return { A, PAPER, INK, SEA, RED, BRASS, CARD, TABLE, paperTex, boss, surv };
  },

  draw(ctx, t, s) {
    const u = SHORT / 1080;
    const { PAPER, INK, SEA, RED, BRASS, CARD, TABLE } = s;
    const t2 = stepT(t, 12); // 人偶按一拍二（12fps）走位与弹跳

    // 在 (x,y,w,h) 格子里画一块 18 世纪印刷雕版地图底
    const drawPrintedMap = (mx, my, mw, mh, seed = 1) => {
      ctx.save();
      ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();
      ctx.fillStyle = PAPER; ctx.fillRect(mx, my, mw, mh);
      // 左侧雕版海岸线与 5 层波纹
      const coast = [];
      for (let i = 0; i <= 14; i++) {
        const py = my + (i / 14) * mh;
        const px = mx + mw * (0.16 + 0.06 * Math.sin(i * 0.9 + seed) + 0.03 * Math.cos(i * 2.1));
        coast.push([px, py]);
      }
      ctx.fillStyle = SEA;
      ctx.beginPath(); ctx.moveTo(mx, my);
      coast.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.lineTo(mx, my + mh); ctx.closePath(); ctx.fill();
      for (let r = 1; r <= 5; r++) {
        ctx.strokeStyle = `rgba(43,34,25,${0.28 - r * 0.04})`; ctx.lineWidth = 1.4 * u;
        ctx.beginPath();
        coast.forEach(([x, y], i) => {
          const ox = x - r * 9 * u;
          i ? ctx.lineTo(ox, y) : ctx.moveTo(ox, y);
        });
        ctx.stroke();
      }
      // 虚线经纬网格
      ctx.strokeStyle = 'rgba(43,34,25,0.20)'; ctx.lineWidth = 1.2 * u;
      ctx.setLineDash([7 * u, 7 * u]);
      for (let gx = mx + mw * 0.25; gx < mx + mw; gx += mw * 0.18) {
        ctx.beginPath(); ctx.moveTo(gx, my); ctx.lineTo(gx, my + mh); ctx.stroke();
      }
      for (let gy = my + mh * 0.22; gy < my + mh; gy += mh * 0.25) {
        ctx.beginPath(); ctx.moveTo(mx, gy); ctx.lineTo(mx + mw, gy); ctx.stroke();
      }
      ctx.setLineDash([]);
      // 印刷城镇版图多边形（带 20% 内亮边 + 细墨边）
      const drawTown = (pts, fillCol, label) => {
        ctx.fillStyle = fillCol;
        ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 6 * u; ctx.stroke();
        ctx.strokeStyle = INK; ctx.lineWidth = 2.4 * u; ctx.stroke();
        const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
        const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
        ctx.fillStyle = INK; ctx.font = `700 ${20 * u}px 'Noto Serif SC'`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy);
      };
      drawTown([[mx + mw * 0.25, my + mh * 0.16], [mx + mw * 0.50, my + mh * 0.12], [mx + mw * 0.54, my + mh * 0.42], [mx + mw * 0.27, my + mh * 0.46]], '#D8CEB4', '旧尺镇');
      drawTown([[mx + mw * 0.52, my + mh * 0.14], [mx + mw * 0.84, my + mh * 0.20], [mx + mw * 0.80, my + mh * 0.50], [mx + mw * 0.54, my + mh * 0.44]], '#C9BFA4', '短码港');
      drawTown([[mx + mw * 0.29, my + mh * 0.47], [mx + mw * 0.62, my + mh * 0.46], [mx + mw * 0.68, my + mh * 0.78], [mx + mw * 0.26, my + mh * 0.74]], '#DDD3BC', '巴黎子午区');

      // 55% 叠加纸纤维纹理
      ctx.globalAlpha = 0.36; ctx.drawImage(s.paperTex, mx, my, mw, mh); ctx.globalAlpha = 1;
      // 罗盘玫瑰 + 比例尺（右上与右下安全区，避开底部字幕带）
      const rx = mx + mw - 78 * u, ry = my + 78 * u;
      ctx.strokeStyle = INK; ctx.lineWidth = 2 * u;
      ctx.beginPath(); ctx.arc(rx, ry, 34 * u, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx, ry - 42 * u); ctx.lineTo(rx, ry + 42 * u);
      ctx.moveTo(rx - 42 * u, ry); ctx.lineTo(rx + 42 * u, ry); ctx.stroke();
      ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(rx, ry - 40 * u); ctx.lineTo(rx - 7 * u, ry); ctx.lineTo(rx + 7 * u, ry); ctx.closePath(); ctx.fill();
      ctx.restore();
    };

    // 绘制不透明剪纸人偶 + 纸面投射阴影 + 铜质割ピン关节铆钉（在 12fps 上跳动）
    const drawPuppet = (img, x, y, h, tiltRad, pins) => {
      const w = h * (img.width / img.height);
      const bounce = Math.abs(Math.sin(t2 * 9.5)) * 12 * u;
      ctx.save();
      ctx.translate(x, y - bounce);
      ctx.rotate(tiltRad);
      // 地图上的大阴影（约 15px 纸厚偏移，纯半透明棕墨，不模糊过度）
      ctx.save();
      ctx.translate(15 * u, 16 * u);
      ctx.globalAlpha = 0.22;
      const sc = mk(64, 64); // 不用临时大画布：直接偏位绘柔暗底椭圆 + 略微偏暗阴影层
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.ellipse(0, -10 * u, w * 0.38, 16 * u, 0, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.drawImage(img, -w / 2, -h, w, h);
      // 关节处的黄铜双脚钉（割ピン）
      for (const [px, py] of pins) {
        const jx = (px - 0.5) * w, jy = (py - 1.0) * h;
        ctx.fillStyle = '#73571C'; ctx.beginPath(); ctx.arc(jx + 1.5 * u, jy + 1.5 * u, 7.5 * u, 0, TAU); ctx.fill();
        ctx.fillStyle = BRASS; ctx.beginPath(); ctx.arc(jx, jy, 7.5 * u, 0, TAU); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 1.6 * u; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(jx - 4 * u, jy); ctx.lineTo(jx + 4 * u, jy); ctx.stroke();
      }
      ctx.restore();
    };

    // 绘制高矮悬殊影子的纸贴（飞在空中大投影 36px，拍扁后仅 4px）
    const drawPatch = (cx, cy, pw, ph, rot, col, label, sub, height01, foldCurl = 0) => {
      const sc = lerp(1.0, 1.24, height01);
      const shOff = lerp(4 * u, 38 * u, height01);
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc);
      ctx.fillStyle = `rgba(43,34,25,${lerp(0.28, 0.16, height01)})`;
      ctx.fillRect(-pw / 2 + shOff, -ph / 2 + shOff, pw, ph);
      // 纸片主体（米白裁边 + 实色油墨 + 虚线车缝）
      ctx.fillStyle = CARD; ctx.fillRect(-pw / 2 - 4 * u, -ph / 2 - 4 * u, pw + 8 * u, ph + 8 * u);
      ctx.fillStyle = col; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.strokeStyle = INK; ctx.lineWidth = 2 * u; ctx.setLineDash([7 * u, 5 * u]);
      ctx.strokeRect(-pw / 2 + 8 * u, -ph / 2 + 8 * u, pw - 16 * u, ph - 16 * u);
      ctx.setLineDash([]);
      if (foldCurl > 0.01) {
        // 掀开一角露出背面米白纸底
        const fs = foldCurl * Math.min(pw, ph) * 0.42;
        ctx.fillStyle = '#DFD2B5';
        ctx.beginPath(); ctx.moveTo(pw / 2, -ph / 2); ctx.lineTo(pw / 2 - fs, -ph / 2); ctx.lineTo(pw / 2, -ph / 2 + fs); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 2 * u; ctx.stroke();
      }
      ctx.fillStyle = '#FAF6EB'; ctx.font = `900 ${Math.round(ph * 0.34)}px 'JetBrains Mono'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, -ph * 0.08);
      if (sub) {
        ctx.font = `700 ${Math.round(ph * 0.22)}px 'Noto Sans SC'`;
        ctx.fillText(sub, 0, ph * 0.24);
      }
      ctx.restore();
    };

    // 绘制尖刺漫画对话框（仅在需要人物台词时）
    const drawSpeech = (bx, by, chLine, enLine, tailX, tailY) => {
      ctx.save();
      ctx.font = `400 ${34 * u}px 'ZCOOL KuaiLe'`;
      const tw = Math.max(ctx.measureText(chLine).width + 64 * u, 260 * u), bh = 88 * u;
      ctx.fillStyle = INK; ctx.fillRect(bx - tw / 2 + 6 * u, by - bh / 2 + 6 * u, tw, bh);
      ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5 * u;
      ctx.fillRect(bx - tw / 2, by - bh / 2, tw, bh);
      ctx.strokeRect(bx - tw / 2, by - bh / 2, tw, bh);
      ctx.beginPath(); ctx.moveTo(bx - 12 * u, by + bh / 2); ctx.lineTo(tailX, tailY); ctx.lineTo(bx + 18 * u, by + bh / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = RED; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(chLine, bx, by - 12 * u);
      ctx.fillStyle = INK; ctx.font = `700 ${19 * u}px 'JetBrains Mono'`;
      ctx.fillText(enLine, bx, by + 23 * u);
      ctx.restore();
    };

    // 绘制正在沿虚线剪纸的红柄剪刀
    const drawScissors = (sx, sy, ang, openAmt) => {
      ctx.save();
      ctx.translate(sx, sy); ctx.rotate(ang);
      const bladeA = 0.14 + openAmt * 0.30;
      for (const sgn of [-1, 1]) {
        ctx.save(); ctx.rotate(sgn * bladeA);
        ctx.fillStyle = '#C9CFD4'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2 * u;
        ctx.beginPath(); ctx.moveTo(-14 * u, 0); ctx.lineTo(54 * u, -sgn * 4 * u); ctx.lineTo(48 * u, sgn * 8 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = RED; ctx.lineWidth = 7 * u;
        ctx.beginPath(); ctx.arc(-28 * u, sgn * 15 * u, 13 * u, 0, TAU); ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = BRASS; ctx.beginPath(); ctx.arc(0, 0, 5 * u, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * u; ctx.stroke();
      ctx.restore();
    };

    // 绘制整个 4 格漫画页内容的通用函数（t < 11.4 全屏占满单格；t >= 11.4 拉远到桌面露出全页 4 格）
    const drawMainStory = (ox, oy, ow, oh) => {
      drawPrintedMap(ox, oy, ow, oh, 1);

      // 阶段 A (0 - 5.2s)：尺爷跳入地图、三张乱码尺码纸贴飞落拍下
      if (t < 5.2) {
        const hopP = eOutBack(inv(0.1, 0.85, t2), 1.3);
        const bx = lerp(ox - ow * 0.18, ox + ow * (LAND ? 0.30 : 0.32), hopP);
        const by = oy + oh * (LAND ? 0.80 : 0.74);
        const ph = oh * (LAND ? 0.56 : 0.44);

        // 三张乱码旧尺码纸贴依次啪啪拍在右半区
        const scraps = [
          { t0: 1.6, tx: ox + ow * 0.64, ty: oy + oh * 0.32, rot: -0.09, col: '#5E7FA8', lbl: '3 尺 = ?', sub: '旧尺镇' },
          { t0: 2.4, tx: ox + ow * 0.78, ty: oy + oh * 0.48, rot: 0.11, col: '#7A8E6E', lbl: '1 码 = !', sub: '短码港' },
          { t0: 3.1, tx: ox + ow * 0.61, ty: oy + oh * 0.60, rot: -0.05, col: '#9B7A54', lbl: '半俄浔', sub: '老市集' },
        ];
        scraps.forEach(sc => {
          if (t < sc.t0) return;
          const dp = inv(sc.t0, sc.t0 + 0.32, t);
          const h01 = 1 - eOutCubic(dp);
          const sy = lerp(sc.ty - 240 * u, sc.ty, eOutCubic(dp));
          drawPatch(sc.tx, sy, 210 * u, 118 * u, sc.rot, sc.col, sc.lbl, sc.sub, h01, 0);
        });

        drawPuppet(s.boss, bx, by, ph, Math.sin(t2 * 6) * 0.04, [[0.56, 0.28], [0.68, 0.44], [0.46, 0.70]]);
        if (t > 0.9 && t < 3.8) {
          drawSpeech(bx + 150 * u, by - ph - 36 * u, '我家一尺算三寸！', '3 CUN PER CHI?!', bx + 20 * u, by - ph * 0.84);
        }
      } else if (t < 7.2) {
        // 阶段 B (5.2 - 7.2s)：剪刀沿着红色虚线剪开旧地图 + 旧尺贴被掀开卷边
        const cutP = inv(5.2, 6.9, t);
        // 先保留三张略微褪暗的旧贴
        drawPatch(ox + ow * 0.64, oy + oh * 0.32, 210 * u, 118 * u, -0.09, '#5E7FA8', '作废', '旧尺镇', 0, inv(6.0, 6.8, t));
        drawPatch(ox + ow * 0.78, oy + oh * 0.48, 210 * u, 118 * u, 0.11, '#7A8E6E', '废止', '短码港', 0, inv(6.3, 7.1, t));

        // 红虚线裁剪线与剪刀跟随推进
        const xA = ox + ow * 0.35, yA = oy + oh * 0.18, xB = ox + ow * 0.72, yB = oy + oh * 0.76;
        ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 4 * u; ctx.setLineDash([12 * u, 9 * u]);
        ctx.beginPath(); ctx.moveTo(xA, yA); ctx.lineTo(xB, yB); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        const sx = lerp(xA, xB, cutP), sy = lerp(yA, yB, cutP);
        drawScissors(sx, sy, Math.atan2(yB - yA, xB - xA), Math.abs(Math.sin(t * 16)));
      } else {
        // 阶段 C (7.2 - 13.5s, still=8.0s!)：米博士跳入并拍下层叠的统一 1.00 m 纸贴 + 2.5D 纸层倾斜视差！
        const survIn = eOutBack(inv(7.2, 7.75, t2), 1.3);
        const tilt = smooth(8.6, 10.2, t);
        ctx.save();
        // 2.5D 纸叠倾斜微透视：压扁纵轴一点并推入左方，让纸叠厚度可见
        ctx.translate(ox + ow / 2, oy + oh / 2);
        ctx.scale(1.0, lerp(1.0, 0.90, tilt));
        ctx.translate(-(ox + ow / 2), -(oy + oh / 2));

        // 叠在地面的统一大红边 1.00m 纸贴层（越拍越厚！）
        const stackP = inv(7.35, 7.75, t);
        const pY = lerp(oy + oh * 0.15, oy + oh * 0.48, eOutCubic(stackP));
        const cx = ox + ow * 0.46, cy = pY;
        // 底层老贴微露
        drawPatch(cx - 18 * u, oy + oh * 0.50, 290 * u, 148 * u, -0.05, '#7A8E6E', 'OLD CHI', '', 0, 0);
        // 压在正面的统一标准 1.00 m 纸贴
        drawPatch(cx, cy, 340 * u, 165 * u, 0.02, RED, '1.00 m', '全球统一米尺 · PARIS', 1 - eOutCubic(stackP), 0);

        // 9.0s 铜铆钉图钉啪嗒钉在巴黎子午线上
        if (t >= 8.8) {
          const pinP = inv(8.8, 9.1, t);
          ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx + 150 * u, cy - 60 * u, 16 * u * pinP, 0, TAU); ctx.fill();
          ctx.fillStyle = BRASS; ctx.beginPath(); ctx.arc(cx + 146 * u, cy - 64 * u, 16 * u * pinP, 0, TAU); ctx.fill();
          ctx.strokeStyle = INK; ctx.lineWidth = 2.5 * u; ctx.stroke();
        }
        ctx.restore();

        // 右侧测量师米博士 & 左侧被吓一跳的尺爷同框
        const sx = lerp(ox + ow * 1.18, ox + ow * (LAND ? 0.78 : 0.74), survIn);
        const sy = oy + oh * (LAND ? 0.80 : 0.74);
        drawPuppet(s.surv, sx, sy, oh * (LAND ? 0.58 : 0.46), -Math.sin(t2 * 8) * 0.03, [[0.46, 0.25], [0.36, 0.42], [0.54, 0.68]]);
        drawPuppet(s.boss, ox + ow * (LAND ? 0.20 : 0.22), oy + oh * (LAND ? 0.82 : 0.76), oh * (LAND ? 0.48 : 0.36), -0.06, [[0.56, 0.28], [0.46, 0.70]]);

        if (t >= 7.8 && t < 11.2) {
          drawSpeech(sx - 120 * u, sy - oh * 0.56 - 24 * u, '全部改贴一米整！', 'STANDARD 1.00 METER!', sx - 40 * u, sy - oh * 0.48);
        }
      }
    };

    // 拉远到整张漫画页放在木桌上（11.2 - 13.5s）
    const pb = smooth(11.2, 12.2, t);
    if (pb < 0.01) {
      drawMainStory(0, 0, W, H);
      // 左上角年份印刷纸标
      ctx.fillStyle = CARD; ctx.fillRect(38 * u, 34 * u, 210 * u, 56 * u);
      ctx.strokeStyle = INK; ctx.lineWidth = 3 * u; ctx.strokeRect(38 * u, 34 * u, 210 * u, 56 * u);
      ctx.fillStyle = INK; ctx.font = `900 ${30 * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('1790 — 1875', 143 * u, 62 * u);
    } else {
      // 暖棕木桌背景
      ctx.fillStyle = TABLE; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(43,34,25,0.16)'; ctx.lineWidth = 2 * u;
      for (let y = 0; y < H; y += 34 * u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      const pageW = lerp(W, W * (LAND ? 0.84 : 0.88), pb);
      const pageH = lerp(H, H * (LAND ? 0.84 : 0.74), pb);
      const px = (W - pageW) / 2, py = (H - pageH) / 2;
      // 漫画页立体桌影
      ctx.fillStyle = 'rgba(20,14,10,0.34)'; ctx.fillRect(px + 20 * u, py + 24 * u, pageW, pageH);
      ctx.fillStyle = PAPER; ctx.fillRect(px, py, pageW, pageH);
      ctx.strokeStyle = INK; ctx.lineWidth = 5 * u; ctx.strokeRect(px, py, pageW, pageH);

      const gap = 16 * u, pad = 20 * u;
      const gW = (pageW - 2 * pad - gap) / 2, gH = (pageH - 2 * pad - gap) / 2;
      // 前三小格概括前面事件，右下主格放当前结局帧
      for (const [col, row, lbl, colBg] of [[0, 0, '① 各执一尺', '#C9BFA4'], [1, 0, '② 剪断旧界', '#A6CCD3'], [0, 1, '③ 拍贴统一', '#D8CEB4']]) {
        const cx = px + pad + col * (gW + gap), cy = py + pad + row * (gH + gap);
        ctx.fillStyle = colBg; ctx.fillRect(cx, cy, gW, gH);
        ctx.strokeStyle = INK; ctx.lineWidth = 3.5 * u; ctx.strokeRect(cx, cy, gW, gH);
        ctx.fillStyle = INK; ctx.font = `900 ${28 * u}px 'Noto Serif SC'`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(lbl, cx + gW / 2, cy + gH / 2);
      }
      const lx = px + pad + gW + gap, ly = py + pad + gH + gap;
      drawMainStory(lx, ly, gW, gH);
      ctx.strokeStyle = INK; ctx.lineWidth = 4 * u; ctx.strokeRect(lx, ly, gW, gH);
      // 标题印章：放在右下格最顶部，适配横竖画幅宽度，不压红色 1.00 m 纸贴
      const bnH = Math.min(44 * u, gH * 0.16);
      ctx.fillStyle = CARD; ctx.fillRect(lx + gW * 0.08, ly + 8 * u, gW * 0.84, bnH);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5 * u; ctx.strokeRect(lx + gW * 0.08, ly + 8 * u, gW * 0.84, bnH);
      ctx.fillStyle = RED; ctx.font = `900 ${Math.round(Math.min(26 * u, gW * 0.072))}px 'Noto Serif SC'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('一米之争 · 公制统一', lx + gW * 0.50, ly + 8 * u + bnH * 0.5);
    }

    // 底部漫画旁白条（淡黄不透明纸卡 #F5E9C4 + 墨线框）
    const c = cueAt(s.A, t);
    if (c) {
      const text = c.text;
      ctx.save();
      ctx.font = `700 ${(LAND ? 34 : 36) * u}px 'Noto Sans SC'`;
      const tw = ctx.measureText(text).width + 52 * u, bh = 66 * u;
      const cx = W / 2, cy = H - (LAND ? 52 : 120) * u;
      ctx.fillStyle = INK; ctx.fillRect(cx - tw / 2 + 5 * u, cy - bh / 2 + 5 * u, tw, bh);
      ctx.fillStyle = CARD; ctx.fillRect(cx - tw / 2, cy - bh / 2, tw, bh);
      ctx.strokeStyle = INK; ctx.lineWidth = 3 * u; ctx.strokeRect(cx - tw / 2, cy - bh / 2, tw, bh);
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, cx, cy);
      ctx.restore();
    }
  },
});
