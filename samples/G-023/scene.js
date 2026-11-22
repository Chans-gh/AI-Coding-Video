// G-023 水果拟人小剧场：先生成两个拟人水果的定妆图，三个镜头都拿它当参考图生成，角色长得一样；中间那个镜头图生视频；代码照一张三镜头的分镜表编排——镜头的切点取旁白说到「阿蕉」「雨停」的时刻，静帧做缓慢推拉、代码画雨丝，镜头一开始给角色挂名牌，「一起走吧！」不对口型、做成阿蕉头顶的对话气泡，旁白逐句出字幕；画面边上一直摆着分镜条，当前镜头高亮，片尾落片名
// 素材：生图 4 张（定妆图 1、镜头 2）、生视频 1 段（5 秒）、语音合成旁白（公开音色）；配乐 CC0。雨丝、名牌、气泡、分镜条都是 Canvas 2D 画的
scene({
  id: 'G-023', name: '水果拟人小剧场', dur: 13, still: 6.9,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  text: '下雨啦小莓没有带伞只好躲在蘑菇下面阿蕉举着一片大荷叶走过来一起走吧雨停的时候外面挂起了一道彩虹荷叶伞镜头分镜定妆图草莓香蕉',
  async init() {
    const A = await loadAssets();
    const cut1 = cueTime(A, '阿蕉', 4.1), cut2 = cueTime(A, '雨停', 7.6), say = cueTime(A, '一起', 6.6);
    return { A, cut1, cut2, say, cast: await loadImage('cast.jpg'), rain: await loadImage('rain.jpg'), rainbow: await loadImage('rainbow.jpg'), v: await loadVideo('leaf.mp4') };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, INK = '#3b2a22', CREAM = '#fff7ec';
    const SH = [{ t0: 0, t1: s.cut1, n: '镜 1 · 中景', d: '小莓躲雨' }, { t0: s.cut1, t1: s.cut2, n: '镜 2 · 中景', d: '阿蕉送荷叶' }, { t0: s.cut2, t1: 13, n: '镜 3 · 全景', d: '雨后彩虹' }];
    const k = t < s.cut1 ? 0 : t < s.cut2 ? 1 : 2, sh = SH[k], lt = t - sh.t0, sd = sh.t1 - sh.t0;
    // 画面框：横屏左边方形、右边分镜条；竖屏上面方形、下面字幕和分镜条
    const S = LAND ? 960 * u : W - 60 * u, px = LAND ? 70 * u : 30 * u, py = LAND ? 60 * u : 250 * u;
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
    let src, zoom = 1, fx = .5, fy = .5;
    if (k === 1) { await s.v.at(clamp(lt * (s.v.dur - .1) / sd, 0, s.v.dur - .05)); src = s.v.el; zoom = 1.02; }
    else if (k === 0) { src = s.rain; zoom = lerp(1.18, 1.04, eInOutCubic(lt / sd)); fx = .38; fy = .55; }
    else { src = s.rainbow; zoom = lerp(1.0, 1.12, eInOutCubic(lt / sd)); fx = .6; fy = .4; }
    ctx.save(); ctx.shadowColor = 'rgba(80,50,30,.25)'; ctx.shadowBlur = 30 * u; ctx.fillStyle = '#fff'; rr(ctx, px, py, S, S, 30 * u); ctx.fill(); ctx.restore();
    ctx.save(); rr(ctx, px, py, S, S, 30 * u); ctx.clip();
    drawCover(ctx, src, px, py, S, S, { zoom, fx, fy });
    if (k < 2) {                                            // 代码画的雨丝（镜 2 末尾雨渐小）
      const n = 110, fall = k === 1 ? 1 - .7 * inv(sd - 1, sd, lt) : 1;
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2 * u; ctx.beginPath();
      for (let i = 0; i < n * fall; i++) {
        const x = px + hash1(i) * S, sp = .9 + hash1(i + 99) * .6, y = py + ((hash1(i + 7) + t * sp) % 1) * (S + 80 * u) - 40 * u;
        ctx.moveTo(x, y); ctx.lineTo(x - 8 * u, y + 34 * u);
      }
      ctx.stroke();
    }
    // 片头 0.5 秒白场淡入；切镜头时闪一下白
    const fl = Math.max(1 - inv(0, .5, t), k ? 1 - inv(sh.t0, sh.t0 + .25, t) : 0) * .8;
    if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(px, py, S, S); }
    ctx.restore();
    // 名牌：镜头开始时挂上
    const tag = (txt, x, y, col, t0) => {
      const a = eOutBack(inv(t0, t0 + .4, t)) * (1 - inv(t0 + 1.8, t0 + 2.1, t)); if (a <= 0) return;
      ctx.save(); ctx.translate(px + x * S, py + y * S); ctx.scale(a, a);
      ctx.font = `700 ${30 * u}px 'Noto Sans SC'`; const tw = ctx.measureText(txt).width + 36 * u;
      ctx.fillStyle = col; rr(ctx, -tw / 2, -50 * u, tw, 50 * u, 25 * u); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-10 * u, 0); ctx.lineTo(10 * u, 0); ctx.lineTo(0, 14 * u); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, -24 * u); ctx.restore();
    };
    if (k === 0) tag('小莓 · 草莓', .36, .3, '#e0483e', .6);
    if (k === 1) { tag('小莓', .3, .36, '#e0483e', s.cut1 + .1); tag('阿蕉 · 香蕉', .72, .2, '#d9a21b', s.cut1 + .3); }
    // 台词气泡：不对口型，阿蕉头顶冒出来
    const ba = eOutBack(inv(s.say - .1, s.say + .25, t)) * (1 - inv(s.cut2 - .2, s.cut2, t));
    if (ba > 0) {
      ctx.save(); ctx.translate(px + .4 * S, py + .16 * S); ctx.scale(ba, ba);
      ctx.font = `900 ${44 * u}px 'Noto Sans SC'`; const tw = ctx.measureText('阿蕉：一起走吧！').width + 60 * u;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 4 * u; rr(ctx, -tw / 2, -50 * u, tw, 100 * u, 50 * u); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tw / 2 - 70 * u, 48 * u); ctx.lineTo(tw / 2 + 10 * u, 95 * u); ctx.lineTo(tw / 2 - 30 * u, 48 * u); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#d9a21b'; ctx.fillText('阿蕉：', -tw / 2 + 30 * u, 2 * u);
      ctx.fillStyle = INK; ctx.fillText('一起走吧！', -tw / 2 + 30 * u + ctx.measureText('阿蕉：').width, 2 * u); ctx.restore();
    }
    // 旁白字幕（台词那句由气泡代替）
    const c = cueAt(s.A, t);
    if (c && !c.text.startsWith('一起')) caption(ctx, c.text, { size: LAND ? 40 : 46, color: INK, bg: null, maxW: S - 60 * u, y: LAND ? py + S - 36 * u : py + S + 140 * u, stroke: LAND ? 'rgba(255,255,255,.9)' : null });
    // 分镜条：三个镜头的缩略图，当前高亮
    const thumbs = [s.rain, s.v.el, s.rainbow], tw = LAND ? 300 * u : 300 * u, th = LAND ? 230 * u : 210 * u;
    for (let i = 0; i < 3; i++) {
      const x = LAND ? px + S + 80 * u : 45 * u + i * (tw + 30 * u), y = LAND ? 130 * u + i * (th + 60 * u) : H - th - 150 * u;
      const on = i === k, a = on ? 1 : .45;
      ctx.globalAlpha = a; ctx.save(); rr(ctx, x, y, tw, tw * .62, 14 * u); ctx.clip();
      if (i === 1 && k !== 1) ctx.drawImage(s.cast, 0, 0, s.cast.naturalWidth, s.cast.naturalHeight, x, y - tw * .1, tw, tw * .667);   // 没轮到时第 2 格摆定妆图
      else drawCover(ctx, thumbs[i], x, y, tw, tw * .62);
      ctx.restore();
      if (on) { ctx.strokeStyle = '#e0483e'; ctx.lineWidth = 6 * u; rr(ctx, x, y, tw, tw * .62, 14 * u); ctx.stroke(); }
      ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `700 ${24 * u}px 'Noto Sans SC'`;
      ctx.fillText(SH[i].n, x, y + tw * .62 + 12 * u); ctx.font = `400 ${22 * u}px 'Noto Sans SC'`; ctx.fillText(SH[i].d, x, y + tw * .62 + 44 * u);
      if (on) { ctx.fillStyle = '#e0483e'; ctx.fillRect(x, y + tw * .62 + 4 * u, tw * clamp(lt / sd), 4 * u); }
      ctx.globalAlpha = 1;
    }
    if (LAND) { ctx.fillStyle = INK; ctx.font = `900 ${40 * u}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('分镜', px + S + 80 * u, 95 * u); }
    else { ctx.fillStyle = INK; ctx.font = `900 ${64 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('荷叶伞', W / 2, 130 * u); }
    // 片尾片名
    const ea = eOutCubic(inv(11.4, 12.0, t));
    if (ea > 0) {
      ctx.globalAlpha = ea; ctx.fillStyle = 'rgba(255,247,236,.85)'; rr(ctx, px + S * .15, py + S * .38, S * .7, S * .24, 30 * u); ctx.fill();
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `900 ${84 * u}px 'Noto Sans SC'`; ctx.fillText('荷叶伞', px + S / 2, py + S * .47);
      ctx.font = `400 ${28 * u}px 'Noto Sans SC'`; ctx.fillText('水果小剧场 · 第 1 集', px + S / 2, py + S * .555); ctx.globalAlpha = 1;
    }
    ctx.font = `400 ${18 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(59,42,34,.55)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(credits(s.A), W - 30 * u, H - 22 * u);
  }
});
