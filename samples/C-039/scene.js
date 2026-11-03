// C-039 等距信息图：自己写一个等距投影函数，把方块的三个面按不同明度画出来，搭出采集、处理、存储、分发四个工位；
// 数据包沿传送带循环移动，编号标注依次弹出，底下一排小人图标表示占比。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-039', name: '等距信息图', dur: 3, still: 2.4,
  fonts: ["700 40px 'JetBrains Mono'", "900 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  text: '①采集②处理③存储④分发',
  draw(ctx, t) {
    ctx.fillStyle = '#F3EFE6'; ctx.fillRect(0, 0, W, H);
    const cam = lerp(170, -40, eInOutCubic(t / 3)), S0 = 62;
    // 构图：竖屏沿用原版（流水线只露出中间一段）；横屏整条流水线都放得下，原点移到画面中间偏上，地砖铺得更开
    const [ox, oy] = LAND ? [W / 2 - 120, 230] : [540 - 120, 500], G = LAND ? [-6, 18, -6, 14] : [-1, 13, -1, 9];
    const iso = (x, y, z) => [ox + (x - y) * .866 * S0, oy + cam + (x + y) * .5 * S0 - z * S0];
    const shade = (hex, k) => { const c = hex2rgb(hex); return `rgb(${c.map(v => Math.round(v * k)).join(',')})`; };
    const poly = (pts, fill) => { ctx.beginPath(); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = '#26323D'; ctx.lineWidth = 2; ctx.stroke(); };
    const box = (x, y, z, w, d, h, col, open = false) => {
      poly([iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x, y + d, z + h)], shade(col, .8));
      poly([iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x + w, y, z + h)], shade(col, .62));
      if (!open) poly([iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)], shade(col, 1.08));
    };
    // ground tiles
    for (let i = G[0]; i < G[1]; i++) for (let j = G[2]; j < G[3]; j++) { const p = [iso(i, j, 0), iso(i + 1, j, 0), iso(i + 1, j + 1, 0), iso(i, j + 1, 0)]; ctx.beginPath(); p.forEach(q => ctx.lineTo(q[0], q[1])); ctx.closePath(); ctx.fillStyle = (i + j) % 2 ? '#EAE4D6' : '#E4DDCD'; ctx.fill(); }
    const teal = '#2A9D8F', coral = '#EF6F53', navy = '#264653', sand = '#E9C46A';
    // conveyors
    box(2, .6, 0, 3, .8, .25, '#B8B2A4'); box(7, .6, 0, 2.2, .8, .25, '#B8B2A4'); box(9.4, 2.4, 0, .8, 3, .25, '#B8B2A4');
    // stations
    box(0, 0, 0, 2, 2, 1.6, teal);
    box(4.6, -.3, 0, 2.6, 2.6, 1.3, coral, true);
    ctx.save(); const gc = iso(5.9, 1, .9); ctx.translate(gc[0], gc[1]); ctx.scale(1, .55); ctx.rotate(t * 2); ctx.beginPath(); for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, r = k % 2 ? 44 : 56; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = sand; ctx.fill(); ctx.stroke(); ctx.restore();
    box(9, -.2, 0, 2.2, 2.4, 2.4, navy);
    for (let k = 0; k < 3; k++) box(9.2 + k * .7, 2.6 - 2.8, 2.4, .5, .5, .25 + k * .3, sand);
    box(8.9, 5.4, 0, 2, 2, 1.1, teal);
    // packets
    const path = [[1, 1, .3], [4.8, 1, .3], [6.5, 1, 1.4], [8.2, 1, .3], [9.8, 1, .3], [9.8, 5.5, .3]];
    for (let k = 0; k < 7; k++) {
      let u = ((t * .5 + k / 7) % 1) * (path.length - 1); const i = Math.floor(u), f = u - i; const a = path[i], b = path[i + 1];
      const x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f), z = lerp(a[2], b[2], f);
      if (i === 1 && f > .1) continue;
      box(x - .18, y - .18, z, .36, .36, .36, sand);
    }
    // labels
    const label = (x, y, z, n, txt, sub, d) => {
      const a = eOutCubic(inv(d, d + .35, t)); if (a <= 0) return; const p = iso(x, y, z); const lx = p[0] + 40, ly = p[1] - 110;
      ctx.strokeStyle = '#26323D'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] - 110 * a); ctx.lineTo(p[0] + 40 * a, ly); ctx.stroke();
      ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(lx + 24, ly - 4, 22, 0, TAU); ctx.fillStyle = '#26323D'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = "700 26px 'JetBrains Mono'"; ctx.textAlign = 'center'; ctx.fillText(n, lx + 24, ly + 5); ctx.textAlign = 'left';
      ctx.fillStyle = '#26323D'; ctx.font = "900 38px 'Noto Sans SC'"; ctx.fillText(txt, lx + 58, ly + 8); ctx.font = "400 22px 'Noto Sans SC'"; ctx.fillStyle = '#5A6570'; ctx.fillText(sub, lx + 58, ly + 40); ctx.globalAlpha = 1;
    };
    label(1, 1, 1.6, '1', '采集', '12 路传感器', .1);
    label(5.9, 1, 1.3, '2', '处理', '实时清洗 · 去噪', .6);
    label(10.1, 1, 2.9, '3', '存储', '3 副本冗余', 1.1);
    label(9.9, 6.4, 1.1, '4', '分发', 'CDN 边缘节点', 1.6);
    // isotype row
    for (let k = 0; k < 8; k++) { const a = smooth(1.9 + k * .08, 2.1 + k * .08, t); const p = iso(4 + k * .45, 6.5, 0); ctx.globalAlpha = a; ctx.fillStyle = k < 6 ? coral : '#C9C2B2'; ctx.beginPath(); ctx.arc(p[0], p[1] - 44, 11, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.roundRect(p[0] - 12, p[1] - 30, 24, 34, 8); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
});
