// C-037 象形图运动图形：Canvas 2D 画纯色闪卡，每 4 拍硬切一张；上下两条“核心图形”带是一格格圆、半圆、四分之一圆的方砖，各行每拍反向滑一格；中间的圆头杆状小人由关节角度算出姿势（跑、跨栏、举），双语粗体字从遮罩下沿滑上来。
// 风格提示词：用象形图运动图形风格：纯色平涂底加方格“核心图形”（圆、半圆、小花纹格，各行互相滑动），圆头杆状几何小人做动作，双语粗体字从下往上滑出，每张闪卡卡在节拍上切换，没有描边和纹理。
// 题材：平面设计与动态排版 · 适合：赛事、分类介绍
scene({
  id: 'C-037', name: '象形图运动图形', dur: 4.5, still: 2.3,
  fonts: ["900 80px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  text: '跑步跨栏举重RUNNINGHURDLESWEIGHTLIFTING',
  init() { return {}; },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    const CARDS = [
      { bg: '#1D3FBF', hi: '#3E63E0', lo: '#14309A', zh: '跑步', en: 'RUNNING', sport: 'run' },
      { bg: '#E23B6E', hi: '#F2648F', lo: '#B92A57', zh: '跨栏', en: 'HURDLES', sport: 'jump' },
      { bg: '#0F9A74', hi: '#2DBA92', lo: '#0A7A5B', zh: '举重', en: 'WEIGHTLIFTING', sport: 'lift' }];
    const ci = Math.min(2, Math.floor(t / (4 * BEAT))), lt = t - ci * 4 * BEAT, C = CARDS[ci];
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    // 核心图形带：每格一种形状，行与行反向滑动，滑动卡在节拍上
    const T = 120 * u, beat = t / BEAT, bi = Math.floor(beat), bp = eOutCubic(clamp((beat - bi) / .45));
    const band = (y0, nRows, seed) => {
      for (let r = 0; r < nRows; r++) {
        const dir = (r + seed) % 2 ? 1 : -1, off = dir * (bi + bp) * T;
        const y = y0 + r * T, n = Math.ceil(W / T) + 3;
        for (let k = -2; k < n; k++) {
          const gx = k - Math.floor(off / T), x = k * T + (off % T);
          const h = hash2(gx + 31 * ci, r + seed * 7), kind = Math.floor(h * 6);
          const rot = Math.floor(hash2(gx, r + 99) * 4) * Math.PI / 2;
          ctx.save(); ctx.translate(x + T / 2, y + T / 2); ctx.rotate(rot);
          ctx.fillStyle = h > .5 ? C.hi : C.lo;
          const q = T / 2;
          if (kind === 0) { ctx.beginPath(); ctx.arc(0, 0, q * .9, 0, TAU); ctx.fill(); }
          else if (kind === 1) { ctx.beginPath(); ctx.arc(0, q, q * 1.0, Math.PI, TAU); ctx.fill(); }
          else if (kind === 2) { ctx.beginPath(); ctx.moveTo(-q, -q); ctx.arc(-q, -q, T, 0, Math.PI / 2); ctx.closePath(); ctx.fill(); }
          else if (kind === 3) { ctx.fillRect(-q, -q, T, T); ctx.fillStyle = C.bg; ctx.beginPath(); ctx.arc(0, 0, q * .5, 0, TAU); ctx.fill(); }
          else if (kind === 4) { for (let j = 0; j < 3; j++) ctx.fillRect(-q, -q + j * T / 3, T, T / 6); }
          else { ctx.beginPath(); ctx.arc(-q / 2, 0, q / 2, 0, TAU); ctx.arc(q / 2, 0, q / 2, 0, TAU); ctx.fill(); }
          ctx.restore();
        }
      }
    };
    if (LAND) { band(0, 1, 0); band(H - T, 1, 1); }
    else { band(0, 2, 0); band(H - 2 * T, 2, 1); }
    // 小人面板
    const pop = eOutBack(clamp(lt / .3), 2.2);
    const pw = LAND ? 640 * u : 760 * u, pcx = LAND ? W * .3 : W / 2, pcy = LAND ? H / 2 : H * .4;
    ctx.save(); ctx.translate(pcx, pcy); ctx.scale(pop, pop);
    ctx.translate(0, -pw * .06);
    ctx.fillStyle = '#FFFFFF'; rr(ctx, -pw / 2, -pw / 2, pw, pw, pw * .08); ctx.fill();
    // 姿势：关节点由角度算出；单位长度 L，躯干竖直向上
    const L = pw * .18, lw = L * .36, ph = lt * TAU / (4 * BEAT) * 2;
    const seg = (p, a, len) => [p[0] + Math.sin(a) * len, p[1] + Math.cos(a) * len];
    let hip = [0, L * .55], lean = 0, legs, arms, extra = null;
    if (C.sport === 'run') {
      const sw = Math.sin(ph * 2);
      hip = [0, L * .45 - Math.abs(Math.cos(ph * 2)) * L * .12]; lean = .25;
      legs = [[sw * .9, .2 + Math.max(0, -sw) * 1.4], [-sw * .9, .2 + Math.max(0, sw) * 1.4]];
      arms = [[-sw * 1.1, 1.4], [sw * 1.1, 1.4]];
    } else if (C.sport === 'jump') {
      // 跨栏：从左跑到右，过栏时前腿伸直、后腿侧收
      const jp = clamp((lt - .1) / 1.2), air = smooth(.3, .5, jp) * (1 - smooth(.62, .82, jp));
      const sw = Math.sin(jp * 14);
      hip = [lerp(-L * 1.6, L * 1.6, jp), L * .45 - air * L * .55]; lean = .25 + air * .35;
      legs = [[lerp(sw * .9, 1.45, air), lerp(.2 + Math.max(0, -sw) * 1.4, 0, air)], [lerp(-sw * .9, -1.0, air), lerp(.2 + Math.max(0, sw) * 1.4, 1.7, air)]];
      arms = [[lerp(-sw * 1.1, 1.6, air), lerp(1.4, .2, air)], [lerp(sw * 1.1, -1.0, air), lerp(1.4, .8, air)]];
      extra = 'bar';
    } else {
      const up = smooth(.2, .9, lt), sq = Math.sin(up * Math.PI) * .8;
      hip = [0, L * .55 + sq * L * .35]; lean = 0;
      legs = [[.35 + sq * .5, sq * 1.2], [-.35 - sq * .5, -sq * 1.2]];
      arms = [[lerp(-.9, Math.PI + .2, up), lerp(1.6, 0, up)], [lerp(.9, Math.PI - .2, up), lerp(-1.6, 0, up)]];
      extra = 'bar2';
    }
    const neck = seg(hip, Math.PI - lean, L * 1.05), head = seg(hip, Math.PI - lean, L * 1.55);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = C.bg; ctx.fillStyle = C.bg; ctx.lineWidth = lw;
    const line = (a, b) => { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); };
    // 跳高的横杆
    if (extra === 'bar') { ctx.lineWidth = lw * .55; line([-L * .25, L * 1.05], [L * .25, L * 1.05]); ctx.lineWidth = lw * .3; line([-L * .05, L * 1.05], [-L * .05, L * 2.05]); line([L * .25, L * 1.05], [L * .25, L * 2.05]); ctx.lineWidth = lw; }
    line(hip, neck);
    const sh = seg(hip, Math.PI - lean, L * .9);
    const limbs = [];
    legs.forEach(([a, bend]) => { const k = seg(hip, a, L * .75), f = seg(k, a - bend, L * .75); limbs.push([hip, k, f]); });
    arms.forEach(([a, bend]) => { const e = seg(sh, a, L * .6), h = seg(e, a + bend, L * .55); limbs.push([sh, e, h]); });
    limbs.forEach(([a, b, c]) => { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.stroke(); });
    ctx.beginPath(); ctx.arc(head[0], head[1], L * .34, 0, TAU); ctx.fill();
    if (extra === 'bar2') {   // 杠铃在两只手之间
      const h1 = limbs[2][2], h2 = limbs[3][2], mx = (h1[0] + h2[0]) / 2, my = (h1[1] + h2[1]) / 2;
      ctx.lineWidth = lw * .3; line([mx - L * 1.6, my], [mx + L * 1.6, my]);
      [-1, 1].forEach(sd => { rr(ctx, mx + sd * L * 1.45 - L * .14, my - L * .55, L * .28, L * 1.1, L * .1); ctx.fill(); });
    }
    // 地面线
    ctx.lineWidth = lw * .3; line([-L * 2, L * 2.05], [L * 2, L * 2.05]);
    ctx.restore();
    // 双语字：从遮罩下沿滑上来
    const tx = LAND ? W * .58 : W / 2, ty = LAND ? H * .5 : H * .78;
    ctx.textAlign = LAND ? 'left' : 'center'; ctx.fillStyle = '#fff';
    const slide = (txt, font, y, size, d0) => {
      const p = eOutExpo(clamp((lt - d0) / .35));
      ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 1.0, W, size * 1.15); ctx.clip();
      ctx.font = font; ctx.fillText(txt, tx, y + (1 - p) * size * 1.2); ctx.restore();
    };
    const zs = (LAND ? 200 : 210) * u, es = (LAND ? 96 : 100) * u;
    slide(C.zh, `900 ${zs}px 'Noto Sans SC'`, ty, zs, .12);
    slide(C.en, `${es}px 'Bebas Neue'`, ty + es * 1.25, es, .22);
    // 卡号
    ctx.font = `${60 * u}px 'Bebas Neue'`; ctx.textAlign = LAND ? 'left' : 'center';
    ctx.globalAlpha = .7; ctx.fillText(`0${ci + 1} / 03`, tx, ty - zs * 1.05); ctx.globalAlpha = 1;
  }
});
