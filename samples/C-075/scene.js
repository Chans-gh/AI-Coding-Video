// C-075 抽象品牌片：WebGL 着色器在深蓝底上画红、蓝、白三色光环，按节拍换成同心环、斜条和旋转方框三种构图；超大字标先画在小画布上再放大成马赛克，横切成条错位并分出红蓝两层，像素逐拍变细，最后定格成清晰的 Logo。
// 风格提示词：用抽象品牌形象片风格：整片只用品牌的红、蓝、白三色，深色背景上抽象光环扩散，超大字标以像素化和故障效果撞入画面，快节奏卡点切换，以 Logo 定格收尾。
// 题材：3D 与实时图形 · 适合：品牌形象片
scene({
  id: 'C-075', name: '抽象品牌片', dur: 5, still: 4.4,
  fonts: ["120px 'Bebas Neue'", "500 30px 'Noto Sans SC'"],
  init() {
    glInit(W / 2, H / 2);
    glProgram('rings', GLSL_LIB + `
uniform float MODE, PH, KICK, ROT;
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y; uv=rot(ROT)*uv;
  float d;
  if(MODE<.5) d=length(uv);
  else if(MODE<1.5) d=abs(uv.x+uv.y)*.7;
  else { vec2 q=abs(rot(.785+T*.4)*uv); d=max(q.x,q.y); }
  d+=.015*vnoise(uv*6.+T);
  float x=d*7.-PH, k=fract(x), id=floor(x);
  float band=smoothstep(.0,.03,k)*smoothstep(.22,.12,k);
  float h=hash21(vec2(id,MODE));
  vec3 red=vec3(1.,.18,.25), blue=vec3(.16,.36,1.), wht=vec3(1.);
  vec3 col=h<.42?red:h<.84?blue:wht;
  float fade=exp(-d*1.6)*(.35+.65*KICK);
  vec3 c=vec3(.03,.045,.09)+col*band*fade*1.4;
  c+=col*.12*exp(-k*6.)*fade;                 // 光环后面的拖影
  c+=vec3(.2,.3,1.)*.18*exp(-length(uv)*3.)*KICK;
  O=vec4(c,1.);
}`);
    const sm = document.createElement('canvas');
    return { sm, sx: sm.getContext('2d') };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, B = BEAT, bi = Math.floor(t / B), bt = (t - bi * B) / B;
    const end = 3.75, fin = t >= end;
    const KICK = Math.exp(-bt * 4), MODE = fin ? 0 : [0, 1, 2, 0, 2, 1, 0, 1, 2, 0][bi % 10];
    glDraw(ctx, 'rings', t, W / 2, H / 2, 0, 0, W, H, { MODE, PH: t * 3 + bi * .7, KICK: fin ? .4 + .6 * Math.exp(-(t - end) * 3) : KICK, ROT: fin ? 0 : hash1(bi * 7.3) * 2 - 1 });
    if (fin) { ctx.fillStyle = `rgba(6,9,20,${.55 * smooth(end, end + .4, t)})`; ctx.fillRect(0, 0, W, H); }
    // 字标：小画布上写字，放大成马赛克
    const word = ['N', 'NO', 'NOV', 'NOVA', 'NOVA', 'NOVA', 'NOVA', 'NOVA', 'NOVA', 'NOVA'][Math.min(9, bi)];
    const fs = (LAND ? 520 : 400) * u * (fin ? .78 : 1.12 - .12 * eOutCubic(Math.min(1, bt * 2.5)));
    const px = fin ? 1 : Math.max(2, Math.round(u * [44, 36, 30, 24, 20, 16, 12, 9, 6, 4][Math.min(9, bi)] * (1 + 1.5 * KICK)));
    const cy = fin ? H * (LAND ? .44 : .45) : H / 2;
    const { sm, sx } = s, sw = Math.ceil(W / px), sh = Math.ceil(H / px);
    if (sm.width !== sw || sm.height !== sh) { sm.width = sw; sm.height = sh; }
    sx.clearRect(0, 0, sw, sh);
    sx.font = `${Math.round(fs / px)}px 'Bebas Neue'`; sx.textAlign = 'center'; sx.textBaseline = 'middle';
    sx.fillStyle = '#fff'; if (sx.letterSpacing !== undefined) sx.letterSpacing = `${(fin ? 30 : 6) * u / px}px`;
    sx.fillText(word, sw / 2, cy / px);
    ctx.imageSmoothingEnabled = false;
    const gl = fin ? Math.max(0, 1 - (t - end) * 5) : Math.max(KICK, .25);
    const shift = 34 * u * gl;
    if (gl > .02) {
      // 红蓝两层错开
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [col, dx] of [['#FF2E3F', -shift], ['#2A5BFF', shift]]) {
        const tc = mk(sw, sh), tx = tc.getContext('2d');
        tx.drawImage(sm, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = col; tx.fillRect(0, 0, sw, sh);
        ctx.globalAlpha = .85; ctx.drawImage(tc, dx, 0, sw * px, sh * px);
      }
      ctx.restore();
    }
    // 白层：横切成条错位
    const n = 14, bh = H / n;
    for (let i = 0; i < n; i++) {
      const hsh = hash2(i, bi * 3 + (fin ? 99 : 0)), off = (hsh > .6 ? (hash2(i, bi + 5) - .5) * 160 * u : 0) * gl;
      const y0 = Math.floor(i * bh / px), y1 = Math.floor((i + 1) * bh / px);
      if (y1 > y0) ctx.drawImage(sm, 0, y0, sw, y1 - y0, off, y0 * px, sw * px, (y1 - y0) * px);
    }
    ctx.imageSmoothingEnabled = true;
    // 定格：标志圆环、细线、标语
    if (fin) {
      const q = eOutCubic(smooth(end, end + .5, t)), mw = (LAND ? 300 : 260) * u;
      const ty = cy + fs * .42;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * u;
      ctx.beginPath(); ctx.moveTo(W / 2 - mw * q, ty + 24 * u); ctx.lineTo(W / 2 + mw * q, ty + 24 * u); ctx.stroke();
      ctx.fillStyle = '#FF2E3F'; ctx.fillRect(W / 2 - mw * q, ty + 22 * u, 40 * u * q, 7 * u);
      ctx.fillStyle = '#2A5BFF'; ctx.fillRect(W / 2 + mw * q - 40 * u * q, ty + 22 * u, 40 * u * q, 7 * u);
      ctx.globalAlpha = smooth(end + .3, end + .7, t);
      ctx.font = `500 ${Math.round(40 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${12 * u}px`;
      ctx.fillStyle = '#E8ECF8'; ctx.fillText('看见下一种可能', W / 2, ty + 60 * u);
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px';
      ctx.globalAlpha = 1;
    }
    // 每拍一闪
    if (!fin && bt < .12) { ctx.fillStyle = `rgba(255,255,255,${.25 * (1 - bt / .12)})`; ctx.fillRect(0, 0, W, H); }
    if (t > end && t < end + .08) { ctx.fillStyle = `rgba(255,255,255,${.7 * (1 - (t - end) / .08)})`; ctx.fillRect(0, 0, W, H); }
    grain(ctx, Math.floor(t * 30), .05);
  }
});
