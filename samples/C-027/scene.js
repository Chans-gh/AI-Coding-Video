// C-027 拼贴：牛皮纸底上，色块、网点照片、号外剪报、一格一字的大字、贴纸按节拍一张张“拍”上来，
// 边缘用随机锯齿做撕纸，落下瞬间整版震一下，最后补一道荧光笔和手绘箭头。由 opus40 的同名场景改写，横屏重新构图。
function tornRect(ctx, w, h, seed, jag = 10) {
  const R = mulberry32(seed); ctx.beginPath();
  for (let x = -w / 2; x <= w / 2; x += 14) ctx.lineTo(x, -h / 2 + (R() - .5) * jag);
  for (let y = -h / 2; y <= h / 2; y += 14) ctx.lineTo(w / 2 + (R() - .5) * jag, y);
  for (let x = w / 2; x >= -w / 2; x -= 14) ctx.lineTo(x, h / 2 + (R() - .5) * jag);
  for (let y = h / 2; y >= -h / 2; y -= 14) ctx.lineTo(-w / 2 + (R() - .5) * jag, y);
  ctx.closePath();
}
scene({
  id: 'C-027', name: '拼贴', dur: 3, still: 2.4,
  fonts: ["900 40px 'Noto Serif SC'", "900 40px 'Noto Sans SC'"],
  text: '号外拼贴的力量今日头条',
  init() {
    const ph = mk(420, 320), g = ph.getContext('2d');
    for (let y = 0; y < 320; y += 8) for (let x = 0; x < 420; x += 8) { const v = clamp(1 - (y / 320) * .8 + (fbm(x * .01, y * .01, 3) - .5) * 1.2 - (y > 180 + Math.sin(x * .02) * 40 ? .5 : 0)); g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(x + 4, y + 4, (1 - v) * 4.6, 0, TAU); g.fill(); }
    return { ph, kraft: makePaper('#C9B28A', { seed: 291, blot: 14, grain: 20, fiber: 1.3 }) };
  },
  draw(ctx, t, s) {
    ctx.drawImage(s.kraft, 0, 0, W, H);
    const k = Math.floor(t / BEAT), lt = t % BEAT, shake = lt < .08 ? (1 - lt / .08) * 10 : 0;
    ctx.save(); ctx.translate((hash1(k) - .5) * shake, (hash1(k + 5) - .5) * shake);
    // 构图：竖屏沿用原版（上下叠）；横屏照片在左、号外在右、黄底居中，大字一行放在下面，标题条在最上
    const P = LAND ? { yel: [960, 520], ph: [600, 400], nw: [1330, 560], row: [960, 930], star: [1530, 250], hl: [1330, 425], sc: [100, -260], ban: [960, 115] }
                   : { yel: [540, 950], ph: [330, 730], nw: [760, 1050], row: [540, 1470], star: [860, 640], hl: [760, 915], sc: [0, 170], ban: [540, 470] };
    const slam = (i, x, y, rot, fn) => { if (k < i) return; const a = i === k ? eOutCubic(lt / .12) : 1; ctx.save(); ctx.translate(x, y); ctx.rotate(rot + (1 - a) * .2); const sc = lerp(1.5, 1, a); ctx.scale(sc, sc); ctx.globalAlpha = clamp(a * 2); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; fn(); ctx.restore(); };
    const tape = (x, y, r) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(240,230,190,.75)'; tornRect(ctx, 140, 40, 7, 6); ctx.fill(); ctx.restore(); };
    slam(0, ...P.yel, -.07, () => { ctx.fillStyle = '#F7D23E'; tornRect(ctx, 860, 740, 1, 18); ctx.fill(); });
    slam(1, ...P.ph, .06, () => { ctx.fillStyle = '#F2EFE6'; ctx.fillRect(-230, -180, 460, 360); ctx.shadowColor = 'transparent'; ctx.drawImage(s.ph, -210, -160); tape(-200, -175, -.6); tape(200, 170, -.6); });
    slam(2, ...P.nw, -.05, () => {
      ctx.fillStyle = '#EDEAE0'; tornRect(ctx, 400, 460, 3, 8); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#111'; ctx.font = "900 70px 'Noto Serif SC'"; ctx.textAlign = 'center'; ctx.fillText('号外', 0, -140); ctx.fillRect(-170, -120, 340, 6);
      for (let r = 0; r < 12; r++) { ctx.fillStyle = '#777'; ctx.fillRect(-170, -90 + r * 26, r % 4 === 3 ? 180 : 340, 10); }
    });
    slam(3, ...P.row, .02, () => {
      const ch = ['拼', '贴', '的', '力', '量'], cols = ['#111', '#E8412C', '#fff', '#2B59C3', '#111'], bg = ['#fff', '#111', '#E8412C', '#F7D23E', '#FF5FA2'];
      ch.forEach((c, i) => { ctx.save(); ctx.translate(-340 + i * 170, Math.sin(i * 2) * 20); ctx.rotate((hash1(i * 3) - .5) * .4); ctx.fillStyle = bg[i]; ctx.fillRect(-72, -80, 144, 160); ctx.fillStyle = cols[i]; ctx.font = `900 120px '${i % 2 ? 'Noto Serif SC' : 'Noto Sans SC'}'`; ctx.textAlign = 'center'; ctx.shadowColor = 'transparent'; ctx.fillText(c, 0, 44); ctx.restore(); });
    });
    slam(4, ...P.star, 0, () => { ctx.fillStyle = '#E8412C'; ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 26 : 62; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); });
    if (k >= 5) { const p = k === 5 ? eOutCubic(lt / .2) : 1; ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,60,160,.75)'; ctx.translate(...P.hl); ctx.rotate(-.05); ctx.fillRect(-190, -36, 380 * p, 60); ctx.restore(); }
    if (k >= 6) { const p = k === 6 ? eOutCubic(lt / .25) : 1; ctx.strokeStyle = '#111'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; drawPartial(ctx, [[180, 900], [230, 960], [320, 990], [420, 980], [400, 950], [440, 985], [400, 1020]].map(([x, y]) => [x + P.sc[0], y + P.sc[1]]), p); }
    slam(7, ...P.ban, .03, () => { ctx.fillStyle = '#2B59C3'; tornRect(ctx, 700, 90, 9, 14); ctx.fill(); ctx.fillStyle = '#fff'; ctx.shadowColor = 'transparent'; ctx.font = "900 52px 'Noto Sans SC'"; ctx.textAlign = 'center'; ctx.fillText('今 日 头 条', 0, 18); });
    ctx.restore();
  }
});
