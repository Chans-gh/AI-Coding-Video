// C-058 可玩游戏 / 模拟器录屏：game.js 是一个真能用键盘玩的横版动作小游戏（samples/C-058/play.html 打开就能玩）；
// 样片让脚本按写好的一串输入自动玩一遍并录下来：每帧都把游戏从 0 按 1/120 秒的固定步长重推到 t，所以每帧只由 t 决定；
// 外面保留模拟器外壳——HUD、镜头跟随、扫描线和画面边框。
// 风格提示词：先用 Canvas 2D 做一个可以真实操作的单文件 HTML 游戏（横版动作、机关、战斗、灯光闪烁），再让脚本自动玩一遍并录制 60 秒演示，保留 HUD 和菜单，镜头跟随角色。
// 题材：游戏 · 适合：游戏 demo、交互科普
scene({
  id: 'C-058', name: '可玩游戏 / 模拟器录屏', dur: 5, still: 3.2, needs: ['game.js'],
  text: '得分金币自动演示按键跳跃左右生命关卡',
  fonts: ["400 40px 'Press Start 2P'", "700 40px 'Noto Sans SC'"],
  init() {
    // 脚本玩法：[开始秒, 结束秒, 按键]，和人玩时按的是同一张表
    const SCRIPT = [
      [.10, 1.00, { right: 1 }], [.52, .60, { right: 1, jump: 1 }],
      [1.00, 1.30, { right: 1 }], [1.18, 1.26, { right: 1, jump: 1 }],
      [1.30, 1.95, { right: 1 }], [1.56, 1.64, { right: 1, jump: 1 }],
      [1.95, 2.35, { right: 1 }], [2.10, 2.18, { right: 1, jump: 1 }],
      [2.35, 3.05, { right: 1 }], [2.62, 2.70, { right: 1, jump: 1 }],
      [3.05, 3.60, { right: 1 }], [3.24, 3.32, { right: 1, jump: 1 }],
      [3.60, 4.30, { right: 1 }], [3.86, 3.94, { right: 1, jump: 1 }],
      [4.30, 5.00, { right: 1 }],
    ];
    const keysAt = t => {                                     // 某一刻按下的键
      const k = { left: 0, right: 0, jump: 0 };
      for (const [a, b, kk] of SCRIPT) if (t >= a && t < b) Object.assign(k, kk);
      return k;
    };
    const screen = mk(960, 540);
    return { keysAt, screen, sctx: screen.getContext('2d'), cache: { t: -1, g: null } };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080;
    // 每帧从头重推：同一个 t 永远得到同一局
    const g = newGame();
    const n = Math.round(t / (1 / 120));
    for (let k = 0; k < n; k++) stepGame(g, s.keysAt(k / 120));
    const cam = clamp(g.p.x - 330, 0, 1700 - 960);
    const sc = s.sctx;
    drawGame(sc, g, cam);
    if (g.flash > 0) { sc.fillStyle = `rgba(255,255,255,${g.flash * .5})`; sc.fillRect(0, 0, 960, 540); }   // 机关灯光闪
    // HUD：分数、生命、关卡，像素字
    sc.font = "16px 'Press Start 2P'"; sc.textAlign = 'left';
    sc.fillStyle = 'rgba(10,6,20,.55)'; sc.fillRect(16, 14, 290, 34); sc.fillRect(700, 14, 244, 34);
    sc.fillStyle = '#FFD75E'; sc.fillText(`SCORE ${String(g.score).padStart(4, '0')}`, 28, 37);
    sc.fillStyle = '#6FE3C5'; sc.textAlign = 'right'; sc.fillText('STAGE 1-2', 930, 37);
    sc.textAlign = 'left'; sc.fillStyle = '#E8556B';
    for (let k = 0; k < 3; k++) sc.fillRect(216 + k * 26, 22, 18, 18);
    // 画面外壳：横屏居中铺满，竖屏上面放屏幕、下面放按键提示
    ctx.fillStyle = '#0B0814'; ctx.fillRect(0, 0, W, H);
    const sw = LAND ? W : W, sh = sw * 540 / 960, sy = LAND ? (H - sh) / 2 : H * .22;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(s.screen, 0, sy, sw, sh);
    ctx.save();                                               // 扫描线
    ctx.globalAlpha = .18; ctx.fillStyle = '#000';
    for (let y = sy; y < sy + sh; y += 4 * u) ctx.fillRect(0, y, W, 2 * u);
    ctx.restore();
    ctx.strokeStyle = 'rgba(111,227,197,.35)'; ctx.lineWidth = 3 * u; ctx.strokeRect(2 * u, sy, W - 4 * u, sh);
    // 录屏角标和按键提示（看得出是自动演示）
    ctx.font = `${Math.round(22 * u)}px 'Press Start 2P'`; ctx.textAlign = 'left';
    ctx.fillStyle = Math.floor(t * 2) % 2 ? '#E8556B' : 'rgba(232,85,107,.35)';
    ctx.beginPath(); ctx.arc(46 * u, sy - 34 * u, 10 * u, 0, TAU); ctx.fill();
    ctx.fillStyle = '#EDE7FF'; ctx.fillText('AUTO DEMO', 68 * u, sy - 26 * u);
    const k = s.keysAt(t);
    const key = (x, y, lab, on) => {
      ctx.fillStyle = on ? '#6FE3C5' : 'rgba(255,255,255,.12)';
      rr(ctx, x, y, 92 * u, 92 * u, 14 * u); ctx.fill();
      ctx.fillStyle = on ? '#10212A' : 'rgba(255,255,255,.55)';
      ctx.font = `700 ${Math.round(34 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'center';
      ctx.fillText(lab, x + 46 * u, y + 60 * u);
    };
    const ky = LAND ? sy + sh + 40 * u : H * .74, kx = LAND ? W / 2 - 150 * u : W / 2 - 150 * u;
    key(kx, ky, '←', k.left); key(kx + 104 * u, ky, '→', k.right); key(kx + 208 * u, ky, '↑', k.jump);
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(237,231,255,.6)';
    ctx.font = `700 ${Math.round(30 * u)}px 'Noto Sans SC'`;
    ctx.fillText('脚本按这串输入自动玩；换成键盘就是可玩的游戏', W / 2, ky + 150 * u);
    grain(ctx, f, .12);
  }
});
