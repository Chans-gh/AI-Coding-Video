// C-127 发光宇宙：WebGL 着色器用分形噪声画深靛紫的太空雾，随镜头角度平移；上面用 Canvas 自己做透视投影，把一千多个点按三条旋臂撒成星系，青点是数据、紫点和连线是结构，全部用预先画好的光晕贴图叠加发光；中心一个琥珀色八面体是贯穿全片的主角，镜头按关键帧环绕推近，三张半透明玻璃卡片（先模糊背后的画面再盖一层白）依次写字。
// 风格提示词：用发光宇宙风格：深靛紫的太空雾里，无数叠加发光的点和光晕组成星系与网络，青色代表数据、紫色代表结构、琥珀色只给最关键的结论，半透明玻璃卡片悬在空中写字，一个反复出现的主角物体贯穿全片，镜头按关键帧在几处布景间飞越。
// 题材：3D 与实时图形 · 适合：AI 原理、复杂系统、抽象概念讲解
scene({
  id: 'C-127', name: '发光宇宙', dur: 5, still: 4.4,
  fonts: ["500 30px 'Noto Sans SC'", "700 40px 'Noto Sans SC'"],
  init() {
    glInit(W / 2, H / 2);
    glProgram('neb', GLSL_LIB + `
uniform vec2 CAM;
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y+CAM;
  vec2 q=vec2(fbm(uv*2.2+T*.03),fbm(uv*2.2+vec2(5.2,1.3)));
  float n=fbm(uv*1.6+q*1.5);
  vec3 c=mix(vec3(.02,.015,.06),vec3(.16,.07,.32),smoothstep(.3,.8,n));
  c+=vec3(.05,.2,.3)*smoothstep(.55,.9,fbm(uv*3.+q*2.+3.))*.6;
  c+=vec3(.25,.1,.4)*pow(smoothstep(.5,1.,n),3.)*.8;
  float s=hash21(floor(gl_FragCoord.xy)); c+=step(.9985,s)*vec3(.8,.85,1.)*(.5+.5*sin(T*3.+s*90.));
  O=vec4(c,1.);
}`);
    const R = mulberry32(127), sp = (col, a) => {
      const c = mk(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, '#fff'); g.addColorStop(.12, col); g.addColorStop(.4, rgba(hex2rgb(col), a)); g.addColorStop(1, rgba(hex2rgb(col), 0));
      x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c;
    };
    const SP = { c: sp('#4FE3FF', .25), p: sp('#A46BFF', .3), a: sp('#FFB547', .35) };
    const pts = [];
    for (let i = 0; i < 1400; i++) {
      const arm = i % 3, r = Math.pow(R(), .6) * 4 + .3, a = arm * TAU / 3 + r * 1.15 + (R() - .5) * .7 / (1 + r * .3);
      const gy = (R() + R() + R() - 1.5) * .25 * (1.2 - r / 5);
      pts.push({ x: Math.cos(a) * r, y: gy, z: Math.sin(a) * r, k: 'c', s: .02 + R() * .03, tw: R() * TAU });
    }
    const nodes = [];
    for (let i = 0; i < 46; i++) {
      const r = .8 + R() * 3.4, a = R() * TAU;
      nodes.push({ x: Math.cos(a) * r, y: (R() - .5) * .9, z: Math.sin(a) * r, k: 'p', s: .07 + R() * .05, tw: R() * TAU });
    }
    const links = [];
    nodes.forEach((n, i) => {
      const d = nodes.map((m, j) => [Math.hypot(m.x - n.x, m.y - n.y, m.z - n.z), j]).sort((a, b) => a[0] - b[0]);
      for (let k = 1; k <= 2; k++) if (d[k][1] > i || true) links.push([i, d[k][1], R()]);
    });
    return { SP, pts, nodes, links };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080;
    // 关键帧镜头：偏航、俯仰、距离
    const K = [[0, -.2, .55, 8.5], [1.6, .5, .4, 6.2], [3.2, 1.2, .42, 5.6], [5, 1.5, .5, 4.9]];
    let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
    const q = eInOutCubic(clamp((t - K[i][0]) / (K[i + 1][0] - K[i][0]), 0, 1));
    const yaw = lerp(K[i][1], K[i + 1][1], q), pit = lerp(K[i][2], K[i + 1][2], q), dist = lerp(K[i][3], K[i + 1][3], q);
    glDraw(ctx, 'neb', t, W / 2, H / 2, 0, 0, W, H, { CAM: [yaw * .25, pit * .3] });
    const cy_ = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pit), spn = Math.sin(pit);
    const fov = (LAND ? H : W) * 1.1, ox = W / 2, oy = H * (LAND ? .5 : .42);
    const proj = (p) => {
      const x1 = p.x * cy_ - p.z * sy, z1 = p.x * sy + p.z * cy_;
      const y2 = p.y * cp - z1 * spn, z2 = p.y * spn + z1 * cp + dist;
      if (z2 < .2) return null;
      return [ox + x1 / z2 * fov, oy + y2 / z2 * fov, z2];
    };
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // 结构连线（紫）和沿线流动的数据脉冲（青）
    ctx.lineWidth = 1.4 * u;
    for (const [a, b, ph] of s.links) {
      const A = proj(s.nodes[a]), B = proj(s.nodes[b]); if (!A || !B) continue;
      ctx.strokeStyle = 'rgba(164,107,255,.22)'; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      const k = (t * .6 + ph) % 1, px = lerp(A[0], B[0], k), py = lerp(A[1], B[1], k), r = 18 * u * 4 / lerp(A[2], B[2], k);
      ctx.drawImage(s.SP.c, px - r, py - r, r * 2, r * 2);
    }
    const reveal = smooth(0, 1.2, t), hero = smooth(2.9, 3.8, t);
    for (const p of s.pts) {
      const P = proj(p); if (!P) continue;
      const r = Math.min(p.s * fov / P[2] * 2, 9 * u) * (1 + .3 * Math.sin(t * 3 + p.tw));
      ctx.globalAlpha = reveal * clamp(1.4 - P[2] / 9, .15, .7) * (1 - .45 * hero);
      ctx.drawImage(s.SP.c, P[0] - r, P[1] - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
    for (const p of s.nodes) {
      const P = proj(p); if (!P) continue;
      const r = Math.min(p.s * fov / P[2] * 2.4, 26 * u) * (1 + .2 * Math.sin(t * 2 + p.tw));
      ctx.drawImage(s.SP.p, P[0] - r, P[1] - r, r * 2, r * 2);
    }
    // 主角：琥珀色八面体
    const hs = .5 + .08 * Math.sin(t * 2), ha = t * .9;
    const V = [[1, 0, 0], [-1, 0, 0], [0, 1.3, 0], [0, -1.3, 0], [0, 0, 1], [0, 0, -1]].map(([x, y, z]) => proj({ x: (x * Math.cos(ha) - z * Math.sin(ha)) * hs, y: y * hs, z: (x * Math.sin(ha) + z * Math.cos(ha)) * hs }));
    const C = proj({ x: 0, y: 0, z: 0 });
    if (C) {
      const gr = (.4 + .9 * hero) * fov / C[2] * (1 + .1 * Math.sin(t * 6));
      ctx.globalAlpha = .5 + .5 * hero; ctx.drawImage(s.SP.a, C[0] - gr, C[1] - gr, gr * 2, gr * 2); ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(255,190,90,${.55 + .45 * hero})`; ctx.lineWidth = (2 + 2 * hero) * u;
      const E = [[0, 2], [0, 3], [1, 2], [1, 3], [4, 2], [4, 3], [5, 2], [5, 3], [0, 4], [4, 1], [1, 5], [5, 0]];
      ctx.beginPath(); for (const [a, b] of E) if (V[a] && V[b]) { ctx.moveTo(V[a][0], V[a][1]); ctx.lineTo(V[b][0], V[b][1]); } ctx.stroke();
      // 结论时刻：琥珀色光环扩散
      if (t > 3.4) { const k = (t - 3.4) / 1.6, rr_ = k * 420 * u; ctx.strokeStyle = `rgba(255,181,71,${.6 * (1 - k)})`; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(C[0], C[1], rr_, 0, TAU); ctx.stroke(); }
    }
    ctx.restore();
    // 玻璃卡片
    const cards = [[.9, '#4FE3FF', '数据', '十四亿个信号同时流动'], [2.1, '#A46BFF', '结构', '它们在层与层之间结成网络'], [3.4, '#FFB547', '结论', '答案藏在连接里']];
    const cw = (LAND ? 560 : 760) * u, ch = 150 * u;
    cards.forEach(([a, col, lab, txt], j) => {
      const inQ = eOutCubic(smooth(a, a + .45, t)), out = j < 2 ? smooth(a + 1.05, a + 1.3, t) : 0;
      const al = inQ * (1 - out); if (al <= 0) return;
      const x = LAND ? W * .06 : (W - cw) / 2, y = (LAND ? H * .66 : H * .74) + 30 * u * (1 - inQ);
      ctx.save(); ctx.globalAlpha = al;
      ctx.save(); rr(ctx, x, y, cw, ch, 22 * u); ctx.clip(); ctx.filter = `blur(${14 * u}px)`; ctx.drawImage(ctx.canvas, 0, 0); ctx.filter = 'none';
      ctx.fillStyle = 'rgba(12,8,30,.5)'; ctx.fillRect(x, y, cw, ch); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(x, y, cw, ch); ctx.restore();
      rr(ctx, x, y, cw, ch, 22 * u); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1.5 * u; ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 40 * u, y + 46 * u, 7 * u, 0, TAU); ctx.fill();
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.font = `500 ${Math.round(26 * u)}px 'Noto Sans SC'`; ctx.fillStyle = col; ctx.fillText(lab, x + 60 * u, y + 46 * u);
      ctx.font = `700 ${Math.round(40 * u)}px 'Noto Sans SC'`; ctx.fillStyle = j === 2 ? '#FFE2B0' : '#EEF2FF'; ctx.fillText(txt, x + 34 * u, y + 102 * u);
      ctx.restore();
    });
    vignette(ctx, .5);
  }
});
