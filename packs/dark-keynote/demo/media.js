// 暗色科技发布会风格包 — 完整 71.25 秒（44 镜 5 章）有素材版演示片：
// 不修改 pack.js 与原有纯 C 演示 scene.js；按需在 needs 中引入 '../media_slots.js'，用占位框清晰演示图片/视频混排效果。
// 品牌色从播放器参数 accent 读（默认紫 #8B7BFF），播放器参数 scene=media 载入本文件。
const FONTS = ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "330px 'Bebas Neue'", "700 24px 'JetBrains Mono'"];
scene({
  id: 'pack:dark-keynote', name: '暗色科技发布会风格包（有素材版）', dur: 71.25, still: 10.8,
  needs: ['../pack.js', '../media_slots.js'], fonts: FONTS,
  async init() {
    const plan = JSON.parse(await xhr(`${DIR}/media_segments.json`));
    const txt = [...new Set('0123456789,.%×¥[TG真实AI实拍生图视频待填入铺底]▶' + JSON.stringify(plan))].join('');
    await Promise.all(FONTS.map(f => document.fonts.load(f, txt).catch(() => {})));
    const K = DK.theme({ accent: (typeof Q !== 'undefined' && Q.get('accent')) || '#8B7BFF' });
    let at = 0, ch = null;
    const segs = plan.segs.map((s, i) => {
      if (!DK[s.part]) throw new Error(`media_segments.json 第 ${i + 1} 段：没有部件 ${s.part}`);
      if (Math.abs(s.d / BEAT - Math.round(s.d / BEAT)) > 1e-6) {
        throw new Error(`media_segments.json 第 ${i + 1} 段：时长 ${s.d} 不是整拍（一拍 ${BEAT} 秒）`);
      }
      if (s.part === 'chapter') ch = s.o;
      const r = { ...s, i, at, ch: s.part === 'chapter' || s.part === 'outro' ? null : ch };
      at += s.d;
      return r;
    });
    if (Math.abs(at - this.dur) > 1e-6) throw new Error(`media.js 的 dur ${this.dur} 和 media_segments.json 的总长 ${at.toFixed(3)} 不一致`);
    const cues = [];
    segs.forEach(s => (s.cues || []).forEach(([a, text]) => {
      const n = [...text.replace(/[\s，。、：；！？,.]/g, '')].length;
      cues.push({ a: s.at + a, b: s.at + a + n / 4.5 + .25, text });
    }));
    cues.forEach((c, i) => { if ((cues[i + 1] && c.b > cues[i + 1].a - .1) || c.b > at) console.warn(`字幕太挤：${c.text}`); });
    return { K, segs, cues, TR: plan.tr, brand: plan.brand };
  },
  draw(ctx, t, s) {
    const { K, segs, TR } = s;
    let i = segs.length - 1;
    while (i > 0 && t < segs[i].at) i--;
    const frame = k => c => {
      const g = segs[k], lt = t - g.at, sp = g.speed || 1;
      DK.backdrop(c, K, t);
      if (g.bg) DK.mediaBg(c, K, lt * sp, g.bg);
      else DK.dust(c, K, t);
      const q = clamp(lt / g.d), z = g.bg ? 1 : (1 + .032 * q), dx = g.bg ? 0 : (g.i % 2 ? 1 : -1) * (z - 1) * W * .38 * q;
      c.save();
      c.translate(W / 2 + dx, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
      const res = DK[g.part](c, K, lt * sp, g.o || {});
      (g.over || []).forEach(v => {
        const a = v.anchor === 'self' ? res : v.anchor != null && res ? res[v.anchor] : null;
        DK[v.part](c, K, (lt - (v.at || 0)) * sp, a ? { ...a, ...v.o } : (v.o || {}));
      });
      c.restore();
    };
    const g = segs[i], TF = { edge: DK.transition, push: DK.push, fade: DK.dissolve, zoom: DK.zoom, wipe: DK.wipe, flash: DK.flashCut, flip: DK.flip };
    const tr = TF[g.tr], d = (TR && TR[g.tr]) || 0;
    if (i > 0 && tr && d > 0 && t < g.at + d) tr(ctx, K, (t - g.at) / d, frame(i - 1), frame(i));
    else frame(i)(ctx);
    const on = k => !!(segs[k] && segs[k].ch), fadeIn = on(i) && !on(i - 1) ? smooth(g.at + .1, g.at + .4, t) : 1;
    const fadeOut = on(i) && !on(i + 1) ? 1 - smooth(g.at + g.d - .3, g.at + g.d - .05, t) : 1;
    // bg 铺底镜头不显示右上角章节标，避开 mediaBg 右上提示条
    DK.corner(ctx, K, t, { brand: s.brand, ch: g.bg ? null : g.ch, al: on(i) ? fadeIn * fadeOut : 0 });
    DK.caption(ctx, K, t, s.cues);
  }
});
