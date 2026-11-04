// T-018 照片深景推镜：一张 1942 年的公共领域风景照，depth.py 用 Depth Anything V2 估出深度图；片元着色器按每个像素的深度反推它在镜头移动后该在哪（近处挪得多、远处挪得少，迭代几次补遮挡），一张静照就有了推近加环绕的立体运镜；品牌标题放在天空和山峰之间的那一层，从山后升起、被山尖挡住；中段一道扫光露出深度图本身，结尾是虚构户外品牌的落版
// 素材：照片（美国国家档案馆的 Ansel Adams 国家公园照片）、数据（depth.py 估出的深度图）；配乐 CC0。品牌是虚构的
const ZH = '远岭户外走进照片里山在那里年大提顿蛇河深度图白近黑远一张照片拆成远近层照片深度本仓库计算配乐公共领域';
const FRAG = `
uniform sampler2D IMG, DEP, TXT;
uniform vec4 RECT;      // 画面 → 照片 uv：xy 起点，zw 范围（铺满裁切）
uniform vec3 CAM;       // 横移 x、纵移 y、推近量
uniform float FOC, TD, REVEAL, TA;
vec2 warp(vec2 base, float d) {
  vec2 c = RECT.xy + RECT.zw * .5;
  return c + (base - c) / (1. + CAM.z * (d - FOC) + CAM.z * .6) - CAM.xy * (d - FOC);
}
void main() {
  vec2 p = vec2(gl_FragCoord.x / R.x, 1. - gl_FragCoord.y / R.y);
  vec2 base = RECT.xy + p * RECT.zw, uv = base;
  float d = 0.;
  for (int i = 0; i < 10; i++) { d = texture(DEP, uv).r; uv = warp(base, d); }
  d = texture(DEP, uv).r;
  float g = texture(IMG, uv).r;
  // 分离色调：暗部偏冷、亮部偏暖
  vec3 col = mix(vec3(.07, .10, .14), vec3(.98, .93, .84), smoothstep(.0, 1., g));
  col = mix(col, vec3(g), .25);
  // 标题层：在 TD 这个深度上，比它远的地方（天空）才露出标题
  vec2 tuv = warp(base, TD);
  vec4 tx = texture(TXT, tuv);
  float behind = smoothstep(TD + .012, TD - .012, d);
  col = mix(col, vec3(1., .97, .9), tx.a * behind * TA);
  // 深度图扫光
  float r = smoothstep(REVEAL + .01, REVEAL - .01, p.x);   // 扫光线左边是照片，右边是深度图
  vec3 dv = mix(vec3(.02, .05, .12), vec3(1., .78, .45), pow(d, .45));
  col = mix(dv, col, r);
  float edge = 1. - smoothstep(0., .004, abs(p.x - REVEAL));
  col += edge * vec3(1., .8, .5) * step(.001, REVEAL) * step(REVEAL, .999);
  O = vec4(col, 1.);
}`;
scene({
  id: 'T-018', name: '照片深景推镜', dur: 12, still: 6.2,
  fonts: ["900 40px 'Noto Serif SC'", "700 40px 'Noto Serif SC'", "400 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Playfair Display'"],
  text: ZH,
  async init() {
    const A = await loadAssets(), im = await loadImage('photo.jpg'), dp = await loadImage('depth.png');
    const cv = c => { const x = mk(c.naturalWidth, c.naturalHeight); x.getContext('2d').drawImage(c, 0, 0); return x; };
    const img = cv(im), dep = cv(dp);
    // 铺满裁切：照片 uv 里取多大一块
    const ia = im.naturalWidth / im.naturalHeight, sa = W / H;
    const RECT = sa > ia ? [0, (1 - ia / sa) * .3, 1, ia / sa] : [(1 - sa / ia) * .5, 0, sa / ia, 1];
    glInit(W, H); glProgram('par', FRAG);
    return { A, img, dep, RECT, txt: mk(1600, Math.round(1600 / ia)), ia };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    // 运镜：前段推近 + 从左往右环绕，标题段慢慢升高，结尾回拉
    const a = eInOutCubic(inv(0, 8.6, t)), b = eInOutCubic(inv(9.4, 12, t));
    const cam = [lerp(-.035, .03, a) - .02 * b, lerp(.012, -.01, a), lerp(.0, .22, a) - .1 * b];
    // 标题：画在照片 uv 空间里（天空那一层），从山后往上升
    const rise = eOutCubic(inv(4.2, 6.4, t)), [rx, ry, rw] = s.RECT;
    const tc = s.txt.getContext('2d'), TW = s.txt.width, TH = s.txt.height;
    tc.clearRect(0, 0, TW, TH);
    tc.textAlign = 'center'; tc.textBaseline = 'alphabetic'; tc.fillStyle = '#fff';
    const fs = TW * rw * (LAND ? .14 : .2);
    tc.font = `900 ${fs}px 'Noto Serif SC'`;
    const cx = TW * (rx + rw * .5), by = TH * (LAND ? lerp(.54, .38, rise) : lerp(.34, .17, rise));
    tc.fillText('山在那里', cx, by);
    tc.font = `400 ${fs * .26}px 'Playfair Display'`;
    tc.fillText('THE MOUNTAIN IS THERE', cx, by + fs * .42);
    const TA = smooth(4.2, 4.8, t) * (1 - smooth(9.0, 9.4, t));
    const reveal = t < 7.2 ? 1 : t < 9.2 ? 1 - eInOutCubic(inv(7.2, 8.0, t)) + eInOutCubic(inv(8.6, 9.2, t)) : 1;
    glDraw(ctx, 'par', t, Math.round(W * .75), Math.round(H * .75), 0, 0, W, H,
      { IMG: s.img, DEP: s.dep, TXT: s.txt, RECT: s.RECT, CAM: cam, FOC: .3, TD: .03, REVEAL: Math.min(1, reveal), TA });
    grain(ctx, Math.floor(t * 24), .22);
    vignette(ctx, .55, .4);
    // 横屏加电影遮幅
    if (LAND) { ctx.fillStyle = '#000'; const bar = (H - W / 2.39) / 2; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar); }
    ctx.save(); ctx.textBaseline = 'alphabetic';
    const bar = LAND ? (H - W / 2.39) / 2 : 0;
    // 地点字幕
    const q1 = smooth(1.0, 1.6, t) * (1 - smooth(3.8, 4.3, t));
    if (q1 > 0) {
      ctx.globalAlpha = q1; ctx.fillStyle = '#f3e9d6'; ctx.textAlign = LAND ? 'left' : 'center';
      ctx.font = `400 ${(LAND ? 26 : 32) * u}px 'Noto Sans SC'`;
      ctx.fillText('1942 · 大提顿 · 蛇河', LAND ? 80 * u : W / 2, H - bar - (LAND ? 50 : 300) * u);
    }
    // 深度图说明
    const q2 = smooth(7.6, 8.0, t) * (1 - smooth(8.7, 9.1, t));
    if (q2 > 0) {
      ctx.globalAlpha = q2; ctx.fillStyle = '#ffc773'; ctx.textAlign = 'left';
      ctx.font = `700 ${(LAND ? 30 : 38) * u}px 'Noto Sans SC'`;
      ctx.fillText('深度图 · 白近黑远', 80 * u, H - bar - (LAND ? 90 : 340) * u);
      ctx.font = `400 ${(LAND ? 22 : 28) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#f3e9d6';
      ctx.fillText('Depth Anything V2 · 一张照片拆成远近层', 80 * u, H - bar - (LAND ? 50 : 290) * u);
    }
    // 落版
    const q3 = smooth(10.0, 10.8, t);
    if (q3 > 0) {
      ctx.globalAlpha = q3 * .55; ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = q3; ctx.textAlign = 'center'; ctx.fillStyle = '#f3e9d6';
      ctx.font = `900 ${(LAND ? 96 : 120) * u}px 'Noto Serif SC'`;
      ctx.fillText('远岭', W / 2, H * .5);
      ctx.font = `400 ${(LAND ? 30 : 36) * u}px 'Playfair Display'`;
      ctx.fillText('Y U A N L I N G   O U T D O O R', W / 2, H * .5 + 60 * u);
      ctx.font = `700 ${(LAND ? 30 : 38) * u}px 'Noto Serif SC'`; ctx.fillStyle = '#ffc773';
      ctx.fillText('走进照片里', W / 2, H * .5 + 130 * u);
    }
    ctx.globalAlpha = .55; ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = `400 ${15 * u}px 'Noto Sans SC'`;
    ctx.fillText(credits(s.A), W - 22 * u, H - bar - 16 * u);
    ctx.restore();
  },
});
