// 介绍页的交互：语言切换、画幅切换、样片按需播放、声音、时间轴、复制。没有任何外部依赖。
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

  // 题材筛选
  const fbtn = document.querySelectorAll('.filter button');
  fbtn.forEach(b => b.addEventListener('click', () => {
    fbtn.forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    document.querySelectorAll('.card').forEach(c => { c.hidden = !!b.dataset.f && c.dataset.f !== b.dataset.f; });
  }));

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
