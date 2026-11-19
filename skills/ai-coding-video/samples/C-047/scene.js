// C-047 发布片式粒子隧道：WebGL 全屏着色器把每个像素换成隧道壁上的（角度, 深度）坐标，在这张网格里按哈希撒金色粒子、画环线和纵线，深处渐隐、近处拉成光痕，深度由时间推进造出高速穿行；超大数字标题卡用 Canvas 叠在上面，每两拍硬切一次，最后隧道减速、压暗，品牌字标定格。
// 风格提示词：用模型发布片式粒子风格：黑色空间里金色粒子和光线构成隧道与网格，镜头高速穿行，超大数值标题卡在节拍上切换，整片只用黑、金、白，以品牌字标定格收尾。
// 题材：信息讲解与产品发布 · 适合：模型/产品发布
scene({
  id: 'C-047', name: '发布片式粒子隧道', dur: 5, still: 4.4,
  fonts: ["120px 'Bebas Neue'", "500 30px 'Noto Sans SC'"],
  init() {
    glInit(W / 2, H / 2);
    glProgram('tun', GLSL_LIB + `
uniform float Z, DIM;
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y; float r=length(uv)+1e-3, a=atan(uv.y,uv.x);
  float d=.55/r, wz=d+Z, fog=exp(-d*.16)*smoothstep(.0,.5,r*1.6);
  vec2 g=vec2(a/6.2832*64., wz*2.5); vec2 id=floor(g), f=fract(g)-.5; float h=hash21(id);
  float st=clamp(.08/d,0.,.45);   // 近处的粒子沿深度拉长
  float pt=step(.45,h)*smoothstep(.16,0.,length(f*vec2(1.,1.-st*1.6)))*(.6+.8*hash21(id+3.1));
  float rx=wz*.25, ring=smoothstep(fwidth(rx)*1.5,0.,abs(fract(rx+.5)-.5))*.55;
  float lx=a/6.2832*16., lon=smoothstep(fwidth(lx)*1.2,0.,abs(fract(lx+.5)-.5))*.35;
  float grid=max(ring,lon)*smoothstep(.15,.6,d);
  float ca=floor(a/6.2832*180.), lane=step(.95,hash21(vec2(ca,9.)))*smoothstep(.0,.15,fract(wz*.07+hash21(vec2(ca,2.))))*smoothstep(.5,0.,abs(fract(a/6.2832*180.)-.5))*.6*smoothstep(.2,.8,d);
  vec3 gold=vec3(1.,.74,.32);
  vec3 c=gold*(pt*1.7+grid+lane)*fog;
  c+=vec3(1.,.9,.7)*.25*exp(-r*7.);
  c=mix(c,c*.25,DIM);
  O=vec4(c,1.);
}`);
    return {};
  },
  draw(ctx, t) {
    const u = SHORT / 1080, B = BEAT;
    const slow = smooth(3.3, 4.6, t), Z = t * 9 - slow * (t - 3.3) * 7 + 2 * smooth(1, 1.2, t);
    const cards = [[1.125, '200K', '每秒处理的词元'], [1.875, '8×', '比上一代快'], [2.625, '0.3s', '首字延迟']];
    const ci = cards.findIndex(([a]) => t >= a && t < a + 2 * B), brand = t >= 3.375;
    glDraw(ctx, 'tun', t, W / 2, H / 2, 0, 0, W, H, { Z, DIM: ci >= 0 ? .55 : brand ? .5 + .4 * slow : 0 });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const gold = (y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#FFF6E0'); g.addColorStop(.55, '#F2C66B'); g.addColorStop(1, '#B9832F'); return g; };
    if (ci >= 0) {
      const [a, big, cap] = cards[ci], q = (t - a) / (2 * B), sc = 1.08 - .08 * eOutCubic(Math.min(1, q * 3)), fs = (LAND ? 380 : 330) * u;
      ctx.save(); ctx.translate(W / 2, H * .47); ctx.scale(sc, sc);
      ctx.font = `${Math.round(fs)}px 'Bebas Neue'`; ctx.fillStyle = gold(-fs / 2, fs / 2); ctx.fillText(big, 0, 0);
      ctx.font = `500 ${Math.round(34 * u)}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,240,215,.85)'; ctx.fillText(cap, 0, fs * .52);
      ctx.restore();
      const fl = Math.max(0, 1 - (t - a) / .1); if (fl > 0) { ctx.fillStyle = `rgba(255,236,200,${fl * .5})`; ctx.fillRect(0, 0, W, H); }
    }
    if (brand) {
      const q = inv(3.375, 3.9, t), fs = (LAND ? 220 : 190) * u, sp = lerp(60, 22, eOutCubic(q)) * u;
      ctx.save(); ctx.translate(W / 2, H * .48); ctx.globalAlpha = smooth(3.375, 3.6, t);
      ctx.font = `${Math.round(fs)}px 'Bebas Neue'`; ctx.fillStyle = gold(-fs / 2, fs / 2);
      const txt = 'AURA 7', ws = [...txt].map(c => ctx.measureText(c).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (txt.length - 1); let x = -tw / 2;
      [...txt].forEach((c, i) => { ctx.fillText(c, x + ws[i] / 2, 0); x += ws[i] + sp; });
      const lw = tw * eOutCubic(inv(3.6, 4.2, t)); ctx.fillStyle = '#F2C66B'; ctx.fillRect(-lw / 2, fs * .48, lw, 3 * u);
            // 一道高光扫过字标
      const sx = lerp(-tw, tw, inv(3.9, 4.5, t)); ctx.globalCompositeOperation = 'lighter'; const hg = ctx.createLinearGradient(sx - 80 * u, 0, sx + 80 * u, 0); hg.addColorStop(0, 'rgba(255,255,255,0)'); hg.addColorStop(.5, 'rgba(255,255,255,.35)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = hg; x = -tw / 2; [...txt].forEach((c, i) => { ctx.fillText(c, x + ws[i] / 2, 0); x += ws[i] + sp; });
      ctx.globalCompositeOperation = 'source-over'; ctx.font = `500 ${Math.round(30 * u)}px 'Noto Sans SC'`; ctx.fillStyle = `rgba(255,240,215,${.8 * smooth(3.9, 4.3, t)})`; ctx.fillText('现已发布', 0, fs * .48 + 54 * u);
      ctx.restore();
    }
    vignette(ctx, .5, .45);
  }
});