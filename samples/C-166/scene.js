// C-166 60 年代液体灯光秀：（一句话写清画面是怎么用代码做出来的，介绍页会用这一句）
// 风格提示词：用60 年代液体灯光秀风格：投影仪下一只玻璃皿里油、水和染料不停旋转交融，品红、橙、绿、紫被挤成气泡和漩涡，上面叠着手绘透明片，黑墨处真的挡住灯光，每个重拍都在液面荡开一圈，灯偶尔熄灭又亮起，配迷幻摇滚。
// 题材：电影年代与屏幕科技 · 适合：迷幻音乐 MV、间奏与转场、梦境段落
scene({
  id: 'C-166', name: '60 年代液体灯光秀', dur: 3, still: 2.1,
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
    ctx.textAlign = 'center'; ctx.fillText('60 年代液体灯光秀', cx, cy + Math.sin(t * 2) * 20 * u);
  }
});
