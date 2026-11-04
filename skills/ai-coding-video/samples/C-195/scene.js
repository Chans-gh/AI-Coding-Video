// C-195 末日工业暗黑科幻：整片厂区是一个片元着色器里的距离场：钢架塔（四根立柱加横梁和交叉斜撑，用对称和取模复制）、双曲面冷却塔、储罐和管道，按 2.5 分之一分辨率逐像素做光线步进；地面是一块平面水，命中后沿反射方向再走一遍得到倒影，加涟漪和油膜的虹彩；沿视线取十个点累加体积雾和顺着光方向的条纹，就是光柱；警示红灯按视线到灯的距离算光晕；焊接火花和飘落的灰在画布上按同一个相机投影来画
// 风格提示词：用末日工业暗黑科幻风格：巨大的锈蚀钢铁结构、管道和冷却塔在灰黄色的烟尘中层层叠叠，远处只有零星的警示红灯和焊接火花，体积雾把光切成一道道光柱，地面积着带油膜的黑水，镜头沿着高耸的结构缓慢仰拍上移或低空穿行，画面整体去饱和、偏铁锈和冷钢灰，低频轰鸣和金属回响作声音。
// 题材：3D 与实时图形 · 适合：科幻世界观、游戏宣传、环境与能源议题、悬念开场
const FL = 1.3;                                           // 焦距（和着色器一致）
const FS = `
uniform vec3 CAM; uniform float PITCH; uniform float XS;
const vec3 L = normalize(vec3(-.35, .42, 1.));
float h3(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float box(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)); }
// 钢架塔：四角立柱、每 bay 一圈横梁、四面交叉斜撑、顶上平台和桅杆
float lattice(vec3 p, float w, float h, float bay) {
  vec3 q = p; q.xz = abs(q.xz);
  float d = box(q - vec3(w, h * .5, w), vec3(.2, h * .5, .2));
  float yy = mod(q.y, bay) - bay * .5, inside = abs(q.y - h * .5) - h * .5;
  float b = min(box(vec3(q.x, yy, q.z - w), vec3(w, .1, .1)), box(vec3(q.x - w, yy, q.z), vec3(.1, .1, w)));
  float s1 = length(vec2(seg(vec2(q.x, yy), vec2(0., -bay * .5), vec2(w, bay * .5)), q.z - w)) - .07;
  float s2 = length(vec2(seg(vec2(q.z, yy), vec2(0., -bay * .5), vec2(w, bay * .5)), q.x - w)) - .07;
  d = min(d, max(min(b, min(s1, s2)), inside));
  d = min(d, box(p - vec3(0., h, 0.), vec3(w + .7, .15, w + .7)));
  d = min(d, box(p - vec3(0., h + 2.5, 0.), vec3(.08, 2.5, .08)));
  return d;
}
float cooling(vec3 p, float r0, float h) {
  float r = r0 * .62 * sqrt(1. + pow((p.y - h * .62) / (h * .45), 2.));
  return max(abs(length(p.xz) - r) - .3, abs(p.y - h * .5) - h * .5) * .8;
}
vec2 map(vec3 p) {
  vec2 r = vec2(1e5, 0.);
  float d;
  d = lattice(p - vec3(-6. * XS, 0., 7.), 1.6, 26., 3.); if (d < r.x) r = vec2(d, 1.);
  d = lattice(p - vec3(7. * XS, 0., 11.), 2.2, 34., 3.5); if (d < r.x) r = vec2(d, 1.);
  vec3 q = p - vec3(0., 0., 32.); float id = floor((q.x + 5.) / 10.); q.x = mod(q.x + 5., 10.) - 5.;
  d = lattice(q, 1.8, 16. + 18. * fract(sin(id * 12.9898) * 43758.5), 3.); if (d < r.x) r = vec2(d, 1.);
  d = cooling(p - vec3(-16. * XS, 0., 50.), 9., 30.); if (d < r.x) r = vec2(d, 2.);
  d = cooling(p - vec3(2. * XS, 0., 62.), 10., 36.); if (d < r.x) r = vec2(d, 2.);
  d = max(length(p.xz - vec2(14. * XS, 20.)) - 4., p.y - 12.); if (d < r.x) r = vec2(d, 2.);
  d = max(length(p.yz - vec2(.35, 3.)) - .5, abs(p.x - 9. * XS) - 6.5 * XS); if (d < r.x) r = vec2(d, 3.);
  d = max(length(p.yz - vec2(10.5, 15.)) - .8, abs(p.x - 2.) - 16.); if (d < r.x) r = vec2(d, 3.);
  d = max(length(p.xz - vec2(3. * XS, 15.)) - .45, p.y - 10.5); if (d < r.x) r = vec2(d, 3.);
  return r;
}
vec3 nrm(vec3 p) { vec2 e = vec2(.01, -.01); return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x); }
vec3 sky(vec3 rd) {
  vec3 c = mix(vec3(.46, .41, .32), vec3(.12, .12, .14), smoothstep(-.05, .6, rd.y));
  return c + pow(max(dot(rd, L), 0.), 8.) * vec3(.9, .65, .38) * .45;
}
vec3 shade(vec3 p, vec3 rd, float m) {
  vec3 n = nrm(p);
  float rust = vn(p * 1.3) * .6 + vn(p * 5.) * .4;
  vec3 c = m == 2. ? mix(vec3(.4, .38, .34), vec3(.22, .2, .18), vn(vec3(p.x * 2., p.y * .25, p.z * 2.))) : mix(vec3(.26, .27, .29), vec3(.36, .18, .09), smoothstep(.35, .7, rust));
  float dif = max(dot(n, L), 0.) * .55 + max(dot(n, normalize(vec3(.6, .5, -.6))), 0.) * .18 + .12 + .1 * n.y;
  float rim = pow(1. - max(dot(n, -rd), 0.), 3.) * max(dot(rd, L), 0.) * .6;
  return c * dif + rim * vec3(.9, .7, .45);
}
float march(vec3 ro, vec3 rd, int n, out float m) {
  float t = .05; m = -1.;
  for (int i = 0; i < 90; i++) {
    if (i >= n) break;
    vec2 h = map(ro + rd * t);
    if (h.x < .002 * t) { m = h.y; return t; }
    t += h.x; if (t > 130.) break;
  }
  return 1e9;
}
// 红灯：按视线离灯多近算光晕，被挡住（灯比命中点远）就不亮
vec3 lights(vec3 ro, vec3 rd, float tmax) {
  vec3 g = vec3(0.);
  vec4 P[6] = vec4[6](vec4(-6. * XS, 31.5, 7., 0.), vec4(7. * XS, 39.5, 11., 1.7), vec4(-6. * XS + 1.8, 14., 5.2, 3.1), vec4(7. * XS - 2.4, 22., 8.6, 4.6), vec4(-16. * XS + 7., 30.5, 46., 2.2), vec4(14. * XS, 12.4, 16., 5.3));
  for (int i = 0; i < 6; i++) {
    vec3 d = P[i].xyz - ro; float tp = dot(d, rd);
    if (tp < 0. || tp > tmax + 1.) continue;
    float a = length(d - rd * tp) / tp, bl = smoothstep(.2, .5, sin(T * 3.4 + P[i].w)) * .8 + .2;
    g += bl * (exp(-a * a * 4e4) * 5. + exp(-a * a * 600.) * .6) * exp(-tp * .01);
  }
  return g * vec3(1., .14, .06);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * R) / min(R.x, R.y);
  float cp = cos(PITCH), sp = sin(PITCH);
  vec3 fw = vec3(0., sp, cp), up = vec3(0., cp, -sp), rt = vec3(1., 0., 0.);
  vec3 ro = CAM, rd = normalize(rt * uv.x + up * uv.y + fw * ${FL.toFixed(2)});
  float m, t = march(ro, rd, 90, m);
  float tw = rd.y < 0. ? -ro.y / rd.y : 1e9, tend = min(min(t, tw), 140.);
  vec3 col;
  if (tw < t) {                                                  // 水面：倒影、涟漪、油膜
    vec3 pw = ro + rd * tw;
    vec3 n = normalize(vec3((vn(vec3(pw.xz * 1.6, T * .6)) - .5) * .12 + sin(pw.x * 4. + T * 2.) * .01, 1., (vn(vec3(pw.zx * 1.6, T * .6 + 4.)) - .5) * .12));
    vec3 rr = reflect(rd, n); float m2, t2 = march(pw + rr * .05, rr, 45, m2);
    vec3 ref = t2 < 1e8 ? shade(pw + rr * t2, rr, m2) : sky(rr);
    ref = mix(ref, sky(rr) * .9, 1. - exp(-min(t2, 140.) * .03)) + lights(pw, rr, t2);
    float fr = .25 + .75 * pow(1. - max(dot(-rd, n), 0.), 4.);
    col = mix(vec3(.03, .03, .035), ref, fr);
    float oil = smoothstep(.5, .75, vn(vec3(pw.xz * .3, 1.)));
    col += oil * .07 * (.5 + .5 * cos(6.283 * (vn(vec3(pw.xz * 1.2, 2.)) * 2.5 + vec3(0., .33, .67))));
  } else if (t < 1e8) col = shade(ro + rd * t, rd, m);
  else col = sky(rd);
  col = mix(col, sky(rd) * .95, 1. - exp(-tend * .03));
  // 体积雾和光柱：沿视线取十个点，按垂直于光方向的平面上的噪声切出条纹
  vec3 a1 = normalize(cross(L, vec3(0., 1., 0.))), a2 = cross(L, a1);
  float acc = 0., st = tend / 10.;
  for (int i = 0; i < 10; i++) {
    vec3 p = ro + rd * (float(i) + .5) * st;
    float s = smoothstep(.5, .78, vn(vec3(dot(p, a1) * .28, dot(p, a2) * .28, T * .08)));
    acc += s * exp(-p.y * .03) * st;
  }
  float ph = .25 + 1.2 * pow(max(dot(rd, L), 0.), 3.);
  col += acc * .009 * ph * vec3(1., .82, .55);
  col += lights(ro, rd, min(t, tw));
  float g = dot(col, vec3(.3, .59, .11));
  col = mix(vec3(g), col, .55) * vec3(1.02, .98, .92);
  col = smoothstep(.02, .95, col);
  O = vec4(col, 1.);
}`;
const camAt = t => {
  const e = smooth(0, 4.6, t);
  return { ro: [.5, lerp(1.1, 5.2, e), lerp(-6, -2.5, e)], pitch: LAND ? lerp(.04, .5, e) : lerp(.1, .55, e) };
};
scene({
  id: 'C-195', name: '末日工业', dur: 4.6, still: 3.4,
  fonts: [],
  init() {
    const gw = Math.round(W / 2.5), gh = Math.round(H / 2.5);
    glInit(gw, gh); glProgram('ind', FS);
    const R = mulberry32(195);
    const sparks = Array.from({ length: 70 }, () => ({ t0: R() * 4.6, v: [(R() - .5) * 3, R() * 2.5, -R() * 2.5], life: lerp(.5, 1.1, R()) }));
    const ash = Array.from({ length: 90 }, () => ({ x: R(), y: R(), s: lerp(1, 3.2, R()), v: lerp(.03, .09, R()), ph: R() * TAU }));
    return { gw, gh, sparks, ash, XS: LAND ? 1 : .62 };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, { ro, pitch } = camAt(t);
    glDraw(ctx, 'ind', t, s.gw, s.gh, 0, 0, W, H, { CAM: ro, PITCH: pitch, XS: s.XS });
    // 同一个相机把世界坐标投到画面上
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const proj = ([x, y, z]) => {
      const dx = x - ro[0], dy = y - ro[1], dz = z - ro[2];
      const zc = dy * sp + dz * cp; if (zc < .1) return null;
      const yc = dy * cp - dz * sp;
      return [W / 2 + dx / zc * FL * SHORT, H / 2 - yc / zc * FL * SHORT, zc];
    };
    // 焊接火花：塔身上一个点，闪光加抛物线落下的火星
    const spot = [7 * s.XS - 2.4, 9.5, 8.6], sp0 = proj(spot);
    if (sp0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const fl = hash1(Math.floor(t * 24)) * .6 + .4, r = 60 * u * fl * 12 / sp0[2];
      const gl = ctx.createRadialGradient(sp0[0], sp0[1], 0, sp0[0], sp0[1], r); gl.addColorStop(0, 'rgba(220,235,255,.9)'); gl.addColorStop(.2, 'rgba(160,190,255,.4)'); gl.addColorStop(1, 'rgba(120,160,255,0)');
      ctx.fillStyle = gl; ctx.fillRect(sp0[0] - r, sp0[1] - r, r * 2, r * 2);
      ctx.lineCap = 'round';
      for (const k of s.sparks) {
        const a = ((t - k.t0) % 4.6 + 4.6) % 4.6; if (a > k.life) continue;
        const at = q => [spot[0] + k.v[0] * q, spot[1] + k.v[1] * q - 4.9 * q * q, spot[2] + k.v[2] * q];
        const p1 = proj(at(a)), p0 = proj(at(Math.max(0, a - .04))); if (!p1 || !p0) continue;
        const life = 1 - a / k.life;
        ctx.strokeStyle = `rgba(255,${Math.round(150 + 90 * life)},${Math.round(60 + 120 * life)},${life})`; ctx.lineWidth = 2.2 * u * (.4 + life);
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      }
      ctx.restore();
    }
    // 飘落的灰
    ctx.fillStyle = 'rgba(200,190,170,.35)';
    for (const a of s.ash) {
      const y = ((a.y + t * a.v) % 1) * H, x = a.x * W + Math.sin(t * .8 + a.ph) * 30 * u;
      ctx.fillRect(x, y, a.s * u, a.s * u * .7);
    }
    grain(ctx, f, .28);
    vignette(ctx, .6, .35);
  }
});
