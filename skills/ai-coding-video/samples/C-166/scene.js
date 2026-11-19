// C-166 60 年代液体灯光秀：WebGL 着色器用三层嵌套的分形噪声做区域扭曲，把品红、橙、绿、紫挤成不停旋转的漩涡色带；按网格撒的油泡随流场漂移，泡内颜色偏移、边缘一圈暗环和一点高光；每两拍从中心荡开一圈涟漪去扭曲采样坐标；手绘的黑墨透明片先在 Canvas 上用粗细变化的线条画好，作为贴图慢慢漂移，墨的地方乘掉灯光；灯光是一个边缘发暗的投影圆，偶尔熄灭又亮起。
// 风格提示词：用60 年代液体灯光秀风格：投影仪下一只玻璃皿里油、水和染料不停旋转交融，品红、橙、绿、紫被挤成气泡和漩涡，上面叠着手绘透明片，黑墨处真的挡住灯光，每个重拍都在液面荡开一圈，灯偶尔熄灭又亮起，配迷幻摇滚。
// 题材：电影年代与屏幕科技 · 适合：迷幻音乐 MV、间奏与转场、梦境段落
scene({
  id: 'C-166', name: '60 年代液体灯光秀', dur: 5, still: 1.9,
  fonts: [],
  init() {
    glInit(W / 2, H / 2);
    glProgram('oil', GLSL_LIB + `
uniform sampler2D INK; uniform float LAMP, RIP[7], ASP;
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  for(int i=0;i<7;i++){ float a=T-RIP[i]; if(a>0.&&a<1.6){ float r=length(uv), d=r-a*.55; uv+=uv/(r+1e-3)*sin(d*45.)*exp(-d*d*60.)*exp(-a*2.)*.018; } }
  vec2 p=rot(T*.12)*uv*1.5;
  vec2 q=vec2(fbm(p+T*.12),fbm(p+vec2(5.2,1.3)-T*.1));
  vec2 r=vec2(fbm(p+3.*q+vec2(1.7,9.2)+T*.2),fbm(p+3.*q+vec2(8.3,2.8)-T*.16));
  float n=fbm(p+3.5*r);
  float k=fract(n*2.6+r.x*.8+T*.05);
  vec3 c1=vec3(1.,.08,.55), c2=vec3(1.,.5,.02), c3=vec3(.15,.9,.25), c4=vec3(.5,.08,.85);
  vec3 col=k<.25?mix(c1,c2,smoothstep(.15,.25,k)):k<.5?mix(c2,c3,smoothstep(.4,.5,k)):k<.75?mix(c3,c4,smoothstep(.65,.75,k)):mix(c4,c1,smoothstep(.9,1.,k));
  col*=.55+.6*smoothstep(.2,.8,n);
  // 油泡
  vec2 bp=uv*4.+r*1.2+vec2(T*.15,-T*.1);
  vec2 id=floor(bp), f=fract(bp);
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 o=vec2(float(i),float(j)), cid=id+o; float h=hash21(cid);
    if(h<.45) continue;
    vec2 cc=o+.5+.3*vec2(sin(T*.7+h*20.),cos(T*.6+h*13.))-f;
    float rad=.12+.25*hash21(cid+7.), d=length(cc);
    if(d<rad){
      float e=d/rad;
      col=mix(col,col.gbr*1.1+.08,.35*(1.-e*e));
      col*=1.-.55*smoothstep(.78,.95,e)*smoothstep(1.,.95,e);
      col+=vec3(1.)*.5*smoothstep(.2,.0,length(cc+rad*vec2(.35,-.35))/rad);
    }
  }
  // 投影灯圈
  float L=length(uv*vec2(ASP>1.?.62:1.,ASP>1.?1.:.62*1.0));
  col*=smoothstep(.85,.3,L)*1.15+.02;
  // 手绘透明片
  vec2 tu=rot(sin(T*.4)*.05)*(uv+vec2(.02*sin(T*.5),.015*cos(T*.4)));
  vec2 tuv=vec2(tu.x*R.y/R.x,tu.y)+.5; tuv.y=1.-tuv.y;
  float ink=texture(INK,tuv).a;
  col*=1.-ink*.96;
  col=pow(col,vec3(.9))*LAMP;
  O=vec4(col,1.);
}`);
    // 透明片：粗细变化的黑墨线
    const ink = mk(W / 2, H / 2), x = ink.getContext('2d'), R = mulberry32(166), su = Math.min(W, H) / 2 / 540;
    x.translate(W / 4, H / 4); x.lineCap = 'round'; x.lineJoin = 'round'; x.fillStyle = x.strokeStyle = '#000';
    const line = (pts, w0) => { for (let i = 1; i < pts.length; i++) { x.lineWidth = w0 * su * (.5 + .9 * Math.sin(i / pts.length * Math.PI)); x.beginPath(); x.moveTo(...pts[i - 1]); x.lineTo(...pts[i]); x.stroke(); } };
    // 中间一只眼
    const ex = 0, ey = -40, eW = LAND ? 190 : 150;
    const lid = s => Array.from({ length: 40 }, (_, i) => { const a = i / 39; return [(a - .5) * 2 * eW * su, ey * su + s * Math.sin(a * Math.PI) * eW * .5 * su]; });
    line(lid(-1), 12); line(lid(1), 12);
    x.beginPath(); x.arc(ex, ey * su, eW * .3 * su, 0, TAU); x.lineWidth = 7 * su; x.stroke();
    x.beginPath(); x.arc(ex, ey * su, eW * .13 * su, 0, TAU); x.fill();
    for (let i = 0; i < 9; i++) { const a = Math.PI * (1.12 + i * .095); line([[Math.cos(a) * eW * .82 * su * 1.05, ey * su + Math.sin(a) * eW * .48 * su], [Math.cos(a) * eW * 1.05 * su, ey * su + Math.sin(a) * eW * .78 * su]], 7); }
    // 四周的光线和星星
    const RR = LAND ? 330 : 300;
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * TAU, pts = [];
      for (let k = 0; k < 20; k++) { const r = (RR + k * 9) * su; pts.push([Math.cos(a + Math.sin(k * .5) * .05) * r, ey * su + Math.sin(a + Math.sin(k * .5) * .05) * r]); }
      line(pts, 9);
    }
    for (let i = 0; i < 9; i++) {
      const a = R() * TAU, r = (RR * .6 + R() * 140) * su, sx = Math.cos(a) * r * 1.6, sy = Math.sin(a) * r + ey * su, sr = (14 + R() * 12) * su;
      if (Math.hypot(sx, sy - ey * su) < eW * 1.1 * su) continue;
      x.beginPath(); for (let k = 0; k < 10; k++) { const rr_ = k % 2 ? sr * .4 : sr, aa = k / 10 * TAU; x.lineTo(sx + Math.cos(aa) * rr_, sy + Math.sin(aa) * rr_); } x.closePath(); x.fill();
    }
    // 下面一行手写波浪线
    for (let j = 0; j < 2; j++) line(Array.from({ length: 60 }, (_, i) => [(i / 59 - .5) * (LAND ? 900 : 640) * su, (RR + 130 + j * 34) * su + Math.sin(i * .5 + j) * 12 * su]), 8);
    return { ink };
  },
  draw(ctx, t, s) {
    const B = BEAT, rips = [0, 1, 2, 3, 4, 5, 6].map(i => i * 2 * B);
    // 灯：两次熄灭再亮起，亮起时有一点闪
    const off = (a, b) => (t > a && t < b) ? 0 : 1;
    const fl = .9 + .1 * hash1(Math.floor(t * 24) * 3.1);
    const LAMP = off(2.6, 2.78) * off(4.2, 4.3) * fl * (t > 2.78 && t < 2.9 ? .6 + 3 * (t - 2.78) : 1) * smooth(0, .4, t);
    glDraw(ctx, 'oil', t, W / 2, H / 2, 0, 0, W, H, { INK: s.ink, LAMP, RIP: rips, ASP: W / H });
    grain(ctx, Math.floor(t * 24), .06);
  }
});
