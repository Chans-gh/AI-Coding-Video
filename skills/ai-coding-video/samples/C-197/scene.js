// C-197 Motion 弹簧卡片动效：真实 Motion 库弹簧物理时间轴 + HTML/CSS 玻璃卡片 + SVG 图标动画

scene({
  id: 'C-197',
  name: 'Motion 弹簧卡片动效',
  dur: 4,
  still: 2.2,
  dom: true,
  libs: ['motion'],
  fonts: ['Noto Sans SC', 'JetBrains Mono'],

  init() {
    const sc = SHORT / 1080;
    const { animate, spring } = window.Motion;

    STAGE.innerHTML = '';
    STAGE.style.background = 'radial-gradient(circle at 22% 18%, #1e293b 0%, #0b1120 55%, #060913 100%)';
    STAGE.style.fontFamily = '"Noto Sans SC", sans-serif';
    STAGE.style.color = '#f8fafc';
    STAGE.style.overflow = 'hidden';

    // Ambient glowing aurora orb driven by Motion for continuous kinetic depth
    const glowOrb = el('div', {
      style: {
        position: 'absolute',
        width: `${(LAND ? 620 : 520) * sc}px`,
        height: `${(LAND ? 620 : 520) * sc}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(168,85,247,0.16) 45%, rgba(0,0,0,0) 72%)',
        filter: `blur(${40 * sc}px)`,
        pointerEvents: 'none',
      },
    });

    // Subtle grid backdrop
    el('div', {
      style: {
        position: 'absolute', inset: '0',
        backgroundImage: 'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)',
        backgroundSize: `${48 * sc}px ${48 * sc}px`,
      },
    });

    // Header
    const header = el('div', {
      style: {
        position: 'absolute',
        left: `${(LAND ? 72 : 52) * sc}px`,
        top: `${(LAND ? 54 : 84) * sc}px`,
        right: `${(LAND ? 72 : 52) * sc}px`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
    });
    const titleWrap = el('div', {}, header);
    el('div', {
      style: { fontSize: `${15 * sc}px`, fontFamily: '"JetBrains Mono", monospace', color: '#38bdf8', letterSpacing: '0.08em' },
    }, titleWrap, 'MOTION · SPRING PHYSICS UI');
    el('div', {
      style: { fontSize: `${(LAND ? 38 : 34) * sc}px`, fontWeight: '700', marginTop: `${6 * sc}px` },
    }, titleWrap, '弹簧卡片交互编排');

    const pill = el('div', {
      style: {
        padding: `${10 * sc}px ${18 * sc}px`,
        borderRadius: `${999}px`,
        background: 'rgba(56,189,248,0.14)',
        border: `1.5px solid rgba(56,189,248,0.45)`,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: `${14 * sc}px`,
        color: '#7dd3fc',
      },
    }, header, 'spring(stiffness: 260, damping: 20)');

    // Tab switcher pill bar
    const tabBar = el('div', {
      style: {
        position: 'absolute',
        left: '50%',
        top: `${(LAND ? 176 : 230) * sc}px`,
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: `${10 * sc}px`,
        padding: `${8 * sc}px`,
        borderRadius: `${16 * sc}px`,
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid rgba(148,163,184,0.2)',
      },
    });
    const tabIndicator = el('div', {
      style: {
        position: 'absolute',
        left: `${8 * sc}px`,
        top: `${8 * sc}px`,
        width: `${144 * sc}px`,
        height: `${40 * sc}px`,
        borderRadius: `${10 * sc}px`,
        background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
        boxShadow: '0 8px 24px rgba(56,189,248,0.35)',
      },
    }, tabBar);

    ['布局弹簧', '微交互态', '物理曲线'].forEach((name) => {
      el('div', {
        style: {
          position: 'relative', zIndex: '2',
          width: `${144 * sc}px`, height: `${40 * sc}px`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: `${16 * sc}px`, fontWeight: '600',
        },
      }, tabBar, name);
    });

    // 3 Glassmorphic feature cards
    const cardsData = [
      { tag: '01 · SPRING', title: '真实弹性阻尼', metric: '260 N/m', sub: '无生硬线性截断，自然过冲回弹', accent: '#38bdf8' },
      { tag: '02 · STAGGER', title: '错峰节奏入场', metric: '+140 ms', sub: '多卡片顺序联动，视线顺滑引导', accent: '#a855f7' },
      { tag: '03 · MORPH', title: '焦点高亮切换', metric: '60 FPS', sub: '同一时间轴驱动 DOM 与 SVG 路径', accent: '#34d399' },
    ];

    const grid = el('div', {
      style: {
        position: 'absolute',
        left: `${(LAND ? 72 : 52) * sc}px`,
        right: `${(LAND ? 72 : 52) * sc}px`,
        top: `${(LAND ? 270 : 340) * sc}px`,
        display: 'grid',
        gridTemplateColumns: LAND ? 'repeat(3, 1fr)' : '1fr',
        gap: `${(LAND ? 28 : 24) * sc}px`,
      },
    });

    const cardEls = cardsData.map((c) => {
      const card = el('div', {
        style: {
          position: 'relative',
          padding: `${(LAND ? 32 : 28) * sc}px`,
          borderRadius: `${24 * sc}px`,
          background: 'linear-gradient(160deg, rgba(30,41,59,0.88), rgba(15,23,42,0.92))',
          border: `1.5px solid rgba(148,163,184,0.22)`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          opacity: '0',
        },
      }, grid);

      el('div', {
        style: {
          display: 'inline-block',
          padding: `${5 * sc}px ${12 * sc}px`,
          borderRadius: `${8 * sc}px`,
          background: `${c.accent}22`,
          color: c.accent,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: `${13 * sc}px`,
          fontWeight: '600',
        },
      }, card, c.tag);

      el('div', {
        style: { fontSize: `${(LAND ? 26 : 24) * sc}px`, fontWeight: '700', marginTop: `${18 * sc}px` },
      }, card, c.title);

      el('div', {
        style: {
          fontSize: `${(LAND ? 46 : 42) * sc}px`,
          fontWeight: '700',
          fontFamily: '"JetBrains Mono", monospace',
          color: c.accent,
          marginTop: `${14 * sc}px`,
        },
      }, card, c.metric);

      el('div', {
        style: { fontSize: `${16 * sc}px`, color: '#94a3b8', marginTop: `${10 * sc}px`, lineHeight: '1.5' },
      }, card, c.sub);

      return card;
    });

    // Bottom spring response curve (SVG)
    const footY = H - (LAND ? 175 : 220) * sc;
    const foot = el('div', {
      style: {
        position: 'absolute',
        left: `${(LAND ? 72 : 52) * sc}px`,
        right: `${(LAND ? 72 : 52) * sc}px`,
        top: `${footY}px`,
        height: `${112 * sc}px`,
        borderRadius: `${18 * sc}px`,
        background: 'rgba(15,23,42,0.82)',
        border: '1px solid rgba(148,163,184,0.2)',
        padding: `${16 * sc}px ${24 * sc}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
    });
    const curveSvg = el('svg:svg', {
      viewBox: '0 0 600 80',
      style: { width: `${(LAND ? 680 : 420) * sc}px`, height: `${76 * sc}px` },
    }, foot);

    // Precompute damped spring curve path
    let dPath = 'M 0 64';
    for (let i = 1; i <= 120; i++) {
      const u = i / 120;
      const y = 64 - 44 * (1 - Math.exp(-5.2 * u) * Math.cos(14.5 * u));
      dPath += ` L ${(u * 600).toFixed(1)} ${y.toFixed(1)}`;
    }
    el('svg:path', { d: dPath, fill: 'none', stroke: 'rgba(56,189,248,0.22)', 'stroke-width': '3' }, curveSvg);
    const activeCurve = el('svg:path', {
      d: dPath, fill: 'none', stroke: '#38bdf8', 'stroke-width': '3.5',
      'stroke-dasharray': '700', 'stroke-dashoffset': '700',
    }, curveSvg);

    const curveDot = el('svg:circle', { cx: '0', cy: '64', r: '6', fill: '#f8fafc', stroke: '#38bdf8', 'stroke-width': '3' }, curveSvg);

    const timeReadout = el('div', {
      style: { fontFamily: '"JetBrains Mono", monospace', fontSize: `${18 * sc}px`, color: '#cbd5e1', textAlign: 'right' },
    }, foot, 't = 0.00s');

    // Create paused real Motion.animate() timelines driven deterministically by t
    const anims = [];
    const addAnim = (target, keyframes, opts) => {
      const a = animate(target, keyframes, opts);
      a.pause();
      anims.push(a);
    };

    const sp = { type: spring, stiffness: 260, damping: 20 };
    addAnim(titleWrap, { opacity: [0, 1], y: [24 * sc, 0] }, { ...sp, delay: 0.05 });
    addAnim(pill, { opacity: [0, 1], scale: [0.85, 1] }, { ...sp, delay: 0.15 });

    cardEls.forEach((card, i) => {
      addAnim(card, { opacity: [0, 1], y: [70 * sc, 0], scale: [0.9, 1] }, { ...sp, delay: 0.25 + i * 0.22 });
    });

    // Tab indicator spring morph across 3 tabs
    const stepX = (144 + 10) * sc;
    addAnim(tabIndicator, { x: [0, stepX] }, { ...sp, delay: 1.65 });
    addAnim(tabIndicator, { x: [stepX, stepX * 2] }, { ...sp, delay: 2.75 });

    // Highlight card 2 then card 3 with spring lift
    addAnim(cardEls[1], { scale: [1, 1.045] }, { ...sp, delay: 1.7 });
    addAnim(cardEls[1], { scale: [1.045, 1] }, { ...sp, delay: 2.7 });
    addAnim(cardEls[2], { scale: [1, 1.045] }, { ...sp, delay: 2.8 });

    // Continuous ambient orb orbit via Motion.animate
    addAnim(glowOrb, {
      x: [W * 0.08, W * 0.56, W * 0.24],
      y: [H * 0.12, H * 0.34, H * 0.48],
      scale: [0.95, 1.22, 1.0],
    }, { duration: 4.0, easing: 'ease-in-out' });

    // Draw spring curve smoothly across full duration
    addAnim(activeCurve, { strokeDashoffset: [700, 0] }, { duration: 3.8, delay: 0.1, easing: 'linear' });

    return { anims, cardEls, timeReadout, curveDot };
  },

  draw(ctx, t, st) {
    const { anims, cardEls, timeReadout, curveDot } = st;
    // Deterministically seek every Motion animation to exact time t
    for (const a of anims) {
      a.time = t;
    }
    // Move spring tracer dot along the curve continuously
    const u = clamp((t - 0.1) / 3.8, 0, 1);
    const dotX = u * 600;
    const dotY = 64 - 44 * (1 - Math.exp(-5.2 * u) * Math.cos(14.5 * u));
    curveDot.setAttribute('cx', dotX.toFixed(1));
    curveDot.setAttribute('cy', dotY.toFixed(1));

    const activeIdx = t < 1.65 ? 0 : t < 2.75 ? 1 : 2;
    const accents = ['#38bdf8', '#a855f7', '#34d399'];
    cardEls.forEach((c, i) => {
      c.style.borderColor = i === activeIdx ? accents[i] : 'rgba(148,163,184,0.22)';
      c.style.boxShadow = i === activeIdx ? `0 24px 70px ${accents[i]}44` : '0 24px 60px rgba(0,0,0,0.45)';
    });
    timeReadout.textContent = `Motion v14 · t = ${t.toFixed(2)}s`;
  },
});
