// C-208 SaaS 功能发布与光标聚焦演示：HTML/CSS 拟真产品工作台 + 模拟光标点击 + 镜头推近放大聚焦 + 发布成功通知

scene({
  id: 'C-208',
  name: 'SaaS 功能发布与光标聚焦演示',
  dur: 4.5,
  still: 2.9,
  dom: true,
  libs: ['motion'],
  fonts: ['Noto Sans SC', 'JetBrains Mono'],

  init() {
    const sc = SHORT / 1080;
    const { animate, spring } = window.Motion;

    STAGE.innerHTML = '';
    STAGE.style.background = 'radial-gradient(circle at 75% 20%, #1e1b4b 0%, #090d1a 55%, #05070e 100%)';
    STAGE.style.fontFamily = '"Noto Sans SC", sans-serif';
    STAGE.style.color = '#f8fafc';
    STAGE.style.overflow = 'hidden';

    // Background grid
    el('div', {
      style: {
        position: 'absolute',
        inset: '0',
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)',
        backgroundSize: `${56 * sc}px ${56 * sc}px`,
      },
    });

    // Header badge
    const topHdr = el('div', {
      style: {
        position: 'absolute',
        left: `${(LAND ? 76 : 56) * sc}px`,
        top: `${(LAND ? 46 : 74) * sc}px`,
        right: `${(LAND ? 76 : 56) * sc}px`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: '20',
      },
    });
    const hLeft = el('div', {}, topHdr);
    el('div', {
      style: { fontFamily: '"JetBrains Mono", monospace', fontSize: `${15 * sc}px`, color: '#818cf8', letterSpacing: '0.08em' },
    }, hLeft, 'RELEASE v2.4 · PRODUCT LAUNCH');
    el('div', {
      style: { fontSize: `${(LAND ? 34 : 38) * sc}px`, fontWeight: '700', marginTop: `${4 * sc}px` },
    }, hLeft, '一键开启 AI 自动化工作流');
    el('div', {
      style: {
        padding: `${8 * sc}px ${16 * sc}px`,
        borderRadius: '999px',
        background: 'rgba(99,102,241,0.18)',
        border: '1px solid rgba(129,140,248,0.45)',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: `${14 * sc}px`,
        color: '#c7d2fe',
      },
    }, topHdr, '0-Config Deploy');

    // Camera viewport wrapper (for smooth zoom/pan focus)
    const cam = el('div', {
      style: {
        position: 'absolute',
        inset: '0',
        transformOrigin: LAND ? '62% 54%' : '56% 52%',
      },
    });

    // SaaS Browser Window
    const winW = (LAND ? 1360 : 960) * sc;
    const winH = (LAND ? 760 : 1220) * sc;
    const win = el('div', {
      style: {
        position: 'absolute',
        left: `${(W - winW) / 2}px`,
        top: `${(LAND ? 176 : 310) * sc}px`,
        width: `${winW}px`,
        height: `${winH}px`,
        borderRadius: `${24 * sc}px`,
        background: '#0f172a',
        border: `1.5px solid rgba(148,163,184,0.26)`,
        boxShadow: `0 ${40 * sc}px ${100 * sc}px rgba(0,0,0,0.65)`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      },
    }, cam);

    // Window chrome
    const chrome = el('div', {
      style: {
        height: `${54 * sc}px`,
        padding: `0 ${22 * sc}px`,
        background: '#1e293b',
        borderBottom: '1px solid rgba(148,163,184,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
    }, win);
    const dots = el('div', { style: { display: 'flex', gap: `${9 * sc}px` } }, chrome);
    for (const c of ['#ef4444', '#f59e0b', '#22c55e']) {
      el('div', { style: { width: `${12 * sc}px`, height: `${12 * sc}px`, borderRadius: '50%', background: c } }, dots);
    }
    el('div', {
      style: {
        padding: `${5 * sc}px ${22 * sc}px`,
        borderRadius: `${8 * sc}px`,
        background: 'rgba(15,23,42,0.7)',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: `${13 * sc}px`,
        color: '#94a3b8',
      },
    }, chrome, 'app.flowstudio.dev/pipelines/prod');
    el('div', { style: { fontSize: `${13 * sc}px`, color: '#34d399', fontFamily: '"JetBrains Mono", monospace' } }, chrome, 'LIVE');

    // Workspace content
    const ws = el('div', {
      style: {
        flex: '1',
        display: 'flex',
        flexDirection: LAND ? 'row' : 'column',
      },
    }, win);

    // Sidebar (only in landscape or compact top bar in portrait)
    if (LAND) {
      const side = el('div', {
        style: {
          width: `${240 * sc}px`,
          background: 'rgba(15,23,42,0.9)',
          borderRight: '1px solid rgba(148,163,184,0.14)',
          padding: `${24 * sc}px ${18 * sc}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: `${10 * sc}px`,
        },
      }, ws);
      for (const [name, active] of [['概览看板', false], ['自动化编排', true], ['API 密钥', false], ['实时日志', false], ['团队权限', false]]) {
        el('div', {
          style: {
            padding: `${12 * sc}px ${16 * sc}px`,
            borderRadius: `${10 * sc}px`,
            background: active ? 'rgba(99,102,241,0.22)' : 'transparent',
            color: active ? '#e0e7ff' : '#94a3b8',
            fontWeight: active ? '700' : '400',
            fontSize: `${16 * sc}px`,
          },
        }, side, name);
      }
    }

    // Main panel
    const main = el('div', {
      style: {
        flex: '1',
        padding: `${(LAND ? 32 : 36) * sc}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${(LAND ? 24 : 28) * sc}px`,
      },
    }, ws);

    // Action row with target CTA button
    const actRow = el('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
    }, main);
    const actTitle = el('div', {}, actRow);
    el('div', { style: { fontSize: `${(LAND ? 26 : 30) * sc}px`, fontWeight: '700' } }, actTitle, '多渠道发布流水线');
    el('div', { style: { fontSize: `${(LAND ? 15 : 19) * sc}px`, color: '#94a3b8', marginTop: `${4 * sc}px` } }, actTitle, '自动校验字幕、压缩码率并同步分发 4 个平台');

    const ctaBtn = el('div', {
      style: {
        position: 'relative',
        padding: `${(LAND ? 14 : 18) * sc}px ${(LAND ? 26 : 30) * sc}px`,
        borderRadius: `${14 * sc}px`,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        fontWeight: '700',
        fontSize: `${(LAND ? 17 : 22) * sc}px`,
        color: '#ffffff',
        boxShadow: '0 10px 28px rgba(99,102,241,0.45)',
      },
    }, actRow, '⚡ 一键优化并发布');

    // Click ripple ring inside CTA
    const ripple = el('div', {
      style: {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: `${24 * sc}px`,
        height: `${24 * sc}px`,
        marginLeft: `${-12 * sc}px`,
        marginTop: `${-12 * sc}px`,
        borderRadius: '50%',
        border: `2.5px solid #ffffff`,
        opacity: '0',
        pointerEvents: 'none',
      },
    }, ctaBtn);

    // Metric cards (will live-update after click!)
    const cards = el('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: LAND ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
        gap: `${18 * sc}px`,
      },
    }, main);

    const metricEls = [];
    const metricsDef = [
      { title: '平均出片耗时', before: '14.8s', after: '1.2s', badge: '-91%' },
      { title: '渲染成功率', before: '94.2%', after: '99.9%', badge: '+5.7%' },
      { title: '并发任务吞吐', before: '12 / min', after: '160 / min', badge: '13.3x' },
    ];
    metricsDef.forEach((m, i) => {
      if (!LAND && i === 2) return;
      const c = el('div', {
        style: {
          padding: `${22 * sc}px`,
          borderRadius: `${16 * sc}px`,
          background: 'rgba(30,41,59,0.85)',
          border: '1px solid rgba(148,163,184,0.16)',
        },
      }, cards);
      el('div', { style: { fontSize: `${15 * sc}px`, color: '#94a3b8' } }, c, m.title);
      const valEl = el('div', {
        style: {
          fontSize: `${(LAND ? 34 : 40) * sc}px`,
          fontWeight: '700',
          fontFamily: '"JetBrains Mono", monospace',
          marginTop: `${10 * sc}px`,
          color: '#f8fafc',
        },
      }, c, m.before);
      const bEl = el('div', {
        style: {
          display: 'inline-block',
          marginTop: `${10 * sc}px`,
          padding: `${4 * sc}px ${10 * sc}px`,
          borderRadius: '999px',
          background: 'rgba(52,211,153,0.16)',
          color: '#34d399',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: `${13 * sc}px`,
          opacity: '0',
        },
      }, c, m.badge);
      metricEls.push({ c, valEl, bEl, def: m });
    });

    // Pipeline progress box
    const pipeBox = el('div', {
      style: {
        flex: '1',
        borderRadius: `${18 * sc}px`,
        background: 'rgba(15,23,42,0.75)',
        border: '1px solid rgba(148,163,184,0.15)',
        padding: `${24 * sc}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      },
    }, main);
    el('div', { style: { fontSize: `${16 * sc}px`, fontWeight: '700', color: '#cbd5e1' } }, pipeBox, '部署流水线进度');
    const stepBars = [];
    for (const stepName of ['1. 静态资产打包与字体内联', '2. 多画幅并行渲染 (16:9 + 9:16)', '3. 边缘节点分发与健康校验']) {
      const row = el('div', { style: { display: 'flex', flexDirection: 'column', gap: `${8 * sc}px` } }, pipeBox);
      const labelRow = el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: `${15 * sc}px`, color: '#94a3b8' } }, row);
      el('span', {}, labelRow, stepName);
      const pctEl = el('span', { style: { fontFamily: '"JetBrains Mono", monospace', color: '#818cf8' } }, labelRow, '0%');
      const track = el('div', { style: { height: `${10 * sc}px`, borderRadius: '999px', background: 'rgba(51,65,85,0.8)', overflow: 'hidden' } }, row);
      const fill = el('div', { style: { width: '0%', height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #6366f1, #34d399)' } }, track);
      stepBars.push({ pctEl, fill });
    }

    // Mock SVG Cursor
    const cursor = el('div', {
      style: {
        position: 'absolute',
        left: '0px',
        top: '0px',
        width: `${34 * sc}px`,
        height: `${34 * sc}px`,
        zIndex: '40',
        pointerEvents: 'none',
        filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.55))',
      },
    }, cam);
    cursor.innerHTML = `<svg viewBox="0 0 28 28" width="100%" height="100%"><path d="M4 2 L24 13 L15 16 L12 25 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/></svg>`;

    // Success Toast Notification
    const toast = el('div', {
      style: {
        position: 'absolute',
        right: `${(LAND ? 88 : 56) * sc}px`,
        bottom: `${(LAND ? 60 : 120) * sc}px`,
        padding: `${18 * sc}px ${26 * sc}px`,
        borderRadius: `${16 * sc}px`,
        background: 'rgba(6,78,59,0.95)',
        border: '1.5px solid #34d399',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: `${14 * sc}px`,
        zIndex: '50',
      },
    });
    el('div', {
      style: {
        width: `${30 * sc}px`,
        height: `${30 * sc}px`,
        borderRadius: '50%',
        background: '#10b981',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        color: '#022c22',
      },
    }, toast, '✓');
    const tTxt = el('div', {}, toast);
    el('div', { style: { fontSize: `${18 * sc}px`, fontWeight: '700', color: '#ecfdf5' } }, tTxt, '发布成功 · Deployed in 1.2s');
    el('div', { style: { fontSize: `${13 * sc}px`, color: '#a7f3d0', fontFamily: '"JetBrains Mono", monospace' } }, tTxt, '4 regions synced · v2.4.0');

    const anims = [];
    const addAnim = (target, kf, opts) => {
      const a = animate(target, kf, opts);
      a.pause();
      a.time = 0;
      anims.push(a);
      return a;
    };
    const sp = { type: spring, stiffness: 260, damping: 24 };

    // Entrance
    addAnim(win, { opacity: [0, 1], y: [40 * sc, 0], scale: [0.95, 1] }, { ...sp, delay: 0.05 });

    // Cursor glides to CTA button
    const btnX = LAND ? 1320 * sc : 760 * sc;
    const btnY = LAND ? 295 * sc : 420 * sc;
    addAnim(cursor, {
      x: [W * 0.25, btnX],
      y: [H * 0.72, btnY],
    }, { duration: 1.05, delay: 0.4, easing: 'ease-in-out' });

    // Click press on CTA
    addAnim(ctaBtn, { scale: [1, 0.92, 1.04, 1] }, { duration: 0.35, delay: 1.48 });
    addAnim(ripple, { scale: [0.4, 5.5], opacity: [0.9, 0] }, { duration: 0.55, delay: 1.5 });

    // Camera smooth zoom-in focus after click, then pull back slightly
    addAnim(cam, { scale: [1, 1.18, 1.06] }, { duration: 2.4, delay: 1.35, easing: 'ease-in-out' });

    // Toast enters
    addAnim(toast, { opacity: [0, 1], y: [36 * sc, 0], scale: [0.9, 1] }, { ...sp, delay: 3.15 });

    return { anims, ctaBtn, metricEls, stepBars };
  },

  draw(ctx, t, st) {
    for (const a of st.anims) a.time = t;
    const clicked = t >= 1.55;
    st.ctaBtn.textContent = clicked ? (t >= 3.15 ? '✓ 已发布 v2.4' : '⏳ 正在部署...') : '⚡ 一键优化并发布';
    st.ctaBtn.style.background = t >= 3.15
      ? 'linear-gradient(135deg, #059669, #10b981)'
      : 'linear-gradient(135deg, #6366f1, #8b5cf6)';

    // Progress bars
    st.stepBars.forEach((b, i) => {
      const start = 1.65 + i * 0.42;
      const p = clamp((t - start) / 0.55, 0, 1);
      const pct = Math.round(p * 100);
      b.fill.style.width = `${pct}%`;
      b.pctEl.textContent = `${pct}%`;
      b.pctEl.style.color = pct === 100 ? '#34d399' : '#818cf8';
    });

    // Live metric switch
    st.metricEls.forEach((m, i) => {
      const switched = t >= 2.25 + i * 0.22;
      m.valEl.textContent = switched ? m.def.after : m.def.before;
      m.valEl.style.color = switched ? '#34d399' : '#f8fafc';
      m.bEl.style.opacity = switched ? '1' : '0';
      m.c.style.borderColor = switched ? 'rgba(52,211,153,0.45)' : 'rgba(148,163,184,0.16)';
    });
  },
});
