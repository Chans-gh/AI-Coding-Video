// C-189 皮克斯式 3D 动画：GLSL 光线步进算出整张画面：木头底座是圆角圆柱，弹簧脖子是沿一条贝塞尔曲线排开、各自朝切线方向的七个圆环，黄铜头和毡帽、橡胶球、上了清漆的木桌各有一套材质算法；一盏聚光灯只照亮玩具和球所在的那一圈并投软阴影，远处墙上的灯是算好的柔和光斑，假装浅景深。没有脸的弹簧玩具靠姿态演戏：看见滚来的球先探身，压缩弹簧做预备，跳过去落地后头还在晃，再一探头把球顶走。
// 风格提示词：用皮克斯式 3D 动画风格：先设计一眼能认出的剪影和大小对比，再做表面；布、木头、金属、皮肤各有清楚不同的材质，材质本身说明角色性格；光是讲故事的工具，主光把视线引向剧情焦点，可以为情绪偏离物理；角色表演有预备、跟随和重心转移，情绪来自动作因果而不是频繁换表情，无脸的物件（台灯、玩具、机器）也能靠姿态演戏，浅景深加柔和的全局光。只学这套方法，不复刻任何现有角色。
// 题材：卡通与动漫 · 适合：品牌吉祥物短片、拟人化产品故事、儿童动画
const FS189 = `
uniform vec4 U0;   // 玩具 x、起跳高度、弹簧伸缩、头的偏移
uniform vec4 U1;   // 球 x、球的转角、球的 z
uniform vec3 RO; uniform vec3 TA;
vec3 P0, P1, P2, HC, CAPC, PMC;
const vec3 SP = vec3(-1.7, 3.6, -2.3);
float sdRB(vec3 p, float r, float h, float rr) { vec2 d = vec2(length(p.xz) - r + rr, abs(p.y) - h + rr); return min(max(d.x, d.y), 0.) + length(max(d, 0.)) - rr; }
float sdEl(vec3 p, vec3 r) { float k0 = length(p / r), k1 = length(p / (r * r)); return k0 * (k0 - 1.) / k1; }
vec3 bez(float s) { return mix(mix(P0, P1, s), mix(P1, P2, s), s); }
vec3 bezT(float s) { return normalize(2. * (1. - s) * (P1 - P0) + 2. * s * (P2 - P1)); }
vec2 map(vec3 p) {
  vec2 r = vec2(p.y, 1.);
  float d = 6. - p.z; if (d < r.x) r = vec2(d, 2.);
  d = sdRB(p - vec3(U0.x, U0.y + .1, 0.), .3, .1, .035); if (d < r.x) r = vec2(d, 3.);
  vec3 mid = (P0 + P2) * .5;
  if (length(p - mid) - length(P2 - P0) * .5 - .2 < r.x) {
    for (int i = 0; i < 7; i++) {
      float s = (float(i) + .5) / 7.; vec3 c = bez(s), tg = bezT(s), q = p - c; float h = dot(q, tg);
      d = length(vec2(length(q - h * tg) - .115, h)) - .021; if (d < r.x) r = vec2(d, 4.);
    }
  }
  d = length(p - HC) - .2; if (d < r.x) r = vec2(d, 5.);
  d = min(sdEl(p - CAPC, vec3(.13, .075, .13)), length(p - PMC) - .045); if (d < r.x) r = vec2(d, 6.);
  d = length(p - vec3(U1.x, .17, U1.z)) - .17; if (d < r.x) r = vec2(d, 7.);
  return r;
}
vec3 nrm(vec3 p) { vec2 e = vec2(.0015, -.0015); return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x); }
float shadow(vec3 ro, vec3 rd, float tmax) { float res = 1., t = .02; for (int i = 0; i < 30; i++) { float h = map(ro + rd * t).x; res = min(res, 9. * h / t); t += clamp(h, .02, .25); if (res < .01 || t > tmax) break; } return clamp(res, 0., 1.); }
float ao(vec3 p, vec3 n) { float o = 0., w = 1.; for (int i = 1; i <= 4; i++) { float h = .04 * float(i); o += (h - map(p + n * h).x) * w; w *= .7; } return clamp(1. - 2.2 * o, 0., 1.); }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
vec3 wood(vec3 p, float blur) {
  float g = p.z * 9. + vn(p.xz * vec2(1.5, 6.)) * 3. + vn(p.xz * 14.) * .6 * blur;
  float s = .5 + .5 * sin(g * 6.2831), b = vn(vec2(p.x * 1.2, floor(p.z * 2.5) * 7.));
  float seam = smoothstep(.012, .0, abs(fract(p.z * 1.6) - .5) - .488) * blur;
  return mix(mix(vec3(.47, .27, .14), vec3(.62, .38, .2), mix(.5, s, blur) * .7 + b * .3), vec3(.2, .1, .05), seam);
}
vec3 env(vec3 r, vec3 p) {
  if (r.y < 0.) { float t = -p.y / r.y; vec3 q = p + r * t; float sp = smoothstep(2.5, .5, length(q.xz - vec2(.4, 0.))); return wood(q, .3) * (.15 + .9 * sp); }
  vec3 c = mix(vec3(.10, .08, .07), vec3(.55, .45, .35), smoothstep(0., 1., r.y));
  return c + vec3(1., .9, .75) * 4. * pow(max(dot(r, normalize(SP - p)), 0.), 60.);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * R) / min(R.x, R.y);
  float nl = .42 * U0.z;
  P0 = vec3(U0.x, U0.y + .2, 0.); P1 = P0 + vec3(U0.w * .1, nl * .6, 0.); P2 = P0 + vec3(U0.w, nl - U1.w, 0.);
  vec3 te = bezT(1.); HC = P2 + te * .19;
  vec3 cd = normalize(te + vec3(.55, 0., -.15)); CAPC = HC + cd * .165; PMC = HC + cd * .27;
  vec3 cw = normalize(TA - RO), cu = normalize(cross(vec3(0, 1, 0), cw)), cv = cross(cw, cu);
  vec3 rd = normalize(uv.x * cu + uv.y * cv + 1.9 * cw), ro = RO;
  float t = .05; vec2 h;
  for (int i = 0; i < 110; i++) { h = map(ro + rd * t); if (h.x < .0012 * t || t > 16.) break; t += h.x * .9; }
  vec3 col;
  vec3 p = ro + rd * t;
  if (h.y == 2. || t > 16.) {
    // 远墙：失焦的灯光斑，越到下面越暗
    vec2 w = p.xy * 1.1; col = mix(vec3(.05, .035, .04), vec3(.16, .10, .08), smoothstep(-1., 3., p.y));
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 c = floor(w) + vec2(i, j), o = vec2(h21(c), h21(c + 3.1)); float r = .22 + .2 * h21(c + 7.7), on = step(.45, h21(c + 1.3));
      float dd = length(w - c - o); vec3 bc = mix(vec3(1., .62, .25), vec3(1., .85, .55), h21(c + 9.));
      col += on * bc * (.11 * smoothstep(r, r * .8, dd) + .05 * smoothstep(r * .8, r, dd) * step(dd, r));
    }
  } else {
    vec3 n = nrm(p), L = normalize(SP - p), V = -rd;
    vec3 sa = normalize(vec3(.4, .3, 0.) - SP);
    float cone = smoothstep(.9, .975, dot(-L, sa));
    float sh = shadow(p + n * .004, L, 6.), oc = ao(p, n), dif = max(dot(n, L), 0.);
    vec3 key = vec3(1., .83, .62) * 3.2 * cone * sh * dif;
    vec3 fill = vec3(.35, .45, .75) * .28 * max(dot(n, normalize(vec3(1., .5, -.7))), 0.);
    float fr = pow(1. - max(dot(n, V), 0.), 3.);
    vec3 rim = vec3(1., .9, .8) * fr * max(dot(n, normalize(vec3(.3, .6, 1.))), 0.) * 1.4;
    vec3 amb = (vec3(.12, .10, .11) * (.6 + .4 * n.y) + vec3(.10, .055, .03) * max(-n.y, 0.)) * oc;
    vec3 H = normalize(L + V);
    if (h.y == 1.) {
      float blur = exp(-max(t - 3.5, 0.) * .6);
      vec3 a = wood(p, blur);
      vec3 rr = reflect(rd, n);
      col = a * (key + amb + fill) + .25 * fr * env(rr, p) * oc + vec3(1., .9, .7) * pow(max(dot(n, H), 0.), 80.) * .6 * cone * sh;
      col *= mix(.25, 1., smoothstep(5.5, 1.5, length(p.xz - vec2(.4, 0.))));
    } else if (h.y == 3.) {        // 底座：上了漆的木头，缎面高光
      vec3 a = mix(vec3(.12, .42, .45), vec3(.95, .9, .78), step(.17, p.y - U0.y) * step(p.y - U0.y, .2));
      col = a * (key + amb + fill) + rim * a + vec3(1.) * pow(max(dot(n, H), 0.), 30.) * .35 * cone * sh;
    } else if (h.y == 4.) {        // 弹簧：镜面钢
      vec3 rr = reflect(rd, n);
      col = env(rr, p) * vec3(.85, .88, .92) * (.3 + .7 * oc) + vec3(1., .9, .8) * pow(max(dot(n, H), 0.), 180.) * 4. * cone * sh;
    } else if (h.y == 5.) {        // 头：抛光黄铜
      vec3 rr = reflect(rd, n);
      col = env(rr, p) * vec3(1., .7, .33) * (.45 + .55 * sh) + vec3(1., .86, .6) * pow(max(dot(n, H), 0.), 120.) * 5. * cone * sh + rim * vec3(1., .7, .35) * .6;
    } else if (h.y == 6.) {        // 毡帽：漫反射加边缘绒光
      vec3 a = vec3(.72, .1, .09);
      col = a * (key * .9 + amb + fill) + a * fr * 1.2 + vec3(1., .5, .4) * fr * .25;
    } else {                       // 橡胶球：随滚动转动的奶油色条纹
      vec3 q = p - vec3(U1.x, .17, U1.z); float c = cos(U1.y), s = sin(U1.y); q.xy = mat2(c, -s, s, c) * q.xy;
      vec3 a = mix(vec3(.85, .13, .1), vec3(.95, .88, .7), smoothstep(.035, .025, abs(q.x)));
      col = a * (key + amb + fill) + rim * a + vec3(1.) * pow(max(dot(n, H), 0.), 40.) * .5 * cone * sh;
    }
  }
  col = (col * (2.51 * col + .03)) / (col * (2.43 * col + .59) + .14);
  col = pow(clamp(col, 0., 1.), vec3(1. / 2.2));
  O = vec4(col, 1.);
}`;
// 表演：每个量都是 t 的闭式函数（缓动、抛物线、阻尼振荡），不带跨帧状态
function pose189(t) {
  const TX0 = -.75, TX1 = .2, J0 = 1.95, J1 = 2.45, TAP = 3.1;
  const dsin = (t0, a, k, w) => t < t0 ? 0 : a * Math.exp(-(t - t0) * k) * Math.sin((t - t0) * w);
  const js = inv(J0, J1, t);
  const TX = lerp(TX0, TX1, eInOutCubic(js) * .3 + js * .7);
  const JY = t > J0 && t < J1 ? .3 * 4 * js * (1 - js) : 0;
  let SQ = 1 + .03 * Math.sin(t * 2.6);
  SQ -= .42 * eOutCubic(inv(1.5, 1.9, t)) * (t < J0 ? 1 : 0);                      // 预备：压缩
  if (t >= J0 && t < J1) SQ = lerp(.58, 1.28, eOutCubic(inv(J0, J0 + .1, t))) - .28 * inv(J0 + .1, J1, t);   // 起跳拉长
  if (t >= J1) SQ = 1 - .42 * Math.exp(-(t - J1) * 5) * Math.cos((t - J1) * 20) + .1 * Math.exp(-((t - 3.9) ** 2) * 40) + .1 * Math.exp(-((t - 4.3) ** 2) * 40);   // 落地挤压后回弹；结尾两下开心的小跳
  let LEAN = .03 * Math.sin(t * 3);
  LEAN += .2 * eOutBack(inv(.95, 1.25, t)) * (t < 1.5 ? 1 : 0) + dsin(1.25, .05, 6, 18) * (t < 1.5 ? 1 : 0);   // 看见球：探身，再一愣
  if (t >= 1.5 && t < J0) LEAN = lerp(.2, -.16, eOutCubic(inv(1.5, 1.85, t)));          // 预备：往后仰
  if (t >= J0 && t < J1) LEAN = lerp(-.16, -.24, eOutCubic(inv(J0, J0 + .15, t))) + .3 * eInOutCubic(inv(J0 + .15, J1, t));   // 空中：头跟在后面
  if (t >= J1 && t < 2.85) LEAN = .06 + dsin(J1, .3, 4.5, 15);                           // 落地：头还在晃
  if (t >= 2.85 && t < TAP) LEAN = lerp(.06, .36, eInCubic(inv(2.85, TAP, t)));          // 一探头顶球
  if (t >= TAP) LEAN = .2 + .26 * Math.exp(-(t - TAP) * 4) * Math.cos((t - TAP) * 16) + .1 * smooth(TAP, 4.2, t);
  const DIP = .24 * eInCubic(inv(2.85, TAP, t)) * (t < TAP ? 1 : 0) + (t >= TAP ? .3 * Math.exp(-(t - TAP) * 5) : 0) + .1 * smooth(TAP, 4.2, t);   // 低头去顶球
  const BX = t < TAP ? lerp(3.4, 1.02, eOutCubic(inv(0, 1.15, t))) : 1.02 + 1.75 * eOutCubic(inv(TAP, TAP + 1.7, t));
  const BZ = t < TAP ? 0 : .5 * eOutCubic(inv(TAP, TAP + 1.7, t));
  return { TX, JY, SQ, LEAN, DIP, BX, BZ, ROT: -(BX - 3.4) / .17 };
}
scene({
  id: 'C-189', name: '皮克斯式 3D 动画', dur: 5, still: 3.3,
  fonts: [],
  init() {
    const gw = Math.round(W / 2.2), gh = Math.round(H / 2.2);
    glInit(gw, gh); glProgram('pix', FS189);
    return { gw, gh };
  },
  draw(ctx, t, s, f) {
    const P = pose189(t), k = t / 5;
    const RO = LAND ? [lerp(-.2, .15, k), lerp(1.05, .95, k), lerp(-3.6, -3.2, k)] : [lerp(.0, .2, k), lerp(1.25, 1.15, k), lerp(-4.3, -3.9, k)];
    const TA = LAND ? [lerp(.15, .45, k), .52, .3] : [lerp(.1, .4, k), .5, .3];
    glDraw(ctx, 'pix', t, s.gw, s.gh, 0, 0, W, H, { U0: [P.TX, P.JY, P.SQ, P.LEAN], U1: [P.BX, P.ROT, P.BZ, P.DIP], RO, TA });
    grain(ctx, f, .04); vignette(ctx, .35, .4);
  }
});
