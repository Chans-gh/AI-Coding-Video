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

  function drawDarkTechMedia(ctx, K, t, x, y, w, h, o = {}) {
    const u = K.u || SHORT / 1080, rad = 24 * u;
    const media = resolveSrc(o.src);
    const hasChrome = o.chrome !== false && Math.min(w, h) >= 260 * u;
    const topBar = hasChrome ? 46 * u : 0;

    ctx.save();
    // 深色科技玻璃外框
    drawGlass(ctx, K, x, y, w, h, 24);
    if (hasChrome) {
      [1, .55, .25].forEach((al, i) => {
        ctx.fillStyle = K.a ? K.a(al) : `rgba(139,123,255,${al})`;
        ctx.beginPath();
        ctx.arc(x + 28 * u + i * 22 * u, y + 23 * u, 5.5 * u, 0, TAU);
        ctx.fill();
      });
      const tag = o.tag || (o.kind === 'G' ? 'AI GENERATED' : 'REAL MEDIA');
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
        K, kind: o.kind || 'T', label: o.placeholder || o.title || o.label || '待填入素材',
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
    const media = resolveSrc(o.src);
    const dim = clamp(o.dim ?? 0.6, 0, 0.88);
    const zoom = 1 + (o.zoom ?? 0.05) * clamp(t / 5);
    ctx.save();
    if (media) {
      drawCover(ctx, media, 0, 0, W, H, { zoom, fx: o.fx ?? .5, fy: o.fy ?? .5 });
    } else {
      ctx.fillStyle = K.bg0 || '#05050A';
      ctx.fillRect(0, 0, W, H);
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
    ctx.restore();
  }

  // 2) mediaFrame（整屏）：画框展示（素材占 75%–85% 主舞台 + 眉题/标题 + 暗色玻璃框与底角出处标）
  function mediaFrame(ctx, K, t, o = {}) {
    const u = K.u || SHORT / 1080, p = pop(t, .55);
    const hasHead = Boolean(o.kicker || o.title);
    ctx.save();
    ctx.globalAlpha = p;
    let fx, fy, fw, fh;
    if (LAND) {
      const padX = 108 * u;
      let topY = 98 * u;
      if (hasHead) {
        if (o.kicker) {
          ctx.save();
          ctx.fillStyle = K.a ? K.a(1) : '#8B7BFF';
          ctx.font = F(K, 700, 22, K.mono);
          if ('letterSpacing' in ctx) ctx.letterSpacing = `${4 * u}px`;
          ctx.fillText(String(o.kicker).toUpperCase(), padX, 118 * u);
          ctx.restore();
        }
        if (o.title) {
          ctx.fillStyle = K.ink || '#F4F5F8';
          ctx.font = F(K, 900, 52);
          ctx.fillText(String(o.title), padX, (o.kicker ? 176 : 142) * u, W - padX * 2);
        }
        topY = (o.kicker && o.title ? 204 : 168) * u;
      }
      fx = padX; fy = topY + (1 - p) * 28 * u;
      fw = W - padX * 2; fh = H - topY - 156 * u;
    } else {
      const padX = 72 * u;
      let topY = H * .105;
      if (hasHead) {
        if (o.kicker) {
          ctx.save();
          ctx.fillStyle = K.a ? K.a(1) : '#8B7BFF';
          ctx.font = F(K, 700, 24, K.mono);
          if ('letterSpacing' in ctx) ctx.letterSpacing = `${4 * u}px`;
          ctx.fillText(String(o.kicker).toUpperCase(), padX, topY + 24 * u);
          ctx.restore();
          topY += 46 * u;
        }
        if (o.title) {
          ctx.fillStyle = K.ink || '#F4F5F8';
          ctx.font = F(K, 900, 56);
          const lines = wrapCJK(ctx, String(o.title), W - padX * 2).slice(0, 2);
          lines.forEach((ln, i) => ctx.fillText(ln, padX, topY + (48 + i * 68) * u));
          topY += (lines.length * 68 + 26) * u;
        }
      }
      const maxBot = H * .78;
      fx = padX; fy = topY + (1 - p) * 24 * u;
      fw = W - padX * 2; fh = Math.max(360 * u, maxBot - topY);
    }
    drawDarkTechMedia(ctx, K, t, fx, fy, fw, fh, o);
    ctx.restore();
    return { x: fx, y: fy, w: fw, h: fh };
  }

  // 3) mediaSplit（整屏）：双栏分屏（横版左右 55:45 / 竖版上下 52:48 严守 y <= H*0.78，信息槽支持 text / metric / list）
  function mediaSplit(ctx, K, t, o = {}) {
    const u = K.u || SHORT / 1080, p = pop(t, .55);
    const mediaSecond = o.mediaSide === 'right' || o.mediaSide === 'bottom';
    ctx.save();
    ctx.globalAlpha = p;
    let mx, my, mw, mh, ix, iy, iw, ih;
    if (LAND) {
      const padX = 96 * u, topY = 122 * u, botY = H - 156 * u, gap = 44 * u;
      const totW = W - padX * 2 - gap, wM = totW * .55, wI = totW * .45, hAll = botY - topY;
      if (!mediaSecond) { mx = padX; ix = padX + wM + gap; }
      else { ix = padX; mx = padX + wI + gap; }
      my = topY + (1 - p) * 26 * u; mh = hAll;
      iy = topY + (1 - p) * 26 * u; ih = hAll;
      mw = wM; iw = wI;
    } else {
      const padX = 72 * u, topY = H * .105, botY = H * .775, gap = 30 * u;
      const totH = botY - topY - gap, hM = totH * .52, hI = totH * .48, wAll = W - padX * 2;
      if (!mediaSecond) { my = topY; iy = topY + hM + gap; }
      else { iy = topY; my = topY + hI + gap; }
      mx = padX; mw = wAll; mh = hM;
      ix = padX; iw = wAll; ih = hI;
      my += (1 - p) * 20 * u; iy += (1 - p) * 20 * u;
    }

    drawDarkTechMedia(ctx, K, t, mx, my, mw, mh, o);

    // 右侧 / 下方暗色玻璃信息卡
    ctx.save();
    drawGlass(ctx, K, ix, iy, iw, ih, 24);
    rr(ctx, ix, iy, iw, ih, 24 * u);
    ctx.clip();

    const pad = (LAND ? 46 : 36) * u, cx0 = ix + pad, cw = iw - pad * 2;
    let cy = iy + pad;
    const kind = o.infoKind || 'text';
    if (o.kicker) {
      ctx.fillStyle = K.a ? K.a(1) : '#8B7BFF';
      ctx.fillRect(cx0, cy, 8 * u, 26 * u);
      ctx.save();
      ctx.fillStyle = K.a ? K.a(1) : '#8B7BFF';
      ctx.font = F(K, 700, 21, K.mono);
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${3 * u}px`;
      ctx.fillText(String(o.kicker).toUpperCase(), cx0 + 20 * u, cy + 21 * u, cw - 20 * u);
      ctx.restore();
      cy += 52 * u;
    }
    if (kind === 'metric') {
      const val = (o.from || 0) + ((o.to ?? 100) - (o.from || 0)) * pop(t, .95);
      const numTxt = (o.prefix || '') + val.toFixed(o.digits || 0) + (o.suffix || '');
      const ng = ctx.createLinearGradient(0, cy, 0, cy + (LAND ? 150 : 120) * u);
      ng.addColorStop(0, '#FFFFFF');
      ng.addColorStop(1, K.hi || '#C8C0FF');
      ctx.fillStyle = ng;
      ctx.font = F(K, 400, LAND ? 152 : 128, K.num);
      ctx.fillText(numTxt, cx0, cy + (LAND ? 132 : 112) * u, cw);
      cy += (LAND ? 170 : 142) * u;
      if (o.label) {
        ctx.fillStyle = K.ink || '#F4F5F8';
        ctx.font = F(K, 700, LAND ? 34 : 30);
        wrapCJK(ctx, String(o.label), cw).slice(0, 2).forEach((ln, i) => ctx.fillText(ln, cx0, cy + i * 44 * u));
      }
    } else if (kind === 'list') {
      if (o.title) {
        ctx.fillStyle = K.ink || '#F4F5F8';
        ctx.font = F(K, 900, LAND ? 46 : 40);
        const tl = wrapCJK(ctx, String(o.title), cw).slice(0, 2);
        tl.forEach((ln, i) => ctx.fillText(ln, cx0, cy + (40 + i * 54) * u));
        cy += (tl.length * 54 + 26) * u;
      }
      const items = (o.items || []).slice(0, 4);
      const step = Math.min(76 * u, Math.max(48 * u, (iy + ih - pad - cy) / Math.max(1, items.length)));
      items.forEach((it, idx) => {
        const ip = pop(t - idx * .12, .45);
        ctx.save();
        ctx.globalAlpha *= ip;
        rr(ctx, cx0, cy, 36 * u, 36 * u, 10 * u);
        ctx.fillStyle = K.a ? K.a(.24) : 'rgba(139,123,255,.24)';
        ctx.fill();
        ctx.fillStyle = K.hi || '#FFFFFF';
        ctx.font = F(K, 700, 18, K.mono);
        ctx.textAlign = 'center';
        ctx.fillText(String(idx + 1), cx0 + 18 * u, cy + 25 * u);
        ctx.textAlign = 'left';
        ctx.fillStyle = K.ink || '#F4F5F8';
        ctx.font = F(K, 700, LAND ? 27 : 24);
        ctx.fillText(String(it), cx0 + 50 * u, cy + 27 * u, cw - 50 * u);
        ctx.restore();
        cy += step;
      });
    } else {
      if (o.title) {
        ctx.fillStyle = K.ink || '#F4F5F8';
        ctx.font = F(K, 900, LAND ? 54 : 46);
        const tl = wrapCJK(ctx, String(o.title), cw).slice(0, 3);
        tl.forEach((ln, i) => ctx.fillText(ln, cx0, cy + (46 + i * (LAND ? 66 : 56)) * u));
        cy += (tl.length * (LAND ? 66 : 56) + 28) * u;
      }
      if (o.body) {
        ctx.fillStyle = K.muted || 'rgba(244,245,248,.66)';
        ctx.font = F(K, 700, LAND ? 28 : 25);
        wrapCJK(ctx, String(o.body), cw).slice(0, LAND ? 4 : 3).forEach((ln, i) => ctx.fillText(ln, cx0, cy + i * 40 * u));
      }
    }
    sweep(ctx, ix, iy, iw, ih, clamp((t - .45) / .75), .16);
    ctx.restore();
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
    const topY = LAND ? 64 * u : H * .095;
    const botY = LAND ? H - 156 * u : H * .755;
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
      else drawPlaceholder(ctx, x, y, pw, ph, { K, kind: o.kind || 'T', label: '', radius: r, t });
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
