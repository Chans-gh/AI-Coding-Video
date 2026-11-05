// 介绍页的交互：语言切换、现场画的小样、类型切换、画幅切换、风格包换色、样片筛选和分页、停下才播、放大播放、声音、时间轴、复制。没有任何外部依赖。
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
  // 静帧也等快滚到时才填：HTML 里只写 data-poster，免得一打开页面就把一百多张全下下来
  const showPoster = v => { if (v.dataset.poster && v.getAttribute('poster') !== v.dataset.poster) v.poster = v.dataset.poster; };
  const near = new Set();
  const pio = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { near.add(e.target); showPoster(e.target); } else near.delete(e.target); });
  }, { rootMargin: '600px 0px' }) : null;
  if (pio) vids.forEach(v => pio.observe(v)); else vids.forEach(v => near.add(v));
  window.addEventListener('scroll', poke, { passive: true });

  // 画幅
  const segs = document.querySelectorAll('.seg button');
  function setAr(ar) {
    root.dataset.ar = ar;
    segs.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ar === ar)));
    vids.forEach(v => {
      const id = v.dataset.id, had = !!v.getAttribute('src');
      v.dataset.src = `media/s/${id}-${ar}.mp4`;
      v.dataset.poster = `media/s/${id}-${ar}.jpg`;
      if (near.has(v)) showPoster(v);
      if (had) { v.pause(); v.src = v.dataset.src; }
    });
    store.set('acv-ar', ar);
    poke();
  }
  segs.forEach(b => b.addEventListener('click', () => setAr(b.dataset.ar)));

  // 风格包换品牌色：点标签换成同一支演示片的另一种颜色，接着原来的时间播（画幅仍跟着上面的开关）
  document.querySelectorAll('.pack').forEach(pk => {
    const v = pk.querySelector('.pack-video'), tabs = pk.querySelectorAll('.pack-tabs button');
    tabs.forEach(b => b.addEventListener('click', () => {
      tabs.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const t = v.currentTime, had = !!v.getAttribute('src');
      v.dataset.id = `pack-${v.dataset.pack}-${b.dataset.acc}`;
      v.dataset.src = `media/s/${v.dataset.id}-${root.dataset.ar}.mp4`;
      v.dataset.poster = `media/s/${v.dataset.id}-${root.dataset.ar}.jpg`;
      showPoster(v);
      if (had) { v.src = v.dataset.src; v.addEventListener('loadedmetadata', () => { v.currentTime = t; }, { once: true }); }
      start(v);
    }));
  });
  // 风格包横向滑动：» 翻到下一个，« 翻回上一个；到头的那一侧按钮藏起来。按钮的高度对准演示片的中线
  const track = document.querySelector('.pack-track');
  if (track) {
    const rail = track.parentElement, prev = rail.querySelector('.pack-nav.prev'), next = rail.querySelector('.pack-nav.next');
    const step = () => track.clientWidth + parseFloat(getComputedStyle(track).columnGap || 0);
    const sync = () => {
      const x = track.scrollLeft, max = track.scrollWidth - track.clientWidth - 2;
      prev.hidden = x <= 2; next.hidden = x >= max;
      const sc = track.querySelector('.pack-screen');
      if (sc) rail.style.setProperty('--nav-y', (sc.getBoundingClientRect().top - rail.getBoundingClientRect().top + sc.offsetHeight / 2) + 'px');
    };
    const go = d => track.scrollBy({ left: d * step(), behavior: reduce ? 'auto' : 'smooth' });
    next.addEventListener('click', () => go(1));
    prev.addEventListener('click', () => go(-1));
    track.addEventListener('keydown', e => { if (e.target === track && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); go(e.key === 'ArrowRight' ? 1 : -1); } });
    track.addEventListener('scroll', () => { sync(); poke(); }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
    segs.forEach(b => b.addEventListener('click', () => requestAnimationFrame(sync)));   // 换画幅后演示片高度变了
  }
  setAr(store.get('acv-ar') || (window.matchMedia('(max-width: 560px)').matches ? '9x16' : '16x9'));

  // 样片筛选和分页：类型（C/T/G）、题材、技术、页码都放在 state 里，每次点击都从头算一遍，不依赖上一次的结果
  const state = { kind: 'c', theme: '', tech: '', ctype: '', qtech: '', page: 0 };
  const cards = Array.from(document.querySelectorAll('.card'));
  const cardsEl = document.getElementById('cards');
  const DIMS = ['theme', 'tech', 'ctype', 'qtech'];
  const groups = Object.fromEntries(DIMS.map(d => [d, document.querySelector(`.filter[data-dim="${d}"]`)]));
  const kindBtns = document.querySelectorAll('.kinds button');
  const filtersEl = document.getElementById('filters'), emptyNone = document.getElementById('empty-none');
  const kindEmpty = document.querySelectorAll('.kind-empty'), picks = document.querySelectorAll('.path-pick');
  const pager = document.getElementById('pager'), nums = pager.querySelector('.pg-nums');
  // 题材、技术只用于 C 类，内容类型只用于 T 类、G 类；o 里给的维度临时替换 state 里的值（算按钮上的数字用）
  const match = (c, o = {}) => {
    const v = d => (d in o ? o[d] : state[d]);
    if (c.dataset.kind !== state.kind) return false;
    if (state.kind === 'c') return (!v('theme') || c.dataset.theme === v('theme')) && (!v('tech') || c.dataset.tech.split(' ').includes(v('tech')));
    return (!v('ctype') || c.dataset.ctype === v('ctype')) && (!v('qtech') || c.dataset.qtech.split(' ').includes(v('qtech')));
  };
  const matched = () => cards.filter(c => match(c));
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
    for (const dim of DIMS) {
      groups[dim].querySelectorAll('button').forEach(b => {
        const v = b.dataset.v, n = cards.filter(c => match(c, { [dim]: v })).length;
        b.querySelector('small').textContent = String(n);
        b.setAttribute('aria-pressed', String(v === state[dim]));
        b.disabled = n === 0 && v !== state[dim];
        if (b.dataset.k) b.hidden = b.dataset.k !== state.kind;   // T、G 类的技术类型各列各的
      });
    }
    document.querySelectorAll('.chips button').forEach(b => b.classList.toggle('on', b.dataset.qtech ? b.dataset.qtech === state.qtech : b.dataset.tech === state.tech));
    const any = cards.some(c => c.dataset.kind === state.kind);
    filtersEl.hidden = !any;
    filtersEl.querySelectorAll('[data-kinds]').forEach(e => { e.hidden = !e.dataset.kinds.split(' ').includes(state.kind); });
    emptyNone.hidden = !any || list.length > 0;
    kindEmpty.forEach(e => { e.hidden = e.dataset.kind !== state.kind; });
    kindBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kind === state.kind)));
    picks.forEach(b => { const on = b.dataset.kind === state.kind; b.setAttribute('aria-pressed', String(on)); b.closest('.path').classList.toggle('on', on); });
    // 页码：页数多时只留首页、末页和当前页左右各一页，中间用省略号
    pager.hidden = pages < 2;
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
    poke(); fitHow();
  }
  const reset = () => { state.page = 0; apply(); };
  for (const dim of DIMS) groups[dim].addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    state[dim] = b.dataset.v; reset();
  });
  cardsEl.addEventListener('click', e => {
    const b = e.target.closest('.chips button'); if (!b) return;
    if (b.dataset.qtech) { state.qtech = state.qtech === b.dataset.qtech ? '' : b.dataset.qtech; state.ctype = ''; }
    else { state.tech = state.tech === b.dataset.tech ? '' : b.dataset.tech; state.theme = ''; }
    reset(); filtersEl.scrollIntoView({ block: 'start' });
  });
  const goPage = k => { state.page = k; apply(); cardsEl.scrollIntoView({ block: 'start' }); };
  pager.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.page) goPage(Number(b.dataset.page));
    else goPage(state.page + (b.classList.contains('pg-next') ? 1 : -1));
  });
  document.getElementById('clear-filters').addEventListener('click', () => { state.theme = state.tech = state.ctype = state.qtech = ''; reset(); });
  const setKind = k => { state.kind = k; state.theme = state.tech = state.ctype = state.qtech = ''; reset(); };
  kindBtns.forEach(b => b.addEventListener('click', () => setKind(b.dataset.kind)));
  // 「是什么」里的三条路：点了切换类型，并跳到样片区
  picks.forEach(b => b.addEventListener('click', () => { setKind(b.dataset.kind); document.getElementById('gallery').scrollIntoView({ block: 'start' }); }));
  // 链接直接指向某支样片（#C-187）：清掉筛选，翻到它那一页
  function toHash() {
    const c = location.hash && cards.find(x => '#' + x.id === location.hash);
    if (!c) return false;
    state.kind = c.dataset.kind; state.theme = state.tech = state.ctype = state.qtech = '';
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
    lv.poster = `media/s/${id}-${ar}.jpg`; lv.src = `media/${id}-${ar}.mp4`;
    lv.muted = false; lv.play().catch(() => {});
    lb.querySelector('.lb-id').textContent = id;
    lb.querySelector('.lb-name').innerHTML = c.querySelector('.card-meta h4').innerHTML;
  }
  function lbStep(d) { const l = matched(), i = l.indexOf(cur); lbShow(l[(i + d + l.length) % l.length]); }
  // 卡片描述：只露两行，放不下的才显示「更多」；鼠标移到「更多」上浮出全文，移出卡片描述区收起；触屏上点「更多」开关，点别处收起
  function fitHow() {
    cards.forEach(c => {
      if (c.hidden) return;
      const p = c.querySelector('.how'), m = c.querySelector('.more');
      if (!p.closest('.pop')) m.hidden = p.scrollHeight <= p.clientHeight + 1;
    });
  }
  const shut = box => { box.classList.remove('pop'); box.querySelector('.more').setAttribute('aria-expanded', 'false'); };
  const shutAll = keep => document.querySelectorAll('.how-box.pop').forEach(x => { if (x !== keep) shut(x); });
  const openHow = box => { shutAll(box); box.classList.add('pop'); box.querySelector('.more').setAttribute('aria-expanded', 'true'); };
  cardsEl.addEventListener('pointerover', e => {
    const m = e.target.closest('.more'); if (m && e.pointerType === 'mouse') openHow(m.parentElement);
  });
  cardsEl.addEventListener('pointerout', e => {
    const box = e.target.closest('.how-box.pop');
    if (box && e.pointerType === 'mouse' && !box.contains(e.relatedTarget)) shut(box);
  });
  document.addEventListener('click', e => {
    const m = e.target.closest('.more');
    if (m) { const box = m.parentElement; if (box.classList.contains('pop') && e.pointerType !== 'mouse') shut(box); else openHow(box); return; }
    if (!e.target.closest('.how-box.pop')) shutAll();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') shutAll(); });
  document.getElementById('lang-toggle').addEventListener('click', () => { shutAll(); fitHow(); });
  window.addEventListener('resize', fitHow);
  if (document.fonts) document.fonts.ready.then(fitHow);
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

  // 现场画的小样：一支 4 秒的新品开场，三层叠起来。bg 代表 AI 生成的背景，photo 代表你拍的产品照片（页面不放外来图片，两层都用代码画的图形代替），code 是代码画的标题和评分
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const LAYERS = {
    bg(ctx, t, w, h) {
      const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#1b1530'); sky.addColorStop(1, '#4a2f4f');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      const sx = w * .3, sy = h * (.62 - .12 * ease(t / 4)), r = h * .14;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3.2); g.addColorStop(0, 'rgba(255,150,90,.55)'); g.addColorStop(1, 'rgba(255,150,90,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff9a5c'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#120d1f'; ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += w / 24) ctx.lineTo(x, h * (.8 + .06 * Math.sin(x / w * 6 + 1) + .03 * Math.sin(x / w * 19)));
      ctx.lineTo(w, h); ctx.fill();
    },
    photo(ctx, t, w, h) {
      const k = ease((t - .3) / .9), cw = h * .5, ch = h * .66, x = w * .64 + (1 - k) * w * .5, y = h * .17;
      ctx.save(); ctx.globalAlpha = k; ctx.translate(x + cw / 2, y + ch / 2); ctx.rotate((1 - k) * .3 + .05); ctx.translate(-cw / 2, -ch / 2);
      ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, cw, ch);                     // 相纸白边
      const pad = cw * .08, iw = cw - pad * 2, ih = ch - pad * 3.2;
      const bg = ctx.createLinearGradient(0, pad, 0, pad + ih); bg.addColorStop(0, '#d9e4ea'); bg.addColorStop(1, '#a9bcc8');
      ctx.fillStyle = bg; ctx.fillRect(pad, pad, iw, ih);
      const bx = pad + iw / 2, bw = iw * .34;                                     // 一只瓶子
      ctx.fillStyle = '#2f5d73'; ctx.beginPath(); ctx.roundRect(bx - bw / 2, pad + ih * .36, bw, ih * .58, bw * .18); ctx.fill();
      ctx.fillStyle = '#1d3a48'; ctx.fillRect(bx - bw * .22, pad + ih * .22, bw * .44, ih * .15);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(bx - bw * .32, pad + ih * .42, bw * .1, ih * .4);
      ctx.restore();
    },
    code(ctx, t, w, h) {
      const k1 = ease((t - .9) / .6), k2 = ease((t - 1.3) / .6), k3 = ease((t - 1.8) / 1.2);
      const x = w * .08;
      if (k1 > 0) { ctx.fillStyle = '#e8452e'; ctx.beginPath(); ctx.roundRect(x, h * .2, h * .3, h * .11, h * .055); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(h * .07)}px system-ui, sans-serif`; ctx.textBaseline = 'middle'; ctx.fillText('NEW', x + h * .05, h * .257); }
      ctx.fillStyle = '#f2efe6';
      if (k1 > 0) ctx.fillRect(x, h * .37, w * .42 * k1, h * .09);
      if (k2 > 0) ctx.fillRect(x, h * .5, w * .3 * k2, h * .05);
      if (k3 > 0) { ctx.font = `800 ${Math.round(h * .13)}px system-ui, sans-serif`; ctx.textBaseline = 'alphabetic';
        ctx.fillText((4.9 * k3).toFixed(1), x, h * .78); ctx.fillStyle = '#ffc94d'; ctx.fillText('★', x + h * .25, h * .78); }
    },
  };
  const ORDER = ['bg', 'photo', 'code'];
  const composite = (ctx, t, w, h) => ORDER.forEach(k => LAYERS[k](ctx, t, w, h));
  const layerCs = Array.from(document.querySelectorAll('.stack canvas'));
  const pc = document.getElementById('demo-play'), pt = document.getElementById('demo-t');
  const frame = t => {
    layerCs.forEach(c => { const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); LAYERS[c.dataset.layer](x, t, c.width, c.height); });
    if (pc) { composite(pc.getContext('2d'), t, pc.width, pc.height); pt.textContent = t.toFixed(2); }
  };
  if (pc) {
    let vis = false, t0 = performance.now();
    const loop = now => { frame(((now - t0) / 1000) % 4); if (vis) requestAnimationFrame(loop); };
    if (reduce) frame(3.5);
    else if ('IntersectionObserver' in window) { frame(0); new IntersectionObserver(es => { const was = vis; vis = es[0].isIntersecting; if (vis && !was) requestAnimationFrame(loop); }).observe(pc); }
    else { vis = true; requestAnimationFrame(loop); }
  }

  // 综合应用的例子：点标签换一条时间线
  const mixTabs = document.querySelectorAll('.mix-tabs [role="tab"]');
  mixTabs.forEach(b => b.addEventListener('click', () => mixTabs.forEach(x => {
    const on = x === b; x.setAttribute('aria-selected', String(on)); document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
  })));

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

  // 首屏：几支样片轮播（下面圆点切换，播完自动换下一支；拖过时间轴或点过圆点就只循环当前这支）。时间轴拖动时暂停，读数跟着帧走
  const hv = document.getElementById('hero-video');
  const range = document.getElementById('scrub-range'), ruler = range.closest('.ruler');
  const tT = document.getElementById('tc-t'), tF = document.getElementById('tc-f'), tN = document.getElementById('tc-n');
  const dots = Array.from(document.querySelectorAll('.hero-dots button'));
  const caps = Array.from(document.querySelectorAll('#scrub figcaption'));
  const FPS = 30;
  let frames = 90, hi = 0, held = false;
  function show(t) {
    const f = Math.min(frames - 1, Math.floor(t * FPS + 1e-6));
    tT.textContent = t.toFixed(3); tF.textContent = String(f);
    range.value = String(f);
  }
  function meta() {
    frames = Math.max(1, Math.floor(hv.duration * FPS + 1e-6)) || 90;   // 音轨常比画面长几十毫秒，向下取整
    range.max = String(frames - 1); tN.textContent = String(frames);
    ruler.style.setProperty('--secs', String(Math.max(1, Math.round(frames / FPS))));
    ruler.style.setProperty('--marks', String(Math.max(1, Math.round(frames / 5))));
    show(hv.currentTime || 0);
  }
  if (hv.readyState >= 1) meta();
  hv.addEventListener('loadedmetadata', meta);
  function heroGo(k, user) {
    if (user) { held = true; hv.loop = true; }
    hi = (k + dots.length) % dots.length;
    const id = dots[hi].dataset.id;
    dots.forEach((d, i) => d.setAttribute('aria-pressed', String(i === hi)));
    caps.forEach((c, i) => { c.hidden = i !== hi; });
    hv.poster = `media/m/${id}-16x9.jpg`; hv.src = `media/m/${id}-16x9.mp4`;
    if (!reduce) hv.play().catch(() => {});
  }
  dots.forEach((d, i) => d.addEventListener('click', () => heroGo(i, true)));
  hv.addEventListener('ended', () => { if (!held) heroGo(hi + 1); });
  function tick() { show(hv.currentTime || 0); if (!hv.paused) requestAnimationFrame(tick); }
  hv.addEventListener('play', () => requestAnimationFrame(tick));
  hv.addEventListener('seeked', () => show(hv.currentTime));
  let resume = null;
  range.addEventListener('input', () => {
    if (!held) { held = true; hv.loop = true; }
    if (resume === null) resume = !hv.paused;
    hv.pause();
    const f = Number(range.value);
    hv.currentTime = (f + .5) / FPS;
    tT.textContent = (f / FPS).toFixed(3); tF.textContent = String(f);
  });
  range.addEventListener('change', () => { if (resume) setTimeout(() => hv.play().catch(() => {}), 900); resume = null; });
  if (reduce) hv.pause();

  // 提示词模板：三类切换，复制按钮跟着换
  const tplBtns = document.querySelectorAll('.tpl-tabs button'), tplCopy = document.querySelector('.tpl .copy');
  tplBtns.forEach(b => b.addEventListener('click', () => {
    tplBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    document.querySelectorAll('.tpl pre[data-tpl]').forEach(p => { p.hidden = p.dataset.tpl !== b.dataset.tpl; });
    tplCopy.dataset.copy = `tpl-${b.dataset.tpl}`;
  }));

  // 真实应用：点卡片才加载中版；说明栏、分段目录、进度条跟着播放进度切到当前这一段，播完展开整支汇总
  const caseCards = document.querySelectorAll('.case-card[data-case]'), caseStage = document.querySelector('.case-stage');
  const caseArts = Array.from(document.querySelectorAll('.case'));
  const caseLoad = v => { if (!v.getAttribute('src')) { v.poster = v.dataset.poster; v.src = v.dataset.src; } };
  caseArts.forEach(a => {
    const v = a.querySelector('video'), secs = Array.from(a.querySelectorAll('.cs'));
    const toc = a.querySelectorAll('.case-toc button'), bars = a.querySelectorAll('.cb');
    const head = a.querySelector('.cb-head'), dur = Number(a.querySelector('.case-bar').dataset.dur), sum = a.querySelector('.case-sum');
    let cur = 0;
    const show = i => {
      if (i === cur) return;
      cur = i;
      secs.forEach((s, k) => { s.hidden = k !== i; });
      toc.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      bars.forEach((b, k) => b.classList.toggle('on', k === i));
    };
    const at = t => { const i = secs.findIndex(s => t < Number(s.dataset.e)); return i < 0 ? secs.length - 1 : i; };
    const sync = () => { const t = v.currentTime || 0; show(at(t)); head.style.left = `${Math.min(100, t / dur * 100)}%`; };
    const jump = i => { caseLoad(v); v.currentTime = Number(secs[i].dataset.s) + 0.05; show(i); v.play().catch(() => {}); };
    bars[0].classList.add('on');
    v.addEventListener('timeupdate', sync);
    v.addEventListener('seeked', sync);
    v.addEventListener('ended', () => { sum.open = true; });
    toc.forEach((b, i) => b.addEventListener('click', () => jump(i)));
    bars.forEach((b, i) => b.addEventListener('click', () => jump(i)));
  });
  caseCards.forEach(c => c.addEventListener('click', () => {
    caseStage.hidden = false;
    caseCards.forEach(x => x.setAttribute('aria-pressed', String(x === c)));
    caseArts.forEach(a => {
      const on = a.dataset.case === c.dataset.case, v = a.querySelector('video');
      a.hidden = !on;
      if (on) { caseLoad(v); v.play().catch(() => {}); } else v.pause();
    });
    caseStage.scrollIntoView({ block: 'start' });
  }));

  // 复制
  document.querySelectorAll('.copy').forEach(b => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.copy);
    const text = el.innerText;
    const done = () => { b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 1400); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }));
})();
