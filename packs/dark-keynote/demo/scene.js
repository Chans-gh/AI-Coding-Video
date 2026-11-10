// 暗色科技发布会风格包的完整演示片：虚构产品「帧流 3」的发布短片，片头 → 四章（每章一张章节卡加 2–3 个部件）→ 片尾。
// 分段表在 segments.json（画面和 sound.py 都读它）：每行一个段部件 part、时长 d、进场转场 tr（edge 光边 / push 推移 / fade 叠化）、
// 内容 o、叠在这一段上的部件 over（标注、信息条）、字幕 cues（段内时刻和文字，结束时刻按每秒约 4.5 个字算）。
// 背景、角标、字幕、转场是层，不占段。品牌色从播放器参数 accent 读（默认紫 #8B7BFF）。15 秒的切换片段见 clip.js。
const FONTS = ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "330px 'Bebas Neue'", "700 24px 'JetBrains Mono'"];
scene({
  id: 'pack:dark-keynote', name: '暗色科技发布会风格包', dur: 87.6, still: 31.8,
  needs: ['../pack.js'], fonts: FONTS,
  async init() {
    const plan = JSON.parse(await xhr(`${DIR}/segments.json`));
    const txt = [...new Set('0123456789' + JSON.stringify(plan))].join('');
    await Promise.all(FONTS.map(f => document.fonts.load(f, txt).catch(() => {})));
    const K = DK.theme({ accent: (typeof Q !== 'undefined' && Q.get('accent')) || '#8B7BFF' });
    let at = 0, ch = null;
    const segs = plan.segs.map(s => {
      if (s.part === 'chapter') ch = s.o;
      const r = { ...s, at, ch: s.part === 'chapter' || s.part === 'outro' || s.part === 'title' ? null : ch };
      at += s.d; return r;
    });
    if (Math.abs(at - this.dur) > 1e-6) throw new Error(`scene.js 的 dur ${this.dur} 和 segments.json 的总长 ${at.toFixed(2)} 不一致`);
    const cues = [];
    segs.forEach(s => (s.cues || []).forEach(([a, text]) => {
      const n = [...text.replace(/[\s，。、：；！？,.]/g, '')].length;
      cues.push({ a: s.at + a, b: s.at + a + n / 4.5 + .25, text, end: s.at + s.d });
    }));
    cues.forEach((c, i) => { if (c.b > c.end + .01 || (cues[i + 1] && c.b > cues[i + 1].a - .1)) console.warn(`字幕太挤：${c.text}`); });
    return { K, segs, cues, TR: plan.tr, brand: plan.brand };
  },
  draw(ctx, t, s) {
    const { K, segs, TR } = s;
    let i = segs.length - 1; while (i > 0 && t < segs[i].at) i--;
    const frame = k => c => {
      const g = segs[k], lt = t - g.at;
      DK.backdrop(c, K, t);
      const res = DK[g.part](c, K, lt, g.o);
      (g.over || []).forEach(v => DK[v.part](c, K, lt - v.at, v.anchor != null && res ? { ...res[v.anchor], ...v.o } : v.o));
    };
    const g = segs[i], tr = { edge: DK.transition, push: DK.push, fade: DK.dissolve }[g.tr], d = TR[g.tr];
    if (i > 0 && tr && t < g.at + d) tr(ctx, K, (t - g.at) / d, frame(i - 1), frame(i));
    else frame(i)(ctx);
    // 角标：进入有章的一段时淡入，离开时淡出；片头、章节卡、片尾不显示
    const on = k => !!(segs[k] && segs[k].ch), fadeIn = on(i) && !on(i - 1) ? smooth(g.at + .2, g.at + .7, t) : 1;
    const fadeOut = on(i) && !on(i + 1) ? 1 - smooth(g.at + g.d - .45, g.at + g.d - .05, t) : 1;
    DK.corner(ctx, K, t, { brand: s.brand, ch: g.ch, al: on(i) ? fadeIn * fadeOut : 0 });
    DK.caption(ctx, K, t, s.cues);
  }
});
