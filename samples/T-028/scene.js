// T-028 字幕新闻（caption-news）：静音优先社交新闻风 —— 第4帧巨型亮黄 #FFC21A 数字强钩子 + 块级砸入关键词高亮大字幕 +
// 历史照压暗 0.4% 占比扫描 + 账本对比硬分屏赛跑 + NPS 种群监测曲线 + 公园轮廓蒙版切回实拍野牛录像 + Kokoro 旁白
scene({
  id: 'T-028',
  name: '字幕新闻',
  dur: 13.5,
  still: 7.4,
  fonts: [
    "900 120px 'Noto Sans SC'",
    "700 40px 'Noto Sans SC'",
    "700 32px 'JetBrains Mono'",
    "400 32px 'Bebas Neue'",
  ],
  text: '数据新闻黄石样本一九零二年仅存头野牛较史前下降百分之九十九百年反转重回头来源美国国家公园管理局实拍录像档案照片',

  async init() {
    const A = await loadAssets();
    const [vid, oldImg, herdImg, census] = await Promise.all([
      loadVideo('bison_clip.mp4'),
      loadImage('bison_1900.jpg'),
      loadImage('bison_herd.jpg'),
      loadText('bison_census.csv').then(parseCSV),
    ]);
    return {
      A, vid, oldImg, herdImg, census,
      BG: '#0D1117', LEDGER: '#151512', YEL: '#FFC21A', RED: '#FF4A3D', IVORY: '#F7F5EF', GREY: '#8D8B83',
    };
  },

  async draw(ctx, t, s) {
    const u = SHORT / 1080;
    const { BG, LEDGER, YEL, RED, IVORY, GREY } = s;
    const { vid, oldImg, herdImg, census } = s;

    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

    // 账本风底卡（#151512 + 细白横线 + 左侧红双线装订）
    const drawLedgerBg = (x, y, w, h) => {
      ctx.save();
      ctx.fillStyle = LEDGER; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(247,245,239,0.05)'; ctx.lineWidth = 1.5 * u;
      for (let ly = y + 54 * u; ly < y + h; ly += 54 * u) {
        ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + w, ly); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,74,61,0.55)'; ctx.lineWidth = 2 * u;
      ctx.beginPath(); ctx.moveTo(x + 68 * u, y); ctx.lineTo(x + 68 * u, y + h);
      ctx.moveTo(x + 76 * u, y); ctx.lineTo(x + 76 * u, y + h); ctx.stroke();
      ctx.restore();
    };

    // 绘制视频画面区域（竖屏顶部预留 1080×1520 清晰区，横屏全出血）
    const mediaBox = LAND ? [0, 0, W, H] : [0, 140 * u, W, H * 0.64];
    const [mx, my, mw, mh] = mediaBox;
    let srcTagText = '来源 NPS 种群普查 · 1902–2024';
    let creditTagText = '视频 kennejima · CC BY 2.0';

    // =========================================================================
    // 段 1 (0.0 - 2.6s)：第4帧（0.13s）巨型亮黄 23 砸下 + 实拍野牛录像
    // =========================================================================
    if (t < 2.6) {
      const el = await vid.at(t % vid.dur);
      ctx.save();
      ctx.filter = 'contrast(1.07) saturate(0.92) brightness(0.95)';
      drawCover(ctx, el, mx, my, mw, mh, { zoom: lerp(1.0, 1.08, t / 2.6) });
      ctx.restore();
      srcTagText = '档案记录 · 1902 年最低谷';

      // 第4帧（0.13s）重击亮黄大数字 23
      if (t >= 0.12) {
        const p = inv(0.12, 0.55, t);
        const val = Math.round(lerp(0, 23, eOutCubic(p)));
        const bx = LAND ? 110 * u : 58 * u, by = LAND ? 210 * u : 240 * u;
        const sc = eOutBack(inv(0.12, 0.30, t), 1.5);
        ctx.save();
        ctx.translate(bx, by); ctx.scale(sc, sc);
        ctx.fillStyle = YEL; ctx.fillRect(0, 0, 290 * u, 164 * u);
        ctx.fillStyle = '#0E0E0C'; ctx.font = `900 ${126 * u}px 'JetBrains Mono'`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(val), 145 * u, 86 * u);
        ctx.fillStyle = IVORY; ctx.font = `900 ${48 * u}px 'Noto Sans SC'`;
        ctx.textAlign = 'left';
        ctx.fillText('头野生野牛', 316 * u, 56 * u);
        ctx.fillStyle = RED; ctx.font = `700 ${30 * u}px 'JetBrains Mono'`;
        ctx.fillText('YELLOWSTONE 1902 LOW', 316 * u, 118 * u);
        ctx.restore();
      }
    }
    // =========================================================================
    // 段 2 (2.6 - 5.6s)：压暗占比扫描（Proportion by Darkness）+ 账本卡片右侧滑入
    // =========================================================================
    else if (t < 5.6) {
      const dt = t - 2.6;
      srcTagText = '照片 Keystone View · Public Domain';
      creditTagText = '档案照片 Public Domain';
      const photoBox = LAND ? [0, 0, W * 0.62, H] : [0, my, W, mh * 0.54];
      drawCover(ctx, oldImg, ...photoBox, { zoom: lerp(1.0, 1.07, dt / 3.0) });

      // 自上而下压暗，只留底部 0.4% 亮条展示锐减冲击！
      const sweepY = lerp(photoBox[1], photoBox[1] + photoBox[3] * 0.96, eOutCubic(inv(0.1, 1.35, dt)));
      ctx.fillStyle = 'rgba(10,12,16,0.78)';
      ctx.fillRect(photoBox[0], photoBox[1], photoBox[2], sweepY - photoBox[1]);
      ctx.fillStyle = YEL;
      ctx.fillRect(photoBox[0], sweepY, photoBox[2], 5 * u);

      // 账本对比卡从右滑入
      const slideIn = eOutCubic(inv(0.25, 0.55, dt));
      const card = LAND
        ? [lerp(W, W * 0.56, slideIn), 140 * u, W * 0.40, H - 350 * u]
        : [lerp(W, 44 * u, slideIn), my + mh * 0.56, W - 88 * u, mh * 0.42];
      drawLedgerBg(...card);
      ctx.save();
      const [cx, cy, cw, ch] = card;
      ctx.fillStyle = RED; ctx.font = `900 ${96 * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('0.4%', cx + 104 * u, cy + 48 * u);
      ctx.fillStyle = IVORY; ctx.font = `900 ${42 * u}px 'Noto Sans SC'`;
      ctx.fillText('仅存种群不足百分之一', cx + 104 * u, cy + 168 * u);
      ctx.fillStyle = GREY; ctx.font = `700 ${24 * u}px 'JetBrains Mono'`;
      ctx.fillText('HISTORICAL COLLAPSE · NPS', cx + 104 * u, cy + 232 * u);
      ctx.restore();
    }
    // =========================================================================
    // 段 3 (5.6 - 9.2s, still=7.4s)：硬分屏赛跑计数器 + NPS 种群飙升曲线
    // =========================================================================
    else if (t < 9.2) {
      const dt = t - 5.6;
      srcTagText = '来源 NPS Bison Census · 1902–2024';
      creditTagText = '档案与现况均属公共领域（PD）';
      const divGrow = eOutCubic(inv(0.0, 0.28, dt));

      const leftRect = LAND ? [0, 0, W * 0.48, H] : [0, my, W, mh * 0.48];
      const rightRect = LAND ? [W * 0.48, 0, W * 0.52, H] : [0, my + mh * 0.48, W, mh * 0.52];

      // 左/上：低饱和压暗 1902 年
      ctx.save();
      ctx.filter = 'grayscale(0.85) brightness(0.45) sepia(0.25)';
      drawCover(ctx, oldImg, ...leftRect, { zoom: 1.05 });
      ctx.restore();
      // 右/下：全彩现代野牛重返黄石
      drawCover(ctx, herdImg, ...rightRect, { zoom: lerp(1.0, 1.08, dt / 3.6) });
      ctx.fillStyle = 'rgba(13,17,23,0.45)'; ctx.fillRect(...rightRect);

      // 4px 亮黄分割线
      ctx.fillStyle = YEL;
      if (LAND) ctx.fillRect(W * 0.48 - 2 * u, 0, 4 * u, H * divGrow);
      else ctx.fillRect(0, my + mh * 0.48 - 2 * u, W * divGrow, 4 * u);

      // 两侧赛跑大计数器
      const raceP = eOutCubic(inv(0.25, 1.65, dt));
      const cntNow = Math.round(lerp(23, 5400, raceP));

      ctx.save();
      ctx.fillStyle = RED; ctx.fillRect(leftRect[0] + 64 * u, leftRect[1] + 158 * u, 180 * u, 44 * u);
      ctx.fillStyle = '#0E0E0C'; ctx.font = `900 ${26 * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('1902 LOW', leftRect[0] + 154 * u, leftRect[1] + 180 * u);
      ctx.fillStyle = IVORY; ctx.font = `900 ${96 * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'left';
      ctx.fillText('23 头', leftRect[0] + 64 * u, leftRect[1] + 270 * u);

      // 右侧计数器 + 账本内嵌增长曲线
      const rx = rightRect[0] + 56 * u, ry = rightRect[1] + (LAND ? 158 : 48) * u;
      ctx.fillStyle = YEL; ctx.fillRect(rx, ry, 210 * u, 44 * u);
      ctx.fillStyle = '#0E0E0C'; ctx.font = `900 ${26 * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('2024 COUNT', rx + 105 * u, ry + 22 * u);
      ctx.fillStyle = YEL; ctx.font = `900 ${98 * u}px 'JetBrains Mono'`;
      ctx.textAlign = 'left';
      ctx.fillText(`${cntNow.toLocaleString()}+`, rx, ry + 112 * u);

      // 绘制真实 NPS 种群增长折线图（位于右侧下半）
      const gx = rx, gy = rightRect[1] + rightRect[3] * (LAND ? 0.50 : 0.48), gw = rightRect[2] - 110 * u, gh = rightRect[3] * 0.25;
      drawLedgerBg(gx - 20 * u, gy - 20 * u, gw + 40 * u, gh + 65 * u);
      const drawP = inv(0.35, 2.1, dt);
      const pts = census.map((r, i) => [
        gx + (i / (census.length - 1)) * gw,
        gy + gh - (r.count / 6200) * gh,
      ]);
      ctx.strokeStyle = YEL; ctx.lineWidth = 5 * u;
      ctx.beginPath();
      const maxSeg = drawP * (pts.length - 1);
      for (let i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(...pts[0]);
        else if (i <= maxSeg) ctx.lineTo(...pts[i]);
        else {
          const frac = maxSeg - (i - 1);
          if (frac > 0) ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], frac), lerp(pts[i - 1][1], pts[i][1], frac));
          break;
        }
      }
      ctx.stroke();
      ctx.fillStyle = IVORY; ctx.font = `700 ${20 * u}px 'JetBrains Mono'`;
      ctx.fillText('1902 (23)', gx, gy + gh + 18 * u);
      ctx.textAlign = 'right';
      ctx.fillText('2024 (5,400+)', gx + gw, gy + gh + 18 * u);
      ctx.restore();
    }
    // =========================================================================
    // 段 4 (9.2 - 13.5s)：报告要点高亮 → 公园轮廓蒙版切回实拍野牛群 + 收尾金句
    // =========================================================================
    else {
      const dt = t - 9.2;
      srcTagText = 'NPS Status Report · 保护成效核验';
      creditTagText = '视频 kennejima · CC BY 2.0';
      const el = await vid.at(6.5 + (dt % 5.0));

      if (dt < 2.2) {
        // 报告卡配暗桌 + 亮黄荧光笔划重点 → 右侧轮廓蒙版展开实拍录像
        drawLedgerBg(60 * u, LAND ? 170 * u : 210 * u, W - 120 * u, LAND ? 540 * u : 460 * u);
        const rx = 160 * u, ry = LAND ? 225 * u : 255 * u;
        ctx.fillStyle = IVORY; ctx.font = `700 ${(LAND ? 40 : 34) * u}px 'JetBrains Mono'`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('NPS BISON STATUS REPORT', rx, ry);
        // 荧光笔扫过关键数字行
        const hlP = eOutCubic(inv(0.15, 0.85, dt));
        ctx.fillStyle = YEL;
        ctx.fillRect(rx, ry + 78 * u, (LAND ? 780 : 680) * u * hlP, 54 * u);
        ctx.fillStyle = '#0E0E0C'; ctx.font = `900 ${(LAND ? 40 : 34) * u}px 'Noto Sans SC'`;
        ctx.fillText('连续种群恢复：23 → 5,400+ 头野牛', rx + 12 * u, ry + 84 * u);

        // 公园边界简形蒙版渐扩切出实拍野牛录像
        const maskR = lerp(80 * u, LONG * 0.9, eInCubic(inv(1.1, 2.2, dt)));
        ctx.save();
        ctx.beginPath();
        ctx.arc(LAND ? W * 0.72 : W * 0.5, LAND ? H * 0.56 : H * 0.66, maskR, 0, TAU);
        ctx.clip();
        drawCover(ctx, el, mx, my, mw, mh, { zoom: 1.04 });
        ctx.restore();
      } else {
        ctx.save();
        ctx.filter = 'contrast(1.07) saturate(0.95)';
        drawCover(ctx, el, mx, my, mw, mh, { zoom: lerp(1.04, 1.0, (dt - 2.2) / 2.1) });
        ctx.restore();
      }
    }

    // 底部与顶部渐变遮罩保障大字压片可读
    const botGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
    botGrad.addColorStop(0, 'rgba(13,17,23,0)');
    botGrad.addColorStop(1, 'rgba(13,17,23,0.90)');
    ctx.fillStyle = botGrad; ctx.fillRect(0, H * 0.55, W, H * 0.45);
    const topGrad = ctx.createLinearGradient(0, 0, 0, 180 * u);
    topGrad.addColorStop(0, 'rgba(13,17,23,0.75)');
    topGrad.addColorStop(1, 'rgba(13,17,23,0)');
    ctx.fillStyle = topGrad; ctx.fillRect(0, 0, W, 180 * u);

    // 频道角标（左上角 46px 高亮黄块）+ 来源滑出标签
    const bugX = LAND ? 86 * u : 46 * u, bugY = LAND ? 46 * u : 58 * u;
    ctx.fillStyle = YEL; ctx.fillRect(bugX, bugY, 276 * u, 48 * u);
    ctx.fillStyle = '#0E0E0C'; ctx.font = `900 ${26 * u}px 'Noto Sans SC'`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('数据新闻 · 黄石样本', bugX + 138 * u, bugY + 24 * u);

    ctx.fillStyle = 'rgba(247,245,239,0.92)'; ctx.fillRect(bugX, bugY + 54 * u, 74 * u, 34 * u);
    ctx.fillStyle = '#0E0E0C'; ctx.font = `900 ${19 * u}px 'Noto Sans SC'`;
    ctx.fillText('来源', bugX + 37 * u, bugY + 71 * u);
    ctx.fillStyle = 'rgba(20,22,26,0.88)'; ctx.fillRect(bugX + 74 * u, bugY + 54 * u, 370 * u, 34 * u);
    ctx.fillStyle = IVORY; ctx.font = `700 ${19 * u}px 'JetBrains Mono'`;
    ctx.textAlign = 'left'; ctx.fillText(srcTagText, bugX + 86 * u, bugY + 71 * u);

    // 右上角素材署名牌
    if (LAND) {
      ctx.font = `700 ${18 * u}px 'Noto Sans SC'`;
      const cw = ctx.measureText(creditTagText).width + 26 * u;
      ctx.fillStyle = 'rgba(13,17,23,0.72)'; ctx.fillRect(W - cw - 54 * u, bugY, cw, 34 * u);
      ctx.fillStyle = IVORY; ctx.textAlign = 'right';
      ctx.fillText(creditTagText, W - 67 * u, bugY + 17 * u);
    }

    // 静音优先：分块砸入的亮黄关键词高亮超大字幕
    const capCards = [
      [0.0, 2.6, '1902 年黄石仅存', '23 头', '野生野牛', 'ONLY 23 WILD BISON REMAINED IN YELLOWSTONE (1902)'],
      [2.6, 5.6, '整个百年种群跌落至', '0.4%', '灭绝边缘', 'POPULATION FELL BELOW ONE PERCENT OF HISTORIC RANGE'],
      [5.6, 9.2, '百年监测数据反转重回', '5,400+ 头', '规模', 'RECOVERED ABOVE 5,400 BISON UNDER NPS PROTECTION'],
      [9.2, 13.5, '北美', '生态逆转', '实拍与档案双双核实', 'A CENTURY OF CONSERVATION REVERSED NEAR EXTINCTION'],
    ];
    const cc = capCards.find(x => t >= x[0] && t < x[1]) || capCards[capCards.length - 1];
    const dtC = t - cc[0];
    const baseSize = LAND ? 76 : 48;
    const cy = H - (LAND ? 132 : 210) * u;
    const cx0 = LAND ? 86 * u : 46 * u;

    ctx.save();
    ctx.font = `900 ${baseSize * u}px 'Noto Sans SC'`;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const wPre = ctx.measureText(cc[2]).width;
    const wKey = ctx.measureText(cc[3]).width;
    const p1 = eOutBack(inv(0.02, 0.16, dtC), 1.5);
    const p2 = eOutBack(inv(0.14, 0.28, dtC), 1.5);
    const p3 = eOutBack(inv(0.24, 0.38, dtC), 1.5);
    const kwWipe = eOutCubic(inv(0.14, 0.30, dtC));

    // 第 1 块：前景句
    ctx.save(); ctx.globalAlpha = clamp(p1 * 2);
    ctx.fillStyle = IVORY; ctx.fillText(cc[2], cx0, cy);
    ctx.restore();

    // 第 2 块：亮黄关键词底块 + 黑字
    if (LAND || (cx0 + wPre + wKey + 28 * u < W - 40 * u)) {
      const kx = cx0 + wPre + 14 * u;
      ctx.fillStyle = YEL; ctx.fillRect(kx - 10 * u, cy - baseSize * 0.56 * u, (wKey + 20 * u) * kwWipe, baseSize * 1.12 * u);
      ctx.save(); ctx.globalAlpha = clamp(p2 * 2);
      ctx.fillStyle = kwWipe > 0.4 ? '#0E0E0C' : IVORY;
      ctx.fillText(cc[3], kx, cy);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = clamp(p3 * 2);
      ctx.fillStyle = IVORY;
      ctx.fillText(cc[4], kx + wKey + 24 * u, cy);
      ctx.restore();
    } else {
      // 竖屏防溢出自动叠第二行
      const ly2 = cy + baseSize * 1.24 * u;
      ctx.fillStyle = YEL; ctx.fillRect(cx0 - 8 * u, ly2 - baseSize * 0.56 * u, (wKey + 16 * u) * kwWipe, baseSize * 1.12 * u);
      ctx.fillStyle = kwWipe > 0.4 ? '#0E0E0C' : IVORY; ctx.fillText(cc[3], cx0, ly2);
      ctx.fillStyle = IVORY; ctx.fillText(cc[4], cx0 + wKey + 22 * u, ly2);
    }

    // 下方单行英文报道原意
    const engY = H - (LAND ? 52 : 76) * u;
    ctx.fillStyle = GREY; ctx.font = `700 ${(LAND ? 26 : 22) * u}px 'JetBrains Mono'`;
    ctx.fillText(cc[5], cx0, engY);
    ctx.restore();
  },
});
