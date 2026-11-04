// C-058 的游戏本体：一个横版动作小游戏，键盘可以真的玩（samples/C-058/play.html）。
// 规则全部按固定步长（1/120 秒）推进，输入只来自 keys 这张表，所以同一串输入每次跑出来的结果一样；
// 样片就是让脚本按写好的输入玩一遍（scene.js），玩家自己玩时 play.html 把真实键盘接到同一张表上。
const GW = 960, GH = 540, STEP = 1 / 120, GRAV = 1700;

function newGame() {
  const R = mulberry32(99);
  const plats = [{ x: 0, y: 470, w: 1700, h: 70 }];
  for (const [x, y, w] of [[320, 372, 150], [560, 300, 140], [830, 372, 170], [1120, 316, 160], [1380, 250, 150]])
    plats.push({ x, y, w, h: 22 });
  const coins = [[360, 320], [600, 250], [880, 320], [1160, 264], [1420, 198], [1000, 420]].map(([x, y]) => ({ x, y, got: 0 }));
  const foes = [{ x: 700, y: 440, dir: 1, x0: 640, x1: 800, dead: 0 }, { x: 1240, y: 440, dir: -1, x0: 1180, x1: 1330, dead: 0 }];
  return { t: 0, p: { x: 60, y: 420, vx: 0, vy: 0, on: 1, face: 1, hurt: 0 }, plats, coins, foes, score: 0, lamp: R, flash: 0, done: 0 };
}

// 推进一步：keys = {left, right, jump}
function stepGame(g, keys) {
  const p = g.p, acc = keys.left ? -2600 : keys.right ? 2600 : 0;
  p.vx += acc * STEP;
  if (!acc) p.vx *= .86;
  p.vx = clamp(p.vx, -340, 340);
  if (acc) p.face = Math.sign(acc);
  if (keys.jump && p.on) { p.vy = -620; p.on = 0; g.flash = .12; }
  p.vy += GRAV * STEP;
  p.x += p.vx * STEP; p.y += p.vy * STEP;
  p.on = 0;
  for (const s of g.plats) {                                   // 只做从上往下的落地判定
    if (p.x + 18 > s.x && p.x - 18 < s.x + s.w && p.y >= s.y - 2 && p.y <= s.y + 30 && p.vy >= 0) { p.y = s.y; p.vy = 0; p.on = 1; }
  }
  if (p.y > GH + 200) { p.x = 60; p.y = 420; p.vy = 0; }
  for (const c of g.coins) if (!c.got && Math.hypot(c.x - p.x, c.y - p.y + 26) < 40) { c.got = g.t; g.score += 10; }
  for (const f of g.foes) {
    if (f.dead) continue;
    f.x += f.dir * 78 * STEP;
    if (f.x < f.x0 || f.x > f.x1) f.dir *= -1;
    const dx = Math.abs(f.x - p.x), dy = p.y - f.y;
    if (dx < 34 && dy > -46 && dy < 18) {
      if (p.vy > 60) { f.dead = g.t; g.score += 50; p.vy = -420; g.flash = .18; }    // 踩中
      else if (!p.hurt) { p.hurt = g.t; p.vx = -p.face * 260; p.vy = -300; }
    }
  }
  if (p.hurt && g.t - p.hurt > .6) p.hurt = 0;
  g.flash = Math.max(0, g.flash - STEP);
  g.t += STEP;
  return g;
}

// 画一帧（画到 ctx 上，坐标是 960×540 的游戏内坐标，镜头跟着角色）
function drawGame(ctx, g, cam) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, GH);
  sky.addColorStop(0, '#1A1038'); sky.addColorStop(.6, '#3A1E4E'); sky.addColorStop(1, '#5B2A46');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, GW, GH);
  for (let k = 0; k < 40; k++) {                               // 远景：星和塔
    const x = (k * 137.5 % 1600) - cam * .25, y = 40 + (k * 53 % 220);
    ctx.fillStyle = `rgba(255,230,180,${.2 + hash1(k) * .5})`; ctx.fillRect(x, y, 2, 2);
  }
  for (let k = 0; k < 9; k++) {
    const x = k * 230 - cam * .45, h = 140 + hash1(k + 3) * 150;
    ctx.fillStyle = '#231541'; ctx.fillRect(x, GH - h - 70, 120, h);
    for (let w = 0; w < 10; w++) if (hash1(k * 31 + w) > .55) { ctx.fillStyle = 'rgba(255,196,96,.5)'; ctx.fillRect(x + 16 + (w % 3) * 32, GH - h - 50 + Math.floor(w / 3) * 34, 16, 20); }
  }
  ctx.translate(-cam, 0);
  for (const s of g.plats) {                                   // 平台
    ctx.fillStyle = '#2E2350'; ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = '#7B5CC4'; ctx.fillRect(s.x, s.y, s.w, 6);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(s.x, s.y + 6, s.w, 3);
  }
  for (const c of g.coins) {                                   // 金币：转动；吃掉后弹一下消失
    if (c.got) { const k = g.t - c.got; if (k > .45) continue; ctx.globalAlpha = 1 - k / .45; ctx.fillStyle = '#FFD75E'; ctx.beginPath(); ctx.arc(c.x, c.y - k * 120, 10 * (1 - k), 0, TAU); ctx.fill(); ctx.globalAlpha = 1; continue; }
    const w = Math.abs(Math.cos(g.t * 4 + c.x));
    ctx.fillStyle = '#FFD75E'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 4 + 9 * w, 13, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#B8862A'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 2 + 4 * w, 6, 0, 0, TAU); ctx.fill();
  }
  for (const f of g.foes) {                                    // 小怪
    if (f.dead) { const k = g.t - f.dead; if (k > .3) continue; ctx.globalAlpha = 1 - k / .3; ctx.fillStyle = '#E8556B'; ctx.fillRect(f.x - 20, f.y - 8 + k * 40, 40, 14 * (1 - k)); ctx.globalAlpha = 1; continue; }
    ctx.fillStyle = '#E8556B'; ctx.fillRect(f.x - 20, f.y - 34, 40, 34);
    ctx.fillStyle = '#2A1030'; ctx.fillRect(f.x - 12 + f.dir * 5, f.y - 26, 7, 7); ctx.fillRect(f.x + 5 + f.dir * 5, f.y - 26, 7, 7);
    ctx.fillStyle = '#9C2A44'; ctx.fillRect(f.x - 20, f.y - 8, 40, 8);
  }
  const p = g.p, blink = p.hurt && Math.floor(g.t * 20) % 2;   // 主角
  if (!blink) {
    ctx.fillStyle = '#6FE3C5'; ctx.fillRect(p.x - 17, p.y - 44, 34, 44);
    ctx.fillStyle = '#17323A'; ctx.fillRect(p.x - 10 + p.face * 4, p.y - 34, 8, 8); ctx.fillRect(p.x + 3 + p.face * 4, p.y - 34, 8, 8);
    ctx.fillStyle = '#39B99C'; ctx.fillRect(p.x - 17, p.y - 10, 34, 10);
    if (!p.on) { ctx.fillStyle = 'rgba(111,227,197,.35)'; ctx.fillRect(p.x - 13, p.y, 26, 10); }
  }
  ctx.restore();
}
