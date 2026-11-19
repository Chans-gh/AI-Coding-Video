// C-161 蜡染：先在 Three.js 里搭一对相对而唱的人形和中间一株花，只用两盏灯照：金灯输出纯红、蓝灯输出纯绿（关掉色调映射和色彩空间转换，红、绿两个通道就是两盏灯各自的照度）；再用 GLSL 把这张图换算成染色区：只有金灯照到染姜黄、只有蓝灯照到染靛蓝、两盏都照到留蜡白、都照不到是深靛，分界用噪声扰动成晕染边，蜡白区按 Voronoi 细胞边画出冰裂纹，整幅叠上棉布经纬纹；中途一道带毛边的染液前沿从左扫到右，扫过处两种染色对调；四周的几何花边在 Canvas 2D 上画。
// 风格提示词：用蜡染风格：棉布上只有靛蓝、姜黄和米白蜡三种颜色，场景先在 3D 里被一盏金灯和一盏蓝灯照亮，再换算成染色区：只照到金灯处染黄、只照到蓝灯处染蓝、两盏都照到处留蜡白，蜡面布满细冰裂纹，换色时一道染液前沿扫过布面，四周是几何花边。
// 题材：纸艺、材质与定格 · 适合：民族与手工艺题材、双人对唱、旅途与田野
const SW = [2.3, 3.5]; // 染液前沿扫过的时间（sound.py 用同一组数）
scene({
  id: 'C-161', name: '蜡染', dur: 5, still: 4.5, libs: ['three'],
  fonts: [],
  init() {
    const D = three3d({ tone: null, fov: LAND ? 30 : 44 });
    const T = D.THREE, sc = D.scene;
    D.renderer.outputColorSpace = T.LinearSRGBColorSpace;
    sc.background = new T.Color(0, 0, 0);
    const gold = new T.DirectionalLight(new T.Color(1, 0, 0), Math.PI), blue = new T.DirectionalLight(new T.Color(0, 1, 0), Math.PI);
    sc.add(gold, blue);
    const M = new T.MeshLambertMaterial({ color: '#ffffff' });
    const wall = new T.Mesh(new T.PlaneGeometry(40, 30, 1, 1), new T.MeshLambertMaterial({ color: new T.Color(.3, .3, .3) })); wall.position.z = -2.5; sc.add(wall);
    const halo = new T.Mesh(new T.RingGeometry(2.2, 3.4, 96), M); halo.position.set(0, .7, -2.4); sc.add(halo);
    const halo2 = new T.Mesh(new T.CircleGeometry(1.7, 96), M); halo2.position.set(0, .7, -2.4); sc.add(halo2);
    // 人形：袍子（车削）、头、发髻、举起的手臂
    const robe = (() => { const pts = []; for (let i = 0; i <= 20; i++) { const y = i / 20 * 2.6; pts.push(new T.Vector2(.95 - .6 * Math.pow(i / 20, .7) + .06 * Math.sin(i * 1.4), y)); } return new T.LatheGeometry(pts, 48); })();
    const fig = (sx) => {
      const g = new T.Group(); g.position.set(sx * (LAND ? 2.4 : 1.75), LAND ? -2.1 : -2.6, LAND ? 0 : .4); g.rotation.y = -sx * .55;
      const body = new T.Mesh(robe, M); g.add(body);
      const head = new T.Mesh(new T.SphereGeometry(.42, 40, 30), M); head.position.y = 3.0; g.add(head);
      const bun = new T.Mesh(new T.SphereGeometry(.24, 24, 16), M); bun.position.set(.0, 3.38, -.22); g.add(bun);
      const arm = new T.Group(); arm.position.set(0, 2.3, .2); g.add(arm);
      const a1 = new T.Mesh(new T.CapsuleGeometry(.11, 1.1, 6, 16), M); a1.position.y = .55; arm.add(a1);
      const hand = new T.Mesh(new T.SphereGeometry(.16, 16, 12), M); hand.position.y = 1.2; arm.add(hand);
      sc.add(g); return { g, head, arm };
    };
    const F = [fig(-1), fig(1)];
    // 花
    const fl = new T.Group(); fl.position.set(0, -2.1, .6); sc.add(fl);
    const stem = new T.Mesh(new T.CylinderGeometry(.05, .07, 2.6, 10), M); stem.position.y = 1.3; fl.add(stem);
    const head = new T.Group(); head.position.y = 2.7; fl.add(head);
    for (let i = 0; i < 8; i++) { const p = new T.Mesh(new T.SphereGeometry(.38, 20, 12), M); p.scale.set(1, .32, .55); const a = i / 8 * TAU; p.position.set(Math.cos(a) * .42, Math.sin(a) * .42, 0); p.rotation.z = a; head.add(p); }
    const core = new T.Mesh(new T.SphereGeometry(.22, 20, 14), M); core.position.z = .1; head.add(core);
    for (const s of [-1, 1]) { const lf = new T.Mesh(new T.SphereGeometry(.5, 20, 12), M); lf.scale.set(1, .22, .45); lf.position.set(s * .45, .9, 0); lf.rotation.z = s * .5; fl.add(lf); }
    // 太阳和月亮
    const sun = new T.Mesh(new T.SphereGeometry(.7, 40, 30), M); sun.position.set(LAND ? -3.6 : -1.7, LAND ? 2.6 : 4.6, -1); sc.add(sun);
    const moon = new T.Mesh(new T.TorusGeometry(.55, .16, 16, 40, Math.PI * 1.3), M); moon.position.set(LAND ? 3.6 : 1.7, LAND ? 2.6 : 4.6, -1); moon.rotation.z = .8; sc.add(moon);
    glInit(W, H);
    glProgram('batik', GLSL_LIB + `
uniform sampler2D TX; uniform float SWP, SWQ;
vec2 h2(vec2 p){ return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453); }
float crack(vec2 p){ vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g = vec2(x,y), o = h2(i+g); float d = length(g+o-f); if(d<d1){ d2=d1; d1=d; } else if(d<d2) d2=d; }
  return d2 - d1; }
void main(){
  vec2 uv = gl_FragCoord.xy / R, px = gl_FragCoord.xy / min(R.x,R.y);
  vec3 L = texture(TX, vec2(uv.x, 1.-uv.y)).rgb;
  float n = fbm(px*9.) - .5, n2 = fbm(px*38. + 3.) - .5;
  float g = smoothstep(.36, .44, L.r + n*.22 + n2*.06), b = smoothstep(.36, .44, L.g + n*.22 - n2*.06);
  vec3 IND = vec3(.10,.17,.38), DEEP = vec3(.05,.08,.20), TUR = vec3(.89,.66,.16), WAX = vec3(.95,.92,.83);
  // 染液前沿：扫过处两种染色对调
  float fx = mix(-.15, 1.15, SWP) + (fbm(vec2(uv.y*6., 1.)) - .5) * .12 + n2*.03;
  float sw = smoothstep(fx + .01, fx - .01, uv.x);
  vec3 A = mix(TUR, IND, sw), Bc = mix(IND, TUR, sw);
  vec3 c = DEEP;
  c = mix(c, A, g * (1.-b));
  c = mix(c, Bc, b * (1.-g));
  float wx = g * b; c = mix(c, WAX, wx);
  // 冰裂纹：只在蜡白区
  float cr = crack(px*7. + vec2(fbm(px*4.)*1.5)), cr2 = crack(px*15. + 9.);
  float line = (1.-smoothstep(.0, .035, cr)) * .9 + (1.-smoothstep(.0, .025, cr2)) * .5;
  c = mix(c, IND*1.1, clamp(line,0.,1.) * wx * .85);
  // 前沿本身：湿的深色毛边
  float edge = exp(-abs(uv.x - fx) * 90.) * SWQ;
  c = mix(c, IND*.7, edge*.6);
  // 棉布纹理
  float wv = .5 + .5*sin(gl_FragCoord.x*1.9) * sin(gl_FragCoord.y*1.7 + sin(gl_FragCoord.x*.05));
  c *= .9 + .08*wv + .12*n2;
  c *= 1. - .1 * smoothstep(.2, .8, fbm(px*2.5 + 7.));
  O = vec4(c, 1.);
}`);
    // 几何花边
    const u = SHORT / 1080, bw = (LAND ? 70 : 64) * u, bc = mk(W, H), g = bc.getContext('2d');
    const IND = '#1A2B61', TUR = '#E3A829', WAX = '#F2EBD4';
    g.fillStyle = IND; g.fillRect(0, 0, W, H); g.clearRect(bw, bw, W - 2 * bw, H - 2 * bw);
    g.strokeStyle = WAX; g.lineWidth = 4 * u; g.strokeRect(bw * .18, bw * .18, W - bw * .36, H - bw * .36); g.strokeRect(bw * .82, bw * .82, W - bw * 1.64, H - bw * 1.64);
    const tri = (x, y, s, up, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x - s, y + (up ? s : -s) * .6); g.lineTo(x + s, y + (up ? s : -s) * .6); g.lineTo(x, y - (up ? s : -s) * .6); g.closePath(); g.fill(); };
    const st = bw * .55;
    for (let x = bw / 2; x < W; x += st) { const i = Math.round(x / st); tri(x, bw / 2, st * .4, i % 2 === 0, i % 2 ? TUR : WAX); tri(x, H - bw / 2, st * .4, i % 2 === 1, i % 2 ? TUR : WAX); }
    for (let y = bw * 1.5; y < H - bw; y += st) { const i = Math.round(y / st); g.fillStyle = i % 2 ? TUR : WAX; for (const x of [bw / 2, W - bw / 2]) { g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillRect(-st * .22, -st * .22, st * .44, st * .44); g.restore(); } }
    // 布纹噪点叠在花边上
    const id = g.getImageData(0, 0, W, H), d = id.data;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const v = (hash1(i * .71) - .5) * 26; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
    g.putImageData(id, 0, 0);
    return { D, T, gold, blue, F, head, bc };
  },
  draw(ctx, t, s) {
    const { D, gold, blue, F } = s, cam = D.camera;
    // 两盏灯缓慢绕行，染色区跟着流动
    const a = .9 + .25 * Math.sin(t * .9), b = -.9 + .25 * Math.sin(t * .7 + 1);
    gold.position.set(Math.sin(a) * 6 - 2, 3 + Math.sin(t * .6) * 1.2, Math.cos(a) * 3.2 + 1.5);
    blue.position.set(Math.sin(b) * 6 + 2, 2.2 + Math.cos(t * .5) * 1.2, Math.cos(b) * 3.2 + 1.5);
    F.forEach((f, i) => { const s2 = i ? 1 : -1, sing = Math.sin(t * 3.2 + i * Math.PI); f.g.rotation.z = .04 * sing; f.head.position.y = 3.0 + .05 * sing; f.arm.rotation.z = s2 * (-.9 - .35 * Math.sin(t * 2.2 + i * 1.7)); });
    s.head.rotation.z = t * .5;
    cam.position.set(0, LAND ? .4 : .9, LAND ? 11.5 : 16.5); cam.lookAt(0, LAND ? .3 : .9, 0);
    D.render();
    const swp = clamp((t - SW[0]) / (SW[1] - SW[0]), 0, 1);
    glDraw(ctx, 'batik', t, W, H, 0, 0, W, H, { TX: D.canvas, SWP: swp, SWQ: swp > 0 && swp < 1 ? 1 : 0 });
    ctx.drawImage(s.bc, 0, 0);
  }
});
