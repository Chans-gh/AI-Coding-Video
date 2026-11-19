// C-127 发光宇宙：（一句话写清画面是怎么用代码做出来的，介绍页会用这一句）
// 风格提示词：用发光宇宙风格：深靛紫的太空雾里，无数叠加发光的点和光晕组成星系与网络，青色代表数据、紫色代表结构、琥珀色只给最关键的结论，半透明玻璃卡片悬在空中写字，一个反复出现的主角物体贯穿全片，镜头按关键帧在几处布景间飞越。
// 题材：3D 与实时图形 · 适合：AI 原理、复杂系统、抽象概念讲解
scene({
  id: 'C-127', name: '发光宇宙', dur: 3, still: 2.1,
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
    ctx.textAlign = 'center'; ctx.fillText('发光宇宙', cx, cy + Math.sin(t * 2) * 20 * u);
  }
});
