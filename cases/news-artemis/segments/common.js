// 各段共用：栏目包装（台标、段落标题、出处滚动条、字幕）、镜头表、视频取帧、AI 标识、星历读数。
// 依赖 samples/lib/lib.js 和风格包 packs/news-brief/pack.js（NB）；播放器给的全局 SEG = {no, title, dur, vo, lines}、TIMING。
// 每帧只由本段时间 t 决定；跨段连续的东西（出处滚动条、台标）用整支时间 G = 本段起点 + t。
const C = (() => {
  const K = NB.theme(), u = K.u;
  const START = TIMING.segments.slice(0, SEG.no - 1).reduce((a, s) => a + s.dur, 0);
  const G = t => START + t;
  const say = i => SEG.vo[i].at;                          // 本段第 i 句旁白开始的时刻
  const sayEnd = i => SEG.vo[i].at + SEG.vo[i].t;
  const SUB = { items: [{ at: 0, lines: SEG.lines }] };
  const cue = (kw, f = Infinity) => cueTime(SUB, kw, f);   // 旁白说到关键词的时刻（本段秒）
  const FONTS = ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 96px 'Noto Serif SC'",
    "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"];
  const SRC = '录像、照片 NASA（公共领域）　轨迹 NASA/JPL Horizons 星历　配乐 yd（CC0）　旁白 AI 语音合成　未来画面 AI 生成示意';
  const F = (w, px, fam = K.head) => `${w} ${Math.round(px * u)}px ${fam}`;

  let ICONS = null;
  // 中文字体按字切成许多小文件，只载入用到的字：把本段和本文件源码里的字全部载入（画面上的字都写在源码里）
  async function init() {
    const src = await xhr(`${DIR}/segments/${String(SEG.no).padStart(2, '0')}.js`) + await xhr(`${DIR}/segments/common.js`);
    const txt = [...new Set(src + SEG.lines.map(l => l.text).join(''))].join('');
    await Promise.all(FONTS.map(f => document.fonts.load(f, txt).catch(() => {})));
    ICONS = await loadImage('icons.svg');
  }
  // 段落图标（assets/icons.svg 里 6 个一排，每个 100×100）
  function icon(ctx, k, x, y, s, a = 1) {
    if (!ICONS || a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(ICONS, (k - 1) * 100, 0, 100, 100, x, y, s, s); ctx.restore();
  }
  // 台标：栏目名 + 日期（冷开场不出）
  function bug(ctx, t) { NB.bug(ctx, K, G(t) - TIMING.segments[0].dur, { show: '星海速递', en: 'ARTEMIS II', date: '2026.04.01—04.10' }); }
  // 段落标题：开头 3 秒大卡片（图标 + 段名），之后缩成台标下面的小条
  function head(ctx, t, k, title, en) {
    const e = NB.pop(t - .15, .5), out = eInOutCubic(inv(2.6, 3.2, t));
    const x = 40 * u, y0 = 170 * u;
    ctx.save();
    if (out < 1) {
      const a = e * (1 - out), y = lerp(y0, y0 - 20 * u, out);
      ctx.globalAlpha = a; ctx.fillStyle = K.glass; rr(ctx, x, y, 620 * u, 150 * u, 14 * u); ctx.fill();
      ctx.fillStyle = K.red; ctx.fillRect(x, y, 10 * u, 150 * u * e);
      icon(ctx, k, x + 34 * u, y + 25 * u, 100 * u, a);
      ctx.globalAlpha = a; ctx.fillStyle = K.ink; ctx.font = F(900, 60); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      ctx.fillText(title, x + 160 * u, y + 88 * u);
      ctx.fillStyle = K.gold; ctx.font = F(700, 22, K.mono); ctx.fillText(en, x + 162 * u, y + 124 * u);
    }
    if (out > 0) {
      ctx.globalAlpha = out; ctx.fillStyle = K.glass; rr(ctx, x, y0 - 10 * u, 300 * u, 64 * u, 10 * u); ctx.fill();
      icon(ctx, k, x + 10 * u, y0 - 4 * u, 52 * u, out);
      ctx.globalAlpha = out; ctx.fillStyle = K.ink; ctx.font = F(900, 30); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(title, x + 74 * u, y0 + 22 * u);
    }
    ctx.restore();
  }
  // 底部：出处滚动条 + 字幕
  function foot(ctx, t, o = {}) {
    const y = NB.ticker(ctx, K, G(t), o.src || SRC);
    if (o.sub !== false) NB.subtitle(ctx, K, t, SUB, y);
    return y;
  }
  // 生成画面的标识：右上角黄色小牌（不会被字幕、滚动条挡住）
  function aiLabel(ctx, t, text = 'AI 生成示意', a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a * NB.pop(t, .3); ctx.font = F(900, 32); ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    const w = ctx.measureText(text).width + 40 * u, x = W - 40 * u, y = 260 * u;
    ctx.fillStyle = K.gold; rr(ctx, x - w, y, w, 62 * u, 8 * u); ctx.fill();
    ctx.fillStyle = '#111'; ctx.fillText(text, x - 20 * u, y + 32 * u); ctx.restore();
  }
  // 素材标签：左下角小字（出处、拍摄时间）
  function credit(ctx, text, a = 1) {
    ctx.save(); ctx.globalAlpha *= a; ctx.font = F(400, 24, K.mono); ctx.fillStyle = 'rgba(245,247,250,.8)'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 8 * u; ctx.fillText(text, 40 * u, H - 470 * u); ctx.restore();
  }
  // 压暗：上下各一道渐变，保证台标、字幕看得清
  function shade(ctx, top = .55, bot = .8) {
    let g = ctx.createLinearGradient(0, 0, 0, H * .3); g.addColorStop(0, `rgba(7,11,16,${top})`); g.addColorStop(1, 'rgba(7,11,16,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * .3);
    g = ctx.createLinearGradient(0, H * .55, 0, H); g.addColorStop(0, 'rgba(7,11,16,0)'); g.addColorStop(1, `rgba(7,11,16,${bot})`);
    ctx.fillStyle = g; ctx.fillRect(0, H * .55, W, H * .45);
  }
  // 大数字：从大到小砸进来，轻微抖动后停住（C-036 的做法）
  function slam(ctx, t, text, x, y, px, o = {}) {
    if (t < 0) return;
    const e = eOutCubic(clamp(t / .35)), s = lerp(o.from || 2.2, 1, e), sh = (1 - clamp((t - .35) / .4)) * (t > .35 ? 1 : 0);
    const jx = Math.sin(t * 90) * 10 * u * sh, jy = Math.cos(t * 70) * 8 * u * sh;
    ctx.save(); ctx.translate(x + jx, y + jy); ctx.scale(s, s); ctx.globalAlpha *= clamp(t / .12) * (o.alpha ?? 1);
    ctx.font = `400 ${Math.round(px * u)}px 'Bebas Neue'`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 30 * u; ctx.fillStyle = o.color || K.ink; ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  // 镜头表：shots = [{at, prep(lt) 异步取帧（可选）, draw(c, lt, d)}]，相邻镜头之间红条转场（TR 秒）
  let OFF = null;
  async function shots(ctx, t, list, TR = .5) {
    let i = list.length - 1; while (i > 0 && t < list[i].at) i--;
    const d = k => (list[k + 1] ? list[k + 1].at : SEG.dur) - list[k].at;
    const run = async (k, c) => { const s = list[k], lt = t - s.at; if (s.prep) await s.prep(lt); s.draw(c, lt, d(k)); };
    if (i > 0 && t < list[i].at + TR && !list[i].cut) {
      OFF = OFF || mk(W, H); const o = OFF.getContext('2d');
      const p = eInOutCubic(clamp((t - list[i].at) / TR)), x = lerp(-.15, 1.15, p) * W, bw = 40 * u;
      await run(i - 1, ctx);
      o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.clearRect(0, 0, W, H); await run(i, o);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Math.max(0, x - bw), H); ctx.clip(); ctx.drawImage(OFF, 0, 0); ctx.restore();
      ctx.fillStyle = K.red; ctx.fillRect(x - bw, 0, bw, H); ctx.fillStyle = '#fff'; ctx.fillRect(x, 0, 6 * u, H);
    } else await run(i, ctx);
    return i;
  }
  // 视频镜头：铺满（或画进 r），本地时间 lt → 素材里的第 map(lt) 秒
  function video(V, map, o = {}) {
    let el = null;
    return {
      prep: async lt => { el = await V.at(clamp(map(lt), 0, V.dur - .04)); },
      paint: (c, lt, r = [0, 0, W, H]) => drawCover(c, el, ...r, { zoom: o.zoom ? o.zoom(lt) : 1, fx: o.fx ?? .5, fy: o.fy ?? .5 }),
    };
  }

  // 星历：Horizons CSV（地心黄道坐标，km、km/s）→ 按 JD 线性插值
  function ephem(rows) {
    const jd0 = rows[0].jd, step = rows[1].jd - rows[0].jd;
    return jd => {
      const f = clamp((jd - jd0) / step, 0, rows.length - 1.001), i = Math.floor(f), a = rows[i], b = rows[i + 1], k = f - i;
      const g = n => lerp(a[n], b[n], k);
      return { x: g('x_km'), y: g('y_km'), z: g('z_km'), vx: g('vx_kms'), vy: g('vy_kms'), vz: g('vz_kms') };
    };
  }
  const JD = (y, mo, d, h = 0, mi = 0) => Date.UTC(y, mo - 1, d, h, mi) / 864e5 + 2440587.5;
  // JD（UTC，与 TDB 差约 69 秒，画面读数到分钟，忽略）→ 美国东部夏令时的「4月6日 19:02」
  function edt(jd) {
    const ms = (jd - 2440587.5) * 864e5 - 4 * 3600e3, D = new Date(ms);
    return `${D.getUTCMonth() + 1}月${D.getUTCDate()}日 ${String(D.getUTCHours()).padStart(2, '0')}:${String(D.getUTCMinutes()).padStart(2, '0')}`;
  }
  const fmt = n => Math.round(n).toLocaleString('en-US');

  return { K, u, F, G, cue, say, sayEnd, FONTS, SRC, init, icon, bug, head, foot, aiLabel, credit, shade, slam, shots, video, ephem, JD, edt, fmt };
})();
