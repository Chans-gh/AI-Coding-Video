// 分镜换画风风格包演示：清晨街角面包店的三个镜头，15 秒。分镜、提示词的镜头段和约束段、剪辑、旁白、配乐三种都一样，
// 只有「画风」从播放器参数 v 读：photo 写实摄影（默认）/ watercolor 水彩插画 / clay 3D 黏土——对应 prompts.json 里 styles 的一行风格段。
// 素材：生图（每种画风 3 张，提示词由 compose.py 按「镜头段 + 风格段 + 约束段」拼出）、语音合成；配乐 CC0。段落起点跟旁白走（cueTime）。
scene({
  id: 'pack:style-swap', name: '分镜换画风风格包', dur: 15, still: 7.4,
  needs: ['../pack.js'],
  fonts: ["900 72px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "300 54px 'Noto Sans SC'", "700 30px 'JetBrains Mono'"],
  text: '同一段分镜只换风格段镜头每个一段全片共用约束画风写实摄影水彩插画黏土远景特写中景天刚亮街角的面包店先亮了灯烤箱里面团慢慢鼓起来等第一篮面包摆上窗台这条街就醒了提示词＋：·…，、。',
  async init() {
    const K = SW.theme(), A = await loadAssets(), P = JSON.parse(await xhr(`${DIR}/prompts.json`));
    const meta = JSON.parse(await xhr(`${DIR}/../meta.json`)), names = Object.fromEntries(meta.variants.map(v => [v[0], v[1]]));
    const q = (typeof Q !== 'undefined' && Q.get('v')) || meta.variants[0][0], v = P.styles[q] ? q : meta.variants[0][0];
    const img = {};
    for (const st of Object.keys(P.styles)) for (const s of P.shots) img[`${st}-${s.id}`] = await loadImage(`${st}-${s.id}.jpg`);
    const cue = (kw, f) => cueTime(A, kw, f) - .3;
    const moves = [{ z: [1.02, 1.14], fx: [.5, .5], fy: [.45, .55] }, { z: [1.16, 1.04], fx: [.5, .5], fy: [.5, .5] }, { z: [1.04, 1.16], fx: [.35, .55], fy: [.5, .5] }];
    // 分段表：片头公式 → 三个镜头 → 片尾三种画风并排
    const segs = [
      { at: 0, f: (c, t) => SW.formula(c, K, t, { title: '同一段分镜，只换风格段', shot: P.shots[0].prompt, style: P.styles[v], styleName: names[v], rules: P.rules }, img[`${v}-s1`]) },
      ...P.shots.map((s, i) => ({ at: [2.9, cue('烤箱', 5.7), cue('等第一篮', 8.9)][i], f: (c, t, d) => {
        SW.shot(c, K, t, d, img[`${v}-${s.id}`], moves[i]);
        SW.strip(c, K, t, { shotName: `镜头 ${i + 1} · ${s.size}`, styleName: names[v], styleText: P.styles[v] });
      } })),
      { at: 13.0, f: (c, t) => SW.lineup(c, K, t, { title: '换一行风格段，整支片子换画风', sub: '镜头段、约束段和剪辑代码都没动',
        items: meta.variants.map(([k, z]) => ({ img: img[`${k}-s3`], name: z, on: k === v })) }) },
    ];
    segs.forEach((s, i) => s.d = (segs[i + 1] ? segs[i + 1].at : 15) - s.at);
    return { K, A, segs, TR: .5 };
  },
  draw(ctx, t, s) {
    const { K, segs, TR } = s;
    let i = segs.length - 1; while (i > 0 && t < segs[i].at) i--;
    const frame = k => c => segs[k].f(c, t - segs[k].at, segs[k].d);
    if (i > 0 && t < segs[i].at + TR) SW.transition(ctx, K, (t - segs[i].at) / TR, frame(i - 1), frame(i));
    else frame(i)(ctx);
    SW.subtitle(ctx, K, t, s.A);
  }
});
