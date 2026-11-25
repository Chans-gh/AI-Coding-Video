// T-024 文献与财报 3D 荧光笔扫读：CSS 3D 透视景深纸面 + 真实 NASA 工程手册扫描页 + 亮黄荧光笔实时划重点 + 浮起中文批注卡（Vox 调查风）

scene({
  id: 'T-024',
  name: '文献与财报 3D 荧光笔扫读',
  dur: 8.5,
  still: 5.8,
  dom: true,
  libs: ['motion'],
  fonts: ['Noto Sans SC', 'JetBrains Mono'],

  init() {
    const sc = SHORT / 1080;

    STAGE.innerHTML = '';
    STAGE.style.background = 'radial-gradient(circle at 50% 42%, #24211d 0%, #12100e 65%, #090807 100%)';
    STAGE.style.fontFamily = '"Noto Sans SC", sans-serif';
    STAGE.style.color = '#f8fafc';
    STAGE.style.overflow = 'hidden';

    // 3D Camera Container
    const viewport = el('div', {
      style: {
        position: 'absolute',
        inset: '0',
        perspective: `${1400 * sc}px`,
        perspectiveOrigin: '50% 46%',
        overflow: 'hidden',
      },
    });

    // Tilted 3D Paper Desk
    const desk = el('div', {
      style: {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: `${1080 * sc}px`,
        height: `${1400 * sc}px`,
        marginLeft: `${-540 * sc}px`,
        marginTop: `${-700 * sc}px`,
        transformStyle: 'preserve-3d',
      },
    }, viewport);

    // Background secondary sheet (p19.jpg) slightly offset for editorial depth
    const sheetBack = el('div', {
      style: {
        position: 'absolute',
        left: `${180 * sc}px`,
        top: `${-110 * sc}px`,
        width: `${980 * sc}px`,
        height: `${1270 * sc}px`,
        backgroundImage: 'url("./T-024/assets/p19.jpg")',
        backgroundSize: 'cover',
        borderRadius: `${6 * sc}px`,
        boxShadow: `0 ${36 * sc}px ${90 * sc}px rgba(0,0,0,0.65)`,
        filter: 'brightness(0.76) contrast(1.04)',
        transform: `translateZ(${-50 * sc}px) rotateZ(7deg)`,
      },
    }, desk);

    // Primary sheet (p16.jpg) with highlighter overlays
    const sheetMain = el('div', {
      style: {
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundImage: 'url("./T-024/assets/p16.jpg")',
        backgroundSize: '100% 100%',
        borderRadius: `${6 * sc}px`,
        boxShadow: `0 ${44 * sc}px ${110 * sc}px rgba(0,0,0,0.72)`,
        overflow: 'hidden',
      },
    }, desk);

    // Warm paper texture tint
    el('div', {
      style: {
        position: 'absolute',
        inset: '0',
        background: 'linear-gradient(135deg, rgba(255,248,225,0.10) 0%, rgba(180,140,80,0.06) 100%)',
        pointerEvents: 'none',
      },
    }, sheetMain);

    // Real-time highlighter strokes aligned to p16.jpg lines
    const mkHighlight = (leftPct, topPct, widthPct, heightPct) => el('div', {
      style: {
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        background: '#fde047',
        mixBlendMode: 'multiply',
        transformOrigin: 'left center',
        transform: 'scaleX(0)',
        borderRadius: `${3 * sc}px`,
      },
    }, sheetMain);

    // Line 1: "systems engineering" is defined as a methodical, multi-disciplinary approach
    const hl1 = mkHighlight(11.5, 14.5, 76.5, 2.3);
    const hl2 = mkHighlight(11.5, 16.5, 62.0, 2.2);
    // Line 2: "Systems engineering is the art and science of developing an operable system"
    const hl3 = mkHighlight(11.5, 38.7, 74.0, 2.3);
    const hl4 = mkHighlight(11.5, 40.6, 56.0, 2.2);

    // Top-bottom cinematic depth blur vignette
    el('div', {
      style: {
        position: 'absolute',
        inset: '0',
        background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 42%, rgba(9,8,7,0.72) 100%)',
        pointerEvents: 'none',
      },
    });

    // Top editorial header pill
    const topBar = el('div', {
      style: {
        position: 'absolute',
        left: `${(LAND ? 60 : 44) * sc}px`,
        top: `${(LAND ? 42 : 68) * sc}px`,
        right: `${(LAND ? 60 : 44) * sc}px`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: '20',
      },
    });
    el('div', {
      style: {
        padding: `${8 * sc}px ${16 * sc}px`,
        borderRadius: `${6 * sc}px`,
        background: '#facc15',
        color: '#111827',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: `${14 * sc}px`,
        fontWeight: '700',
        letterSpacing: '0.06em',
      },
    }, topBar, 'ARCHIVE · 3D DOCUMENT SCAN');
    el('div', {
      style: {
        padding: `${8 * sc}px ${16 * sc}px`,
        borderRadius: `${6 * sc}px`,
        background: 'rgba(17,24,39,0.85)',
        border: '1px solid rgba(250,204,21,0.45)',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: `${13 * sc}px`,
        color: '#fde047',
      },
    }, topBar, 'NASA SE HANDBOOK · P.16');

    // Floating Vox-style callout annotation card
    const noteCard = el('div', {
      style: {
        position: 'absolute',
        left: LAND ? `${84 * sc}px` : `${48 * sc}px`,
        bottom: `${(LAND ? 62 : 110) * sc}px`,
        width: LAND ? `${660 * sc}px` : `${984 * sc}px`,
        background: 'rgba(15,15,17,0.94)',
        borderLeft: `${6 * sc}px solid #facc15`,
        borderRadius: `${10 * sc}px`,
        padding: `${22 * sc}px ${26 * sc}px`,
        boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
        zIndex: '30',
        opacity: '0',
      },
    });
    const noteTag = el('div', {
      style: { fontFamily: '"JetBrains Mono", monospace', fontSize: `${13 * sc}px`, color: '#facc15', letterSpacing: '0.06em' },
    }, noteCard, 'EXCERPT 01 · 核心定义');
    const noteTitle = el('div', {
      style: { fontSize: `${(LAND ? 26 : 30) * sc}px`, fontWeight: '700', marginTop: `${8 * sc}px`, lineHeight: '1.4', color: '#ffffff' },
    }, noteCard, '系统工程是一套跨学科的全局方法论');
    const noteBody = el('div', {
      style: { fontSize: `${(LAND ? 16 : 21) * sc}px`, color: '#cbd5e1', marginTop: `${8 * sc}px`, lineHeight: '1.55' },
    }, noteCard, '不仅关注单个部件最优，更强调在成本、周期与约束冲突之间取得整体平衡。');

    return { desk, hl1, hl2, hl3, hl4, noteCard, noteTag, noteTitle, noteBody, sc };
  },

  draw(ctx, t, st) {
    const { desk, hl1, hl2, hl3, hl4, noteCard, noteTag, noteTitle, noteBody, sc } = st;
    const ease = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3);

    // Smooth 3D camera sweep across the tilted page:
    // Phase 1 (0..2.4s): Dolly into upper paragraph 1
    // Phase 2 (2.4..5.0s): Pan smoothly down to paragraph 2 with slight tilt shift
    const p1 = ease(t / 2.2);
    const p2 = ease((t - 4.1) / 1.8);

    const rotX = 32 - p1 * 8 + p2 * 5 + Math.sin(t * 0.55) * 1.6;
    const rotZ = -11 + p1 * 4 - p2 * 3 + Math.cos(t * 0.45) * 1.2;
    const zoom = (LAND ? 0.90 : 0.76) + p1 * 0.36 + p2 * 0.06 + (t / 8.5) * 0.16;
    const tx = (LAND ? 140 : 0) * sc - p1 * 30 * sc + p2 * 20 * sc + Math.sin(t * 0.5) * 16 * sc;
    const ty = (260 * sc) + p1 * (150 * sc) - p2 * (310 * sc) - (t / 8.5) * 65 * sc;

    desk.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${zoom.toFixed(3)}) rotateX(${rotX.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;

    // Highlighter progress
    hl1.style.transform = `scaleX(${ease((t - 1.2) / 0.85).toFixed(3)})`;
    hl2.style.transform = `scaleX(${ease((t - 2.0) / 0.75).toFixed(3)})`;
    hl3.style.transform = `scaleX(${ease((t - 5.2) / 0.85).toFixed(3)})`;
    hl4.style.transform = `scaleX(${ease((t - 6.0) / 0.75).toFixed(3)})`;

    // Floating editorial annotation card switches content between phase 1 and phase 2
    if (t < 4.7) {
      const a = ease((t - 1.6) / 0.6) * (1 - ease((t - 4.1) / 0.5));
      noteCard.style.opacity = a.toFixed(3);
      noteCard.style.transform = `translateY(${((1 - a) * 18 * sc).toFixed(1)}px)`;
      noteTag.textContent = 'EXCERPT 01 · 第 2.0 节核心定义';
      noteTitle.textContent = '系统工程是一套跨学科的系统方法论';
      noteBody.textContent = '覆盖设计、实现、运行与退役全周期，通过部件间的协同关系创造超越单体的整体价值。';
    } else {
      const a = ease((t - 5.4) / 0.6);
      noteCard.style.opacity = a.toFixed(3);
      noteCard.style.transform = `translateY(${((1 - a) * 18 * sc).toFixed(1)}px)`;
      noteTag.textContent = 'EXCERPT 02 · 冲突约束下的平衡';
      noteTitle.textContent = '在相互冲突的约束中打造可运行系统';
      noteBody.textContent = '平衡结构、电气、人因等多专业贡献，不让单一学科视角主导整体设计决策。';
    }
  },
});
