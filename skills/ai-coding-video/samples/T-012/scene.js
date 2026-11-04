// T-012 儿童绘本动画：1902 年《彼得兔》的插图一页页翻过去，每页插图轻轻呼吸、摇摆，像纸偶；下面一行童趣字体的文字跟着旁白逐字变色（卡拉 OK 式），翻页用一次纸张翻转
// 素材：照片（Project Gutenberg 扫描的 Beatrix Potter 原书插图五张）；旁白用语音合成的公开音色，故事是本仓库用自己的话复述的；配乐 CC0
scene({
  id: 'T-012', name: '绘本翻页', dur: 15, still: 8.6,
  fonts: ["400 40px 'ZCOOL KuaiLe'", "400 40px 'Noto Sans SC'"],
  text: '从前有四只小兔子妈妈说别去麦格雷戈先生的菜园可彼得偏偏钻了进去被发现了拼命跑啊跑到家的时候妈妈给他煮了一杯甘菊茶彼得兔的故事插图旁白配乐',
  async init() {
    const A = await loadAssets();
    const P = {}; for (const k of ['11', '19', '24', '27', '55']) P[k] = await loadImage(`peter${k}.jpg`);
    return { A, P };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, f = Math.round(t * FPS);
    // 页：[开始, 插图]；字幕自动从旁白取
    const PAGES = [[0, '11'], [5.4, '19'], [7.6, '24'], [9.0, '27'], [10.4, '55']];
    const pi = PAGES.reduce((a, p, i) => t >= p[0] ? i : a, 0), pg = PAGES[pi];
    ctx.fillStyle = '#f7e9cf'; ctx.fillRect(0, 0, W, H);
    // 纸纹：固定种子的小点
    const rng = mulberry32(42); ctx.fillStyle = 'rgba(160,120,70,.08)';
    for (let i = 0; i < 500; i++) ctx.fillRect(rng() * W, rng() * H, 2 * u, 2 * u);
    // 书页
    const pw = LAND ? H * .78 : W * .84, phh = LAND ? H * .78 : W * .96, px = LAND ? W * .5 - pw - 20 * u : (W - pw) / 2, py = LAND ? (H - phh) / 2 - 30 * u : H * .12;
    ctx.save(); ctx.shadowColor = 'rgba(90,60,30,.25)'; ctx.shadowBlur = 30 * u; ctx.shadowOffsetY = 10 * u;
    ctx.fillStyle = '#fffaf0'; rr(ctx, px, py, pw, phh, 12 * u); ctx.fill(); ctx.restore();
    if (LAND) { ctx.save(); ctx.shadowColor = 'rgba(90,60,30,.25)'; ctx.shadowBlur = 30 * u; ctx.fillStyle = '#fffaf0'; rr(ctx, W * .5 + 20 * u, py, pw, phh, 12 * u); ctx.fill(); ctx.restore(); }
    // 翻页：前 0.5 秒书页绕中线横向翻转（宽度从 0 长回来）
    const flip = eOutCubic(inv(pg[0], pg[0] + .5, t)), img = s.P[pg[1]];
    const lt = t - pg[0];
    ctx.save(); ctx.translate(px + pw / 2, py + phh / 2); ctx.scale(pi === 0 ? 1 : Math.max(.02, flip), 1);
    ctx.rotate(Math.sin(lt * 1.6) * .015);
    const br = 1 + .015 * Math.sin(lt * 2.2);
    ctx.scale(br, br);
    const [iw, ih] = srcSize(img), k = Math.min(pw * .86 / iw, phh * .86 / ih);
    ctx.drawImage(img, -iw * k / 2, -ih * k / 2, iw * k, ih * k);
    ctx.restore();
    // 文字：右页（竖屏是下方），当前这句一字一字由灰变成橘色
    const c = cueAt(s.A, t);
    const tx = LAND ? W * .5 + 20 * u + pw / 2 : W / 2, ty = LAND ? py + phh * .45 : py + phh + 150 * u, maxW = LAND ? pw * .8 : W * .84;
    ctx.save(); ctx.textBaseline = 'middle'; ctx.font = `400 ${(LAND ? 58 : 62) * u}px 'ZCOOL KuaiLe'`;
    if (c) {
      const lines = wrapCJK(ctx, c.text, maxW), lh = (LAND ? 84 : 90) * u, total = c.text.length;
      let idx = 0;
      lines.forEach((l, li) => {
        let x = tx - ctx.measureText(l).width / 2; const y = ty + (li - (lines.length - 1) / 2) * lh;
        for (const ch of l) {
          const on = idx / total < c.p * 1.05; idx++;
          const bob = on ? Math.sin((f + idx * 3) * .25) * 3 * u : 0;
          ctx.fillStyle = on ? '#e2742b' : 'rgba(90,70,50,.4)'; ctx.fillText(ch, x, y + bob); x += ctx.measureText(ch).width;
        }
      });
    }
    ctx.restore();
    // 页码和书名
    ctx.save(); ctx.font = `400 ${26 * u}px 'ZCOOL KuaiLe'`; ctx.fillStyle = 'rgba(120,90,60,.7)'; ctx.textAlign = 'center';
    ctx.fillText(`— ${pi + 1} —`, LAND ? px + pw / 2 : W / 2, py + phh - 26 * u);
    if (LAND) ctx.fillText('彼得兔的故事', W * .5 + 20 * u + pw / 2, py + 60 * u);
    else { ctx.font = `400 ${44 * u}px 'ZCOOL KuaiLe'`; ctx.fillText('彼得兔的故事', W / 2, py - 40 * u); }
    ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(120,90,60,.65)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A) + ' · 故事为本仓库复述', W - 24 * u, H - 18 * u); ctx.restore();
  },
});
