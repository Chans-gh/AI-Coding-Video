// C-170 字的隧道：一圈圈文字环沿 z 轴等距排开，按透视除以深度投到屏幕上，镜头匀加速向前飞；隧道中心线随深度正弦弯曲、整体缓慢滚转，远处的环缩成发光细线，近处的字掠过画面边缘时正好读出
// 风格提示词：用字的隧道风格：镜头沿一条无尽的圆形隧道向前飞，隧道内壁由一圈圈环形排列的文字组成，近处的字大而清晰、远处缩成发光的细线，文字随旁白逐句更换，经过镜头时正好读出，隧道偶尔拐弯或整体旋转，黑底单色字加一个强调色，配逐渐加速的风声。
// 题材：平面设计与动态排版 · 适合：宣言与口号、歌词 MV、数据与信息洪流
const PHRASES = ['每一帧都是代码', '画面只由时间决定', '没有素材 只有公式', '一句话变成一段片子', '再快一点'];
const SP = 1.1, ZMAX = 30;                       // 环间距、最远能看到的深度
const camZ = t => 5 * t + 2.4 * t * t;            // 匀加速向前
const bend = z => [.9 * Math.sin(z * .11), .55 * Math.sin(z * .083 + 1)];
scene({
  id: 'C-170', name: '字的隧道', dur: 3.5, still: 2.3,
  fonts: ["900 40px 'Noto Sans SC'"],
  text: PHRASES.join(''),
  draw(ctx, t, s, f) {
    const fl = SHORT * .62, cz = camZ(t), [bx0, by0] = bend(cz + 1.5);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const roll = .35 * t + .05 * Math.sin(t * 1.3);
    // 中心的光：隧道尽头
    const [bxe, bye] = bend(cz + ZMAX);
    const ex = W / 2 + fl * (bxe - bx0) / ZMAX * 6, ey = H / 2 + fl * (bye - by0) / ZMAX * 6;
    const gl = ctx.createRadialGradient(ex, ey, 0, ex, ey, SHORT * .35);
    gl.addColorStop(0, 'rgba(255,240,220,.35)'); gl.addColorStop(1, 'rgba(255,240,220,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const i0 = Math.floor(cz / SP);
    for (let i = i0 + Math.ceil(ZMAX / SP); i > i0; i--) {        // 从远到近画
      const zw = i * SP, dz = zw - cz;
      if (dz < .18 || dz > ZMAX) continue;
      const [bx, by] = bend(zw);
      const sx = W / 2 + fl * (bx - bx0) / dz * 1.6, sy = H / 2 + fl * (by - by0) / dz * 1.6;
      const r = fl / dz, fog = Math.pow(clamp(1 - dz / ZMAX), 1.3) * clamp((dz - .18) / .4);
      const ph = PHRASES[((i % PHRASES.length) + PHRASES.length) % PHRASES.length], accent = ph === '画面只由时间决定';
      const col = accent ? [255, 122, 47] : [235, 238, 245];
      const ring = (ph + '　').repeat(3), n = [...ring].length, cs = r * TAU / n;
      const rot = roll + zw * .045;
      if (cs < 9) {                                                   // 远处：一圈发光细线
        ctx.strokeStyle = rgba(col, fog * .55); ctx.lineWidth = Math.max(1, cs * .18);
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.stroke();
        continue;
      }
      ctx.font = `900 ${Math.round(cs * .82)}px 'Noto Sans SC'`;
      ctx.fillStyle = rgba(col, fog);
      [...ring].forEach((ch, j) => {
        if (ch === '　') return;
        const a = rot + j / n * TAU, x = sx + Math.cos(a) * r, y = sy + Math.sin(a) * r;
        if (x < -cs || x > W + cs || y < -cs || y > H + cs) return;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2); ctx.fillText(ch, 0, 0); ctx.restore();
      });
    }
    // 速度感：边缘轻微径向拖影
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .18 + .12 * smooth(1, 3.5, t);
    ctx.filter = 'blur(10px)'; ctx.translate(W / 2, H / 2); ctx.scale(1.04, 1.04); ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(ctx.canvas, 0, 0); ctx.restore();
    vignette(ctx, .85, .25);
  }
});
