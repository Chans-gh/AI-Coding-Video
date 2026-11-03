// 介绍页的交互：语言切换、现场画的小样、类型切换、画幅切换、样片筛选、按需播放、声音、时间轴、复制。没有任何外部依赖。
(function () {
  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 存不了就算了 */ } },
  };

  // 语言：记住上次的选择，否则跟浏览器
  function setLang(l) {
    root.dataset.lang = l;
    root.lang = l === 'zh' ? 'zh-CN' : 'en';
    store.set('acv-lang', l);
  }
  const nav = (navigator.language || 'zh').toLowerCase();
  setLang(store.get('acv-lang') || (nav.startsWith('zh') ? 'zh' : 'en'));
  document.getElementById('lang-toggle').addEventListener('click', () => setLang(root.dataset.lang === 'zh' ? 'en' : 'zh'));

  // 样片：进入视口才加载、播放
  const vids = Array.from(document.querySelectorAll('.card video'));
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { if (!v.getAttribute('src')) v.src = v.dataset.src; v.play().catch(() => {}); }
      else v.pause();
    });
  }, { rootMargin: '200px 0px' }) : null;
  vids.forEach(v => { if (io) io.observe(v); else { v.src = v.dataset.src; } });

  // 画幅
  const segs = document.querySelectorAll('.seg button');
  function setAr(ar) {
    root.dataset.ar = ar;
    segs.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ar === ar)));
    vids.forEach(v => {
      const id = v.dataset.id, had = !!v.getAttribute('src');
      v.dataset.src = `media/${id}-${ar}.mp4`;
      v.poster = `media/${id}-${ar}.jpg`;
      if (had) { v.src = v.dataset.src; v.play().catch(() => {}); }
    });
    store.set('acv-ar', ar);
  }
  segs.forEach(b => b.addEventListener('click', () => setAr(b.dataset.ar)));
  setAr(store.get('acv-ar') || (window.matchMedia('(max-width: 560px)').matches ? '9x16' : '16x9'));

  // 样片筛选：类型（C/T/G）、题材、技术三个条件都放在 state 里，每次点击都从头算一遍，不依赖上一次的结果
  const state = { kind: 'c', theme: '', tech: '' };
  const cards = Array.from(document.querySelectorAll('.card'));
  const groups = { theme: document.querySelector('.filter[data-dim="theme"]'), tech: document.querySelector('.filter[data-dim="tech"]') };
  const filtersEl = document.getElementById('filters'), emptyNone = document.getElementById('empty-none');
  const kindEmpty = document.querySelectorAll('.kind-empty'), picks = document.querySelectorAll('.path-pick');
  const match = (c, th, te) => c.dataset.kind === state.kind && (!th || c.dataset.theme === th) && (!te || c.dataset.tech.split(' ').includes(te));
  function apply() {
    let shown = 0;
    cards.forEach(c => {
      const on = match(c, state.theme, state.tech);
      c.hidden = !on; shown += on;
      if (!on) { const v = c.querySelector('video'); v.pause(); v.muted = true; c.querySelector('.snd').setAttribute('aria-pressed', 'false'); }
    });
    // 每个按钮上的数字 = 加上这个条件后还剩几支；为 0 的按钮置灰
    for (const dim of ['theme', 'tech']) {
      groups[dim].querySelectorAll('button').forEach(b => {
        const v = b.dataset.v, n = cards.filter(c => match(c, dim === 'theme' ? v : state.theme, dim === 'tech' ? v : state.tech)).length;
        b.querySelector('small').textContent = String(n);
        b.setAttribute('aria-pressed', String(v === state[dim]));
        b.disabled = n === 0 && v !== state[dim];
      });
    }
    document.querySelectorAll('.chips button').forEach(b => b.classList.toggle('on', b.dataset.tech === state.tech));
    const isC = state.kind === 'c';
    filtersEl.hidden = !isC;
    emptyNone.hidden = !isC || shown > 0;
    kindEmpty.forEach(e => { e.hidden = e.dataset.kind !== state.kind; });
    picks.forEach(b => { const on = b.dataset.kind === state.kind; b.setAttribute('aria-pressed', String(on)); b.closest('.path').classList.toggle('on', on); });
    // 新露出来的卡片：让观察器重新判断是否在视口里
    if (io) cards.forEach(c => { if (!c.hidden) { const v = c.querySelector('video'); io.unobserve(v); io.observe(v); } });
  }
  for (const dim of ['theme', 'tech']) groups[dim].addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    state[dim] = b.dataset.v; apply();
  });
  document.getElementById('cards').addEventListener('click', e => {
    const b = e.target.closest('.chips button'); if (!b) return;
    state.tech = state.tech === b.dataset.tech ? '' : b.dataset.tech; state.theme = '';
    apply(); filtersEl.scrollIntoView({ block: 'start' });
  });
  document.getElementById('clear-filters').addEventListener('click', () => { state.theme = state.tech = ''; apply(); });
  picks.forEach(b => b.addEventListener('click', () => { state.kind = b.dataset.kind; apply(); }));
  apply();

  // 现场画的小样：和「是什么」一节里写的 draw(ctx, t) 是同一件事
  function demo(ctx, t, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#0a0f1f'); sky.addColorStop(1, '#2a2340');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    const sy = h * (0.7 - 0.2 * t), r = h * .12;                                  // sun(ctx, 0.7 - 0.2 * t)
    const g = ctx.createRadialGradient(w * .5, sy, 0, w * .5, sy, r * 3); g.addColorStop(0, 'rgba(232,69,46,.55)'); g.addColorStop(1, 'rgba(232,69,46,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8452e'; ctx.beginPath(); ctx.arc(w * .5, sy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#05070c'; ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += w / 24) ctx.lineTo(x, h * (.78 + .07 * Math.sin(x / w * 7) + .04 * Math.sin(x / w * 17)));
    ctx.lineTo(w, h); ctx.fill();
    const p = Math.min(1, Math.max(0, t / 2));                                     // stroke(ctx, t / 2)
    if (p > 0) {
      ctx.strokeStyle = '#f2efe6'; ctx.lineCap = 'round';
      const a0 = -Math.PI / 2 + .35, n = 40;
      for (let i = 0; i < n * p; i++) {
        const a = a0 + i / n * Math.PI * 1.85, b2 = a0 + (i + 1) / n * Math.PI * 1.85;
        ctx.lineWidth = h * (.055 - .035 * i / n);
        ctx.beginPath(); ctx.arc(w * .5, h * .46, h * .3, a, b2); ctx.stroke();
      }
    }
  }
  const strip = document.getElementById('demo-strip');
  if (strip) [0, 1, 2, 2.9].forEach(t => {
    const f = document.createElement('figure'), c = document.createElement('canvas'), cap = document.createElement('figcaption');
    c.width = 192; c.height = 108; demo(c.getContext('2d'), t, 192, 108);
    cap.textContent = `t=${t.toFixed(1)} #${Math.round(t * 30)}`;
    f.append(c, cap); strip.append(f);
  });
  const pc = document.getElementById('demo-play'), pt = document.getElementById('demo-t');
  if (pc) {
    const ctx = pc.getContext('2d'); let vis = false, t0 = performance.now();
    demo(ctx, 0, pc.width, pc.height);
    const loop = now => { const t = ((now - t0) / 1000) % 3; demo(ctx, t, pc.width, pc.height); pt.textContent = t.toFixed(2); if (vis) requestAnimationFrame(loop); };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { demo(ctx, 2.5, pc.width, pc.height); pt.textContent = '2.50'; }
    else if ('IntersectionObserver' in window) new IntersectionObserver(es => { const was = vis; vis = es[0].isIntersecting; if (vis && !was) requestAnimationFrame(loop); }).observe(pc);
    else { vis = true; requestAnimationFrame(loop); }
  }

  // 声音：同一时间只开一个
  const snds = document.querySelectorAll('.snd');
  snds.forEach(b => b.addEventListener('click', () => {
    const v = b.closest('.screen').querySelector('video');
    const on = b.getAttribute('aria-pressed') !== 'true';
    snds.forEach(o => { o.setAttribute('aria-pressed', 'false'); o.closest('.screen').querySelector('video').muted = true; });
    if (on) {
      if (!v.getAttribute('src')) v.src = v.dataset.src;
      v.muted = false; v.currentTime = 0; v.play().catch(() => {});
      b.setAttribute('aria-pressed', 'true');
    }
  }));

  // 首屏时间轴：拖动时暂停，读数跟着帧走
  const hv = document.getElementById('hero-video');
  const range = document.getElementById('scrub-range');
  const tT = document.getElementById('tc-t'), tF = document.getElementById('tc-f');
  const FPS = 30;
  function show(t) {
    const f = Math.min(89, Math.floor(t * FPS + 1e-6));
    tT.textContent = t.toFixed(3); tF.textContent = String(f);
    range.value = String(f);
  }
  function tick() { show(hv.currentTime || 0); if (!hv.paused) requestAnimationFrame(tick); }
  hv.addEventListener('play', () => requestAnimationFrame(tick));
  hv.addEventListener('seeked', () => show(hv.currentTime));
  let resume = null;
  range.addEventListener('input', () => {
    if (resume === null) resume = !hv.paused;
    hv.pause();
    const f = Number(range.value);
    hv.currentTime = (f + .5) / FPS;
    tT.textContent = (f / FPS).toFixed(3); tF.textContent = String(f);
  });
  range.addEventListener('change', () => { if (resume) setTimeout(() => hv.play().catch(() => {}), 900); resume = null; });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { hv.pause(); vids.forEach(v => v.removeAttribute('autoplay')); }

  // 复制
  document.querySelectorAll('.copy').forEach(b => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.copy);
    const text = el.innerText;
    const done = () => { b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 1400); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }));
})();
