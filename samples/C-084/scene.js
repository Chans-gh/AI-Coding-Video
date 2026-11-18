// C-084 1950 年代科学教科书：Canvas 2D 画泛黄书页，插图的明暗全部用网点表示（按格点取明暗函数，圆点面积对应浓度，再裁进形状里），只加蓝、橙两种专色和黑色网点；页眉有科目、章节和页码，图注写“图 1”，旁边黑底白字的“知识补充”框；第 2.4 秒以书脊为轴把这页压窄翻过去（翻页的背面加一道阴影），露出下一页的三棱镜。
// 风格提示词：用 1950 年代科学教科书插图风格：泛黄米色纸页，页眉有科目、章节名和页码，插图用单色网点加有限的蓝、橙专色，图注写“Fig. 1”，粗衣线大标题，旁边有黑底白字的“知识补充”小方框，像翻书一样一页一页讲解。
// 题材：信息讲解与产品发布 · 适合：科普、复古教学栏目
scene({
  id: 'C-084', name: '1950 年代科学教科书', dur: 5, still: 1.9,
  text: '物理第三章光的折射三棱镜图水中吸管看起来被折断了知识补充从空气进入速度变慢方向随之偏折白分成不同颜色各种色光程度一样',
  fonts: ["900 40px 'Noto Serif SC'", "700 40px 'Noto Serif SC'", "400 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  init() { return { paper: makePaper('#EADCB8', { seed: 84, grain: 16, fiber: .5, blot: 10 }) }; },
  draw(ctx, t, s) {
    const u = SHORT / 1080, INK = '#231E18', BLUE = '#3C7FB8', ORG = '#E2793A';
    // 网点：在 clip 区域里，按 dens(x,y) 0–1 画圆点
    const halftone = (clip, dens, col, step = 11) => { ctx.save(); ctx.beginPath(); clip(); ctx.clip(); ctx.fillStyle = col; const sp = step * u;
      for (let y = 0; y < H; y += sp) for (let x = ((y / sp) % 2) * sp / 2; x < W; x += sp) { const d = dens(x, y); if (d > .03) { ctx.beginPath(); ctx.arc(x, y, Math.sqrt(d) * sp * .56, 0, TAU); ctx.fill(); } } ctx.restore(); };
    const M = 60 * u, PX = M, PY = M, PW = W - 2 * M, PH = H - 2 * M;
    const page = (n, reveal) => {
      ctx.drawImage(s.paper, PX, PY, PW, PH);
      ctx.fillStyle = INK; ctx.font = `700 ${28 * u}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.fillText('物理 · 第三章  光的折射', PX + 50 * u, PY + 64 * u);
      ctx.textAlign = 'right'; ctx.font = `${44 * u}px 'Bebas Neue'`; ctx.fillText(n ? '48' : '47', PX + PW - 50 * u, PY + 68 * u);
      ctx.fillRect(PX + 50 * u, PY + 84 * u, PW - 100 * u, 4 * u); ctx.fillRect(PX + 50 * u, PY + 94 * u, PW - 100 * u, 1.5 * u);
      const tl = LAND ? [PX + PW * .55, PY + 200 * u] : [PX + 60 * u, PY + 210 * u];
      ctx.textAlign = 'left'; ctx.font = `900 ${(LAND ? 100 : 104) * u}px 'Noto Serif SC'`; ctx.fillText(n ? '三棱镜' : '光的折射', ...tl);
      const ic = LAND ? [PX + PW * .28, PY + PH * .54] : [PX + PW / 2, PY + PH * .44], k = (LAND ? .78 : 1.1) * u;
      const r = clamp(reveal);
      if (!n) {   // 图 1：水杯和吸管
        const gx = ic[0], gy = ic[1], gw = 170 * k, gh = 300 * k, wl = gy - 40 * k;
        const glass = () => { ctx.moveTo(gx - gw, gy - gh); ctx.lineTo(gx - gw * .8, gy + gh); ctx.lineTo(gx + gw * .8, gy + gh); ctx.lineTo(gx + gw, gy - gh); };
        const hw = y => gw - gw * .2 * (y - gy + gh) / (gh * 2);
        halftone(() => { ctx.moveTo(gx - hw(wl), wl); ctx.lineTo(gx - gw * .8, gy + gh); ctx.lineTo(gx + gw * .8, gy + gh); ctx.lineTo(gx + hw(wl), wl); }, (x, y) => r * clamp(.25 + .5 * (x - gx + gw) / (gw * 2)), BLUE, 10);   // 水：蓝专色网点，右侧更深
        halftone(glass, (x, y) => r * (Math.abs(x - gx) > hw(y) * .82 ? .55 : 0), INK, 9);
        ctx.strokeStyle = INK; ctx.lineWidth = 4 * u; ctx.beginPath(); glass(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(gx, gy - gh, gw, 20 * k, 0, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(gx, wl, gw * .93, 16 * k, 0, 0, TAU); ctx.stroke();
        // 吸管：水面以上一段、水下错开一段（看起来折断）
        const bend = eOutCubic(inv(.6, 1.3, t)) * 46 * k;
        ctx.lineCap = 'butt'; ctx.strokeStyle = ORG; ctx.lineWidth = 26 * k;
        ctx.beginPath(); ctx.moveTo(gx + 140 * k, gy - gh - 160 * k); ctx.lineTo(gx + 20 * k, wl); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx + 20 * k + bend, wl); ctx.lineTo(gx - 80 * k + bend * 1.6, gy + gh - 40 * k); ctx.stroke();
        ctx.strokeStyle = INK; ctx.lineWidth = 2 * u; ctx.setLineDash([8 * u, 6 * u]); ctx.lineDashOffset = -t * 60 * u; ctx.beginPath(); ctx.moveTo(gx + 20 * k, wl); ctx.lineTo(gx - 120 * k, gy + gh - 20 * k); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = INK; ctx.font = `700 ${30 * u}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.fillText('图 1  水中的吸管看起来被“折断”了', gx, gy + gh + 70 * k);
      } else {    // 图 2：三棱镜
        const cx = ic[0], cy = ic[1], R0 = 210 * k, tri = [[cx, cy - R0], [cx + R0 * .87, cy + R0 * .5], [cx - R0 * .87, cy + R0 * .5]];
        const path = () => { ctx.moveTo(...tri[0]); ctx.lineTo(...tri[1]); ctx.lineTo(...tri[2]); ctx.closePath(); };
        halftone(path, (x, y) => clamp(.1 + .45 * (x - cx + R0) / (R0 * 2)), INK, 9);
        ctx.strokeStyle = INK; ctx.lineWidth = 4 * u; ctx.beginPath(); path(); ctx.stroke();
        const bp = eOutCubic(inv(3.1, 3.8, t)), e0 = [cx - R0 * 1.9, cy + R0 * .1], e1 = [cx - R0 * .45, cy - R0 * .08];
        ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 10 * k; ctx.beginPath(); ctx.moveTo(...e0); ctx.lineTo(lerp(e0[0], e1[0], clamp(bp * 2)), lerp(e0[1], e1[1], clamp(bp * 2))); ctx.stroke();
        if (bp > .5) {
          const q = (bp - .5) * 2, ex = [cx + R0 * .42, cy + R0 * .05];
          ctx.lineWidth = 8 * k; ctx.strokeStyle = 'rgba(35,30,24,.5)'; ctx.beginPath(); ctx.moveTo(...e1); ctx.lineTo(lerp(e1[0], ex[0], q), lerp(e1[1], ex[1], q)); ctx.stroke();
          [[ORG, .25], [BLUE, .6]].forEach(([c, a]) => { ctx.strokeStyle = c; ctx.lineWidth = (14 + 3 * Math.sin(t * 9 + a * 5)) * k; ctx.beginPath(); ctx.moveTo(...ex); ctx.lineTo(ex[0] + Math.cos(a) * R0 * 1.6 * q, ex[1] + Math.sin(a) * R0 * 1.6 * q); ctx.stroke(); });
        }
        ctx.fillStyle = INK; ctx.font = `700 ${30 * u}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.fillText('图 2  白光经三棱镜分成不同颜色', cx, cy + R0 + 110 * k);
      }
      // 知识补充：黑底白字
      const bx = LAND ? PX + PW * .55 : PX + 60 * u, by = LAND ? PY + PH * .4 : PY + PH * .76, bw = LAND ? PW * .38 : PW - 120 * u, bp2 = n ? inv(3.8, 4.1, t) : inv(1.3, 1.6, t);
      if (bp2 > 0) {
        ctx.font = `400 ${32 * u}px 'Noto Sans SC'`;
        const lines = wrapCJK(ctx, n ? '各种色光偏折的程度不一样，于是白光被分成不同颜色。' : '光从空气进入水中，速度变慢，方向随之偏折。', bw - 80 * u), bh = (120 + lines.length * 50) * u;
        ctx.globalAlpha = bp2; ctx.fillStyle = INK; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = ORG; ctx.fillRect(bx, by, 14 * u, bh);
        ctx.fillStyle = '#F4ECD8'; ctx.textAlign = 'left'; ctx.font = `700 ${36 * u}px 'Noto Sans SC'`; ctx.fillText('知识补充', bx + 44 * u, by + 66 * u);
        ctx.font = `400 ${32 * u}px 'Noto Sans SC'`;
        lines.forEach((ln, i) => ctx.fillText(ln, bx + 44 * u, by + 128 * u + i * 50 * u));
        ctx.globalAlpha = 1;
      }
    };
    ctx.fillStyle = '#5B4A36'; ctx.fillRect(0, 0, W, H);
    const z = 1 + .07 * t / 5; ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);   // 镜头缓推
    // 翻页：先画下一页，再把这页以书脊（左边）为轴压窄
    const fl = eInOutCubic(inv(2.4, 3.0, t));
    if (fl <= 0) page(0, inv(.1, .7, t));
    else {
      page(1, 1);
      if (fl < 1) {
        const sx = Math.cos(fl * Math.PI);
        ctx.save(); ctx.translate(PX, 0); ctx.scale(sx, 1); ctx.translate(-PX, 0);
        if (sx > 0) page(0, 1); else { ctx.drawImage(s.paper, PX, PY, PW, PH); }
        ctx.fillStyle = `rgba(40,30,20,${.35 * Math.sin(fl * Math.PI)})`; ctx.fillRect(PX, PY, PW, PH); ctx.restore();
        ctx.fillStyle = `rgba(20,15,10,${.25 * Math.sin(fl * Math.PI)})`; ctx.fillRect(PX + PW * Math.abs(sx), PY, 60 * u, PH);
      }
    }
    ctx.restore();
  }
});
