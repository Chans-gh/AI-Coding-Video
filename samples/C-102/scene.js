// C-102 颗粒渐变开场：（一句话写清画面是怎么用代码做出来的，介绍页会用这一句）
// 风格提示词：用颗粒渐变开场风格：深色底上一层层发光的饱和色形状（同心拱门、光环），带细小颗粒，镜头一路穿过这些层，一个小光球在前面带路，字体小而干净，一句话收尾。
// 题材：平面设计与动态排版 · 适合：科技与 AI、音乐、创意产品发布的开场
scene({
  id: 'C-102', name: '颗粒渐变开场', dur: 3, still: 2.1,
  fonts: ["700 40px 'Noto Sans SC'"],
  init() {
    // 纹理、离屏画布、随机布局在这里做一次；返回值就是 draw 的 s
    return {};
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080;                                  // 尺寸单位：按短边缩放
    // 构图：横屏（LAND）主体放右侧、文字在左；竖屏主体在上、文字在下
    const cx = LAND ? W * .62 : W / 2, cy = LAND ? H / 2 : H * .4;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#eee'; ctx.font = `700 ${Math.round(64 * u)}px 'Noto Sans SC'`;
    ctx.textAlign = 'center'; ctx.fillText('颗粒渐变开场', cx, cy + Math.sin(t * 2) * 20 * u);
  }
});
