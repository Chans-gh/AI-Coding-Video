// C-156 图形形变叙事：Canvas 2D 把咖啡杯、落日、手机、地图钉和过渡用的圆、胶囊都写成从顶部中点起、顺时针的闭合轮廓，用 resample 按弧长取同样多的点，相邻两形逐点插值；过渡用两头缓中间快的缓动，变形中途加一点挤压拉伸和旋转，填色和底色一起过渡，细节线（热气、光芒、屏幕）只在停留时淡入。
// 风格提示词：用图形形变叙事风格：浅色纯底上的扁平图形一个接一个连续变形来讲故事，咖啡杯变成落日、手机变成地图钉，复杂形状先收拢成圆或胶囊再展开成下一个，变形时带一点挤压拉伸和旋转，速度中段最快、首尾各留几帧缓冲，颜色随形状一起过渡，配柔和的嗖声。
// 题材：信息讲解与产品发布 · 适合：产品功能串讲、品牌故事、图形化讲解
scene({
  id: 'C-156', name: '图形形变叙事', dur: 5, still: 1.75,
  fonts: ["700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  text: '早上一杯咖啡傍晚看一场日落打开手机找到下一站',
  init() {
    const N = 240;
    const arc = (cx, cy, r, a0, a1, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
    const rrect = (w, h, r) => {
      const p = [[0, -h / 2], [w / 2 - r, -h / 2]];
      p.push(...arc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, 12), ...arc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, 12));
      p.push(...arc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, 12), ...arc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, 12));
      return p;
    };
    const close = p => resample([...p, p[0]], N).slice(0, N).map(q => [q.x, q.y]);
    const circle = close(arc(0, 0, .72, -Math.PI / 2, Math.PI * 1.5, 120));
    const cup = close([[0, -.62], [.62, -.62], [.6, -.38], ...arc(.66, -.02, .34, -1.35, 1.35, 30), [.56, .3], [.46, .7], [-.46, .7], [-.62, -.62]]);
    const sun = close([...arc(0, .3, .8, -Math.PI / 2, 0, 40), [1.15, .3], [1.15, .44], [-1.15, .44], [-1.15, .3], ...arc(0, .3, .8, Math.PI, Math.PI * 1.5, 40)]);
    const capsule = close(rrect(.72, 1.5, .36));
    const phone = close(rrect(.98, 1.7, .16));
    const pin = close([...arc(0, -.32, .6, -Math.PI / 2, .72, 50), [0, 1.0], ...arc(0, -.32, .6, Math.PI - .72, Math.PI * 1.5, 50)]);
    // 关键形：[形, 到达时刻, 停到时刻, 填色, 底色, 细节]
    const K = [
      [cup, 0, .6, '#8A5A3C', '#F5EFE6', 'cup'], [circle, 1.0, 1.0, '#E89A3C', '#F7EDE0', ''], [sun, 1.45, 1.95, '#F0643A', '#FBE9DC', 'sun'],
      [capsule, 2.35, 2.35, '#4767A8', '#ECEFF6', ''], [phone, 2.8, 3.3, '#2A3557', '#E8ECF4', 'phone'], [circle, 3.7, 3.7, '#D9504A', '#F6ECEA', ''],
      [pin, 4.15, 5, '#E23B3F', '#F4F1EA', 'pin']];
    return { K };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, K = s.K;
    let i = 0; while (i < K.length - 1 && t >= K[i + 1][1]) i++;
    const a = K[i], b = K[Math.min(i + 1, K.length - 1)];
    const p = b === a || t <= a[2] ? 0 : eInOutCubic(clamp((t - a[2]) / (b[1] - a[2])));
    const mix = (c1, c2, q) => { const A = hex2rgb(c1), B = hex2rgb(c2); return `rgb(${A.map((v, k) => Math.round(lerp(v, B[k], q))).join(',')})`; };
    ctx.fillStyle = mix(a[4], b[4], p); ctx.fillRect(0, 0, W, H);
    const S = (LAND ? 300 : 360) * u, cx = W / 2, cy = LAND ? H * .44 : H * .42;
    const bump = Math.sin(p * Math.PI), dir = i % 2 ? -1 : 1;
    // 地面阴影
    ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.beginPath(); ctx.ellipse(cx, cy + S * 1.25, S * (.9 + .2 * bump), S * .1, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(cx, cy - bump * S * .12); ctx.rotate(dir * bump * .35); ctx.scale(S * (1 + .14 * bump), S * (1 - .12 * bump));
    ctx.fillStyle = mix(a[3], b[3], p);
    ctx.beginPath(); a[0].forEach((q, k) => { const r = b[0][k], x = lerp(q[0], r[0], p), y = lerp(q[1], r[1], p); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill();
    ctx.restore();
    // 细节：只在停留时淡入
    const det = (name) => { const k = K.findIndex(q => q[5] === name), q = K[k]; return smooth(q[1] - .05, q[1] + .2, t) * (1 - smooth(q[2], q[2] + .15, t)); };
    const X = v => cx + v * S, Y = v => cy + v * S;
    ctx.lineCap = 'round';
    let d = det('cup');
    if (d > 0) {
      ctx.strokeStyle = rgba([138, 90, 60], d); ctx.lineWidth = 9 * u;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let j = 0; j <= 20; j++) { const yy = -.8 - j / 20 * .55, xx = (k - 1) * .26 + Math.sin(j * .5 + t * 6 + k) * .05; j ? ctx.lineTo(X(xx), Y(yy)) : ctx.moveTo(X(xx), Y(yy)); } ctx.stroke(); }
      ctx.fillStyle = rgba([255, 255, 255], .25 * d); ctx.fillRect(X(-.5), Y(-.5), .12 * S, .9 * S);
    }
    d = det('sun');
    if (d > 0) {
      ctx.strokeStyle = rgba([240, 100, 58], d); ctx.lineWidth = 10 * u;
      for (let k = 0; k < 7; k++) { const an = Math.PI + (k + .5) / 7 * Math.PI, r0 = 1.0 + .04 * Math.sin(t * 5 + k), r1 = r0 + .25; ctx.beginPath(); ctx.moveTo(X(Math.cos(an) * r0), Y(.3 + Math.sin(an) * r0)); ctx.lineTo(X(Math.cos(an) * r1), Y(.3 + Math.sin(an) * r1)); ctx.stroke(); }
      ctx.strokeStyle = rgba([255, 255, 255], .5 * d); ctx.lineWidth = 7 * u;
      for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(X(-.5 + k * .2), Y(.62 + k * .1)); ctx.lineTo(X(.5 - k * .2), Y(.62 + k * .1)); ctx.stroke(); }
    }
    d = det('phone');
    if (d > 0) {
      ctx.fillStyle = rgba([180, 205, 255], d); rr(ctx, X(-.4), Y(-.7), .8 * S, 1.3 * S, .06 * S); ctx.fill();
      ctx.fillStyle = rgba([42, 53, 87], d * .8);
      for (let k = 0; k < 4; k++) { const w = [.5, .35, .6, .3][k]; rr(ctx, X(-.3), Y(-.55 + k * .22), w * S * smooth(0, .4, t - 2.8 - k * .08), .1 * S, .05 * S); ctx.fill(); }
      ctx.fillStyle = rgba([255, 255, 255], d); ctx.beginPath(); ctx.arc(X(0), Y(.73), .05 * S, 0, TAU); ctx.fill();
    }
    d = det('pin');
    if (d > 0) {
      ctx.fillStyle = rgba([255, 255, 255], d); ctx.beginPath(); ctx.arc(X(0), Y(-.32), .24 * S, 0, TAU); ctx.fill();
      const q = ((t - 4.2) % .9) / .9;
      ctx.strokeStyle = rgba([226, 59, 63], (1 - q) * .6 * d); ctx.lineWidth = 5 * u;
      ctx.beginPath(); ctx.ellipse(X(0), Y(1.05), S * (.2 + q * .7), S * (.05 + q * .17), 0, 0, TAU); ctx.stroke();
    }
    // 字幕：一句一句换，上滑淡入
    const CAP = [[0, '早上，一杯咖啡'], [1.2, '傍晚，看一场日落'], [2.55, '打开手机'], [3.85, '找到下一站']];
    let ci = 0; while (ci < CAP.length - 1 && t >= CAP[ci + 1][0]) ci++;
    const cp = eOutCubic(clamp((t - CAP[ci][0]) / .35)), out = ci < CAP.length - 1 ? smooth(CAP[ci + 1][0] - .2, CAP[ci + 1][0], t) : 0;
    ctx.globalAlpha = cp * (1 - out); ctx.fillStyle = '#2A2A2A'; ctx.textAlign = 'center';
    ctx.font = `700 ${Math.round((LAND ? 64 : 76) * u)}px 'Noto Sans SC'`;
    const ty = LAND ? H * .88 : H * .8;
    ctx.fillText(CAP[ci][1], W / 2, ty + (1 - cp) * 30 * u - out * 20 * u);
    ctx.globalAlpha = 1;
    // 进度点
    for (let k = 0; k < 4; k++) { ctx.fillStyle = k === ci ? '#2A2A2A' : 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.arc(W / 2 + (k - 1.5) * 30 * u, ty + 60 * u, (k === ci ? 7 : 5) * u, 0, TAU); ctx.fill(); }
  }
});
