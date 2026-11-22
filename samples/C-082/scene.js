// C-082 霓虹流体：lib 里的 fluid2d 在 CPU 上解二维稳定流体（半拉格朗日平流、高斯-赛德尔投影、涡度增强把小涡旋补回来），速度网格 128×72、染料网格放大四倍；四个看不见的喷口沿李萨如曲线游走，一边走一边顺着方向推流体、吐橙红品红青四色染料，每拍（0.375 秒）挑一个喷口猛推一下；每帧都用 fluidAt 从 0 秒重推到当前时刻，所以每帧只由 t 决定；染料按 1-e^(-x) 压成发亮的颜色，放大铺满黑底，再叠一层缩小模糊的泛光，左上角是随节拍跳动数值的半透明参数面板。
// 风格提示词：用霓虹流体模拟风格：纯黑背景上 GPU 实时模拟的流体，染料是高饱和的橙、红、品红、青，边缘发光并卷成涡旋，随鼠标轨迹或音乐节拍被搅动，画面只有流体和一个极简半透明参数面板。
// 题材：3D 与实时图形 · 适合：科技品牌背景、音乐可视化、互动装置
const COLS = [[1.6, .55, .05], [1.5, .08, .12], [1.3, .05, 1.0], [.05, 1.0, 1.4]];
scene({
  id: 'C-082', name: '霓虹流体', dur: 5, still: 3.6,
  fonts: ["500 22px 'JetBrains Mono'"],
  init() {
    const F = LAND ? fluid2d({ w: 128, h: 72, dye: 4, fade: 1.1 }) : fluid2d({ w: 72, h: 128, dye: 4, fade: 1.1 });
    const em = (i, t) => {   // 第 i 个喷口在 t 秒的位置（0–1）
      const a = t * (.7 + i * .13) + i * 1.7, b = t * (.53 + i * .11) + i * 2.9;
      return [.5 + .36 * Math.sin(a), .5 + .34 * Math.sin(b * 1.3 + Math.cos(a) * .6)];
    };
    const forces = (F, t, dt) => {
      for (let i = 0; i < 4; i++) {
        const [x, y] = em(i, t), [x2, y2] = em(i, t + dt), vx = (x2 - x) / dt, vy = (y2 - y) / dt;
        fluidSplat(F, x, y, vx * F.w * 1.2, vy * F.h * 1.2, .025, COLS[i].map(c => c * dt * 2.6));
      }
      const beat = Math.floor(t / BEAT), lt = t - beat * BEAT;
      if (lt < dt * .99) {   // 每拍开头那一步猛推一下
        const i = Math.floor(hash1(beat * 7 + 3) * 4), [x, y] = em(i, t), ang = hash1(beat * 13 + 1) * TAU, sp = 260;
        fluidSplat(F, x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, .06, COLS[i].map(c => c * 1.4));
      }
    };
    const glow = mk(Math.round(W / 8), Math.round(H / 8));
    return { F, forces, glow };
  },
  draw(ctx, t, s, f) {
    const { F, forces, glow } = s, u = SHORT / 1080;
    fluidAt(F, t, forces);
    const img = fluidImage(F, 1.3);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, W, H);
    const g = glow.getContext('2d'); g.filter = 'blur(2px)'; g.drawImage(img, 0, 0, glow.width, glow.height); g.filter = 'none';
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .7; ctx.drawImage(glow, 0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // 参数面板
    const beat = Math.floor(t / BEAT), pulse = Math.exp(-(t - beat * BEAT) * 8);
    const px = 36 * u, py = (LAND ? 36 : 80) * u, pw = 330 * u, ph = 210 * u;
    ctx.fillStyle = 'rgba(255,255,255,.07)'; rr(ctx, px, py, pw, ph, 12 * u); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5 * u; ctx.stroke();
    ctx.font = `500 ${Math.round(20 * u)}px 'JetBrains Mono'`; ctx.textBaseline = 'middle';
    const rows = [['vorticity', 3 + pulse * 2, 6], ['dissipation', 1.1, 2], ['splat force', 260 * (.6 + .4 * pulse), 300], ['bpm', 160, 200]];
    rows.forEach(([n, v, mx], i) => {
      const y = py + 36 * u + i * 44 * u;
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.textAlign = 'left'; ctx.fillText(n, px + 18 * u, y);
      ctx.textAlign = 'right'; ctx.fillText(v >= 100 ? String(Math.round(v)) : v.toFixed(2), px + pw - 18 * u, y);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(px + 18 * u, y + 14 * u, pw - 36 * u, 3 * u);
      ctx.fillStyle = ['#ff8a1a', '#ff2a3a', '#ff2ad8', '#1ae8ff'][i]; ctx.fillRect(px + 18 * u, y + 14 * u, (pw - 36 * u) * v / mx, 3 * u);
    });
  }
});
