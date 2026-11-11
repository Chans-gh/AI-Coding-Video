// 暗色科技发布会风格包的完整演示片：虚构产品「帧流 3」的发布短片。开场四个镜头 → 五章（每章一张章节闪卡加 4–8 个镜头）→ 片尾，
// 45 种分镜各出现一次（章节闪卡除外），一个镜头 1.5–2.25 秒。
// 分镜表在 segments.json（画面和 sound.py 都读它）：每行一个分镜：整屏部件 part、时长 d（必须是整拍）、进场转场 tr、内容 o、
// 本地时间倍速 speed、叠在这一段上的部件 over（at 是段内时刻，anchor 是宿主返回的位置：数字取第几项，"self" 取整个）、字幕 cues。
// 层：背景、粒子、镜头（每段缓慢推近并平移）、转场、节拍（切点都在拍上）、角标、字幕。品牌色从播放器参数 accent 读（默认紫 #8B7BFF）。
// 15 秒的切换片段见 clip.js。
const FONTS = ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "330px 'Bebas Neue'", "700 24px 'JetBrains Mono'"];
scene({
  id: 'pack:dark-keynote', name: '暗色科技发布会风格包', dur: 71.25, still: 66.6,
  needs: ['../pack.js'], fonts: FONTS,
  async init() {
    const plan = JSON.parse(await xhr(`${DIR}/segments.json`));
    const txt = [...new Set('0123456789,.%×¥' + JSON.stringify(plan))].join('');
    await Promise.all(FONTS.map(f => document.fonts.load(f, txt).catch(() => {})));
    const K = DK.theme({ accent: (typeof Q !== 'undefined' && Q.get('accent')) || '#8B7BFF' });
    let at = 0, ch = null;
    const segs = plan.segs.map((s, i) => {
      if (!DK[s.part]) throw new Error(`segments.json 第 ${i + 1} 段：没有部件 ${s.part}`);
      if (Math.abs(s.d / BEAT - Math.round(s.d / BEAT)) > 1e-6) throw new Error(`segments.json 第 ${i + 1} 段：时长 ${s.d} 不是整拍（一拍 ${BEAT} 秒）`);
      if (s.part === 'chapter') ch = s.o;
      const r = { ...s, i, at, ch: s.part === 'chapter' || s.part === 'outro' ? null : ch };
      at += s.d; return r;
    });
    if (Math.abs(at - this.dur) > 1e-6) throw new Error(`scene.js 的 dur ${this.dur} 和 segments.json 的总长 ${at.toFixed(3)} 不一致`);
    const cues = [];
    segs.forEach(s => (s.cues || []).forEach(([a, text]) => {
      const n = [...text.replace(/[\s，。、：；！？,.]/g, '')].length;
      cues.push({ a: s.at + a, b: s.at + a + n / 4.5 + .25, text });
    }));
    cues.forEach((c, i) => { if ((cues[i + 1] && c.b > cues[i + 1].a - .1) || c.b > at) console.warn(`字幕太挤：${c.text}`); });
    return { K, segs, cues, TR: plan.tr, brand: plan.brand };
  },
  draw(ctx, t, s) {
    const { K, segs, TR } = s, u = K.u;
    let i = segs.length - 1; while (i > 0 && t < segs[i].at) i--;
    const frame = k => c => {
      const g = segs[k], lt = t - g.at, sp = g.speed || 1;
      DK.backdrop(c, K, t); DK.dust(c, K, t);
      // 镜头：每段从原大缓慢推近 3.5%，同时往一边平移（单双段方向相反），整段没有一帧是完全静止的
      const q = clamp(lt / g.d), z = 1 + .035 * q, dx = (g.i % 2 ? 1 : -1) * (z - 1) * W * .4 * q;
      c.save(); c.translate(W / 2 + dx, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
      const res = DK[g.part](c, K, lt * sp, g.o);
      (g.over || []).forEach(v => {
        const a = v.anchor === 'self' ? res : v.anchor != null && res ? res[v.anchor] : null;
        DK[v.part](c, K, (lt - v.at) * sp, a ? { ...a, ...v.o } : v.o);
      });
      c.restore();
    };
    const g = segs[i], TF = { edge: DK.transition, push: DK.push, fade: DK.dissolve, zoom: DK.zoom, wipe: DK.wipe, flash: DK.flashCut, flip: DK.flip };
    const tr = TF[g.tr], d = TR[g.tr];
    if (i > 0 && tr && t < g.at + d) tr(ctx, K, (t - g.at) / d, frame(i - 1), frame(i));
    else frame(i)(ctx);
    // 角标：进入有章的一段时淡入，离开时淡出；开场、章节卡、片尾不显示
    const on = k => !!(segs[k] && segs[k].ch), fadeIn = on(i) && !on(i - 1) ? smooth(g.at + .1, g.at + .4, t) : 1;
    const fadeOut = on(i) && !on(i + 1) ? 1 - smooth(g.at + g.d - .3, g.at + g.d - .05, t) : 1;
    DK.corner(ctx, K, t, { brand: s.brand, ch: g.ch, al: on(i) ? fadeIn * fadeOut : 0 });
    DK.caption(ctx, K, t, s.cues);
  }
});
