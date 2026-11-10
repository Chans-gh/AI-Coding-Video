// 暗色科技发布会风格包的 15 秒切换片段（橙、绿两种品牌色和竖版用它；完整演示片是 scene.js）：虚构产品「帧流 3」的发布短片，
// 依次用到片头、讲解、数据、片尾，段间用光边转场，字幕贯穿全片。播放器参数 scene=clip 载入本文件。
// 品牌色从播放器参数 accent 读（默认紫 #8B7BFF），换色只改这一处。
scene({
  id: 'pack:dark-keynote', name: '暗色科技发布会风格包', dur: 15, still: 10.4,
  needs: ['../pack.js'],
  fonts: ["900 150px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "330px 'Bebas Neue'", "700 24px 'JetBrains Mono'"],
  text: '帧流3今天起免费试用一句话出一支视频怎么用三步写风格提示词AI渲染代码浏览器逐帧画成速度对比上一代倍现已开放这是只要提升到',
  init() {
    const K = DK.theme({ accent: (typeof Q !== 'undefined' && Q.get('accent')) || '#8B7BFF' });
    const segs = [
      { at: 0, f: (c, t) => DK.title(c, K, t, { kicker: 'LAUNCH 2026', title: '帧流 3', sub: '一句话，出一支视频' }) },
      { at: 3.4, f: (c, t) => DK.explain(c, K, t, { kicker: 'HOW IT WORKS', title: '三步出一支视频', label: 'steps.md',
        steps: ['写一句风格提示词', 'AI 写出渲染代码', '浏览器逐帧画成视频'], start: .55, every: .75 }) },
      { at: 8.2, f: (c, t) => DK.data(c, K, t, { kicker: 'PERFORMANCE', title: '渲染速度（帧 / 秒）', unit: '',
        bars: [{ label: 'v1', v: 12 }, { label: 'v2', v: 21 }, { label: 'v3', v: 50 }],
        big: { from: 1, to: 4.2, suffix: '×', label: '对比上一代', start: 1.4 } }) },
      { at: 12.6, f: (c, t) => DK.title(c, K, t, { kicker: 'AVAILABLE NOW', title: '帧流 3', sub: '今天起，免费试用' }) },
    ];
    const cues = [
      { a: .5, b: 3.0, text: '这是帧流 3。' },
      { a: 3.7, b: 5.7, text: '只要三步：写一句提示词，' },
      { a: 5.8, b: 8.0, text: 'AI 写代码，浏览器逐帧画成视频。' },
      { a: 8.5, b: 10.3, text: '渲染速度提升到' },
      { a: 10.4, b: 12.3, text: '上一代的 4.2 倍。' },
      { a: 13.0, b: 14.8, text: '帧流 3，今天起免费试用。' },
    ];
    return { K, segs, cues, TR: .6 };
  },
  draw(ctx, t, s) {
    const { K, segs, TR } = s;
    let i = segs.length - 1; while (i > 0 && t < segs[i].at) i--;
    const frame = k => c => { DK.backdrop(c, K, t); segs[k].f(c, t - segs[k].at); };
    if (i > 0 && t < segs[i].at + TR) DK.transition(ctx, K, (t - segs[i].at) / TR, frame(i - 1), frame(i));
    else frame(i)(ctx);
    DK.caption(ctx, K, t, s.cues);
  }
});
