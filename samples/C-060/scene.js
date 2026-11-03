// C-060 16mm 黑白纪录片：先用 Canvas 2D 画出黑白的内容（倒数片头、片名卡、聚光灯下的主体和打字机字幕），再交给 WebGL 片元着色器做胶片：粗颗粒、随机划痕和灰尘、闸门抖动、整体明暗闪烁、四角暗角，全部由时间 t 算出。
// 风格提示词：用 16mm 黑白老纪录片风格：粗胶片颗粒、随机划痕和灰尘、整体明暗轻微闪烁、四角暗角，开头是倒数计时片头，字幕用打字机字体，片名用衣线字加细边框，聚光灯打在主体上。
// 题材：电影年代与屏幕科技 · 适合：历史、起源故事
scene({
  id: 'C-060', name: '16mm 黑白纪录片', dur: 5, still: 3.5, text: '一九三七年春城西纺织厂第一台织机开动日卷轴号',
  fonts: ["400 120px 'Limelight'", "400 44px 'JetBrains Mono'", "700 44px 'Noto Sans SC'", "400 44px 'Noto Sans SC'"],
  init() {
    glInit(Math.round(W * .75), Math.round(H * .75));
    glProgram('film', `
uniform sampler2D SRC; uniform float GRAIN, SCR, FLICK, JIT;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / R;
  uv.y = 1.0 - uv.y;
  uv += vec2(JIT * 0.0016, JIT * 0.0022);                       // 闸门抖动
  float v = texture(SRC, uv).r;
  v *= FLICK;                                                    // 明暗闪烁
  float g = h21(gl_FragCoord.xy + vec2(T * 311.0, T * 173.0));   // 粗颗粒
  v += (g - 0.5) * GRAIN;
  for (int i = 0; i < 4; i++) {                                  // 划痕：竖直的亮线、暗线
    float fi = float(i);
    float seed = floor(T * 9.0 + fi * 37.0);
    float x = h21(vec2(seed, fi * 7.0));
    float w = 0.0012 + 0.0022 * h21(vec2(seed, fi + 3.0));
    float on = step(0.45, h21(vec2(seed, fi + 11.0)));
    float d = smoothstep(w, 0.0, abs(uv.x - x));
    v += d * on * (h21(vec2(seed, fi + 5.0)) > 0.5 ? 0.30 : -0.26);
  }
  for (int i = 0; i < 7; i++) {                                  // 灰尘、毛屑
    float fi = float(i);
    float seed = floor(T * 24.0 + fi * 13.0);
    vec2 pp = vec2(h21(vec2(seed, fi)), h21(vec2(seed, fi + 19.0)));
    float d = distance(uv, pp) * R.x;
    v += smoothstep(3.0 + 3.0 * h21(vec2(seed, fi + 2.0)), 0.0, d) * (h21(vec2(seed, fi + 4.0)) > 0.4 ? -0.5 : 0.35);
  }
  float r = distance(uv, vec2(0.5)) * 1.42;                      // 四角暗角
  v *= 1.0 - smoothstep(0.42, 1.0, r) * 0.75;
  v = clamp(v, 0.0, 1.0);
  O = vec4(vec3(v * 0.95 + 0.045), 1.0);                          // 偏灰的黑白
}`);
    const src = mk(Math.round(W * .75), Math.round(H * .75));
    return { src, g: src.getContext('2d'), u: SHORT / 1080 };
  },
  draw(ctx, t, s) {
    const g = s.g, w = s.src.width, h = s.src.height, u = w / (LAND ? 1920 : 1080) * (LAND ? 1920 / 1080 : 1) * (SHORT / 1080);
    const sc = w / W;                                             // 内容按半分辨率画
    g.setTransform(sc, 0, 0, sc, 0, 0);
    const bgg = g.createLinearGradient(0, 0, 0, H);        // 厂房的墙：不是纯黑，主体才看得出来
    bgg.addColorStop(0, '#2a2a2a'); bgg.addColorStop(.62, '#3a3a3a'); bgg.addColorStop(1, '#1d1d1d');
    g.fillStyle = t < 2.4 ? '#101010' : bgg; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const U = SHORT / 1080;
    if (t < 1.25) countdown(g, t, U);
    else if (t < 2.4) titleCard(g, t - 1.25, U);
    else loom(g, t - 2.4, U);
    // 打字机字幕：从第 2.6 秒起一行一行打出来
    if (t > 2.55) {
      const lines = ['一九三七年春，城西纺织厂', '第一台织机开动'];
      g.font = `400 ${Math.round(42 * U)}px 'JetBrains Mono', 'Noto Sans SC'`;
      g.fillStyle = '#f2f2f2';
      lines.forEach((ln, i) => {
        const k = inv(2.65 + i * .9, 2.65 + i * .9 + .75, t);
        if (k <= 0) return;
        const n = Math.floor(k * ln.length + .001);
        g.fillText(ln.slice(0, n) + (k < 1 && Math.floor(t * 6) % 2 ? '▮' : ''), W / 2, H - (LAND ? 150 : 320) * U + i * 60 * U);
      });
    }
    // 卷轴号：右上角
    g.font = `400 ${Math.round(30 * U)}px 'JetBrains Mono'`; g.textAlign = 'right';
    g.fillStyle = 'rgba(235,235,235,.5)'; g.fillText(`REEL 02 · ${(1 + Math.floor(t * 24)).toString().padStart(4, '0')}`, W - 50 * U, 64 * U);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const flick = .9 + .14 * noise1(t * 26) + .03 * Math.sin(t * 61);
    const jit = (noise1(t * 30 + 7) - .5) * (t > 1.2 && t < 1.32 ? 9 : 1.6);  // 接片处抖一下
    glDraw(ctx, 'film', t, w, h, 0, 0, W, H, { SRC: s.src, GRAIN: .22, SCR: 1, FLICK: flick, JIT: jit });
  }
});

// 片头倒数：转动的扇形扫过，数字 3 2 1
function countdown(g, t, U) {
  const n = 3 - Math.floor(t / .42);
  const cx = W / 2, cy = H / 2, R = (LAND ? 320 : 340) * U;
  g.strokeStyle = '#d8d8d8'; g.lineWidth = 3 * U;
  g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
  g.beginPath(); g.arc(cx, cy, R * .62, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
  const a0 = -Math.PI / 2 + (t % .42) / .42 * TAU;                 // 扫过的扇形
  g.fillStyle = 'rgba(255,255,255,.14)';
  g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, -Math.PI / 2, a0); g.closePath(); g.fill();
  g.fillStyle = '#efefef'; g.font = `400 ${Math.round(260 * U)}px 'Limelight'`;
  g.textBaseline = 'middle'; g.fillText(String(Math.max(1, n)), cx, cy + 6 * U);
  g.textBaseline = 'alphabetic';
  g.font = `400 ${Math.round(28 * U)}px 'JetBrains Mono'`;
  g.fillText('16mm · 24 fps', cx, cy + R + 70 * U);
}

// 片名卡：衣线字（双线描边）加细边框
function titleCard(g, t, U) {
  const p = eOutCubic(inv(0, .45, t)), fade = 1 - smooth(.95, 1.15, t);
  g.save(); g.globalAlpha = fade;
  const bw = (LAND ? 1180 : 880) * U, bh = (LAND ? 420 : 520) * U;
  g.strokeStyle = '#e6e6e6'; g.lineWidth = 2.5 * U;
  g.strokeRect(W / 2 - bw / 2, H / 2 - bh / 2, bw, bh);
  g.strokeRect(W / 2 - bw / 2 + 10 * U, H / 2 - bh / 2 + 10 * U, bw - 20 * U, bh - 20 * U);
  g.font = `400 ${Math.round((LAND ? 120 : 104) * U)}px 'Limelight'`;
  g.textBaseline = 'middle';
  const txt = '织机开动';
  g.fillStyle = '#f0f0f0'; g.save(); g.beginPath();
  g.rect(W / 2 - bw / 2, H / 2 - bh / 2, bw * p, bh); g.clip();
  g.font = `400 ${Math.round((LAND ? 110 : 96) * U)}px 'Noto Sans SC'`;
  g.fillText(txt, W / 2, H / 2 - 20 * U);
  g.lineWidth = 2 * U; g.strokeStyle = 'rgba(255,255,255,.55)';     // 衣线：外面再描一圈细线
  g.strokeText(txt, W / 2, H / 2 - 20 * U);
  g.restore();
  g.font = `400 ${Math.round(34 * U)}px 'JetBrains Mono'`;
  g.globalAlpha = fade * smooth(.35, .7, t);
  g.fillText('A DOCUMENTARY · 1937', W / 2, H / 2 + 90 * U);
  g.textBaseline = 'alphabetic'; g.restore();
}

// 正片：聚光灯打在织机上，梭子来回、综框上下
function loom(g, t, U) {
  const cx = W / 2, cy = LAND ? H * .54 : H * .46, S = (LAND ? 1 : .92) * U;
  const app = eOutCubic(inv(0, .5, t));
  // 聚光灯：中间亮，四周暗
  const lg = g.createRadialGradient(cx, cy - 40 * S, 60 * S, cx, cy, (LAND ? 760 : 700) * S);
  lg.addColorStop(0, 'rgba(255,255,255,.46)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = app;
  g.strokeStyle = '#ededed'; g.lineWidth = 7 * S; g.lineCap = 'round';
  const fw = 620 * S, fh = 420 * S;                                 // 机架
  g.strokeRect(cx - fw / 2, cy - fh / 2, fw, fh);
  g.beginPath(); g.moveTo(cx - fw / 2, cy + fh / 2); g.lineTo(cx - fw / 2 - 60 * S, cy + fh / 2 + 120 * S);
  g.moveTo(cx + fw / 2, cy + fh / 2); g.lineTo(cx + fw / 2 + 60 * S, cy + fh / 2 + 120 * S); g.stroke();
  // 经线：竖直的一排线，综框上下分成两层
  const shed = Math.sin(t * 7.5) * 26 * S;
  g.lineWidth = 2 * S; g.strokeStyle = 'rgba(240,240,240,.85)';
  for (let k = 0; k < 26; k++) {
    const x = cx - fw / 2 + 20 * S + k * (fw - 40 * S) / 25, d = (k % 2 ? 1 : -1) * shed;
    g.beginPath(); g.moveTo(x, cy - fh / 2 + 14 * S); g.lineTo(x + d * .3, cy + 10 * S); g.lineTo(x, cy + fh / 2 - 14 * S); g.stroke();
  }
  // 梭子：左右来回
  const sx = cx + Math.sin(t * 7.5 + Math.PI / 2) * (fw / 2 - 50 * S);
  g.fillStyle = '#fafafa';
  g.beginPath(); g.ellipse(sx, cy + 8 * S, 46 * S, 13 * S, 0, 0, TAU); g.fill();
  // 纬线：织好的布，一点点长出来
  const cloth = clamp(inv(.3, 2.4, t)) * fh * .42;
  g.fillStyle = 'rgba(245,245,245,.22)'; g.fillRect(cx - fw / 2 + 20 * S, cy + fh / 2 - 14 * S - cloth, fw - 40 * S, cloth);
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5 * S;
  for (let y = cy + fh / 2 - 14 * S - cloth; y < cy + fh / 2 - 14 * S; y += 9 * S) { g.beginPath(); g.moveTo(cx - fw / 2 + 20 * S, y); g.lineTo(cx + fw / 2 - 20 * S, y); g.stroke(); }
  // 工人：剪影的背影，手随梭子动
  const wx = cx - fw / 2 - 150 * S, wy = cy + fh / 2 + 120 * S;
  g.fillStyle = '#0d0d0d'; g.strokeStyle = '#0d0d0d';
  g.beginPath(); g.ellipse(wx, wy - 300 * S, 42 * S, 50 * S, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(wx - 70 * S, wy); g.lineTo(wx - 46 * S, wy - 260 * S); g.lineTo(wx + 46 * S, wy - 260 * S); g.lineTo(wx + 70 * S, wy); g.closePath(); g.fill();
  g.lineWidth = 22 * S; g.lineCap = 'round';
  g.beginPath(); g.moveTo(wx + 40 * S, wy - 230 * S); g.lineTo(wx + 150 * S + Math.sin(t * 7.5) * 30 * S, wy - 150 * S); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3 * S;      // 轮廓光：剪影从墙上分出来
  g.beginPath(); g.moveTo(wx + 44 * S, wy - 258 * S); g.lineTo(wx + 70 * S, wy); g.stroke();
  g.beginPath(); g.arc(wx, wy - 300 * S, 46 * S, -.9, .7); g.stroke();
  g.restore();
}
