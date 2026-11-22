// C-109 刻线印刷长镜头：Three.js 用分形噪声搭一条河谷（两岸山体是位移过的网格，河道沿正弦曲线弯曲），山、树、水、天各用一个自写的排线着色器上色：按世界坐标铺平行线（山按高度画等高刻线、水按横向画波纹线、天按高度画稀疏横线），线宽由光照决定，暗处线粗、再叠一层斜向交叉线，远处按距离褪成纸白；树和小船套一层反向外壳当黑色轮廓，全片只有河上的小船和船夫是红的；前景枝条贴着镜头滑过，镜头一镜到底从高处降下来、跟着小船穿过峡谷；最后整张画乘在 Canvas 生成的纸纹上。
// 风格提示词：用刻线印刷长镜头风格：一个 3D 山水世界全部画成黑墨与纸白，灰度只靠刀刻平行线的粗细和疏密，只留一点红给一个小主角，山、林、水、前景枝条至少分三层彼此滑过，镜头一镜到底穿行其中，转场时响起刻刀划纸和压印的声音。
// 题材：3D 与实时图形 · 适合：国风短片、文旅宣传、诗词意境
scene({
  id: 'C-109', name: '刻线印刷长镜头', dur: 5, still: 2.8, libs: ['three'],
  fonts: ["700 40px 'Noto Serif SC'"],
  init() {
    const D = three3d({ fov: LAND ? 46 : 66, far: 900, tone: null });
    const T = D.THREE, sc = D.scene, R = mulberry32(109);
    sc.background = new T.Color('#ffffff');
    const river = z => 10 * Math.sin(z * .018) + 5 * Math.sin(z * .041 + 1);
    // 排线着色器：mode 0 等高线（按世界 y）、1 水波（按世界 z，随时间漂）、2 天（按世界 y，稀疏）、3 树（按世界 y 细密）
    const vert = `varying vec3 vW; varying vec3 vN; varying float vD;
      void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`;
    const frag = `uniform vec3 uL; uniform float uGap, uMode, uT, uNear, uFar, uBase;
      varying vec3 vW; varying vec3 vN; varying float vD;
      float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(hsh(i), hsh(i+vec2(1,0)), f.x), mix(hsh(i+vec2(0,1)), hsh(i+vec2(1,1)), f.x), f.y); }
      float lines(float c, float w){ float d = abs(fract(c) - .5) * 2.; float aa = fwidth(c) * 1.5;
        float ink = 1. - smoothstep(w - aa, w + aa, d);
        return mix(ink, w, smoothstep(.25, .6, fwidth(c))); }
      void main(){
        vec3 n = normalize(vN); float L = clamp(dot(n, normalize(uL)), 0., 1.);
        L = uBase + (1. - uBase) * L;
        float far = smoothstep(uNear, uFar, vD);
        float c, c2;
        if (uMode < .5) { c = vW.y / uGap + vn(vW.xz * .05) * 1.6; c2 = (vW.x + vW.z) / (uGap * 1.4); }
        else if (uMode < 1.5) { c = vW.z / uGap + sin(vW.x * .25 + uT * 1.3) * .35 + vn(vW.xz * .1 + uT * .2) * .8; c2 = c; L = .55 + .4 * vn(vW.xz * .05);}
        else if (uMode < 2.5) { c = vW.y / uGap; c2 = c; L = clamp(.6 + vW.y * .004, 0., 1.); }
        else { c = vW.y / uGap + vn(vW.xz) * .5; c2 = (vW.x - vW.z) / uGap; }
        L = mix(L, 1., far * .92);
        float w1 = clamp((1. - L) * 1.05, 0., .92);
        float ink = lines(c, w1);
        float w2 = clamp((.45 - L) * 1.8, 0., .8);
        if (uMode < .5 || uMode > 2.5) ink = max(ink, lines(c2, w2));
        gl_FragColor = vec4(vec3(1. - ink) * vec3(1., .985, .96) + vec3(0.), 1.);
      }`;
    const mats = [];
    const hm = (mode, gap, base = .1, near = 60, far = 520) => {
      const m = new T.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { uL: { value: new T.Vector3(-.5, .8, .35) }, uGap: { value: gap }, uMode: { value: mode }, uT: { value: 0 }, uNear: { value: near }, uFar: { value: far }, uBase: { value: base } } });
      mats.push(m); return m;
    };
    const ink = new T.MeshBasicMaterial({ color: '#141210', side: T.BackSide });
    const red = new T.MeshBasicMaterial({ color: '#c8231e' });
    // 地形：沿 z 长条，河谷两侧隆起
    const NX = 200, NZ = 420, SX = 360, SZ = 760;
    const tg = new T.PlaneGeometry(SX, SZ, NX, NZ).rotateX(-Math.PI / 2);
    const P = tg.attributes.position;
    const height = (x, z) => {
      const dx = Math.abs(x - river(z));
      const valley = smooth(9, 70, dx);
      const ridge = 1 - Math.abs(fbm(x * .012 + 3, z * .012, 5) * 2 - 1);
      const peaks = Math.pow(ridge, 1.8) * 190 + fbm(x * .03, z * .03, 4) * 40;
      return valley * peaks * (.5 + .9 * smooth(25, 140, dx)) - 4 * (1 - smooth(0, 12, dx));
    };
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i) - SZ / 2 + 120; P.setXYZ(i, x, height(x, z), z); }
    tg.computeVertexNormals();
    sc.add(new T.Mesh(tg, hm(0, 2.2, .08)));
    // 水面
    const water = new T.Mesh(new T.PlaneGeometry(SX, SZ).rotateX(-Math.PI / 2), hm(1, 1.1, .5, 40, 300)); water.position.set(0, -1.2, -SZ / 2 + 120); sc.add(water);
    // 天：一个大球的内面
    const sky = new T.Mesh(new T.SphereGeometry(800, 32, 16), hm(2, 7, 1, 2000, 3000)); sky.material.side = T.BackSide; sc.add(sky);
    // 树：岸边坡上成片的松，几层圆锥叠起来，外面一层反向外壳当轮廓
    const treeM = hm(3, .55, .05, 40, 360);
    const cone = new T.ConeGeometry(1, 2.2, 7);
    const trees = new T.Group(); sc.add(trees);
    for (let k = 0; k < 300; k++) {
      const z = 100 - R() * 520, side = R() < .5 ? -1 : 1, x = river(z) + side * (13 + R() * 40);
      const y = height(x, z); if (y > 45 || y < -1) continue;
      const s = 1.6 + R() * 2.4, g = new T.Group();
      for (let j = 0; j < 3; j++) {
        const m = new T.Mesh(cone, treeM); m.scale.set(s * (1 - j * .25), s * .9, s * (1 - j * .25)); m.position.y = s * (1 + j * 1.1); g.add(m);
        const o = new T.Mesh(cone, ink); o.scale.copy(m.scale).multiplyScalar(1.12); o.position.copy(m.position); g.add(o);
      }
      const tr = new T.Mesh(new T.CylinderGeometry(.15 * s, .2 * s, s * 1.2, 5), ink); tr.material = new T.MeshBasicMaterial({ color: '#141210' }); tr.position.y = s * .4; g.add(tr);
      g.position.set(x, y - .3, z); g.rotation.y = R() * TAU; trees.add(g);
    }
    // 小船和船夫：全片唯一的红
    const boat = new T.Group();
    const hg = new T.BoxGeometry(1.6, .7, 5.6); const h2 = new T.Mesh(hg, red); h2.position.y = .3; boat.add(h2);
    const ho = new T.Mesh(hg, ink); ho.scale.setScalar(1.1); ho.position.y = .3; boat.add(ho);
    const body = new T.Mesh(new T.ConeGeometry(.55, 1.8, 8), red); body.position.set(0, 1.5, -1.2); boat.add(body);
    const hat = new T.Mesh(new T.ConeGeometry(.9, .45, 10), red); hat.position.set(0, 2.55, -1.2); boat.add(hat);
    const pole = new T.Mesh(new T.CylinderGeometry(.06, .06, 6, 5), new T.MeshBasicMaterial({ color: '#141210' })); pole.position.set(.5, 1.6, .2); pole.rotation.x = -.5; boat.add(pole);
    sc.add(boat);
    // 前景枝条：贴近镜头的黑色剪影
    const branches = new T.Group(); sc.add(branches);
    const bm = new T.MeshBasicMaterial({ color: '#141210', side: T.DoubleSide });
    const twig = (pts, r) => new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => new T.Vector3(...p))), 24, r, 5), bm);
    const leafG = new T.PlaneGeometry(.5, .16);
    const mkBranch = (x, y, z, dir, seed) => {
      const r = mulberry32(seed), g = new T.Group();
      const pts = []; for (let i = 0; i <= 6; i++) pts.push([dir * (i * 1.6), y + Math.sin(i * .9 + seed) * .6 - i * .2, (r() - .5) * .6]);
      g.add(twig(pts, .12));
      for (let i = 1; i < 6; i++) {
        const [px, py, pz] = pts[i], q = []; for (let j = 0; j <= 3; j++) q.push([px + dir * j * .5, py + (j * .45) * (r() < .5 ? 1 : -1), pz + (r() - .5) * .4]);
        g.add(twig(q, .05));
        for (let j = 0; j < 10; j++) { const l = new T.Mesh(leafG, bm); l.position.set(px + dir * r() * 1.8, py + (r() - .5) * 1.4, pz + (r() - .5) * .8); l.rotation.set(r() * 3, r() * 3, r() * 3); g.add(l); }
      }
      g.position.set(x, 0, z); branches.add(g); return g;
    };
    const paper = makePaper('#f3ead8', { grain: 14, fiber: .6, blot: 6, seed: 109 });
    // 镜头：从高处降下，跟到船后
    const path = t => {
      const e = eInOutCubic(clamp(t / 2.8)), bz = 40 - t * 13, z = bz + 24 + 40 * (1 - e);
      return { x: river(z) * .7 + (1 - e) * 6, y: 9 + 55 * (1 - e), z };
    };
    const look = t => { const bz = 40 - t * 13 - 34; return { x: river(bz), y: 2, z: bz }; };
    return { D, T, river, mats, boat, branches, mkBranch, paper, height, path, look };
  },
  draw(ctx, t, s, f) {
    const { D, river, mats, boat, paper } = s;
    if (!s.br) {   // 枝条位置和镜头路径有关：第一次画时按路径放好
      s.br = [];
      for (const [tz, dir, dy, seed] of [[.9, 1, 0, 3], [2.3, -1, .8, 7], [3.7, 1, .3, 11]]) {
        const p = s.path(tz + .35);
        s.br.push(s.mkBranch(p.x - dir * (LAND ? 10 : 8.5), p.y + dy + 2.6, p.z - 3.5, dir, seed));
      }
    }
    mats.forEach(m => { m.uniforms.uT.value = t; });
    const bz = 40 - t * 13, bx = river(bz);
    boat.position.set(bx, -.9 + Math.sin(t * 2.2) * .12, bz);
    boat.rotation.y = Math.atan2(river(bz - 1) - bx, -1) + Math.PI; boat.rotation.z = Math.sin(t * 1.7) * .05;
    const c = s.path(t), look = s.look(t);
    D.camera.position.set(c.x, c.y, c.z); D.camera.lookAt(look.x, look.y, look.z);
    D.render();
    ctx.drawImage(paper, 0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(D.canvas, 0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    // 印章：右下角一枚小朱印
    const u = SHORT / 1080, k = smooth(4.2, 4.5, t);
    if (k > 0) {
      const sz = 84 * u, x = LAND ? W - 150 * u : W - 140 * u, y = H - (LAND ? 170 : 260) * u;
      ctx.save(); ctx.globalAlpha = k * .9; ctx.translate(x, y); ctx.rotate(-.04); ctx.scale(1 + (1 - k) * .3, 1 + (1 - k) * .3);
      ctx.fillStyle = '#b8241c'; rr(ctx, -sz / 2, -sz / 2, sz, sz, 6 * u); ctx.fill();
      ctx.fillStyle = '#f3ead8'; ctx.font = `700 ${Math.round(34 * u)}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('刻', 0, -18 * u); ctx.fillText('川', 0, 20 * u); ctx.restore();
    }
    grain(ctx, f, .08);
  }
});
