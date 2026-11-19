// C-155 液态融合：（一句话写清画面是怎么用代码做出来的，介绍页会用这一句）
// 风格提示词：用液态融合风格：纯色背景上的高光泽液体图形，两团靠近就自动粘连融合，分开时拉出细颈再断裂回弹，小液滴晚两三帧跟着主体被甩出去，转场是一道带几个凸起的波浪前沿泼过整屏，结尾一滴液体聚合成标志，表面用场的梯度假装出立体高光，配水滴和吸管声。
// 题材：平面设计与动态排版 · 适合：饮料与食品广告、标志演绎、音乐转场包装
scene({
  id: 'C-155', name: '液态融合', dur: 3, still: 2.1,
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
    ctx.textAlign = 'center'; ctx.fillText('液态融合', cx, cy + Math.sin(t * 2) * 20 * u);
  }
});
