// T-013 发射多机位同步：Artemis I 发射的三路机位各从不同时刻剪起，sync.py 用三段现场声音的互相关算出时差；片头把三条声波按算出的时差对齐，之后按同一个任务时钟切换近景、塔架、远景；最后换到跟踪镜头，叠上 JPL Horizons 星历里猎户座飞船 25 天的真实地月轨迹和读数
// 素材：录像（NASA 影像库的同一次发射）、数据（sync.py 算出的时差，JPL Horizons 的飞船和月球星历）；配乐 CC0
const VIEWS = [['closeup', '近景', 'CLOSE-UP'], ['tower', '塔架 913 号机位', 'TOWER 913'], ['wide', '远景 · 39B 发射台', 'PAD 39B WIDE']];
const CUT = [[3.2, 0], [6.4, 1], [8.8, 2], [10.6, 3]];   // [片中起点, 第几路]，3 是跟踪镜头
const M0 = 7.0;                                          // 片中 t 秒 = 任务时间 t - M0 秒（多机位段）
const LAUNCH_JD = 2459899.78315;                         // 2022-11-16 06:47:44 UTC
scene({
  id: 'T-013', name: '发射多机位同步', dur: 14, still: 7.4,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'", "700 40px 'JetBrains Mono'"],
  text: '三路机位声音互相关对齐近景塔架号机位远景发射台倒计时归零跟踪镜头猎户座飞船任务第天距地球速度月球轨迹时间压缩相关录像星历配乐计算',
  async init() {
    const A = await loadAssets(), sync = JSON.parse(await loadText('sync.json'));
    const v = {};
    for (const [k] of VIEWS) v[k] = await loadVideo(`${k}.mp4`);
    v.track = await loadVideo('track.mp4');
    const orion = parseCSV(await loadText('orion.csv')), moon = parseCSV(await loadText('moon.csv'));
    let r = 0; for (const p of [...orion, ...moon]) r = Math.max(r, Math.hypot(p.x_km, p.y_km));
    return { A, sync, v, orion, moon, R: r };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, Y = '#ffcf3f', C = '#62d6ff', mono = "'JetBrains Mono'";
    const sy = s.sync, t0 = sy.t0;
    const viewT = (k, m) => m + t0 + sy.views[k].offset;      // 任务时间 m → 这一路素材里的秒数
    ctx.fillStyle = '#05070c'; ctx.fillRect(0, 0, W, H);
    let k = CUT.length - 1; while (k > 0 && CUT[k][0] > t) k--;
    const m = t - M0;
    if (t < 3.2) await intro(ctx, t, s, u);
    else if (CUT[k][1] < 3) {
      const [key, zh, en] = VIEWS[CUT[k][1]], vid = s.v[key];
      await vid.at(viewT(key, m));
      const z = 1 + .04 * inv(CUT[k][0], (CUT[k + 1] || [14])[0], t);
      drawCover(ctx, vid.el, 0, 0, W, H, { zoom: key === 'wide' ? 1.25 * z : z, fy: key === 'wide' ? .62 : .5 });
      const g = ctx.createLinearGradient(0, H * .6, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.7)'); ctx.fillStyle = g; ctx.fillRect(0, H * .6, W, H * .4);
      const fl = 1 - smooth(CUT[k][0], CUT[k][0] + .12, t); if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl * .5})`; ctx.fillRect(0, 0, W, H); }
      // 机位牌：名字 + 算出的时差
      const bx = 48 * u, by = H - (LAND ? 70 : 260) * u;
      ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      ctx.fillStyle = Y; ctx.fillRect(bx, by - 74 * u, 8 * u, 92 * u);
      ctx.font = `700 ${40 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff'; ctx.fillText(zh, bx + 26 * u, by - 30 * u);
      const off = sy.views[key].offset;
      ctx.font = `700 ${24 * u}px ${mono}`; ctx.fillStyle = C;
      ctx.fillText(`CAM ${CUT[k][1] + 1}/3 · ${en} · Δ${off >= 0 ? '+' : '−'}${Math.abs(off).toFixed(3)} s`, bx + 26 * u, by + 10 * u);
      ctx.restore();
      clock(ctx, m, u, mono, Y);
    } else await track(ctx, t, s, u, mono, C, Y);
    // 出处
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(credits(s.A), W - 24 * u, H - 18 * u); ctx.restore();
  },
});

// 任务时钟：右上角
function clock(ctx, m, u, mono, Y) {
  const a = Math.abs(m), sg = m < 0 ? '−' : '+';
  const txt = `T${sg}${String(Math.floor(a / 60)).padStart(2, '0')}:${(a % 60).toFixed(1).padStart(4, '0')}`;
  ctx.save(); ctx.font = `700 ${(LAND ? 54 : 60) * u}px ${mono}`; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  const x = W - 48 * u, y = (LAND ? 40 : 120) * u, w = ctx.measureText(txt).width;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(ctx, x - w - 28 * u, y - 12 * u, w + 52 * u, 84 * u, 10 * u); ctx.fill();
  ctx.fillStyle = m < 0 ? '#fff' : Y; ctx.fillText(txt, x, y);
  ctx.font = `400 ${18 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('任务时钟 · 三路共用', x, y + 76 * u);
  ctx.restore();
}

// 片头：三条声波先各自从剪辑起点排开，再按互相关算出的时差滑到对齐，竖线标出倒计时归零
async function intro(ctx, t, s, u) {
  const sy = s.sync, hop = sy.hop, Y = '#ffcf3f', C = '#62d6ff';
  // 缩略图的画面：各路在「对齐后的同一时刻」（T−4 秒）的那一帧；先都取好，再一次画完
  const frames = [];
  for (const [key] of VIEWS) { await s.v[key].at(-4 + sy.t0 + sy.views[key].offset); const c = mk(320, 180); drawCover(c.getContext('2d'), s.v[key].el, 0, 0, 320, 180); frames.push(c); }
  const fadeOut = 1 - smooth(2.95, 3.2, t);
  ctx.save(); ctx.globalAlpha = fadeOut;
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const L = 56 * u, top = LAND ? 120 * u : 470 * u;
  ctx.font = `900 ${(LAND ? 56 : 64) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff'; ctx.fillText('三路机位，先用声音对齐', L, top);
  ctx.font = `400 ${26 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fillText('各路的现场声音两两做互相关，峰值所在就是时差', L, top + 50 * u);
  const thumbW = LAND ? 240 * u : 300 * u, thumbH = thumbW * 9 / 16, rowH = thumbH + (LAND ? 40 : 150) * u;
  const x0 = LAND ? L + thumbW + 30 * u : L, wW = (LAND ? W - x0 - 60 * u : W - 2 * L), span = 16;   // 横轴：近景素材的 0–16 秒
  const slide = eInOutCubic(inv(1.2, 2.2, t));
  VIEWS.forEach(([key, zh], i) => {
    const y = top + 100 * u + i * rowH, v = sy.views[key], sh = -v.offset * slide;   // 对齐后这一路要往后挪 −offset 秒
    // 声波
    const wy = LAND ? y + thumbH / 2 : y + thumbH + 46 * u, amp = (LAND ? thumbH * .42 : 38 * u);
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, wy); ctx.lineTo(x0 + wW, wy); ctx.stroke();
    const show = smooth(.2 + i * .15, .7 + i * .15, t);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, wy - amp - 4, wW * show, amp * 2 + 8); ctx.clip();
    ctx.fillStyle = i === 0 ? Y : C;
    v.env.forEach((e, j) => {
      const c = j * hop + sh, x = x0 + c / span * wW; if (x < x0 || x > x0 + wW) return;
      const hgt = Math.max(1, e * amp); ctx.fillRect(x, wy - hgt, Math.max(1, wW / span * hop * .7), hgt * 2);
    });
    ctx.restore();
    ctx.font = `700 ${22 * u}px 'JetBrains Mono'`; ctx.fillStyle = i === 0 ? Y : C; ctx.textAlign = 'right';
    const lab = i === 0 ? '基准' : `Δ ${v.offset.toFixed(3)} s · 相关 ${v.corr.toFixed(2)}`;
    ctx.globalAlpha = fadeOut * (i === 0 ? show : smooth(1.6, 2.2, t));
    ctx.fillText(lab, x0 + wW, LAND ? y - 6 * u : wy - amp - 10 * u);
    ctx.globalAlpha = fadeOut; ctx.textAlign = 'left';
    // 缩略图（横屏在声波左边，竖屏在上面）
    {
      const tx = L, tyy = y;
      ctx.font = `700 ${22 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff';
      ctx.fillText(zh, LAND ? tx : tx + thumbW + 20 * u, LAND ? tyy + thumbH + 28 * u : tyy + 34 * u);
    }
  });
  frames.forEach((c, i) => {
    const y = top + 100 * u + i * rowH;
    ctx.save(); ctx.beginPath(); rr(ctx, L, y, thumbW, thumbH, 8 * u); ctx.clip(); ctx.drawImage(c, L, y, thumbW, thumbH); ctx.restore();
  });
  // 倒计时归零的竖线
  const al = smooth(2.2, 2.5, t);
  if (al > 0) {
    const x = x0 + sy.t0 / span * wW, yA = top + 90 * u, yB = top + 100 * u + 3 * rowH - (LAND ? 30 : 0) * u;
    ctx.globalAlpha = fadeOut * al; ctx.strokeStyle = '#ff5a4e'; ctx.lineWidth = 3 * u; ctx.setLineDash([10 * u, 8 * u]);
    ctx.beginPath(); ctx.moveTo(x, yA); ctx.lineTo(x, yB); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = `700 ${24 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#ff5a4e'; ctx.textAlign = 'center'; ctx.fillText('T0 倒计时归零', x, yB + 34 * u);
  }
  ctx.restore();
}

// 跟踪镜头 + 星历轨迹：25 天压进 3 秒
async function track(ctx, t, s, u, mono, C, Y) {
  await s.v.track.at(t - 10.6);
  ctx.save(); ctx.filter = `brightness(${lerp(1, .55, smooth(10.8, 11.3, t))})`;
  drawCover(ctx, s.v.track.el, 0, 0, W, H, { zoom: 1 + .05 * inv(10.6, 14, t) }); ctx.filter = 'none'; ctx.restore();
  const a = smooth(10.9, 11.3, t);
  const px = LAND ? W * .46 : 40 * u, py = LAND ? 70 * u : H * .4, pw = LAND ? W * .5 : W - 80 * u, ph = LAND ? H - 160 * u : H * .44;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(4,8,18,.82)'; rr(ctx, px, py, pw, ph, 18 * u); ctx.fill();
  ctx.strokeStyle = 'rgba(98,214,255,.35)'; ctx.lineWidth = 2 * u; ctx.stroke();
  const day = 25.4 * eInOutCubic(inv(11.1, 13.6, t)), jd = LAUNCH_JD + day;
  const cx = px + pw * .42, cy = py + ph * .52, sc = Math.min(pw, ph) * .44 / s.R;
  const P = p => [cx + p.x_km * sc, cy - p.y_km * sc];
  // 月球的路径（虚线）、飞船走过的路径（实线）
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5 * u; ctx.setLineDash([4 * u, 6 * u]); ctx.beginPath();
  s.moon.forEach((p, i) => { const [x, y] = P(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.setLineDash([]);
  const done = s.orion.filter(p => p.jd <= jd);
  ctx.strokeStyle = C; ctx.lineWidth = 3 * u; ctx.beginPath();
  done.forEach((p, i) => { const [x, y] = P(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
  ctx.fillStyle = '#4f8cff'; ctx.beginPath(); ctx.arc(cx, cy, 12 * u, 0, TAU); ctx.fill();
  const mi = Math.min(s.moon.length - 1, Math.max(0, s.moon.findIndex(p => p.jd > jd))), mp = P(s.moon[mi]);
  ctx.fillStyle = '#d9d9d9'; ctx.beginPath(); ctx.arc(mp[0], mp[1], 8 * u, 0, TAU); ctx.fill();
  const cur = done[done.length - 1] || s.orion[0];
  const [ox, oy] = P(cur); ctx.fillStyle = Y; ctx.beginPath(); ctx.arc(ox, oy, 7 * u, 0, TAU); ctx.fill();
  ctx.font = `700 ${18 * u}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#9fb3d9'; ctx.fillText('地球', cx + 18 * u, cy); ctx.fillText('月球', mp[0] + 14 * u, mp[1]);
  // 读数
  const dist = Math.hypot(cur.x_km, cur.y_km, cur.z_km), vel = Math.hypot(cur.vx_kms, cur.vy_kms, cur.vz_kms);
  const rx = LAND ? px + 36 * u : px + 36 * u, ry = py + 56 * u;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `900 ${30 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff'; ctx.fillText('猎户座飞船 · 真实轨迹', rx, ry);
  ctx.font = `400 ${18 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillText('JPL Horizons 星历，2 小时一点；25 天压进 3 秒', rx, ry + 32 * u);
  [['任务第', day.toFixed(1), '天'], ['距地球', Math.round(dist).toLocaleString('en-US'), 'km'], ['速度', vel.toFixed(2), 'km/s']].forEach(([l, v, un], i) => {
    const yy = py + ph - (LAND ? 170 : 150) * u + i * 50 * u;
    ctx.font = `400 ${22 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(l, rx, yy);
    ctx.font = `700 ${34 * u}px ${mono}`; ctx.fillStyle = i ? C : Y; ctx.fillText(v, rx + 90 * u, yy);
    const vw = ctx.measureText(v).width; ctx.font = `400 ${20 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(un, rx + 100 * u + vw, yy);
  });
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 1 - a * .0; ctx.font = `700 ${22 * u}px ${mono}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('CAM 4 · TRACKING', 48 * u, LAND ? 60 * u : 140 * u); ctx.restore();
}
