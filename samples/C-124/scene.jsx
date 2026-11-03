// C-124 平板黑板马克笔：用 Remotion（React 组件 + useCurrentFrame）画一块数位黑板——
// 纯黑底，3–6 px 圆头 SVG 单线笔画带轻微手抖，按说话的节奏一笔笔画出来（stroke-dashoffset 露出笔迹），
// 一支数位笔尖始终跟着笔头，白蓝绿黄红五色各有固定含义，手写标签，红色实心箭头像图章一样盖下。
// 风格提示词：用平板黑板马克笔风格：纯黑数位画板，3–6 px 圆头单线笔画带轻微手抖，按说话的速度一笔笔画出来，一支数位笔尖始终跟着笔头，白、蓝、绿、黄、红五色各有固定含义，手写标签，红色实心箭头像图章一样盖下，每块板只长一张图，只配人声。
// 题材：手绘与绘画 · 适合：技术原理、安全漏洞讲解、计算机科普
//
// Remotion 的许可证：个人、3 人以内的公司和非营利组织免费；更大的公司要向 Remotion 买授权。
// 见 https://www.remotion.dev/docs/license 。本仓库只用它出样片，没有商业用途。
import React from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';

export const id = 'C-124';
export const name = '平板黑板马克笔';
export const dur = 5;
export const fps = 30;
export const still = 4.2;

const C = { ink: '#F2F2F2', blue: '#5AA9FF', green: '#5BD6A0', yellow: '#FFD24A', red: '#FF5B5B' };

// 固定种子的随机数：手抖也要每次一样
const h1 = n => { let x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

// 一条带手抖的折线：从 (x0,y0) 到 (x1,y1)，沿途按 seed 抖一点
function wob(pts, seed, amp = 3) {
  return pts.map(([x, y], i) => [x + (h1(seed + i * 7.3) - .5) * amp * 2, y + (h1(seed + i * 3.1 + 99) - .5) * amp * 2]);
}
const toPath = pts => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const len = pts => pts.reduce((s, p, i) => i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);

// 矩形框（四角略过头，像手画的）
function boxPts(x, y, w, h, seed) {
  const o = 6;
  return wob([[x - o, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y - o]], seed, 2.5);
}
function roundPts(cx, cy, r, seed, n = 30) {
  return wob(Array.from({ length: n + 3 }, (_, k) => {
    const a = k / n * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * .92];
  }), seed, 2);
}

// 一笔：t0 秒开始，d 秒画完；返回 {path 元素, 笔尖位置或 null}
function Stroke({ pts, t, t0, d, color = C.ink, w = 5, fill = 'none', dash = null }) {
  const p = Math.max(0, Math.min(1, (t - t0) / d));
  if (p <= 0) return null;
  const L = len(pts) + 1;
  return <path d={toPath(pts)} fill={fill} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
    strokeDasharray={dash || L} strokeDashoffset={dash ? 0 : L * (1 - p)} opacity={dash && p < 1 ? p : 1} />;
}
function tipOf(list, t) {                                     // 笔尖：正在画的那一笔走到哪了
  for (const s of list) {
    const p = (t - s.t0) / s.d;
    if (p >= 0 && p < 1) {
      const L = len(s.pts) * p; let acc = 0;
      for (let i = 1; i < s.pts.length; i++) {
        const seg = Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
        if (acc + seg >= L) { const k = (L - acc) / seg; return [s.pts[i - 1][0] + (s.pts[i][0] - s.pts[i - 1][0]) * k, s.pts[i - 1][1] + (s.pts[i][1] - s.pts[i - 1][1]) * k]; }
        acc += seg;
      }
      return s.pts[s.pts.length - 1];
    }
  }
  return null;
}

export const Scene = ({ ar }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const t = frame / fps;
  const land = W > H, u = Math.min(W, H) / 1080;
  // 一块板只长一张图：浏览器 →（请求）→ 服务器，中间一把锁；最后红箭头盖在锁上
  const L = land
    ? { bx: W * .075, by: H * .33, sx: W * .585, sy: H * .33, bw: 460 * u, bh: 300 * u, title: [W * .5, H * .15] }
    : { bx: W * .10, by: H * .26, sx: W * .10, sy: H * .60, bw: 540 * u, bh: 330 * u, title: [W * .5, H * .13] };
  const S = [];                                                 // 笔画表：顺序就是说话的顺序
  const add = (pts, t0, d, color = C.ink, w = 5 * u, fill, dash) => { const s = { pts, t0, d, color, w, fill, dash }; S.push(s); return s; };
  // 1 标题下划线
  add(wob([[L.title[0] - 280 * u, L.title[1] + 30 * u], [L.title[0] + 280 * u, L.title[1] + 26 * u]], 3, 3), .35, .35, C.ink, 6 * u);
  // 2 浏览器框 + 窗口条
  add(boxPts(L.bx, L.by, L.bw, L.bh, 11), .75, .55, C.blue, 5 * u);
  add(wob([[L.bx, L.by + 46 * u], [L.bx + L.bw, L.by + 46 * u]], 17, 2), 1.3, .2, C.blue, 4 * u);
  // 3 服务器框 + 两条机架线
  add(boxPts(L.sx, L.sy, L.bw, L.bh, 23), 1.6, .5, C.green, 5 * u);
  add(wob([[L.sx + 20 * u, L.sy + 80 * u], [L.sx + L.bw - 20 * u, L.sy + 80 * u]], 29, 2), 2.05, .18, C.green, 4 * u);
  add(wob([[L.sx + 20 * u, L.sy + 140 * u], [L.sx + L.bw - 20 * u, L.sy + 140 * u]], 31, 2), 2.2, .18, C.green, 4 * u);
  // 4 请求箭头（黄）：从浏览器到服务器
  const a0 = land ? [L.bx + L.bw + 16 * u, L.by + L.bh * .45] : [L.bx + L.bw * .5, L.by + L.bh + 16 * u];
  const a1 = land ? [L.sx - 16 * u, L.sy + L.bh * .45] : [L.sx + L.bw * .5, L.sy - 16 * u];
  add(wob([a0, [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2 - (land ? 36 : 0) * u], a1], 41, 3), 2.45, .4, C.yellow, 5 * u);
  const ah = land ? [[a1[0] - 26 * u, a1[1] - 16 * u], a1, [a1[0] - 26 * u, a1[1] + 16 * u]] : [[a1[0] - 16 * u, a1[1] - 26 * u], a1, [a1[0] + 16 * u, a1[1] - 26 * u]];
  add(wob(ah, 43, 2), 2.8, .14, C.yellow, 5 * u);
  // 5 锁：挂在箭头中间
  const mx = (a0[0] + a1[0]) / 2, my = (a0[1] + a1[1]) / 2 + (land ? 70 : 0) * u + (land ? 0 : 0);
  add(boxPts(mx - 34 * u, my + 8 * u, 68 * u, 54 * u, 53), 3.0, .3, C.ink, 5 * u);
  add(wob([[mx - 20 * u, my + 8 * u], [mx - 20 * u, my - 16 * u], [mx + 20 * u, my - 16 * u], [mx + 20 * u, my + 8 * u]], 57, 2), 3.25, .22, C.ink, 5 * u);
  // 6 板底一句结论，带一条手画横线
  const noteY = land ? H * .83 : H * .90;
  add(wob([[W * .5 - 330 * u, noteY - 54 * u], [W * .5 + 330 * u, noteY - 58 * u]], 61, 3), 4.35, .3, C.ink, 4 * u);
  // 7 红箭头像图章一样盖在锁上
  const stampT = 3.9;
  const stamp = Math.max(0, Math.min(1, (t - stampT) / .22));
  const tip = tipOf(S, t);
  const fontH = `${Math.round(40 * u)}px "Noto Sans SC", sans-serif`;
  const label = (x, y, txt, color, t0, anchor = 'middle') => (t > t0 ?
    <text x={x} y={y} fill={color} fontSize={36 * u} fontFamily='"Noto Sans SC", sans-serif' textAnchor={anchor}
      opacity={Math.min(1, (t - t0) / .25)}>{txt}</text> : null);
  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect width={W} height={H} fill="#0A0A0A" />
        {/* 板上极淡的网格，像数位板 */}
        {Array.from({ length: Math.ceil(W / (80 * u)) }, (_, k) => <line key={'v' + k} x1={k * 80 * u} y1={0} x2={k * 80 * u} y2={H} stroke="#ffffff" strokeOpacity={.035} />)}
        {Array.from({ length: Math.ceil(H / (80 * u)) }, (_, k) => <line key={'h' + k} x1={0} y1={k * 80 * u} x2={W} y2={k * 80 * u} stroke="#ffffff" strokeOpacity={.035} />)}
        <text x={L.title[0]} y={L.title[1]} fill={C.ink} fontSize={76 * u} fontFamily='"Noto Sans SC", sans-serif' textAnchor="middle"
          opacity={Math.min(1, t / .3)}>请求为什么要加锁</text>
        {S.map((s, i) => <Stroke key={i} {...s} t={t} />)}
        {label(L.bx + L.bw / 2, L.by - 22 * u, '浏览器', C.blue, 1.35)}
        {label(L.sx + L.bw / 2, L.sy - 22 * u, '服务器', C.green, 2.25)}
        {label(mx + (land ? 0 : 120 * u), my + 104 * u, '明文会被看见', C.yellow, 3.45)}
        {stamp > 0 && (
          <g transform={`translate(${mx},${my + 34 * u}) scale(${1.6 - .6 * stamp}) rotate(-12)`} opacity={stamp}>
            <path d={`M${-120 * u},0 L${30 * u},0 M${30 * u},${-26 * u} L${80 * u},0 L${30 * u},${26 * u} Z`} fill={C.red} stroke={C.red} strokeWidth={10 * u} strokeLinejoin="round" />
          </g>
        )}
        {label(mx + (land ? 150 * u : 0), my + 34 * u - 50 * u, '上 HTTPS', C.red, 4.15, land ? 'start' : 'middle')}
        {label(W * .5, noteY, '没有锁就是明信片，加了锁才是信封', C.ink, 4.6)}
        {/* 笔尖：始终跟着正在画的那一笔 */}
        {tip && (
          <g transform={`translate(${tip[0]},${tip[1]})`}>
            <path d={`M0,0 L${16 * u},${30 * u} L${34 * u},${96 * u} L${46 * u},${84 * u} Z`} fill="#D9D9D9" opacity={.9} />
            <circle r={5 * u} fill="#fff" />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
