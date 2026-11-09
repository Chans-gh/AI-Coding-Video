// G-018 双人播客声波：两位虚构主持人的插画头像一左一右（竖屏一上一下）；init 里用 Web Audio 把两段旁白解码成波形，算出每 1/60 秒的音量包络；谁在说话，谁的头像外圈一圈声波柱跟着音量起伏、亮起，另一位变暗；下面字幕按逐字时间点亮；答到金句时弹出金句卡，结尾落节目名和期数
// 素材：生图 2 张（头像）、语音合成 2 段（一问一答，两种公开音色）；配乐 CC0。声波、字幕、卡片都是 Canvas 2D 画的
const FPS_ENV = 60;
async function envelope(name) {                           // 音频 → 每帧的音量（RMS，归一到 0–1）
  const buf = await xhr(asset(name), 'arraybuffer');
  const ac = new OfflineAudioContext(1, 44100, 44100), au = await ac.decodeAudioData(buf);
  const d = au.getChannelData(0), n = Math.floor(au.sampleRate / FPS_ENV), out = [];
  for (let i = 0; i + n <= d.length; i += n) { let s = 0; for (let j = i; j < i + n; j++) s += d[j] * d[j]; out.push(Math.sqrt(s / n)); }
  const mx = Math.max(...out) || 1;
  return out.map(v => Math.min(1, v / mx * 1.2));
}
scene({
  id: 'G-018', name: '双人播客声波', dur: 15, still: 9.2,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'"],
  text: '今天聊个扎心的问题每天只睡六小时真够吗？说实话大多数成年人需要七到九个睡觉不是浪费时间，是大脑在给自己扫除阿橙林医生主持嘉宾睡前十分钟第期本金句插画生成旁白合成配乐',
  async init() {
    const A = await loadAssets();
    const [a, b] = await Promise.all([loadImage('host_a.jpg'), loadImage('host_b.jpg')]);
    const vo = ['vo_a.mp3', 'vo_b.mp3'].map(f => A.items.find(i => i.file === 'assets/' + f));
    const env = await Promise.all(['vo_a.mp3', 'vo_b.mp3'].map(envelope));
    return { A, img: [a, b], vo, env, quote: cueTime(A, '大扫除', 11.4) };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, BG = '#141a2e', GOLD = '#f2c14e', COL = ['#ff8a3d', '#3ec6c0'], NAME = [['阿橙', '主持'], ['林医生', '嘉宾']];
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H * .45, 0, W / 2, H * .45, Math.max(W, H) * .6);
    g.addColorStop(0, 'rgba(70,90,160,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const lv = k => { const v = s.vo[k], e = s.env[k], i = Math.floor((t - v.at) * FPS_ENV); return i >= 0 && i < e.length ? e[i] : 0; };
    const endP = eOutCubic(inv(13.4, 14, t));                 // 片尾：头像收小，落节目名
    const qp = t < s.quote ? 0 : eOutBack(inv(s.quote, s.quote + .5, t)) * (1 - inv(13.2, 13.5, t));
    // 节目名
    ctx.textAlign = 'center'; ctx.globalAlpha = eOutCubic(inv(0, .6, t)) * (1 - endP);
    ctx.font = `400 ${(LAND ? 30 : 34) * u}px 'Bebas Neue'`; ctx.fillStyle = GOLD; ctx.fillText('SLEEP TALK · EP.12', W / 2, (LAND ? 80 : 150) * u);
    ctx.font = `700 ${(LAND ? 34 : 40) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff'; ctx.fillText('睡前十分钟 · 第 12 期', W / 2, (LAND ? 128 : 205) * u);
    ctx.globalAlpha = 1;
    // 两位主持人
    const R = (LAND ? 175 : 190) * u;
    for (let k = 0; k < 2; k++) {
      const x = LAND ? W * (k ? .68 : .32) : W / 2, y = LAND ? H * .45 : H * (k ? .585 : .3);
      // 说话与否平滑过渡
      const v = s.vo[k], fadeIn = inv(v.at - .25, v.at + .05, t), fadeOut = 1 - inv(v.at + v.dur - .1, v.at + v.dur + .25, t), hot = Math.min(fadeIn, fadeOut);
      const a0 = eOutBack(inv(.2 + k * .15, .8 + k * .15, t)) * (1 - .55 * endP);
      if (a0 <= 0) continue;
      ctx.save(); ctx.translate(x, y); ctx.scale(a0, a0);
      // 声波柱：一圈 72 根，每根取稍早一点的音量，像一圈在转的波形
      const N = 72, lvl = lv(k);
      for (let i = 0; i < N; i++) {
        const ang = i / N * TAU - TAU / 4, back = Math.floor(Math.abs(Math.sin(i * 1.7)) * 9 + i % 6);
        const ix = Math.floor((t - v.at) * FPS_ENV) - back, e = ix >= 0 && ix < s.env[k].length ? s.env[k][ix] : 0;
        const len = (6 + (hot * e * (.7 + .3 * hash1(i * 13 + k))) * 70) * u;
        ctx.strokeStyle = rgba(hex2rgb(COL[k]), .25 + .75 * hot); ctx.lineWidth = 6 * u; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(Math.cos(ang) * (R + 22 * u), Math.sin(ang) * (R + 22 * u));
        ctx.lineTo(Math.cos(ang) * (R + 22 * u + len), Math.sin(ang) * (R + 22 * u + len)); ctx.stroke();
      }
      // 头像：说话的人发光，另一位变暗
      ctx.shadowColor = COL[k]; ctx.shadowBlur = hot * (30 + 40 * lvl) * u;
      ctx.beginPath(); ctx.arc(0, 0, R + 8 * u, 0, TAU); ctx.fillStyle = hot > .01 ? COL[k] : '#2a3150'; ctx.fill(); ctx.shadowBlur = 0;
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
      const sc = 1 + .03 * hot * lvl; ctx.drawImage(s.img[k], -R * sc, -R * sc, 2 * R * sc, 2 * R * sc);
      ctx.fillStyle = `rgba(20,26,46,${.55 * (1 - hot)})`; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.restore();
      // 名牌
      const ny = R + (LAND ? 120 : 70) * u, nx = 0;
      {
        ctx.font = `700 ${(LAND ? 40 : 36) * u}px 'Noto Sans SC'`; ctx.textAlign = 'center';
        const lab = `${NAME[k][0]} · ${NAME[k][1]}`, tw = ctx.measureText(lab).width + 50 * u;
        ctx.fillStyle = hot > .01 ? rgba(hex2rgb(COL[k]), .2 + .8 * hot) : 'rgba(255,255,255,.08)';
        rr(ctx, nx - tw / 2, ny - 40 * u, tw, 58 * u, 29 * u); ctx.fill();
        ctx.fillStyle = hot > .5 ? BG : 'rgba(255,255,255,.7)'; ctx.fillText(lab, nx, ny + 2 * u);
      }
      ctx.restore();
    }
    // 字幕：逐字点亮
    const c = cueAt(s.A, t);
    if (c && qp <= 0 && endP <= 0) {
      const size = 46 * u; ctx.font = `700 ${size}px 'Noto Sans SC'`; ctx.textBaseline = 'middle';
      const lines = wrapCJK(ctx, c.text, LAND ? W * .7 : W - 140 * u), y0 = LAND ? H * .87 : H * .82, lh = size * 1.4;
      const total = c.text.length; let k = 0;
      const lit = c.p * total * 1.08;
      lines.forEach((l, li) => {
        const lw = ctx.measureText(l).width; let x = W / 2 - lw / 2; ctx.textAlign = 'left';
        for (const ch of l) {
          ctx.fillStyle = k < lit ? '#fff' : 'rgba(255,255,255,.3)';
          ctx.fillText(ch, x, y0 + (li - (lines.length - 1) / 2) * lh); x += ctx.measureText(ch).width; k++;
        }
      });
      ctx.textBaseline = 'alphabetic';
    }
    // 金句卡
    if (qp > 0) {
      const cw = LAND ? W * .56 : W - 120 * u, ch = (LAND ? 300 : 380) * u, cx = W / 2, cy = LAND ? H * .5 : H * .45;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(qp, qp); ctx.rotate(-.02);
      ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 50 * u; ctx.fillStyle = GOLD; rr(ctx, -cw / 2, -ch / 2, cw, ch, 26 * u); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = BG; ctx.textAlign = 'center';
      ctx.font = `400 ${150 * u}px 'Bebas Neue'`; ctx.globalAlpha = .18; ctx.fillText('“', -cw / 2 + 80 * u, -ch / 2 + 140 * u); ctx.globalAlpha = 1;
      ctx.font = `900 ${(LAND ? 60 : 62) * u}px 'Noto Sans SC'`;
      const ls = LAND ? ['睡觉，是大脑在给自己', '大扫除'] : ['睡觉，', '是大脑在给自己', '大扫除'];
      ls.forEach((l, i) => ctx.fillText(l, 0, -ch / 2 + (LAND ? 115 : 110) * u + i * 80 * u));
      ctx.font = `700 ${28 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(20,26,46,.7)'; ctx.fillText('— 林医生 · 本期金句', 0, ch / 2 - 36 * u);
      ctx.restore();
    }
    // 片尾
    if (endP > 0) {
      ctx.fillStyle = `rgba(20,26,46,${.75 * endP})`; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = endP; ctx.textAlign = 'center';
      ctx.font = `400 ${(LAND ? 44 : 48) * u}px 'Bebas Neue'`; ctx.fillStyle = GOLD; ctx.fillText('SLEEP TALK · EP.12', W / 2, H / 2 - 90 * u);
      ctx.font = `900 ${(LAND ? 110 : 116) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff'; ctx.fillText('睡前十分钟', W / 2, H / 2 + 40 * u);
      ctx.font = `700 ${(LAND ? 36 : 38) * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('第 12 期 · 每天只睡六小时，够吗？', W / 2, H / 2 + 120 * u);
      ctx.globalAlpha = 1;
    }
    ctx.font = `400 ${(LAND ? 16 : 15) * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 24 * u, H - 18 * u);
  }
});
