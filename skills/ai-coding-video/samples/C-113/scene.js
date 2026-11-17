// C-113 翻牌显示板：Canvas 2D 把每一格画成上下两片翻片，中缝画铰链；每格按列、行错开起翻，按固定步长依次翻过一串字（数字格翻数字、汉字格翻字库），每一步上半片朝铰链压扁、下半片再展开，两次换屏都由 t 算出翻到哪一片；顶部站名和走动的钟，状态灯其中一盏琥珀色在闪。
// 风格提示词：用翻牌显示板风格：车站出发信息牌，深色底板上一格格带铰链缝的翻片，文字逐列哗啦翻过字母表后停在新消息上，表格列出时间、目的地、站台和状态，琥珀、绿、红三色状态灯其中一盏在闪，顶部有站名和走动的钟，每次翻片都配密集的咔哒声。
// 题材：平面设计与动态排版 · 适合：发布公告、行程安排、版本更新
scene({
  id: 'C-113', name: '翻牌显示板', dur: 4.8, still: 2.2,
  fonts: ["700 80px 'Noto Sans SC'", "700 80px 'JetBrains Mono'"],
  text: '上海虹桥杭州东站南京南站苏州北站合肥南站无锡东站嘉兴南站检票准点晚点已发中央站出发时间目的地站台状态CENTRALDEPARTURES北京广州武汉成都西安重庆天津长沙青岛厦门',
  init() {
    const S1 = [['08:45', '上海虹桥', '03', '检票'], ['09:02', '杭州东站', '07', '准点'], ['09:15', '南京南站', '01', '准点'], ['09:30', '苏州北站', '12', '晚点'], ['09:48', '合肥南站', '05', '准点'], ['10:05', '无锡东站', '09', '准点']];
    const S2 = [['09:02', '杭州东站', '07', '检票'], ['09:15', '南京南站', '01', '准点'], ['09:30', '苏州北站', '12', '晚点'], ['09:48', '合肥南站', '05', '准点'], ['10:05', '无锡东站', '09', '准点'], ['10:20', '嘉兴南站', '04', '准点']];
    return { S1, S2, rows: LAND ? 5 : 6 };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    ctx.fillStyle = '#1B1D22'; ctx.fillRect(0, 0, W, H);
    const ZH = '北京广州武汉成都西安重庆天津长沙青岛厦门上海杭州南京苏州合肥无锡嘉兴准点晚点检票已发东站南虹桥';
    const DG = '0123456789:';
    // 列：每行 13 格 + 3 个空档
    const groups = [5, 4, 2, 2], gapW = .55;
    const nCells = 13 + 3 * gapW + .9;                       // .9 留给状态灯
    const bx = (LAND ? 90 : 36) * u, bw = W - 2 * bx;
    const cw = bw / nCells, ch = cw * (LAND ? 1.05 : 1.55), rg = ch * (LAND ? .16 : .32);
    const top = (LAND ? 270 : 820) * u;
    const PH = [.25, 2.75];                                   // 两次换屏
    const cellChar = (str, k) => str[k] === undefined ? ' ' : str[k];
    // 每一格：起翻时刻、翻的步数、要经过的字
    const flapAt = (r, c, isZh, from, to) => {
      const pool = isZh ? ZH : DG;
      const seqFor = (ph, a, b) => {
        const n = a === b ? 0 : 5 + Math.floor(hash2(r * 31 + c, ph * 7) * 7), seq = [a];
        for (let i = 1; i < n; i++) seq.push(pool[Math.floor(hash2(r * 13 + c * 7 + i, ph) * pool.length)]);
        seq.push(b); return seq;
      };
      const s1 = seqFor(1, ' ', from), s2 = seqFor(2, from, to), d = .05;
      for (const [ph, seq] of [[PH[1], s2], [PH[0], s1]]) {
        const t0 = ph + c * .045 + r * .07;
        if (t >= t0 && seq.length > 1) {
          const k = (t - t0) / d, i = Math.floor(k);
          if (i >= seq.length - 1) return { cur: seq[seq.length - 1], nxt: null, p: 0 };
          return { cur: seq[i], nxt: seq[i + 1], p: k - i };
        }
        if (ph === PH[0] && t < t0) return { cur: ' ', nxt: null, p: 0 };
      }
      return { cur: from, nxt: null, p: 0 };
    };
    const drawHalf = (x, y, ch_, upper, scaleY, isZh) => {
      ctx.save(); ctx.beginPath();
      const hy = y + ch / 2;
      if (upper) ctx.rect(x, y, cw, ch / 2); else ctx.rect(x, hy, cw, ch / 2);
      ctx.clip();
      ctx.translate(0, hy); ctx.scale(1, scaleY); ctx.translate(0, -hy);
      const g = ctx.createLinearGradient(0, y, 0, y + ch);
      g.addColorStop(0, '#34373F'); g.addColorStop(.5, '#2A2C33'); g.addColorStop(.5, '#23252B'); g.addColorStop(1, '#1D1F24');
      ctx.fillStyle = g; rr(ctx, x, y, cw, ch, cw * .08); ctx.fill();
      if (ch_ !== ' ') {
        ctx.fillStyle = '#F2EEE3';
        ctx.font = isZh ? `700 ${Math.round(cw * .78)}px 'Noto Sans SC'` : `700 ${Math.round(cw * .95)}px 'JetBrains Mono'`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch_, x + cw / 2, hy + cw * .03);
      }
      // 翻到一半时暗一点
      if (scaleY < 1) { ctx.fillStyle = `rgba(0,0,0,${(1 - scaleY) * .5})`; ctx.fillRect(x, y, cw, ch); }
      ctx.restore();
    };
    const cell = (x, y, f, isZh) => {
      if (!f.nxt) { drawHalf(x, y, f.cur, true, 1, isZh); drawHalf(x, y, f.cur, false, 1, isZh); }
      else {
        drawHalf(x, y, f.nxt, true, 1, isZh);                  // 后面露出的新字上半
        drawHalf(x, y, f.cur, false, 1, isZh);                 // 旧字下半
        if (f.p < .5) drawHalf(x, y, f.cur, true, Math.cos(f.p * Math.PI), isZh);   // 上片往下翻
        else drawHalf(x, y, f.nxt, false, -Math.cos(f.p * Math.PI), isZh);         // 翻下来成为下片
      }
      // 铰链缝和两侧小轴
      ctx.fillStyle = '#0B0C0E'; ctx.fillRect(x, y + ch / 2 - 1.5 * u, cw, 3 * u);
      ctx.fillStyle = '#4A4D55'; ctx.fillRect(x - 2 * u, y + ch / 2 - 5 * u, 4 * u, 10 * u); ctx.fillRect(x + cw - 2 * u, y + ch / 2 - 5 * u, 4 * u, 10 * u);
    };
    // 底板
    ctx.fillStyle = '#0E0F12'; rr(ctx, bx - 26 * u, top - 90 * u, bw + 52 * u, s.rows * (ch + rg) + 110 * u, 18 * u); ctx.fill();
    // 表头
    ctx.font = `700 ${Math.round(26 * u)}px 'Noto Sans SC'`; ctx.fillStyle = '#F4B63A'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const colX = [];
    { let x = bx; groups.forEach((n, gi) => { colX.push(x); x += n * cw + gapW * cw; if (gi === 2) x += .9 * cw; }); }
    ['时间', '目的地', '站台', '状态'].forEach((h, i) => ctx.fillText(h, colX[i], top - 34 * u));
    for (let r = 0; r < s.rows; r++) {
      const y = top + r * (ch + rg), a = s.S1[r], b = s.S2[r];
      let ci = 0;
      groups.forEach((n, gi) => {
        for (let k = 0; k < n; k++) {
          const isZh = gi === 1 || gi === 3;
          cell(colX[gi] + k * cw, y, flapAt(r, ci, isZh, cellChar(a[gi], k), cellChar(b[gi], k)), isZh);
          ci++;
        }
      });
      // 状态灯：按当前显示的状态取色，检票那一盏闪
      const st = t < PH[1] + .6 ? a[3] : b[3];
      const on = t > PH[0] + .9;
      const col = st === '检票' ? [255, 176, 40] : st === '晚点' ? [235, 64, 52] : [60, 210, 110];
      const blink = st === '检票' ? (Math.sin(t * 9) > 0 ? 1 : .2) : 1;
      const lx = colX[3] - .55 * cw, ly = y + ch / 2;
      ctx.fillStyle = '#050506'; ctx.beginPath(); ctx.arc(lx, ly, cw * .24, 0, TAU); ctx.fill();
      if (on) {
        const gl = ctx.createRadialGradient(lx, ly, 0, lx, ly, cw * .6);
        gl.addColorStop(0, rgba(col, .9 * blink)); gl.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(lx, ly, cw * .6, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(col.map(v => Math.min(255, v + 60)), blink); ctx.beginPath(); ctx.arc(lx, ly, cw * .17, 0, TAU); ctx.fill();
      }
    }
    // 顶部：站名 + 走动的钟
    const hy = (LAND ? 120 : 160) * u;
    ctx.textAlign = LAND ? 'left' : 'center'; ctx.fillStyle = '#F2EEE3';
    ctx.font = `700 ${Math.round((LAND ? 64 : 70) * u)}px 'Noto Sans SC'`; ctx.fillText('中央站 出发', LAND ? bx : W / 2, hy);
    ctx.font = `700 ${Math.round(26 * u)}px 'JetBrains Mono'`; ctx.fillStyle = '#8C8F98'; ctx.fillText('CENTRAL STATION · DEPARTURES', LAND ? bx : W / 2, hy + 42 * u);
    const sec = 23 + t, cx = LAND ? W - bx - 60 * u : W / 2, cy = LAND ? hy - 20 * u : 430 * u, R = (LAND ? 56 : 150) * u;
    ctx.fillStyle = '#F2EEE3'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1B1D22'; ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * .78, cy + Math.sin(a) * R * .78); ctx.lineTo(cx + Math.cos(a) * R * .92, cy + Math.sin(a) * R * .92); ctx.stroke(); }
    const hand = (a, len, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len); ctx.stroke(); };
    hand((8 + 41 / 60) / 12 * TAU, R * .5, 6 * u, '#1B1D22');
    hand((41 + sec / 60) / 60 * TAU, R * .75, 4 * u, '#1B1D22');
    hand(Math.floor(sec) / 60 * TAU + eOutBack(clamp((sec % 1) / .2), 3) / 60 * TAU, R * .85, 2 * u, '#D7262B');
    ctx.font = `700 ${Math.round(40 * u)}px 'JetBrains Mono'`; ctx.fillStyle = '#F4B63A'; ctx.textAlign = LAND ? 'right' : 'center';
    ctx.fillText(`08:41:${String(Math.floor(sec)).padStart(2, '0')}`, LAND ? cx - R - 24 * u : cx, LAND ? cy + 14 * u : cy + R + 64 * u);
    if (!LAND) { ctx.font = `700 ${Math.round(34 * u)}px 'Noto Sans SC'`; ctx.fillStyle = '#8C8F98'; ctx.fillText('请提前 15 分钟到站台检票', W / 2, H - 200 * u); }
  }
});
