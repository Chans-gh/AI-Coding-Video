// C-043 说明书 / 步骤图：Canvas 2D 用等轴测投影把板件写成长方体，按远近排序后白底细黑线描出；三步分别是零件清单、插腿、拧螺丝，零件沿箭头方向滑进位置，每步之间停半拍，第三步弹出黄色警告框。
// 风格提示词：用家具说明书风格：白底、细线条线稿和简单立体板件，每步左上角标“Step N / 总步数”，零件带编号标签和数量，箭头指示安装方向，易错处用黄色警告框，每步结束停顿一下再进入下一步。
// 题材：信息讲解与产品发布 · 适合：教程、菜谱、组装
scene({
  id: 'C-043', name: '说明书 / 步骤图', dur: 5, still: 4.1,
  fonts: ["700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 40px 'JetBrains Mono'"],
  text: '零件清单装上四条腿拧紧螺丝别拧太紧会裂StepABC×1×4×8完成',
  init() { return {}; },
  draw(ctx, t, s) {
    const u = SHORT / 1080, INK = '#161616', YEL = '#FFD21F';
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    const ST = [0, 1.6, 3.2], step = t < ST[1] ? 0 : t < ST[2] ? 1 : 2, lt = t - ST[step];
    const sc = (LAND ? 74 : 92) * u, ox = LAND ? W * .5 : W / 2, oy = LAND ? H * .66 : H * .58;
    const c30 = Math.cos(Math.PI / 6), s30 = .5;
    const P = (x, y, z) => [ox + (x - y) * c30 * sc, oy + (x + y) * s30 * sc - z * sc];
    // 长方体：只画看得见的三个面（顶、+x 面、+y 面），白填黑线
    const box = (x, y, z, dx, dy, dz, fill = '#fff', lw = 2.4) => {
      const f = [
        [[x, y, z + dz], [x + dx, y, z + dz], [x + dx, y + dy, z + dz], [x, y + dy, z + dz]],
        [[x + dx, y, z], [x + dx, y + dy, z], [x + dx, y + dy, z + dz], [x + dx, y, z + dz]],
        [[x, y + dy, z], [x + dx, y + dy, z], [x + dx, y + dy, z + dz], [x, y + dy, z + dz]]];
      const shade = ['#fff', '#F2F2F2', '#E6E6E6'];
      f.forEach((q, i) => {
        ctx.beginPath(); q.forEach((p, k) => { const [a, b] = P(...p); k ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); ctx.closePath();
        ctx.fillStyle = fill === '#fff' ? shade[i] : fill; ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = lw * u; ctx.lineJoin = 'round'; ctx.stroke();
      });
    };
    const arrow = (a, b, p = 1, col = INK) => {
      const x = lerp(a[0], b[0], p), y = lerp(a[1], b[1], p), an = Math.atan2(b[1] - a[1], b[0] - a[0]), h = 22 * u;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3 * u;
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * h * .3, y + Math.sin(an) * h * .3);
      ctx.lineTo(x - Math.cos(an - .4) * h, y - Math.sin(an - .4) * h); ctx.lineTo(x - Math.cos(an + .4) * h, y - Math.sin(an + .4) * h); ctx.fill();
    };
    const tag = (x, y, txt, n) => {
      ctx.font = `700 ${Math.round(30 * u)}px 'JetBrains Mono'`; ctx.textAlign = 'center';
      ctx.strokeStyle = INK; ctx.lineWidth = 2 * u; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, 26 * u, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.fillText(txt, x, y + 11 * u);
      if (n) { ctx.font = `400 ${Math.round(28 * u)}px 'JetBrains Mono'`; ctx.textAlign = 'left'; ctx.fillText(n, x + 36 * u, y + 10 * u); }
    };
    const legs = [[0, 0], [3.4, 0], [0, 3.4], [3.4, 3.4]];
    const SEAT = [-.3, -.3, 3, 4.6, 4.6, .45];
    if (step === 0) {
      // 零件清单：板 A、腿 B、螺丝 C 依次弹出；竖屏缩小一点放得下
      const k0 = LAND ? 1 : .74; ctx.save(); ctx.translate(ox, oy); ctx.scale(k0, k0); ctx.translate(-ox - (LAND ? 0 : 140 * u), -oy);
      const pop = i => eOutBack(clamp((lt - .1 - i * .25) / .3));
      const s0 = pop(0), s1 = pop(1), s2 = pop(2);
      if (s0 > 0) { ctx.save(); const [cx, cy] = P(1.8, -2.8, 2); ctx.translate(cx, cy); ctx.scale(s0, s0); ctx.translate(-cx, -cy); box(-1, -5, 1.6, 4.6, 4.6, .45); tag(...P(3.9, -4.6, 3.1), 'A', '×1'); ctx.restore(); }
      if (s1 > 0) { ctx.save(); const [cx, cy] = P(4, 2, 1); ctx.translate(cx, cy); ctx.scale(s1, s1); ctx.translate(-cx, -cy); for (let i = 0; i < 4; i++) box(4.4 + i * .8, 1.2 - i * .8, 0, .55, .55, 2.6); tag(...P(7.4, -1.6, 3.2), 'B', '×4'); ctx.restore(); }
      if (s2 > 0) {
        ctx.save(); const [cx, cy] = P(-2.2, 3, 0); ctx.translate(cx, cy); ctx.scale(s2, s2); ctx.translate(-cx, -cy);
        for (let i = 0; i < 8; i++) { const [a, b] = P(-3 + (i % 4) * .55, 2.4 + Math.floor(i / 4) * .8, 0); ctx.strokeStyle = INK; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a, b - 46 * u); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(a, b - 46 * u, 11 * u, 5 * u, 0, 0, TAU); ctx.fill(); ctx.stroke(); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(a - 5 * u, b - 8 * u - k * 9 * u); ctx.lineTo(a + 5 * u, b - 12 * u - k * 9 * u); ctx.stroke(); } }
        tag(...P(-3.5, 4.4, -.6), 'C', '×8'); ctx.restore();
      }
      ctx.restore();
    } else {
      // 第 2 步：腿从下面沿箭头插进座板；第 3 步：腿已装好，螺丝拧进去
      const ins = step === 1 ? eInOutCubic(clamp((lt - .25) / .7)) : 1;
      legs.forEach(([x, y], i) => box(x, y, -1.6 * (1 - ins) - (i % 2) * .3 * (1 - ins), .55, .55, 3));
      box(...SEAT);
      if (step === 1) {
        const ap = clamp(lt / .25);
        legs.forEach(([x, y], i) => arrow(P(x + .27, y + .27, -2.6), P(x + .27, y + .27, -1.0), ap));
        tag(...P(-1.2, 2.2, 1.6), 'B', '×4');
      } else {
        // 螺丝：从上往下拧进四角，旋转箭头
        const sp = clamp((lt - .1) / .6);
        legs.forEach(([x, y], i) => {
          const [a, b] = P(x + .27, y + .27, 3.45), d = (1 - eOutCubic(clamp(sp * 1.3 - i * .1))) * 70 * u;
          ctx.strokeStyle = INK; ctx.lineWidth = 2.4 * u; ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.moveTo(a, b - d); ctx.lineTo(a, b - d - 30 * u * (d > 1 ? 1 : 0)); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(a, b - d, 14 * u, 6 * u, 0, 0, TAU); ctx.fill(); ctx.stroke();
          const r = lt * 9 + i; ctx.beginPath(); ctx.moveTo(a + Math.cos(r) * 10 * u, b - d + Math.sin(r) * 4 * u); ctx.lineTo(a - Math.cos(r) * 10 * u, b - d - Math.sin(r) * 4 * u); ctx.stroke();
        });
        const [ra, rb] = P(3.7, 3.7, 4.2);
        ctx.strokeStyle = INK; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.ellipse(ra, rb, 46 * u, 18 * u, 0, .3, .3 + 4.8 * clamp(lt / .5)); ctx.stroke();
        tag(...P(-1.6, 4.4, 4), 'C', '×8');
        // 警告框
        const wp = eOutBack(clamp((lt - .55) / .3));
        if (wp > 0) {
          const ww = 420 * u, wh = 150 * u, wx = LAND ? W - ww - 90 * u : (W - ww) / 2, wy = LAND ? H * .22 : H * .78;
          ctx.save(); ctx.translate(wx + ww / 2, wy + wh / 2); ctx.scale(wp, wp);
          ctx.fillStyle = YEL; ctx.strokeStyle = INK; ctx.lineWidth = 3 * u; rr(ctx, -ww / 2, -wh / 2, ww, wh, 10 * u); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-ww / 2 + 70 * u, -42 * u); ctx.lineTo(-ww / 2 + 115 * u, 38 * u); ctx.lineTo(-ww / 2 + 25 * u, 38 * u); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
          ctx.fillStyle = YEL; ctx.font = `700 ${Math.round(46 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText('!', -ww / 2 + 70 * u, 30 * u);
          ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(40 * u)}px 'Noto Sans SC'`; ctx.fillText('别拧太紧', -ww / 2 + 140 * u, -6 * u);
          ctx.font = `400 ${Math.round(28 * u)}px 'Noto Sans SC'`; ctx.fillText('木板会裂', -ww / 2 + 140 * u, 36 * u);
          ctx.restore();
        }
      }
    }
    // 步骤标题：Step N / 3 和一句说明；换步时整页向左推
    const titles = ['零件清单', '装上四条腿', '拧紧螺丝'];
    ctx.textAlign = 'left'; ctx.fillStyle = INK;
    const hx = 80 * u, hy = (LAND ? 120 : 170) * u, hp = eOutCubic(clamp(lt / .25));
    ctx.globalAlpha = hp;
    ctx.font = `700 ${Math.round(58 * u)}px 'JetBrains Mono'`; ctx.fillText(`Step ${step + 1}`, hx, hy);
    const sw = ctx.measureText(`Step ${step + 1}`).width;
    ctx.font = `400 ${Math.round(34 * u)}px 'JetBrains Mono'`; ctx.fillStyle = '#888'; ctx.fillText(' / 3', hx + sw, hy);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(44 * u)}px 'Noto Sans SC'`; ctx.fillText(titles[step], hx, hy + 66 * u);
    ctx.globalAlpha = 1;
    ctx.fillRect(hx, hy + 92 * u, W - 2 * hx, 2 * u);
    // 进度方格
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = INK; ctx.lineWidth = 2 * u; const bx = W - 80 * u - (3 - i) * 44 * u; ctx.strokeRect(bx, hy - 34 * u, 32 * u, 32 * u); if (i <= step) { ctx.fillStyle = INK; ctx.fillRect(bx + 6 * u, hy - 28 * u, 20 * u, 20 * u); } }
    // 每步最后停顿：右下角小勾
    const done = step < 2 ? smooth(1.2, 1.35, lt) : smooth(1.5, 1.65, lt);
    if (done > 0) {
      const cx = W - 140 * u, cy = H - (LAND ? 120 : 220) * u;
      ctx.strokeStyle = INK; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(cx, cy, 44 * u, 0, TAU); ctx.stroke();
      ctx.lineWidth = 7 * u; ctx.lineCap = 'round'; ctx.beginPath();
      drawPartial(ctx, [[cx - 20 * u, cy], [cx - 4 * u, cy + 16 * u], [cx + 22 * u, cy - 16 * u]], done); ctx.stroke(); ctx.lineCap = 'butt';
    }
  }
});
