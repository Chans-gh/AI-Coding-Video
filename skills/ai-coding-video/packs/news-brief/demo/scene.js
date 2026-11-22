// 新闻资讯解说风格包的完整演示片：米德湖和科罗拉多河的一期资讯解说。开场四个镜头 → 四章（每章一张栏目闪卡加 6–8 个镜头）→ 收尾三个镜头，
// 35 种整屏分镜各出现一次（章节闪卡除外），一个镜头 1.6–2 秒（4–5 拍）。15 秒的切换片段见 clip.js。
// 分镜表在 segments.json（画面和 sound.py 都读它）：每行一个分镜：整屏部件 part、时长 d（必须是整拍）、进场转场 tr、内容 o、
// 本地时间倍速 speed、这一段的底用哪几张照片 bg（不写就沿用这一章的）、叠在这一段上的部件 over（at 是段内时刻，anchor "self" 取宿主返回的位置）、字幕 cues。
// 层：背景（随画面组织变）、粒子、镜头（每段缓慢推近并平移）、转场（七种）、节拍（切点都在拍上，栏目条上的红点按拍闪）、角标（栏目条 + 滚动出处）、字幕（每章一句）。
// 画面组织从播放器参数 v 读：kenburns 单图推拉（默认）/ parallax 2.5D 视差分层 / collage 多图拼贴分屏，每个镜头都跟着变。
// 素材：照片（美国国会图书馆 Carol M. Highsmith，公共领域）、卫星图（NASA 地球观测站）、报纸（The Graham Guardian 1922）、
// 数据（美国垦务局月末水位、Natural Earth 州界和河流、本仓库算的深度图）；声音是 CC0 音效和配乐，没有旁白。
const FONTS = ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"];
const CLOSE = ['sources', 'reading'];                     // 收尾的镜头：留栏目条和出处，不标第几章
const PHOTOS = ['tower', 'shore', 'mead_aerial', 'vegas_day', 'mead_lake', 'hoover', 'headwaters', 'glen_dam', 'powell', 'vegas_dusk', 'mead_nra'];
scene({
  id: 'pack:news-brief', name: '新闻资讯解说风格包', dur: 68, still: 40.6,
  needs: ['../pack.js'], fonts: FONTS,
  async init() {
    const plan = JSON.parse(await xhr(`${DIR}/segments.json`)), BT = plan.beat;
    const txt = [...new Set('0123456789,.%×−+→↓↗“”' + JSON.stringify(plan))].join('');
    await Promise.all(FONTS.map(f => document.fonts.load(f, txt).catch(() => {})));
    const v = (typeof Q !== 'undefined' && Q.get('v')) || 'kenburns', L = NB.LAYOUTS[v] || NB.LAYOUTS.kenburns;
    const K = NB.theme({ beat: BT }), im = n => loadImage(n), deep = v === 'parallax';
    const P = {};
    await Promise.all(PHOTOS.map(async n => { P[n] = NB.photo(await im(`${n}.jpg`), deep ? await im(`${n}_depth.png`) : null, n === 'shore' ? [.3, .8] : undefined); }));
    for (const n of ['sat2000', 'sat2022', 'paper1922']) P[n] = NB.photo(await im(`${n}.jpg`));
    const geo = JSON.parse(await loadText('states.json')), riv = JSON.parse(await loadText('rivers.json'));
    K.geo = { shapes: geo.shapes, rivers: riv.lines };
    const rows = parseCSV(await loadText('mead.csv')).filter(r => r.year >= 1999 && r.month === 7).map(r => ({ x: r.year + (r.month - .5) / 12, y: r.value * .3048 }));
    Object.assign(K, { P, L, D: { mead: rows } });
    let at = 0, ch = null, bg = PHOTOS;
    const segs = plan.segs.map((s, i) => {
      if (!NB[s.part]) throw new Error(`segments.json 第 ${i + 1} 段：没有部件 ${s.part}`);
      if (Math.abs(s.d / BT - Math.round(s.d / BT)) > 1e-6) throw new Error(`segments.json 第 ${i + 1} 段：时长 ${s.d} 不是整拍（一拍 ${BT} 秒）`);
      if (s.tr && !NB.TRANS[s.tr]) throw new Error(`segments.json 第 ${i + 1} 段：没有转场 ${s.tr}`);
      if (s.part === 'chapter') { ch = s.o; bg = s.bg || bg; }
      const first = s.bg ? s.bg[0] : PHOTOS[(i * 4) % PHOTOS.length];       // 背景照片：本段写了 bg 用它，没写就轮换，后面跟着这一章和全部照片（拼贴、视差要好几张）
      const r = { ...s, i, at, bg: [...new Set([first, ...bg, ...PHOTOS])], ch: s.part === 'chapter' || s.part === 'outro' ? null : CLOSE.includes(s.part) ? { src: ch.src } : ch };
      at += s.d; return r;
    });
    if (Math.abs(at - this.dur) > 1e-6) throw new Error(`scene.js 的 dur ${this.dur} 和 segments.json 的总长 ${at.toFixed(3)} 不一致`);
    const cues = [];
    segs.forEach(s => (s.cues || []).forEach(([a, text]) => {
      const n = [...text.replace(/[\s，。、：；！？,.]/g, '')].length;
      cues.push({ a: s.at + a, b: Math.min(s.at + s.d - .05, s.at + a + n / 4.5 + .4), text });
    }));
    cues.forEach((c, i) => { if ((cues[i + 1] && c.b > cues[i + 1].a - .1) || c.b > at) console.warn(`字幕太挤：${c.text}`); });
    return { K, L, segs, cues, TR: plan.tr, brand: plan.brand, BT };
  },
  draw(ctx, t, s) {
    const { K, L, segs, TR, BT } = s, u = K.u;
    let i = segs.length - 1; while (i > 0 && t < segs[i].at) i--;
    const frame = k => c => {
      const g = segs[k], lt = t - g.at;
      L.backdrop(c, K, t, g.bg, k); NB.dust(c, K, t);
      // 镜头：每段从原大缓慢推近 3%，同时往一边平移（单双段方向相反）
      const q = clamp(lt / g.d), z = 1 + .03 * q, dx = (g.i % 2 ? 1 : -1) * (z - 1) * W * .4 * q;
      c.save(); c.translate(W / 2 + dx, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
      const sp = g.speed || 1, res = NB[g.part](c, K, lt * sp, { ...g.o, d: g.d / sp });
      (g.over || []).forEach(v => NB[v.part](c, K, (lt - v.at) * sp, v.anchor === 'self' && res ? { ...res, ...v.o } : v.o));
      c.restore();
    };
    const g = segs[i], d = TR[g.tr];
    if (i > 0 && g.tr && t < g.at + d) NB.TRANS[g.tr](ctx, K, (t - g.at) / d, frame(i - 1), frame(i));
    else frame(i)(ctx);
    // 角标：进入有章的一段时淡入，离开时淡出；开场、章节卡、收尾不显示
    const on = k => !!(segs[k] && segs[k].ch), fadeIn = on(i) && !on(i - 1) ? smooth(g.at + .1, g.at + .4, t) : 1;
    const fadeOut = on(i) && !on(i + 1) ? 1 - smooth(g.at + g.d - .3, g.at + g.d - .05, t) : 1;
    const y = NB.corner(ctx, K, t, { ...s.brand, ch: g.ch, src: g.ch ? g.ch.src : '', al: on(i) ? fadeIn * fadeOut : 0, beat: BT });
    NB.captions(ctx, K, t, s.cues, y);
  }
});
