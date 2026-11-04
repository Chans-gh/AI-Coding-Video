// C-174 雨窗：一个手写的 GLSL 片元着色器。窗外城市是网格里随机放置的暖橙、冷青光点，按失焦程度画成大光斑；玻璃上静止的小水珠和沿弯曲路线下滑的大水珠各自算出表面法线，水珠里按法线反向取样一张清晰、倒置的灯影，滑过处留下小水珠并擦掉雾气
// 风格提示词：用雨窗风格：镜头隔着一扇夜晚的玻璃窗，窗外城市灯光全部失焦成暖橙和冷青的大光斑，玻璃上水珠大小不一，小的停着不动、大的忽然沿曲折路线滑下并吞掉沿途的小水珠，每颗水珠里折射出倒置的清晰灯影，窗角偶尔起雾，配持续的雨声和远处车声。
// 题材：3D 与实时图形 · 适合：失恋与思念、深夜电台、学习陪伴背景
const RAIN_FS = `
float h1(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
vec2 h2(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h2(i).x, h2(i + vec2(1, 0)).x, f.x), mix(h2(i + vec2(0, 1)).x, h2(i + vec2(1, 1)).x, f.x), f.y); }
// 窗外城市：focus = 0 时是失焦大光斑，= 1 时是清晰小灯点
vec3 city(vec2 q, float focus){
  float Hq = R.y / min(R.x, R.y), fy = q.y / Hq;                            // fy：画面高度上的比例
  vec3 col = mix(vec3(.05, .05, .09), vec3(.012, .016, .04), smoothstep(.1, 1., fy));
  col += vec3(.10, .05, .04) * smoothstep(.7, 0., fy);                       // 地面灯光映的暖色
  for (int L = 0; L < 3; L++) {
    float sc = 5. + float(L) * 3.5;
    vec2 g = q * sc + vec2(float(L) * 7.3, 0.);
    vec2 id = floor(g);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 cid = id + vec2(i, j), r = h2(cid + float(L) * 19.1);
      if (r.x < .45) continue;
      float lowY = cid.y / sc / Hq;                                               // 灯多在画面下半部
      if (lowY > .75 || h1(cid.x * 3.1 + cid.y * 7.7 + float(L)) < lowY * 1.1) continue;
      vec2 c = cid + .5 + (r - .5) * .7;
      float rad = mix(.42, .1, focus) * (.6 + .6 * r.y), soft = mix(.18, .02, focus);
      float d = length(g - c);
      float disc = smoothstep(rad, rad - soft, d) * (1. + .35 * smoothstep(rad - soft * 2., rad - soft * .5, d) * (1. - focus));
      float k = h1(r.x * 91.3 + r.y * 17.);
      vec3 lc = k < .5 ? vec3(1., .55, .2) : k < .8 ? vec3(.25, .8, .9) : vec3(1., .85, .7);
      float fl = .85 + .15 * sin(T * (1. + 3. * r.y) + r.x * 40.);
      col += disc * lc * fl * mix(.55, 1.4, focus) * (.6 + .5 * float(L == 0));
    }
  }
  return col;
}
// 下滑的水珠：返回 (法线 xy, 遮罩 z, 擦痕 w)
vec4 slide(vec2 q){
  vec4 o = vec4(0);
  float cw = .16;
  float col = floor(q.x / cw);
  for (int k = -1; k <= 1; k++) {
    float c = col + float(k), r = h1(c * 13.7 + 2.), r2 = h1(c * 5.3 + 9.);
    if (r < .35) continue;
    float sp = .07 + .12 * r2, tt = T * sp + r * 7.;
    float yy = 1.3 - fract(tt * .55) * 1.8;                                  // 从上往下，循环
    yy -= .04 * smoothstep(.0, .2, fract(tt * 3.)) ;                          // 一停一冲
    float x = (c + .5) * cw + sin(q.y * 9. + r * 6.) * .025 + sin(q.y * 23. + r2 * 9.) * .008;
    float xd = sin(yy * 9. + r * 6.) * .025 + sin(yy * 23. + r2 * 9.) * .008;
    vec2 p = q - vec2((c + .5) * cw + xd, yy);
    float rad = .032 + .02 * r2;
    vec2 e = p / vec2(rad * .85, rad * (p.y > 0. ? 1.25 : 1.));               // 上尖下圆
    float d = length(e);
    if (d < 1.) o = vec4(e * .9, smoothstep(1., .82, d), 1.);
    // 擦痕和留下的小水珠
    float dy = q.y - yy;
    if (dy > 0. && dy < .5 && abs(q.x - x) < rad * .9) {
      o.w = max(o.w, smoothstep(.5, .05, dy) * smoothstep(rad * .9, rad * .4, abs(q.x - x)));
      float cell = floor(dy / .035);
      vec2 tp = vec2(q.x - x, mod(dy, .035) - .0175);
      float tr = rad * .32 * (1. - dy * 1.6) * step(.3, h1(cell + c * 3.));
      float td = length(tp) / max(tr, 1e-4);
      if (td < 1. && o.z == 0.) o.xyz = vec3(tp / max(tr, 1e-4) * .9, smoothstep(1., .75, td));
    }
  }
  return o;
}
// 静止的小水珠：返回 (法线 xy, 遮罩 z)
vec3 still(vec2 q){
  vec3 o = vec3(0);
  for (int L = 0; L < 2; L++) {
    float sc = L == 0 ? 18. : 34.;
    vec2 g = q * sc, id = floor(g);
    vec2 r = h2(id + float(L) * 31.);
    if (r.x < .35) continue;
    float life = fract(T * .08 + r.y);                                       // 慢慢长出、消失
    vec2 c = id + .5 + (h2(id * 1.7 + 3.) - .5) * .6;
    float rad = (.12 + .25 * r.y) * smoothstep(0., .1, life) * smoothstep(1., .85, life);
    vec2 p = (g - c) / max(rad, 1e-4);
    float d = length(p);
    if (d < 1. && o.z == 0.) o = vec3(p * .9, smoothstep(1., .7, d));
  }
  return o;
}
void main(){
  float S = min(R.x, R.y);
  vec2 q = gl_FragCoord.xy / S;
  vec4 sd = slide(q);
  vec3 st = still(q) * (1. - sd.w);
  vec3 dr = sd.z > 0. ? sd.xyz : st;
  vec3 col = city(q, 0.);
  if (dr.z > 0.) {
    vec2 n = dr.xy;
    vec3 inside = city(q - n * .12 + vec2(0., .02), .6) * 1.25 + city(q, 0.) * .35;   // 倒置、较清晰的灯影
    inside *= 1. - .3 * smoothstep(.6, 1., length(n));                                           // 边缘暗一点
    inside += vec3(.9) * pow(max(0., 1. - length(n - vec2(-.45, .45)) * 2.2), 3.) * .6;   // 高光
    col = mix(col, inside, dr.z);
  }
  // 窗角起雾：雾里灯光更散、更灰，水珠和擦痕处是清的
  vec2 cq = gl_FragCoord.xy / R - .5;
  float fog = smoothstep(.45, .85, length(cq * vec2(1.1, 1.)) + (vn(q * 6.) - .5) * .25) * (.55 + .45 * sin(T * .6));
  fog *= (1. - sd.w) * (1. - dr.z);
  col = mix(col, vec3(.16, .17, .2) + col * .4, fog * .8);
  col *= 1. - .35 * dot(cq, cq) * 2.;
  col += (h1(dot(gl_FragCoord.xy, vec2(1.7, 9.1)) + T) - .5) * .02;
  O = vec4(pow(col, vec3(.95)), 1.);
}`;
scene({
  id: 'C-174', name: '雨窗', dur: 4, still: 2.4,
  init() { glInit(W / 2, H / 2); glProgram('rain', RAIN_FS); return {}; },
  draw(ctx, t) { glDraw(ctx, 'rain', t + 3, W / 2, H / 2); }
});
