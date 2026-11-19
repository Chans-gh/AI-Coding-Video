// C-167 热成像：先在 Canvas 上画一张灰度「温度图」（越白越热）：寒夜里的房子和树、走过的人和狗、按落脚时刻冷却变暗的脚印、一团团扩散冷却的呼气、被风压平的烟，再整体模糊一点；WebGL 着色器读这张图，按温度查伪彩调色板（黑紫到橙黄再到白），起风时一道前沿扫过把调色板换成另一套，用 Sobel 算子找出温度跳变的地方叠一条细白边，最后在 Canvas 上加十字准星和温度读数。
// 风格提示词：用热成像风格：画面是热像仪看到的寒夜，人和动物的身体、呼出的气、刚踩过的脚印先发亮再慢慢冷却消失，烟囱的烟被风压平，伪彩调色板从黑紫到橙黄再到白，起风时整片调色板跟着扫换，所有轮廓上叠一条细白边线，角落有温度读数。
// 题材：电影年代与屏幕科技 · 适合：夜晚与寒冷、监视与追踪、身体与触碰
scene({
  id: 'C-167', name: '热成像', dur: 5, still: 3.6,
  fonts: ["24px 'JetBrains Mono'"],
  init() {
    glInit(W / 2, H / 2);
    glProgram('therm', GLSL_LIB + `
uniform sampler2D TM; uniform float SW;
float tm(vec2 uv){ return texture(TM,vec2(uv.x,1.-uv.y)).r; }
vec3 iron(float k){
  vec3 a=vec3(.0,.0,.02), b=vec3(.3,.0,.45), c=vec3(.8,.1,.35), d=vec3(1.,.5,.0), e=vec3(1.,.9,.3), f=vec3(1.);
  return k<.2?mix(a,b,k/.2):k<.4?mix(b,c,(k-.2)/.2):k<.6?mix(c,d,(k-.4)/.2):k<.8?mix(d,e,(k-.6)/.2):mix(e,f,(k-.8)/.2);
}
vec3 rain(float k){
  vec3 a=vec3(.0,.0,.25), b=vec3(.0,.5,.9), c=vec3(.1,.85,.4), d=vec3(1.,.9,.0), e=vec3(1.,.2,.0), f=vec3(1.,.95,.95);
  return k<.2?mix(a,b,k/.2):k<.4?mix(b,c,(k-.2)/.2):k<.6?mix(c,d,(k-.4)/.2):k<.8?mix(d,e,(k-.6)/.2):mix(e,f,(k-.8)/.2);
}
void main(){
  vec2 uv=gl_FragCoord.xy/R, px=1./R;
  float k=tm(uv)+(hash21(gl_FragCoord.xy+floor(T*30.))-.5)*.035;
  float gx=tm(uv+vec2(px.x,0.))-tm(uv-vec2(px.x,0.)), gy=tm(uv+vec2(0.,px.y))-tm(uv-vec2(0.,px.y));
  float ed=smoothstep(.035,.07,length(vec2(gx,gy)));
  float fr=SW*1.4-.2+.06*sin(uv.y*14.+T*3.);
  float side=smoothstep(fr+.02,fr-.02,uv.x);
  vec3 c=mix(iron(clamp(k,0.,1.)),rain(clamp(k,0.,1.)),side);
  c+=vec3(1.)*exp(-pow((uv.x-fr)*R.x/6.,2.))*.35*step(.001,SW)*step(SW,.999);
  c=mix(c,vec3(1.),ed*.75);
  c*=.94+.06*sin(gl_FragCoord.y*3.14159);
  O=vec4(c,1.);
}`);
    const w = W / 2, h = H / 2, R = mulberry32(167);
    const trees = Array.from({ length: LAND ? 7 : 4 }, () => [R(), .7 + R() * .5]);
    const tc = mk(w, h), tb = mk(w, h);
    return { tc, tx: tc.getContext('2d'), tb, tbx: tb.getContext('2d'), trees, w, h };
  },
  draw(ctx, t, s) {
    const { w, h } = s, x = s.tx, u = SHORT / 1080, k = Math.min(w, h);
    const g = (v) => { const c = Math.round(clamp(v, 0, 1) * 255); return `rgb(${c},${c},${c})`; };
    const gy = h * (LAND ? .8 : .72);
    // 天和地
    let gr = x.createLinearGradient(0, 0, 0, gy); gr.addColorStop(0, g(.02)); gr.addColorStop(1, g(.1));
    x.fillStyle = gr; x.fillRect(0, 0, w, gy);
    gr = x.createLinearGradient(0, gy, 0, h); gr.addColorStop(0, g(.2)); gr.addColorStop(1, g(.14));
    x.fillStyle = gr; x.fillRect(0, gy, w, h - gy);
    // 树
    for (const [tx_, sc] of s.trees) { const bx = tx_ * w, th = k * .45 * sc; x.fillStyle = g(.06); x.beginPath(); x.moveTo(bx, gy - th); x.lineTo(bx - th * .25, gy); x.lineTo(bx + th * .25, gy); x.fill(); }
    // 房子：窗和屋檐漏热
    const hx = w * (LAND ? .66 : .3), hw = k * (LAND ? .5 : .62), hh = k * .32, hy = gy - hh;
    x.fillStyle = g(.22); x.fillRect(hx, hy, hw, hh);
    x.fillStyle = g(.18); x.beginPath(); x.moveTo(hx - k * .03, hy); x.lineTo(hx + hw / 2, hy - k * .17); x.lineTo(hx + hw + k * .03, hy); x.fill();
    x.fillStyle = g(.32); x.fillRect(hx, hy - k * .01, hw, k * .02);
    const chx = hx + hw * .72, chy = hy - k * .2;
    x.fillStyle = g(.5); x.fillRect(chx, chy, k * .05, k * .14);
    for (const [a, b] of [[.12, .3], [.6, .3]]) { x.fillStyle = g(.62); x.fillRect(hx + hw * a, hy + hh * b, hw * .22, hh * .3); x.fillStyle = g(.45); x.fillRect(hx + hw * a, hy + hh * b + hh * .14, hw * .22, hh * .02); }
    x.fillStyle = g(.4); x.fillRect(hx + hw * .4, hy + hh * .45, hw * .15, hh * .55);
    // 烟：风越大越平
    const wind = .25 + .75 * smooth(2.3, 3.0, t);
    x.save(); x.filter = `blur(${k * .02}px)`;
    for (let i = 0; i < 46; i++) {
      const age = (t % .1) + i * .1; if (age > 4.6) break;
      const sx = chx + k * .025 + age * k * (.05 + .25 * wind) + Math.sin(age * 2 + i) * k * .01;
      const sy = chy - age * k * (.16 - .13 * wind) * (1 - age * .08);
      const r = k * (.025 + age * .03 * (1 + wind));
      x.fillStyle = g(.55 * Math.exp(-age * .55)); x.globalAlpha = .55; x.beginPath(); x.arc(sx, sy, r, 0, TAU); x.fill();
    }
    x.restore(); x.globalAlpha = 1;
    // 人和狗
    const P = k * (LAND ? .42 : .5);
    const px = (tt) => w * (LAND ? -.05 : -.15) + tt * w * (LAND ? .12 : .2);
    // 脚印：每半秒落一脚
    for (let j = 0; j * .42 <= t; j++) {
      const tk = j * .42, fx = px(tk) + (j % 2 ? .05 : -.05) * P * .3, age = t - tk;
      x.fillStyle = g(.2 + .5 * Math.exp(-age / 1.3)); x.beginPath(); x.ellipse(fx, gy + P * .02 + (j % 2) * P * .025, P * .06, P * .02, 0, 0, TAU); x.fill();
    }
    const dxp = px(t) + P * .55, dog = t * 11;
    for (let j = 0; j * .25 <= t; j++) { const tk = j * .25, age = t - tk; x.fillStyle = g(.2 + .35 * Math.exp(-age / 1)); x.beginPath(); x.ellipse(px(tk) + P * .55 + (j % 2) * P * .18, gy + P * .06, P * .025, P * .01, 0, 0, TAU); x.fill(); }
    // 狗
    x.fillStyle = g(.85); x.beginPath(); x.ellipse(dxp + P * .1, gy - P * .2, P * .17, P * .07, 0, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(dxp + P * .3, gy - P * .29, P * .07, P * .055, -.3, 0, TAU); x.fill();
    x.fillStyle = g(.95); x.beginPath(); x.ellipse(dxp + P * .36, gy - P * .27, P * .04, P * .028, 0, 0, TAU); x.fill();
    x.strokeStyle = g(.7); x.lineCap = 'round'; x.lineWidth = P * .035;
    for (let l = 0; l < 4; l++) { const lx = dxp + P * (-.02 + l * .07), sw = Math.sin(dog + l * 1.6) * P * .05; x.beginPath(); x.moveTo(lx, gy - P * .16); x.lineTo(lx + sw, gy); x.stroke(); }
    x.beginPath(); x.moveTo(dxp - P * .06, gy - P * .23); x.quadraticCurveTo(dxp - P * .16, gy - P * .32 + Math.sin(t * 12) * P * .03, dxp - P * .2, gy - P * .3); x.stroke();
    // 人：外套偏冷，脸和手最热
    const cx = px(t), ph = t * 7.5;
    x.strokeStyle = g(.6); x.lineWidth = P * .09;
    for (const sg of [1, -1]) { const sw = Math.sin(ph) * sg * P * .14; x.beginPath(); x.moveTo(cx, gy - P * .48); x.lineTo(cx + sw * .6, gy - P * .24); x.lineTo(cx + sw, gy); x.stroke(); }
    x.fillStyle = g(.68); rr(x, cx - P * .13, gy - P * .9, P * .26, P * .48, P * .08); x.fill();
    x.strokeStyle = g(.62); x.lineWidth = P * .07;
    for (const sg of [1, -1]) { const sw = -Math.sin(ph) * sg * P * .12; x.beginPath(); x.moveTo(cx, gy - P * .84); x.lineTo(cx + sw, gy - P * .58); x.stroke(); x.fillStyle = g(.92); x.beginPath(); x.arc(cx + sw, gy - P * .56, P * .04, 0, TAU); x.fill(); }
    x.fillStyle = g(.55); x.beginPath(); x.arc(cx, gy - P * 1.0, P * .11, Math.PI, TAU); x.fill();
    x.fillStyle = g(1); x.beginPath(); x.ellipse(cx + P * .015, gy - P * .98, P * .085, P * .1, 0, 0, TAU); x.fill();
    // 呼气：每 1.1 秒一团，向前飘、变大、变冷
    for (let j = 0; j * 1.1 <= t; j++) {
      const age = t - (j * 1.1 + .2); if (age < 0 || age > 1.8) continue;
      const bx = px(j * 1.1 + .2) + P * (.12 + age * .4), by = gy - P * (.97 + age * .12);
      const br = P * (.04 + age * .12);
      const bg = x.createRadialGradient(bx, by, 0, bx, by, br); bg.addColorStop(0, `rgba(255,255,255,${.6 * Math.exp(-age * 1.8)})`); bg.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = bg; x.beginPath(); x.arc(bx, by, br, 0, TAU); x.fill();
    }
    // 整体模糊一点，像热像仪的分辨率
    s.tbx.filter = `blur(${k * .004}px)`; s.tbx.drawImage(s.tc, 0, 0); s.tbx.filter = 'none';
    const SW = smooth(2.4, 3.2, t);
    glDraw(ctx, 'therm', t, W / 2, H / 2, 0, 0, W, H, { TM: s.tb, SW });
    // 十字准星和读数
    const hxS = cx * 2, hyS = (gy - P * .98) * 2, bs = Math.max(46 * u, P * .3);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * u;
    ctx.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.moveTo(hxS + sx * bs, hyS + sy * bs * .5); ctx.lineTo(hxS + sx * bs, hyS + sy * bs); ctx.lineTo(hxS + sx * bs * .5, hyS + sy * bs); }
    ctx.stroke();
    ctx.font = `${Math.round(24 * u)}px 'JetBrains Mono'`; ctx.fillStyle = '#fff'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillText(`${(36.6 + .3 * Math.sin(t * 2)).toFixed(1)}°C`, hxS + bs + 8 * u, hyS - bs);
    const pad_ = 40 * u;
    ctx.fillText(`MAX ${(37 + .2 * Math.sin(t)).toFixed(1)}°C`, pad_, pad_); ctx.fillText(`MIN -${(11.8 + .3 * Math.cos(t * 1.3)).toFixed(1)}°C`, pad_, pad_ + 32 * u);
    ctx.textAlign = 'right'; ctx.fillText(`WIND ${(2 + 7 * smooth(2.3, 3.0, t)).toFixed(1)} m/s`, W - pad_, pad_);
    ctx.fillText(SW > .5 ? 'PALETTE  RAINBOW' : 'PALETTE  IRON', W - pad_, pad_ + 32 * u);
  }
});
