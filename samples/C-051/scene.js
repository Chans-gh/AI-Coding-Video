// C-051 扁平矢量角色短片：SVG 画场景和角色（细黑线 + 平涂色块，没有阴影），GSAP 暂停时间轴排动作、每帧 seek 到 t；小角色跳起来够架子上的饼干没够着，落地一震，架子一歪，饼干正好掉到头上。
// 风格提示词：用扁平矢量角色短片风格：白底或浅色单色背景，细黑线勾出简化场景，主角是一个造型简单、轮廓清晰的小角色并全片不变，色块平涂无阴影，动作有预备和过冲，一个镜头讲一个小笑点。
// 题材：卡通与动漫 · 适合：日常小故事、App 广告；可附上你自己的角色图
scene({
  id: 'C-051', name: '扁平矢量角色短片', dur: 4, still: 3.55, libs: ['gsap'], dom: true,
  init() {
    const u = SHORT / 1080 * (LAND ? 1 : 1.3), INK = '#1D1D1F', LW = 4 * u;
    STAGE.style.background = '#F6F1E7';
    const svg = svgRoot();
    const line = (pts, parent = svg, extra = {}) => el('svg:polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: INK, 'stroke-width': LW, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra }, parent);
    const L = LAND ? { cx: W * .40, gy: H * .80, shelfX: W * .40 + 120 * u, shelfY: H * .30 } : { cx: W * .40, gy: H * .70, shelfX: W * .42 + 60 * u, shelfY: H * .40 };
    // ---- 场景：几根细线 ----
    line([[0, L.gy], [W, L.gy]]);
    const win = LAND ? [W * .70, H * .16, 360 * u, 300 * u] : [W * .58, H * .14, 340 * u, 280 * u];
    el('svg:rect', { x: win[0], y: win[1], width: win[2], height: win[3], fill: '#CFE6F2', stroke: INK, 'stroke-width': LW }, svg);
    line([[win[0] + win[2] / 2, win[1]], [win[0] + win[2] / 2, win[1] + win[3]]]);
    line([[win[0], win[1] + win[3] / 2], [win[0] + win[2], win[1] + win[3] / 2]]);
    const sun = el('svg:circle', { cx: win[0] + win[2] * .75, cy: win[1] + win[3] * .28, r: 34 * u, fill: '#FFC93C' }, svg);
    // 盆栽
    const pX = LAND ? W * .14 : W * .14;
    el('svg:path', { d: `M${pX - 50 * u},${L.gy - 110 * u} h${100 * u} l${-14 * u},${110 * u} h${-72 * u} z`, fill: '#E86A4A', stroke: INK, 'stroke-width': LW, 'stroke-linejoin': 'round' }, svg);
    for (const [dx, h, a] of [[-20, 120, -.35], [0, 170, 0], [22, 130, .4]])
      el('svg:path', { d: `M${pX},${L.gy - 110 * u} q${dx * u + Math.sin(a) * 30 * u},${-h * .5 * u} ${dx * 2 * u + Math.sin(a) * 60 * u},${-h * u}`, fill: 'none', stroke: '#2E9B6A', 'stroke-width': 8 * u, 'stroke-linecap': 'round' }, svg);
    // 架子：绕左端的钉子转
    const shelfW = 300 * u;
    const shelf = el('svg:g', {}, svg);
    el('svg:rect', { x: L.shelfX, y: L.shelfY, width: shelfW, height: 18 * u, fill: '#B98552', stroke: INK, 'stroke-width': LW }, shelf);
    line([[L.shelfX + 30 * u, L.shelfY + 18 * u], [L.shelfX + 30 * u, L.shelfY + 70 * u], [L.shelfX + 80 * u, L.shelfY + 18 * u]], shelf);
    el('svg:circle', { cx: L.shelfX + 30 * u, cy: L.shelfY + 9 * u, r: 6 * u, fill: INK }, svg);
    // 饼干
    const ckR = 46 * u, ck0 = [L.shelfX + shelfW - 70 * u, L.shelfY - ckR];
    const cookie = el('svg:g', { transform: `translate(${ck0[0]},${ck0[1]})` }, svg);
    const ckIn = el('svg:g', {}, cookie);
    el('svg:circle', { r: ckR, fill: '#E0A458', stroke: INK, 'stroke-width': LW }, ckIn);
    for (const [x, y] of [[-16, -12], [14, -18], [4, 10], [-14, 18], [20, 14]]) el('svg:circle', { cx: x * u, cy: y * u, r: 6 * u, fill: '#5A3420' }, ckIn);

    // ---- 主角：黄色圆角方块 + 火柴手脚，原点在脚底中点 ----
    const hero = el('svg:g', { transform: `translate(${L.cx},${L.gy})` }, svg);
    const body = el('svg:g', {}, hero);
    const bw = 190 * u, bh = 210 * u, legH = 60 * u;
    const legs = [-1, 1].map(d => line([[d * 40 * u, -legH], [d * 40 * u, 0], [d * 60 * u, 0]], body, { 'stroke-width': 6 * u }));
    const armL = line([[-bw / 2, -legH - bh * .45], [-bw / 2 - 50 * u, -legH - bh * .2]], body, { 'stroke-width': 6 * u });
    const armR = line([[bw / 2, -legH - bh * .45], [bw / 2 + 50 * u, -legH - bh * .2]], body, { 'stroke-width': 6 * u });
    el('svg:rect', { x: -bw / 2, y: -legH - bh, width: bw, height: bh, rx: 56 * u, fill: '#FFD23F', stroke: INK, 'stroke-width': LW }, body);
    const eyes = el('svg:g', {}, body);
    const eyeY = -legH - bh * .62;
    const eyeW = [-1, 1].map(d => el('svg:ellipse', { cx: d * 38 * u, cy: eyeY, rx: 22 * u, ry: 26 * u, fill: '#fff', stroke: INK, 'stroke-width': 3 * u }, eyes));
    const pupils = el('svg:g', {}, eyes);
    [-1, 1].forEach(d => el('svg:circle', { cx: d * 38 * u, cy: eyeY + 4 * u, r: 10 * u, fill: INK }, pupils));
    const lids = el('svg:g', { opacity: 0 }, eyes);                     // 眯眼（开心）
    [-1, 1].forEach(d => el('svg:path', { d: `M${d * 38 * u - 18 * u},${eyeY + 4 * u} q${18 * u},${-22 * u} ${36 * u},0`, fill: 'none', stroke: INK, 'stroke-width': 6 * u, 'stroke-linecap': 'round' }, lids));
    const mouth = el('svg:path', { d: `M${-20 * u},${-legH - bh * .32} q${20 * u},${14 * u} ${40 * u},0`, fill: 'none', stroke: INK, 'stroke-width': 5 * u, 'stroke-linecap': 'round' }, body);
    const mouthO = el('svg:ellipse', { cx: 0, cy: -legH - bh * .28, rx: 12 * u, ry: 16 * u, fill: INK, opacity: 0 }, body);
    const blush = [-1, 1].map(d => el('svg:ellipse', { cx: d * 66 * u, cy: -legH - bh * .38, rx: 16 * u, ry: 9 * u, fill: '#FF8A7A', opacity: 0 }, body));
    // 感叹号、爱心、速度线
    const bang = el('svg:text', { x: L.cx + 120 * u, y: L.gy - legH - bh - 40 * u, 'font-size': 110 * u, 'font-weight': 900, 'font-family': 'Noto Sans SC', fill: '#E8423F', 'text-anchor': 'middle', opacity: 0 }, svg, '!');
    const heart = el('svg:path', { d: `M0,${12 * u} C${-40 * u},${-18 * u} ${-20 * u},${-48 * u} 0,${-26 * u} C${20 * u},${-48 * u} ${40 * u},${-18 * u} 0,${12 * u} Z`, fill: '#E8423F', stroke: INK, 'stroke-width': 3 * u, transform: `translate(${L.cx - 150 * u},${L.gy - legH - bh - 20 * u})`, opacity: 0 }, svg);
    const speed = el('svg:g', { opacity: 0 }, svg);
    for (const dx of [-60, 0, 60]) line([[L.cx + dx * u, L.gy - 20 * u], [L.cx + dx * u, L.gy + 50 * u]], speed, { 'stroke-width': 3 * u });

    // ---- 时间轴：预备 → 起跳 → 过冲 → 落地；架子歪，饼干掉头上 ----
    const tl = timeline();
    const headTop = L.gy - legH - bh;
    tl.set(body, { transformOrigin: '50% 100%' }, 0)
      .to(pupils, { y: -10 * u, x: 6 * u, duration: .25, ease: 'power2.out' }, .15)                       // 抬头看饼干
      .to(body, { scaleY: .78, scaleX: 1.14, duration: .28, ease: 'power2.out' }, .45)                  // 预备：蹲
      .to([armL, armR], { y: 14 * u, duration: .28 }, .45)
      .to(body, { scaleY: 1.16, scaleX: .9, duration: .12, ease: 'power2.out' }, .73)                   // 起跳拉长
      .to(hero, { y: L.gy - 230 * u, duration: .36, ease: 'power2.out' }, .73)
      .to(armR, { rotation: -120, svgOrigin: `${bw / 2} ${-legH - bh * .45}`, duration: .2 }, .78)
      .to(body, { scaleY: 1, scaleX: 1, duration: .2 }, .9)
      .to(hero, { y: L.gy, duration: .32, ease: 'power2.in' }, 1.12)
      .to(armR, { rotation: 0, duration: .25 }, 1.15)
      .to(body, { scaleY: .72, scaleX: 1.2, duration: .08, ease: 'power1.out' }, 1.44)                  // 落地压扁
      .to(body, { scaleY: 1, scaleX: 1, duration: .5, ease: 'elastic.out(1.2, .35)' }, 1.52)            // 过冲回弹
      .to([armL, armR], { y: 0, duration: .3 }, 1.44)
      .fromTo(speed, { opacity: 1 }, { opacity: 0, duration: .25, immediateRender: false }, 1.44)
      .to(shelf, { rotation: 4, svgOrigin: `${L.shelfX + 30 * u} ${L.shelfY + 9 * u}`, duration: .12, ease: 'power1.out' }, 1.46)   // 架子一震
      .to(shelf, { rotation: -2, duration: .14 }, 1.58)
      .to(shelf, { rotation: 0, duration: .14 }, 1.72)
      .to(pupils, { y: 4 * u, x: 0, duration: .2 }, 1.7)                                               // 叹气、低头
      .to(mouth, { attr: { d: `M${-20 * u},${-legH - bh * .3} q${20 * u},${-12 * u} ${40 * u},0` }, duration: .15 }, 1.7)
      .to(shelf, { rotation: 16, duration: .3, ease: 'power2.in' }, 2.15)                              // 架子一歪
      .to(cookie, { x: L.cx, y: headTop - ckR + 10 * u, duration: .55, ease: 'power2.in' }, 2.25)
      .to(ckIn, { rotation: 300, svgOrigin: '0 0', duration: .55, ease: 'power1.in' }, 2.25)
      .to(body, { scaleY: .86, scaleX: 1.08, duration: .07 }, 2.8)                                     // 砸中
      .to(body, { scaleY: 1, scaleX: 1, duration: .45, ease: 'elastic.out(1, .4)' }, 2.87)
      .to(cookie, { y: headTop - ckR - 30 * u, duration: .16, ease: 'power2.out' }, 2.8)
      .to(cookie, { y: headTop - ckR + 6 * u, duration: .2, ease: 'bounce.out' }, 2.96)
      .to(pupils, { y: -14 * u, duration: .12 }, 2.82)
      .to(mouth, { opacity: 0, duration: .01 }, 2.82).to(mouthO, { opacity: 1, duration: .01 }, 2.82)
      .fromTo(bang, { opacity: 0, scale: .2, transformOrigin: '50% 100%' }, { opacity: 1, scale: 1, duration: .25, ease: 'back.out(3)', immediateRender: false }, 2.85)
      .to(bang, { opacity: 0, duration: .15 }, 3.25)
      .to([eyeW, pupils], { opacity: 0, duration: .05 }, 3.3).to(lids, { opacity: 1, duration: .05 }, 3.3)   // 开心：眯眼、脸红
      .to(mouthO, { opacity: 0, duration: .01 }, 3.3)
      .to(mouth, { opacity: 1, attr: { d: `M${-26 * u},${-legH - bh * .34} q${26 * u},${30 * u} ${52 * u},0` }, duration: .01 }, 3.3)
      .to(blush, { opacity: 1, duration: .2 }, 3.3)
      .fromTo(heart, { opacity: 0, scale: .2, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .35, ease: 'back.out(3)', immediateRender: false }, 3.4)
      .to(heart, { y: '-=40', duration: .6, ease: 'sine.out' }, 3.4)
      .to(body, { rotation: -4, duration: .2, yoyo: true, repeat: 2, ease: 'sine.inOut' }, 3.4)
      .to(sun, { attr: { r: 40 * u }, duration: 2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0);
    return { tl };
  },
  draw(ctx, t, s) { s.tl.seek(t); }
});
