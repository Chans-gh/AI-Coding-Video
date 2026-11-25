// C-196 Hydra 视觉反馈合成：真实 hydra-synth WebGL 振荡器、万花筒与色彩调制 + 模块化信号流 HUD

scene({
  id: 'C-196',
  name: 'Hydra 视觉反馈合成',
  dur: 4,
  still: 2.1,
  libs: ['hydra'],
  fonts: ['Noto Sans SC', 'JetBrains Mono'],

  init() {
    const hw = LAND ? 960 : 540;
    const hh = LAND ? 540 : 960;
    const hCanvas = document.createElement('canvas');
    hCanvas.width = hw;
    hCanvas.height = hh;

    // Initialize real hydra-synth in deterministic manual-tick mode
    const hydra = new Hydra({
      canvas: hCanvas,
      width: hw,
      height: hh,
      detectAudio: false,
      makeGlobal: false,
      autoLoop: false,
      precision: 'mediump',
    });

    const s = hydra.synth;
    // Live-coded Hydra patch: dual oscillator interference + voronoi warp + kaleidoscope + colorama
    s.osc(11, 0.16, 1.35)
      .color(0.95, 0.32, 0.88)
      .rotate(() => 0.25 + Math.sin(s.time * 0.9) * 0.45)
      .modulate(
        s.voronoi(6, 0.45, 0.35).rotate(() => s.time * 0.22),
        () => 0.28 + 0.18 * Math.sin(s.time * 1.4)
      )
      .kaleid(() => (s.time < 2.0 ? 5 : 7))
      .diff(
        s.osc(18, -0.12, 0.9)
          .color(0.14, 0.86, 0.98)
          .rotate(() => -s.time * 0.35)
          .scale(() => 1.05 + 0.15 * Math.cos(s.time * 1.8))
      )
      .contrast(1.22)
      .saturate(1.28)
      .out(s.o0);

    return { hydra, s, hCanvas };
  },

  draw(ctx, t, st) {
    const { hydra, s, hCanvas } = st;
    const sc = SHORT / 1080;

    // Deterministically advance Hydra internal clock to exact time t
    s.time = t;
    hydra.tick(1000 / FPS);

    ctx.fillStyle = '#07090f';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(hCanvas, 0, 0, W, H);

    // Subtle scanline & vignette for analog video-synth depth
    ctx.fillStyle = 'rgba(6,8,16,0.16)';
    for (let y = 0; y < H; y += Math.max(3, Math.round(4 * sc))) {
      ctx.fillRect(0, y, W, 1);
    }
    vignette(ctx, 0.48, 0.35, '5,7,14');

    const pad = (LAND ? 46 : 36) * sc;

    // Top-left live-code patch display
    const codeW = (LAND ? 520 : W - pad * 2) * sc;
    const codeH = (LAND ? 148 : 156) * sc;
    ctx.save();
    ctx.fillStyle = 'rgba(7,10,20,0.78)';
    rr(ctx, pad, pad, codeW, codeH, 12 * sc);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56,189,248,0.5)';
    ctx.lineWidth = 1.4 * sc;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.font = `700 ${15 * sc}px "JetBrains Mono", monospace`;
    ctx.fillText('HYDRA-SYNTH · LIVE PATCH [o0]', pad + 18 * sc, pad + 28 * sc);

    const kVal = t < 2.0 ? 5 : 7;
    const modAmt = (0.28 + 0.18 * Math.sin(t * 1.4)).toFixed(2);
    const lines = [
      'osc(11, 0.16, 1.35).color(0.95, 0.32, 0.88)',
      `  .modulate(voronoi(6, 0.45), ${modAmt})`,
      `  .kaleid(${kVal}).diff(osc(18, -0.12, 0.9))`,
      '  .contrast(1.22).saturate(1.28).out(o0)',
    ];
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `500 ${14 * sc}px "JetBrains Mono", monospace`;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, pad + 18 * sc, pad + (56 + i * 22) * sc);
    });
    ctx.restore();

    // Bottom bar: modular signal chain nodes + real-time oscillator waveform
    const barH = (LAND ? 92 : 112) * sc;
    const barY = H - pad - barH;
    const barW = W - pad * 2;
    ctx.save();
    ctx.fillStyle = 'rgba(7,10,20,0.78)';
    rr(ctx, pad, barY, barW, barH, 12 * sc);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,121,249,0.45)';
    ctx.lineWidth = 1.3 * sc;
    ctx.stroke();

    const nodes = ['OSC(11)', 'VORONOI', `KALEID(${kVal})`, 'DIFF', 'OUT(o0)'];
    const nodeW = (LAND ? 116 : 92) * sc;
    const nodeH = 34 * sc;
    const gap = (LAND ? 26 : 12) * sc;
    const nx0 = pad + 20 * sc;
    const ny = barY + (LAND ? 29 : 22) * sc;

    nodes.forEach((lbl, i) => {
      const nx = nx0 + i * (nodeW + gap);
      const active = Math.floor(t * 2.5) % nodes.length === i;
      if (i > 0) {
        ctx.strokeStyle = 'rgba(56,189,248,0.6)';
        ctx.lineWidth = 2 * sc;
        ctx.beginPath();
        ctx.moveTo(nx - gap, ny + nodeH / 2);
        ctx.lineTo(nx, ny + nodeH / 2);
        ctx.stroke();
      }
      ctx.fillStyle = active ? 'rgba(232,121,249,0.28)' : 'rgba(30,41,59,0.85)';
      rr(ctx, nx, ny, nodeW, nodeH, 7 * sc);
      ctx.fill();
      ctx.strokeStyle = active ? '#e879f9' : 'rgba(148,163,184,0.45)';
      ctx.lineWidth = 1.4 * sc;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = active ? '#fdf4ff' : '#cbd5e1';
      ctx.font = `600 ${(LAND ? 13 : 11) * sc}px "JetBrains Mono", monospace`;
      ctx.fillText(lbl, nx + nodeW / 2, ny + 22 * sc);
    });

    // Live deterministic synth oscilloscope trace
    const waveX = LAND ? nx0 + nodes.length * (nodeW + gap) + 12 * sc : pad + 20 * sc;
    const waveW = LAND ? pad + barW - waveX - 20 * sc : barW - 40 * sc;
    const waveY = LAND ? barY + barH / 2 : barY + 82 * sc;
    if (waveW > 80 * sc) {
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const u = i / 80;
        const wx = waveX + u * waveW;
        const wy = waveY + Math.sin(u * 18 + t * 9) * 14 * sc * Math.cos(u * 5 - t * 3);
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2 * sc;
      ctx.stroke();
    }
    ctx.restore();

    // Title pill top-right (landscape) or under code box (portrait)
    ctx.save();
    ctx.textAlign = LAND ? 'right' : 'left';
    const tx = LAND ? W - pad : pad;
    const ty = LAND ? pad + 32 * sc : pad + codeH + 36 * sc;
    ctx.fillStyle = '#f8fafc';
    ctx.font = `700 ${(LAND ? 30 : 26) * sc}px "Noto Sans SC", sans-serif`;
    ctx.fillText('Hydra 视觉反馈合成', tx, ty);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `500 ${14 * sc}px "JetBrains Mono", monospace`;
    ctx.fillText(`t = ${t.toFixed(2)}s · WebGL Video Synth`, tx, ty + 24 * sc);
    ctx.restore();
  },
});
