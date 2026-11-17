// C-117 侦探线索板：init 里用分形噪声和随机颗粒做一张软木板纹理；卡片按时刻一张张“钉”上（从上方落下、轻微回弹），每两张都在场后红线才从一枚图钉拉到另一枚；镜头只做横移和缓推（整张板按 t 平移、放大），台灯光圈用径向渐变压暗四周；第 3.8 秒相机闪光白场，揭晓嫌疑人并盖“结案”红章。
// 风格提示词：用侦探线索板风格：台灯照亮的软木板，四周暗角压黑，中央是一张写着问号的嫌疑人剪影卡，带编号的米色索引卡和黄、粉便签一张张钉上，红图钉之间拉紧红线织成网，镜头只做横移和缓推，一次相机闪光白场揭晓答案并盖上“结案”红章。
// 题材：信息讲解与产品发布 · 适合：悬疑揭秘、案例拆解、复盘
scene({
  id: 'C-117', name: '侦探线索板', dur: 5, still: 4.4,
  fonts: ["700 40px 'Noto Sans SC'", "400 40px 'ZCOOL KuaiLe'", "700 40px 'JetBrains Mono'", "900 80px 'Noto Sans SC'"],
  text: '嫌疑人深夜的脚印咖啡杯唇印门锁没撬钥匙在谁手上是管家结案监控停了分钟？',
  init() {
    const bw = Math.round(LONG * 1.2), bh = Math.round(LONG * 1.2), cork = mk(bw / 2, bh / 2), g = cork.getContext('2d');
    const img = g.createImageData(cork.width, cork.height), d = img.data;
    for (let y = 0; y < cork.height; y++) for (let x = 0; x < cork.width; x++) {
      const n = fbm(x * .03, y * .03, 4), sp = hash2(x, y), i = (y * cork.width + x) * 4;
      let v = .75 + .25 * n; if (sp > .93) v *= .65; if (sp < .04) v *= 1.15;
      d[i] = 190 * v; d[i + 1] = 140 * v; d[i + 2] = 90 * v; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return { cork, bw, bh };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    // 镜头：横移 + 缓推（闪光前后各一段）
    const zoom = lerp(1.0, 1.18, eInOutCubic(clamp(t / 5)));
    const panX = lerp(LAND ? 160 : 60, LAND ? -120 : -40, eInOutCubic(clamp(t / 4.2))) * u;
    ctx.save(); ctx.translate(W / 2 + panX, H / 2); ctx.scale(zoom * (LAND ? 1 : 1.15), zoom * (LAND ? 1 : 1.15));
    ctx.drawImage(s.cork, -s.bw / 2, -s.bh / 2, s.bw, s.bh);
    // 卡片：[x, y, 宽, 高, 类型, 文字, 钉上时刻, 角度]（以板中心为原点，单位 u）
    const C = LAND ? [
      [0, 0, 300, 380, 'suspect', '', .1, 0],
      [-560, -250, 330, 200, 'card', '01 深夜的脚印', .5, -.05], [520, -260, 300, 200, 'card', '02 咖啡杯唇印', .9, .04],
      [-540, 240, 260, 220, 'yellow', '门锁\n没撬', 1.3, .06], [540, 250, 330, 200, 'card', '03 钥匙在谁手上', 1.7, -.03],
      [-150, 380, 240, 200, 'pink', '监控停了\n4 分钟', 2.1, -.07], [200, -400, 220, 180, 'yellow', '？', 2.5, .05]]
      : [
      [0, -60, 330, 420, 'suspect', '', .1, 0],
      [-260, -620, 380, 220, 'card', '01 深夜的脚印', .5, -.05], [250, -360, 330, 220, 'card', '02 咖啡杯唇印', .9, .04],
      [-260, 330, 290, 240, 'yellow', '门锁\n没撬', 1.3, .06], [230, 560, 380, 220, 'card', '03 钥匙在谁手上', 1.7, -.03],
      [-250, 680, 260, 220, 'pink', '监控停了\n4 分钟', 2.1, -.07], [260, 260, 240, 200, 'yellow', '？', 2.5, .05]];
    const flash = t >= 3.8;
    const pinOf = c => [c[0] * u, (c[1] - c[3] / 2 + 22) * u];
    // 红线：两端卡片都钉上后，0.3 秒拉出
    const LINKS = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 3], [2, 4], [0, 5], [3, 5], [2, 6], [1, 6]];
    const linkT = [.8, 1.2, 1.6, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2];
    // 先画卡片阴影和卡片
    C.forEach(([x, y, w, h, kind, txt, t0, ang], i) => {
      const p = clamp((t - t0) / .25); if (p <= 0) return;
      const lift = (1 - eOutBack(p, 2)) * 80 * u;
      ctx.save(); ctx.translate(x * u, y * u - lift); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-w / 2 * u + 10 * u, -h / 2 * u + 14 * u + lift * .3, w * u, h * u);
      const bg = kind === 'yellow' ? '#F6E05E' : kind === 'pink' ? '#F7A6C4' : kind === 'suspect' ? '#E9E2D2' : '#EFE6CF';
      ctx.fillStyle = bg; ctx.fillRect(-w / 2 * u, -h / 2 * u, w * u, h * u);
      ctx.fillStyle = '#2A2420'; ctx.textAlign = 'center';
      if (kind === 'card') {
        ctx.strokeStyle = 'rgba(200,60,60,.6)'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(-w / 2 * u, (-h / 2 + 62) * u); ctx.lineTo(w / 2 * u, (-h / 2 + 62) * u); ctx.stroke();
        ctx.strokeStyle = 'rgba(80,120,200,.35)'; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-w / 2 * u, (-h / 2 + 62 + k * 40) * u); ctx.lineTo(w / 2 * u, (-h / 2 + 62 + k * 40) * u); ctx.stroke(); }
        const [no, ...rest] = txt.split(' ');
        ctx.font = `700 ${Math.round(30 * u)}px 'JetBrains Mono'`; ctx.textAlign = 'left'; ctx.fillText(no, (-w / 2 + 20) * u, (-h / 2 + 46) * u);
        ctx.font = `700 ${Math.round(38 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText(rest.join(' '), 0, 30 * u);
      } else if (kind === 'yellow' || kind === 'pink') {
        ctx.font = `400 ${Math.round((txt === '？' ? 110 : 50) * u)}px 'ZCOOL KuaiLe'`;
        txt.split('\n').forEach((ln, k, arr) => ctx.fillText(ln, 0, (k - (arr.length - 1) / 2) * 60 * u + 18 * u));
      } else {
        // 嫌疑人卡：剪影 + 问号；闪光后换成答案
        ctx.fillStyle = flash ? '#3E3A34' : '#1E1B18';
        ctx.beginPath(); ctx.arc(0, -60 * u, 70 * u, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 90 * u, 115 * u, 90 * u, 0, Math.PI, 0); ctx.lineTo(115 * u, 150 * u); ctx.lineTo(-115 * u, 150 * u); ctx.closePath(); ctx.fill();
        if (!flash) { ctx.fillStyle = '#F2EDE3'; ctx.font = `900 ${Math.round(110 * u)}px 'Noto Sans SC'`; ctx.fillText('？', 0, -20 * u); }
        else {
          ctx.fillStyle = '#F2EDE3'; ctx.fillRect(-70 * u, -100 * u, 50 * u, 10 * u); ctx.fillRect(20 * u, -100 * u, 50 * u, 10 * u);   // 小胡子管家
          ctx.beginPath(); ctx.moveTo(-40 * u, -30 * u); ctx.quadraticCurveTo(0, -55 * u, 40 * u, -30 * u); ctx.quadraticCurveTo(0, -42 * u, -40 * u, -30 * u); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-30 * u, 10 * u); ctx.lineTo(0, 60 * u); ctx.lineTo(30 * u, 10 * u); ctx.fill();
          ctx.fillStyle = '#B3262B'; ctx.beginPath(); ctx.moveTo(-14 * u, 14 * u); ctx.lineTo(14 * u, 14 * u); ctx.lineTo(0, 30 * u); ctx.fill();
        }
        ctx.fillStyle = '#2A2420'; ctx.font = `700 ${Math.round(34 * u)}px 'Noto Sans SC'`; ctx.fillText(flash ? '是管家' : '嫌疑人', 0, (h / 2 - 22) * u);
      }
      ctx.restore();
    });
    // 红线（画在卡片上面、图钉下面），从一端拉向另一端
    LINKS.forEach(([a, b], k) => {
      const p = clamp((t - linkT[k]) / .3); if (p <= 0) return;
      const [x0, y0] = pinOf(C[a]), [x1, y1] = pinOf(C[b]);
      ctx.strokeStyle = '#C8102E'; ctx.lineWidth = 4 * u; ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowOffsetY = 5 * u; ctx.shadowBlur = 4 * u;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, eOutCubic(p)), lerp(y0, y1, eOutCubic(p))); ctx.stroke();
      ctx.shadowColor = 'transparent';
    });
    // 图钉
    C.forEach((c, i) => {
      const p = clamp((t - c[6] - .2) / .1); if (p <= 0) return;
      const [x, y] = pinOf(c);
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(x + 5 * u, y + 7 * u, 16 * u, 0, TAU); ctx.fill();
      const pg = ctx.createRadialGradient(x - 5 * u, y - 5 * u, 2 * u, x, y, 16 * u); pg.addColorStop(0, '#FF6B6B'); pg.addColorStop(1, '#9E0F1F');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(x, y, 16 * u * (2 - p), 0, TAU); ctx.fill();
    });
    // 结案章
    const sp = clamp((t - 4.05) / .14);
    if (sp > 0) {
      const sc = lerp(2, 1, eOutCubic(sp));
      ctx.save(); ctx.translate(C[0][0] * u + 120 * u, C[0][1] * u + 120 * u); ctx.rotate(-.25); ctx.scale(sc, sc); ctx.globalAlpha = .85 * sp;
      ctx.strokeStyle = ctx.fillStyle = '#C8102E'; ctx.lineWidth = 9 * u; rr(ctx, -150 * u, -65 * u, 300 * u, 130 * u, 14 * u); ctx.stroke();
      ctx.font = `900 ${Math.round(88 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText('结案', 0, 32 * u);
      ctx.restore();
    }
    ctx.restore();
    // 台灯光圈 + 暗角
    const lx = W * (LAND ? .48 : .5), ly = H * .42;
    const lg = ctx.createRadialGradient(lx, ly, SHORT * .15, lx, ly, LONG * .62);
    lg.addColorStop(0, 'rgba(255,214,150,0)'); lg.addColorStop(.55, 'rgba(20,10,5,.35)'); lg.addColorStop(1, 'rgba(5,3,2,.93)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,190,110,.35)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    // 相机闪光
    const fl = t >= 3.8 ? Math.exp(-(t - 3.8) * 9) : 0;
    if (fl > .01) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
  }
});
