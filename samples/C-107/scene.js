// C-107 地铁线路图生长：四条线路的折线只走横竖和 45°，转角用二次曲线统一倒圆角后按弧长采样；每帧在一张 Canvas 2D 纸面贴图上按时间画出各线路的前缀，发光笔尖停在当前端点，站点（白圆点）和换乘站（黑框白胶囊）在笔尖经过时弹出，河是一条平涂蓝带；贴图铺在 Three.js 的平面上，透视镜头贴着纸面低空掠过，画面上下按距离分层模糊假装浅景深。
// 风格提示词：用地铁线路图生长风格：线路只走横竖和 45° 八个方向、转角统一圆角，白色站点和黑框换乘胶囊，水面是一条平涂蓝带，发光的笔尖沿线路把网络一段段画出来，镜头是真实透视，贴着纸面掠过、浅景深，站点点亮配钢片琴拨音，换乘处落一记低音。
// 题材：信息讲解与产品发布 · 适合：交通规划、网络扩张、流程分支
const MAP = {
  lines: [
    { c: '#E8412F', n: '1', p: [[4, 30], [30, 30], [40, 20], [70, 20], [80, 30], [96, 30]], t0: .3, d: 1.6 },
    { c: '#2F6FE8', n: '2', p: [[20, 2], [20, 15], [30, 25], [30, 45], [40, 55], [62, 55]], t0: 1.1, d: 1.5 },
    { c: '#22A04B', n: '3', p: [[50, 2], [50, 40], [60, 50], [92, 50]], t0: 1.9, d: 1.4 },
    { c: '#F2A007', n: '4', p: [[8, 50], [25, 50], [40, 35], [75, 35], [85, 25], [85, 6]], t0: 2.6, d: 1.6 },
  ],
  ix: [[30, 30], [50, 20], [50, 35], [30, 45], [80, 30]],
  river: [[-5, 9], [58, 9], [68, -1], [80, -1]],
};
// 折线上一点的弧长比例（sound.py 用同样的算法）
function fracOn(p, q) {
  let tot = 0, at = -1; const L = [];
  for (let i = 1; i < p.length; i++) L.push(Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const sum = L.reduce((a, b) => a + b, 0);
  for (let i = 1; i < p.length; i++) {
    const [ax, ay] = p[i - 1], [bx, by] = p[i], l = L[i - 1];
    const u = ((q[0] - ax) * (bx - ax) + (q[1] - ay) * (by - ay)) / (l * l);
    const cx = ax + (bx - ax) * u, cy = ay + (by - ay) * u;
    if (u >= -1e-6 && u <= 1 + 1e-6 && Math.hypot(cx - q[0], cy - q[1]) < .01 && at < 0) at = (tot + u * l) / sum;
    tot += l;
  }
  return at;
}
function events() {
  const st = [], ix = [];
  MAP.lines.forEach((ln, li) => {
    for (let k = 0; k <= 6; k++) {
      const f = k / 6; if (MAP.ix.some(q => { const g = fracOn(ln.p, q); return g >= 0 && Math.abs(g - f) < .07; })) continue;
      st.push({ li, f, t: ln.t0 + f * ln.d });
    }
    MAP.ix.forEach((q, qi) => { const g = fracOn(ln.p, q); if (g >= 0) ix.push({ qi, li, t: ln.t0 + g * ln.d }); });
  });
  return { st, ix };
}
function rounded(p, r) {
  const out = [p[0]];
  for (let i = 1; i < p.length - 1; i++) {
    const [ax, ay] = p[i - 1], [bx, by] = p[i], [cx, cy] = p[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by), rr = Math.min(r, l1 / 2, l2 / 2);
    const s = [bx - (bx - ax) / l1 * rr, by - (by - ay) / l1 * rr], e = [bx + (cx - bx) / l2 * rr, by + (cy - by) / l2 * rr];
    for (let k = 0; k <= 10; k++) { const u = k / 10, v = 1 - u; out.push([v * v * s[0] + 2 * u * v * bx + u * u * e[0], v * v * s[1] + 2 * u * v * by + u * u * e[1]]); }
  }
  out.push(p[p.length - 1]);
  const cum = [0]; for (let i = 1; i < out.length; i++) cum.push(cum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { pts: out, cum, len: cum[cum.length - 1] };
}
function posAt(rp, f) {
  const d = f * rp.len; let i = 1; while (i < rp.cum.length - 1 && rp.cum[i] < d) i++;
  const u = (d - rp.cum[i - 1]) / Math.max(1e-6, rp.cum[i] - rp.cum[i - 1]);
  return [lerp(rp.pts[i - 1][0], rp.pts[i][0], u), lerp(rp.pts[i - 1][1], rp.pts[i][1], u), i];
}
scene({
  id: 'C-107', name: '地铁线路图生长', dur: 5, still: 4.6, libs: ['three'],
  fonts: ["700 40px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  init() {
    const D = three3d({ tone: null, fov: LAND ? 42 : 56 });
    const T = D.THREE;
    const MW = 2400, MH = 1440, S = MW / 100;
    const map = mk(MW, MH), mg = map.getContext('2d');
    const paper = mk(MW, MH), pg = paper.getContext('2d');
    pg.fillStyle = '#F6F3EC'; pg.fillRect(0, 0, MW, MH);
    pg.strokeStyle = 'rgba(40,40,60,.06)'; pg.lineWidth = 2;
    for (let x = 0; x <= 100; x += 5) { pg.beginPath(); pg.moveTo(x * S, 0); pg.lineTo(x * S, MH); pg.stroke(); }
    for (let y = 0; y <= 60; y += 5) { pg.beginPath(); pg.moveTo(0, y * S); pg.lineTo(MW, y * S); pg.stroke(); }
    pg.strokeStyle = '#A9D8F2'; pg.lineWidth = 7 * S; pg.lineJoin = 'round'; pg.lineCap = 'butt';
    pg.beginPath(); MAP.river.forEach(([x, y], i) => i ? pg.lineTo(x * S, y * S) : pg.moveTo(x * S, y * S)); pg.stroke();
    pg.fillStyle = '#6FA9CC'; pg.font = `italic 700 ${Math.round(1.6 * S)}px 'Noto Sans SC'`; pg.fillText('清 水 河', 6 * S, 9.6 * S);
    const tex = new T.CanvasTexture(map); tex.anisotropy = D.renderer.capabilities.getMaxAnisotropy(); tex.colorSpace = T.SRGBColorSpace;
    const plane = new T.Mesh(new T.PlaneGeometry(100, 60), new T.MeshBasicMaterial({ map: tex })); plane.rotation.x = -Math.PI / 2; D.scene.add(plane);
    D.scene.background = new T.Color('#F6F3EC'); D.scene.fog = new T.Fog('#F6F3EC', 60, 140);
    const rps = MAP.lines.map(l => rounded(l.p, 4));
    return { D, T, map, mg, paper, tex, S, rps, ev: events(), blur: mk(W, H), sharp: mk(W, H) };
  },
  draw(ctx, t, s) {
    const { mg, S, rps, ev } = s;
    mg.drawImage(s.paper, 0, 0);
    mg.lineCap = 'round'; mg.lineJoin = 'round';
    const tips = [];
    MAP.lines.forEach((ln, li) => {
      const f = clamp((t - ln.t0) / ln.d, 0, 1); if (f <= 0) return;
      const rp = rps[li], [ex, ey, iEnd] = posAt(rp, f);
      mg.strokeStyle = ln.c; mg.lineWidth = 1.5 * S;
      mg.beginPath(); for (let i = 0; i < iEnd; i++) { const [x, y] = rp.pts[i]; i ? mg.lineTo(x * S, y * S) : mg.moveTo(x * S, y * S); } mg.lineTo(ex * S, ey * S); mg.stroke();
      if (f < 1) tips.push([ex, ey, ln.c]);
      // 线路编号牌
      const [sx, sy] = ln.p[0], k = eOutCubic(clamp((t - ln.t0) / .25, 0, 1));
      mg.save(); mg.translate(sx * S, sy * S); mg.scale(k, k); mg.fillStyle = ln.c; mg.beginPath(); mg.arc(0, 0, 1.9 * S, 0, TAU); mg.fill();
      mg.fillStyle = '#fff'; mg.font = `${Math.round(2.6 * S)}px 'Bebas Neue'`; mg.textAlign = 'center'; mg.textBaseline = 'middle'; mg.fillText(ln.n, 0, .15 * S); mg.restore();
    });
    // 站点
    for (const e of ev.st) {
      if (t < e.t || e.f === 0) continue; const k = 1 + .6 * Math.exp(-(t - e.t) * 10) * Math.cos((t - e.t) * 30), ln = MAP.lines[e.li];
      const [x, y] = posAt(rps[e.li], e.f);
      mg.fillStyle = '#fff'; mg.strokeStyle = ln.c; mg.lineWidth = .5 * S; mg.beginPath(); mg.arc(x * S, y * S, .85 * S * k, 0, TAU); mg.fill(); mg.stroke();
    }
    MAP.ix.forEach((q, qi) => {
      const hits = ev.ix.filter(e => e.qi === qi && t >= e.t); if (!hits.length) return;
      const last = Math.max(...hits.map(h => h.t)), k = 1 + .5 * Math.exp(-(t - last) * 9) * Math.cos((t - last) * 28), w = (hits.length > 1 ? 4.2 : 2.6) * S * k, h = 2.2 * S * k;
      mg.fillStyle = '#fff'; mg.strokeStyle = '#111'; mg.lineWidth = .55 * S; rr(mg, q[0] * S - w / 2, q[1] * S - h / 2, w, h, h / 2); mg.fill(); mg.stroke();
    });
    // 发光笔尖
    for (const [x, y, c] of tips) {
      const g = mg.createRadialGradient(x * S, y * S, 0, x * S, y * S, 4 * S); g.addColorStop(0, rgba(hex2rgb(c), .55)); g.addColorStop(1, rgba(hex2rgb(c), 0));
      mg.fillStyle = g; mg.beginPath(); mg.arc(x * S, y * S, 4 * S, 0, TAU); mg.fill();
      mg.fillStyle = '#fff'; mg.beginPath(); mg.arc(x * S, y * S, .6 * S, 0, TAU); mg.fill();
    }
    s.tex.needsUpdate = true;
    // 镜头贴着纸面掠过
    const cam = s.D.camera, u = t / 5;
    const cx = lerp(-18, 12, eInOutCubic(u));
    if (LAND) { cam.position.set(cx, 30 - 4 * u, 52 - 5 * u); cam.lookAt(cx * .6 + 4, 0, 0); }
    else { cam.position.set(cx * .4, 92 - 8 * u, 44 - 4 * u); cam.lookAt(cx * .3 + 2, 0, -4); }
    s.D.render();
    const b = s.blur.getContext('2d'); b.filter = `blur(${Math.round(SHORT * .008)}px)`; b.drawImage(s.D.canvas, 0, 0, W, H); b.filter = 'none';
    const sh = s.sharp.getContext('2d'); sh.globalCompositeOperation = 'source-over'; sh.clearRect(0, 0, W, H); sh.drawImage(s.D.canvas, 0, 0, W, H);
    const gm = sh.createLinearGradient(0, 0, 0, H); gm.addColorStop(0, 'rgba(0,0,0,0)'); gm.addColorStop(.3, 'rgba(0,0,0,0)'); gm.addColorStop(.5, 'rgba(0,0,0,1)'); gm.addColorStop(.72, 'rgba(0,0,0,1)'); gm.addColorStop(1, 'rgba(0,0,0,.15)');
    sh.globalCompositeOperation = 'destination-in'; sh.fillStyle = gm; sh.fillRect(0, 0, W, H); sh.globalCompositeOperation = 'source-over';
    ctx.drawImage(s.blur, 0, 0); ctx.drawImage(s.sharp, 0, 0);
    vignette(ctx, .18);
    // 标题
    const uu = SHORT / 1080, ta = smooth(.2, .7, t), tx = LAND ? 70 * uu : 80 * uu, ty = LAND ? 90 * uu : H * .12;
    ctx.globalAlpha = ta; ctx.fillStyle = '#1A1A22'; ctx.textBaseline = 'alphabetic';
    ctx.font = `700 ${Math.round((LAND ? 44 : 72) * uu)}px 'Noto Sans SC'`; ctx.fillText('轨道交通线网', tx, ty);
    ctx.font = `${Math.round((LAND ? 30 : 44) * uu)}px 'Bebas Neue'`; ctx.fillStyle = '#6A6A74'; ctx.fillText('NETWORK PLAN · 4 LINES · 5 INTERCHANGES', tx, ty + (LAND ? 44 : 66) * uu);
    MAP.lines.forEach((ln, i) => { const k = smooth(ln.t0, ln.t0 + .3, t); ctx.fillStyle = ln.c; rr(ctx, tx + i * (LAND ? 70 : 100) * uu, ty + (LAND ? 66 : 100) * uu, (LAND ? 56 : 80) * uu * k, (LAND ? 10 : 14) * uu, 5 * uu); ctx.fill(); });
    ctx.globalAlpha = 1;
  }
});
