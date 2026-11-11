// 各段共用：全片统一的色板和字体、镜头表（硬切 / 溶解）、生成视频取帧、胶片质感、关键词大字、逐句字幕、AI 标识。
// 依赖 samples/lib/lib.js；播放器给的全局 SEG = timing.json 的本段 {seg, title, dur, vo}、TIMING 整支的 timing.json。
// 每帧只由本段时间 t 决定。全片统一见 README「全片统一」：前半（P1–P5）只出关键词大字、硬切；后半（P6–P10）逐句字幕、段内溶解 0.4 秒。
const C = (() => {
  const u = SHORT / 1080;
  // 色板（README「全片统一」）
  const K = { grass: '#C9A86A', sky: '#9DB7C9', river: '#7E8B74', cream: '#F4EFE6', ink: '#2A2622', u };
  const SERIF = "'Noto Serif SC'", SANS = "'Noto Sans SC'";
  const F = (w, px, fam = SANS) => `${w} ${Math.round(px * u)}px ${fam}`;
  SEG.no = +SEG.seg;
  SEG.lines = SEG.vo.flatMap((v, s) => (v.lines || [{ t0: v.at, t1: v.at + v.t, text: v.show }]).map(l => ({ ...l, s })));
  const SUB = { items: [{ at: 0, lines: SEG.lines }] };
  const cue = (kw, f = Infinity) => cueTime(SUB, kw, f);   // 旁白说到关键词的时刻（本段秒）
  const FONTS = ["900 96px 'Noto Serif SC'", "600 96px 'Noto Serif SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"];

  // 中文字体按字切片：只载入本段和本文件源码、字幕里用到的字
  async function init() {
    const src = await xhr(`${DIR}/segments/${String(SEG.no).padStart(2, '0')}.js`) + await xhr(`${DIR}/segments/common.js`);
    const txt = [...new Set(src + SEG.lines.map(l => l.text).join(''))].join('');
    await Promise.all(FONTS.map(f => document.fonts.load(f, txt).catch(() => {})));
  }

  // 镜头表：list = [{at, draw(c, lt, d), prep?(lt), mix?}]，at 本段秒；mix 是从上一个镜头溶解进来的秒数（0 或不写 = 硬切）
  let OFF = null;
  async function shots(ctx, t, list) {
    let i = list.length - 1; while (i > 0 && t < list[i].at) i--;
    const d = k => (list[k + 1] ? list[k + 1].at : SEG.dur) - list[k].at;
    const run = async (k, c) => { const s = list[k], lt = t - s.at; if (s.prep) await s.prep(lt); s.draw(c, lt, d(k)); };
    const mix = list[i].mix || 0;
    if (i > 0 && mix && t < list[i].at + mix) {
      await run(i - 1, ctx);
      OFF = OFF || mk(W, H); const o = OFF.getContext('2d');
      o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.clearRect(0, 0, W, H); await run(i, o);
      ctx.save(); ctx.globalAlpha = eInOutCubic((t - list[i].at) / mix); ctx.drawImage(OFF, 0, 0); ctx.restore();
    } else await run(i, ctx);
    return i;
  }

  // 生成视频取帧：map(lt) → 素材里的秒；o.zoom(lt)、o.fx、o.fy 取景（生视频是 2:3，铺满 9:16 时左右各裁一条）
  function video(V, map, o = {}) {
    let el = null;
    return {
      prep: async lt => { el = await V.at(clamp(map(lt), 0, V.dur - .04)); },
      paint: (c, lt, r = [0, 0, W, H]) => drawCover(c, el, ...r, { zoom: o.zoom ? o.zoom(lt) : 1, fx: o.fx ?? .5, fy: o.fy ?? .5 }),
    };
  }
  // 一段生成视频当一个镜头：镜头比素材长时整体放慢，素材够长就原速（从 o.from 秒开始）
  function clip(V, len, o = {}) {
    const from = o.from || 0, rate = Math.min(1, (V.dur - from - .1) / len);
    return video(V, lt => from + lt * rate, o);
  }

  // 胶片质感：暖色调、暗角、颗粒，把生成画面、模特照片拉到同一个调子
  function film(ctx, t, o = {}) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(201,168,106,${o.warm ?? .22})`; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    vignette(ctx, o.vig ?? .42, .45);
    grain(ctx, Math.floor(t * FPS), o.grain ?? .22);
  }
  // 下方压暗，给大字、字幕垫底
  function shade(ctx, from = .55, a = .55) {
    const g = ctx.createLinearGradient(0, H * from, 0, H);
    g.addColorStop(0, 'rgba(20,16,12,0)'); g.addColorStop(1, `rgba(20,16,12,${a})`);
    ctx.fillStyle = g; ctx.fillRect(0, H * from, W, H * (1 - from));
  }

  // 关键词大字（前半）：宋体奶白，at 起 0.5 秒淡入上浮，until 前 0.4 秒淡出；o.size、o.y（0–1）、o.x、o.align
  function word(ctx, t, text, at, until, o = {}) {
    const a = smooth(at, at + .5, t) * (1 - smooth(until - .4, until, t));
    if (a <= 0) return;
    const size = o.size || 120, y = H * (o.y ?? .5) + (1 - eOutCubic(inv(at, at + .7, t))) * 24 * u;
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = F(o.weight || 600, size, SERIF); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(20,16,12,.55)'; ctx.shadowBlur = 28 * u; ctx.shadowOffsetY = 4 * u;
    ctx.fillStyle = o.color || K.cream;
    if (o.ls) ctx.letterSpacing = `${o.ls * u}px`;
    ctx.fillText(text, o.x ?? W / 2, y);
    ctx.restore();
  }
  // 逐句字幕（后半）：思源黑体、奶白字、墨色半透明底
  function sub(ctx, t) {
    const l = SEG.lines.find(l => t >= l.t0 && t < l.t1);
    if (!l) return;
    caption(ctx, l.text, { size: 44, y: H - 230 * u, bg: 'rgba(42,38,34,.62)', color: K.cream, maxW: W * .82 });
  }
  // 生成画面的标识：左上角小字（a 透明度，生成镜头上才出）
  function aiTag(ctx, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a * .85; ctx.font = F(400, 24); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = K.cream; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 6 * u;
    ctx.fillText('AI 生成画面', 40 * u, 40 * u); ctx.restore();
  }
  return { K, u, F, SERIF, SANS, cue, init, shots, video, clip, film, shade, word, sub, aiTag };
})();
