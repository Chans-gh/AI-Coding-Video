// C-167 热成像：（一句话写清画面是怎么用代码做出来的，介绍页会用这一句）
// 风格提示词：用热成像风格：画面是热像仪看到的寒夜，人和动物的身体、呼出的气、刚踩过的脚印先发亮再慢慢冷却消失，烟囱的烟被风压平，伪彩调色板从黑紫到橙黄再到白，起风时整片调色板跟着扫换，所有轮廓上叠一条细白边线，角落有温度读数。
// 题材：电影年代与屏幕科技 · 适合：夜晚与寒冷、监视与追踪、身体与触碰
scene({
  id: 'C-167', name: '热成像', dur: 3, still: 2.1,
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
    ctx.textAlign = 'center'; ctx.fillText('热成像', cx, cy + Math.sin(t * 2) * 20 * u);
  }
});
