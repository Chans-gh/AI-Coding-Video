// 暗色科技发布会风格包 — 插件式媒体插槽（融合族群：暗色科技，零修改 pack.js）
// 按需在场景 needs 中加入 '../media_slots.js' 后，自动挂载到 DK（及 PACK）：
//   - DK.mediaBg(ctx, K, t, o)    ：层（layer），全幅氛围铺底，自动深色压罩 + 品牌色光晕，前景 100% 复用原纯 C 部件
//   - DK.mediaFrame(ctx, K, t, o) ：整屏（seg），画框展示（素材占 75%–85% 主舞台 + 暗色玻璃框/斜扫光/出处角标）
//   - DK.mediaSplit(ctx, K, t, o) ：整屏（seg），双栏分屏（横版 55:45 / 竖版 52:48 严守 y <= H*0.78，支持 text/metric/list）
//   - DK.mediaPip(ctx, K, t, o)   ：叠加（over），安全角标画中画（circle / card，避开左上角标与底部字幕区）
// 依赖 samples/lib/lib.js 的 W H LAND SHORT TAU clamp lerp smooth eOutExpo eInOutCubic rr wrapCJK drawCover drawContain drawPlaceholder vignette。
(() => {
  const F = (K, w, px, fam) => `${w} ${Math.round(px * (K.u || SHORT / 1080))}px ${fam || K.head || "'Noto Sans SC'"}`;
  const pop = (t, d = .55) => eOutExpo(clamp(t / d));
  const resolveSrc = src => (src && src.el) ? src.el : (src && typeof src === 'object' ? src : null);

  function sweep(ctx, x, y, w, h, p, al = .24) {
    if (p <= 0 || p >= 1) return;
    const sx = lerp(x - h, x + w + h, eInOutCubic(p)), bw = Math.max(110, h * .45);
    const g = ctx.createLinearGradient(sx - bw, 0, sx + bw, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(.5, `rgba(255,255,255,${al})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.fillStyle = g;
    ctx.translate(0, y);
    ctx.transform(1, 0, -.35, 1, 0, 0);
    ctx.fillRect(sx - bw, 0, bw * 2, h);
    ctx.restore();
  }

  function drawGlass(ctx, K, x, y, w, h, r = 28) {
    const u = K.u || SHORT / 1080;
    rr(ctx, x, y, w, h, r * u);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(255,255,255,.09)');
    g.addColorStop(1, 'rgba(255,255,255,.025)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1.5 * u;
    ctx.stroke();
  }

  function drawCredit(ctx, K, x, y, w, h, text) {
    if (!text) return;
    const u = K.u || SHORT / 1080, pad = 14 * u;
    ctx.save();
    ctx.font = F(K, 700, 17, K.mono || "'JetBrains Mono'");
    const tw = Math.min(w - 28 * u, ctx.measureText(text).width + 26 * u), th = 30 * u;
    const bx = x + w - tw - pad, by = y + h - th - pad;
    rr(ctx, bx, by, tw, th, 8 * u);
    ctx.fillStyle = 'rgba(5,5,10,.78)';
    ctx.fill();
    ctx.strokeStyle = K.a ? K.a(.45) : 'rgba(139,123,255,.45)';
    ctx.lineWidth = 1.2 * u;
    ctx.stroke();
    ctx.fillStyle = K.ink || '#F4F5F8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(text), bx + tw / 2, by + th / 2 + 1 * u, tw - 12 * u);
    ctx.restore();
  }

  function drawKicker(ctx, K, text, x, y) {
    if (!text) return;
    const u = K.u || SHORT / 1080;
    ctx.save();
    ctx.fillStyle = K.a ? K.a(1) : '#8B7BFF';
    ctx.fillRect(x, y - 9 * u, 30 * u, 3 * u);
    ctx.font = F(K, 700, 22, K.mono || "'JetBrains Mono'");
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${3.5 * u}px`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(text).toUpperCase(), x + 42 * u, y);
    ctx.restore();
  }

  function drawDarkTechMedia(ctx, K, t, x, y, w, h, o = {}) {
    const u = K.u || SHORT / 1080, rad = 24 * u;
    const media = resolveSrc(o.src);
    const hasChrome = o.chrome !== false && Math.min(w, h) >= 260 * u;
    const topBar = hasChrome ? 46 * u : 0;

    ctx.save();
    // 舞台景深光晕 + 玻璃卡片阴影
    const aura = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * .15, x + w / 2, y + h / 2, Math.max(w, h) * .7);
    aura.addColorStop(0, K.a ? K.a(.14) : 'rgba(139,123,255,.14)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(x - w * .12, y - h * .12, w * 1.24, h * 1.24);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.5)';
    ctx.shadowBlur = 40 * u;
    ctx.shadowOffsetY = 16 * u;
    drawGlass(ctx, K, x, y, w, h, 24);
    ctx.restore();
    if (hasChrome) {
      [1, .55, .25].forEach((al, i) => {
        ctx.fillStyle = K.a ? K.a(al) : `rgba(139,123,255,${al})`;
        ctx.beginPath();
        ctx.arc(x + 28 * u + i * 22 * u, y + 23 * u, 5.5 * u, 0, TAU);
        ctx.fill();
      });
      const tag = o.tag || (o.mediaType === 'video' ? (o.kind === 'G' ? 'AI VIDEO' : 'REAL VIDEO') : (o.kind === 'G' ? 'AI GENERATED' : 'REAL MEDIA'));
      ctx.fillStyle = K.muted || 'rgba(244,245,248,.6)';
      ctx.font = F(K, 700, 16, K.mono || "'JetBrains Mono'");
      ctx.textAlign = 'right';
      ctx.fillText(String(tag).toUpperCase(), x + w - 22 * u, y + 29 * u);
      ctx.textAlign = 'left';
      ctx.strokeStyle = 'rgba(255,255,255,.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 14 * u, y + topBar);
      ctx.lineTo(x + w - 14 * u, y + topBar);
      ctx.stroke();
    }

    const pad = hasChrome ? 10 * u : 0;
    const ix = x + pad, iy = y + topBar + (hasChrome ? 8 * u : 0);
    const iw = w - pad * 2, ih = h - topBar - (hasChrome ? 18 * u : 0);
    const irad = hasChrome ? 16 * u : rad;

    if (!media) {
      drawPlaceholder(ctx, ix, iy, iw, ih, {
        K, kind: o.kind || 'T', mediaType: o.mediaType, tag: o.placeholderTag,
        label: o.placeholder || o.title || o.label || '待填入素材',
        radius: irad, t,
      });
    } else {
      const zoom = 1 + (o.zoom ?? 0.06) * clamp(t / 4);
      ctx.save();
      rr(ctx, ix, iy, iw, ih, irad);
      ctx.clip();
      ctx.fillStyle = K.bg0 || '#05050A';
      ctx.fillRect(ix, iy, iw, ih);
      if (o.fit === 'contain') drawContain(ctx, media, ix, iy, iw, ih, { zoom });
      else drawCover(ctx, media, ix, iy, iw, ih, { zoom, fx: o.fx ?? .5, fy: o.fy ?? .5 });
      // 暗色科技融合暗角 + 落定斜扫光
      const vg = ctx.createRadialGradient(ix + iw / 2, iy + ih / 2, Math.min(iw, ih) * .25, ix + iw / 2, iy + ih / 2, Math.max(iw, ih) * .72);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(5,5,12,.42)');
      ctx.fillStyle = vg;
      ctx.fillRect(ix, iy, iw, ih);
      sweep(ctx, ix, iy, iw, ih, clamp((t - .35) / .75), .22);
      ctx.restore();
    }

    // 1.5px 强调色微光描边
    rr(ctx, x, y, w, h, rad);
    ctx.strokeStyle = K.a ? K.a(.48) : 'rgba(139,123,255,.48)';
    ctx.lineWidth = 1.5 * u;
    ctx.stroke();

    drawCredit(ctx, K, ix, iy, iw, ih, o.credit);
    ctx.restore();
  }

  // 1) mediaBg（层）：全幅氛围铺底，深色压罩 + 品牌色柔光 + 暗角，前景 100% 复用原有纯 C 部件
  function mediaBg(ctx, K, t, o = {}) {
    const u = K.u || SHORT / 1080, media = resolveSrc(o.src);
    const dim = clamp(o.dim ?? 0.6, 0, 0.88);
    const zoom = 1 + (o.zoom ?? 0.05) * clamp(t / 5);
    ctx.save();
    if (media) {
      drawCover(ctx, media, 0, 0, W, H, { zoom, fx: o.fx ?? .5, fy: o.fy ?? .5 });
    } else {
      ctx.fillStyle = K.bg0 || '#05050A';
      ctx.fillRect(0, 0, W, H);
      if (o.placeholder) {
        const step = Math.max(24, 36 * u);
        ctx.strokeStyle = K.a ? K.a(.10) : 'rgba(255,255,255,.06)';
        ctx.lineWidth = Math.max(1, 1.2 * u);
        ctx.beginPath();
        for (let d = -H; d < W + H; d += step) { ctx.moveTo(d, 0); ctx.lineTo(d - H, H); }
        ctx.stroke();
        ctx.save();
        rr(ctx, 32 * u, 32 * u, W - 64 * u, H - 64 * u, 22 * u);
        ctx.setLineDash([12 * u, 10 * u]);
        ctx.strokeStyle = K.a ? K.a(.35) : 'rgba(255,255,255,.2)';
        ctx.lineWidth = Math.max(1.5, 2 * u);
        ctx.stroke();
        ctx.restore();
      }
    }
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, `rgba(5,5,10,${clamp(dim + .08, 0, .92)})`);
    gr.addColorStop(.5, `rgba(5,5,10,${dim})`);
    gr.addColorStop(1, `rgba(5,5,10,${clamp(dim + .12, 0, .95)})`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
    if (o.tint !== false && K.a) {
      const gx = W * (.5 + .18 * Math.sin(t * .35)), gy = H * (.42 + .08 * Math.cos(t * .27));
      const gl = ctx.createRadialGradient(gx, gy, 0, gx, gy, SHORT * .75);
      gl.addColorStop(0, K.a(.18));
      gl.addColorStop(1, K.a(0));
      ctx.fillStyle = gl;
      ctx.fillRect(0, 0, W, H);
    }
    if (typeof vignette === 'function') vignette(ctx, .38);
    if (!media && o.placeholder) {
      const prefix = o.mediaType === 'video'
        ? (o.kind === 'G' ? '▶ [G AI 视频铺底]' : '▶ [T 实拍视频铺底]')
        : (o.kind === 'G' ? '[G AI 背景图铺底]' : '[T 真实背景图铺底]');
      const badge = `${prefix} · ${o.placeholder} · ${Math.round(W)}×${Math.round(H)}`;
      ctx.save();
      ctx.globalAlpha = 0.82;
      ctx.font = F(K, 700, 18, K.mono || "'JetBrains Mono'");
      const tw = Math.min(W * .58, ctx.measureText(badge).width + 28 * u), th = 34 * u;
      const bx = W - 56 * u - tw, by = 40 * u;
      rr(ctx, bx, by, tw, th, th / 2);
      ctx.fillStyle = 'rgba(8,10,18,.78)'; ctx.fill();
      ctx.strokeStyle = K.a ? K.a(.55) : 'rgba(255,255,255,.32)';
      ctx.lineWidth = 1.2 * u; ctx.stroke();
      ctx.fillStyle = K.ink || '#F4F5F8';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(badge, bx + tw / 2, by + th / 2 + 1 * u, tw - 16 * u);
      ctx.restore();
    }
    ctx.restore();
  }

  // 2) mediaFrame（整屏）：16:9 漂浮舞台画框，垂直居中于品牌角标与字幕之间
  function mediaFrame(ctx, K, t, o = {}) {
    const u = K.u || SHORT / 1080, p = pop(t, .55);
    const hasHead = Boolean(o.kicker || o.title);
    ctx.save();
    ctx.globalAlpha = p;
    let fx, fy, fw, fh;
    if (LAND) {
      const midY = H * .465;
      fw = 1320 * u;
      fh = 640 * u;
      const headH = hasHead ? ((o.kicker && o.title ? 96 : o.title ? 66 : 38) * u) : 0;
      const totalH = headH + fh;
      let topY = midY - totalH / 2 + (1 - p) * 22 * u;
      fx = (W - fw) / 2;
      if (hasHead) {
        if (o.kicker) {
          drawKicker(ctx, K, o.kicker, fx, topY + 22 * u);
          topY += 36 * u;
        }
        if (o.title) {
          ctx.fillStyle = K.ink || '#F4F5F8';
          ctx.font = F(K, 900, 48);
          ctx.textAlign = 'left';
          ctx.fillText(String(o.title), fx, topY + 40 * u, fw);
          topY += 60 * u;
        }
      }
      fy = topY;
    } else {
      const padX = 68 * u;
      let topY = H * .108;
      if (hasHead) {
        if (o.kicker) {
          drawKicker(ctx, K, o.kicker, padX, topY + 22 * u);
          topY += 44 * u;
        }
        if (o.title) {
          ctx.fillStyle = K.ink || '#F4F5F8';
          ctx.font = F(K, 900, 52);
          const lines = wrapCJK(ctx, String(o.title), W - padX * 2).slice(0, 2);
          lines.forEach((ln, i) => ctx.fillText(ln, padX, topY + (46 + i * 64) * u));
          topY += (lines.length * 64 + 24) * u;
        }
      }
      const maxBot = H * .775;
      fx = padX; fy = topY + (1 - p) * 20 * u;
      fw = W - padX * 2; fh = Math.max(360 * u, maxBot - topY);
    }
    drawDarkTechMedia(ctx, K, t, fx, fy, fw, fh, o);
    ctx.restore();
    return { x: fx, y: fy, w: fw, h: fh };
  }

  // 3) mediaSplit（整屏）：16:9 漂浮媒体窗 + 无死区垂直居中排版列（text / glowing metric / 叠层玻璃 list）
  function mediaSplit(ctx, K, t, o = {}) {
    const u = K.u || SHORT / 1080, p = pop(t, .55);
    const mediaSecond = o.mediaSide === 'right' || o.mediaSide === 'bottom';
    ctx.save();
    ctx.globalAlpha = p;
    let mx, my, mw, mh, ix, iy, iw, ih;
    if (LAND) {
      const midY = H * .465, gap = 66 * u;
      mw = 950 * u; mh = 576 * u; iw = 720 * u; ih = mh;
      const padX = (W - mw - iw - gap) / 2;
      if (!mediaSecond) { mx = padX; ix = padX + mw + gap; }
      else { ix = padX; mx = padX + iw + gap; }
      my = midY - mh / 2 + (1 - p) * 22 * u;
      iy = midY - ih / 2 + (1 - p) * 22 * u;
    } else {
      const padX = 64 * u, topY = H * .108, botY = H * .772, gap = 36 * u;
      mx = padX; ix = padX;
      mw = W - padX * 2; mh = 536 * u;
      iw = mw; ih = Math.max(260 * u, botY - topY - mh - gap);
      if (!mediaSecond) { my = topY; iy = topY + mh + gap; }
      else { iy = topY; my = topY + ih + gap; }
      my += (1 - p) * 18 * u; iy += (1 - p) * 18 * u;
    }

    drawDarkTechMedia(ctx, K, t, mx, my, mw, mh, o);

    // 信息区：去掉大空壳框，先测量内容总高并在安全区内精确垂直居中
    const cx0 = ix, cw = iw, kind = o.infoKind || 'text';
    const kickerH = o.kicker ? (LAND ? 42 : 36) * u : 0;

    if (kind === 'metric') {
      const numPx = LAND ? 220 : 168;
      const numH = (LAND ? 196 : 150) * u;
      const ruleH = 26 * u;
      ctx.font = F(K, 700, LAND ? 38 : 32);
      const lblLines = o.label ? wrapCJK(ctx, String(o.label), cw).slice(0, 2) : [];
      const lblLH = (LAND ? 52 : 44) * u;
      const lblH = lblLines.length * lblLH;
      const subH = o.sub ? 36 * u : 0;
      const totalH = kickerH + numH + ruleH + lblH + subH;
      let cy = iy + (ih - totalH) / 2;

      if (o.kicker) {
        drawKicker(ctx, K, o.kicker, cx0, cy + 20 * u);
        cy += kickerH;
      }
      // 大数字背后的柔光与发光渐变数值
      const val = (o.from || 0) + ((o.to ?? 100) - (o.from || 0)) * pop(t, .95);
      const numTxt = (o.prefix || '') + val.toFixed(o.digits || 0) + (o.suffix || '');
      const ncx = cx0 + cw * .36, ncy = cy + numH * .48;
      const nglow = ctx.createRadialGradient(ncx, ncy, 0, ncx, ncy, 240 * u);
      nglow.addColorStop(0, K.a ? K.a(.22) : 'rgba(139,123,255,.22)');
      nglow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nglow;
      ctx.fillRect(cx0 - 40 * u, cy - 40 * u, cw + 80 * u, numH + 80 * u);

      const ng = ctx.createLinearGradient(0, cy + 16 * u, 0, cy + numH);
      ng.addColorStop(0, '#FFFFFF');
      ng.addColorStop(1, K.hi || '#C8C0FF');
      ctx.save();
      ctx.font = F(K, 400, numPx, K.num || "'Bebas Neue'");
      ctx.textAlign = 'left';
      ctx.shadowColor = K.a ? K.a(.75) : 'rgba(139,123,255,.75)';
      ctx.shadowBlur = 52 * u;
      ctx.fillStyle = ng;
      ctx.fillText(numTxt, cx0, cy + numH - 18 * u, cw);
      ctx.shadowBlur = 0;
      ctx.fillText(numTxt, cx0, cy + numH - 18 * u, cw);
      ctx.restore();
      cy += numH;

      // 发光分割线
      const lw = 160 * u * pop(t - .2, .55);
      ctx.save();
      ctx.fillStyle = K.a ? K.a(1) : '#8B7BFF';
      ctx.shadowColor = K.a ? K.a(.8) : 'rgba(139,123,255,.8)';
      ctx.shadowBlur = 18 * u;
      ctx.fillRect(cx0, cy + 4 * u, lw, 4 * u);
      ctx.restore();
      cy += ruleH + 10 * u;

      if (lblLines.length) {
        ctx.fillStyle = K.ink || '#F4F5F8';
        ctx.font = F(K, 700, LAND ? 38 : 32);
        lblLines.forEach((ln, i) => ctx.fillText(ln, cx0, cy + 32 * u + i * lblLH));
        cy += lblH;
      }
      if (o.sub) {
        ctx.fillStyle = K.muted || 'rgba(244,245,248,.6)';
        ctx.font = F(K, 700, 22, K.mono || "'JetBrains Mono'");
        ctx.fillText(String(o.sub), cx0, cy + 22 * u, cw);
      }
    } else if (kind === 'list') {
      const tPx = LAND ? 48 : 40, tLH = (LAND ? 60 : 50) * u;
      ctx.font = F(K, 900, tPx);
      const tLines = o.title ? wrapCJK(ctx, String(o.title), cw).slice(0, 2) : [];
      const titleH = tLines.length ? (tLines.length * tLH + 22 * u) : 0;
      const items = (o.items || []).slice(0, 4);
      const rowH = (LAND ? 74 : 62) * u, rowGap = (LAND ? 14 : 10) * u;
      const listH = items.length ? (items.length * rowH + (items.length - 1) * rowGap) : 0;
      const totalH = kickerH + titleH + listH;
      let cy = iy + Math.max(0, (ih - totalH) / 2);

      if (o.kicker) {
        drawKicker(ctx, K, o.kicker, cx0, cy + 20 * u);
        cy += kickerH;
      }
      if (tLines.length) {
        ctx.fillStyle = K.ink || '#F4F5F8';
        ctx.font = F(K, 900, tPx);
        tLines.forEach((ln, i) => ctx.fillText(ln, cx0, cy + 40 * u + i * tLH));
        cy += titleH;
      }
      items.forEach((it, idx) => {
        const ip = pop(t - idx * .12, .45);
        const on = t >= idx * .12;
        const ry = cy + (1 - ip) * 14 * u;
        ctx.save();
        ctx.globalAlpha *= clamp(ip + .15);
        drawGlass(ctx, K, cx0, ry, cw, rowH, 16);
        if (on) {
          ctx.fillStyle = K.a ? K.a(.9) : '#8B7BFF';
          rr(ctx, cx0 + 14 * u, ry + rowH * .24, 5 * u, rowH * .52, 2.5 * u);
          ctx.fill();
        }
        const bx = cx0 + 34 * u, by = ry + (rowH - 34 * u) / 2;
        rr(ctx, bx, by, 34 * u, 34 * u, 10 * u);
        ctx.fillStyle = K.a ? K.a(.24) : 'rgba(139,123,255,.24)';
        ctx.fill();
        ctx.fillStyle = K.hi || '#FFFFFF';
        ctx.font = F(K, 700, 17, K.mono || "'JetBrains Mono'");
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(idx + 1).padStart(2, '0'), bx + 17 * u, by + 18 * u);
        ctx.textAlign = 'left';
        ctx.fillStyle = K.ink || '#F4F5F8';
        ctx.font = F(K, 700, LAND ? 25 : 22);
        ctx.fillText(String(it), bx + 50 * u, ry + rowH / 2 + 1 * u, cw - 98 * u);
        ctx.restore();
        cy += rowH + rowGap;
      });
    } else {
      const tPx = LAND ? 62 : 48, tLH = (LAND ? 78 : 60) * u;
      ctx.font = F(K, 900, tPx);
      const tLines = o.title ? wrapCJK(ctx, String(o.title), cw).slice(0, 3) : [];
      const titleH = tLines.length ? (tLines.length * tLH + 14 * u) : 0;
      const ruleH = 28 * u;
      const bPx = LAND ? 30 : 25, bLH = (LAND ? 46 : 38) * u;
      ctx.font = F(K, 400, bPx);
      const bLines = o.body ? wrapCJK(ctx, String(o.body), cw).slice(0, LAND ? 3 : 2) : [];
      const bodyH = bLines.length ? (bLines.length * bLH) : 0;
      const tags = Array.isArray(o.tags) ? o.tags.slice(0, 3) : [];
      const tagsH = tags.length ? 52 * u : 0;
      const totalH = kickerH + titleH + ruleH + bodyH + tagsH;
      let cy = iy + Math.max(0, (ih - totalH) / 2);

      if (o.kicker) {
        drawKicker(ctx, K, o.kicker, cx0, cy + 20 * u);
        cy += kickerH;
      }
      if (tLines.length) {
        ctx.fillStyle = K.ink || '#F4F5F8';
        ctx.font = F(K, 900, tPx);
        tLines.forEach((ln, i) => ctx.fillText(ln, cx0, cy + 52 * u + i * tLH));
        cy += titleH;
      }
      const lw = 96 * u * pop(t - .18, .5);
      ctx.save();
      ctx.fillStyle = K.a ? K.a(1) : '#8B7BFF';
      ctx.shadowColor = K.a ? K.a(.75) : 'rgba(139,123,255,.75)';
      ctx.shadowBlur = 16 * u;
      ctx.fillRect(cx0, cy + 4 * u, lw, 4 * u);
      ctx.restore();
      cy += ruleH + 10 * u;

      if (bLines.length) {
        ctx.fillStyle = K.muted || 'rgba(244,245,248,.66)';
        ctx.font = F(K, 400, bPx);
        bLines.forEach((ln, i) => ctx.fillText(ln, cx0, cy + 24 * u + i * bLH));
        cy += bodyH + 14 * u;
      }
      if (tags.length) {
        let tx = cx0;
        tags.forEach(tg => {
          ctx.save();
          ctx.font = F(K, 700, 18, K.mono || "'JetBrains Mono'");
          const tw = ctx.measureText(String(tg)).width + 26 * u, th = 34 * u;
          rr(ctx, tx, cy, tw, th, 17 * u);
          ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fill();
          ctx.strokeStyle = K.a ? K.a(.4) : 'rgba(255,255,255,.2)'; ctx.lineWidth = 1.2 * u; ctx.stroke();
          ctx.fillStyle = K.ink || '#F4F5F8';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(tg), tx + tw / 2, cy + th / 2 + 1 * u);
          ctx.restore();
          tx += tw + 12 * u;
        });
      }
    }
    ctx.restore();
    return { media: { x: mx, y: my, w: mw, h: mh }, info: { x: ix, y: iy, w: iw, h: ih } };
  }

  // 4) mediaPip（叠加）：安全角标画中画（圆形或暗色玻璃浮卡，避开左上角标与底部字幕安全区）
  function mediaPip(ctx, K, t, o = {}) {
    const u = K.u || SHORT / 1080, p = pop(t, .45);
    const isCircle = o.shape === 'circle';
    const pw = (isCircle ? (LAND ? 210 : 190) : (LAND ? 330 : 284)) * u;
    const ph = isCircle ? pw : pw * 0.62;
    const pos = o.pos || 'br';
    const mX = (LAND ? 64 : 56) * u;
    const topY = LAND ? 108 * u : H * .095;
    const botY = LAND ? H - 172 * u : H * .755;
    const x = pos === 'bl' ? mX : W - mX - pw;
    const y = (pos === 'tr' ? topY : botY - ph) + (1 - p) * 20 * u;
    ctx.save();
    ctx.globalAlpha = p;
    if (isCircle) {
      const cx = x + pw / 2, cy = y + ph / 2, r = pw / 2;
      const media = resolveSrc(o.src);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.clip();
      if (media) drawCover(ctx, media, x, y, pw, ph, { zoom: 1.04 });
      else drawPlaceholder(ctx, x, y, pw, ph, { K, kind: o.kind || 'T', mediaType: o.mediaType, tag: o.placeholderTag, label: '', radius: r, t });
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.strokeStyle = K.a ? K.a(.82) : '#8B7BFF';
      ctx.lineWidth = 3 * u;
      ctx.stroke();
    } else {
      drawDarkTechMedia(ctx, K, t, x, y, pw, ph, { ...o, chrome: false, credit: '' });
    }
    if (o.label) {
      ctx.font = F(K, 700, 18);
      const tw = Math.min(pw, ctx.measureText(o.label).width + 26 * u), th = 30 * u;
      const lx = x + (pw - tw) / 2, ly = y + ph - th * .55;
      rr(ctx, lx, ly, tw, th, 15 * u);
      ctx.fillStyle = 'rgba(5,5,10,.86)';
      ctx.fill();
      ctx.strokeStyle = K.a ? K.a(.62) : '#8B7BFF';
      ctx.lineWidth = 1.4 * u;
      ctx.stroke();
      ctx.fillStyle = K.ink || '#F4F5F8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(o.label), lx + tw / 2, ly + th / 2 + 1 * u, tw - 12 * u);
    }
    ctx.restore();
    return { x, y, w: pw, h: ph };
  }

  const slots = { mediaBg, mediaSplit, mediaFrame, mediaPip };
  if (typeof DK !== 'undefined') Object.assign(DK, slots);
  if (typeof PACK !== 'undefined') Object.assign(PACK, slots);
})();
