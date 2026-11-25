// C-207 聊天气泡与 AI 对话剧场：HTML/CSS 拟真聊天窗口 + Motion 弹簧消息弹出 + 正在思考脉冲与工具卡片展开

scene({
  id: 'C-207',
  name: '聊天气泡与 AI 对话剧场',
  dur: 4.5,
  still: 3.6,
  dom: true,
  libs: ['motion'],
  fonts: ['Noto Sans SC', 'JetBrains Mono'],

  init() {
    const sc = SHORT / 1080;
    const { animate, spring } = window.Motion;

    STAGE.innerHTML = '';
    STAGE.style.background = 'radial-gradient(circle at 20% 15%, #18253a 0%, #0b1120 55%, #060911 100%)';
    STAGE.style.fontFamily = '"Noto Sans SC", sans-serif';
    STAGE.style.color = '#f8fafc';
    STAGE.style.overflow = 'hidden';

    // Ambient glow
    const orb = el('div', {
      style: {
        position: 'absolute',
        width: `${560 * sc}px`,
        height: `${560 * sc}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(16,185,129,0.12) 45%, rgba(0,0,0,0) 70%)',
        filter: `blur(${42 * sc}px)`,
        pointerEvents: 'none',
      },
    });

    // Subtle dot grid
    el('div', {
      style: {
        position: 'absolute',
        inset: '0',
        backgroundImage: 'radial-gradient(rgba(148,163,184,0.14) 1px, transparent 1px)',
        backgroundSize: `${32 * sc}px ${32 * sc}px`,
      },
    });

    const anims = [];
    const addAnim = (target, kf, opts) => {
      const a = animate(target, kf, opts);
      a.pause();
      a.time = 0;
      anims.push(a);
      return a;
    };

    const sp = { type: spring, stiffness: 300, damping: 24 };

    // Left editorial context panel in landscape mode
    if (LAND) {
      const left = el('div', {
        style: {
          position: 'absolute',
          left: `${88 * sc}px`,
          top: `${160 * sc}px`,
          width: `${600 * sc}px`,
        },
      });
      el('div', {
        style: {
          display: 'inline-block',
          padding: `${8 * sc}px ${16 * sc}px`,
          borderRadius: '999px',
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(52,211,153,0.45)',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: `${15 * sc}px`,
          color: '#6ee7b7',
          letterSpacing: '0.06em',
        },
      }, left, 'AI AGENT · LIVE CHAT STORY');

      el('div', {
        style: {
          fontSize: `${58 * sc}px`,
          fontWeight: '700',
          lineHeight: '1.16',
          marginTop: `${26 * sc}px`,
          letterSpacing: '-0.02em',
        },
      }, left, '一句话查完\n季度增长异动');

      el('div', {
        style: {
          fontSize: `${22 * sc}px`,
          color: '#94a3b8',
          lineHeight: '1.6',
          marginTop: `${22 * sc}px`,
          maxWidth: `${500 * sc}px`,
        },
      }, left, '聊天气泡弹入、工具调用状态、结构化卡片回复——适合产品演示、客服剧场与短视频科普。');

      const stats = el('div', {
        style: {
          display: 'flex',
          gap: `${20 * sc}px`,
          marginTop: `${44 * sc}px`,
        },
      }, left);
      for (const [k, v] of [['响应延迟', '0.8s'], ['调用工具', 'SQL + Chart'], ['适配格式', '16:9 / 9:16']]) {
        const box = el('div', {
          style: {
            padding: `${16 * sc}px ${20 * sc}px`,
            borderRadius: `${14 * sc}px`,
            background: 'rgba(15,23,42,0.72)',
            border: '1px solid rgba(148,163,184,0.18)',
          },
        }, stats);
        el('div', { style: { fontSize: `${14 * sc}px`, color: '#94a3b8' } }, box, k);
        el('div', { style: { fontSize: `${22 * sc}px`, fontWeight: '700', color: '#38bdf8', fontFamily: '"JetBrains Mono", monospace', marginTop: `${6 * sc}px` } }, box, v);
      }
      addAnim(left, { opacity: [0, 1], y: [24 * sc, 0] }, { ...sp, delay: 0.05 });
    }

    // Phone shell
    const phoneW = (LAND ? 520 : 920) * sc;
    const phoneH = (LAND ? 920 : 1660) * sc;
    const phone = el('div', {
      style: {
        position: 'absolute',
        left: LAND ? `${1080 * sc}px` : `${(W - phoneW) / 2}px`,
        top: `${(H - phoneH) / 2}px`,
        width: `${phoneW}px`,
        height: `${phoneH}px`,
        borderRadius: `${(LAND ? 42 : 48) * sc}px`,
        background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
        border: `${2 * sc}px solid rgba(148,163,184,0.28)`,
        boxShadow: `0 ${36 * sc}px ${90 * sc}px rgba(0,0,0,0.6)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      },
    });
    addAnim(phone, { opacity: [0, 1], y: [36 * sc, 0], scale: [0.96, 1] }, { ...sp, delay: 0.08 });

    // Top bar
    const topBar = el('div', {
      style: {
        padding: `${(LAND ? 22 : 34) * sc}px ${(LAND ? 26 : 36) * sc}px ${(LAND ? 18 : 26) * sc}px`,
        background: 'rgba(15,23,42,0.92)',
        borderBottom: '1px solid rgba(148,163,184,0.16)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
    }, phone);

    const peer = el('div', { style: { display: 'flex', alignItems: 'center', gap: `${14 * sc}px` } }, topBar);
    el('div', {
      style: {
        width: `${(LAND ? 44 : 62) * sc}px`,
        height: `${(LAND ? 44 : 62) * sc}px`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #38bdf8, #10b981)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: `${(LAND ? 18 : 26) * sc}px`,
        color: '#06111c',
      },
    }, peer, 'AI');
    const peerInfo = el('div', {}, peer);
    el('div', { style: { fontSize: `${(LAND ? 20 : 30) * sc}px`, fontWeight: '700' } }, peerInfo, '增长分析助手');
    const statusLine = el('div', {
      style: { fontSize: `${(LAND ? 13 : 20) * sc}px`, color: '#34d399', marginTop: `${2 * sc}px` },
    }, peerInfo, '● 在线 · 已连接数据仓');
    el('div', {
      style: { fontFamily: '"JetBrains Mono", monospace', fontSize: `${(LAND ? 14 : 22) * sc}px`, color: '#64748b' },
    }, topBar, '14:26');

    // Chat body
    const body = el('div', {
      style: {
        flex: '1',
        padding: `${(LAND ? 24 : 38) * sc}px ${(LAND ? 22 : 34) * sc}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${(LAND ? 18 : 28) * sc}px`,
      },
    }, phone);

    const fMsg = (LAND ? 18 : 28) * sc;
    const padMsg = `${(LAND ? 14 : 22) * sc}px ${(LAND ? 18 : 28) * sc}px`;

    // Msg 1: User (right)
    const m1 = el('div', {
      style: {
        alignSelf: 'flex-end',
        maxWidth: '82%',
        background: 'linear-gradient(135deg, #0284c7, #2563eb)',
        color: '#ffffff',
        padding: padMsg,
        borderRadius: `${20 * sc}px ${20 * sc}px ${4 * sc}px ${20 * sc}px`,
        fontSize: `${fMsg}px`,
        lineHeight: '1.5',
        boxShadow: '0 8px 24px rgba(37,99,235,0.28)',
      },
    }, body, '帮我查一下本周华东区复购率为什么突然涨了 18%？');
    addAnim(m1, { opacity: [0, 1], y: [26 * sc, 0], scale: [0.92, 1] }, { ...sp, delay: 0.35 });

    // Msg 2: Thinking / Tool call pill (left)
    const m2 = el('div', {
      style: {
        alignSelf: 'flex-start',
        display: 'flex',
        alignItems: 'center',
        gap: `${12 * sc}px`,
        background: 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(56,189,248,0.35)',
        padding: `${(LAND ? 10 : 16) * sc}px ${(LAND ? 16 : 24) * sc}px`,
        borderRadius: `${16 * sc}px`,
        fontSize: `${(LAND ? 14 : 22) * sc}px`,
        fontFamily: '"JetBrains Mono", monospace',
        color: '#7dd3fc',
      },
    }, body);
    const spinDot = el('div', {
      style: {
        width: `${(LAND ? 10 : 15) * sc}px`,
        height: `${(LAND ? 10 : 15) * sc}px`,
        borderRadius: '50%',
        background: '#38bdf8',
      },
    }, m2);
    const toolText = el('span', {}, m2, 'query_orders(region="华东", days=7)...');
    addAnim(m2, { opacity: [0, 1], y: [18 * sc, 0] }, { ...sp, delay: 1.05 });

    // Msg 3: AI Structured Card (left)
    const m3 = el('div', {
      style: {
        alignSelf: 'flex-start',
        width: '90%',
        background: 'rgba(30,41,59,0.94)',
        border: '1px solid rgba(148,163,184,0.22)',
        borderRadius: `${20 * sc}px ${20 * sc}px ${20 * sc}px ${4 * sc}px`,
        padding: `${(LAND ? 18 : 28) * sc}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${(LAND ? 12 : 18) * sc}px`,
      },
    }, body);
    el('div', {
      style: { fontSize: `${fMsg}px`, lineHeight: '1.5', color: '#e2e8f0' },
    }, m3, '定位到核心拉动项：周三上线的「老客满减券」核销率达 64%，带动客单价同步提升。');

    const cardGrid = el('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: `${(LAND ? 10 : 16) * sc}px`,
      },
    }, m3);
    for (const [label, val, col] of [['复购率', '42.6%', '#34d399'], ['券核销贡献', '+14.8%', '#38bdf8']]) {
      const cell = el('div', {
        style: {
          background: 'rgba(15,23,42,0.75)',
          borderRadius: `${12 * sc}px`,
          padding: `${(LAND ? 12 : 18) * sc}px`,
          border: '1px solid rgba(148,163,184,0.14)',
        },
      }, cardGrid);
      el('div', { style: { fontSize: `${(LAND ? 13 : 20) * sc}px`, color: '#94a3b8' } }, cell, label);
      el('div', { style: { fontSize: `${(LAND ? 24 : 36) * sc}px`, fontWeight: '700', color: col, fontFamily: '"JetBrains Mono", monospace', marginTop: `${4 * sc}px` } }, cell, val);
    }
    addAnim(m3, { opacity: [0, 1], y: [30 * sc, 0], scale: [0.94, 1] }, { ...sp, delay: 1.85 });

    // Msg 4: User follow-up (right)
    const m4 = el('div', {
      style: {
        alignSelf: 'flex-end',
        maxWidth: '80%',
        background: 'linear-gradient(135deg, #0284c7, #2563eb)',
        color: '#ffffff',
        padding: padMsg,
        borderRadius: `${20 * sc}px ${20 * sc}px ${4 * sc}px ${20 * sc}px`,
        fontSize: `${fMsg}px`,
        lineHeight: '1.5',
      },
    }, body, '把华南区也按同策略生成一份推送方案吧');
    addAnim(m4, { opacity: [0, 1], y: [24 * sc, 0], scale: [0.92, 1] }, { ...sp, delay: 2.75 });

    // Msg 5: AI confirmation badge (left)
    const m5 = el('div', {
      style: {
        alignSelf: 'flex-start',
        maxWidth: '88%',
        background: 'rgba(16,185,129,0.16)',
        border: '1px solid rgba(52,211,153,0.45)',
        color: '#d1fae5',
        padding: padMsg,
        borderRadius: `${20 * sc}px ${20 * sc}px ${20 * sc}px ${4 * sc}px`,
        fontSize: `${fMsg}px`,
        lineHeight: '1.5',
      },
    }, body, '✓ 已生成华南区 3.2 万老客分层名单，预计带来增量 GMV ¥86 万。');
    addAnim(m5, { opacity: [0, 1], y: [24 * sc, 0], scale: [0.92, 1] }, { ...sp, delay: 3.35 });

    // Bottom input bar
    const inputBar = el('div', {
      style: {
        padding: `${(LAND ? 16 : 24) * sc}px ${(LAND ? 20 : 30) * sc}px`,
        background: 'rgba(15,23,42,0.96)',
        borderTop: '1px solid rgba(148,163,184,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: `${12 * sc}px`,
      },
    }, phone);
    const inputBox = el('div', {
      style: {
        flex: '1',
        height: `${(LAND ? 42 : 64) * sc}px`,
        borderRadius: '999px',
        background: 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(148,163,184,0.2)',
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${(LAND ? 18 : 26) * sc}px`,
        fontSize: `${(LAND ? 15 : 23) * sc}px`,
        color: '#94a3b8',
      },
    }, inputBar, '输入问题或 @调用数据工具...');
    el('div', {
      style: {
        width: `${(LAND ? 42 : 64) * sc}px`,
        height: `${(LAND ? 42 : 64) * sc}px`,
        borderRadius: '50%',
        background: '#0284c7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${(LAND ? 18 : 28) * sc}px`,
        fontWeight: '700',
      },
    }, inputBar, '↑');

    addAnim(orb, {
      x: [W * 0.05, W * 0.45, W * 0.18],
      y: [H * 0.1, H * 0.32, H * 0.55],
    }, { duration: 4.5, easing: 'ease-in-out' });

    return { anims, spinDot, toolText, statusLine, inputBox };
  },

  draw(ctx, t, st) {
    for (const a of st.anims) a.time = t;
    const pulse = 0.55 + 0.45 * Math.sin(t * 10);
    if (t < 1.85) {
      st.spinDot.style.opacity = pulse.toFixed(2);
      st.spinDot.style.background = '#38bdf8';
      st.toolText.textContent = 'query_orders(region="华东", days=7)...';
      st.statusLine.textContent = t > 1.0 ? '● 正在检索订单库...' : '● 在线 · 已连接数据仓';
    } else {
      st.spinDot.style.opacity = '1';
      st.spinDot.style.background = '#34d399';
      st.toolText.textContent = '✓ query_orders · 0.62s (18,420 rows)';
      st.statusLine.textContent = t > 2.75 && t < 3.35 ? '● 正在生成推送方案...' : '● 在线 · 已连接数据仓';
    }
    const typed = '确认立即推送并开启 A/B 监测';
    if (t > 3.75) {
      const k = Math.min(typed.length, Math.floor((t - 3.75) * 24));
      st.inputBox.textContent = typed.slice(0, k) + (Math.floor(t * 6) % 2 === 0 ? '|' : '');
      st.inputBox.style.color = '#f8fafc';
    } else {
      st.inputBox.textContent = '输入问题或 @调用数据工具...';
      st.inputBox.style.color = '#94a3b8';
    }
  },
});
