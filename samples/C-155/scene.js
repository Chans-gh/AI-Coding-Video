// C-155 液态融合：WebGL 着色器把十几颗圆的「场」（半径² / 距离²）加起来，取场值等于 1 的等值线当液体边界，所以两团靠近自动粘连、拉开时先出细颈再断；液体表面的高度取 1 − 1/场，用它的梯度当法线算出一颗硬边高光和边缘暗环；圆心位置由 JS 按时间算，小液滴取主体两三帧前的位置；转场是一道带高斯凸起的波浪前沿扫过，前沿两边换一套底色和液体色，最后液滴汇成两个圆组成的标志。
// 风格提示词：用液态融合风格：纯色背景上的高光泽液体图形，两团靠近就自动粘连融合，分开时拉出细颈再断裂回弹，小液滴晚两三帧跟着主体被甩出去，转场是一道带几个凸起的波浪前沿泼过整屏，结尾一滴液体聚合成标志，表面用场的梯度假装出立体高光，配水滴和吸管声。
// 题材：平面设计与动态排版 · 适合：饮料与食品广告、标志演绎、音乐转场包装
const LQ_N = 12;
scene({
  id: 'C-155', name: '液态融合', dur: 5, still: 4.5,
  fonts: ["120px 'Bebas Neue'", "500 30px 'Noto Sans SC'"],
  init() {
    glInit(W / 2, H / 2);
    glProgram('liq', `
uniform float B[${LQ_N * 3}]; uniform float WX, SC;
float field(vec2 p){ float f=0.; for(int i=0;i<${LQ_N};i++){ vec2 c=vec2(B[i*3],B[i*3+1]); float r=B[i*3+2]; vec2 d=p-c; f+=r*r/(dot(d,d)+1e-4); } return f; }
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y/SC;
  // 波浪前沿：前沿左边是第二套颜色
  float fr=WX+.035*sin(uv.y*9.+T*6.)+.09*exp(-pow((uv.y-.18)*9.,2.))+.06*exp(-pow((uv.y+.25)*11.,2.))+.07*exp(-pow((uv.y-.42)*12.,2.));
  float side=smoothstep(.003,-.003,uv.x-fr);
  vec3 bg=mix(vec3(1.,.83,.25),vec3(.12,.2,.95),side);
  vec3 lc=mix(vec3(.12,.2,.95),vec3(1.,.36,.3),side);
  float f=field(uv), e=1.5/R.y;
  float fx=field(uv+vec2(e,0.)), fy=field(uv+vec2(0.,e));
  float h=1.-1./max(f,1e-3), hx=1.-1./max(fx,1e-3), hy=1.-1./max(fy,1e-3);
  vec3 n=normalize(vec3(-(hx-h)/e*.02,-(hy-h)/e*.02,1.));
  float fs=field(uv+vec2(-.012,.018));                  // 投影
  vec3 c=bg*(1.-.16*smoothstep(.85,1.05,fs));
  float w=fwidth(f);
  float inside=smoothstep(1.-w,1.+w,f);
  vec3 L=normalize(vec3(-.5,.6,.65));
  float dif=.55+.45*max(dot(n,L),0.);
  float sp=smoothstep(.955,.965,dot(reflect(-L,n),vec3(0.,0.,1.)));
  float rim=smoothstep(.0,.25,h);
  vec3 lq=lc*dif*(.75+.25*rim)+vec3(1.)*sp*.9+vec3(1.)*.18*pow(max(dot(reflect(-L,n),vec3(0.,0.,1.)),0.),12.)+vec3(1.)*.12*pow(1.-n.z,2.);
  c=mix(c,lq,inside);
  // 前沿本身是一条液体边：亮边
  c=mix(c,mix(vec3(.12,.2,.95),vec3(1.),.25),exp(-pow((uv.x-fr)*R.y/3.,2.))*step(-.9,WX)*step(WX,.95));
  O=vec4(c,1.);
}`);
    return {};
  },
  draw(ctx, t) {
    const u = SHORT / 1080, ax = 1;
    const bo = (k) => { const c = 1.70158; k -= 1; return 1 + (c + 1) * k * k * k + c * k * k; };
    // 两个主体在 t 时刻的位置
    const main = (t) => {
      const a = eOutCubic(clamp(t / 1.0, 0, 1)), s = clamp((t - 1.25) / .8, 0, 1), sp = s < 1 ? bo(s) : 1;
      return [[lerp(-.75, -.1, a) * ax - .1 * sp * ax, .24 * sp + .02 * Math.sin(t * 3), .18], [lerp(.75, .1, a) * ax + .1 * sp * ax, -.24 * sp - .02 * Math.sin(t * 3), .18]];
    };
    const L = [.4, .38, .22];  // 标志：大圆 + 小圆
    const logo = [[-.07 * ax / Math.max(ax, .8), .06, .17], [.13 * ax / Math.max(ax, .8), -.06, .11]];
    const m = main(t), m2 = main(t - .1), m3 = main(t - .18);
    const balls = [m[0], m[1]];
    // 小液滴：晚几帧跟着，分开时被甩出去
    const fling = smooth(1.3, 2.0, t);
    [[m2, 1, .055, .2], [m3, 1, .04, .3], [m2, 0, .05, -.22], [m3, 0, .038, -.33], [main(t - .26), 1, .03, .42], [main(t - .3), 0, .028, -.45]].forEach(([mm, i, r, off]) => {
      balls.push([mm[i][0] + off * fling * ax, mm[i][1] * (1 + .5 * fling), r * (.3 + .7 * fling)]);
    });
    while (balls.length < LQ_N) balls.push([9, 9, 0]);
    // 收尾：全部汇向标志
    const cv = eInOutCubic(smooth(3.0, 4.0, t));
    balls.forEach((b, i) => {
      const tg = logo[i % 2 === 0 ? 0 : 1], tr = i < 2 ? logo[i][2] : 0;
      b[0] = lerp(b[0], i < 2 ? logo[i][0] : tg[0], cv); b[1] = lerp(b[1], i < 2 ? logo[i][1] : tg[1], cv); b[2] = lerp(b[2], tr, cv * cv);
    });
    const wx = lerp(-1.2, 1.2, eInOutCubic(smooth(2.2, 3.0, t))) * (W / H) * .5 / .5 * .5 * 2;
    glDraw(ctx, 'liq', t, W / 2, H / 2, 0, 0, W, H, { B: balls.flat(), WX: t < 2.2 ? -9 : t > 3.0 ? 9 : wx, SC: LAND ? 1 : .6 });
    const q = smooth(3.8, 4.3, t);
    if (q > 0) {
      ctx.save(); ctx.globalAlpha = q; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const y = H * (LAND ? .82 : .72) + 20 * u * (1 - q);
      ctx.font = `${Math.round(120 * u)}px 'Bebas Neue'`; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${14 * u}px`;
      ctx.fillStyle = '#FFF4E8'; ctx.fillText('LIQUA', W / 2, y);
      ctx.font = `500 ${Math.round(30 * u)}px 'Noto Sans SC'`; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${10 * u}px`;
      ctx.fillText('让每一滴都有形状', W / 2, y + 85 * u);
      ctx.restore();
    }
  }
});
