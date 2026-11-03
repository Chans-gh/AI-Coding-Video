// C-085 地图路线动画：D3.js 的地理投影（墨卡托）和 geoPath 每帧重算 SVG 路径，镜头中心和缩放跟着线头走；航线用 d3.geoInterpolate 沿大圆取点（再往北鼓起成弧）、按进度画出，里程用 d3.geoDistance 算。海岸线是噪声生成的虚构大陆和岛，城市名也是虚构的。
// 风格提示词：用地图路线动画风格：米白色简洁底图、淡蓝水域和浅灰行政边界，路线用一条橙红色大圆弧线从起点实时画到终点，镜头跟着线头移动并逐渐缩放，角落有里程计数器和经纬度小卡片，城市名用小号无衬线字标注。
// 题材：信息讲解与产品发布 · 适合：物流、出行、旅行、路演里的地理叙事
scene({
  id: 'C-085', name: '地图路线动画', dur: 5, still: 3.9, libs: ['d3'], dom: true,
  text: '青澜白石港云渡里程公里北纬东经第一站终点虚构地图',
  fonts: ["700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 40px 'JetBrains Mono'"],
  init() {
    const u = SHORT / 1080;
    const SEA = '#CFE3EE', LAND_C = '#F3EEE2', LINE = '#E8552D', INK = '#2B2F36';
    STAGE.style.background = SEA;
    // ---- 虚构地理：噪声做海岸线（经纬度），保证外环是顺时针（d3 的约定） ----
    const blob = (lon, lat, r, seed, n = 160) => {
      const ring = [];
      for (let k = 0; k <= n; k++) {
        const a = (k % n) / n * TAU, rr = r * (.62 + .55 * fbm(Math.cos(a) * 1.6 + seed, Math.sin(a) * 1.6 + seed, 5));
        ring.push([lon + Math.cos(a) * rr * 1.25, lat + Math.sin(a) * rr]);
      }
      const f = { type: 'Polygon', coordinates: [ring] };
      if (d3.geoArea(f) > TAU) ring.reverse();
      return f;
    };
    const lands = { type: 'GeometryCollection', geometries: [blob(116, 36, 9, 3), blob(133.5, 35.5, 3.6, 11), blob(128, 27.5, 1.6, 21), blob(123, 44, 3, 5)] };
    // 行政边界：几条抖动的经纬线，用陆地做裁剪
    const borders = [];
    for (const [a, b] of [[[109, 31], [121, 41]], [[112, 44], [118, 28]], [[104, 37], [126, 36]], [[131, 38], [136, 33]]]) {
      const line = d3.range(0, 1.0001, .05).map(k => { const p = d3.geoInterpolate(a, b)(k); return [p[0] + (vnoise(k * 6, a[0]) - .5) * 1.2, p[1] + (vnoise(k * 6 + 9, a[1]) - .5) * 1.2]; });
      borders.push({ type: 'LineString', coordinates: line });
    }
    const CITIES = [{ n: '青澜', p: [111.5, 37.6] }, { n: '白石港', p: [122.4, 32.2] }, { n: '云渡', p: [134.0, 36.3] }];
    // 每段：大圆插值，再往北鼓起一点，像航线弧
    const arc = (a, b, h) => { const f = d3.geoInterpolate(a, b); return k => { const q = f(k); return [q[0], q[1] + Math.sin(k * Math.PI) * h]; }; };
    const legs = [arc(CITIES[0].p, CITIES[1].p, 2.2), arc(CITIES[1].p, CITIES[2].p, 2.8)];
    const legLen = [d3.geoDistance(CITIES[0].p, CITIES[1].p), d3.geoDistance(CITIES[1].p, CITIES[2].p)].map(r => r * 6371);
    const total = legLen[0] + legLen[1];

    const svg = d3.select(svgRoot());
    const defs = svg.append('defs');
    const clip = defs.append('clipPath').attr('id', 'landclip').append('path');
    const grat = svg.append('path').attr('fill', 'none').attr('stroke', '#ffffff').attr('stroke-opacity', .6).attr('stroke-width', 1.2 * u);
    const shore = svg.append('path').attr('fill', 'none').attr('stroke', '#A9CADB').attr('stroke-width', 10 * u).attr('stroke-linejoin', 'round');
    const land = svg.append('path').attr('fill', LAND_C).attr('stroke', '#C9C1AE').attr('stroke-width', 1.5 * u);
    const bord = svg.append('g').attr('clip-path', 'url(#landclip)').selectAll('path').data(borders).join('path')
      .attr('fill', 'none').attr('stroke', '#B7B4AC').attr('stroke-width', 2 * u).attr('stroke-dasharray', `${10 * u} ${6 * u}`);
    const ghost = svg.append('path').attr('fill', 'none').attr('stroke', LINE).attr('stroke-opacity', .45).attr('stroke-width', 4 * u).attr('stroke-dasharray', `${4 * u} ${10 * u}`);
    const route = svg.append('path').attr('fill', 'none').attr('stroke', LINE).attr('stroke-width', 8 * u).attr('stroke-linecap', 'round');
    const cityG = svg.append('g').selectAll('g').data(CITIES).join('g');
    cityG.append('circle').attr('r', 11 * u).attr('fill', '#fff').attr('stroke', INK).attr('stroke-width', 4 * u);
    cityG.append('text').text(d => d.n).attr('x', 20 * u).attr('y', -16 * u).attr('font-family', 'Noto Sans SC').attr('font-weight', 700)
      .attr('font-size', 34 * u).attr('fill', INK).attr('paint-order', 'stroke').attr('stroke', LAND_C).attr('stroke-width', 8 * u);
    const pulse = svg.append('circle').attr('fill', 'none').attr('stroke', LINE).attr('stroke-width', 4 * u);
    const head = svg.append('circle').attr('r', 14 * u).attr('fill', LINE).attr('stroke', '#fff').attr('stroke-width', 5 * u);

    // ---- 角落：里程计数器、经纬度卡片、标注 ----
    const card = (x, y) => el('div', { style: { position: 'absolute', left: `${x}px`, top: `${y}px`, background: 'rgba(255,255,255,.92)', borderRadius: `${14 * u}px`, padding: `${18 * u}px ${26 * u}px`, boxShadow: `0 ${6 * u}px ${24 * u}px rgba(30,60,80,.15)`, color: INK, fontFamily: "'Noto Sans SC'" } });
    const odo = card(LAND ? 60 * u : 60 * u, LAND ? H - 220 * u : H - 300 * u);
    el('div', { style: { font: `400 ${26 * u}px 'Noto Sans SC'`, opacity: .6 } }, odo, '里程');
    const odoN = el('div', { style: { font: `700 ${64 * u}px 'JetBrains Mono'`, color: LINE, lineHeight: 1.1 } }, odo, '0');
    el('span', { style: { font: `400 ${28 * u}px 'Noto Sans SC'`, marginLeft: `${8 * u}px`, color: INK } }, odoN.parentNode, '公里');
    const geo = card(LAND ? W - 380 * u : W - 400 * u, LAND ? 60 * u : 90 * u);
    const lat = el('div', { style: { font: `700 ${30 * u}px 'JetBrains Mono'` } }, geo, '');
    const lon = el('div', { style: { font: `700 ${30 * u}px 'JetBrains Mono'` } }, geo, '');
    const note = el('div', { style: { position: 'absolute', left: `${60 * u}px`, top: `${LAND ? 60 : 90}px`, font: `400 ${24 * u}px 'Noto Sans SC'`, color: INK, opacity: .55 } }, STAGE, '虚构地图 · 示意');

    // 路线进度：两段，中途在白石港停一下
    const prog = t => {
      const a = eInOutCubic(inv(.5, 2.3, t)), b = eInOutCubic(inv(2.6, 4.2, t));
      return { leg: t < 2.45 ? 0 : 1, k: t < 2.45 ? a : b, km: legLen[0] * a + legLen[1] * b };
    };
    const routeAll = { type: 'LineString', coordinates: [...d3.range(0, 1.0001, .02).map(legs[0]), ...d3.range(0, 1.0001, .02).map(legs[1])] };
    const fitScale = (() => { const pr = d3.geoMercator().fitExtent([[W * .14, H * .2], [W * .86, H * .8]], routeAll); return { s: pr.scale(), c: pr.invert([W / 2, H / 2]) }; })();
    return { svg, grat, shore, land, bord, ghost, route, cityG, pulse, head, odoN, lat, lon, lands, borders, legs, prog, routeAll, fitScale, clip, u };
  },
  draw(ctx, t, s) {
    const { u } = s, P = s.prog(t);
    const pts = [...d3.range(0, (P.leg ? 1 : P.k) + 1e-9, .01).map(s.legs[0])];
    if (P.leg) pts.push(...d3.range(0, P.k + 1e-9, .01).map(s.legs[1]));
    const tip = P.leg ? s.legs[1](P.k) : s.legs[0](P.k);
    pts.push(tip);
    // 镜头：先全景，再推近跟着线头，最后拉远看全程
    const zin = smooth(.7, 1.6, t) * (1 - smooth(3.9, 4.7, t));
    const sc = s.fitScale.s * (LAND ? 1 : .9) * lerp(1, 1.7, zin) * (1 + .04 * t);
    const c = d3.geoInterpolate(s.fitScale.c, tip)(zin * .9);
    const pr = d3.geoMercator().scale(sc).center(c).translate([W / 2, H / 2]);
    const path = d3.geoPath(pr);
    s.grat.attr('d', path(d3.geoGraticule().step([2, 2])()));
    s.land.attr('d', path(s.lands)); s.shore.attr('d', path(s.lands)); s.clip.attr('d', path(s.lands));
    s.bord.attr('d', d => path(d));
    s.ghost.attr('d', path(s.routeAll));
    s.route.attr('d', pts.length > 1 ? path({ type: 'LineString', coordinates: pts }) : null);
    s.cityG.attr('transform', d => `translate(${pr(d.p)})`).attr('opacity', (d, i) => i === 0 ? 1 : .55 + .45 * smooth(i === 1 ? 2.2 : 4.1, i === 1 ? 2.4 : 4.3, t))
      .select('circle').attr('fill', (d, i) => (i === 1 && t > 2.3) || (i === 2 && t > 4.2) || i === 0 ? '#E8552D' : '#fff');
    const hp = pr(tip);
    s.head.attr('cx', hp[0]).attr('cy', hp[1]);
    const ph = (t * 1.6) % 1;
    s.pulse.attr('cx', hp[0]).attr('cy', hp[1]).attr('r', (14 + 50 * ph) * u).attr('stroke-opacity', 1 - ph);
    s.odoN.firstChild.textContent = d3.format(',')(Math.round(P.km * (1 + .0 * t)));
    s.lat.textContent = `北纬 ${tip[1].toFixed(3)}°`;
    s.lon.textContent = `东经 ${tip[0].toFixed(3)}°`;
  }
});
