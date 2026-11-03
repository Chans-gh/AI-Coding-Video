// 介绍页的交互：语言切换、现场画的小样、类型切换、画幅切换、样片筛选和分页、停下才播、放大播放、声音、时间轴、复制。没有任何外部依赖。
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

  // 样片播放：视口停下来（不再滚动）一小会儿，才播放大半露在视口里的样片；滚出视口的马上暂停。src 第一次要播时才填
  const PAGE = 15, DWELL = 350;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vids = Array.from(document.querySelectorAll('.card video, .pack-video'));   // 样片卡片 + 风格包演示片
  const lb = document.getElementById('lightbox'), lv = lb.querySelector('video');
  const seen = new Set();
  const start = v => { if (!v.getAttribute('src')) v.src = v.dataset.src; v.play().catch(() => {}); };
  const stop = v => { if (!v.paused) v.pause(); };
  function settle() {
    if (lb.open) return;
    vids.forEach(v => { const c = v.closest('.card'); (seen.has(v) && !(c && c.hidden) && (!reduce || !v.muted)) ? start(v) : stop(v); });
  }
  let idle = 0;
  const poke = () => { clearTimeout(idle); idle = setTimeout(settle, DWELL); };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= .55) seen.add(e.target); else { seen.delete(e.target); stop(e.target); } });
    poke();
  }, { threshold: [0, .55] }) : null;
  if (io) vids.forEach(v => io.observe(v));
  window.addEventListener('scroll', poke, { passive: true });

  // 画幅
  const segs = document.querySelectorAll('.seg button');
  function setAr(ar) {
    root.dataset.ar = ar;
    segs.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ar === ar)));
    vids.forEach(v => {
      const id = v.dataset.id, had = !!v.getAttribute('src');
      v.dataset.src = `media/${id}-${ar}.mp4`;
      v.poster = `media/${id}-${ar}.jpg`;
      if (had) { v.pause(); v.src = v.dataset.src; }
    });
    store.set('acv-ar', ar);
    poke();
  }
  segs.forEach(b => b.addEventListener('click', () => setAr(b.dataset.ar)));
  setAr(store.get('acv-ar') || (window.matchMedia('(max-width: 560px)').matches ? '9x16' : '16x9'));

  // 样片筛选和分页：类型（C/T/G）、题材、技术、页码都放在 state 里，每次点击都从头算一遍，不依赖上一次的结果
  const state = { kind: 'c', theme: '', tech: '', page: 0 };
  const cards = Array.from(document.querySelectorAll('.card'));
  const cardsEl = document.getElementById('cards');
  const groups = { theme: document.querySelector('.filter[data-dim="theme"]'), tech: document.querySelector('.filter[data-dim="tech"]') };
  const filtersEl = document.getElementById('filters'), emptyNone = document.getElementById('empty-none');
  const kindEmpty = document.querySelectorAll('.kind-empty'), picks = document.querySelectorAll('.path-pick');
  const pager = document.getElementById('pager'), nums = pager.querySelector('.pg-nums');
  const match = (c, th, te) => c.dataset.kind === state.kind && (!th || c.dataset.theme === th) && (!te || c.dataset.tech.split(' ').includes(te));
  const matched = () => cards.filter(c => match(c, state.theme, state.tech));
  function muteCard(c) { c.querySelector('video').muted = true; c.querySelector('.snd').setAttribute('aria-pressed', 'false'); }
  function apply() {
    const list = matched(), pages = Math.max(1, Math.ceil(list.length / PAGE));
    state.page = Math.min(Math.max(0, state.page), pages - 1);
    cards.forEach(c => {
      const i = list.indexOf(c), on = i >= 0 && Math.floor(i / PAGE) === state.page;
      c.hidden = !on;
      if (!on) { stop(c.querySelector('video')); muteCard(c); }
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
    emptyNone.hidden = !isC || list.length > 0;
    kindEmpty.forEach(e => { e.hidden = e.dataset.kind !== state.kind; });
    picks.forEach(b => { const on = b.dataset.kind === state.kind; b.setAttribute('aria-pressed', String(on)); b.closest('.path').classList.toggle('on', on); });
    // 页码：页数多时只留首页、末页和当前页左右各一页，中间用省略号
    pager.hidden = !isC || pages < 2;
    pager.querySelectorAll('.pg-total').forEach(e => { e.textContent = String(list.length); });
    pager.querySelector('.pg-prev').disabled = state.page === 0;
    pager.querySelector('.pg-next').disabled = state.page === pages - 1;
    nums.textContent = '';
    let gap = false;
    for (let k = 0; k < pages; k++) {
      if (pages > 7 && k > 0 && k < pages - 1 && Math.abs(k - state.page) > 1) { if (!gap) nums.append('…'); gap = true; continue; }
      gap = false;
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.page = String(k); b.textContent = String(k + 1);
      if (k === state.page) b.setAttribute('aria-current', 'page');
      nums.append(b);
    }
    poke();
  }
  const reset = () => { state.page = 0; apply(); };
  for (const dim of ['theme', 'tech']) groups[dim].addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    state[dim] = b.dataset.v; reset();
  });
  cardsEl.addEventListener('click', e => {
    const b = e.target.closest('.chips button'); if (!b) return;
    state.tech = state.tech === b.dataset.tech ? '' : b.dataset.tech; state.theme = '';
    reset(); filtersEl.scrollIntoView({ block: 'start' });
  });
  const goPage = k => { state.page = k; apply(); cardsEl.scrollIntoView({ block: 'start' }); };
  pager.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.page) goPage(Number(b.dataset.page));
    else goPage(state.page + (b.classList.contains('pg-next') ? 1 : -1));
  });
  document.getElementById('clear-filters').addEventListener('click', () => { state.theme = state.tech = ''; reset(); });
  picks.forEach(b => b.addEventListener('click', () => { state.kind = b.dataset.kind; reset(); }));
  // 链接直接指向某支样片（#C-187）：清掉筛选，翻到它那一页
  function toHash() {
    const c = location.hash && cards.find(x => '#' + x.id === location.hash);
    if (!c) return false;
    state.kind = 'c'; state.theme = state.tech = '';
    state.page = Math.floor(matched().indexOf(c) / PAGE); apply();
    c.scrollIntoView({ block: 'center' });
    return true;
  }
  window.addEventListener('hashchange', toHash);
  if (!toHash()) apply();

  // 放大播放：在当前筛选结果里前后翻，关掉时翻到最后看的那支所在的页
  let cur = null;
  function lbShow(c) {
    cur = c;
    const id = c.id, ar = root.dataset.ar;
    lb.dataset.ar = ar;
    lv.poster = `media/${id}-${ar}.jpg`; lv.src = `media/${id}-${ar}.mp4`;
    lv.muted = false; lv.play().catch(() => {});
    lb.querySelector('.lb-id').textContent = id;
    lb.querySelector('.lb-name').innerHTML = c.querySelector('.card-meta h4').innerHTML;
  }
  function lbStep(d) { const l = matched(), i = l.indexOf(cur); lbShow(l[(i + d + l.length) % l.length]); }
  cardsEl.addEventListener('click', e => {
    const b = e.target.closest('.open'); if (!b) return;
    vids.forEach(stop); cards.forEach(muteCard);
    lbShow(b.closest('.card'));
    if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
  });
  lb.querySelector('.lb-prev').addEventListener('click', () => lbStep(-1));
  lb.querySelector('.lb-next').addEventListener('click', () => lbStep(1));
  lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => {
    if (e.target === lv) return;
    if (e.key === 'ArrowLeft') lbStep(-1); else if (e.key === 'ArrowRight') lbStep(1);
  });
  lb.addEventListener('close', () => {
    lv.pause(); lv.removeAttribute('src'); lv.load();
    const k = Math.floor(matched().indexOf(cur) / PAGE);
    if (cur && k !== state.page) { state.page = k; apply(); }
    if (cur) cur.scrollIntoView({ block: 'nearest' });
    poke();
  });

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
    cards.forEach(muteCard);
    if (on) {
      v.muted = false; if (v.getAttribute('src')) v.currentTime = 0; start(v);
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
  if (reduce) hv.pause();

  // 复制
  document.querySelectorAll('.copy').forEach(b => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.copy);
    const text = el.innerText;
    const done = () => { b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 1400); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }));
})();
