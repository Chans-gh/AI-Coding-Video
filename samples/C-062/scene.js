// C-062 后室 / 找到的录像带：Three.js 用代码拼出无尽的黄墙房间（墙、地毯、天花板、嵌入式灯管全部程序生成，
// 房间按相机位置循环平移，走不完），手持镜头用噪声抖动慢慢前行；渲染结果交给 GLSL 片元着色器做录像带画质——
// 横向干扰条、色带偏移、扫描线、磁带噪点、暗角，再用 Canvas 2D 压上日期时间戳和「规则」字幕。
// 风格提示词：用后室录像带风格：像 90 年代家用摄像机拍的录像带（横向干扰、色带偏移、右下角日期时间戳），发黄的壁纸、潮湿地毯、嵌入式荧光灯构成无尽空房间，手持镜头慢慢前行，恐惧来自“规则”和环境音而不是怪物。
// 题材：电影年代与屏幕科技 · 适合：悬疑、新怪谈
scene({
  id: 'C-062', name: '后室 / 找到的录像带', dur: 5, still: 3.6, libs: ['three'],
  text: '规则二不要回头走廊尽头的灯坏了请原路返回',
  fonts: ["400 40px 'JetBrains Mono'", "700 40px 'Noto Sans SC'"],
  init() {
    const RW = Math.round(W * .55), RH = Math.round(H * .55);
    const D = three3d({ w: RW, h: RH, fov: 62, shadows: false, exposure: 1.0, tone: null });
    const T = D.THREE, sc = D.scene;
    sc.background = new T.Color('#1a1608');
    sc.fog = new T.Fog('#2a2410', 6, 34);
    // 一节「房间」：地毯、天花板、两侧墙、几根柱子和嵌入式灯管；沿 z 复制 10 节，循环使用
    const SEG = 10, LEN = 9;
    const wallMat = new T.MeshStandardMaterial({ color: '#c9b05a', roughness: .95 });
    const wallMat2 = new T.MeshStandardMaterial({ color: '#b89c47', roughness: .95 });
    const carpet = new T.MeshStandardMaterial({ color: '#7a6a34', roughness: 1 });
    const ceil = new T.MeshStandardMaterial({ color: '#d8c87e', roughness: .9 });
    const segs = [];
    for (let i = 0; i < SEG; i++) {
      const g = new T.Group(); g.position.z = -i * LEN;
      const floorM = new T.Mesh(new T.PlaneGeometry(14, LEN).rotateX(-Math.PI / 2), carpet); floorM.position.y = 0; g.add(floorM);
      const ceilM = new T.Mesh(new T.PlaneGeometry(14, LEN).rotateX(Math.PI / 2), ceil); ceilM.position.y = 3.1; g.add(ceilM);
      for (const sgn of [-1, 1]) {
        const w = new T.Mesh(new T.PlaneGeometry(LEN, 3.1), i % 2 ? wallMat2 : wallMat);
        w.rotation.y = -sgn * Math.PI / 2; w.position.set(sgn * 7, 1.55, 0); g.add(w);
        // 墙面的腰线
        const line = new T.Mesh(new T.PlaneGeometry(LEN, .18), new T.MeshStandardMaterial({ color: '#8a7330', roughness: 1 }));
        line.rotation.y = -sgn * Math.PI / 2; line.position.set(sgn * 6.98, .95, 0); g.add(line);
      }
      if (i % 2 === 0) {                                              // 隔一节有一对柱子，让走廊看起来无尽
        for (const sgn of [-1, 1]) {
          const p = new T.Mesh(new T.BoxGeometry(.9, 3.1, .9), wallMat2); p.position.set(sgn * 3.6, 1.55, 0); g.add(p);
        }
      }
      // 嵌入式灯管：发光面片 + 一盏点光
      const tube = new T.Mesh(new T.PlaneGeometry(2.6, .5).rotateX(Math.PI / 2), new T.MeshBasicMaterial({ color: '#fff2c0' }));
      tube.position.set(0, 3.06, 0); g.add(tube);
      const li = new T.PointLight('#ffeab0', 5.5, 15, 1.6); li.position.set(0, 2.85, 0); g.add(li);
      sc.add(g); segs.push({ g, tube, li, i });
    }
    // 录像带画质：横向干扰、色带偏移、扫描线、噪点
    glInit(RW, RH);
    glProgram('vhs', `
uniform sampler2D SRC; uniform float WARP, NOISE;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / R; uv.y = 1.0 - uv.y;
  float band = step(0.986, h21(vec2(floor(uv.y * 90.0), floor(T * 7.0))));   // 偶发的横向干扰条
  float roll = sin((uv.y + T * 0.08) * 6.28318) * 0.0012;                    // 整体缓慢滚动的扭曲
  float jx = (h21(vec2(floor(uv.y * 240.0), floor(T * 24.0))) - 0.5) * 0.02 * band + roll;
  uv.x += jx + WARP * 0.002 * sin(uv.y * 40.0 + T * 3.0);
  float ca = 0.0026 + 0.004 * band;                                          // 色带偏移
  vec3 c = vec3(texture(SRC, uv + vec2(ca, 0.0)).r, texture(SRC, uv).g, texture(SRC, uv - vec2(ca, 0.0)).b);
  c *= 0.88 + 0.12 * sin(uv.y * R.y * 1.7);                                  // 扫描线
  c += (h21(gl_FragCoord.xy + T * 97.0) - 0.5) * NOISE;                      // 磁带噪点
  c = mix(c, vec3(dot(c, vec3(0.3, 0.6, 0.1))), 0.12);                       // 轻微褪色
  c *= vec3(1.04, 1.0, 0.92);
  float r = distance(uv, vec2(0.5)) * 1.4;
  c *= 1.0 - smoothstep(0.42, 1.05, r) * 0.8;
  O = vec4(clamp(c, 0.0, 1.0), 1.0);
}`);
    return { D, T, segs, SEG, LEN, RW, RH, u: SHORT / 1080 };
  },
  draw(ctx, t, s, f) {
    const { D, segs, SEG, LEN, RW, RH, u } = s;
    const z = -t * 2.1;                                               // 慢慢前行
    segs.forEach(q => {                                               // 房间循环：走出去的那一节搬到最前面
      const base = -q.i * LEN;
      const span = SEG * LEN;
      let zz = base;
      while (zz > z + 6) zz -= span;
      while (zz < z - span + 6) zz += span;
      q.g.position.z = zz;
      const flick = q.i === 3 ? (noise1(t * 9) > .42 ? 1 : .08) : .85 + .18 * noise1(t * 2.5 + q.i);  // 一节的灯坏了
      q.li.intensity = 5.5 * flick; q.tube.material.color.setScalar(.55 + .45 * flick);
    });
    // 手持：噪声抖动 + 轻微呼吸
    const bx = (noise1(t * 1.7) - .5) * .5, by = (noise1(t * 2.3 + 11) - .5) * .22;
    D.camera.position.set(bx, 1.55 + by + Math.sin(t * 2.6) * .035, z);
    D.camera.rotation.set((noise1(t * 1.9 + 3) - .5) * .06, (noise1(t * 1.3 + 7) - .5) * .12, (noise1(t * .9 + 5) - .5) * .05);
    D.render();
    glDraw(ctx, 'vhs', t, RW, RH, 0, 0, W, H, { SRC: D.canvas, WARP: 1 + 2 * clamp(noise1(t * 3) * 2 - 1), NOISE: .13 });
    // 时间戳和「规则」字幕
    const U = u;
    ctx.font = `400 ${Math.round(34 * U)}px 'JetBrains Mono'`;
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(240,240,220,.82)';
    const sec = 14 + t, hh = '02', mm = '47';
    ctx.fillText(`AUG 12 1996`, W - 56 * U, H - 96 * U);
    ctx.fillText(`${hh}:${mm}:${String(Math.floor(sec)).padStart(2, '0')}`, W - 56 * U, H - 50 * U);
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(240,240,220,.75)';
    ctx.fillText(Math.floor(t * 2) % 2 ? '● REC' : '  REC', 56 * U, 76 * U);
    ctx.fillText('SP  EP-12', 56 * U, 120 * U);
    // 规则：一条条压在下方，恐惧来自规则本身
    const rules = [['规则二：不要回头。', .6], ['走廊尽头的灯坏了。', 2.0], ['请原路返回。', 3.4]];
    ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(44 * U)}px 'Noto Sans SC'`;
    rules.forEach(([txt, t0]) => {
      const a = smooth(t0, t0 + .25, t) * (1 - smooth(t0 + 1.2, t0 + 1.5, t));
      if (a <= 0) return;
      ctx.fillStyle = `rgba(245,240,215,${a})`;
      ctx.fillText(txt, W / 2, H - (LAND ? 170 : 420) * U);
    });
    grain(ctx, f, .14);
  }
});
