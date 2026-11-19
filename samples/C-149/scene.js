// C-149 早期光线追踪 CGI：（一句话写清画面是怎么用代码做出来的，介绍页会用这一句）
// 风格提示词：用早期光线追踪 CGI风格：90 年代初电脑图形的样子，所有物体都是同一种光滑塑料，带一颗硬边白色高光，地面是无限延伸的红白棋盘格并映出倒影，铬球反射出扭曲的环境，背景是紫到青的渐变天空，开场先显示绿色线框再逐行扫描渲染出来，镜头沿轨道慢慢绕转。
// 题材：3D 与实时图形 · 适合：计算机图形学史、复古科技片、怀旧片头
scene({
  id: 'C-149', name: '早期光线追踪 CGI', dur: 3, still: 2.1,
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
    ctx.textAlign = 'center'; ctx.fillText('早期光线追踪 CGI', cx, cy + Math.sin(t * 2) * 20 * u);
  }
});
