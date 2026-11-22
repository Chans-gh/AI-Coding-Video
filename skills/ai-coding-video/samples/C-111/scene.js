// C-111 桌面穿梭：Three.js 搭一张木桌，铺一块 Canvas 画的点阵纸垫；几个应用界面（日历、聊天、音乐、地图、待办）先在 Canvas 上画好，贴在有厚度的纸卡顶面当小场地；像素小人由一块块小方块拼成（头、身子、四肢各是一个关节组），抱着一个信封，按关键帧（lib 的 keyAt）在卡片之间一拍一跳，落地时压扁回弹，四肢按跳跃的阶段摆动；笔、便签、马克杯都由几何体拼成，低角度的平行光开软阴影拖出长影；镜头一镜到底贴着小人追，换卡时甩一下，最后拉高看全桌。
// 风格提示词：用桌面穿梭风格：阳光斜照的木桌上铺着点阵纸垫，各个应用界面是印在厚纸卡上的小场地，像素小人被挤成一格一格的体素玩具，在卡片间跳跃搬运，笔、便签、杯子投下长长软影，镜头不剪一刀地追随、甩镜，最后拉远看全桌，每个动作都踩在马林巴节拍上。
// 题材：3D 与实时图形 · 适合：软件功能导览、工作流演示、产品发布
const HOP = .5;   // 一拍 0.5 秒，每拍跳一次
scene({
  id: 'C-111', name: '桌面穿梭', dur: 5, still: 2.2, libs: ['three'],
  fonts: ["700 40px 'Noto Sans SC'", "700 30px 'JetBrains Mono'"],
  init() {
    const D = three3d({ fov: LAND ? 34 : 50, shadows: true, exposure: 1.05 });
    const T = D.THREE, sc = D.scene;
    sc.background = new T.Color('#e9dcc6');
    studioEnv(D, { top: '#fff4e0', mid: '#e0c8a8', floor: '#8a6a4a', bottom: '#4a3420' });
    sc.environmentIntensity = .35;
    const sun = new T.DirectionalLight('#fff0d0', 4.2); sun.position.set(-10, 3.4, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: .5, far: 30 }); sun.shadow.radius = 7; sun.shadow.bias = -.0005;
    sc.add(sun, new T.HemisphereLight('#fff6e8', '#8a6a4a', .35));
    const tex = c => { const x = new T.CanvasTexture(c); x.colorSpace = T.SRGBColorSpace; x.anisotropy = 8; return x; };
    const std = (o) => new T.MeshStandardMaterial({ roughness: .7, ...o });
    const cast = m => { m.castShadow = m.receiveShadow = true; return m; };
    // 木桌
    const wc = mk(1024, 512), wg = wc.getContext('2d'), wim = wg.createImageData(1024, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 1024; x++) { const r = Math.sin((y / 512 * 22 + fbm(x / 260, y / 26, 4) * 5) * Math.PI) * .5 + .5, v = .7 + .2 * r, k = (y * 1024 + x) * 4; wim.data[k] = 196 * v; wim.data[k + 1] = 140 * v; wim.data[k + 2] = 92 * v; wim.data[k + 3] = 255; }
    wg.putImageData(wim, 0, 0);
    const desk = cast(new T.Mesh(new T.PlaneGeometry(40, 24).rotateX(-Math.PI / 2), std({ map: tex(wc), roughness: .5 }))); sc.add(desk);
    // 点阵纸垫
    const pc = mk(1200, 800), pg = pc.getContext('2d'); pg.fillStyle = '#f6f1e6'; pg.fillRect(0, 0, 1200, 800);
    pg.fillStyle = '#c9bfae'; for (let y = 20; y < 800; y += 24) for (let x = 20; x < 1200; x += 24) { pg.beginPath(); pg.arc(x, y, 2.2, 0, TAU); pg.fill(); }
    const mat = cast(new T.Mesh(new T.BoxGeometry(15, .03, 10), [std({ color: '#e8e0d0' }), std({ color: '#e8e0d0' }), std({ map: tex(pc), roughness: .9 }), std({}), std({ color: '#e8e0d0' }), std({ color: '#e8e0d0' })])); mat.position.y = .015; sc.add(mat);
    // 应用卡片
    const ui = (kind) => {
      const c = mk(600, 600), g = c.getContext('2d');
      g.fillStyle = '#fffdf8'; g.fillRect(0, 0, 600, 600);
      const bar = { cal: '#e8584a', chat: '#3a8ae8', music: '#9a4ae8', map: '#2aa070', todo: '#f0a020' }[kind];
      g.fillStyle = bar; g.fillRect(0, 0, 600, 90); g.fillStyle = '#fff'; g.font = "700 44px 'Noto Sans SC'"; g.textBaseline = 'middle';
      g.fillText({ cal: '日历', chat: '消息', music: '音乐', map: '地图', todo: '待办' }[kind], 36, 47);
      g.font = "700 30px 'JetBrains Mono'";
      if (kind === 'cal') { for (let i = 0; i < 28; i++) { const x = 40 + (i % 7) * 76, y = 130 + Math.floor(i / 7) * 110; g.fillStyle = i === 17 ? '#e8584a' : '#f1ebe0'; rr(g, x, y, 64, 92, 10); g.fill(); g.fillStyle = i === 17 ? '#fff' : '#6a5a4a'; g.fillText(String(i + 1), x + 12, y + 30); } }
      if (kind === 'chat') { [[40, 140, 360, '#eef0f4'], [200, 250, 360, '#3a8ae8'], [40, 360, 300, '#eef0f4'], [240, 470, 320, '#3a8ae8']].forEach(([x, y, w, c2]) => { g.fillStyle = c2; rr(g, x, y, w, 80, 30); g.fill(); g.fillStyle = c2 === '#3a8ae8' ? 'rgba(255,255,255,.8)' : '#b8bcc6'; g.fillRect(x + 30, y + 30, w - 120, 12); g.fillRect(x + 30, y + 50, w - 180, 10); }); }
      if (kind === 'music') { g.fillStyle = '#efe6fb'; rr(g, 150, 130, 300, 300, 24); g.fill(); g.fillStyle = '#9a4ae8'; g.beginPath(); g.arc(300, 280, 90, 0, TAU); g.fill(); g.fillStyle = '#efe6fb'; g.beginPath(); g.arc(300, 280, 22, 0, TAU); g.fill(); g.fillStyle = '#d8ccea'; g.fillRect(80, 480, 440, 10); g.fillStyle = '#9a4ae8'; g.fillRect(80, 480, 260, 10); g.beginPath(); g.moveTo(270, 520); g.lineTo(270, 580); g.lineTo(320, 550); g.fill(); }
      if (kind === 'map') { g.fillStyle = '#e4f0dc'; g.fillRect(0, 90, 600, 510); g.strokeStyle = '#fff'; g.lineWidth = 26; g.beginPath(); g.moveTo(0, 400); g.bezierCurveTo(200, 300, 300, 500, 600, 260); g.moveTo(220, 90); g.lineTo(300, 600); g.stroke(); g.fillStyle = '#9ad0f0'; g.beginPath(); g.ellipse(470, 470, 90, 60, 0, 0, TAU); g.fill(); g.fillStyle = '#2aa070'; g.beginPath(); g.arc(330, 230, 30, Math.PI, 0); g.lineTo(330, 300); g.fill(); }
      if (kind === 'todo') { for (let i = 0; i < 4; i++) { const y = 140 + i * 110; g.strokeStyle = '#f0a020'; g.lineWidth = 6; g.strokeRect(50, y, 50, 50); if (i < 2) { g.beginPath(); g.moveTo(60, y + 25); g.lineTo(72, y + 40); g.lineTo(92, y + 10); g.stroke(); } g.fillStyle = i < 2 ? '#d0c8b8' : '#6a5a4a'; g.fillRect(130, y + 18, 300 - i * 30, 14); } }
      return tex(c);
    };
    const cards = {};
    const card = (kind, x, z, rot) => {
      const side = std({ color: '#efe6d4' }), m = cast(new T.Mesh(new T.BoxGeometry(2.4, .14, 2.4), [side, side, std({ map: ui(kind), roughness: .85 }), side, side, side]));
      m.position.set(x, .1, z); m.rotation.y = rot; sc.add(m); cards[kind] = m; return m;
    };
    card('cal', -5, 1.2, .08); card('chat', -1.8, -1.6, -.1); card('music', 1.4, 1.4, .12); card('map', 4.6, -1.2, -.06); card('todo', 5.2, 2.6, .2);
    // 道具：笔、便签、马克杯
    const pen = new T.Group(); pen.add(cast(new T.Mesh(new T.CylinderGeometry(.09, .09, 4, 12), std({ color: '#2a4a8a', roughness: .3 })))); const tip = cast(new T.Mesh(new T.ConeGeometry(.09, .4, 12), std({ color: '#d8c8a0' }))); tip.position.y = 2.2; pen.add(tip);
    pen.rotation.set(Math.PI / 2, 0, .9); pen.position.set(-3.6, .12, -3.4); sc.add(pen);
    const note = cast(new T.Mesh(new T.BoxGeometry(1.6, .02, 1.6), std({ color: '#ffe46a', roughness: .9 }))); note.position.set(-6.2, .05, -2.6); note.rotation.y = -.3; sc.add(note);
    const cup = new T.Group(); const body = cast(new T.Mesh(new T.CylinderGeometry(.75, .65, 1.6, 32, 1, true), std({ color: '#e86a4a', side: T.DoubleSide, roughness: .4 }))); body.position.y = .8; cup.add(body);
    const handle = cast(new T.Mesh(new T.TorusGeometry(.38, .09, 10, 24), std({ color: '#e86a4a', roughness: .4 }))); handle.position.set(.85, .85, 0); cup.add(handle);
    const coffee = new T.Mesh(new T.CircleGeometry(.68, 32).rotateX(-Math.PI / 2), std({ color: '#4a2a18', roughness: .2 })); coffee.position.y = 1.4; cup.add(coffee);
    cup.position.set(2.2, 0, -3.6); sc.add(cup);
    // 体素小人
    const vox = (w, h, d, c) => cast(new T.Mesh(new T.BoxGeometry(w, h, d), std({ color: c, roughness: .6 })));
    const man = new T.Group(), J = {};
    J.body = new T.Group(); man.add(J.body);
    const torso = vox(.32, .36, .2, '#3a7ae8'); torso.position.y = .5; J.body.add(torso);
    const head = vox(.3, .3, .3, '#f2c9a0'); head.position.y = .86; J.body.add(head);
    const hair = vox(.32, .1, .32, '#3a2a20'); hair.position.y = 1.03; J.body.add(hair);
    for (const [k, x, y, c, h] of [['lA', -.22, .66, '#f2c9a0', .3], ['rA', .22, .66, '#f2c9a0', .3], ['lL', -.09, .32, '#2a2a3a', .32], ['rL', .09, .32, '#2a2a3a', .32]]) {
      const g = new T.Group(); g.position.set(x, y, 0); const m = vox(.12, h, .12, c); m.position.y = -h / 2; g.add(m); J.body.add(g); J[k] = g;
    }
    const env = vox(.36, .24, .05, '#fff8ea'); env.position.set(0, .55, .16); J.body.add(env);
    const seal = vox(.08, .08, .02, '#e8584a'); seal.position.set(0, .55, .19); J.body.add(seal);
    sc.add(man);
    // 路线：每拍一跳，从日历出发
    const top = k => { const m = cards[k]; return [m.position.x, .17, m.position.z]; };
    const way = [top('cal'), [-3.6, .17, .2], top('chat'), [-.2, .05, -.1], top('music'), [3, .05, .2], top('map'), [4.9, .17, .7], top('todo')];
    return { D, T, man, J, way, cards };
  },
  draw(ctx, t, s) {
    const { D, T, man, J, way } = s;
    // 跳跃：第 i 拍从 way[i] 跳到 way[i+1]，前 0.15 拍蹲、后段落地压扁
    const n = way.length - 1, b = clamp(t / HOP, 0, n - .001), i = Math.floor(b), q = b - i;
    const a = way[i], c = way[Math.min(n, i + 1)];
    const air = clamp((q - .12) / .7), e = eInOutCubic(air);
    const x = lerp(a[0], c[0], e), z = lerp(a[2], c[2], e), y = lerp(a[1], c[1], e) + Math.sin(air * Math.PI) * .9;
    const squash = q < .12 ? smooth(0, .12, q) : q > .82 ? 1 - smooth(.82, 1, q) : 0;
    man.position.set(x, y, z); man.rotation.y = Math.atan2(c[0] - a[0], c[2] - a[2]);
    J.body.scale.set(1 + squash * .2, 1 - squash * .25, 1 + squash * .2);
    const sw = air > 0 && air < 1 ? Math.sin(air * Math.PI) : 0;
    J.lA.rotation.x = -2.2 * sw - .4; J.rA.rotation.x = -2.2 * sw - .4; J.lA.rotation.z = -.5 * sw; J.rA.rotation.z = .5 * sw;
    J.lL.rotation.x = -.9 * sw; J.rL.rotation.x = .5 * sw;
    // 镜头：贴着小人追，每次落地后甩一下，最后 0.9 秒拉高看全桌
    const pull = eInOutCubic(smooth(4.1, 5, t));
    const whip = Math.sin(b * Math.PI) * .25;
    const fx = x + whip, fz = z;
    const near = [fx - 1.6, 2.6 + y * .4, fz + (LAND ? 5.6 : 7.2)], far = [0, LAND ? 13 : 17, LAND ? 10 : 14];
    D.camera.position.set(lerp(near[0], far[0], pull), lerp(near[1], far[1], pull), lerp(near[2], far[2], pull));
    D.camera.lookAt(lerp(fx + .5, 0, pull), lerp(.5 + y * .6, 0, pull), lerp(fz - .3, 0, pull));
    D.render(); ctx.drawImage(D.canvas, 0, 0, W, H);
    vignette(ctx, .25, .5, '60,40,20');
  }
});
