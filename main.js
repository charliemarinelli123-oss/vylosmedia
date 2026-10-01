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
    document.querySelectorAll('main section:not(.hero) .section-head, .factors, .cities, .faq, .about-lead, .viewfinder, .contact-copy, .form, .city-grid .fit-list, .for, .nearby')
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

    // Phone mockup: tilts toward the pointer on desktop, follows the scroll on phones
    var phone = document.querySelector('.phone');
    function tilt(rx, ry) {
      phone.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      phone.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    }
    if (phone) {
      if (finePointer) {
        var heroEl = document.querySelector('.hero');
        heroEl.addEventListener('pointermove', function (e) {
          var r = phone.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
          var dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
          tilt(-dy * 10, dx * 14);
        });
        heroEl.addEventListener('pointerleave', function () { tilt(0, 0); });
      } else {
        window.addEventListener('scroll', function () {
          var t = Math.min(window.scrollY / 500, 1);
          tilt(t * 8, -t * 5);
        }, { passive: true });
      }
    }
  }

  // Services card: tilts toward the pointer like the phone, or with the scroll on phones
  var bigCard = document.querySelector('.card-lg');
  if (bigCard && !reduceMotion) {
    var setCard = function (rx, ry) { bigCard.style.setProperty('--rx', rx.toFixed(2) + 'deg'); bigCard.style.setProperty('--ry', ry.toFixed(2) + 'deg'); };
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var svc = document.getElementById('services');
      svc.addEventListener('pointermove', function (e) {
        var r = bigCard.getBoundingClientRect();
        setCard(-((e.clientY - (r.top + r.height / 2)) / innerHeight) * 8, ((e.clientX - (r.left + r.width / 2)) / innerWidth) * 10);
      });
      svc.addEventListener('pointerleave', function () { setCard(0, 0); });
    } else {
      window.addEventListener('scroll', function () {
        var r = bigCard.getBoundingClientRect();
        var t = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
        setCard(t * 8, -t * 4);
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
    fetch(latest.getAttribute('data-feed'))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        var posts = (Array.isArray(d) ? d : d.posts || []).slice(0, 3);
        if (!posts.length) return;
        var grid = document.getElementById('ig-grid');
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
      .catch(function () { /* feed unavailable: the section stays hidden */ });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
