// C-076 科学可视化（黑洞）：WebGL 片元着色器里做光线步进，光线按引力弯曲，穿过吸积盘时累积颜色。
// 由 opus40 的同名场景改写：画幅改成按 W×H 自适应，横屏时镜头略拉近。
scene({
  id: 'C-076', name: '科学可视化（黑洞）', dur: 4, still: 2.6,
  init() {
    // 按画面一半分辨率算（软件渲染也跑得动），再放大铺满
    const w = Math.round(W / 2), h = Math.round(H / 2);
    glInit(w, h);
    glProgram('bh', `
float h31(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}
vec3 bg(vec3 d){vec3 c=vec3(0.);vec3 q=d*220.;vec3 id=floor(q);float h=h31(id);if(h>.985){vec3 f=fract(q)-.5;c+=vec3(1.,.95,.85)*smoothstep(.35,0.,length(f))*(h-.985)*70.;}
 float n=n3(d*3.)*.6+n3(d*7.)*.3;c+=vec3(.25,.12,.35)*pow(n,3.)*.9+vec3(.05,.1,.2)*pow(n3(d*2.+4.),2.)*.6;return c;}
void main(){vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;uv.y-=.02;float a=T*.12;
 vec3 ro=vec3(sin(a)*16.,2.2,-cos(a)*16.);vec3 fw=normalize(-ro+vec3(0.,.2,0.));vec3 rt=normalize(cross(vec3(0,1,0),fw));vec3 up=cross(fw,rt);
 vec3 rd=normalize(fw*ZOOM+uv.x*rt+uv.y*up);vec3 p=ro,v=rd;vec3 col=vec3(0.);float alpha=0.;
 vec3 hh=cross(p,v);float h2=dot(hh,hh);
 for(int i=0;i<220;i++){float r=length(p);float dt=.06*r;vec3 pp=p;
  v+=-1.5*h2*p/pow(r,5.)*dt;p+=v*dt;
  if(r<1.){alpha=1.;break;}
  if(pp.y*p.y<0.){vec3 hit=mix(pp,p,pp.y/(pp.y-p.y));float rr=length(hit.xz);
   if(rr>2.3&&rr<9.){float ang=atan(hit.z,hit.x);float rot=ang+T*2.2/sqrt(rr);
    float ring=n3(vec3(rr*3.,cos(rot)*3.,sin(rot)*3.))*.7+n3(vec3(rr*9.,cos(rot)*6.,sin(rot)*6.))*.4;
    float tmp=pow(clamp(1.-(rr-2.3)/6.7,0.,1.),1.6);vec3 dc=mix(vec3(1.,.35,.08),vec3(1.,.9,.7),tmp)*(.35+2.4*tmp)*ring;
    float dop=1.+.65*dot(normalize(vec3(-hit.z,0.,hit.x)),normalize(ro));dc*=dop*dop;
    float da=clamp(ring*1.4*smoothstep(2.3,2.8,rr)*smoothstep(9.,6.5,rr),0.,1.);col+=dc*da*(1.-alpha);alpha+=da*(1.-alpha);if(alpha>.98)break;}}
  if(r>40.)break;}
 col+=bg(normalize(v))*(1.-alpha);col=1.-exp(-col*1.6);col=pow(col,vec3(.9));O=vec4(col,1.);}`.replace('ZOOM', LAND ? '1.15' : '0.72'));
    return { w, h };
  },
  draw(ctx, t, s) { glDraw(ctx, 'bh', t, s.w, s.h); }
});
