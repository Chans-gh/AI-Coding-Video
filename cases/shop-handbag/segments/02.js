// 第 2 段 旷野里的白日梦：8 个镜头硬切，前 7 个跟着旁白念到的词切（晴空 → 乌云 → 草原 → 湖边 → 撒欢 → 露珠 → 瓜果 → 牛羊），
// 屏幕上只出那个词的大字；最后一句念完，牛羊的镜头放慢，留 5 秒给配乐和风声。
// 2 层：底层镜头（7 个生成视频 + 1 张模特照片推镜，统一加胶片质感），上层关键词大字。时间由旁白的关键词驱动。
scene({
  id: 'shop-handbag:2', name: '旷野里的白日梦',
  needs: ['common.js'],
  fonts: ["900 96px 'Noto Serif SC'", "600 96px 'Noto Serif SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  async init() {
    await C.init();
    const v = n => loadVideo(`gen/${n}.mp4`);
    const V = { a: await v('2-1'), c: await v('2-4'), d: await v('2-5'), e: await v('2-6'), f: await v('2-7'), g: await v('2-8') };
    V.b = await v('2-2').catch(() => null);           // 2-2 还没出来时用 2-1 压暗代替
    const stream = await loadImage('brand/06-stream.jpg');
    const q = C.cue;
    // 切点（本段秒）：念到这个词前一点点切
    const at = { b: q('乌云') - .15, x: q('草原') - .1, c: q('湖边') - .1, d: q('自由') - .1, e: q('露珠') - .2, f: q('瓜果') - .2, g: q('牛羊') - .2 };
    const len = (k, next) => (next ?? SEG.dur) - at[k];
    const S = [
      { at: 0, k: 'a', v: C.clip(V.a, at.b) },
      { at: at.b, k: 'b', v: V.b ? C.clip(V.b, len('b', at.x)) : null },
      { at: at.x, k: 'x' },
      { at: at.c, k: 'c', v: C.clip(V.c, len('c', at.d), { fy: .6 }) },
      { at: at.d, k: 'd', v: C.clip(V.d, len('d', at.e), { fx: .35 }) },
      { at: at.e, k: 'e', v: C.clip(V.e, len('e', at.f), { fx: 0 }) },          // 靠左裁：右边岛上的小人中途会消失，裁掉
      { at: at.f, k: 'f', v: C.clip(V.f, len('f', at.g), { fx: .3 }) },          // 只用前段：后段布角会盖住梨
      { at: at.g, k: 'g', v: C.clip(V.g, len('g')) },
    ];
    const shots = S.map(s => ({
      at: s.at,
      prep: s.v ? s.v.prep : (s.k === 'b' ? C.clip(V.a, len('b', at.x), { from: 2 }).prep : null),
      draw: (c, lt, d) => {
        if (s.k === 'x') {                                // 模特坐在溪边（品牌方的照片）：慢推
          drawCover(c, stream, 0, 0, W, H, { zoom: 1.04 + .05 * lt / d, fx: .62, fy: .55 });
        } else if (s.v) s.v.paint(c, lt);
        else {                                            // 2-2 的替身：2-1 压暗、偏冷
          S[0].v.paint(c, lt);
          c.fillStyle = 'rgba(40,48,58,.5)'; c.fillRect(0, 0, W, H);
        }
      },
      ai: s.k !== 'x',
    }));
    return { shots, at };
  },
  async draw(ctx, t, s) {
    const { K } = C, q = C.cue, at = s.at;
    const i = await C.shots(ctx, t, s.shots);
    C.film(ctx, t, { grain: .04 });   // 生视频本身有噪点，颗粒再淡些，体积才进得了分摊上限
    C.shade(ctx, .35, .35);
    C.aiTag(ctx, s.shots[i].ai ? 1 : 0);
    // 关键词大字：念到哪个词出哪个词
    C.word(ctx, t, '一场柔和的梦', q('柔和'), q('晴空') - .1, { size: 96, y: .42 });
    C.word(ctx, t, '晴空', q('晴空'), at.b + .1, { size: 150, y: .4 });
    C.word(ctx, t, '乌云', q('乌云'), q('逆风'), { size: 150, y: .4 });
    C.word(ctx, t, '逆风', q('逆风'), at.x + .1, { size: 130, y: .36 });
    C.word(ctx, t, '顺风', q('顺风'), at.x + .1, { size: 130, y: .48 });
    C.word(ctx, t, '草原', q('草原'), at.c, { size: 84, y: .09 });
    C.word(ctx, t, '丛林', q('丛林'), at.c, { size: 84, y: .15 });
    C.word(ctx, t, '雪地', q('雪地'), at.c, { size: 84, y: .21 });
    C.word(ctx, t, '湖边', q('湖边'), at.d, { size: 150, y: .3 });
    C.word(ctx, t, '自由撒欢', q('自由'), q('探险') - .2, { size: 120, y: .3 });
    C.word(ctx, t, '四处探险', q('探险') - .2, at.e, { size: 120, y: .3 });
    C.word(ctx, t, '露珠', q('露珠'), at.f, { size: 150, y: .3 });
    C.word(ctx, t, '瓜果', q('瓜果'), q('山间') - .1, { size: 150, y: .3 });
    C.word(ctx, t, '山风', q('山间'), at.g, { size: 150, y: .3 });
    C.word(ctx, t, '牛羊', q('牛羊'), SEG.dur - 1.6, { size: 150, y: .3 });
    C.sub(ctx, t);                                      // 逐句字幕（需求方定：前半也出字幕）
  }
});
