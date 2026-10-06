/* Vylos Media */
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Light / dark toggle. Follows the system until the visitor picks one.
  var toggle = document.getElementById('themeToggle');
  var darkQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  function isDark() {
    var t = root.dataset.theme;
    return t ? t === 'dark' : !!(darkQuery && darkQuery.matches);
  }
  function syncToggle() {
    if (toggle) toggle.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      function apply() {
        root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch (e) {}
        syncToggle();
      }
      if (reduceMotion) { apply(); return; }
      // Slow blurred cross-fade (keyframes live in styles.css)
      if (document.startViewTransition) { document.startViewTransition(apply); return; }
      root.classList.add('theming');
      apply();
      setTimeout(function () { root.classList.remove('theming'); }, 1100);
    });
    if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', syncToggle);
    syncToggle();
  }

  // Nav border once the page scrolls
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal on scroll: section heads and panels rise in from a soft blur, grouped items one after another
  if ('IntersectionObserver' in window && !reduceMotion) {
    document.querySelectorAll('main section:not(.hero) .section-head, .factors, .job, .cities, .faq, .about-lead, .viewfinder, .contact-copy, .form, .city-grid .fit-list, .for, .nearby')
      .forEach(function (el) { el.classList.add('reveal'); });
    document.querySelectorAll('.bento, .steps, .tiles, .grid-3').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (el, i) {
        el.classList.add('reveal'); el.style.setProperty('--d', (i * 0.07) + 's');
      });
    });
    root.classList.add('js');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('in'); io.unobserve(el);
        setTimeout(function () { el.classList.add('done'); }, 1200 + (parseFloat(el.style.getPropertyValue('--d')) || 0) * 1000);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  }

  if (!reduceMotion) {
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Phone mockup: leans back slightly as you scroll on phones (no pointer effects)
    var phone = document.querySelector('.phone');
    function tilt(rx, ry) {
      phone.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      phone.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    }
    if (phone && !finePointer) {
      window.addEventListener('scroll', function () {
        var t = Math.min(window.scrollY / 500, 1);
        tilt(t * 8, -t * 5);
      }, { passive: true });
    }
  }


  // "Scrolling right now": spin through a feed of words with motion blur, then settle
  var reel = document.querySelector('.reel-track');
  if (reel && !reduceMotion && 'IntersectionObserver' in window) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.innerHTML = '<filter id="vmb" x="0" y="-50%" width="100%" height="200%"><feGaussianBlur stdDeviation="0 0"/></filter>';
    document.body.appendChild(svg);
    var blurEl = svg.querySelector('feGaussianBlur');
    var items = reel.children, n = items.length;
    reel.style.transform = 'translateY(0)';
    reel.style.transition = 'none';
    new IntersectionObserver(function (es, obs) {
      if (!es[0].isIntersecting) return;
      obs.disconnect();
      var step = items[0].getBoundingClientRect().height, end = step * (n - 1), dur = 2600, t0 = null, last = 0;
      reel.style.filter = 'url(#vmb)';
      function frame(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4), y = e * end;
        blurEl.setAttribute('stdDeviation', '0 ' + Math.min(Math.abs(y - last) * 0.5, 9).toFixed(2));
        reel.style.transform = 'translateY(' + (-y) + 'px)';
        last = y;
        if (p < 1) requestAnimationFrame(frame); else reel.style.filter = '';
      }
      requestAnimationFrame(frame);
    }, { threshold: 0.6 }).observe(reel.parentNode);
  }

  // Scroll progress line under the nav
  var bar = document.createElement('span');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  nav.appendChild(bar);
  var ticking = false;
  function progress() {
    var max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(window.scrollY / max, 1) : 0);
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(progress); } }, { passive: true });
  progress();

  // Rotating caption on the phone
  var caption = document.getElementById('caption');
  var lines = [
    ['Your brand,', 'seen by', 'the world.'],
    ['New customers', 'start with', 'a scroll.'],
    ['Your first Reel', 'is on us.']
  ];
  if (caption && !reduceMotion) {
    var i = 0;
    setInterval(function () {
      caption.style.opacity = 0;
      setTimeout(function () {
        i = (i + 1) % lines.length;
        caption.innerHTML = '';
        lines[i].forEach(function (t, n) {
          var s = document.createElement('span');
          s.textContent = t;
          caption.appendChild(s);
          if (n < lines[i].length - 1) caption.appendChild(document.createTextNode(' '));
        });
        caption.style.opacity = 1;
      }, 400);
    }, 3200);
    caption.style.transition = 'opacity .4s ease';
  }

  // Copy email
  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      function done(label) { btn.textContent = label; setTimeout(function () { btn.textContent = 'Copy'; }, 1600); }
      function fallback() {
        var r = document.createRange();
        r.selectNodeContents(document.getElementById('email'));
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        done('Selected');
      }
      try { navigator.clipboard.writeText(text).then(function () { done('Copied'); }, fallback); }
      catch (e) { fallback(); }
    });
  });

  // Contact form: sends to Formspree, which emails charlie@vylosmedia.com
  var form = document.getElementById('leadForm');
  var status = document.getElementById('formStatus');
  if (form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    function show(msg, isError) {
      status.hidden = false;
      status.className = 'form-status' + (isError ? ' error' : '');
      status.textContent = msg;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = String(data.get('name') || '').trim();
      var business = String(data.get('business') || '').trim();
      var email = String(data.get('email') || '').trim();
      if (!name || !business || !/^\S+@\S+\.\S+$/.test(email)) {
        show('Please add your name, business and a valid email.', true);
        return;
      }
      data.set('_subject', 'New inquiry: ' + business);
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('bad status');
          form.reset();
          show("Thanks, " + name + ". We got your message and will reply within 24 hours.", false);
          submitBtn.textContent = 'Sent';
        })
        .catch(function () {
          show("That didn't go through. Please try again, or email charlie@vylosmedia.com.", true);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send';
        });
    });
  }

  // Mobile action bar: hidden over the hero and the contact section
  var dock = document.getElementById('dock');
  var hero = document.querySelector('.hero');
  var contact = document.getElementById('contact');
  if (dock && !(hero && contact)) {
    // Pages without a hero or contact form: show the bar after a little scrolling
    window.addEventListener('scroll', function () { dock.classList.toggle('show', window.scrollY > 300); }, { passive: true });
  }
  if (dock && hero && contact && 'IntersectionObserver' in window) {
    var heroIn = true, contactIn = false;
    function update() { dock.classList.toggle('show', !heroIn && !contactIn); }
    new IntersectionObserver(function (es) { heroIn = es[0].isIntersecting; update(); }).observe(hero);
    new IntersectionObserver(function (es) { contactIn = es[0].isIntersecting; update(); }).observe(contact);
  }

  // About viewfinder: running timecode
  var tc = document.getElementById('timecode');
  if (tc && !reduceMotion) {
    var t0 = Date.now(), tcOn = true;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    new IntersectionObserver(function (es) { tcOn = es[0].isIntersecting; }).observe(tc);
    setInterval(function () {
      if (!tcOn) return;
      var f = Math.floor((Date.now() - t0) / (1000 / 24));
      var s = Math.floor(f / 24);
      tc.textContent = '00:' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60) + ':' + pad(f % 24);
    }, 1000 / 24);
  }

  // "Made for" band: duplicate the list so the loop is seamless
  var track = document.querySelector('.marquee-track');
  if (track) {
    Array.prototype.slice.call(track.children).forEach(function (el) {
      var c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c);
    });
  }

  // Hero headline: words rise into place from behind a mask, one after another
  var h1 = document.querySelector('.hero h1');
  if (h1 && !reduceMotion) {
    var units = [];
    Array.prototype.slice.call(h1.childNodes).forEach(function (n) {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(function (w) { if (w) units.push(/^\s+$/.test(w) ? document.createTextNode(w) : w); });
      else units.push(n);
    });
    h1.textContent = '';
    var k = 0;
    units.forEach(function (u) {
      if (u.nodeType === 3) { h1.appendChild(u); return; }
      var w = document.createElement('span'), inner = document.createElement('span');
      w.className = 'w'; inner.className = 'wi';
      if (typeof u === 'string') inner.textContent = u; else inner.appendChild(u);
      inner.style.animationDelay = (0.12 + k++ * 0.09) + 's';
      w.appendChild(inner); h1.appendChild(w);
    });
    h1.classList.add('split');
  }

  // Hero drifts gently as you scroll away from it
  var heroCopy = document.querySelector('.hero-copy'), heroVis = document.querySelector('.hero-visual');
  if (heroCopy && heroVis && !reduceMotion) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var y = Math.min(window.scrollY, 900);
        heroCopy.style.translate = '0 ' + (y * 0.12) + 'px';
        heroCopy.style.opacity = Math.max(0, 1 - y / 800);
        heroVis.style.translate = '0 ' + (y * -0.05) + 'px';
      });
    }, { passive: true });
  }

  // Latest Instagram posts, from the Behold feed (refreshed by Behold, no keys on the site)
  var latest = document.getElementById('latest');
  if (latest && window.fetch) {
    // Placeholder tiles hold the space while the feed loads; the section hides again if it fails
    var igGrid = document.getElementById('ig-grid');
    for (var sk = 0; sk < 3; sk++) { var ph = document.createElement('div'); ph.className = 'ig-post ig-skel'; ph.setAttribute('aria-hidden', 'true'); igGrid.appendChild(ph); }
    latest.hidden = false;
    latest.setAttribute('aria-busy', 'true');
    function hideLatest() { latest.hidden = true; }
    fetch(latest.getAttribute('data-feed'))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        var posts = (Array.isArray(d) ? d : d.posts || []).slice(0, 3);
        if (!posts.length) { hideLatest(); return; }
        var grid = igGrid;
        grid.textContent = '';
        latest.removeAttribute('aria-busy');
        posts.forEach(function (p, i) {
          var size = p.sizes && (p.sizes.medium || p.sizes.large || p.sizes.small);
          var src = (size && size.mediaUrl) || (p.mediaType === 'VIDEO' ? p.thumbnailUrl : p.mediaUrl) || p.thumbnailUrl;
          if (!src) return;
          var a = document.createElement('a');
          a.className = 'ig-post reveal in done';
          a.href = p.permalink || 'https://instagram.com/vylosmedia';
          a.target = '_blank'; a.rel = 'noopener';
          var cap = (p.prunedCaption || p.caption || '').trim();
          a.setAttribute('aria-label', 'Open on Instagram' + (cap ? ': ' + cap.slice(0, 80) : ''));
          var img = document.createElement('img');
          img.src = src; img.alt = cap ? cap.slice(0, 120) : 'Instagram post by Vylos Media';
          img.loading = 'lazy'; img.decoding = 'async'; img.width = 480; img.height = 600;
          a.appendChild(img);
          if (p.mediaType === 'VIDEO' || p.isReel) {
            var badge = document.createElement('span');
            badge.className = 'ig-badge'; badge.setAttribute('aria-hidden', 'true');
            badge.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
            a.appendChild(badge);
          } else if (p.mediaType === 'CAROUSEL_ALBUM') {
            var stack = document.createElement('span');
            stack.className = 'ig-badge'; stack.setAttribute('aria-hidden', 'true');
            stack.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 3h12a2 2 0 012 2v12h-2V5H7zM3 7h12a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z"/></svg>';
            a.appendChild(stack);
          }
          var view = document.createElement('span');
          view.className = 'ig-view'; view.setAttribute('aria-hidden', 'true'); view.textContent = 'View on Instagram';
          a.appendChild(view);
          if (!reduceMotion) { a.classList.remove('in', 'done'); a.style.setProperty('--d', (i * 0.1) + 's'); }
          grid.appendChild(a);
        });
        latest.hidden = false;
        if (!reduceMotion && 'IntersectionObserver' in window) {
          var head = latest.querySelector('.section-head');
          head.classList.add('reveal');
          var o = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
              if (!e.isIntersecting) return;
              e.target.classList.add('in'); o.unobserve(e.target);
              (function (el) { setTimeout(function () { el.classList.add('done'); }, 1400); })(e.target);
            });
          }, { rootMargin: '0px 0px -8% 0px' });
          latest.querySelectorAll('.reveal').forEach(function (el) { o.observe(el); });
        }
      })
      .catch(hideLatest);
  }

  // Light ribbons: fine strands of warm light that pinch to a bright point and fan out,
  // drifting with time and with the scroll so they travel between sections
  (function () {
    var cv = document.createElement('canvas');
    if (!cv.getContext) return;
    cv.className = 'ribbons'; cv.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(cv, document.body.firstChild);
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, N = 0, strands = [];
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function size() {
      var w = innerWidth, h = Math.max(innerHeight, document.documentElement.clientHeight);
      if (w === W && Math.abs(h - H) < 120) return;
      W = w; H = h; dpr = Math.min(window.devicePixelRatio || 1, W < 760 ? 2 : 1.5);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var n = W < 760 ? 42 : 64;
      if (n !== N) {
        N = n; strands = []; seed = 7;
        for (var i = 0; i < N; i++) strands.push({ o: (i / (N - 1)) * 2 - 1 + (rnd() - .5) * .07, sp: .25 + rnd() * .5, ph: rnd() * 6.28, c: rnd() < .22 ? 2 : (rnd() < .5 ? 1 : 0) });
      }
      if (reduceMotion) draw(0);
    }
    var dark = isDark();
    var sy = window.scrollY, target = window.scrollY;
    var palettes = {
      dark: ['255, 226, 184', '214, 160, 104', '255, 246, 232'],
      light: ['176, 122, 70', '140, 92, 50', '205, 160, 110']
    };
    function grad(rgb, fx, a) {
      var g = ctx.createLinearGradient(0, 0, W, 0), f = Math.min(Math.max(fx / W, .12), .88);
      g.addColorStop(0, 'rgba(' + rgb + ',0)');
      g.addColorStop(Math.max(f - .22, .01), 'rgba(' + rgb + ',' + (a * .35) + ')');
      g.addColorStop(f, 'rgba(' + rgb + ',' + a + ')');
      g.addColorStop(Math.min(f + .3, .99), 'rgba(' + rgb + ',' + (a * .7) + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',' + (a * .12) + ')');
      return g;
    }
    function draw(t) {
      var mobile = W < 760;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var fx = W * (mobile ? .5 + .12 * Math.sin(sy / 700) : .54 + .14 * Math.sin(sy / 950 - .1));
      var fy = H * (mobile ? .84 : .7) + H * .07 * Math.sin(sy / 1200) + Math.sin(t * .21) * H * .012;
      var pal = dark ? palettes.dark : palettes.light;
      var gs = [grad(pal[0], fx, dark ? .55 : .75), grad(pal[1], fx, dark ? .45 : .6), grad(pal[2], fx, dark ? .7 : .6)];
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      ctx.lineWidth = mobile ? .8 : 1;
      var step = mobile ? 8 : 10, tilt = Math.sin(sy / 1400) * .25;
      for (var i = 0; i < N; i++) {
        var st = strands[i], ao = Math.abs(st.o);
        ctx.strokeStyle = gs[st.c];
        ctx.globalAlpha = (dark ? .22 : .28) + (1 - ao) * (dark ? .5 : .5);
        ctx.beginPath();
        for (var x = -20; x <= W + 20; x += step) {
          var d = (x - fx) / W, ad = Math.abs(d);
          var spread = d >= 0 ? H * (.006 + .5 * Math.pow(d, 1.25)) : H * (.006 + .22 * Math.pow(-d, 1.1));
          var yc = fy - H * (.35 + tilt) * d - H * .55 * d * ad;
          var wave = Math.sin(x * .0042 + t * st.sp + st.ph) * H * .022 * (.25 + ad * 2) + Math.sin(x * .0016 - t * .22 + st.ph * .5) * H * .05 * ad;
          var y = yc + st.o * spread + wave;
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        if (i % 5 === 2) {
          var lw = ctx.lineWidth, ga = ctx.globalAlpha;
          ctx.lineWidth = mobile ? 10 : 16; ctx.globalAlpha = dark ? .05 : .06;
          ctx.stroke();
          ctx.lineWidth = lw; ctx.globalAlpha = ga;
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    function themeChanged() { dark = isDark(); if (reduceMotion) draw(0); }
    new MutationObserver(themeChanged).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', themeChanged);
    window.addEventListener('resize', size);
    size();
    // Brightest over the hero, quieter behind the reading sections
    function fade() {
      var o = Math.max(.32, 1 - window.scrollY / (innerHeight * 1.1));
      cv.style.setProperty('--ribbon-o', o.toFixed(3));
    }
    window.addEventListener('scroll', function () { target = window.scrollY; fade(); }, { passive: true });
    fade();
    if (reduceMotion) { draw(0); return; }
    var running = true;
    document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) requestAnimationFrame(loop); });
    function loop(ts) {
      if (!running) return;
      sy += (target - sy) * .06;
      draw(ts / 1000);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  // Flood: as the section pins, champagne spreads out from the mark and the line writes itself in
  var flood = document.querySelector('.flood');
  if (flood && !reduceMotion) {
    var fl = flood.querySelector('.flood-line'), fstage = flood.querySelector('.flood-stage');
    var fwords = [];
    Array.prototype.slice.call(fl.childNodes).forEach(function (n) {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(function (w) { if (w) fwords.push(/^\s+$/.test(w) ? document.createTextNode(w) : w); });
      else fwords.push(n);
    });
    fl.textContent = '';
    var spans = [];
    fwords.forEach(function (u) {
      if (u.nodeType === 3) { fl.appendChild(u); return; }
      var sp = document.createElement('span'); sp.className = 'fw';
      if (typeof u === 'string') sp.textContent = u; else sp.appendChild(u);
      fl.appendChild(sp); spans.push(sp);
    });
    fl.setAttribute('aria-label', fl.textContent);
    flood.classList.add('flood-live');
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var ease = function (v) { return v * v * (3 - 2 * v); };
    var fTick = false;
    function floodUpdate() {
      fTick = false;
      var r = flood.getBoundingClientRect(), vh = innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      var lead = vh * .35, p = clamp((lead - r.top) / (r.height - vh + lead));
      var a = ease(clamp(p / .34)), b = clamp((p - .3) / .42);
      var diag = Math.hypot(innerWidth, vh);
      fstage.style.setProperty('--r', (a * diag * .62).toFixed(1) + 'px');
      fstage.style.setProperty('--ms', (1 + a * .25 - b * .25).toFixed(3));
      fstage.style.setProperty('--my', (ease(b) * Math.min(vh * .2, 150)).toFixed(1) + 'px');
      fstage.style.setProperty('--eo', clamp((p - .28) / .1).toFixed(2));
      var k = spans.length;
      spans.forEach(function (sp, i) {
        var o = clamp((b * (k + 2) - i) / 2.2);
        sp.style.setProperty('--o', o.toFixed(3));
      });
    }
    window.addEventListener('scroll', function () { if (!fTick) { fTick = true; requestAnimationFrame(floodUpdate); } }, { passive: true });
    window.addEventListener('resize', floodUpdate);
    floodUpdate();
  }

  // Live project card: each stage fills, ticks off, and the next one starts
  var job = document.querySelector('.job');
  if (job) {
    var rows = job.querySelectorAll('.job-rows li');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(rows, function (li) { li.classList.add('ok'); });
    } else {
      var jIdx = 0, jTimer = null, jOn = false;
      function jStep() {
        if (!jOn) { jTimer = null; return; }
        if (jIdx < rows.length) {
          var li = rows[jIdx];
          li.classList.add('run');
          jTimer = setTimeout(function () { li.classList.remove('run'); li.classList.add('ok'); jIdx++; jTimer = setTimeout(jStep, 260); }, 1400);
        } else {
          jTimer = setTimeout(function () {
            job.classList.add('reset');
            Array.prototype.forEach.call(rows, function (li) { li.classList.remove('ok', 'run'); });
            jIdx = 0;
            jTimer = setTimeout(function () { job.classList.remove('reset'); jStep(); }, 900);
          }, 2600);
        }
      }
      new IntersectionObserver(function (es) {
        jOn = es[0].isIntersecting;
        if (jOn && !jTimer) jTimer = setTimeout(jStep, 400);
      }, { threshold: .35 }).observe(job);
    }
  }

  // Smooth wheel scrolling: the page glides and eases to a stop instead of halting with the wheel.
  // Mouse and trackpad only; touch keeps its native momentum, and reduced motion keeps native scrolling.
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.requestAnimationFrame) {
    var cur = window.scrollY, tgt = cur, gliding = false, lastT = 0;
    var maxY = function () { return document.documentElement.scrollHeight - innerHeight; };
    var glide = function (t) {
      var dt = lastT ? Math.min(t - lastT, 64) : 16; lastT = t;
      cur += (tgt - cur) * (1 - Math.pow(1 - 0.085, dt / 16.67));
      if (Math.abs(tgt - cur) < 0.4) { cur = tgt; gliding = false; lastT = 0; }
      window.scrollTo({ top: cur, behavior: 'instant' });
      if (gliding) requestAnimationFrame(glide);
    };
    var glideTo = function (y) {
      tgt = Math.max(0, Math.min(y, maxY()));
      if (!gliding) { gliding = true; cur = window.scrollY; requestAnimationFrame(glide); }
    };
    var scrollsItself = function (el) {
      for (; el && el !== document.body; el = el.parentElement) {
        if (/^(TEXTAREA|SELECT)$/.test(el.tagName)) return true;
        var oy = getComputedStyle(el).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) return true;
      }
      return false;
    };
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY) || scrollsItself(e.target)) return;
      e.preventDefault();
      var d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      glideTo((gliding ? tgt : window.scrollY) + d);
    }, { passive: false });
    // Keyboard, scrollbar drags and anything else that scrolls the page take over from the glide
    window.addEventListener('scroll', function () {
      if (!gliding) { cur = tgt = window.scrollY; }
    }, { passive: true });
    ['keydown', 'mousedown'].forEach(function (ev) {
      window.addEventListener(ev, function () { if (gliding) { gliding = false; lastT = 0; cur = tgt = window.scrollY; } });
    });
    // In-page links glide too
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.pathname !== location.pathname || a.host !== location.host) return;
      var el = a.hash.length > 1 ? document.getElementById(decodeURIComponent(a.hash.slice(1))) : null;
      if (!el && a.hash !== '#top') return;
      e.preventDefault();
      glideTo(el ? el.getBoundingClientRect().top + window.scrollY - 64 : 0);
      history.pushState(null, '', a.hash);
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
