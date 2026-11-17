// C-054 16-bit 像素 RPG：Canvas 2D 在 320×180（竖屏 180×320）的小画布上逐像素画草地、小路、树、旋转的存档水晶和勇者精灵，中文也直接用 12 像素字写在小画布上，最后关掉平滑整数倍放大；镜头不动，先在野外让蓝色对话框逐字打字，再用横条错位转场切进战斗：菜单光标跳动、勇者冲上去一刀、敌人隔帧闪烁、伤害数字弹起、敌人一行行消失。
// 风格提示词：用 90 年代主机 RPG 像素风格：内部分辨率 320×180 再整数倍放大，限定调色板，底部蓝色对话框逐字打出并带“哔哔”声，有战斗菜单、HP/MP 数值和存档点，镜头不动、场景靠切换，带回声的芯片音乐。
// 题材：游戏 · 适合：冒险故事
const RPG_HERO = [
  '.....HHHHHH.....', '....HHHHHHHH....', '...HHHHHHHHHH...', '...HHSSSSSSHH...', '...HSSSSSSSSH...', '...HSKSSSSKSH...', '...HSKSSSSKSH...', '....SSSSSSSS....', '.....SSSSSS.....',
  '....CCCCCCCC....', '...CBBBBBBBBC...', '..SCBBBYYBBBCS..', '..SCBBBBBBBBCS..', '..SCBBBBBBBBCS..', '...CBBBBBBBBC...', '....PPPPPPPP....', '....PPP..PPP....'];
const RPG_LEG = [['....PP....PP....', '....PP....PP....', '...KKK....KKK...'], ['...PP......PP...', '..PP........PP..', '.KKK........KKK.'], ['.....PP..PP.....', '.....PP..PP.....', '....KKK.KKK.....']];
const RPG_PAL = { H: '#7A3B12', S: '#F7C79A', K: '#1A1626', B: '#2F5BD6', Y: '#F2D03B', P: '#4A3A7A', C: '#C8323A', W: '#FFFFFF' };
scene({
  id: 'C-054', name: '16-bit 像素 RPG', dur: 5, still: 3.8,
  fonts: ["700 12px 'Noto Sans SC'", "8px 'Press Start 2P'"],
  text: '勇者触碰了存档点。……前方传来怪物的气息！攻击魔法道具逃跑勇者史莱姆被打倒了！获得12金币。',
  init() { return { lo: LAND ? mk(320, 180) : mk(180, 320) }; },
  draw(ctx, t, s, f) {
    const g = s.lo.getContext('2d'), LW = s.lo.width, LH = s.lo.height;
    const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
    const spr = (rows, x, y, flip) => rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') px(x + (flip ? r.length - 1 - i : i), y + j, 1, 1, RPG_PAL[c]); }));
    const hero = (x, y, step, flip) => spr([...RPG_HERO, ...RPG_LEG[step]], x, y, flip);
    const box = (x, y, w, h) => { px(x, y, w, h, '#FFFFFF'); px(x + 1, y + 1, w - 2, h - 2, '#9AA0B8'); for (let j = 0; j < h - 4; j++) px(x + 2, y + 2 + j, w - 4, 1, j < (h - 4) / 2 ? '#1E2E9E' : '#16247E'); };
    const say = (lines, x, y, t0) => { g.font = "700 12px 'Noto Sans SC'"; g.textBaseline = 'top'; g.fillStyle = '#FFFFFF'; let n = Math.max(0, Math.floor((t - t0) / .055)); lines.forEach((ln, i) => { const part = [...ln].slice(0, n).join(''); n -= [...ln].length; g.fillText(part, x, y + i * 16); }); return n >= 0; };
    g.imageSmoothingEnabled = false;
    if (t < 2.8) {
      // —— 野外 ——
      for (let ty = 0; ty < LH; ty += 16) for (let tx = 0; tx < LW; tx += 16) {
        px(tx, ty, 16, 16, '#4CA84A');
        for (let k = 0; k < 5; k++) { const h = hash2(tx + k * 7, ty + k * 13); px(tx + Math.floor(h * 14), ty + Math.floor(hash1(h * 99 + k) * 14), 1, 2, '#2E7A36'); }
      }
      const py = LAND ? 96 : 150;
      for (let x = 0; x < LW; x += 16) { px(x, py, 16, 16, '#D9B26A'); px(x, py, 16, 1, '#B88A44'); px(x, py + 15, 16, 1, '#B88A44'); px(x + 5, py + 6, 2, 1, '#B88A44'); px(x + 11, py + 10, 1, 1, '#B88A44'); }
      const tree = (x, y) => { px(x + 10, y + 22, 6, 10, '#6B3A1A'); px(x + 10, y + 22, 2, 10, '#8A5230'); for (let j = 0; j < 28; j++) for (let i = 0; i < 28; i++) { const d = Math.hypot(i - 13.5, j - 13.5); if (d < 14) px(x - 1 + i, y + j - 2, 1, 1, d > 12.5 ? '#14502A' : (i + j) % 7 === 0 || (i < 11 && j < 10 && d < 11) ? '#3FA24E' : '#23753A'); } };
      (LAND ? [[20, 40], [60, 20], [250, 30], [290, 60], [30, 130], [270, 120], [140, 20]] : [[10, 40], [60, 20], [140, 60], [20, 190], [140, 190], [90, 80]]).forEach(([x, y]) => tree(x, y));
      // 存档水晶：转动的菱形 + 光圈
      const cx = LAND ? 210 : 120, cy = py - 6, pulse = (Math.sin(t * 6) + 1) / 2;
      g.fillStyle = `rgba(160,220,255,${.25 + .2 * pulse})`; g.beginPath(); g.ellipse(cx, py + 12, 12 + pulse * 3, 4, 0, 0, TAU); g.fill();
      const wq = Math.max(1, Math.round(Math.abs(Math.cos(t * 3)) * 6)), bob = Math.round(Math.sin(t * 4) * 2);
      for (let j = 0; j < 16; j++) { const w = Math.round(wq * (1 - Math.abs(j - 7) / 8)); if (w > 0) { px(cx - w, cy + j + bob - 8, w * 2, 1, j < 7 ? '#8FE3FF' : '#3E8EE8'); px(cx - w, cy + j + bob - 8, 1, 1, '#FFFFFF'); } }
      if ((f >> 2) % 3 === 0) px(cx + 4, cy - 10 + bob, 1, 3, '#FFFFFF'), px(cx + 3, cy - 9 + bob, 3, 1, '#FFFFFF');
      // 勇者走到水晶旁
      const hx = Math.round(lerp(LAND ? 30 : 10, cx - 30, clamp(t / 1.5))), walking = t < 1.5;
      hero(hx, py - 6, walking ? 1 + ((f >> 3) % 2) : 0, false);
      // 碰到存档点：一圈光
      const sv = t - 1.55; if (sv > 0 && sv < .5) { g.strokeStyle = '#FFFFFF'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, cy, sv * 60, sv * 30, 0, 0, TAU); g.stroke(); }
      // 对话框
      const bx = 6, by = LAND ? 126 : 232, bw = LW - 12, bh = LAND ? 48 : 80;
      box(bx, by, bw, bh);
      const done = say(LAND ? ['勇者触碰了存档点。', '……前方传来怪物的气息！'] : ['勇者触碰了', '存档点。', '……前方传来', '怪物的气息！'], bx + 10, by + 7, .5);
      if (done && (f >> 3) % 2) { px(bx + bw - 14, by + bh - 9, 5, 1, '#FFFFFF'); px(bx + bw - 13, by + bh - 8, 3, 1, '#FFFFFF'); px(bx + bw - 12, by + bh - 7, 1, 1, '#FFFFFF'); }
      // 转场：横条交错滑入
      const tr = clamp((t - 2.45) / .35);
      if (tr > 0) for (let j = 0; j < LH; j += 6) { const w = Math.round(LW * tr * 1.2); (j / 6) % 2 ? px(0, j, w, 6, '#000') : px(LW - w, j, w, 6, '#000'); }
    } else {
      // —— 战斗 ——
      const bt = t - 2.8, bands = ['#1A0E3A', '#24145A', '#2E1E78', '#3A2A92', '#4A3AA6', '#5C4EBA'];
      for (let j = 0; j < LH; j++) px(0, j, LW, 1, bands[Math.min(5, Math.floor(j / (LAND ? 22 : 36)))]);
      const gy = LAND ? 112 : 196;
      for (let j = gy; j < LH; j++) px(0, j, LW, 1, (j - gy) % 6 < 3 ? '#2A6A3A' : '#235A32');
      // 敌人：像素团
      const ex = LAND ? 90 : 70, ey = LAND ? 98 : 120, gone = clamp((bt - 1.45) / .4) * 22, flick = bt > 1.02 && bt < 1.3 && (f >> 1) % 2;
      if (!flick) for (let j = 0; j < 22; j++) { if (j < gone) continue; const yy = j - 11, ww = Math.round(Math.sqrt(Math.max(0, 1 - (yy / 11) ** 2)) * 17 * (1 + .06 * Math.sin(t * 8 + j * .2)) * (j > 11 ? 1.1 : 1)); for (let i = -ww; i < ww; i++) px(ex + i, ey + j - 11, 1, 1, i === -ww || i === ww - 1 || j === 0 ? '#1A1626' : i < -ww * .4 && j < 8 ? '#9CF0FF' : j > 15 ? '#1E7AB8' : '#36A2E0'); }
      if (!flick && gone < 8) { px(ex - 6, ey - 3, 3, 4, '#FFFFFF'); px(ex + 4, ey - 3, 3, 4, '#FFFFFF'); px(ex - 5, ey - 2, 2, 3, '#1A1626'); px(ex + 4, ey - 2, 2, 3, '#1A1626'); px(ex - 3, ey + 4, 7, 1, '#1A1626'); }
      // 勇者：冲上去、砍、回来
      const hx0 = LAND ? 240 : 128, hy0 = gy - 22, dash = clamp((bt - .7) / .2) - clamp((bt - 1.3) / .25);
      const hx = Math.round(lerp(hx0, ex + 20, dash));
      hero(hx, Math.round(lerp(hy0, ey - 12, LAND ? 0 : dash)), dash > 0 && dash < 1 ? 2 : 0, true);
      if (bt > .9 && bt < 1.05) { g.strokeStyle = '#FFFFFF'; g.lineWidth = 2; g.beginPath(); g.arc(ex + 4, ey - 2, 16, -1.2 + (bt - .9) * 10, .2 + (bt - .9) * 10); g.stroke(); }
      // 伤害数字
      const dm = bt - .95; if (dm > 0 && dm < 1) { const jy = Math.round(-Math.abs(Math.sin(Math.min(dm, .5) * TAU)) * 10 * (1 - dm)); g.font = "8px 'Press Start 2P'"; g.textBaseline = 'top'; g.fillStyle = '#1A1626'; g.fillText('128', ex - 11, ey - 26 + jy); g.fillStyle = '#FFFFFF'; g.fillText('128', ex - 12, ey - 27 + jy); }
      // 菜单 / 状态
      const by = LAND ? 126 : 232, bh = LAND ? 48 : 80;
      if (bt < 1.75) {
        const mw = LAND ? 116 : 80;
        box(6, by, mw, bh);
        g.font = "700 12px 'Noto Sans SC'"; g.textBaseline = 'top'; g.fillStyle = '#FFFFFF';
        const CMD = ['攻击', '魔法', '道具', '逃跑'], cur = bt < .35 ? 2 : bt < .55 ? 1 : 0;
        CMD.forEach((c, i) => g.fillText(c, (LAND ? 22 + (i % 2) * 50 : 22) + 0, by + (LAND ? 8 + Math.floor(i / 2) * 18 : 6 + i * 17)));
        if (bt > .6 || (f >> 2) % 2) { const cx = LAND ? 12 + (cur % 2) * 50 : 12, cy = by + (LAND ? 11 + Math.floor(cur / 2) * 18 : 9 + cur * 17); px(cx, cy, 6, 6, '#FFFFFF'); px(cx + 1, cy + 1, 4, 4, '#F2D03B'); }
        const sx = 6 + mw + 4, sw = LW - sx - 6;
        box(sx, by, sw, bh);
        g.fillStyle = '#FFFFFF'; g.fillText('勇者', sx + 8, by + 7);
        g.font = "8px 'Press Start 2P'";
        const bar = (lab, v, mx, y, col) => { g.fillStyle = '#FFFFFF'; g.fillText(lab, sx + (LAND ? 52 : 8), y); const bw2 = LAND ? 60 : 46; px(sx + (LAND ? 72 : 28), y + 1, bw2, 6, '#0A0A20'); px(sx + (LAND ? 72 : 28), y + 1, Math.round(bw2 * v / mx), 6, col); g.fillText(String(v), sx + (LAND ? 136 : 8), y + (LAND ? 0 : 10)); };
        bar('HP', 132, 150, by + (LAND ? 9 : 26), '#4CE070'); bar('MP', 24, 40, by + (LAND ? 27 : 48), '#4C9CF0');
      } else {
        box(6, by, LW - 12, bh);
        say(LAND ? ['史莱姆被打倒了！', '获得 12 金币。'] : ['史莱姆', '被打倒了！', '获得 12 金币。'], 16, by + 7, 2.8 + 1.75);
      }
      // 进场：从黑中拉开
      const op = clamp(bt / .25); if (op < 1) for (let j = 0; j < LH; j += 6) { const w = Math.round(LW * (1 - op)); (j / 6) % 2 ? px(0, j, w, 6, '#000') : px(LW - w, j, w, 6, '#000'); }
    }
    ctx.imageSmoothingEnabled = false; ctx.drawImage(s.lo, 0, 0, W, H); ctx.imageSmoothingEnabled = true;
  }
});
