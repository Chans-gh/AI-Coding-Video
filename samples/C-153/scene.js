// C-153 合成波（Synthwave）：（一句话写清画面是怎么用代码做出来的，介绍页会用这一句）
// 风格提示词：用合成波风格：深紫夜空下一轮切成横条的橙粉渐变落日，品红霓虹透视网格向地平线无限滚动，远处是线框山脉，镀铬金属大字带一道高光扫过，所有亮线都有一紧一散两层辉光，最后叠上 VHS 扫描线、红蓝通道错位和偶尔的磁带卡顿，配模拟合成器琶音。
// 题材：电影年代与屏幕科技 · 适合：复古音乐 MV、游戏与潮牌宣传、80 年代怀旧片头
scene({
  id: 'C-153', name: '合成波（Synthwave）', dur: 3, still: 2.1,
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
    ctx.textAlign = 'center'; ctx.fillText('合成波（Synthwave）', cx, cy + Math.sin(t * 2) * 20 * u);
  }
});
