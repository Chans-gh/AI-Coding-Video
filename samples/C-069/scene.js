// C-069 光线步进海面：WebGL 片元着色器里自写光线步进，噪声叠出海浪高度场，按菲涅耳混合天空反射，每像素 2 次采样
// 由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-069', name: '光线步进海面', dur: 4, still: 2.5,
  fonts: [],
  init() {
    glInit(W / 2, H / 2);
    glProgram('sea', `
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y)*2.-1.;}
float oct(vec2 uv,float ch){uv+=vn(uv);vec2 w=1.-abs(sin(uv));vec2 s=abs(cos(uv));w=mix(w,s,w);return pow(1.-pow(w.x*w.y,.65),ch);}
const mat2 M=mat2(1.6,1.2,-1.2,1.6);
float sea(vec3 p,int it){float fr=.16,am=.6,ch=4.,h=0.;vec2 uv=p.xz;uv.x*=.75;float st=1.+T*.8;
 for(int i=0;i<it;i++){float d=oct((uv+st)*fr,ch)+oct((uv-st)*fr,ch);h+=d*am;uv*=M;fr*=1.9;am*=.22;ch=mix(ch,1.,.2);}return p.y-h;}
vec3 sky(vec3 e){float y=max(e.y,0.);vec3 top=vec3(.10,.16,.38),hor=vec3(1.,.55,.28);vec3 c=mix(hor,top,pow(y,.45));
 vec3 sd=normalize(vec3(0.,.07,1.));float s=max(dot(e,sd),0.);c+=vec3(1.,.6,.3)*pow(s,10.)*.45+vec3(1.,.85,.6)*pow(s,900.)*5.;
 c=mix(c,vec3(1.,.72,.5),exp(-y*14.)*.6);return c;}
vec3 nrm(vec3 p,float e){vec3 n;n.y=sea(p,5);n.x=sea(vec3(p.x+e,p.y,p.z),5)-n.y;n.z=sea(vec3(p.x,p.y,p.z+e),5)-n.y;n.y=e;return normalize(n);}
float trace(vec3 o,vec3 d,out vec3 p){float tm=0.,tx=1000.;float hx=sea(o+d*tx,3);if(hx>0.){p=o+d*tx;return tx;}float hm=sea(o,3);float tmid=0.;
 for(int i=0;i<9;i++){tmid=mix(tm,tx,hm/(hm-hx));p=o+d*tmid;float hmid=sea(p,3);if(hmid<0.){tx=tmid;hx=hmid;}else{tm=tmid;hm=hmid;}}return tmid;}
vec3 shade(vec2 fc){vec2 uv=(fc-.5*R)/R.y;uv.y+=.08;vec3 o=vec3(0.,3.2+sin(T*.9)*.25,T*6.);
 vec3 d=normalize(vec3(uv.x,uv.y-.12,1.25));float a=sin(T*.5)*.04;d.xy=mat2(cos(a),-sin(a),sin(a),cos(a))*d.xy;
 vec3 p;trace(o,d,p);vec3 dist=p-o;vec3 n=nrm(p,dot(dist,dist)*.1/R.x);
 float fr=clamp(1.-dot(n,-d),0.,1.);fr=pow(fr,3.)*.65;vec3 refl=sky(reflect(d,n));vec3 base=vec3(.02,.09,.13);
 vec3 lt=normalize(vec3(0.,.07,1.));float dif=pow(dot(n,lt)*.4+.6,80.);vec3 refr=base+dif*vec3(.9,.5,.3)*.12;
 vec3 col=mix(refr,refl,fr);float at=max(1.-dot(dist,dist)*.001,0.);col+=vec3(.5,.3,.2)*(p.y-.6)*.18*at;
 col+=vec3(1.,.8,.55)*pow(max(dot(reflect(d,n),lt),0.),60.)*1.2;
 return mix(sky(d),col,pow(smoothstep(0.,-.02,d.y),.2));}
void main(){vec3 c=vec3(0.);for(int i=0;i<2;i++){c+=shade(gl_FragCoord.xy+vec2(float(i)*.5,float(i)*.5));}c/=2.;
 c=pow(c,vec3(.75));c=c*1.05;O=vec4(c,1.);}`);
    return {};
  },
  draw(ctx, t) {
    glDraw(ctx, 'sea', t + 3, W / 2, H / 2);
    vignette(ctx, .45, .4);
  }
});
