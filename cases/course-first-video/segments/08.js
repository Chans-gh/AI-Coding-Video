// 第 8 段 小结：左边一个三维地球（three.js 代码建的球，贴 NASA SVS 的等距投影地球图），慢慢自转，C、T、G 三个小球绕着它转，
// 跟着「一、二、三」逐个出来；右边三条要点卡逐张弹出，每张配一个语言模型写的 SVG 图标（icons.svg 后 3 个），标出处。
// 说到「最常见的错」，地球退场，三张卡收成一排，下面是「最常见的错」和「课后练习」两张卡。
scene({
  id: 'course-first-video:8', name: '小结',
  needs: ['common.js'], libs: ['three'],
  fonts: ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() {
    await L.init();
    const [im, I] = await Promise.all([loadImage('earth.jpg'), L.icons()]);
    const D = three3d({ w: 760, h: 760, alpha: true, fov: 30 }), T = D.THREE;
    const tex = new T.Texture(im); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4; tex.needsUpdate = true;
    const earth = new T.Mesh(new T.SphereGeometry(1, 96, 64), new T.MeshStandardMaterial({ map: tex, roughness: .85 }));
    earth.rotation.z = .41; D.scene.add(earth);
    D.scene.add(new T.AmbientLight(0xffffff, .55));
    const sun = new T.DirectionalLight(0xffffff, 2.4); sun.position.set(-3, 2, 4); D.scene.add(sun);
    const ring = new T.Mesh(new T.TorusGeometry(1.45, .006, 8, 160), new T.MeshBasicMaterial({ color: 0x9aa4b8 })); ring.rotation.x = 1.2; D.scene.add(ring);
    const balls = ['#2F6FED', '#0E9F6E', '#E8590C'].map(c => { const m = new T.Mesh(new T.SphereGeometry(.09, 32, 16), new T.MeshStandardMaterial({ color: c, roughness: .4 })); D.scene.add(m); return m; });
    D.camera.position.set(0, .9, 6.4); D.camera.lookAt(0, 0, 0);
    return { D, earth, ring, balls, I };
  },
  draw(ctx, t, s) {
    const { u, K, F } = L;
    L.bg(ctx);
    L.title(ctx, '三条要点', 80 * u, 170 * u, 64, { alpha: L.fadeIn(t - .2) });
    const pts = [
      ['分清三类画面', '代码画的 C · 真实素材 T · AI 生成 G', 'SKILL.md「三类」', '一，'],
      ['先跑通样片，一次只改一处', '拷现成样片 → 原样跑通 → 换内容', 'making.md「改的顺序」', '二，'],
      ['细调最多三轮，先出完整的片子', '不停在半成品，还想改的列出来', 'making.md「改的顺序」第 4 条', '三，'],
    ];
    const tErr = L.cue('最常见的错'), tHw = L.cue('课后练习'), shrink = eInOutCubic(inv(tErr - .5, tErr + .2, t));
    // 三维地球：自转，三个小球按要点出来后绕轨道转
    const gone = shrink;
    if (gone < 1) {
      s.earth.rotation.y = -1.2 + t * .22;
      s.balls.forEach((b, i) => {
        const p = t - L.cue(pts[i][3]), k = p < 0 ? 0 : eOutBack(clamp(p / .5)), a = t * .6 + i * TAU / 3;
        const v = new s.D.THREE.Vector3(Math.cos(a) * 1.45, 0, Math.sin(a) * 1.45).applyEuler(s.ring.rotation);
        b.position.copy(v); b.scale.setScalar(Math.max(.001, k));
      });
      s.D.render();
      const gs = 760 * u, gx = lerp(40 * u, -300 * u, gone), gy = 210 * u;
      ctx.save(); ctx.globalAlpha = (1 - gone) * L.fadeIn(t - .1, .6); ctx.drawImage(s.D.canvas, gx, gy, gs, gs);
      L.chip(ctx, 'T', gx + 70 * u, gy + gs - 20 * u, { label: '三维：代码建的球 + NASA 地球贴图', s: .85 }); ctx.restore();
    }
    pts.forEach(([a, b, src, kw], i) => {
      const p = t - L.cue(kw); if (p < 0) return;
      const w = lerp(1040, 560, shrink) * u, h = lerp(170, 300, shrink) * u;
      const x = lerp(800 * u, 80 * u + i * 600 * u, shrink), y = lerp(230 * u + i * 200 * u, 230 * u, shrink), e = L.pop(p);
      ctx.save(); ctx.globalAlpha = clamp(p / .25); ctx.translate(x, y + (1 - e) * 30 * u);
      L.card(ctx, 0, 0, w, h, { edge: [K.C, K.T, K.G][i] });
      const q = eOutCubic(clamp((p - .1) / .6)); ctx.save(); ctx.beginPath(); ctx.rect(20 * u, 0, 90 * u * q, 140 * u); ctx.clip(); ctx.drawImage(s.I[3 + i], 20 * u, 26 * u, 90 * u, 90 * u); ctx.restore();
      ctx.textBaseline = 'middle';
      ctx.fillStyle = K.ink; ctx.font = F(900, shrink > .5 ? 34 : 40);
      const lines = shrink > .5 ? wrapCJK(ctx, a, w - 150 * u) : [a];
      lines.forEach((l, j) => ctx.fillText(l, 120 * u, 62 * u + j * 46 * u));
      ctx.fillStyle = K.soft; ctx.font = F(400, 26);
      const by = shrink > .5 ? 80 * u + lines.length * 46 * u : 118 * u;
      (shrink > .5 ? wrapCJK(ctx, b, w - 150 * u) : [b]).forEach((l, j) => ctx.fillText(l, 120 * u, by + j * 36 * u));
      ctx.font = F(400, 22, L.MONO); ctx.fillStyle = K.gray; ctx.textAlign = 'right'; ctx.fillText('出处：' + src, w - 30 * u, h - 30 * u); ctx.textAlign = 'left';
      ctx.restore();
    });
    // 最常见的错
    if (t > tErr) {
      const e = L.pop(t - tErr);
      ctx.save(); ctx.globalAlpha = clamp((t - tErr) / .25); ctx.translate(80 * u, 580 * u + (1 - e) * 30 * u);
      L.card(ctx, 0, 0, 860 * u, 330 * u, { fill: '#FFF4E5', edge: K.G });
      ctx.fillStyle = K.G; ctx.font = F(900, 40); ctx.textBaseline = 'middle'; ctx.fillText('最常见的错', 50 * u, 60 * u);
      ctx.fillStyle = K.ink; ctx.font = F(700, 32); ctx.fillText('✗  第一次装依赖时没联网', 50 * u, 140 * u);
      ctx.fillStyle = K.soft; ctx.font = F(400, 28); ctx.fillText('npm install 要下载 317 个包', 100 * u, 188 * u);
      ctx.fillStyle = K.ink; ctx.font = F(700, 32); ctx.fillText('○  15 秒片子报「时长不在 3–5 秒」', 50 * u, 256 * u);
      ctx.fillStyle = K.soft; ctx.font = F(400, 28); ctx.fillText('样片的时长规矩，可以不管', 100 * u, 300 * u);
      ctx.restore();
    }
    // 课后练习
    if (t > tHw) {
      const e = L.pop(t - tHw);
      ctx.save(); ctx.globalAlpha = clamp((t - tHw) / .25); ctx.translate(980 * u, 580 * u + (1 - e) * 30 * u);
      L.card(ctx, 0, 0, 860 * u, 330 * u, { edge: K.C });
      ctx.fillStyle = K.C; ctx.font = F(900, 40); ctx.textBaseline = 'middle'; ctx.fillText('课后练习', 50 * u, 60 * u);
      ctx.fillStyle = K.ink; ctx.font = F(700, 32);
      ctx.fillText('把水循环短片', 50 * u, 140 * u);
      ctx.fillText('· 换一种风格，或', 80 * u, 200 * u);
      ctx.fillText('· 换一个主题', 80 * u, 256 * u);
      ctx.fillStyle = K.soft; ctx.font = F(400, 28); ctx.fillText('再出一次', 50 * u, 304 * u);
      ctx.restore();
    }
    L.frame(ctx, t);
    L.sub(ctx, t);
  }
});
