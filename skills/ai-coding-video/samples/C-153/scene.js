// C-153 合成波（Synthwave）：先在离屏 Canvas 上画整幅画面：深紫渐变天空和星星，一轮橙粉渐变落日用 destination-out 挖出越往下越宽的横缝，线框山脉，品红透视网格的横线按 1/深度 排列并随时间滚动，每条亮线先画一层宽而淡的辉光再画一层细亮的；镀铬大字用多段渐变填充、斜切后让一道高光扫过；最后整幅画面作为贴图交给 WebGL 后期着色器，加 VHS 扫描线、红蓝通道错位、横向抖动条和噪点。
// 风格提示词：用合成波风格：深紫夜空下一轮切成横条的橙粉渐变落日，品红霓虹透视网格向地平线无限滚动，远处是线框山脉，镀铬金属大字带一道高光扫过，所有亮线都有一紧一散两层辉光，最后叠上 VHS 扫描线、红蓝通道错位和偶尔的磁带卡顿，配模拟合成器琶音。
// 题材：电影年代与屏幕科技 · 适合：复古音乐 MV、游戏与潮牌宣传、80 年代怀旧片头
scene({
  id: 'C-153', name: '合成波（Synthwave）', dur: 5, still: 3.9,
  fonts: ["120px 'Bebas Neue'", "700 40px 'Noto Sans SC'"],
  init() {
    glInit(W, H);
    glProgram('vhs', GLSL_LIB + `
uniform sampler2D TX; uniform float GL;
vec3 tx(vec2 uv){ return texture(TX,vec2(uv.x,1.-uv.y)).rgb; }
void main(){
  vec2 uv=gl_FragCoord.xy/R;
  float band=step(.82,hash21(vec2(floor(uv.y*40.),floor(T*24.))))*GL;
  float jit=(hash21(vec2(floor(uv.y*R.y/3.),floor(T*24.)))-.5)*.002 + band*(hash21(vec2(floor(uv.y*40.),3.))-.5)*.06;
  uv.x+=jit+.0015*sin(uv.y*30.+T*5.);
  float sp=.0025+.008*GL;
  vec3 c=vec3(tx(uv+vec2(sp,0.)).r, tx(uv).g, tx(uv-vec2(sp,0.)).b);
  c=mix(c,(tx(uv+vec2(.004,0.))+tx(uv-vec2(.004,0.)))*.5,.25);   // 横向渗色
  c*=.86+.14*sin(gl_FragCoord.y*3.1416*.5);                        // 扫描线
  c+=(hash21(gl_FragCoord.xy+T*60.)-.5)*.07;
  c+=band*.06;
  float tr=smoothstep(.0,.02,abs(fract(uv.y*.5-T*.07)-.5)); c*=.93+.07*tr;  // 慢慢滚过的跟踪条
  vec2 q=uv-.5; c*=1.-dot(q,q)*.7;
  O=vec4(c,1.);
}`);
    const R = mulberry32(153);
    const stars = Array.from({ length: 140 }, () => [R(), R() * .55, R() * 1.5 + .5, R() * TAU]);
    const ridge = Array.from({ length: 40 }, (_, i) => .35 + .65 * Math.pow(Math.abs(Math.sin(i * 1.7) * .6 + (R() - .5) * .8), 1.2));
    const sc = mk(W, H);
    return { stars, ridge, sc, sx: sc.getContext('2d') };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, x = s.sx, hor = H * (LAND ? .58 : .55), cx = W / 2;
    // 天空
    let g = x.createLinearGradient(0, 0, 0, hor);
    g.addColorStop(0, '#0B0420'); g.addColorStop(.6, '#2A0B4A'); g.addColorStop(1, '#7A1A6E');
    x.fillStyle = g; x.fillRect(0, 0, W, hor);
    for (const [sx_, sy, r, ph] of s.stars) { x.fillStyle = `rgba(255,220,255,${.4 + .4 * Math.sin(t * 3 + ph)})`; x.fillRect(sx_ * W, sy * H, r * u * 1.5, r * u * 1.5); }
    // 落日
    const sr = SHORT * (LAND ? .3 : .36), sy0 = hor - sr * .62;
    const sun = mk(Math.ceil(sr * 2), Math.ceil(sr * 2)), sxx = sun.getContext('2d');
    g = sxx.createLinearGradient(0, 0, 0, sr * 2); g.addColorStop(0, '#FFE45C'); g.addColorStop(.45, '#FF8A3D'); g.addColorStop(1, '#FF2E88');
    sxx.fillStyle = g; sxx.beginPath(); sxx.arc(sr, sr, sr, 0, TAU); sxx.fill();
    sxx.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < 8; k++) { const yy = sr * (.9 + k * .14) + ((t * 14 * u) % (sr * .14)), hh = (3 + k * 3.4) * u; sxx.fillRect(0, yy, sr * 2, hh); }
    x.save(); x.shadowColor = '#FF4FA3'; x.shadowBlur = 80 * u; x.drawImage(sun, cx - sr, sy0 - sr); x.restore();
    x.save(); x.beginPath(); x.rect(0, 0, W, hor); x.clip(); x.drawImage(sun, cx - sr, sy0 - sr); x.restore();
    // 线框山脉
    const glowLine = (path, col, w) => {
      x.save(); x.strokeStyle = col; x.lineCap = 'round';
      x.shadowColor = col; x.shadowBlur = 26 * u; x.globalAlpha = .45; x.lineWidth = w * 2.4; path(); x.stroke();
      x.shadowBlur = 6 * u; x.globalAlpha = 1; x.lineWidth = w; path(); x.stroke(); x.restore();
    };
    const mh = H * (LAND ? .2 : .13), n = s.ridge.length, off = (t * .015) % (1 / n);
    const mpts = s.ridge.map((h, i) => [(i / (n - 1) - off) * W * 1.04 - W * .02, hor - h * mh * (.4 + .6 * Math.abs(i / (n - 1) - .5) * 2)]);
    x.fillStyle = '#12051F'; x.beginPath(); x.moveTo(0, hor); mpts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(W, hor); x.fill();
    glowLine(() => { x.beginPath(); mpts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); }, '#3FE0FF', 2 * u);
    glowLine(() => { x.beginPath(); mpts.forEach((p, i) => { if (i % 2) { x.moveTo(p[0], p[1]); x.lineTo(p[0] + (i % 4 - 1.5) * 30 * u, hor); } }); }, '#3FE0FF', 1 * u);
    // 地面网格
    g = x.createLinearGradient(0, hor, 0, H); g.addColorStop(0, '#2B0838'); g.addColorStop(1, '#07010D');
    x.fillStyle = g; x.fillRect(0, hor, W, H - hor);
    const camH = H * .35, sp = (t * 2.2) % 1;
    glowLine(() => {
      x.beginPath();
      for (let k = 0; k < 18; k++) { const z = k + 1 - sp; const y = hor + camH / z * .9; if (y > H + 10) continue; x.moveTo(0, y); x.lineTo(W, y); }
      for (let k = -24; k <= 24; k++) { x.moveTo(cx + k * W * .002, hor); x.lineTo(cx + k * W * .16, H + camH * .3); }
    }, '#FF3FD0', 2.2 * u);
    g = x.createLinearGradient(0, hor - 2, 0, hor + H * .06); g.addColorStop(0, 'rgba(255,90,200,.8)'); g.addColorStop(1, 'rgba(255,90,200,0)');
    x.fillStyle = g; x.fillRect(0, hor - 2, W, H * .06);
    // 镀铬大字
    const tq = eOutCubic(smooth(1.1, 1.7, t));
    if (tq > 0) {
      const fs = (LAND ? 260 : 210) * u, ty = H * (LAND ? .32 : .28);
      x.save(); x.translate(cx, ty + (1 - tq) * -H * .3); x.transform(1, 0, -.18, 1, 0, 0);
      x.font = `${Math.round(fs)}px 'Bebas Neue'`; x.textAlign = 'center'; x.textBaseline = 'middle';
      if (x.letterSpacing !== undefined) x.letterSpacing = `${8 * u}px`;
      const word = 'NEON MILES';
      g = x.createLinearGradient(0, -fs * .38, 0, fs * .38);
      [[0, '#E9F7FF'], [.3, '#8FD3FF'], [.49, '#FFFFFF'], [.51, '#3A1E3F'], [.7, '#C2569B'], [.88, '#FFC3E6'], [1, '#FFF']].forEach(([o, c]) => g.addColorStop(o, c));
      x.lineJoin = 'round'; x.strokeStyle = '#1A0328'; x.lineWidth = 14 * u; x.strokeText(word, 0, 0);
      x.shadowColor = '#FF3FD0'; x.shadowBlur = 30 * u; x.strokeStyle = '#FF7FE0'; x.lineWidth = 3 * u; x.strokeText(word, 0, 0); x.shadowBlur = 0;
      x.fillStyle = g; x.fillText(word, 0, 0);
      // 高光扫过
      const sw = smooth(2.3, 3.1, t);
      if (sw > 0 && sw < 1) {
        const tw = x.measureText(word).width, hx = -tw / 2 + sw * tw * 1.3 - tw * .15;
        const tc = mk(Math.ceil(tw * 1.2), Math.ceil(fs * 1.2)), tx2 = tc.getContext('2d');
        tx2.font = x.font; tx2.textAlign = 'center'; tx2.textBaseline = 'middle'; if (tx2.letterSpacing !== undefined) tx2.letterSpacing = x.letterSpacing;
        tx2.fillStyle = '#fff'; tx2.fillText(word, tc.width / 2, tc.height / 2);
        tx2.globalCompositeOperation = 'source-in';
        const hg = tx2.createLinearGradient(tc.width / 2 + hx - 60 * u, 0, tc.width / 2 + hx + 60 * u, 0);
        hg.addColorStop(0, 'rgba(255,255,255,0)'); hg.addColorStop(.5, 'rgba(255,255,255,.95)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
        tx2.fillStyle = hg; tx2.fillRect(0, 0, tc.width, tc.height);
        x.drawImage(tc, -tc.width / 2, -tc.height / 2);
      }
      x.restore();
      const sq = smooth(2.0, 2.5, t);
      x.save(); x.globalAlpha = sq; x.font = `700 ${Math.round(44 * u)}px 'Noto Sans SC'`; x.textAlign = 'center'; x.textBaseline = 'middle';
      if (x.letterSpacing !== undefined) x.letterSpacing = `${24 * u}px`;
      x.shadowColor = '#3FE0FF'; x.shadowBlur = 20 * u; x.fillStyle = '#B8F6FF'; x.fillText('霓 虹 夜 行', cx, ty - fs * .58); x.restore();
    }
    // 偶尔的画面抖动：在节拍上
    const gt = [.75, 2.25, 3.75, 4.5].reduce((a, k) => Math.max(a, Math.exp(-Math.max(0, t - k) * 14) * (t >= k ? 1 : 0)), 0);
    glDraw(ctx, 'vhs', t, W, H, 0, 0, W, H, { TX: s.sc, GL: gt + (tq > 0 && tq < 1 ? .5 : 0) });
  }
});
