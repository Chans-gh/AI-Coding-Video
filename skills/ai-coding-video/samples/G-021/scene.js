// G-021 伪监控录像：生成的后院夜视图当首帧，图生视频让浣熊在烧烤架前把肉饼抛起来翻面；代码按 12 帧/秒抽帧、偶尔卡住和撕裂，WebGL 着色器叠鱼眼桶形畸变、红外偏绿、跳动噪点、扫描线和暗角；左上走动的时间戳和摄像头编号，动作发生时弹出「检测到移动」的框，接着倒带、放大 2.4 倍以半速回放翻面的那一下，最后定格在浣熊回头看镜头；角落一直挂着「AI 生成 · 虚构」
// 素材：生图 1 张、生视频 1 段（8 秒，带生成的环境声）。时间戳、检测框、倒带和回放的包装都是代码画的
scene({
  id: 'G-021', name: '伪监控录像', dur: 12.5, still: 3.0,
  fonts: ["700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'JetBrains Mono'"],
  text: 'AI生成虚构检测到移动回放截图已保存后院摄像头实时画面事件浣熊？倒带',
  async init() {
    const A = await loadAssets(), v = await loadVideo('grill.mp4');
    const src = LAND ? mk(960, 540) : mk(600, 800);
    glInit(src.width, src.height);
    glProgram('cam', GLSL_LIB + `
uniform sampler2D tex; uniform float G, Z;
void main(){
  vec2 uv = gl_FragCoord.xy / R, q = uv - .5;
  float r2 = dot(q * vec2(R.x / R.y, 1.), q * vec2(R.x / R.y, 1.));
  vec2 d = .5 + q * (1. - .10 * r2) * (1. - .03 * Z);           // 轻微桶形畸变
  float band = step(.92, vnoise(vec2(floor(uv.y * 40.), floor(T * 12.))));
  d.x += G * band * (hash21(vec2(floor(uv.y * 40.), floor(T * 24.))) - .5) * .12;   // 卡顿时横向撕裂
  vec3 c = texture(tex, vec2(d.x, 1. - d.y)).rgb;
  float l = dot(c, vec3(.3, .55, .15));
  float n = hash21(gl_FragCoord.xy + floor(T * 12.) * 17.) - .5;
  l += n * (.14 + .2 * G);
  l *= .9 + .1 * sin(gl_FragCoord.y * 1.6);                      // 扫描线
  l *= 1. - .55 * smoothstep(.2, .75, length(q * vec2(1., .9)));   // 暗角
  vec3 ir = vec3(.82, 1., .86) * l;                                // 红外夜视偏绿
  float hot = max(0., c.r - max(c.g, c.b)) * 1.4;                  // 炭火保留一点暖色
  ir = mix(ir, vec3(1., .55, .4) * (l + .2), clamp(hot, 0., .6));
  if (d.x < 0. || d.x > 1. || d.y < 0. || d.y > 1.) ir = vec3(0.);
  O = vec4(ir, 1.);
}`);
    return { A, v, src };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, F = 12, live = 7.6, rw0 = 7.6, rw1 = 8.0, rp0 = 8.0, rp1 = 11.6, slo0 = 1.6;
    // 视频时间：实时段按 12 帧/秒抽帧，3.4–3.75 秒卡住；倒带从 7.6 秒快速退回 1.6 秒；半速回放；定格在最后一帧
    let vt, zoom = 1, fx = LAND ? .5 : .7, fy = .5, G = 0, mode = 'live';
    if (t < live) { vt = stepT(t, F); if (t > 3.4 && t < 3.75) { vt = 3.4; G = .7; } if (t > 5.9 && t < 6.0) G = 1; }
    else if (t < rw1) { mode = 'rew'; vt = stepT(lerp(live, slo0, inv(rw0, rw1, t)), F); G = .8; }
    else if (t < rp1) { mode = 'replay'; vt = stepT(slo0 + (t - rp0) * .5, F); const z = eInOutCubic(inv(rp0, rp0 + .6, t)); zoom = lerp(1, 2.4, z); fx = lerp(fx, .75, z); fy = lerp(.5, .6, z); }
    else { mode = 'shot'; vt = s.v.dur - .1; const z = eOutCubic(inv(rp1, rp1 + .4, t)); zoom = lerp(2.4, 3.2, z); fx = .735; fy = lerp(.5, .66, z); G = t < rp1 + .08 ? 1 : 0; }
    await s.v.at(clamp(vt, 0, s.v.dur - .05));
    const g = s.src.getContext('2d');
    drawCover(g, s.v.el, 0, 0, s.src.width, s.src.height, { zoom, fx, fy });
    // 画面区域：横屏铺满；竖屏是手机监控 App 的样子，上面标题栏、中间 3:4 画面、下面事件列表
    const fxr = 0, fyr = LAND ? 0 : 230 * u, fw = W, fh = LAND ? H : W * 4 / 3;
    ctx.fillStyle = LAND ? '#000' : '#0d1110'; ctx.fillRect(0, 0, W, H);
    glDraw(ctx, 'cam', t, s.src.width, s.src.height, fxr, fyr, fw, fh, { tex: s.src, G, Z: zoom - 1 });
    const mono = (sz) => `400 ${sz * u}px 'JetBrains Mono'`;
    ctx.save(); ctx.beginPath(); ctx.rect(fxr, fyr, fw, fh); ctx.clip();
    // 时间戳、摄像头编号、REC
    const sec = 12 + Math.floor(mode === 'live' ? t : mode === 'rew' ? lerp(live, slo0, inv(rw0, rw1, t)) : vt);
    const ts = `2026-11-21  23:47:${String(sec).padStart(2, '0')}`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = mono(LAND ? 34 : 30);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillText(ts, fxr + 42 * u, fyr + 38 * u);
    ctx.fillStyle = '#f2f6ef'; ctx.fillText(ts, fxr + 40 * u, fyr + 36 * u);
    ctx.font = mono(LAND ? 26 : 24); ctx.fillText('CAM 02  BACKYARD', fxr + 40 * u, fyr + 84 * u);
    if (mode === 'live' && Math.floor(t * 1.6) % 2 === 0) { ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.arc(fw - 150 * u, fyr + 54 * u, 11 * u, 0, TAU); ctx.fill(); ctx.fillStyle = '#f2f6ef'; ctx.fillText('REC', fw - 128 * u, fyr + 41 * u); }
    // 检测到移动：抛起来的时候框住浣熊和肉饼
    const det = inv(1.9, 2.05, t) * (t < live ? 1 : 0);
    if (det > 0) {
      const bx = (LAND ? .64 : .43) * fw, by = fyr + .22 * fh, bw = (LAND ? .2 : .5) * fw, bh = .62 * fh, k = 18 * u, blink = Math.floor(t * 4) % 2 ? 1 : .55;
      ctx.strokeStyle = `rgba(255,214,64,${blink})`; ctx.lineWidth = 3 * u;
      [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]].forEach(([x, y, a, b]) => { ctx.beginPath(); ctx.moveTo(x + a * 3 * k, y); ctx.lineTo(x, y); ctx.lineTo(x, y + b * 3 * k); ctx.stroke(); });
      ctx.font = `700 ${26 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,214,64,.95)'; ctx.fillRect(bx, by - 46 * u, 200 * u, 40 * u);
      ctx.fillStyle = '#1a1a10'; ctx.textBaseline = 'middle'; ctx.fillText('检测到移动', bx + 14 * u, by - 26 * u);
    }
    // 倒带、回放、截图
    ctx.textBaseline = 'middle'; ctx.font = `700 ${(LAND ? 44 : 40) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#f2f6ef'; ctx.textAlign = 'right';
    if (mode === 'rew') ctx.fillText('◀◀ 倒带', fw - 40 * u, fyr + fh / 2);
    if (mode === 'replay') { ctx.fillText('回放  0.5×', fw - 40 * u, fyr + 60 * u); ctx.font = mono(24); ctx.fillText('ZOOM 2.4×', fw - 40 * u, fyr + 110 * u); }
    if (mode === 'shot') {
      const f = 1 - inv(rp1, rp1 + .25, t); ctx.fillStyle = `rgba(255,255,255,${f * .85})`; ctx.fillRect(fxr, fyr, fw, fh);
      const a = eOutCubic(inv(rp1 + .2, rp1 + .5, t)); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,14,12,.75)';
      const tw = 300 * u; rr(ctx, fw / 2 - tw / 2, fyr + fh - 140 * u, tw, 70 * u, 35 * u); ctx.fill();
      ctx.fillStyle = '#f2f6ef'; ctx.textAlign = 'center'; ctx.font = `700 ${32 * u}px 'Noto Sans SC'`; ctx.fillText('截图已保存', fw / 2, fyr + fh - 105 * u); ctx.globalAlpha = 1;
    }
    ctx.restore();
    // 竖屏：App 标题栏和事件列表
    if (!LAND) {
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#e8ede8'; ctx.font = `700 ${46 * u}px 'Noto Sans SC'`; ctx.fillText('后院 · 摄像头 2', 50 * u, 120 * u);
      ctx.fillStyle = mode === 'live' ? '#ff4a3a' : '#8a948e'; ctx.beginPath(); ctx.arc(W - 200 * u, 120 * u, 10 * u, 0, TAU); ctx.fill();
      ctx.font = `400 ${30 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#c8d0ca'; ctx.fillText(mode === 'live' ? '实时画面' : '回放', W - 180 * u, 120 * u);
      const ey = fyr + fh + 70 * u, ea = eOutCubic(inv(2.0, 2.4, t));
      ctx.globalAlpha = ea; ctx.fillStyle = '#1c2421'; rr(ctx, 40 * u, ey - 52 * u, W - 80 * u, 104 * u, 20 * u); ctx.fill();
      ctx.fillStyle = '#ffd640'; ctx.beginPath(); ctx.arc(90 * u, ey, 12 * u, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e8ede8'; ctx.font = `700 ${34 * u}px 'Noto Sans SC'`; ctx.fillText('检测到移动 · 浣熊？', 125 * u, ey);
      ctx.textAlign = 'right'; ctx.font = mono(28); ctx.fillStyle = '#8a948e'; ctx.fillText('23:47:14', W - 70 * u, ey); ctx.globalAlpha = 1;
    }
    // 常驻标识：AI 生成 · 虚构
    const bw = 250 * u, bh = 54 * u, bx = LAND ? 40 * u : W - bw - 40 * u, by = LAND ? H - bh - 40 * u : H - bh - 40 * u;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(ctx, bx, by, bw, bh, 10 * u); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2 * u; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${28 * u}px 'Noto Sans SC'`;
    ctx.fillText('AI 生成 · 虚构', bx + bw / 2, by + bh / 2 + 1 * u);
  }
});
