// C-122 16-bit 街机闯关：Canvas 2D 在 320×180（竖屏 180×320）的小画布上逐像素画紫色星夜、闪烁的十字星、投币口、关卡地图、两个对战角色和血条，关掉平滑放大 6 倍；像素字直接写在大画布上，字号只用 48、96 这类 8 的倍数、坐标对齐到 6 像素网格；投币时整屏按 6 像素的整格抖动，最高分逐位从乱跳到定格，最后叠全屏扫描线。
// 风格提示词：用16-bit 街机闯关风格：紫色星夜和闪烁的像素星，全屏轻扫描线，故事走一遍游戏流程：投币开场伴随屏幕一震、闪烁的“按下开始”、角色在关卡地图上一格格跳到下一个节点、最高分逐位滚动、对战屏的血条，最后“通关”对话框，像素字只按 8 的倍数放大，配芯片音乐。
// 题材：游戏 · 适合：产品功能闯关、竞品对决、年度回顾
const ARC_HERO = ['...KKKK...', '..KWWWWK..', '.KWCWWCWK.', '.KWWWWWWK.', '..KRRRRK..', '.KBBBBBBK.', 'KBBBBBBBBK', 'KBBYBBYBBK', '.KBBBBBBK.', '..KK..KK..'];
const ARC_RIVAL = ['..KKKKKK..', '.KMMMMMMK.', 'KMMWWMWWMK', 'KMMWKMWKMK', 'KMMMMMMMMK', 'KMMKKKKMMK', 'KMMMMMMMMK', 'KMMMMMMMMK', 'KMKMMKMKMK', '.K.KK.K.K.'];
const ARC_PAL = { K: '#120A24', W: '#FFFFFF', C: '#38E0FF', R: '#FF3B5C', B: '#3A7BFF', Y: '#FFD23A', M: '#C23AFF' };
scene({
  id: 'C-122', name: '16-bit 街机闯关', dur: 5, still: 3.5,
  fonts: ["48px 'Press Start 2P'"],
  init() { const R = mulberry32(122), st = []; for (let i = 0; i < 60; i++) st.push([R(), R(), R()]); return { lo: LAND ? mk(320, 180) : mk(180, 320), st }; },
  draw(ctx, t, s, f) {
    const g = s.lo.getContext('2d'), LW = s.lo.width, LH = s.lo.height, P = W / LW;
    const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
    const spr = (rows, x, y, k = 1, flip) => rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') px(x + (flip ? r.length - 1 - i : i) * k, y + j * k, k, k, ARC_PAL[c]); }));
    const ph = t < 1.6 ? 0 : t < 2.9 ? 1 : t < 4.0 ? 2 : 3;
    // 紫色星夜
    for (let j = 0; j < LH; j++) px(0, j, LW, 1, ['#1A0838', '#22094A', '#2C0C5C', '#3A1070', '#4A1684'][Math.min(4, Math.floor(j / LH * 5))]);
    s.st.forEach(([x, y, p], i) => { const X = Math.floor(x * LW), Y = Math.floor(y * LH * .8), on = (Math.floor(t * 6 + p * 12) % 4); if (p > .8) { const c = on ? '#FFFFFF' : '#9C7CFF'; px(X, Y, 1, 1, c); if (on > 1) { px(X - 1, Y, 1, 1, c); px(X + 1, Y, 1, 1, c); px(X, Y - 1, 1, 1, c); px(X, Y + 1, 1, 1, c); } } else if (on) px(X, Y, 1, 1, p > .4 ? '#C9B8FF' : '#7A5CD6'); });
    const T = [];   // 像素字：[文字, 字号(8 的倍数), 网格 x, 网格 y, 颜色, 对齐]
    if (ph === 0) {
      // 投币口 + 落下的硬币
      const sx = LW / 2, sy = LAND ? 128 : 230;
      px(sx - 20, sy - 2, 40, 22, '#3A2A5C'); px(sx - 18, sy, 36, 18, '#5A4A8C'); px(sx - 2, sy + 4, 4, 10, '#0A0414');
      const ct = clamp((t - .15) / .4), cy = lerp(-10, sy + 4, ct * ct);
      if (t < .58) { const w = Math.max(1, Math.round(Math.abs(Math.cos(t * 14)) * 5)); px(sx - w, cy - 5, w * 2, 10, '#FFD23A'); px(sx - w, cy - 5, 1, 10, '#FFF3A0'); }
      T.push(['PIXEL QUEST', LAND ? 96 : 48, LW / 2, LAND ? 52 : 90, '#FFD23A', 'c', true]);
      if (t < .58) { if ((f >> 3) % 2) T.push(['INSERT COIN', 48, LW / 2, LAND ? 104 : 190, '#FFFFFF', 'c']); }
      else { T.push(['CREDIT 01', 48, LW / 2, LAND ? 92 : 172, '#38E0FF', 'c']); if ((f >> 2) % 2) T.push(['PRESS START', 48, LW / 2, LAND ? 110 : 200, '#FFFFFF', 'c']); }
    } else if (ph === 1) {
      // 关卡地图：点线路径 + 节点 + 跳格
      const N = LAND ? [[40, 130], [110, 90], [180, 128], [256, 84]] : [[40, 270], [128, 222], [52, 168], [130, 118]];
      for (let i = 0; i < 3; i++) { const [a, b] = [N[i], N[i + 1]]; for (let k = 0; k <= 12; k++) if (k % 2 === 0) px(lerp(a[0], b[0], k / 12) - 1, lerp(a[1], b[1], k / 12) - 1, 2, 2, '#C9B8FF'); }
      const hops = [1.85, 2.25, 2.65], at = hops.filter(h => t >= h + .3).length;
      N.forEach(([x, y], i) => { px(x - 8, y - 3, 16, 7, '#120A24'); px(x - 7, y - 2, 14, 5, i <= at ? '#FFD23A' : '#6A5AA0'); px(x - 7, y - 2, 14, 1, i <= at ? '#FFF3A0' : '#9A8AD0'); });
      N.forEach(([x, y], i) => T.push(['1-' + (i + 1), 48, x, y + 14, i <= at ? '#FFD23A' : '#9A8AD0', 'c']));
      let hx = N[0][0], hy = N[0][1]; hops.forEach((h, i) => { const k = clamp((t - h) / .3); if (k > 0) { hx = lerp(N[i][0], N[i + 1][0], k); hy = lerp(N[i][1], N[i + 1][1], k) - Math.sin(k * Math.PI) * 24; } });
      spr(ARC_HERO, Math.round(hx) - 10, Math.round(hy) - 22, 2);
      // 最高分逐位滚动
      const HS = '128450'; let sc = '';
      for (let i = 0; i < 6; i++) sc += t > 1.75 + i * .14 ? HS[i] : String(Math.floor(hash1(f * 13 + i * 7) * 10));
      T.push(['HI-SCORE', 48, LW / 2, LAND ? 18 : 22, '#FF3B5C', 'c']); T.push([sc, LAND ? 96 : 96, LW / 2, LAND ? 40 : 48, '#FFFFFF', 'c', true]);
    } else {
      // 对战屏：斜切两色 + 放大 3 倍的像素角色 + 血条
      const cut = (y) => Math.round(LW / 2 + (y - LH / 2) * (LAND ? .35 : .2));
      for (let j = 0; j < LH; j++) { const c = cut(j); px(0, j, c, 1, j % 4 < 2 ? '#2A3FC6' : '#2438B0'); px(c, j, LW - c, 1, j % 4 < 2 ? '#C62A6A' : '#B0245E'); px(c - 1, j, 2, 1, '#FFFFFF'); }
      const bt = t - 2.9, slide = 1 - eOutCubic(clamp(bt / .35)), K = LAND ? 4 : 5;
      const hxp = LAND ? 50 : 20, rxp = LAND ? 230 : 110, cy0 = LAND ? 60 : 160;
      const ko = ph === 3, rvBlink = bt > .9 && bt < 1.1 && (f >> 1) % 2;
      spr(ARC_HERO, hxp - Math.round(slide * 100), cy0 + (LAND ? 10 : -60), K);
      if (!rvBlink) spr(ARC_RIVAL, rxp + Math.round(slide * 100), cy0 + (ko ? 8 : 10) + (LAND ? 0 : 60), K, false);
      // 血条
      const hpL = 1, hpR = 1 - eOutCubic(clamp((bt - .5) / .6)) * .97;
      const bw = LAND ? 120 : 76, by = 8;
      [[8, hpL, '#FFD23A'], [LW - 8 - bw, hpR, hpR < .3 ? '#FF3B5C' : '#FFD23A']].forEach(([x, v, c], i) => { px(x - 1, by - 1, bw + 2, 8, '#FFFFFF'); px(x, by, bw, 6, '#120A24'); const w = Math.round(bw * v); px(i ? x + bw - w : x, by, w, 6, c); px(i ? x + bw - w : x, by, w, 1, '#FFF3A0'); });
      if (!ko) T.push(['VS', 96, LW / 2, LH / 2, '#FFFFFF', 'c', true]);
      T.push(['NEW', 48, 8, by + 18, '#FFFFFF', 'l']); T.push(['OLD', 48, LW - 8, by + 18, '#FFFFFF', 'r']);
      if (bt > .45 && bt < 1.5) { const hit = bt - .45; T.push(['-9999', 48, rxp + 20, cy0 - 6 - Math.round(hit * 20), '#FFD23A', 'c']); }
      if (ko) {
        // 通关对话框
        for (let j = 0; j < LH; j++) if (j % 2) px(0, j, LW, 1, 'rgba(10,4,20,.55)');
        const bw2 = LAND ? 200 : 160, bh = LAND ? 64 : 80, bx = (LW - bw2) / 2, byy = (LH - bh) / 2, pop = eOutBack(clamp((t - 4.0) / .25), 2);
        const h2 = Math.max(2, Math.round(bh * pop));
        px(bx - 2, LH / 2 - h2 / 2 - 2, bw2 + 4, h2 + 4, '#FFFFFF'); px(bx, LH / 2 - h2 / 2, bw2, h2, '#3A10A0'); px(bx + 2, LH / 2 - h2 / 2 + 2, bw2 - 4, h2 - 4, '#22096A');
        if (pop > .9) { T.push(['STAGE CLEAR!', 48, LW / 2, byy + (LAND ? 22 : 26), (f >> 2) % 2 ? '#FFD23A' : '#FFFFFF', 'c']); T.push(['BONUS +5000', 48, LW / 2, byy + (LAND ? 44 : 54), '#38E0FF', 'c']); }
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + t * 2, r = (LAND ? 120 : 84) * clamp((t - 4.05) / .5); const X = LW / 2 + Math.cos(a) * r, Y = LH / 2 + Math.sin(a) * r * .55; px(X, Y - 2, 1, 5, '#FFD23A'); px(X - 2, Y, 5, 1, '#FFD23A'); }
      }
    }
    // 放大：投币时整格抖动
    const sh = t > .55 && t < .8 ? Math.round((hash1(f * 3.7) - .5) * 4) * P : 0, sv = t > .55 && t < .8 ? Math.round((hash1(f * 5.3) - .5) * 4) * P : 0;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(s.lo, sh, sv, W, H); ctx.imageSmoothingEnabled = true;
    // 像素字：字号只用 8 的倍数，坐标落在格点上
    T.forEach(([txt, size, gx, gy, col, al, shadow]) => {
      ctx.font = `${size}px 'Press Start 2P'`; ctx.textBaseline = 'middle'; ctx.textAlign = al === 'c' ? 'center' : al === 'r' ? 'right' : 'left';
      const X = Math.round(gx * P / 6) * 6 + sh, Y = Math.round(gy * P / 6) * 6 + sv;
      ctx.fillStyle = '#120A24'; ctx.fillText(txt, X + size / 8, Y + size / 8); if (shadow) ctx.fillText(txt, X + size / 4, Y + size / 4);
      ctx.fillStyle = col; ctx.fillText(txt, X, Y);
    });
    // 扫描线
    ctx.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < H; y += P) ctx.fillRect(0, y + P - 2, W, 2);
    vignette(ctx, .45, .45);
  }
});
