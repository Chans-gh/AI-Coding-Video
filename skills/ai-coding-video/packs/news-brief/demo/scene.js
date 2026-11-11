// 新闻资讯解说风格包演示：米德湖水位跌到蓄水以来最低（2022 年 7 月），15 秒。分镜表、栏目包装、数据图、旁白三种都一样，
// 只有「画面组织」从播放器参数 v 读：kenburns 单图推拉（默认）/ parallax 2.5D 视差分层 / collage 多图拼贴分屏。
// 素材：照片（美国国会图书馆 Carol M. Highsmith 的两张、NASA 地球观测站的两张 Landsat 图）、数据（美国垦务局月末水位、本仓库算的深度图）；
// 旁白用语音合成的公开音色；配乐 CC0。段落的起点跟旁白走（cueTime），不写死秒数。
scene({
  id: 'pack:news-brief', name: '新闻资讯解说风格包', dur: 15, still: 7.6,
  needs: ['../pack.js'],
  fonts: ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'"],
  text: '资讯解说美国内华达州米德湖水位跌到蓄水以来最低年月比低约米海拔胡佛大坝取水塔白色岩壁就是从前的水位线来源照片卫星图配乐深度本仓库计算国会图书馆地球观测站垦务局公共领域最大的水库和相比湖面下降了一圈',
  async init() {
    const K = NB.theme(), A = await loadAssets();
    const v = (typeof Q !== 'undefined' && Q.get('v')) || 'kenburns', L = NB.LAYOUTS[v] || NB.LAYOUTS.kenburns;
    const im = n => loadImage(n);
    const P = {
      tower: NB.photo(await im('tower.jpg'), v === 'parallax' ? await im('tower_depth.png') : null),
      shore: NB.photo(await im('shore.jpg'), v === 'parallax' ? await im('shore_depth.png') : null, [.3, .8]),
      sat2000: NB.photo(await im('sat2000.jpg')), sat2022: NB.photo(await im('sat2022.jpg')),
    };
    // 数据：1999 年起的月末水位，英尺换成米
    const rows = parseCSV(await loadText('mead.csv')).filter(r => r.year >= 1999).map(r => ({ x: r.year + (r.month - .5) / 12, y: r.value * .3048 }));
    const at = (r, yr, mo) => rows.find(q => Math.abs(q.x - (yr + (mo - .5) / 12)) < .01);
    const a = at(rows, 2000, 7), b = at(rows, 2022, 7);
    const cue = (kw, f) => cueTime(A, kw, f) - .25;
    // 分镜表：每个分镜一个起点、一个镜头（用哪几张照片、怎么推）、一个文字部件
    const segs = [
      { at: 0, shot: { photos: ['shore', 'tower'], kind: 'headline', move: { z: [1.02, 1.12], fx: [.5, .56], fy: [.62, .66] } },
        part: (c, t, r) => NB.headline(c, K, t, r.box, { kicker: '美国 · 内华达州', title: '米德湖水位跌到蓄水以来最低', sub: '2022 年 7 月 · 比 2000 年低约 48 米' }, r.panel) },
      { at: cue('2022 年', 2.2), shot: { photos: ['sat2000', 'sat2022'], kind: 'compare', labels: ['2000 年 7 月', '2022 年 7 月'], move: { z: [1.18, 1.3], fx: [.5, .45], fy: [.45, .55] } } },
      { at: cue('和 2000', 5.8), shot: { photos: ['sat2022', 'shore'], kind: 'chart', move: { z: [1.1, 1.25], fx: [.35, .4], fy: [.55, .5] } },
        part: (c, t, r) => NB.chart(c, K, t, r.box, {
          title: '米德湖水位（海拔，米）', rows, ymin: 305, ymax: 375, yticks: [310, 330, 350, 370], xticks: [2000, 2010, 2020],
          big: { value: b.y - a.y, digits: 1, unit: '米', label: '2022 年 7 月比 2000 年 7 月' },
          marks: [{ x: a.x, y: a.y, label: `2000 · ${a.y.toFixed(0)} 米` }, { x: b.x, y: b.y, label: `2022 · ${b.y.toFixed(0)} 米`, hot: true, align: 'right' }],
        }, r.panel) },
      { at: cue('大坝', 9.2), shot: { photos: ['tower', 'shore'], kind: 'note', move: { z: [1.05, 1.28], fx: [LAND ? .72 : .84, .84], fy: [.5, .52] } },
        part: (c, t, r) => NB.note(c, K, t, r.box, { kicker: '胡佛大坝 · 取水塔', title: '白色岩壁，就是从前的水位线', lineTo: r.pin(0, .3, .49)[0] },
          r.pin(0, .85, .495), r.pin(0, .85, .59), r.panel) },
    ];
    segs.forEach((s, i) => s.d = (segs[i + 1] ? segs[i + 1].at : 15) - s.at);
    return { K, A, L, P, segs, TR: .5, src: credits(A) };
  },
  draw(ctx, t, s) {
    const { K, L, P, segs, TR } = s;
    let i = segs.length - 1; while (i > 0 && t < segs[i].at) i--;
    const frame = k => c => {
      const g = segs[k], lt = t - g.at, r = L.draw(c, K, lt, g.d, g.shot, P);
      if (g.part) g.part(c, lt, r);
    };
    if (i > 0 && t < segs[i].at + TR) NB.transition(ctx, K, (t - segs[i].at) / TR, frame(i - 1), frame(i));
    else frame(i)(ctx);
    NB.bug(ctx, K, t, { show: '资讯解说', en: 'NEWS BRIEF', date: '2022.07' });
    const y = NB.ticker(ctx, K, t, s.src);
    NB.subtitle(ctx, K, t, s.A, y);
  }
});
