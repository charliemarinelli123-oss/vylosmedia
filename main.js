(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header + menu */
  const head = $('.site-head');
  const onScroll = () => head && head.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const mb = $('.menu-btn');
  if (mb) {
    mb.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      mb.setAttribute('aria-expanded', open);
    });
    $$('.nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
  }

  /* reveal */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  const watchReveal = () => $$('.reveal:not(.in)').forEach(el => io.observe(el));
  watchReveal();

  /* year */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  /* copy email */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copied'; }
    catch { b.textContent = 'Select & copy'; }
    setTimeout(() => b.textContent = 'Copy', 1800);
  }));

  /* Instagram work grid (Behold feed, same as live site) */
  const grid = $('#work-grid');
  if (grid) {
    const clean = c => (c || '').split('\n')[0].replace(/[#@]\S+/g, '').trim() || 'Recent work';
    const tag = c => {
      const m = (c || '').match(/@(\w+)/g);
      return m ? m.filter(h => !/vylos/i.test(h)).slice(0, 1).join('') : '';
    };
    fetch(grid.dataset.feed).then(r => r.json()).then(f => {
      const posts = (f.posts || []).slice(0, 6);
      const hr = $('#hero-reel'), first = posts.find(x => x.mediaType === 'VIDEO');
      if (hr && first) {
        hr.href = first.permalink;
        hr.style.backgroundImage = `url("${(first.sizes && first.sizes.medium && first.sizes.medium.mediaUrl) || first.thumbnailUrl}")`;
        $('.hero-reel-cap', hr).textContent = clean(first.caption);
        const hv = $('video', hr);
        if (!reduce) { hv.src = first.mediaUrl; hv.play().then(() => hr.classList.add('playing')).catch(() => {}); }
      }
      if (!posts.length) return;
      grid.innerHTML = '';
      posts.forEach((p, i) => {
        const a = document.createElement('a');
        a.className = 'work-item reveal';
        a.style.setProperty('--d', (i % 3) * 0.08 + 's');
        a.href = p.permalink; a.target = '_blank'; a.rel = 'noopener';
        a.setAttribute('aria-label', 'Watch on Instagram: ' + clean(p.caption));
        const img = new Image();
        img.src = (p.sizes && p.sizes.large && p.sizes.large.mediaUrl) || p.thumbnailUrl || p.mediaUrl;
        img.alt = clean(p.caption); img.loading = 'lazy'; img.decoding = 'async';
        a.appendChild(img);
        if (p.mediaType === 'VIDEO' && p.mediaUrl && !reduce) {
          const v = document.createElement('video');
          v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
          v.dataset.src = p.mediaUrl;
          v.setAttribute('aria-hidden', 'true');
          a.appendChild(v);
        }
        const cap = document.createElement('span'); cap.className = 'cap';
        cap.innerHTML = `<span></span><span class="small"></span>`;
        cap.children[0].textContent = clean(p.caption);
        cap.children[1].textContent = tag(p.caption);
        a.appendChild(cap);
        grid.appendChild(a);
      });
      watchReveal();
      // autoplay muted reels while in view
      const vio = new IntersectionObserver(es => es.forEach(e => {
        const v = $('video', e.target); if (!v) return;
        if (e.isIntersecting) {
          if (!v.src) v.src = v.dataset.src;
          v.play().then(() => e.target.classList.add('playing')).catch(() => {});
        } else { v.pause(); }
      }), { threshold: 0.35 });
      $$('.work-item', grid).forEach(el => vio.observe(el));
    }).catch(() => {});
  }

  /* inquiry form (Formspree, same endpoint as live site) */
  const form = $('form.inquiry');
  if (form) {
    const status = $('.form-status', form);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.textContent = 'Sending…'; status.className = 'form-status';
      try {
        const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!r.ok) throw 0;
        form.reset(); status.textContent = 'Thank you. We’ll reply personally within 48 hours.'; status.className = 'form-status ok'; window.location.href = '/thanks/';
      } catch { status.textContent = 'Something went wrong. Please email charlie@vylosmedia.com.'; }
    });
  }

  /* scroll-driven camera disassembly */
  const kit = $('.kit-scroll');
  if (kit) {
    const canvas = $('canvas', kit), ctx = canvas.getContext('2d');
    const N = +kit.dataset.frames, path = kit.dataset.path;
    const frames = new Array(N); let loaded = 0, cur = -1;
    const bar = $('.kit-progress .bar i', kit), pct = $('.kit-progress .pct', kit);
    const labels = $$('.kit-labels li', kit);
    const loading = $('.kit-loading', kit);
    const size = () => {
      const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d); cur = -1; draw();
    };
    const nearest = i => { for (let k = 0; k < N; k++) { if (frames[i - k]?.complete) return frames[i - k]; if (frames[i + k]?.complete) return frames[i + k]; } };
    let p = 0;
    function draw() {
      const i = Math.min(N - 1, Math.round(p * (N - 1)));
      const img = frames[i]?.complete && frames[i].naturalWidth ? frames[i] : nearest(i);
      if (!img || (i === cur && img === frames[i])) return;
      cur = i;
      const cw = canvas.width, ch = canvas.height, s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    }
    const update = () => {
      const r = kit.getBoundingClientRect(), span = r.height - innerHeight;
      p = Math.min(1, Math.max(0, -r.top / span));
      // ease the ends so the assembled & exploded states hold a moment
      const q = Math.min(1, Math.max(0, (p - 0.06) / 0.84));
      p = q;
      draw();
      if (bar) bar.style.transform = `scaleX(${q})`;
      if (pct) pct.textContent = String(Math.round(q * 100)).padStart(3, '0');
      labels.forEach(li => li.classList.toggle('on', q >= +li.dataset.at));
    };
    const load = () => {
      // load every 4th frame first for quick coverage, then the rest
      const order = [];
      for (let s = 4; s >= 1; s = s === 4 ? 2 : s === 2 ? 1 : 0) {
        for (let i = 0; i < N; i += s) if (!order.includes(i)) order.push(i);
        if (s === 1) break;
      }
      order.forEach(i => {
        const im = new Image(); im.decoding = 'async';
        im.onload = () => { loaded++; if (loading) loading.hidden = true; if (Math.abs(i - Math.round(p * (N - 1))) < 3 || cur < 0) { cur = -1; draw(); } };
        im.src = path.replace('{n}', String(i + 1).padStart(3, '0'));
        frames[i] = im;
      });
    };
    const kio = new IntersectionObserver(es => { if (es[0].isIntersecting) { load(); kio.disconnect(); } }, { rootMargin: '150% 0px' });
    kio.observe(kit);
    addEventListener('resize', size); size();
    addEventListener('scroll', () => requestAnimationFrame(update), { passive: true }); update();
  }
})();
