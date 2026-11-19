// C-116 夜间博物馆特展：Three.js 搭一间近乎全黑的暖炭色展厅，三座高低不一的展柱（高度就是数据）上各放一颗缓缓自转的低多边形宝石，柱顶上方吊着写年份的吊牌、旁边立米色展签；全场只有一盏琥珀色聚光灯（SpotLight 带阴影），光柱是一个开口圆锥配竖向渐隐的透明贴图、里面飘着按时间漂移的尘粒；聚光灯按时间表在展品间移动，移动时先暗下、带一点左右“寻找”的晃动再落定，镜头跟着平移；底部讲解字条在 Canvas 2D 上逐字打出。
// 风格提示词：用夜间博物馆特展风格：近乎全黑的暖炭色展厅，每个镜头只有一束从顶上垂下的琥珀色聚光，光柱里浮着细尘，照亮基座上缓缓自转的低多边形宝石，旁边是米色展签和底部逐字打出的讲解字条，数字做成吊牌和高低不一的展柱，光束暗下再“寻找”下一件展品。
// 题材：3D 与实时图形 · 适合：产品回顾、历史沿革、成果展示
const EX = [
  { col: '#E0314B', geo: 'oct', no: '№ 01', cn: '原石', en: 'ROUGH', yr: '2019', h: 1.0, cap: '2019 年，我们只有一个想法。' },
  { col: '#2BBF7A', geo: 'ico', no: '№ 02', cn: '切面', en: 'FACET', yr: '2022', h: 1.45, cap: '2022 年，它有了第一批用户。' },
  { col: '#4F7FF0', geo: 'dod', no: '№ 03', cn: '光芒', en: 'BRILLIANCE', yr: '2025', h: 1.95, cap: '2025 年，它被一百万人看见。' },
];
const XS = [-4.6, 0, 4.6];
const MOVES = [[1.35, 1.95], [3.05, 3.65]]; // 聚光灯移动（sound.py 用同一组数）
function spot(t) {
  // 返回 [位置 x, 亮度, 当前展品]
  let x = XS[0], lum = 1, cur = 0;
  MOVES.forEach(([a, b], i) => {
    if (t >= b) { x = XS[i + 1]; cur = i + 1; }
    else if (t > a) { const u = (t - a) / (b - a); x = lerp(XS[i], XS[i + 1], eInOutCubic(u)) + .7 * Math.sin(u * Math.PI) * Math.sin(u * Math.PI * 3); lum = 1 - .8 * Math.sin(u * Math.PI); cur = -1; }
  });
  return [x, lum * smooth(0, .35, t), cur];
}
scene({
  id: 'C-116', name: '夜间博物馆特展', dur: 5, still: 4.4, libs: ['three'],
  fonts: ["700 40px 'Noto Serif SC'", "80px 'Bebas Neue'", "40px 'Noto Serif SC'"],
  init() {
    const D = three3d({ shadows: true, exposure: 1.1, fov: LAND ? 34 : 52 });
    const T = D.THREE, sc = D.scene;
    sc.background = new T.Color('#0E0B09'); sc.fog = new T.Fog('#0E0B09', 12, 30);
    sc.environment = studioEnv(D, { top: '#2A1E14', mid: '#120D09', floor: '#0B0806', bottom: '#050403', bars: [[.3, .05, .9, '#FFC88A'], [.75, .04, .5, '#FFE0B8']] });
    sc.add(new T.AmbientLight('#3A2A1E', .35));
    const sp = new T.SpotLight('#FFB45A', 160, 20, .3, .45, 1.6); sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); sp.shadow.bias = -.0005;
    sc.add(sp, sp.target);
    const floor = new T.Mesh(new T.PlaneGeometry(60, 30), new T.MeshStandardMaterial({ color: '#2A211B', roughness: .55 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
    const wall = new T.Mesh(new T.PlaneGeometry(60, 20), new T.MeshStandardMaterial({ color: '#241C17', roughness: .9 })); wall.position.set(0, 8, -4); wall.receiveShadow = true; sc.add(wall);
    const txt = (w, h, fn) => { const c = mk(w, h), g = c.getContext('2d'); fn(g, w, h); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 8; return tx; };
    const gems = [];
    EX.forEach((e, i) => {
      const x = XS[i];
      const ped = new T.Mesh(new T.BoxGeometry(1.3, e.h, 1.3), new T.MeshStandardMaterial({ color: '#D9CDB8', roughness: .6 })); ped.position.set(x, e.h / 2, 0); ped.castShadow = ped.receiveShadow = true; sc.add(ped);
      const cap = new T.Mesh(new T.BoxGeometry(1.45, .08, 1.45), new T.MeshStandardMaterial({ color: '#B8A88E', roughness: .4, metalness: .3 })); cap.position.set(x, e.h + .04, 0); sc.add(cap);
      const geo = e.geo === 'oct' ? new T.OctahedronGeometry(.48, 0) : e.geo === 'ico' ? new T.IcosahedronGeometry(.46, 0) : new T.DodecahedronGeometry(.46, 0);
      const gem = new T.Mesh(geo, new T.MeshPhysicalMaterial({ color: e.col, roughness: .08, metalness: .05, clearcoat: 1, flatShading: true, envMapIntensity: 2.2, emissive: e.col, emissiveIntensity: .08 }));
      if (e.geo === 'oct') gem.scale.set(.85, 1.25, .85);
      gem.position.set(x, e.h + .65, 0); gem.castShadow = true; sc.add(gem); gems.push(gem);
      // 吊牌
      const tagT = txt(512, 256, (g, w, h) => { g.fillStyle = '#E8DCC4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8A7558'; g.lineWidth = 8; g.strokeRect(12, 12, w - 24, h - 24); g.fillStyle = '#2A1E14'; g.font = "150px 'Bebas Neue'"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e.yr, w / 2, h / 2 + 10); });
      const tag = new T.Group(); tag.position.set(x, 4.6, .1); sc.add(tag);
      const card = new T.Mesh(new T.PlaneGeometry(1.1, .55), new T.MeshStandardMaterial({ map: tagT, roughness: .8 })); card.position.y = -.6; card.castShadow = true; tag.add(card);
      const str = new T.Mesh(new T.CylinderGeometry(.006, .006, 4, 4), new T.MeshBasicMaterial({ color: '#5A4A3A' })); str.position.y = 1.7; tag.add(str);
      // 展签
      const labT = txt(512, 340, (g, w, h) => { g.fillStyle = '#E3D6BC'; g.fillRect(0, 0, w, h); g.fillStyle = '#6A5640'; g.font = "40px 'Bebas Neue'"; g.fillText(e.no, 36, 66); g.fillStyle = '#2A1E14'; g.font = "700 84px 'Noto Serif SC'"; g.fillText(e.cn, 36, 170); g.fillStyle = '#6A5640'; g.font = "44px 'Bebas Neue'"; g.fillText(e.en + ' · ' + e.yr, 36, 236); g.fillRect(36, 270, 120, 4); });
      const lab = new T.Mesh(new T.PlaneGeometry(.8, .53), new T.MeshStandardMaterial({ map: labT, roughness: .85 })); lab.position.set(x + 1.15, .95, .55); lab.rotation.set(-.5, -.25, 0); sc.add(lab);
      const post = new T.Mesh(new T.CylinderGeometry(.03, .03, .85, 8), new T.MeshStandardMaterial({ color: '#3A3028', metalness: .6, roughness: .4 })); post.position.set(x + 1.15, .43, .45); sc.add(post);
      gems[i].userData = { tag };
    });
    // 光柱
    const amap = txt(64, 256, (g, w, h) => { const gd = g.createLinearGradient(0, 0, 0, h); gd.addColorStop(0, '#000'); gd.addColorStop(.15, '#666'); gd.addColorStop(.7, '#bbb'); gd.addColorStop(1, '#222'); g.fillStyle = gd; g.fillRect(0, 0, w, h); });
    amap.colorSpace = T.NoColorSpace;
    const H0 = 9, cone = new T.Mesh(new T.ConeGeometry(Math.tan(.3) * H0 * 1.02, H0, 48, 1, true), new T.MeshBasicMaterial({ color: '#FFB45A', alphaMap: amap, transparent: true, opacity: .16, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    sc.add(cone);
    const N = 500, dp = new Float32Array(N * 3), dust = new T.Points(new T.BufferGeometry(), new T.PointsMaterial({ color: '#FFD9A0', size: .035, transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false }));
    dust.geometry.setAttribute('position', new T.BufferAttribute(dp, 3)); sc.add(dust);
    return { D, T, sp, cone, dust, dp, N, H0, gems };
  },
  draw(ctx, t, s) {
    const { D, sp, cone, dp, N, H0 } = s, cam = D.camera;
    const [x, lum, cur] = spot(t);
    sp.position.set(x, H0, .3); sp.target.position.set(x, 0, 0); sp.intensity = 160 * lum;
    cone.position.set(x, H0 / 2, .3); cone.material.opacity = .16 * lum;
    // 尘粒：只在光柱里
    for (let i = 0; i < N; i++) {
      const h = 1 - ((hash1(i * 3.1) + t * (.02 + hash1(i * 7.7) * .05)) % 1), y = h * H0;
      const r = Math.tan(.3) * (H0 - y) * Math.sqrt(hash1(i * 1.7)) * .95, a = hash1(i * 5.3) * TAU + t * .2 * (hash1(i) - .5);
      dp[i * 3] = x + Math.cos(a) * r + .05 * Math.sin(t * 1.3 + i); dp[i * 3 + 1] = y; dp[i * 3 + 2] = .3 + Math.sin(a) * r;
    }
    s.dust.geometry.attributes.position.needsUpdate = true; s.dust.material.opacity = .9 * lum;
    s.gems.forEach((g, i) => { g.rotation.y = t * .6 + i; g.rotation.x = .15 * Math.sin(t * .8 + i); g.userData.tag.rotation.z = .04 * Math.sin(t * 1.6 + i * 2); });
    const camX = x * .92;
    if (LAND) { cam.position.set(camX + .6, 2.6, 10.2); cam.lookAt(camX + .25, 2.35, 0); }
    else { cam.position.set(camX + .3, 2.8, 9.5); cam.lookAt(camX + .2, 2.4, 0); }
    D.render(); ctx.drawImage(D.canvas, 0, 0, W, H);
    vignette(ctx, .55);
    // 底部讲解字条
    const u = SHORT / 1080, idx = cur >= 0 ? cur : -1;
    if (idx >= 0) {
      const t0 = idx === 0 ? .4 : MOVES[idx - 1][1] + .05, text = EX[idx].cap, n = Math.floor(clamp((t - t0) / .9, 0, 1) * text.length);
      const fs = Math.round((LAND ? 40 : 48) * u), by = LAND ? H - 110 * u : H - 300 * u;
      ctx.font = `${fs}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const shown = text.slice(0, n), tw = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(10,8,6,.6)'; rr(ctx, W / 2 - tw / 2 - 40 * u, by - fs, tw + 80 * u, fs * 2, 6 * u); ctx.fill();
      ctx.fillStyle = '#E9DCC4'; ctx.textAlign = 'left'; ctx.fillText(shown, W / 2 - tw / 2, by);
      if (Math.floor(t * 4) % 2 === 0 || n < text.length) { const cw = ctx.measureText(shown).width; ctx.fillStyle = '#FFB45A'; ctx.fillRect(W / 2 - tw / 2 + cw + 6 * u, by - fs * .55, 3 * u, fs * 1.1); }
      ctx.textAlign = 'left';
    }
    // 角标
    ctx.fillStyle = 'rgba(233,220,196,.55)'; ctx.font = `${Math.round(30 * u)}px 'Bebas Neue'`; ctx.textBaseline = 'top';
    ctx.fillText(`NIGHT GALLERY · 特展 ${Math.round((x - XS[0]) / (XS[1] - XS[0])) + 1} / 3`, 60 * u, 56 * u);
  }
});
