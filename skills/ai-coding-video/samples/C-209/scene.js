// C-209 系统架构与工作流脉冲图：SVG 拓扑连线 + GSAP 节点时序点亮 + 数据包脉冲流动 + 异常熔断降级演练

scene({
  id: 'C-209',
  name: '系统架构与工作流脉冲图',
  dur: 4.5,
  still: 3.1,
  dom: true,
  libs: ['gsap'],
  fonts: ['Noto Sans SC', 'JetBrains Mono'],

  init() {
    const sc = SHORT / 1080;

    STAGE.innerHTML = '';
    STAGE.style.background = 'radial-gradient(circle at 50% 35%, #111c33 0%, #070b14 68%, #04070d 100%)';
    STAGE.style.fontFamily = '"Noto Sans SC", sans-serif';
    STAGE.style.color = '#f8fafc';
    STAGE.style.overflow = 'hidden';

    // Blueprint grid + ambient moving glow
    const bgGlow = el('div', {
      style: {
        position: 'absolute',
        width: `${580 * sc}px`,
        height: `${580 * sc}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(16,185,129,0.09) 45%, rgba(0,0,0,0) 70%)',
        filter: `blur(${40 * sc}px)`,
        pointerEvents: 'none',
      },
    });
    el('div', {
      style: {
        position: 'absolute',
        inset: '0',
        backgroundImage: 'linear-gradient(rgba(56,189,248,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.06) 1px, transparent 1px)',
        backgroundSize: `${48 * sc}px ${48 * sc}px`,
      },
    });

    // Header
    const hdr = el('div', {
      style: {
        position: 'absolute',
        left: `${(LAND ? 76 : 56) * sc}px`,
        top: `${(LAND ? 46 : 74) * sc}px`,
        right: `${(LAND ? 76 : 56) * sc}px`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
    });
    const hLeft = el('div', {}, hdr);
    el('div', {
      style: { fontFamily: '"JetBrains Mono", monospace', fontSize: `${15 * sc}px`, color: '#38bdf8', letterSpacing: '0.08em' },
    }, hLeft, 'AGENT ARCHITECTURE · FAILOVER TRACE');
    el('div', {
      style: { fontSize: `${(LAND ? 36 : 38) * sc}px`, fontWeight: '700', marginTop: `${4 * sc}px` },
    }, hLeft, 'AI Agent 请求链路与熔断降级');
    const statusPill = el('div', {
      style: {
        padding: `${9 * sc}px ${18 * sc}px`,
        borderRadius: '999px',
        background: 'rgba(56,189,248,0.14)',
        border: '1px solid rgba(56,189,248,0.45)',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: `${14 * sc}px`,
        color: '#7dd3fc',
      },
    }, hdr, 'REQ #8492 · TRACING');

    // Node definitions (normalized coordinates in SVG viewBox)
    const VW = LAND ? 1600 : 960;
    const VH = LAND ? 700 : 1260;

    const nodes = LAND ? [
      { id: 'client', title: '用户请求', sub: 'API Gateway', lat: '12ms', x: 160, y: 340, tOn: 0.25 },
      { id: 'router', title: 'LLM 路由', sub: 'Intent Planner', lat: '84ms', x: 520, y: 340, tOn: 0.85 },
      { id: 'rag', title: '向量检索', sub: 'Primary DB', lat: 'TIMEOUT', x: 960, y: 165, tOn: 1.55, failAt: 2.05 },
      { id: 'cache', title: '降级缓存', sub: 'Redis Fallback', lat: '9ms', x: 960, y: 515, tOn: 2.35, fallback: true },
      { id: 'resp', title: '流式聚合输出', sub: 'SSE Stream', lat: '142ms', x: 1400, y: 340, tOn: 3.15 },
    ] : [
      { id: 'client', title: '用户请求', sub: 'API Gateway', lat: '12ms', x: 480, y: 120, tOn: 0.25 },
      { id: 'router', title: 'LLM 路由', sub: 'Intent Planner', lat: '84ms', x: 480, y: 380, tOn: 0.85 },
      { id: 'rag', title: '向量检索', sub: 'Primary DB', lat: 'TIMEOUT', x: 240, y: 700, tOn: 1.55, failAt: 2.05 },
      { id: 'cache', title: '降级缓存', sub: 'Redis Fallback', lat: '9ms', x: 720, y: 700, tOn: 2.35, fallback: true },
      { id: 'resp', title: '流式聚合输出', sub: 'SSE Stream', lat: '142ms', x: 480, y: 1040, tOn: 3.15 },
    ];
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));

    const edges = [
      { from: 'client', to: 'router', t0: 0.45, dur: 0.45, color: '#38bdf8' },
      { from: 'router', to: 'rag', t0: 1.15, dur: 0.45, color: '#f59e0b', failAt: 2.05 },
      { from: 'router', to: 'cache', t0: 2.08, dur: 0.42, color: '#34d399' },
      { from: 'cache', to: 'resp', t0: 2.75, dur: 0.48, color: '#34d399' },
    ];

    const svgWrap = el('div', {
      style: {
        position: 'absolute',
        left: `${(LAND ? 160 : 60) * sc}px`,
        top: `${(LAND ? 175 : 265) * sc}px`,
        width: `${(LAND ? 1600 : 960) * sc}px`,
        height: `${(LAND ? 700 : 1260) * sc}px`,
      },
    });

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.style.width = '100%';
    svg.style.height = '100%';
    svgWrap.appendChild(svg);

    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = `<filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    svg.appendChild(defs);

    const mkPathD = (a, b) => {
      if (LAND) {
        const mx = (a.x + b.x) / 2;
        return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
      }
      const my = (a.y + b.y) / 2;
      return `M ${a.x} ${a.y} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
    };

    const edgeEls = edges.map(e => {
      const a = byId[e.from];
      const b = byId[e.to];
      const d = mkPathD(a, b);
      const base = document.createElementNS(NS, 'path');
      base.setAttribute('d', d);
      base.setAttribute('fill', 'none');
      base.setAttribute('stroke', 'rgba(148,163,184,0.22)');
      base.setAttribute('stroke-width', '3.5');
      base.setAttribute('stroke-dasharray', '8 8');
      svg.appendChild(base);

      const active = document.createElementNS(NS, 'path');
      active.setAttribute('d', d);
      active.setAttribute('fill', 'none');
      active.setAttribute('stroke', e.color);
      active.setAttribute('stroke-width', '4.5');
      active.setAttribute('stroke-linecap', 'round');
      active.setAttribute('filter', 'url(#glow)');
      svg.appendChild(active);
      const len = active.getTotalLength();
      active.setAttribute('stroke-dasharray', `${len}`);
      active.setAttribute('stroke-dashoffset', `${len}`);

      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('r', '9');
      dot.setAttribute('fill', '#ffffff');
      dot.setAttribute('stroke', e.color);
      dot.setAttribute('stroke-width', '4');
      dot.setAttribute('filter', 'url(#glow)');
      dot.setAttribute('opacity', '0');
      svg.appendChild(dot);

      return { e, base, active, len, dot };
    });

    // Render HTML node cards aligned to SVG coordinates
    const nodeW = LAND ? 240 : 320;
    const nodeH = LAND ? 128 : 156;
    const nodeEls = nodes.map(n => {
      const card = el('div', {
        style: {
          position: 'absolute',
          left: `${(n.x - nodeW / 2) / VW * 100}%`,
          top: `${(n.y - nodeH / 2) / VH * 100}%`,
          width: `${nodeW / VW * 100}%`,
          height: `${nodeH / VH * 100}%`,
          borderRadius: `${18 * sc}px`,
          background: 'rgba(15,23,42,0.92)',
          border: `2px solid rgba(148,163,184,0.25)`,
          boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
          padding: `${(LAND ? 16 : 20) * sc}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        },
      }, svgWrap);
      const topRow = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, card);
      const dot = el('div', { style: { width: `${11 * sc}px`, height: `${11 * sc}px`, borderRadius: '50%', background: '#475569' } }, topRow);
      const badge = el('div', {
        style: {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: `${(LAND ? 13 : 17) * sc}px`,
          color: '#64748b',
        },
      }, topRow, 'IDLE');
      el('div', { style: { fontSize: `${(LAND ? 21 : 26) * sc}px`, fontWeight: '700', color: '#f8fafc' } }, card, n.title);
      el('div', { style: { fontSize: `${(LAND ? 13 : 18) * sc}px`, fontFamily: '"JetBrains Mono", monospace', color: '#94a3b8' } }, card, n.sub);
      return { n, card, dot, badge };
    });

    // Bottom live log bar
    const logBar = el('div', {
      style: {
        position: 'absolute',
        left: `${(LAND ? 76 : 56) * sc}px`,
        right: `${(LAND ? 76 : 56) * sc}px`,
        bottom: `${(LAND ? 42 : 76) * sc}px`,
        padding: `${16 * sc}px ${24 * sc}px`,
        borderRadius: `${14 * sc}px`,
        background: 'rgba(15,23,42,0.92)',
        border: '1px solid rgba(148,163,184,0.2)',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: `${(LAND ? 16 : 20) * sc}px`,
        color: '#94a3b8',
        display: 'flex',
        justifyContent: 'space-between',
      },
    });
    const logMsg = el('span', {}, logBar, '[00.00s] Awaiting incoming request...');
    const logLatency = el('span', { style: { color: '#38bdf8' } }, logBar, 'TOTAL: 0ms');

    // GSAP entrance timeline
    const tl = window.gsap.timeline({ paused: true });
    tl.from(nodeEls.map(x => x.card), {
      opacity: 0,
      scale: 0.88,
      duration: 0.45,
      stagger: 0.07,
      ease: 'back.out(1.4)',
    }, 0);

    return { tl, bgGlow, edgeEls, nodeEls, statusPill, logMsg, logLatency };
  },

  draw(ctx, t, st) {
    st.tl.time(t);
    const gx = W * (0.15 + 0.55 * (t / 4.5));
    const gy = H * (0.22 + 0.25 * Math.sin(t * 1.4));
    st.bgGlow.style.transform = `translate(${gx.toFixed(1)}px, ${gy.toFixed(1)}px)`;

    // Animate edges and continuous moving data packets
    for (const item of st.edgeEls) {
      const { e, base, active, len, dot } = item;
      base.setAttribute('stroke-dashoffset', `${(-t * 48).toFixed(1)}`);
      const p = clamp((t - e.t0) / e.dur, 0, 1);
      active.setAttribute('stroke-dashoffset', `${len * (1 - p)}`);
      if (e.failAt && t >= e.failAt) {
        active.setAttribute('stroke', '#ef4444');
        dot.setAttribute('opacity', '0');
      } else {
        active.setAttribute('stroke', e.color);
        if (p > 0) {
          const travel = p < 1 ? p : ((t - e.t0) % 1.1) / 1.1;
          const pt = active.getPointAtLength(travel * len);
          dot.setAttribute('cx', pt.x.toFixed(1));
          dot.setAttribute('cy', pt.y.toFixed(1));
          dot.setAttribute('opacity', '1');
        } else {
          dot.setAttribute('opacity', '0');
        }
      }
    }

    // Update node states
    for (const { n, card, dot, badge } of st.nodeEls) {
      if (n.failAt && t >= n.failAt) {
        card.style.borderColor = '#ef4444';
        card.style.boxShadow = '0 0 36px rgba(239,68,68,0.38)';
        dot.style.background = '#ef4444';
        badge.textContent = 'ERR · TIMEOUT';
        badge.style.color = '#f87171';
      } else if (t >= n.tOn) {
        const col = n.fallback || n.id === 'resp' ? '#34d399' : '#38bdf8';
        card.style.borderColor = col;
        card.style.boxShadow = `0 0 34px ${col}38`;
        dot.style.background = col;
        badge.textContent = `OK · ${n.lat}`;
        badge.style.color = col;
      } else {
        card.style.borderColor = 'rgba(148,163,184,0.25)';
        card.style.boxShadow = '0 16px 40px rgba(0,0,0,0.45)';
        dot.style.background = '#475569';
        badge.textContent = 'IDLE';
        badge.style.color = '#64748b';
      }
    }

    // Live status pill + log bar
    if (t < 0.85) {
      st.logMsg.textContent = '[INFO] POST /v1/agent/run -> Gateway authenticated (12ms)';
      st.logLatency.textContent = 'TOTAL: 12ms';
    } else if (t < 1.55) {
      st.logMsg.textContent = '[INFO] LLM Router selected tool: vector_search(top_k=8)';
      st.logLatency.textContent = 'TOTAL: 96ms';
    } else if (t < 2.05) {
      st.logMsg.textContent = '[WAIT] Querying Primary Vector DB cluster...';
      st.logLatency.textContent = 'TOTAL: 180ms';
    } else if (t < 2.75) {
      st.statusPill.textContent = 'CIRCUIT OPEN · FAILOVER';
      st.statusPill.style.borderColor = '#f59e0b';
      st.statusPill.style.color = '#fbbf24';
      st.logMsg.textContent = '[WARN] Primary DB timeout -> auto-reroute to Redis Fallback (9ms)';
      st.logMsg.style.color = '#fbbf24';
      st.logLatency.textContent = 'TOTAL: 198ms';
    } else if (t < 3.15) {
      st.logMsg.textContent = '[INFO] Fallback hit 100% -> assembling SSE response stream';
      st.logMsg.style.color = '#34d399';
      st.logLatency.textContent = 'TOTAL: 230ms';
    } else {
      st.statusPill.textContent = '200 OK · RECOVERED';
      st.statusPill.style.borderColor = '#34d399';
      st.statusPill.style.color = '#34d399';
      st.logMsg.textContent = '[DONE] Stream completed · Zero user-visible error (142ms)';
      st.logMsg.style.color = '#34d399';
      st.logLatency.textContent = 'TOTAL: 247ms';
    }
  },
});
