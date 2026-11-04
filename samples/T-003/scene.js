// T-003 带货口播式产品广告：1974 年的两张太空餐试吃照片做推镜，圈出「挤着吃」的软管，弹出卖点贴纸和价签式标签；接空间站上吃饭的录像，最后一张产品卡收尾
// 素材：照片（NASA S74-20797、S74-20798）、录像（NASA 视频里空间站进餐的 3 秒）；配乐 CC0
scene({
  id: 'T-003', name: '复古产品广告', dur: 14, still: 6.2,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'"],
  text: '太空餐挤着吃一根吸管一顿饭年款失重也不洒档案照片空间站上今天还这么吃联盟阿波罗试吃会三道菜上新太空食谱',
  async init() {
    const A = await loadAssets();
    return { A, T1: [.28, .58], T2: [.41, .54], p1: await loadImage('food1.jpg'), p2: await loadImage('food2.jpg'), v: await loadVideo('broll.mp4') };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080;
    ctx.fillStyle = '#f4e9d4'; ctx.fillRect(0, 0, W, H);
    const Y = '#ffcf33', R = '#e8443a', K = '#1d1a16';
    // 镜头：照片 1（0–4.6）、照片 2（4.6–8.6）、录像（8.6–11.6）、产品卡（11.6–14）
    const shot = t < 4.6 ? 0 : t < 8.6 ? 1 : t < 11.6 ? 2 : 3;
    const frame = LAND ? [W * .06, H * .14, W * .56, H * .72] : [W * .06, H * .2, W * .88, H * .5];
    const [fx0, fy0, fw, fh] = frame;
    // 相片框：白边 + 投影，像贴在广告版面上
    const frameBox = () => { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 30 * u; ctx.shadowOffsetY = 12 * u;
      ctx.fillStyle = '#fff'; ctx.fillRect(fx0 - 14 * u, fy0 - 14 * u, fw + 28 * u, fh + 28 * u); ctx.restore(); };
    // 圈点：在相片里的 (px, py)（0–1，按铺满后的画面算）画一个手绘感的圈和引线
    const ring = (img, o, ix, iy, p, label, side) => {
      // (ix, iy) 是在原照片里的位置（0–1），照 drawCover 的同一套缩放、取景换算到画面上
      const [sw, sh] = srcSize(img), k = Math.max(fw / sw, fh / sh) * o.zoom, dw = sw * k, dh = sh * k;
      const x = fx0 + (fw - dw) * o.fx + ix * dw, y = fy0 + (fh - dh) * o.fy + iy * dh, r = 70 * u;
      ctx.save(); ctx.strokeStyle = R; ctx.lineWidth = 7 * u; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.1, r * .85, -.2, -1.2, -1.2 + Math.PI * 2.1 * eOutCubic(p)); ctx.stroke();
      if (p > .6) {
        const q = eOutBack(inv(.6, 1, p)), lx = x + side * 220 * u, ly = y - 150 * u;
        ctx.beginPath(); ctx.moveTo(x + side * r, y - r * .4); ctx.lineTo(lerp(x + side * r, lx, q), lerp(y - r * .4, ly, q)); ctx.stroke();
        ctx.translate(lx, ly); ctx.scale(q, q); ctx.rotate(side * -.06);
        ctx.font = `900 ${40 * u}px 'Noto Sans SC'`; const w = ctx.measureText(label).width + 40 * u;
        ctx.fillStyle = Y; rr(ctx, -w / 2, -34 * u, w, 68 * u, 34 * u); ctx.fill(); ctx.lineWidth = 4 * u; ctx.strokeStyle = K; ctx.stroke();
        ctx.fillStyle = K; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 2 * u);
      }
      ctx.restore();
    };
    if (shot < 2) {
      const lt = shot ? t - 4.6 : t, img = shot ? s.p2 : s.p1;
      const slide = eOutCubic(inv(0, .5, lt));
      ctx.save(); ctx.translate((1 - slide) * (shot ? -1 : 1) * W * .5, 0);
      const o = { zoom: lerp(1.05, 1.18, lt / 4), fx: shot ? .4 : .5, fy: .45 };
      frameBox();
      drawCover(ctx, img, fx0, fy0, fw, fh, o);
      ctx.restore();
      if (shot === 0) ring(img, o, ...s.T1, inv(1.2, 2.4, lt), '挤着吃！', 1);
      else ring(img, o, ...s.T2, inv(1.0, 2.2, lt), '失重也不洒', 1);
    } else if (shot === 2) {
      const lt = t - 8.6; await s.v.at(lt);
      frameBox(); drawCover(ctx, s.v.el, fx0, fy0, fw, fh, { zoom: 1.08 });
      ctx.save(); ctx.globalAlpha = smooth(.2, .6, lt); ctx.fillStyle = K; rr(ctx, fx0 + 24 * u, fy0 + 24 * u, 300 * u, 56 * u, 8 * u); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${28 * u}px 'Noto Sans SC'`; ctx.textBaseline = 'middle'; ctx.fillText('今天 · 国际空间站', fx0 + 44 * u, fy0 + 53 * u); ctx.restore();
    }
    // 右侧（竖屏是下方）的卖点文案
    const tx = LAND ? W * .67 : W * .08, ty = LAND ? H * .2 : H * .74;
    const COPY = [['1974 款', '太空餐'], ['一根吸管', '一顿饭'], ['今天', '还这么吃']][Math.min(shot, 2)];
    if (shot < 3) {
      const lt = t - [0, 4.6, 8.6][shot], a = eOutBack(inv(.15, .6, lt));
      ctx.save(); ctx.translate(tx, ty); ctx.globalAlpha = clamp(a);
      ctx.fillStyle = R; ctx.font = `400 ${(LAND ? 64 : 58) * u}px 'Bebas Neue', 'Noto Sans SC'`; ctx.textBaseline = 'top';
      ctx.font = `900 ${(LAND ? 46 : 40) * u}px 'Noto Sans SC'`; ctx.fillText(COPY[0], 0, 0);
      ctx.fillStyle = K; ctx.font = `900 ${(LAND ? 110 : 96) * u}px 'Noto Sans SC'`;
      ctx.translate(0, 60 * u); ctx.scale(1, a); ctx.fillText(COPY[1], 0, 0);
      ctx.restore();
      // 一行小字说明（照片的真实出处）
      ctx.save(); ctx.globalAlpha = smooth(.6, 1, lt); ctx.fillStyle = 'rgba(29,26,22,.7)'; ctx.font = `400 ${24 * u}px 'Noto Sans SC'`; ctx.textBaseline = 'top';
      ctx.fillText(['联盟—阿波罗试吃会 · NASA 档案照片', '1974 年 · 休斯敦', 'NASA 视频片段'][shot], tx, ty + (LAND ? 200 : 180) * u); ctx.restore();
    } else {
      // 产品卡：圆形裁切的照片 + 大字 + 价签式标签
      const lt = t - 11.6, k = eOutBack(inv(0, .6, lt));
      const cx = LAND ? W * .3 : W * .5, cy = LAND ? H * .5 : H * .36, r = (LAND ? 300 : 330) * u;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
      ctx.fillStyle = Y; ctx.beginPath(); ctx.arc(0, 0, r + 26 * u, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip(); drawCover(ctx, s.p1, -r, -r, 2 * r, 2 * r, { fx: .66, fy: .45, zoom: 1.6 });
      ctx.restore();
      const bx = LAND ? W * .58 : W * .1, by = LAND ? H * .32 : H * .66, a = smooth(.3, .8, lt);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = K; ctx.textBaseline = 'top';
      ctx.font = `900 ${(LAND ? 100 : 92) * u}px 'Noto Sans SC'`; ctx.fillText('太空食谱', bx, by);
      ctx.font = `700 ${34 * u}px 'Noto Sans SC'`; ctx.fillStyle = R; ctx.fillText('从 1974 吃到今天', bx, by + 120 * u);
      ctx.restore();
      const st = eOutBack(inv(.8, 1.2, lt), 3);
      ctx.save(); ctx.translate(bx + (LAND ? 520 : 700) * u, by - 10 * u); ctx.rotate(.18); ctx.scale(st, st);
      ctx.fillStyle = R; ctx.beginPath(); for (let i = 0; i < 24; i++) { const rr_ = i % 2 ? 70 * u : 84 * u, a2 = i / 24 * Math.PI * 2; ctx.lineTo(Math.cos(a2) * rr_, Math.sin(a2) * rr_); } ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `900 ${34 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('上新', 0, 0);
      ctx.restore();
    }
    // 底部滚动条（广告感的跑马灯）
    const bh = 54 * u; ctx.fillStyle = K; ctx.fillRect(0, H - bh, W, bh);
    ctx.save(); ctx.font = `700 ${24 * u}px 'Noto Sans SC'`; ctx.fillStyle = Y; ctx.textBaseline = 'middle';
    const msg = '  ★ 软管装  ★ 脱水复水  ★ 失重也不洒  ★ 从阿波罗到空间站  ', mw = ctx.measureText(msg).width;
    for (let x = -((t * 160 * u) % mw); x < W; x += mw) ctx.fillText(msg, x, H - bh / 2);
    ctx.restore();
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(29,26,22,.55)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 24 * u, H - bh - 14 * u); ctx.restore();
  },
});
