// G-009 俯拍步骤教程：三张 AI 生成的手冲咖啡俯拍（以第一张为参考，桌面和器具前后一致），代码叠步骤编号、电子秤读数一路滚到目标克数、闷蒸 30 秒倒计时圆环、注水路径的虚线圆圈和箭头，底部步骤进度条；没有旁白，靠大字和计数讲清楚
// 素材：生图 ×3；配乐 CC0
const STEPS = [
  { img: 's1', n: '01', title: '放粉', sub: '中细研磨', from: 0, to: 15, unit: 'g', t0: .3, t1: 4.3 },
  { img: 's2', n: '02', title: '闷蒸', sub: '先注 30 g 水，等 30 秒', from: 0, to: 30, unit: 'g', t0: 4.3, t1: 8.6, timer: 30 },
  { img: 's2', n: '03', title: '分段注水', sub: '画圈注到 225 g', from: 30, to: 225, unit: 'g', t0: 8.6, t1: 11.6, ring: true },
  { img: 's3', n: '04', title: '完成', sub: '粉水比 1 : 15', t0: 11.6, t1: 14.5 },
];
scene({
  id: 'G-009', name: '俯拍步骤教程', dur: 14.5, still: 9.6,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 40px 'JetBrains Mono'", "400 40px 'Bebas Neue'"],
  text: '放粉中细研磨闷蒸先注水等秒分段注水画圈注到完成粉水比手冲咖啡四步画面生成配乐',
  async init() {
    return { A: await loadAssets(), s1: await loadImage('s1.jpg'), s2: await loadImage('s2.jpg'), s3: await loadImage('s3.jpg') };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, INK = '#2b1d14', CRE = '#f6efe4', ACC = '#c8702a';
    const i = Math.max(0, STEPS.findIndex(x => t < x.t1)), st = STEPS[i === -1 ? 3 : i], lt = t - st.t0;
    ctx.fillStyle = CRE; ctx.fillRect(0, 0, W, H);
    // 照片：横版占左边大块，竖版占上半
    const ph = LAND ? [0, 0, W * .64, H] : [0, 0, W, H * .56];
    ctx.save(); ctx.beginPath(); ctx.rect(...ph); ctx.clip();
    const fz = st.img === 's2' && i === 2 ? 1.5 : 1.12;
    drawCover(ctx, s[st.img], ...ph, { zoom: lerp(fz, fz + .06, clamp(lt / 4, 0, 1)), fx: i === 2 ? .48 : .5, fy: i === 2 ? .48 : .5 });
    // 换图：上一张向左滑出
    if (i > 0 && lt < .5) {
      const pv = STEPS[i - 1], k = eInOutCubic(lt / .5);
      ctx.save(); ctx.translate(-ph[2] * k, 0); drawCover(ctx, s[pv.img], ...ph, { zoom: pv.img === 's2' && i - 1 === 2 ? 1.56 : 1.18 }); ctx.restore();
    }
    // 注水路径：照片中心一圈虚线画圈
    if (st.ring) {
      const cx = ph[0] + ph[2] * .5, cy = ph[1] + ph[3] * .5, r = Math.min(ph[2], ph[3]) * .16, a0 = t * 4;
      ctx.setLineDash([14 * u, 12 * u]); ctx.lineDashOffset = -t * 60 * u; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 5 * u;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      const ax = cx + Math.cos(a0) * r, ay = cy + Math.sin(a0) * r;
      ctx.beginPath(); ctx.arc(ax, ay, 12 * u, 0, Math.PI * 2); ctx.fillStyle = ACC; ctx.fill();
    }
    ctx.restore();
    // 信息栏
    const P = LAND ? [W * .64, 0, W * .36, H] : [0, H * .56, W, H * .44], px = P[0] + 60 * u;
    let y = P[1] + (LAND ? 150 : 90) * u;
    const a = smooth(st.t0, st.t0 + .35, t), dy = (1 - eOutCubic(a)) * 30 * u;
    ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    if (!LAND) { ctx.translate(px, P[1]); ctx.scale(1.3, 1.3); ctx.translate(-px, -P[1]); }
    ctx.font = `700 ${22 * u}px 'JetBrains Mono'`; ctx.fillStyle = ACC; ctx.fillText('POUR-OVER · 4 STEPS', px, y - 70 * u);
    ctx.globalAlpha = a;
    ctx.font = `400 ${(LAND ? 150 : 140) * u}px 'Bebas Neue'`; ctx.fillStyle = ACC; ctx.fillText(st.n, px, y + 70 * u + dy);
    ctx.font = `900 ${(LAND ? 64 : 72) * u}px 'Noto Sans SC'`; ctx.fillStyle = INK; ctx.fillText(st.title, px + (LAND ? 150 : 150) * u, y + 50 * u + dy);
    ctx.font = `400 ${30 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#6b5a4c'; ctx.fillText(st.sub, px, y + 130 * u + dy);
    y += LAND ? 200 * u : 190 * u;
    // 秤：读数从 from 滚到 to
    if (st.to !== undefined) {
      const run = st.timer ? inv(st.t0 + .4, st.t0 + 1.4, t) : inv(st.t0 + .5, st.t1 - .4, t), v = lerp(st.from, st.to, eOutCubic(run));
      const bw = LAND ? P[2] - 120 * u : 420 * u, bh = 120 * u;
      rr(ctx, px, y, bw, bh, 16 * u); ctx.fillStyle = INK; ctx.fill();
      ctx.font = `700 ${70 * u}px 'JetBrains Mono'`; ctx.fillStyle = '#9fe870'; ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(1), px + bw - 70 * u, y + 85 * u); ctx.font = `700 ${30 * u}px 'JetBrains Mono'`; ctx.fillText(st.unit, px + bw - 26 * u, y + 85 * u);
      ctx.textAlign = 'left'; ctx.font = `700 ${18 * u}px 'JetBrains Mono'`; ctx.fillStyle = '#7d6b5c'; ctx.fillText('SCALE', px + 22 * u, y + 30 * u);
    }
    // 闷蒸倒计时：画面里 4 秒走完 30 秒
    if (st.timer) {
      const k = inv(st.t0 + 1.2, st.t1 - .3, t), r = 62 * u;
      const cx = LAND ? px + r : px + 420 * u + 120 * u, cy = LAND ? y + 130 * u + 90 * u : y + 60 * u;
      ctx.lineWidth = 12 * u; ctx.strokeStyle = 'rgba(43,29,20,.12)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = ACC; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.font = `700 ${40 * u}px 'JetBrains Mono'`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.ceil(30 * (1 - k))}s`, cx, cy); ctx.textBaseline = 'alphabetic';
    }
    // 完成：粉水比大字
    if (i === 3) {
      const k = eOutBack(inv(st.t0 + .3, st.t0 + .8, t));
      ctx.save(); ctx.translate(px, y + 60 * u); ctx.scale(k, k); ctx.font = `400 ${(LAND ? 130 : 140) * u}px 'Bebas Neue'`; ctx.fillStyle = INK; ctx.textAlign = 'left';
      ctx.fillText('15g : 225g', 0, 0); ctx.restore();
    }
    ctx.restore();
    // 底部进度条
    const by = LAND ? H - 70 * u : H - 90 * u, bx = LAND ? px : 60 * u, bw = LAND ? P[2] - 120 * u : W - 120 * u, sw = bw / 4;
    for (let k = 0; k < 4; k++) {
      const f = clamp(inv(STEPS[k].t0, STEPS[k].t1, t), 0, 1);
      ctx.fillStyle = 'rgba(43,29,20,.12)'; ctx.fillRect(bx + k * sw + 4 * u, by, sw - 8 * u, 8 * u);
      ctx.fillStyle = ACC; ctx.fillRect(bx + k * sw + 4 * u, by, (sw - 8 * u) * f, 8 * u);
    }
    ctx.save(); ctx.font = `400 ${15 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#9a8878'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(credits(s.A), bx, by + 40 * u); ctx.restore();
  },
});
