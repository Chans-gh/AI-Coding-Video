// C-145 美国都市写实主义：Canvas 2D 把房间、窗外的砖楼、椅子和坐着的人整套画两遍，一遍是阴影里的暗色，一遍是被晨光照亮的暖色；暖色那遍裁进一个由窗框平移、错切出来的硬边平行四边形里，四边形随时间慢慢右移，光斑于是扫过墙、地板，最后扫上人的脸；色面全部平涂，镜头不动。
// 风格提示词：用美国都市写实主义风格：空荡的餐馆、加油站和公寓窗边，清晨或深夜的光以锋利的硬边斜块落在墙和地板上，色面平整几乎看不到笔触，人物孤零零地坐着不动，只有光斑缓慢移动扫过脸，配色是暖黄、青绿和砖红，镜头固定不动，声音只有远处的车声。
// 题材：手绘与绘画 · 适合：孤独与城市题材、短篇小说改编、安静的情绪片
scene({
  id: 'C-145', name: '美国都市写实主义', dur: 4, still: 3.2,
  text: '清晨七点',
  fonts: ["400 40px 'Noto Serif SC'"],
  draw(ctx, t, s) {
    const u = SHORT / 1080, fl = H * (LAND ? .72 : .6), k = (LAND ? 1.3 : 1.5) * u;
    const wx0 = W * (LAND ? .1 : .08), wx1 = W * (LAND ? .34 : .5), wy0 = H * (LAND ? .14 : .16), wy1 = H * (LAND ? .52 : .4);
    const fx = W * (LAND ? .64 : .62), fy = fl + (LAND ? 70 : 220) * u;
    const all = lit => {
      const c = (a, b) => lit ? b : a;
      ctx.fillStyle = c('#4F7D74', '#E8C46A'); ctx.fillRect(0, 0, W, fl);
      ctx.fillStyle = c('#7E3A2E', '#E3955A'); ctx.fillRect(0, fl, W, H - fl);
      ctx.fillStyle = c('#2E4A45', '#B98A3E'); ctx.fillRect(0, fl - 18 * u, W, 18 * u);
      // 窗：外面是对面的砖楼
      ctx.fillStyle = '#F2E2B6'; ctx.fillRect(wx0, wy0, wx1 - wx0, (wy1 - wy0) * .22);
      ctx.fillStyle = '#A8513F'; ctx.fillRect(wx0, wy0 + (wy1 - wy0) * .22, wx1 - wx0, (wy1 - wy0) * .78);
      ctx.fillStyle = '#C96A4E'; ctx.fillRect(wx0, wy0 + (wy1 - wy0) * .22, (wx1 - wx0) * .4, (wy1 - wy0) * .78);
      ctx.fillStyle = '#3A2A28'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ctx.fillRect(wx0 + (wx1 - wx0) * (.1 + i * .32), wy0 + (wy1 - wy0) * (.36 + j * .34), (wx1 - wx0) * .14, (wy1 - wy0) * .2);
      ctx.strokeStyle = c('#E9E1CF', '#E9E1CF'); ctx.lineWidth = 14 * u; ctx.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
      ctx.lineWidth = 8 * u; ctx.beginPath(); ctx.moveTo((wx0 + wx1) / 2, wy0); ctx.lineTo((wx0 + wx1) / 2, wy1); ctx.stroke();
      ctx.fillStyle = c('#C9BFA8', '#F4EAD2'); ctx.fillRect(wx0 - 24 * u, wy1, wx1 - wx0 + 48 * u, 16 * u);
      // 椅子
      ctx.fillStyle = c('#5E2A22', '#B8513A');
      ctx.fillRect(fx + 30 * k, fy - 330 * k, 26 * k, 330 * k); ctx.fillRect(fx - 110 * k, fy - 150 * k, 170 * k, 22 * k); ctx.fillRect(fx - 100 * k, fy - 130 * k, 16 * k, 130 * k);
      // 人：侧身朝窗坐着
      ctx.fillStyle = c('#1F3F3C', '#3F7A70');
      ctx.beginPath(); ctx.moveTo(fx - 50 * k, fy - 150 * k); ctx.lineTo(fx + 30 * k, fy - 150 * k); ctx.lineTo(fx + 24 * k, fy - 335 * k); ctx.quadraticCurveTo(fx - 10 * k, fy - 350 * k, fx - 44 * k, fy - 330 * k); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(fx - 40 * k, fy - 180 * k); ctx.lineTo(fx - 180 * k, fy - 175 * k); ctx.lineTo(fx - 190 * k, fy - 125 * k); ctx.lineTo(fx + 30 * k, fy - 140 * k); ctx.closePath(); ctx.fill();   // 裙摆盖住大腿
      ctx.fillStyle = c('#8E6250', '#EDBE92');
      ctx.fillRect(fx - 178 * k, fy - 130 * k, 24 * k, 130 * k);                         // 小腿
      ctx.beginPath(); ctx.moveTo(fx - 26 * k, fy - 315 * k); ctx.lineTo(fx - 120 * k, fy - 190 * k); ctx.lineTo(fx - 100 * k, fy - 180 * k); ctx.lineTo(fx - 4 * k, fy - 300 * k); ctx.fill();   // 手臂搭在膝上
      ctx.fillRect(fx - 24 * k, fy - 372 * k, 28 * k, 40 * k);                           // 脖子
      ctx.beginPath(); ctx.ellipse(fx - 16 * k, fy - 405 * k, 38 * k, 48 * k, -.1, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(fx - 50 * k, fy - 412 * k); ctx.lineTo(fx - 64 * k, fy - 396 * k); ctx.lineTo(fx - 50 * k, fy - 392 * k); ctx.fill();   // 鼻尖朝窗
      ctx.fillStyle = c('#2A1C18', '#5A3426'); ctx.beginPath(); ctx.ellipse(fx - 6 * k, fy - 418 * k, 42 * k, 42 * k, 0, -2.2, 1.0); ctx.fill();
      ctx.beginPath(); ctx.arc(fx + 34 * k, fy - 400 * k, 20 * k, 0, TAU); ctx.fill();   // 发髻
      // 小桌和杯子
      ctx.fillStyle = c('#2E4A45', '#7FB0A2'); ctx.fillRect(fx + 120 * k, fy - 200 * k, 150 * k, 18 * k); ctx.fillRect(fx + 186 * k, fy - 182 * k, 16 * k, 182 * k);
      ctx.fillStyle = c('#C9BFA8', '#FFF6E2'); ctx.fillRect(fx + 160 * k, fy - 236 * k, 30 * k, 36 * k);
    };
    all(false);
    // 光斑：窗框平移、错切出的硬边四边形，慢慢右移
    const off = lerp(W * (LAND ? .2 : -.12), W * (LAND ? .36 : .16), t / 4), dy = (LAND ? 150 : 330) * u, sk = .55;
    const P = (x, y) => [x + off + (y - wy0) * sk, y + dy];
    const h2 = (wy1 - wy0) * (LAND ? 1.3 : 2.2);
    ctx.save(); ctx.beginPath(); ctx.moveTo(...P(wx0, wy0)); ctx.lineTo(...P(wx1, wy0)); ctx.lineTo(...P(wx1, wy0 + h2)); ctx.lineTo(...P(wx0, wy0 + h2)); ctx.closePath();
    // 窗格的竖条留下一道影子
    const mx = (wx0 + wx1) / 2, b = 10 * u; ctx.moveTo(...P(mx + b, wy0)); ctx.lineTo(...P(mx - b, wy0)); ctx.lineTo(...P(mx - b, wy0 + h2)); ctx.lineTo(...P(mx + b, wy0 + h2)); ctx.closePath();
    ctx.clip('nonzero'); all(true); ctx.restore();
    const q = clamp(inv(2.6, 3.2, t)); ctx.globalAlpha = q; ctx.fillStyle = '#F1E6CC'; ctx.font = `400 ${(LAND ? 48 : 60) * u}px 'Noto Serif SC'`; ctx.textAlign = LAND ? 'left' : 'center';
    ctx.fillText('清晨七点', LAND ? wx0 : W / 2, LAND ? H - 70 * u : H - 110 * u); ctx.globalAlpha = 1;
  }
});
