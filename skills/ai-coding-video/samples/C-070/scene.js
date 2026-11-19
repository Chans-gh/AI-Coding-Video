// C-070 实时 WebGL 自然：全屏片元着色器里，水面高度 = 几道慢波 + 每次点击激起的一圈衰减涟漪；用高度的梯度当法线，把水底按法线偏移采样（折射），水底是 Voronoi 鹅卵石（每块按到边缘的距离做出圆顶明暗），再乘一层迭代三角函数算出的焦散光纹，最后加天光的高光；Canvas 上画一个指针在几处水面点下去，点的时刻和位置作为 uniform 数组传进着色器。
// 风格提示词：用实时 WebGL 自然场景风格：单个 HTML 里用着色器模拟浅水波浪、涟漪和水底焦散光纹，水下是程序生成的鹅卵石，镜头缓慢漂移并会被点击激起水波，写实光照。
// 题材：3D 与实时图形 · 适合：环境、壁纸
const TAPS = [[.62, .3, -.1], [1.45, -.35, .18], [2.2, .25, .22], [2.95, -.05, -.25], [3.65, .42, .05], [4.3, -.4, -.2]];
scene({
  id: 'C-070', name: '实时 WebGL 自然', dur: 5, still: 3.1,
  fonts: [],
  init() {
    glInit(W / 2, H / 2);
    glProgram('water', GLSL_LIB + `
uniform float DR[18]; uniform vec2 CAM;
float hgt(vec2 p){
  float h=.018*sin(p.x*3.1+T*1.3)+.014*sin(p.y*4.3-T*1.1+p.x*1.7)+.008*sin((p.x+p.y)*7.+T*2.2);
  for(int i=0;i<6;i++){vec2 c=vec2(DR[i*3+1],DR[i*3+2]);float dt=T-DR[i*3];if(dt>0.){float d=length(p-c),w=d-dt*.55;h+=.05*exp(-w*w*30.)*sin(w*38.)*exp(-dt*.7)/(1.+d*2.5);}}
  return h;}
vec2 vor(vec2 p, out vec2 cid){vec2 i=floor(p),f=fract(p);float d1=8.,d2=8.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y),o=vec2(hash21(i+g),hash21(i+g+17.))*.8+.1,r=g+o-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;cid=i+g;}else if(d<d2)d2=d;}return vec2(sqrt(d1),sqrt(d2));}
vec3 bed(vec2 p){
  vec2 id; vec2 v=vor(p*7.,id); float e=v.y-v.x, h=hash21(id);
  vec3 c=h<.3?vec3(.55,.52,.47):h<.55?vec3(.66,.55,.40):h<.75?vec3(.45,.40,.36):h<.9?vec3(.60,.42,.32):vec3(.42,.47,.40);
  c*=.8+.4*vnoise(p*40.+h*9.);
  float dome=smoothstep(.04,.4,e); c*=.45+.7*dome; c+=.1*smoothstep(.2,.5,e)*(1.-v.x);
  vec3 sand=vec3(.58,.52,.42)*(.85+.3*vnoise(p*90.));
  return mix(sand*.8,c,smoothstep(.03,.1,e));}
float caus(vec2 q){vec2 p=mod(q,6.2832)-250.,i=p;float c=1.,inten=.005;for(int n=0;n<5;n++){float t=T*.6*(1.-(3.5/float(n+1)));i=p+vec2(cos(t-i.x)+sin(t+i.y),sin(t-i.y)+cos(t+i.x));c+=1./length(vec2(p.x/(sin(i.x+t)/inten),p.y/(cos(i.y+t)/inten)));}c/=5.;c=1.17-pow(c,1.4);return clamp(pow(abs(c),8.),0.,1.2);}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y, p=uv*1.15+CAM;
  float e=.004, h=hgt(p); vec2 g=vec2(hgt(p+vec2(e,0))-h,hgt(p+vec2(0,e))-h)/e;
  vec3 n=normalize(vec3(-g,1.));
  vec2 q=p+n.xy*.08;
  vec3 c=bed(q);
  float k=caus(q*2.2+vec2(3.,7.)); c*=.5+1.4*k*vec3(1.,.95,.8);
  c=mix(c,vec3(.12,.38,.42),.28);
  float sp=pow(max(0.,dot(n,normalize(vec3(.35,.45,1.)))),400.)*1.6; c+=vec3(1.,.97,.9)*sp;
  c+=vec3(.6,.8,.9)*.5*(1.-n.z);
  O=vec4(pow(c,vec3(.95)),1.);
}`);
    return {};
  },
  draw(ctx, t) {
    const u = SHORT / 1080, s = H / 2 / 1.15 * 2, CAM = [t * .03, t * .015];   // 1 单位水面 = s 像素
    const dr = TAPS.flatMap(([a, x, y]) => [a, x, y]);
    glDraw(ctx, 'water', t, W / 2, H / 2, 0, 0, W, H, { DR: dr, CAM });
    // 指针：在点之间移动，点下去时缩一下、荡开一圈
    const toPx = ([x, y]) => [W / 2 + (x - CAM[0]) / 1.15 * H, H / 2 - (y - CAM[1]) / 1.15 * H];
    let k = TAPS.findIndex(([a]) => a > t); if (k < 0) k = TAPS.length;
    const A = k > 0 ? TAPS[k - 1] : [-.4, LAND ? .9 : .5, -.6], B = k < TAPS.length ? TAPS[k] : [5.4, .2, -.7];
    const q = eInOutCubic(inv(A[0] + .15, B[0] - .1, t)), [x, y] = toPx([lerp(A[1], B[1], q), lerp(A[2], B[2], q)]);
    const press = k > 0 ? Math.max(0, 1 - (t - A[0]) / .18) : 0, sc = 1 - .2 * press;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc * u, sc * u);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.moveTo(6, 8); ctx.lineTo(6, 62); ctx.lineTo(20, 50); ctx.lineTo(30, 72); ctx.lineTo(40, 67); ctx.lineTo(30, 46); ctx.lineTo(48, 46); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 54); ctx.lineTo(14, 42); ctx.lineTo(24, 64); ctx.lineTo(34, 59); ctx.lineTo(24, 38); ctx.lineTo(42, 38); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    for (const [a, tx, ty] of TAPS) { const r = (t - a) / .5; if (r <= 0 || r >= 1) continue; const [px, py] = toPx([tx, ty]); ctx.strokeStyle = `rgba(255,255,255,${.7 * (1 - r)})`; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(px, py, (12 + 60 * r) * u, 0, TAU); ctx.stroke(); }
    vignette(ctx, .3, .5);
  }
});