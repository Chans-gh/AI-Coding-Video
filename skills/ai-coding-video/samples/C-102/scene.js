// C-102 颗粒渐变开场：WebGL 着色器把十几层拱门和光环排在不同深度，每层按 1/深度 缩放，拱门外是从边缘发光、向外渐暗的饱和色墙，由远到近一层层盖上去；镜头深度随时间推进，穿过的层淡出，每个像素加逐帧变化的哈希颗粒；前面一个小光球带路，最后一句小字收尾。
// 风格提示词：用颗粒渐变开场风格：深色底上一层层发光的饱和色形状（同心拱门、光环），带细小颗粒，镜头一路穿过这些层，一个小光球在前面带路，字体小而干净，一句话收尾。
// 题材：平面设计与动态排版 · 适合：科技与 AI、音乐、创意产品发布的开场
scene({
  id: 'C-102', name: '颗粒渐变开场', dur: 5, still: 4.5,
  fonts: ["300 40px 'Noto Sans SC'"],
  init() {
    glInit(W / 2, H / 2);
    glProgram('arch', GLSL_LIB + `
uniform float Z, ASP;
float archD(vec2 p, float w, float h){       // 拱门开口：上半圆 + 下面两条腿
  if(p.y>0.) return length(p)-w;
  return max(abs(p.x)-w, -p.y-h);
}
vec3 pal3(float k){ return pal(k, vec3(.55,.3,.5), vec3(.45,.3,.45), vec3(1.,1.,1.), vec3(.0,.15,.35)); }
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y; uv.y+=.05;
  vec3 c=vec3(.02,.01,.04)+vec3(.12,.04,.18)*exp(-length(uv)*2.5);
  for(int j=0;j<13;j++){
    float i=12.-float(j);                     // 远的先画
    float rel=1.+i*.85-Z; if(rel<.04) continue;
    vec2 p=uv*rel; float k=i*.137;
    float w=ASP>1.? .42:.3, h=3.;
    bool halo=mod(i,3.)==2.;
    float d=halo? length(p-vec2(0.,.05))-w*1.15 : archD(p-vec2(0.,.12),w,h);
    vec3 col=pal3(k+p.y*.25);
    float a=smoothstep(.04,.5,rel)*smoothstep(13.,6.,rel);
    if(halo){
      float ring=exp(-abs(d)*90./rel)*1.3+exp(-abs(d)*9./rel)*.35;
      c+=col*ring*a;
    } else {
      float wall=smoothstep(0.,.004*rel,d);
      vec3 wc=col*(.12+.9*exp(-d*6.))*(.6+.4*vnoise(p*3.+i));
      c=mix(c,wc,wall*a);
      c+=col*exp(-abs(d)*60./rel)*.9*a;
    }
  }
  float g=hash21(gl_FragCoord.xy+fract(T*13.)*vec2(91.,37.))-.5;
  c+=g*.09*(.4+length(c));
  O=vec4(c,1.);
}`);
    return {};
  },
  draw(ctx, t) {
    const u = SHORT / 1080;
    const Z = 3.6 * eInOutCubic(clamp(t / 4.6, 0, 1)) * 1.6 + t * .15;
    glDraw(ctx, 'arch', t, W / 2, H / 2, 0, 0, W, H, { Z, ASP: W / H });
    // 带路的小光球：固定在前方，沿缓慢的曲线漂
    const ox = W / 2 + Math.sin(t * 1.4) * H * .06, oy = H * (.5 - .06) + Math.cos(t * 1.1) * H * .03 + (1 - smooth(0, 1.2, t)) * H * .25;
    const or = 14 * u * (1 + .15 * Math.sin(t * 9));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    let g = ctx.createRadialGradient(ox, oy, 0, ox, oy, or * 10);
    g.addColorStop(0, 'rgba(255,230,250,.55)'); g.addColorStop(.25, 'rgba(255,140,220,.18)'); g.addColorStop(1, 'rgba(120,60,255,0)');
    ctx.fillStyle = g; ctx.fillRect(ox - or * 10, oy - or * 10, or * 20, or * 20);
    g = ctx.createRadialGradient(ox, oy, 0, ox, oy, or);
    g.addColorStop(0, '#fff'); g.addColorStop(.6, 'rgba(255,240,255,.9)'); g.addColorStop(1, 'rgba(255,200,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, or, 0, TAU); ctx.fill();
    ctx.restore();
    // 开头从黑里亮起
    if (t < .6) { ctx.fillStyle = `rgba(0,0,0,${1 - smooth(0, .6, t)})`; ctx.fillRect(0, 0, W, H); }
    // 收尾一句话：底部压暗再写字
    { const k = smooth(3.5, 4.3, t); if (k > 0) { const gg = ctx.createLinearGradient(0, H * .6, 0, H); gg.addColorStop(0, 'rgba(4,2,10,0)'); gg.addColorStop(1, `rgba(4,2,10,${.85 * k})`); ctx.fillStyle = gg; ctx.fillRect(0, H * .6, W, H * .4); } }
    const q = smooth(3.7, 4.3, t);
    if (q > 0) {
      ctx.save(); ctx.globalAlpha = q; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `300 ${Math.round((LAND ? 40 : 46) * u)}px 'Noto Sans SC'`; ctx.fillStyle = '#F6EEFF';
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${(10 + 8 * (1 - q)) * u}px`;
      ctx.fillText('每一次开始，都是一束光', W / 2, H * (LAND ? .86 : .8) + 10 * u * (1 - q));
      ctx.restore();
    }
  }
});
