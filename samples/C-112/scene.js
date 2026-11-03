// C-112 电视新闻包装：HTML/CSS 排版加 SVG 图形，全部动作排在一条暂停的 GSAP 时间轴上，每帧 seek 到 t：台标缩成角标，要闻目录开场，翻牌价格板和折线讲一个事实，平行四边形台标下的字条上下翻转换标题，结尾目录逐条打勾。
// 风格提示词：用电视新闻包装风格：深墨色底，片头标识缩成角标，今日要闻目录开场又在结尾逐条打勾，平行四边形台标和纸色字条始终压在画面下方、换标题时上下翻转，每屏只放一个事实（翻牌价格板、破线折线、说明地图、盖章），干净无滚动字幕，配新闻鼓点。
// 题材：平面设计与动态排版 · 适合：每日简报、行业快讯、周报回顾
scene({
  id: 'C-112', name: '电视新闻包装', dur: 5, still: 2.75, libs: ['gsap'], dom: true,
  text: '晨间简报今日要闻铜价三连涨创年内新高需求回暖是主因新线开通年度盘点明天见财经快讯每吨元周一二三四五',
  fonts: ["900 80px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 80px 'JetBrains Mono'", "400 80px 'Bebas Neue'"],
  init() {
    const u = SHORT / 1080, px = v => `${Math.round(v * u)}px`;
    const INK = '#0E1726', RED = '#E2342D', PAPER = '#F2EBDD', GOLD = '#F5B731';
    Object.assign(STAGE.style, { background: `radial-gradient(ellipse at 60% 40%, #1B2A40 0%, ${INK} 70%)`, fontFamily: "'Noto Sans SC'", color: PAPER, perspective: px(1400) });
    const abs = (x, y, extra = {}) => ({ position: 'absolute', left: `${Math.round(x)}px`, top: `${Math.round(y)}px`, ...extra });
    // 背景细网格：SVG
    const bg = svgRoot();
    for (let x = 0; x < W; x += 60 * u) el('svg:line', { x1: x, y1: 0, x2: x, y2: H, stroke: '#ffffff', 'stroke-opacity': .035 }, bg);
    for (let y = 0; y < H; y += 60 * u) el('svg:line', { x1: 0, y1: y, x2: W, y2: y, stroke: '#ffffff', 'stroke-opacity': .035 }, bg);

    // ---- 台标：先在中间，后缩成左上角角标 ----
    const logo = el('div', { style: abs(W / 2, H / 2, { transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', gap: px(22), whiteSpace: 'nowrap' }) });
    const mark = el('div', { style: { width: px(120), height: px(120), background: RED, transform: 'skewX(-12deg)', display: 'grid', placeItems: 'center' } }, logo);
    el('div', { style: { font: `400 ${px(96)} 'Bebas Neue'`, color: '#fff', transform: 'skewX(12deg)', lineHeight: 1 } }, mark, 'AM');
    const logoTxt = el('div', { style: { lineHeight: 1.05 } }, logo);
    el('div', { style: { font: `900 ${px(84)} 'Noto Sans SC'` } }, logoTxt, '晨间简报');
    el('div', { style: { font: `400 ${px(34)} 'Bebas Neue'`, letterSpacing: px(8), color: GOLD } }, logoTxt, 'MORNING BRIEF · 周三');
    const wipe = el('div', { style: abs(0, 0, { width: `${W}px`, height: `${H}px`, background: RED, transformOrigin: 'left center' }) });

    // ---- 要闻目录 ----
    const AG = ['铜价三连涨', '城东新线开通', '年度盘点'];
    const agX = LAND ? 170 * u : 90 * u, agY = LAND ? 300 * u : 560 * u;
    const agenda = el('div', { style: abs(agX, agY) });
    const agHead = el('div', { style: { font: `900 ${px(64)} 'Noto Sans SC'`, color: GOLD, marginBottom: px(28) } }, agenda, '今日要闻');
    const rows = AG.map((txt, i) => {
      const r = el('div', { style: { display: 'flex', alignItems: 'center', gap: px(26), height: px(104), borderTop: `${px(2)} solid rgba(242,235,221,.25)`, width: px(LAND ? 820 : 900) } }, agenda);
      el('div', { style: { font: `700 ${px(46)} 'JetBrains Mono'`, color: RED, width: px(70) } }, r, `0${i + 1}`);
      el('div', { style: { font: `700 ${px(56)} 'Noto Sans SC'`, flex: 1 } }, r, txt);
      const box = el('svg:svg', { width: px(64), height: px(64), viewBox: '0 0 64 64' }, r);
      el('svg:rect', { x: 4, y: 4, width: 56, height: 56, rx: 6, fill: 'none', stroke: PAPER, 'stroke-width': 4, 'stroke-opacity': .6 }, box);
      const tick = el('svg:path', { d: 'M14 34 L28 47 L52 18', fill: 'none', stroke: GOLD, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 60, 'stroke-dashoffset': 60 }, box);
      return { r, tick };
    });

    // ---- 一个事实：翻牌价格板 + 破线折线 ----
    const fact = el('div', { style: abs(LAND ? 170 * u : 90 * u, LAND ? 210 * u : 330 * u, { width: `${LAND ? W - 340 * u : W - 180 * u}px` }) });
    el('div', { style: { font: `700 ${px(40)} 'Noto Sans SC'`, color: GOLD, letterSpacing: px(4) } }, fact, '铜 · 每吨（元）');
    const board = el('div', { style: { display: 'flex', gap: px(10), marginTop: px(22), perspective: px(800) } }, fact);
    const OLD = '66280', NEW = '68420', flips = [];
    [...NEW].forEach((d, i) => {
      if (i === 2) el('div', { style: { font: `700 ${px(130)} 'JetBrains Mono'`, alignSelf: 'flex-end', lineHeight: 1 } }, board, ',');
      const cell = el('div', { style: { position: 'relative', width: px(112), height: px(170), transformStyle: 'preserve-3d' } }, board);
      const face = (txt) => {
        const f = el('div', { style: { position: 'absolute', inset: 0, background: '#1F2C42', borderRadius: px(10), display: 'grid', placeItems: 'center', font: `700 ${px(130)} 'JetBrains Mono'`, color: '#fff', backfaceVisibility: 'hidden', boxShadow: `inset 0 ${px(-3)} 0 rgba(0,0,0,.4)` } }, cell, txt);
        el('div', { style: { position: 'absolute', left: 0, right: 0, top: '50%', height: px(3), background: INK } }, f);
        return f;
      };
      const a = face(OLD[i]), b = face(d);
      flips.push({ a, b, same: OLD[i] === d });
    });
    const chg = el('div', { style: { font: `700 ${px(54)} 'JetBrains Mono'`, color: '#3FD17A', marginTop: px(18) } }, fact, '▲ +3.2%');
    const chartW = LAND ? 760 * u : W - 180 * u, chartH = LAND ? 330 * u : 420 * u;
    const chart = el('svg:svg', { width: chartW, height: chartH, style: LAND ? abs(W - 170 * u - chartW - (LAND ? 0 : 0) - 170 * u * 0, 330 * u) : abs(90 * u, 980 * u) });
    if (LAND) { chart.style.left = `${W - 170 * u - chartW}px`; chart.style.top = `${300 * u}px`; }
    STAGE.appendChild(chart);
    const days = ['周一', '周二', '周三', '周四', '周五'], val = [.25, .2, .48, .7, .92];
    const pt = i => [40 * u + i * (chartW - 80 * u) / 4, chartH - 70 * u - val[i] * (chartH - 130 * u)];
    for (let i = 0; i < 5; i++) {
      el('svg:line', { x1: pt(i)[0], y1: 20 * u, x2: pt(i)[0], y2: chartH - 60 * u, stroke: PAPER, 'stroke-opacity': .12 }, chart);
      el('svg:text', { x: pt(i)[0], y: chartH - 16 * u, fill: PAPER, 'fill-opacity': .7, 'font-size': 30 * u, 'text-anchor': 'middle', 'font-family': 'Noto Sans SC' }, chart, days[i]);
    }
    // 破线：前两天是旧走势（虚线），后面实线
    const d0 = `M${pt(0)} L${pt(1)} L${pt(2)}`, d1 = `M${pt(2)} L${pt(3)} L${pt(4)}`;
    const dash = el('svg:path', { d: d0, fill: 'none', stroke: PAPER, 'stroke-opacity': .55, 'stroke-width': 5 * u, 'stroke-dasharray': `${12 * u} ${10 * u}` }, chart);
    const solid = el('svg:path', { d: d1, fill: 'none', stroke: GOLD, 'stroke-width': 9 * u, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, chart);
    const dot = el('svg:circle', { cx: pt(4)[0], cy: pt(4)[1], r: 16 * u, fill: RED, stroke: '#fff', 'stroke-width': 4 * u }, chart);
    const dashMask = el('svg:rect', { x: 0, y: 0, width: chartW, height: chartH, fill: INK, 'fill-opacity': 0 }, chart);
    const solidLen = Math.hypot(pt(3)[0] - pt(2)[0], pt(3)[1] - pt(2)[1]) + Math.hypot(pt(4)[0] - pt(3)[0], pt(4)[1] - pt(3)[1]);
    solid.setAttribute('stroke-dasharray', solidLen); solid.setAttribute('stroke-dashoffset', solidLen);

    // ---- 下方台标 + 纸色字条（标题上下翻转） ----
    const lowY = H - (LAND ? 190 : 330) * u;
    const lower = el('div', { style: abs(LAND ? 120 * u : 60 * u, lowY, { display: 'flex', alignItems: 'stretch', height: px(104) }) });
    const tag = el('div', { style: { background: RED, transform: 'skewX(-14deg)', padding: `0 ${px(34)}`, display: 'grid', placeItems: 'center', font: `900 ${px(48)} 'Noto Sans SC'`, color: '#fff', zIndex: 2 } }, lower);
    el('span', { style: { display: 'block', transform: 'skewX(14deg)' } }, tag, '财经');
    const strip = el('div', { style: { position: 'relative', background: PAPER, width: px(LAND ? 1180 : 800), marginLeft: px(-14), overflow: 'hidden', perspective: px(600) } }, lower);
    const titles = ['铜价三连涨，创年内新高', '分析：需求回暖是主因', '明天同一时间见'].map(s =>
      el('div', { style: { position: 'absolute', left: px(46), top: 0, height: '100%', display: 'flex', alignItems: 'center', font: `700 ${px(LAND ? 52 : 46)} 'Noto Sans SC'`, color: INK, whiteSpace: 'nowrap', transformOrigin: '50% 50% -30px' } }, strip, s));
    const live = el('div', { style: abs(W - (LAND ? 300 : 250) * u, 60 * u, { font: `400 ${px(44)} 'Bebas Neue'`, letterSpacing: px(4), color: '#fff', display: 'flex', alignItems: 'center', gap: px(12) }) });
    const rec = el('div', { style: { width: px(20), height: px(20), borderRadius: '50%', background: RED } }, live);
    el('span', {}, live, 'LIVE 07:30');

    // ---- 时间轴 ----
    const tl = timeline({ defaults: { ease: 'power3.out' } });
    const cornerScale = .42, cx = (LAND ? 70 : 50) * u, cy = 50 * u;
    tl.fromTo(wipe, { scaleX: 1 }, { scaleX: 0, transformOrigin: 'right center', duration: .45, ease: 'power4.inOut' }, 0)
      .fromTo(logo, { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 1, duration: .45 }, .1)
      .to(logo, { left: cx, top: cy, xPercent: 0, yPercent: 0, x: 0, y: 0, transform: `translate(0,0) scale(${cornerScale})`, transformOrigin: 'left top', duration: .5, ease: 'power3.inOut' }, .8)
      .fromTo(agHead, { x: -60 * u, opacity: 0 }, { x: 0, opacity: 1, duration: .35 }, 1.05)
      .fromTo(rows.map(r => r.r), { x: -80 * u, opacity: 0 }, { x: 0, opacity: 1, duration: .35, stagger: .1 }, 1.1)
      .fromTo(lower, { x: -W, }, { x: 0, duration: .5, ease: 'power4.out' }, 1.0)
      .fromTo(titles, { rotationX: -90, opacity: 0 }, { rotationX: -90, opacity: 0, duration: 0 }, 0)
      .fromTo(titles[0], { rotationX: -90, opacity: 0 }, { rotationX: 0, opacity: 1, duration: .35 }, 1.25)
      .to(agenda, { x: -120 * u, opacity: 0, duration: .3, ease: 'power2.in' }, 1.75)
      .fromTo([fact, chart], { opacity: 0, y: 40 * u }, { opacity: 1, y: 0, duration: .35 }, 1.95)
      .fromTo(chg, { opacity: 0 }, { opacity: 1, duration: .2 }, 2.75)
      .fromTo(dash, { opacity: 0 }, { opacity: 1, duration: .3 }, 2.0)
      .fromTo(solid, { attr: { 'stroke-dashoffset': solidLen } }, { attr: { 'stroke-dashoffset': 0 }, duration: .7, ease: 'power2.inOut' }, 2.2)
      .fromTo(dot, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .3, ease: 'back.out(3)' }, 2.85);
    flips.forEach((fl, i) => {
      tl.fromTo(fl.b, { rotationX: 180 }, { rotationX: 180, duration: 0 }, 0);
      if (fl.same) { tl.set(fl.b, { opacity: 0 }, 0); return; }
      tl.fromTo(fl.a, { rotationX: 0 }, { rotationX: -180, duration: .45, ease: 'power2.in' }, 2.15 + i * .09)
        .fromTo(fl.b, { rotationX: 180 }, { rotationX: 0, duration: .45, ease: 'power2.in' }, 2.15 + i * .09);
    });
    const flipTitle = (a, b, at) => tl.to(titles[a], { rotationX: 90, opacity: 0, duration: .3, ease: 'power2.in' }, at)
      .fromTo(titles[b], { rotationX: -90, opacity: 0 }, { rotationX: 0, opacity: 1, duration: .3, ease: 'power2.out' }, at + .2);
    flipTitle(0, 1, 3.0);
    tl.to([fact, chart], { opacity: 0, y: -30 * u, duration: .3, ease: 'power2.in' }, 3.4)
      .to(agenda, { x: 0, opacity: 1, duration: .35 }, 3.6);
    rows.forEach((r, i) => tl.to(r.tick, { attr: { 'stroke-dashoffset': 0 }, duration: .22, ease: 'power2.out' }, 3.95 + i * .25)
      .to(r.r, { opacity: .55, duration: .2 }, 4.1 + i * .25));
    flipTitle(1, 2, 4.2);
    tl.fromTo(rec, { opacity: 1 }, { opacity: .15, duration: .5, repeat: 9, yoyo: true, ease: 'none' }, 0);
    tl.fromTo(STAGE, { backgroundPosition: '0px 0px' }, { backgroundPosition: '0px 0px', duration: 5 }, 0);
    return { tl };
  },
  draw(ctx, t, s) { s.tl.seek(t); }
});
