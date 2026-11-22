// C-026 纸片立体书：Three.js 搭一张木桌（木纹贴图由分形噪声拉成的条纹画出）和一本精装书，封面连着左页绕书脊翻开；书页中缝上竖着几层剪纸布景（远山、松树、小屋、云），每层是 Canvas 画的带白边纸片贴图，按书翻开的进度从平躺转到直立，略过头再回弹；主角是正反两面的纸片小人，背面是没印色的卡纸，转身时整片绕竖轴翻面；最后小人从书里跳到木桌上，落地压出影子；平行光开柔和阴影，画面上下两边叠一层模糊图做出微距浅景深。
// 风格提示词：用纸片立体书风格：一本书在真实木桌上打开变成舞台，布景随翻页从书页弹起，角色是带白边的扁平剪纸片、转身时像纸片一样翻面，微距浅景深，结尾主角从书里跳到真实桌面上。
// 题材：3D 与实时图形 · 适合：儿童故事、品牌故事、绘本改编
scene({
  id: 'C-026', name: '纸片立体书', dur: 5, still: 3.2, libs: ['three'],
  fonts: ["700 40px 'Noto Serif SC'"],
  init() {
    const D = three3d({ fov: LAND ? 30 : 42, shadows: true, exposure: 1.05 });
    const T = D.THREE, sc = D.scene;
    sc.background = new T.Color('#2a1d14');
    studioEnv(D, { top: '#fff1dc', mid: '#7a5a40', floor: '#3a2a1c', bottom: '#1a120c' });
    const key = new T.DirectionalLight('#fff0d8', 2.6); key.position.set(-3, 7, 4); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, far: 25 }); key.shadow.radius = 5; key.shadow.bias = -.0006;
    sc.add(key, new T.HemisphereLight('#ffe8cc', '#3a2410', .7));
    const tex = (c, rep) => { const x = new T.CanvasTexture(c); x.colorSpace = T.SRGBColorSpace; x.anisotropy = 8; if (rep) { x.wrapS = x.wrapT = T.RepeatWrapping; x.repeat.set(...rep); } return x; };
    // 木桌
    const wc = mk(1024, 1024), wg = wc.getContext('2d'), im = wg.createImageData(1024, 1024);
    for (let y = 0; y < 1024; y++) for (let x = 0; x < 1024; x++) {
      const n = fbm(x / 300, y / 30, 4), r = Math.sin((y / 1024 * 40 + n * 6) * Math.PI) * .5 + .5, k = (y * 1024 + x) * 4;
      const v = .55 + .25 * r + .12 * hash2(x, y >> 1);
      im.data[k] = 150 * v; im.data[k + 1] = 96 * v; im.data[k + 2] = 58 * v; im.data[k + 3] = 255;
    }
    wg.putImageData(im, 0, 0);
    const table = new T.Mesh(new T.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ map: tex(wc, [3, 3]), roughness: .55 }));
    table.receiveShadow = true; sc.add(table);
    // 书页纸
    const pc = mk(512, 680), pg = pc.getContext('2d');
    pg.fillStyle = '#f4ead6'; pg.fillRect(0, 0, 512, 680);
    for (let i = 0; i < 4000; i++) { pg.fillStyle = `rgba(120,90,50,${hash1(i) * .05})`; pg.fillRect(hash1(i + 9e3) * 512, hash1(i + 7e3) * 680, 2, 2); }
    pg.fillStyle = 'rgba(80,60,40,.25)';
    for (let l = 0; l < 6; l++) for (let w = 0; w < 9; w++) { const lw = 20 + hash2(l, w) * 30; pg.fillRect(60 + w * 44, 520 + l * 22, lw, 5); }
    const pageM = new T.MeshStandardMaterial({ map: tex(pc), roughness: .9 });
    const coverM = new T.MeshStandardMaterial({ color: '#7a1f22', roughness: .75 });
    const PW = 3, PD = 4;
    const half = (side) => {
      const g = new T.Group();
      const block = new T.Mesh(new T.BoxGeometry(PW, .16, PD), [coverM, coverM, pageM, coverM, coverM, coverM]); block.position.set(side * PW / 2, .1, 0);
      const cov = new T.Mesh(new T.BoxGeometry(PW + .12, .04, PD + .16), coverM); cov.position.set(side * (PW / 2 + .02), .0, 0);
      block.castShadow = block.receiveShadow = cov.castShadow = true; g.add(block, cov); return g;
    };
    const book = new T.Group(); sc.add(book); book.position.y = .02;
    const right = half(1); book.add(right);
    const left = half(-1); left.position.y = .18; book.add(left);
    // 剪纸纸片：fn(g, w, h) 画彩色形状，自动加一圈白边
    const card = (w, h, fn, px = 256) => {
      const cw = Math.round(px * w / h), c = mk(cw, px), g = c.getContext('2d');
      const tmp = mk(cw, px), tg = tmp.getContext('2d'); fn(tg, cw, px);
      // 白边：把形状向外扩几像素填白
      g.save(); for (let a = 0; a < 16; a++) g.drawImage(tmp, Math.cos(a / 16 * TAU) * 7, Math.sin(a / 16 * TAU) * 7); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, cw, px); g.restore();
      g.drawImage(tmp, 0, 0);
      const m = new T.MeshStandardMaterial({ map: tex(c), alphaTest: .5, side: T.DoubleSide, roughness: .85 });
      const mesh = new T.Mesh(new T.PlaneGeometry(w, h), m); mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: m.map, alphaTest: .5 });
      return mesh;
    };
    const pops = [];
    const pop = (mesh, z, delay, x = 0) => { const g = new T.Group(); mesh.position.y = mesh.geometry.parameters.height / 2; g.add(mesh); g.position.set(x, .19, z); book.add(g); pops.push({ g, delay }); return g; };
    pop(card(5.2, 2.2, (g, w, h) => {
      g.fillStyle = '#4d7a8c'; g.beginPath(); g.moveTo(10, h - 8); [[.12, .35], [.25, .55], [.4, .15], [.55, .5], [.7, .25], [.85, .45], [.95, .3]].forEach(([x, y]) => g.lineTo(x * w, y * h)); g.lineTo(w - 10, h - 8); g.fill();
      g.fillStyle = '#eef3f0'; [[.4, .15], [.7, .25]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x * w, y * h); g.lineTo(x * w - 40, y * h + 50); g.lineTo(x * w + 40, y * h + 50); g.fill(); });
    }), -1.5, 0);
    pop(card(1.4, .7, (g, w, h) => { g.fillStyle = '#ffffff'; for (const [x, y, r] of [[.3, .6, .28], [.55, .45, .38], [.78, .62, .25]]) { g.beginPath(); g.arc(x * w, y * h, r * h, 0, TAU); g.fill(); } g.fillRect(.15 * w, .6 * h, .7 * w, .3 * h); }), -1.2, .08, -1.4).children[0].position.y = 2.1;
    const pine = (g, w, h) => { g.fillStyle = '#2f6b45'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(w / 2, h * (.05 + i * .2)); g.lineTo(w * .08, h * (.45 + i * .2)); g.lineTo(w * .92, h * (.45 + i * .2)); g.fill(); } g.fillStyle = '#6b4226'; g.fillRect(w * .43, h * .82, w * .14, h * .16); };
    pop(card(.9, 1.6, pine), -.7, .12, -1.6); pop(card(.7, 1.2, pine), -.5, .16, -.9); pop(card(1, 1.8, pine), -.8, .14, 1.9);
    pop(card(1.5, 1.4, (g, w, h) => {
      g.fillStyle = '#e2b25a'; g.fillRect(w * .12, h * .45, w * .76, h * .52);
      g.fillStyle = '#b8402f'; g.beginPath(); g.moveTo(w * .03, h * .5); g.lineTo(w * .5, h * .08); g.lineTo(w * .97, h * .5); g.fill();
      g.fillStyle = '#5a3a24'; g.fillRect(w * .42, h * .66, w * .17, h * .31);
      g.fillStyle = '#9fd0e0'; g.fillRect(w * .2, h * .58, w * .15, h * .14); g.fillRect(w * .66, h * .58, w * .15, h * .14);
    }), -.3, .2, .9);
    // 主角：正反两面的纸片小人
    const hero = new T.Group(), body = new T.Group(); hero.add(body);
    const girl = (g, w, h) => {
      g.fillStyle = '#e8564a'; g.beginPath(); g.moveTo(w * .5, h * .34); g.lineTo(w * .18, h * .78); g.lineTo(w * .82, h * .78); g.fill();
      g.fillStyle = '#3b2a20'; g.fillRect(w * .36, h * .78, w * .09, h * .2); g.fillRect(w * .55, h * .78, w * .09, h * .2);
      g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(w * .5, h * .22, w * .2, 0, TAU); g.fill();
      g.fillStyle = '#3b2a20'; g.beginPath(); g.arc(w * .5, h * .18, w * .21, Math.PI * 1.05, Math.PI * 1.95); g.fill();
      g.fillStyle = '#2a1a14'; g.beginPath(); g.arc(w * .58, h * .23, w * .025, 0, TAU); g.fill();
      g.fillStyle = '#f2d24a'; g.fillRect(w * .32, h * .36, w * .36, h * .06);
    };
    const front = card(.6, 1, girl); front.material.side = T.FrontSide;
    const back = card(.6, 1, (g, w, h) => { girl(g, w, h); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#e9e0cc'; g.fillRect(0, 0, w, h); }); back.material.side = T.FrontSide; back.rotation.y = Math.PI;
    front.position.y = back.position.y = .5; body.add(front, back); sc.add(hero);
    const blur = mk(W / 5, H / 5);
    return { D, T, left, pops, hero, body, blur };
  },
  draw(ctx, t, s) {
    const { D, left, pops, hero, body, blur } = s;
    // 翻开：左半本绕书脊从右边翻到左边
    const op = eInOutCubic(smooth(.2, 1.5, t));
    left.rotation.z = -Math.PI * (1 - op); left.position.y = .18 * (1 - op) + .0;
    for (const p of pops) { p.g.visible = op > .3; const q = eOutBack(clamp((op - .35 - p.delay) / .45), 1.4); p.g.rotation.x = -Math.PI / 2 * (1 - q); }
    // 小人：1.7 秒从书里竖起来，往右走，2.9 秒像纸片一样整圈翻面，3.5 秒起跳到桌上
    const up = eOutBack(smooth(1.5, 1.9, t), 1.6);
    const walk = smooth(1.9, 2.9, t), jump = clamp((t - 3.5) / .8);
    let x = lerp(-1.2, .9, walk), y = .19, z = .55;
    if (jump > 0) { const j = eInOutCubic(jump); x = lerp(.9, 3.9, j); z = lerp(.55, 1.5, j); y = lerp(.19, .0, j) + Math.sin(jump * Math.PI) * 1.4; }
    const land = smooth(4.3, 4.45, t) * (1 - smooth(4.45, 4.7, t));
    hero.position.set(x, y, z); hero.visible = t > 1.45;
    body.rotation.x = -Math.PI / 2 * (1 - up);
    body.scale.set(1 + land * .15, 1 - land * .2, 1);
    const turn = eInOutCubic(smooth(2.9, 3.5, t));
    hero.rotation.y = TAU * turn + (walk > 0 && walk < 1 ? Math.sin(t * 22) * .06 : 0);
    hero.rotation.z = walk > 0 && walk < 1 ? Math.sin(t * 22) * .05 : jump > 0 && jump < 1 ? -.3 * Math.sin(jump * Math.PI) : 0;
    // 镜头：微距低角度，慢慢推近、跟着跳出来的小人偏右
    const k = smooth(3.3, 4.8, t);
    const dist = (LAND ? 9.4 : 12.5) - t * .5, ang = -.35 + t * .06 + k * .25;
    D.camera.position.set(Math.sin(ang) * dist + k * 1.2, (LAND ? 3.6 : 4.6) - t * .12, Math.cos(ang) * dist);
    D.camera.lookAt(lerp(0, 1.8, k), .9 - k * .3, -.2 + k * .5);
    D.render();
    ctx.drawImage(D.canvas, 0, 0, W, H);
    // 浅景深：模糊图按上下两条渐变叠回去，中间清楚
    const b = blur.getContext('2d'); b.filter = 'blur(2.5px)'; b.drawImage(D.canvas, 0, 0, blur.width, blur.height); b.filter = 'none';
    const tmp = s.tmp || (s.tmp = mk(W, H)), g = tmp.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.drawImage(blur, 0, 0, W, H);
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.3, 'rgba(0,0,0,0)'); gr.addColorStop(.72, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, W, H);
    ctx.drawImage(tmp, 0, 0);
    vignette(ctx, .45, .45);
  }
});
