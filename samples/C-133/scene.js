// C-133 早期文艺复兴湿壁画：p5.js（instance 模式）在 init 里把一整面比画幅更宽的湿壁画画到一张离屏画布上——干灰泥底、粉化剥落、建筑把画面分成一格格，人物是轮廓清楚的厚重体块；每帧 Canvas 2D 沿墙面平移这张画，叠上均匀的天光和灰泥颗粒，镜头从一幕走到下一幕。
// 风格提示词：用早期文艺复兴湿壁画风格：干灰泥墙面略带粉化斑驳，颜色是粉蓝天空、土绿、淡赭和玫瑰色，人物像厚重的体块，轮廓清楚、明暗简单，建筑像舞台盒子一样把场景分成一格格可读的空间，光线均匀清明几乎没有投影，镜头沿墙面从一幕平移到下一幕，配素歌吟唱。
// 题材：手绘与绘画 · 适合：历史叙事、城市与社会生活、连环故事
scene({
  id: 'C-133', name: '早期文艺复兴湿壁画', dur: 5, still: 3.6, libs: ['p5'],
  async init() {
    const u = SHORT / 1080;
    const SW = Math.round(W * .96), MURAL_W = SW * 3, MURAL_H = H;   // 一整面墙：三幕，每幕约一个画幅宽
    const sk = await p5Sketch(p => mural(p, MURAL_W, MURAL_H, u), null, { w: MURAL_W, h: MURAL_H });
    await sk.render(0);                                              // 画一次，之后只平移
    return { wall: sk.canvas, MURAL_W, u };
  },
  draw(ctx, t, s) {
    const { MURAL_W, u } = s;
    // 镜头：三幕之间平移，每幕停一下
    const stops = [0, (MURAL_W - W) * .5, MURAL_W - W];
    const seg = t < 1.5 ? 0 : t < 3.1 ? 1 : 2;
    const k = seg === 0 ? eInOutCubic(inv(.9, 1.7, t)) : seg === 1 ? eInOutCubic(inv(2.5, 3.3, t)) : 1;
    const x = seg === 0 ? lerp(stops[0], stops[1], k) : lerp(stops[1], stops[2], seg === 1 ? k : 1);
    ctx.fillStyle = '#C9BBA2'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(s.wall, -x, 0);
    // 均匀清明的天光：极轻的暖色罩和几乎没有的暗角
    ctx.save(); ctx.globalCompositeOperation = 'soft-light';
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,245,220,.5)'); g.addColorStop(1, 'rgba(180,170,150,.35)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    vignette(ctx, .18, .55, '60,50,40');
    grain(ctx, Math.floor(t * 8), .22, 2);                           // 灰泥颗粒
  }
});

// 整面墙：灰泥底 → 三幕（建筑分格）→ 粉化剥落
function mural(p, MW, MH, u) {
  p.randomSeed(21); p.noiseSeed(21);
  const SKY = '#A8C4D8', EARTH = '#7E8C5A', OCHRE = '#C9A15C', ROSE = '#C07A6E', PLASTER = '#E4D7BC', INK = '#4A3A2C';
  p.noStroke(); p.background(PLASTER);
  // 灰泥底：一层层淡色斑
  for (let i = 0; i < 1800; i++) {
    const x = p.random(MW), y = p.random(MH), r = p.random(60, 420) * u;
    p.fill(p.random(205, 236), p.random(192, 222), p.random(168, 196), p.random(4, 10));
    p.ellipse(x, y, r, r * p.random(.5, 1.2));
  }
  const H0 = MH, SW = MW / 3, scenes = [0, SW, SW * 2];
  // 天空与地面带：三幕共用，底色略有差别
  scenes.forEach((x0, i) => {
    p.fill(p.color(SKY)); p.rect(x0, H0 * .08, SW, H0 * .46);
    p.fill(i === 1 ? '#8A9A62' : EARTH); p.rect(x0, H0 * .54, SW, H0 * .38);
    p.fill('#B9A882'); p.rect(x0, H0 * .54, SW, H0 * .04);
  });
  // 建筑：像舞台盒子的拱廊，把每幕分开
  const arcade = (x0, y0, w, h, col) => {
    p.fill(col); p.rect(x0, y0, w, h);
    p.fill('#D9C9A6'); p.rect(x0, y0, w, h * .08);
    const cols = 4, cw = w / cols;
    for (let c = 0; c < cols; c++) {
      const cx = x0 + c * cw;
      p.fill('#6E5C46'); p.rect(cx + cw * .08, y0 + h * .08, cw * .1, h * .92);       // 柱
      p.fill('#6B5B45');                                                              // 拱洞
      p.arc(cx + cw * .55, y0 + h * .42, cw * .62, h * .62, p.PI, 0);
      p.rect(cx + cw * .24, y0 + h * .42, cw * .62, h * .5);
    }
  };
  // 人物：厚重体块，轮廓清楚，明暗只分两层
  const figure = (x, y, h, robe, cloak, face = 1) => {
    const w = h * .38;
    const dark = c => { const q = p.color(c); return p.color(p.red(q) * .72, p.green(q) * .72, p.blue(q) * .74); };
    p.noStroke();
    p.fill(INK); p.beginShape();                                                    // 轮廓：下摆略张开
    p.vertex(x - w * .40, y - h * .86); p.vertex(x + w * .40, y - h * .86);
    p.vertex(x + w * .62, y + 3 * u); p.vertex(x - w * .62, y + 3 * u); p.endShape(p.CLOSE);
    const gown = (cc, x0, x1) => { p.fill(cc); p.beginShape();
      p.vertex(x + x0 * w, y - h * .84); p.vertex(x + x1 * w, y - h * .84);
      p.vertex(x + x1 * w * 1.5, y); p.vertex(x + x0 * w * 1.5, y); p.endShape(p.CLOSE); };
    gown(robe, -.36, .36);
    gown(dark(robe), .02, .36);                                                     // 暗面：只分两层
    p.fill(cloak); p.beginShape();                                                  // 披风搭在一侧
    p.vertex(x - w * .40, y - h * .84); p.vertex(x - w * .02, y - h * .84);
    p.vertex(x - w * .10, y - h * .18); p.vertex(x - w * .58, y - h * .02); p.vertex(x - w * .56, y - h * .5);
    p.endShape(p.CLOSE);
    p.fill(dark(cloak)); p.beginShape();
    p.vertex(x - w * .40, y - h * .84); p.vertex(x - w * .24, y - h * .84);
    p.vertex(x - w * .30, y - h * .2); p.vertex(x - w * .56, y - h * .1); p.endShape(p.CLOSE);
    p.fill(dark(robe)); p.beginShape();                                             // 袖子：从肩到手
    p.vertex(x + w * .18, y - h * .82); p.vertex(x + w * .40, y - h * .80);
    p.vertex(x + w * .50, y - h * .46); p.vertex(x + w * .30, y - h * .44); p.endShape(p.CLOSE);
    p.fill('#E6C7A4'); p.ellipse(x + w * .42, y - h * .44, w * .17, w * .2);         // 手
    p.fill('#9A7B52'); p.rect(x - w * .1, y - h * .9, w * .2, h * .12);               // 脖子
    p.fill('#EBCCA8'); p.ellipse(x, y - h * .98, w * .46, w * .56);                   // 头
    p.fill('#5A4130'); p.arc(x, y - h * .995, w * .5, w * .6, p.PI * 1.02, p.TWO_PI * .99);
    p.fill(INK); p.ellipse(x - w * .09 * face, y - h * .985, 4 * u, 6 * u); p.ellipse(x + w * .09 * face, y - h * .985, 4 * u, 6 * u);
    p.noFill(); p.stroke(226, 206, 166, 150); p.strokeWeight(3 * u);                  // 头光：一条浅金的椭圆
    p.ellipse(x, y - h * 1.04, w * .64, w * .22); p.noStroke();
  };
  // 第一幕：三个人在拱廊前交谈
  arcade(scenes[0] + SW * .04, H0 * .16, SW * .40, H0 * .40, OCHRE);
  figure(scenes[0] + SW * .68, H0 * .84, H0 * .44, ROSE, '#4E6E8C');
  figure(scenes[0] + SW * .88, H0 * .86, H0 * .40, '#8FA86B', '#A8552F', -1);
  figure(scenes[0] + SW * .46, H0 * .82, H0 * .38, '#D9C08A', '#6E4A6B');
  // 第二幕：中间一个高个子讲话，两侧各一人，背后是城墙和塔
  p.fill('#B99C6B'); p.rect(scenes[1] + SW * .1, H0 * .3, SW * .8, H0 * .26);
  p.fill('#A9895C'); p.rect(scenes[1] + SW * .62, H0 * .14, SW * .16, H0 * .42);
  p.fill('#8A6E46'); p.rect(scenes[1] + SW * .62, H0 * .14, SW * .16, H0 * .04);
  for (let c = 0; c < 6; c++) { p.fill('#CBB184'); p.rect(scenes[1] + SW * (.12 + c * .13), H0 * .3, SW * .05, H0 * .05); }
  figure(scenes[1] + SW * .46, H0 * .80, H0 * .46, '#C8604A', '#3F5E86');
  figure(scenes[1] + SW * .24, H0 * .78, H0 * .34, '#7E9664', '#C2A24E', -1);
  figure(scenes[1] + SW * .70, H0 * .79, H0 * .35, '#D5C296', '#7A4A5E');
  // 第三幕：一棵树、两人送别，远处山丘
  p.fill('#9DAE74'); p.ellipse(scenes[2] + SW * .25, H0 * .55, SW * .5, H0 * .18);
  p.fill('#8C9D66'); p.ellipse(scenes[2] + SW * .76, H0 * .56, SW * .46, H0 * .16);
  p.fill('#5E4A32'); p.rect(scenes[2] + SW * .52, H0 * .34, SW * .035, H0 * .24);
  p.fill('#4E6B3C'); p.ellipse(scenes[2] + SW * .537, H0 * .3, SW * .3, H0 * .22);
  p.fill('#5E7B46'); p.ellipse(scenes[2] + SW * .47, H0 * .27, SW * .17, H0 * .13);
  p.fill('#C3B089'); p.beginShape();                                // 一条小路
  p.vertex(scenes[2] + SW * .40, H0 * .58); p.vertex(scenes[2] + SW * .56, H0 * .58);
  p.vertex(scenes[2] + SW * .78, H0 * .92); p.vertex(scenes[2] + SW * .20, H0 * .92); p.endShape(p.CLOSE);
  figure(scenes[2] + SW * .30, H0 * .84, H0 * .42, '#B9535A', '#D9C08A');
  figure(scenes[2] + SW * .72, H0 * .84, H0 * .40, '#4E6E8C', '#C8A05A', -1);
  p.fill('#F0EDE2');                                                // 几只羊
  for (const [dx, dy] of [[.12, .64], [.2, .67], [.86, .66]]) { p.ellipse(scenes[2] + SW * dx, H0 * dy, SW * .05, H0 * .03); p.fill('#4A3A2C'); p.ellipse(scenes[2] + SW * (dx + .02), H0 * dy - H0 * .01, SW * .016, H0 * .014); p.fill('#F0EDE2'); }
  p.stroke(74, 58, 44, 170); p.strokeWeight(3 * u); p.noFill();      // 远处的鸟
  for (const [bx, by] of [[.22, .2], [.3, .17], [.37, .22]]) { p.arc(scenes[2] + SW * bx, H0 * by, SW * .05, H0 * .02, p.PI, p.TWO_PI); p.arc(scenes[2] + SW * bx + SW * .05, H0 * by, SW * .05, H0 * .02, p.PI, p.TWO_PI); }
  p.noStroke();
  // 格与格之间的描边框
  p.noFill(); p.stroke('#9A8460'); p.strokeWeight(7 * u);
  scenes.forEach(x0 => p.rect(x0 + 6 * u, H0 * .06, SW - 12 * u, H0 * .88));
  p.noStroke();
  // 粉化剥落：露出灰泥底的斑块和裂纹
  p.fill(226, 214, 188, 46); p.rect(0, 0, MW, MH);                 // 整面压一层灰泥，颜色退下去
  for (let i = 0; i < 2600; i++) {                                 // 粉化：成片的浅斑，不是圆点
    const x = p.random(MW), y = p.random(MH), r = p.random(30, 260) * u;
    const n = p.noise(x * .0016, y * .0016);
    if (n < .45) { p.fill(230, 219, 194, p.random(8, 26)); p.ellipse(x, y, r, r * p.random(.35, 1.1)); }
  }
  p.stroke(190, 176, 150, 90); p.strokeWeight(2 * u);
  for (let i = 0; i < 70; i++) {                                    // 裂纹
    let x = p.random(MW), y = p.random(MH);
    for (let k = 0; k < 14; k++) { const nx = x + p.random(-26, 26) * u, ny = y + p.random(6, 30) * u; p.line(x, y, nx, ny); x = nx; y = ny; }
  }
  p.noStroke();
}
