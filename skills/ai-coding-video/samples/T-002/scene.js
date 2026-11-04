// T-002 口播剪辑 + 花字：NASA 专家访谈剪成两段跳切，每句换一次景别（推近、拉回），关键词做成弹出的大花字，底部中文字幕
// 素材：录像（NASA「We Asked a NASA Expert」一段，含原声）；两段原声的起点、长度、字幕都写在 assets.json，画面照着它取帧
scene({
  id: 'T-002', name: '口播剪辑 + 花字', dur: 13.4, still: 9.2,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  text: '说到载人航天我第一个想到的是航天员把自己绑在一枚火箭上们还得担心辐射从四面八方打过来去太空有多危险问专家录像原声配乐',
  async init() {
    const A = await loadAssets();
    const v = await loadVideo('talk.mp4');
    const segs = A.items.filter(i => i.kind === '原声').map(i => ({ at: +i.at, ss: +i.ss, len: +i.len, lines: i.lines }));
    return { A, v, segs };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, { segs } = s;
    // 当前是哪一段、哪一句：画面时间 = 段起点 ss + (t - at)，两段之间停在下一段第一帧
    let si = segs.findIndex(g => t < g.at + g.len); if (si < 0) si = segs.length - 1;
    const g = segs[si], local = clamp(t - g.at, 0, g.len);
    const li = Math.max(0, g.lines.findIndex(l => local < l.t1));
    await s.v.at(g.ss + local);
    // 景别：每换一句交替推近，像两台机位来回切
    const zoom = (si * 3 + li) % 2 ? 1.16 : 1.0;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    drawCover(ctx, s.v.el, 0, 0, W, H, { zoom: zoom * lerp(1, 1.03, local / g.len), fx: LAND ? .5 : .38, fy: .42 });
    // 切点闪一下白
    const cut = [g.at, ...g.lines.map(l => g.at + l.t0)].reduce((m, c) => Math.min(m, Math.abs(t - c)), 9);
    if (cut < 1 / 15) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, 0, W, H); }
    // 上方压暗，放标题条
    const gr = ctx.createLinearGradient(0, 0, 0, H * .3); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H * .3);
    ctx.save();
    const tx = 48 * u, ty = (LAND ? 48 : 130) * u;
    ctx.font = `900 ${34 * u}px 'Noto Sans SC'`; const tw = ctx.measureText('去太空有多危险？').width;
    ctx.fillStyle = '#ffd23f'; rr(ctx, tx, ty, 132 * u, 54 * u, 10 * u); ctx.fill();
    ctx.fillStyle = '#111'; ctx.font = `900 ${28 * u}px 'Noto Sans SC'`; ctx.textBaseline = 'middle'; ctx.fillText('问专家', tx + 22 * u, ty + 27 * u);
    ctx.fillStyle = '#fff'; ctx.font = `900 ${34 * u}px 'Noto Sans SC'`; ctx.fillText('去太空有多危险？', tx + 150 * u, ty + 28 * u);
    ctx.restore();
    // 进度条
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(0, 0, W, 6 * u);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(0, 0, W * clamp(t / 13.4), 6 * u);
    // 花字：每句一个关键词，弹出、轻微晃动、描粗边
    const KEY = [['载人航天', '#ffffff'], ['第一个想到', '#7cf7ff'], ['绑在火箭上', '#ffd23f'], ['辐射！', '#ff5a5f'], ['四面八方', '#ffd23f']];
    const ki = segs.slice(0, si).reduce((n, x) => n + x.lines.length, 0) + li;
    const l = g.lines[li], p = inv(l.t0, l.t0 + .35, local), out = smooth(l.t1 - .15, l.t1, local);
    if (t > g.at - .05 && local < g.len) {
      const [word, col] = KEY[ki], sc = eOutBack(p, 2.6) * (1 - out);
      const cx = LAND ? W * .72 : W * .5, cy = LAND ? H * .3 : H * .3;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate((ki % 2 ? 4 : -5) * Math.PI / 180 + Math.sin(t * 9) * .012); ctx.scale(sc, sc);
      ctx.font = `900 ${(LAND ? 96 : 118) * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 26 * u; ctx.strokeStyle = '#111'; ctx.strokeText(word, 6 * u, 8 * u);
      ctx.lineWidth = 16 * u; ctx.strokeStyle = col === '#ffffff' ? '#ff5a5f' : '#111'; ctx.strokeText(word, 0, 0);
      ctx.fillStyle = col; ctx.fillText(word, 0, 0);
      ctx.restore();
    }
    // 中文字幕（原声是英文，字幕是本仓库的翻译）
    const c = cueAt(s.A, t);
    if (c) caption(ctx, c.text, { size: LAND ? 44 : 50, bg: null, stroke: '#000', weight: 900 });
    ctx.save(); ctx.font = `400 ${17 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A) + ' · 字幕为本仓库翻译', W - 28 * u, H - 20 * u); ctx.restore();
  },
});
