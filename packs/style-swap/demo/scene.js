// 分镜换画风风格包的完整演示片：街角面包店的一个早晨。开场四个镜头 → 五章（天亮、揉面、进炉、出炉、开门，每章一张章节闪卡加 6–7 个镜头）
// → 收尾三个镜头，38 种整屏分镜各出现一次（章节闪卡除外），一个镜头 1.8 秒（3 拍），切点都在配乐的拍上。15 秒的切换片段见 clip.js。
// 分镜表在 segments.json（画面和 sound.py 都读它）。层：背景（当前画风的底纹）、粒子、镜头（每段缓慢推近并平移）、转场（七种）、
// 节拍（角标上的点按拍闪）、角标（包名、当前画风、章名）、字幕（每章一句）。
// 画风从播放器参数 v 读：photo 写实摄影（默认）/ watercolor 水彩插画 / clay 3D 黏土——每个镜头都用这一种的图，纯代码镜头后面铺这一种的底纹。
// 素材：生图（每种画风 16 个镜头加一张底纹，提示词由 compose.py 按「镜头段 + 风格段 + 约束段」拼出，生成记录在 genlog.json）；
// 声音是 CC0 音效和配乐，没有旁白。
const FONTS = ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "300 54px 'Noto Sans SC'", "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"];
const CLOSE = ['timeline', 'credits'];                    // 收尾的镜头：留角标，不标第几章
scene({
  id: 'pack:style-swap', name: '分镜换画风风格包', dur: 72.6, still: 21,
  needs: ['../pack.js'], fonts: FONTS,
  async init() {
    const plan = JSON.parse(await xhr(`${DIR}/segments.json`)), P = JSON.parse(await xhr(`${DIR}/prompts.json`)), G = JSON.parse(await xhr(`${DIR}/genlog.json`));
    const meta = JSON.parse(await xhr(`${DIR}/../meta.json`)), names = Object.fromEntries(meta.variants.map(v => [v[0], v[1]])), BT = plan.beat;
    const txt = [...new Set('0123456789.%×→↓“”—·⇆' + JSON.stringify(plan) + JSON.stringify(P) + Object.values(names).join(''))].join('');
    await Promise.all(FONTS.map(f => document.fonts.load(f, txt).catch(() => {})));
    const q = (typeof Q !== 'undefined' && Q.get('v')) || meta.variants[0][0], v = P.styles[q] ? q : meta.variants[0][0];
    const ids = [...P.shots.map(s => s.id), 'tex'], ALL = {};
    await Promise.all(Object.keys(P.styles).map(async st => { ALL[st] = {}; await Promise.all(ids.map(async id => { ALL[st][id] = await loadImage(`${st}-${id}.jpg`); })); }));
    const K = Object.assign(SW.theme({ beat: BT }), { I: ALL[v], ALL, v, names, Pr: P, G });
    let at = 0, ch = null;
    const segs = plan.segs.map((s, i) => {
      if (!SW[s.part]) throw new Error(`segments.json 第 ${i + 1} 段：没有部件 ${s.part}`);
      if (Math.abs(s.d / BT - Math.round(s.d / BT)) > 1e-6) throw new Error(`segments.json 第 ${i + 1} 段：时长 ${s.d} 不是整拍（一拍 ${BT} 秒）`);
      if (s.tr && !SW.TRANS[s.tr]) throw new Error(`segments.json 第 ${i + 1} 段：没有转场 ${s.tr}`);
      if (s.part === 'chapter') ch = s.o;
      const open = !ch || s.part === 'chapter' || s.part === 'outro';
      const r = { ...s, i, at, ch: open ? null : CLOSE.includes(s.part) ? {} : ch };
      at += s.d; return r;
    });
    if (Math.abs(at - this.dur) > 1e-6) throw new Error(`scene.js 的 dur ${this.dur} 和 segments.json 的总长 ${at.toFixed(3)} 不一致`);
    const cues = [];
    segs.forEach(s => (s.cues || []).forEach(([a, text]) => {
      const n = [...text.replace(/[\s，。、：；！？,.]/g, '')].length;
      cues.push({ a: s.at + a, b: s.at + a + n / 4.5 + .5, text });
    }));
    cues.forEach((c, i) => { const nx = segs.find(g => g.at > c.a && g.part === 'chapter'); if (nx && c.b > nx.at - .05) c.b = nx.at - .05; if (cues[i + 1] && c.b > cues[i + 1].a - .1) console.warn(`字幕太挤：${c.text}`); });
    return { K, segs, cues, TR: plan.tr, brand: plan.brand, BT };
  },
  draw(ctx, t, s) {
    const { K, segs, TR, BT } = s;
    let i = segs.length - 1; while (i > 0 && t < segs[i].at) i--;
    const frame = k => c => {
      const g = segs[k], lt = t - g.at;
      SW.backdrop(c, K, t, k); SW.grain(c, K, t);
      // 镜头：每段从原大缓慢推近 3%，同时往一边平移（单双段方向相反）
      const p = clamp(lt / g.d), z = 1 + .03 * p, dx = (g.i % 2 ? 1 : -1) * (z - 1) * W * .4 * p;
      c.save(); c.translate(W / 2 + dx, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
      const sp = g.speed || 1, res = SW[g.part](c, K, lt * sp, { ...g.o, d: g.d / sp });
      (g.over || []).forEach(v => SW[v.part](c, K, (lt - v.at) * sp, v.anchor === 'self' && res ? { ...res, ...v.o } : v.o));
      c.restore();
    };
    const g = segs[i], d = TR[g.tr];
    if (i > 0 && g.tr && t < g.at + d) SW.TRANS[g.tr](ctx, K, (t - g.at) / d, frame(i - 1), frame(i));
    else frame(i)(ctx);
    // 角标：进入有章的一段时淡入，离开时淡出；开场、章节卡、片尾不显示
    const on = k => !!(segs[k] && segs[k].ch), fadeIn = on(i) && !on(i - 1) ? smooth(g.at + .1, g.at + .4, t) : 1;
    const fadeOut = on(i) && !on(i + 1) ? 1 - smooth(g.at + g.d - .3, g.at + g.d - .05, t) : 1;
    SW.corner(ctx, K, t, { ...s.brand, ch: g.ch && g.ch.n ? g.ch : null, al: on(i) ? fadeIn * fadeOut : 0, beat: BT });
    SW.captions(ctx, K, t, s.cues);
  }
});
