// C-149 早期光线追踪 CGI：WebGL 着色器对每个像素发一条光线，解析求交四个球和地面，算硬阴影、带一颗硬边白高光的塑料材质、红白棋盘地面和最多三次镜面反弹（铬球映出扭曲的环境），天空是紫到青的渐变；开场同一台相机先用 Canvas 投影画绿色线框，再由一条扫描线自上而下把渲染结果逐行露出来，镜头一直绕场景慢慢转。
// 风格提示词：用早期光线追踪 CGI风格：90 年代初电脑图形的样子，所有物体都是同一种光滑塑料，带一颗硬边白色高光，地面是无限延伸的红白棋盘格并映出倒影，铬球反射出扭曲的环境，背景是紫到青的渐变天空，开场先显示绿色线框再逐行扫描渲染出来，镜头沿轨道慢慢绕转。
// 题材：3D 与实时图形 · 适合：计算机图形学史、复古科技片、怀旧片头
const RT_SPH = [[0, 1, 0, 1, 0], [-2.2, .6, .9, .6, 1], [2.0, .7, -.5, .7, 2], [.9, .35, 1.9, .35, 3], [-1.1, .45, -2.1, .45, 4]];
scene({
  id: 'C-149', name: '早期光线追踪 CGI', dur: 5, still: 4.4,
  fonts: ["24px 'JetBrains Mono'"],
  init() {
    glInit(W, H);
    glProgram('rt', `
uniform vec3 RO, RT, UP, FW; uniform float F;
const int NS=5;
vec4 S[NS]; vec3 MC[NS];
float iS(vec3 ro, vec3 rd, vec4 s){ vec3 oc=ro-s.xyz; float b=dot(oc,rd), c=dot(oc,oc)-s.w*s.w, h=b*b-c; if(h<0.) return -1.; h=sqrt(h); float t=-b-h; return t>1e-3?t:(-b+h>1e-3?-b+h:-1.); }
float hit(vec3 ro, vec3 rd, out int id){
  float tm=1e9; id=-1;
  for(int i=0;i<NS;i++){ float t=iS(ro,rd,S[i]); if(t>0.&&t<tm){tm=t;id=i;} }
  if(rd.y<0.){ float t=-ro.y/rd.y; if(t<tm){tm=t;id=99;} }
  return tm;
}
vec3 sky(vec3 rd){ float k=clamp(rd.y*1.6+.15,0.,1.); return mix(vec3(.55,.25,.75),vec3(.25,.85,.95),k)*(1.-.25*k); }
void main(){
  ${RT_SPH.map((q, i) => `S[${i}]=vec4(${q.slice(0, 4).map(v => v.toFixed(3)).join(',')});`).join(' ')}
  MC[0]=vec3(.9); MC[1]=vec3(.9,.12,.1); MC[2]=vec3(.12,.3,.95); MC[3]=vec3(.95,.8,.1); MC[4]=vec3(.1,.8,.35);
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  vec3 ro=RO, rd=normalize(uv.x*RT+uv.y*UP+F*FW);
  vec3 L=normalize(vec3(-.55,.8,.35)), col=vec3(0.), thr=vec3(1.);
  for(int b=0;b<3;b++){
    int id; float t=hit(ro,rd,id);
    if(id<0){ col+=thr*sky(rd); break; }
    vec3 p=ro+rd*t, n, base; float refl;
    if(id==99){ n=vec3(0.,1.,0.); float ch=mod(floor(p.x)+floor(p.z),2.); base=ch<.5?vec3(.85,.08,.08):vec3(.95); refl=.32; }
    else { vec4 s=S[0]; base=MC[0]; for(int i=0;i<NS;i++) if(i==id){ s=S[i]; base=MC[i]; } n=normalize(p-s.xyz); refl=id==0?.88:.12; }
    int sid; float st=hit(p+n*1e-3,L,sid); float sh=sid<0?1.:.35;
    float dif=max(dot(n,L),0.)*sh;
    vec3 r=reflect(rd,n);
    float spc=smoothstep(.965,.975,dot(r,L))*sh;
    vec3 loc=base*(.22+.78*dif)+vec3(1.)*spc*(id==99?0.:1.);
    if(id==99){ float fog=1.-exp(-t*.035); loc=mix(loc,sky(vec3(rd.x,.0,rd.z)),fog); refl*=1.-fog; }
    col+=thr*loc*(1.-refl);
    thr*=refl*(id==0?vec3(.95,.97,1.):vec3(1.));
    ro=p+n*1e-3; rd=r;
    if(b==2) col+=thr*sky(rd);
  }
  O=vec4(col,1.);
}`);
    return {};
  },
  draw(ctx, t) {
    const u = SHORT / 1080;
    const A = .5 + t * .22, D = LAND ? 7.2 : 9.5, ch = 2.1;
    const ro = [Math.sin(A) * D, ch, Math.cos(A) * D], ta = [0, .6, 0];
    const nrm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
    const fw = nrm(ta.map((x, i) => x - ro[i])), rt = nrm([-fw[2], 0, fw[0]]);
    const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
    const F = 1.7;
    const scanY = H * clamp((t - 1.5) / 1.9, 0, 1);
    if (t > 1.5) glDraw(ctx, 'rt', t, W, H, 0, 0, W, H, { RO: ro, RT: rt, UP: up, FW: fw, F });
    // 线框部分：扫描线以下
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const P = p => { const v = [p[0] - ro[0], p[1] - ro[1], p[2] - ro[2]], z = dot(v, fw); return z < .1 ? null : [W / 2 + dot(v, rt) / z * F * H, H / 2 - dot(v, up) / z * F * H]; };
    if (scanY < H) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, scanY, W, H - scanY); ctx.clip();
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#3CFF6A'; ctx.lineWidth = 1.6 * u; ctx.shadowColor = '#3CFF6A'; ctx.shadowBlur = 6 * u;
      const seg = (pts) => { ctx.beginPath(); let pen = false; for (const q of pts) { const s = P(q); if (!s) { pen = false; continue; } pen ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); pen = true; } ctx.stroke(); };
      const gp = smooth(0, .5, t);
      ctx.globalAlpha = gp;
      for (let k = -10; k <= 10; k++) { const L = []; const M = []; for (let j = -10; j <= 10; j += .5) { L.push([k, 0, j]); M.push([j, 0, k]); } seg(L); seg(M); }
      RT_SPH.forEach(([x, y, z, r], i) => {
        ctx.globalAlpha = smooth(.25 + i * .18, .55 + i * .18, t);
        for (let a = 0; a < 8; a++) { const L = []; for (let b = 0; b <= 24; b++) { const th = b / 24 * Math.PI, ph = a / 8 * Math.PI; L.push([x + r * Math.sin(th) * Math.cos(ph), y + r * Math.cos(th), z + r * Math.sin(th) * Math.sin(ph)]); } seg(L); }
        for (let a = 1; a < 6; a++) { const L = [], th = a / 6 * Math.PI; for (let b = 0; b <= 32; b++) { const ph = b / 32 * TAU; L.push([x + r * Math.sin(th) * Math.cos(ph), y + r * Math.cos(th), z + r * Math.sin(th) * Math.sin(ph)]); } seg(L); }
      });
      ctx.restore();
      if (t > 1.5) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(0, scanY - 2 * u, W, 4 * u); ctx.fillStyle = 'rgba(160,255,255,.25)'; ctx.fillRect(0, scanY - 14 * u, W, 12 * u); }
    }
    // 状态行
    const pct = Math.round(100 * clamp((t - 1.5) / 1.9, 0, 1));
    const msg = t < 1.5 ? 'WIREFRAME  5 SPHERES  1 PLANE' : pct < 100 ? `TRACING  LINE ${String(Math.round(scanY / H * 1080)).padStart(4, '0')}/1080  ${pct}%` : 'DONE  3 BOUNCES  FRAME 0001';
    ctx.font = `${Math.round(24 * u)}px 'JetBrains Mono'`; ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
    const tw = ctx.measureText(msg).width;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(30 * u, H - 74 * u, tw + 30 * u, 44 * u);
    ctx.fillStyle = t < 1.5 ? '#3CFF6A' : '#E8FFF0'; ctx.fillText(msg, 45 * u, H - 40 * u);
  }
});
