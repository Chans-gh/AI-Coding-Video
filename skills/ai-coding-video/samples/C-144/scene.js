// C-144 超现实主义：Canvas 2D 画青到杏黄的渐变天空和低地平线荒原，钟面、刻度、指针的每个点都过同一个变形函数（伸出石块边缘的部分按伸出量折向下方，再随时间往下拉长），于是整只钟像软蜡一样搭在石块上流淌；长腿动物的四条腿按步态相位摆动，石块和动物的影子用斜切变换拉得很长；第 2.6 秒起，新画面按一排液滴形的波浪边界从上往下流，盖住旧画面。
// 风格提示词：用超现实主义风格：无限延伸的平坦荒原和低地平线，傍晚斜光拉出极长的影子，日常物体以不合理的方式出现，钟表像软蜡一样往下流淌，长腿动物缓慢走过，形体画得写实、处境却荒谬，天空是澄澈的青到杏黄渐变，转场是新画面像液滴一样从上往下流下来盖住旧画面。
// 题材：手绘与绘画 · 适合：梦境与记忆、时间主题、哲学短片
scene({
  id: 'C-144', name: '超现实主义', dur: 4, still: 2.2,
  text: '时间在融化',
  fonts: ["700 40px 'Noto Serif SC'"],
  draw(ctx, t, s) {
    const u = SHORT / 1080, hz = H * (LAND ? .64 : .62), k = (LAND ? 1 : 1.15) * u;
    const sky = (a, b, g1, g2) => { let g = ctx.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz);
      g = ctx.createLinearGradient(0, hz, 0, H); g.addColorStop(0, g1); g.addColorStop(1, g2); ctx.fillStyle = g; ctx.fillRect(0, hz, W, H - hz); };
    const shadow = (x, y, w, len, a) => { ctx.fillStyle = `rgba(40,25,20,${a})`; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w / 2 + len, y + len * .08); ctx.lineTo(x - w / 2 + len, y + len * .08); ctx.fill(); };
    const sceneA = () => {
      sky('#5FA8B8', '#F2C38A', '#D2A46C', '#7E5A3A');
      // 远处的长腿动物：缓慢走过
      const ax = W * (LAND ? .82 : .9) - t * 40 * u, ay = hz + 30 * u, lh = 260 * k, ph = t * 2.2;
      ctx.fillStyle = 'rgba(40,25,20,.25)'; ctx.beginPath(); ctx.moveTo(ax - 50 * k, ay); ctx.lineTo(ax + 50 * k, ay); ctx.lineTo(ax + 700 * k, ay + 26 * k); ctx.lineTo(ax + 640 * k, ay + 30 * k); ctx.fill();
      ctx.strokeStyle = '#3A2A24'; ctx.lineWidth = 5 * k; ctx.lineCap = 'round';
      [[-40, 0], [-25, Math.PI], [30, Math.PI * .5], [45, Math.PI * 1.5]].forEach(([dx, o]) => { const sw = Math.sin(ph + o) * 22 * k; ctx.beginPath(); ctx.moveTo(ax + dx * k, ay - lh); ctx.quadraticCurveTo(ax + dx * k + sw * .3, ay - lh * .5, ax + dx * k + sw, ay); ctx.stroke(); });
      const bg = ctx.createLinearGradient(0, ay - lh - 90 * k, 0, ay - lh + 20 * k); bg.addColorStop(0, '#8C7A6E'); bg.addColorStop(1, '#4A3A32'); ctx.fillStyle = bg;
      ctx.beginPath(); ctx.ellipse(ax, ay - lh - 30 * k, 80 * k, 50 * k, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ax - 95 * k, ay - lh - 50 * k, 32 * k, 28 * k, 0, 0, TAU); ctx.fill();
      ctx.lineWidth = 9 * k; ctx.strokeStyle = '#5A4A40'; ctx.beginPath(); ctx.moveTo(ax - 118 * k, ay - lh - 40 * k); ctx.quadraticCurveTo(ax - 140 * k, ay - lh + 40 * k, ax - 125 * k, ay - lh + 80 * k); ctx.stroke();
      // 石块和长影子
      const bx = W * (LAND ? .3 : .42), by = hz + (LAND ? 240 : 420) * u, bw = 300 * k, bh = 220 * k;
      shadow(bx, by, bw, 900 * k, .35);
      let g = ctx.createLinearGradient(bx - bw / 2, 0, bx + bw / 2, 0); g.addColorStop(0, '#E9CFA6'); g.addColorStop(1, '#B98E62'); ctx.fillStyle = g; ctx.fillRect(bx - bw / 2, by - bh, bw, bh);
      ctx.fillStyle = '#F3DFBD'; ctx.beginPath(); ctx.moveTo(bx - bw / 2, by - bh); ctx.lineTo(bx + bw / 2, by - bh); ctx.lineTo(bx + bw / 2 - 30 * k, by - bh - 40 * k); ctx.lineTo(bx - bw / 2 - 30 * k, by - bh - 40 * k); ctx.fill();
      ctx.fillStyle = '#8A6644'; ctx.fillRect(bx + bw / 2 - 2 * k, by - bh, 8 * k, bh);
      // 软钟：所有点过同一个变形
      const fy = by - bh, melt = .3 + .7 * eInOutCubic(inv(.2, 2.4, t)), cc = [bx + 20 * k, fy - 18 * k], R = 175 * k, dX = cc[0] + 50 * k;
      const wp = (x, y) => { const d = (y - fy) / .42; if (d <= 0) return [x, y]; return [cc[0] + (x - cc[0]) * (1 - .12 * d / R), fy + d * (.4 + .6 * melt) + d * melt * .8 * Math.exp(-(((x - dX) / (70 * k)) ** 2))]; };
      const ring = (rr, sy) => { ctx.beginPath(); for (let i = 0; i <= 80; i++) { const a = i / 80 * TAU, [x, y] = wp(cc[0] + Math.cos(a) * rr, cc[1] + Math.sin(a) * rr * sy); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); };
      ring(R, .42); ctx.fillStyle = '#C79A3E'; ctx.fill();
      ring(R * .88, .42); g = ctx.createLinearGradient(0, fy - 60 * k, 0, fy + 300 * k); g.addColorStop(0, '#FAF1DC'); g.addColorStop(1, '#D9C7A0'); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = '#3A2A24'; ctx.lineWidth = 3 * k;
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.moveTo(...wp(cc[0] + Math.cos(a) * R * .72, cc[1] + Math.sin(a) * R * .72 * .42)); ctx.lineTo(...wp(cc[0] + Math.cos(a) * R * .82, cc[1] + Math.sin(a) * R * .82 * .42)); ctx.stroke(); }
      const hand = (a, l, w) => { ctx.lineWidth = w; ctx.beginPath(); for (let i = 0; i <= 10; i++) { const q = wp(cc[0] + Math.cos(a) * l * i / 10, cc[1] + Math.sin(a) * l * i / 10 * .42); i ? ctx.lineTo(...q) : ctx.moveTo(...q); } ctx.stroke(); };
      hand(-.3 + t * .05, R * .75, 4 * k); hand(.2, R * .5, 6 * k);
      // 末端一滴往下拉长
      const [dx, dy] = wp(dX, cc[1] + R * .42), dl = 20 * k + melt * 60 * k;
      ctx.fillStyle = '#C79A3E'; ctx.beginPath(); ctx.moveTo(dx - 8 * k, dy); ctx.quadraticCurveTo(dx, dy + dl, dx + 8 * k, dy); ctx.fill(); ctx.beginPath(); ctx.arc(dx, dy + dl, 9 * k, 0, TAU); ctx.fill();
    };
    const sceneB = () => {
      sky('#2D3A6B', '#D9849A', '#7A4E62', '#2B1E2C');
      ctx.fillStyle = '#F4E6C8'; ctx.beginPath(); ctx.arc(W * .7, hz - 40 * u, 170 * k, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(45,58,107,.35)'; ctx.beginPath(); ctx.arc(W * .7 + 50 * k, hz - 70 * k, 150 * k, 0, TAU); ctx.fill();
      const bx = W * (LAND ? .3 : .42), by = hz + (LAND ? 240 : 420) * u;
      shadow(bx, by, 300 * k, 1200 * k, .35); ctx.fillStyle = '#5A3E52'; ctx.fillRect(bx - 150 * k, by - 220 * k, 300 * k, 220 * k);
      ctx.fillStyle = '#7C5A6E'; ctx.beginPath(); ctx.moveTo(bx - 150 * k, by - 220 * k); ctx.lineTo(bx + 150 * k, by - 220 * k); ctx.lineTo(bx + 120 * k, by - 260 * k); ctx.lineTo(bx - 180 * k, by - 260 * k); ctx.fill();
      const q = clamp(inv(3.2, 3.7, t)); ctx.globalAlpha = q; ctx.fillStyle = '#FBEBD3'; ctx.font = `700 ${(LAND ? 120 : 110) * u}px 'Noto Serif SC'`; ctx.textAlign = 'center';
      ctx.fillText('时间在融化', W / 2, H * (LAND ? .3 : .25) + (1 - q) * 20 * u); ctx.globalAlpha = 1;
    };
    sceneA();
    const p = inv(2.6, 3.4, t);
    if (p > 0) {
      ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0);
      const base = eInCubic(p) * (H + 300 * u) - 150 * u;
      for (let i = 0; i <= 60; i++) { const x = W - i * W / 60; let y = base; for (let j = 0; j < 7; j++) { const c = W * (j + .5) / 7, l = (80 + hash1(j * 5) * 200) * u * clamp(p * 2); y += l * Math.exp(-(((x - c) / (60 * u)) ** 2)); } ctx.lineTo(x, Math.max(0, y)); }
      ctx.closePath(); ctx.clip(); sceneB(); ctx.restore();
    }
  }
});
