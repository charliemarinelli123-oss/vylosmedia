/* Vylos Media */
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Pause motion: one switch for the looping animations on the page.
  // Remembered for this visit only, so every new visit starts with motion on.
  var motionHeld = false;
  try { localStorage.removeItem('motion'); localStorage.removeItem('theme'); motionHeld = sessionStorage.getItem('motion') === 'paused'; } catch (e) {}
  var motionListeners = [function () { root.classList.toggle('motion-held', motionHeld); }];
  root.classList.toggle('motion-held', motionHeld);
  function setMotionHeld(v) {
    motionHeld = v;
    try { if (v) sessionStorage.setItem('motion', 'paused'); else sessionStorage.removeItem('motion'); } catch (e) {}
    motionListeners.forEach(function (fn) { fn(); });
  }

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
  // Browser chrome colour follows the chosen theme, not only the system one
  function syncThemeColor() {
    if (!root.dataset.theme) return;
    var c = '#0e1116';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', c); });
  }
  syncThemeColor();
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      function apply() {
        root.dataset.theme = next;
        syncThemeColor();
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

  // Phone menu
  var menuBtn = document.getElementById('menuToggle'), siteNav = document.getElementById('site-nav');
  if (menuBtn && siteNav) {
    var setMenu = function (open) {
      siteNav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Menu';
    };
    menuBtn.addEventListener('click', function () { setMenu(!siteNav.classList.contains('open')); });
    siteNav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && siteNav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
  }

  // Nav border once the page scrolls
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  root.classList.add('js');

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
    ['New customers', 'start with', 'a scroll.']
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
      var bad = [];
      [['f-name', !name], ['f-biz', !business], ['f-email', !/^\S+@\S+\.\S+$/.test(email)]].forEach(function (c) {
        var el = document.getElementById(c[0]);
        el.setAttribute('aria-invalid', c[1] ? 'true' : 'false');
        if (c[1]) bad.push(el);
      });
      if (bad.length) {
        show('Please add your name, business and a valid email, then send again.', true);
        bad[0].focus({ preventScroll: true });
        bad[0].scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
      }
      data.set('_subject', 'New inquiry: ' + business);
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('bad status');
          form.reset();
          window.location.href = '/thanks/';
        })
        .catch(function () {
          show("That didn't go through. Please try again, or email charlie@vylosmedia.com.", true);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send message';
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
  // "See what we do" points at the Instagram posts; if the feed can't show, it points at Services
  function useFallbackLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('a[data-fallback]'), function (a) {
      a.setAttribute('href', a.getAttribute('data-fallback'));
    });
  }
  if (!latest || !window.fetch) useFallbackLinks();
  if (latest && window.fetch) {
    // Placeholder tiles hold the space while the feed loads; the section hides again if it fails
    var igGrid = document.getElementById('ig-grid');
    for (var sk = 0; sk < 5; sk++) { var ph = document.createElement('div'); ph.className = 'ig-post ig-skel'; ph.setAttribute('aria-hidden', 'true'); igGrid.appendChild(ph); }
    latest.hidden = false;
    latest.setAttribute('aria-busy', 'true');
    function hideLatest() { latest.hidden = true; useFallbackLinks(); }
    // Poster carousel: arrows glide one view at a time with an eased scroll
    function initRail() {
      var track = igGrid, prev = latest.querySelector('.ig-arrow.prev'), next = latest.querySelector('.ig-arrow.next');
      if (!prev || !next) return;
      var anim = null;
      function maxX() { return track.scrollWidth - track.clientWidth; }
      function update() {
        prev.disabled = track.scrollLeft <= 4;
        next.disabled = track.scrollLeft >= maxX() - 4;
        latest.querySelector('.ig-rail').classList.toggle('at-end', next.disabled);
        latest.querySelector('.ig-rail').classList.toggle('at-start', prev.disabled);
      }
      function step(dir) {
        var item = track.querySelector('.ig-post');
        var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        var w = item ? item.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
        var per = Math.max(1, Math.floor((track.clientWidth + gap) / w));
        var from = track.scrollLeft, to = Math.max(0, Math.min(maxX(), Math.round((from + dir * per * w) / w) * w));
        if (reduceMotion) { track.scrollLeft = to; update(); return; }
        if (anim) cancelAnimationFrame(anim);
        track.classList.add('gliding');
        var t0 = null, dur = 900;
        function ease(t) { return 1 - Math.pow(1 - t, 4); }
        function frame(t) {
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / dur);
          track.scrollLeft = from + (to - from) * ease(k);
          if (k < 1) anim = requestAnimationFrame(frame);
          else { anim = null; track.classList.remove('gliding'); update(); }
        }
        anim = requestAnimationFrame(frame);
      }
      prev.addEventListener('click', function () { step(-1); });
      next.addEventListener('click', function () { step(1); });
      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      });
      track.addEventListener('scroll', function () { if (!anim) update(); }, { passive: true });
      window.addEventListener('resize', update);
      update();
    }
    fetch(latest.getAttribute('data-feed'))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        var posts = (Array.isArray(d) ? d : d.posts || []).slice(0, 12);
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
          // Reels get a muted preview that plays only while the tile is on screen
          if (p.mediaType === 'VIDEO' && p.mediaUrl && !reduceMotion) {
            var v = document.createElement('video');
            v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
            v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
            v.setAttribute('data-src', p.mediaUrl);
            a.appendChild(v);
          }
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
          var title = document.createElement('span');
          title.className = 'ig-title'; title.setAttribute('aria-hidden', 'true');
          title.textContent = (cap.split('\n')[0].replace(/[#@]\S+/g, '').trim() || 'Recent work').slice(0, 60);
          a.appendChild(title);
          var view = document.createElement('span');
          view.className = 'ig-view'; view.setAttribute('aria-hidden', 'true'); view.textContent = 'View on Instagram';
          a.appendChild(view);
          if (!reduceMotion) { a.classList.remove('in', 'done'); a.style.setProperty('--d', (i * 0.1) + 's'); }
          grid.appendChild(a);
        });
        latest.hidden = false;
        initRail();
        if (!reduceMotion && 'IntersectionObserver' in window) {
          var vio = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
              var v = e.target.querySelector('video'); if (!v) return;
              if (e.isIntersecting) {
                if (!v.getAttribute('src')) v.src = v.getAttribute('data-src');
                var pr = v.play();
                if (pr && pr.then) pr.then(function () { e.target.classList.add('playing'); }).catch(function () {});
              } else { v.pause(); }
            });
          }, { threshold: 0.35 });
          grid.querySelectorAll('.ig-post').forEach(function (el) { vio.observe(el); });
          var head = latest.querySelector('.section-head');
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

  // Smooth wheel scrolling: the page glides and eases to a stop instead of halting with the wheel.
  // Mouse and trackpad only; touch keeps its native momentum, and reduced motion keeps native scrolling.
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.requestAnimationFrame) {
    var cur = window.scrollY, tgt = cur, gliding = false, lastT = 0;
    var maxY = function () { return document.documentElement.scrollHeight - innerHeight; };
    var glide = function (t) {
      var dt = lastT ? Math.min(t - lastT, 64) : 16; lastT = t;
      cur += (tgt - cur) * (1 - Math.pow(1 - 0.18, dt / 16.67));
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

  // Videos stay paused and unloaded until most of the frame is in view, then pause
  // again as soon as it leaves. Nothing downloads for a video nobody scrolls to.
  function watchVideo(video, isHeld, onChange) {
    var seen = false;
    function sync() {
      if (onChange) onChange();
      if (seen && !isHeld() && !document.hidden) {
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      } else if (!video.paused) {
        video.pause();
      }
    }
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        seen = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.6;
        sync();
      }, { threshold: [0, 0.6] }).observe(video);
    } else {
      seen = true;
    }
    sync();
    return sync;
  }

  // Hero Reel on the phone: poster only under reduced motion
  var heroReel = document.querySelector('.screen-reel');
  if (heroReel && !reduceMotion) motionListeners.push(watchVideo(heroReel, function () { return motionHeld; }));

  // Film loops: a Pause/Play control each, poster only under reduced motion
  Array.prototype.forEach.call(document.querySelectorAll('.film-frame'), function (frame) {
    var film = frame.querySelector('video');
    var filmToggle = frame.querySelector('.film-toggle');
    if (!film || !filmToggle) return;
    var filmHeld = reduceMotion || motionHeld;
    var sync = watchVideo(film, function () { return filmHeld; }, function () {
      filmToggle.textContent = filmHeld ? 'Play' : 'Pause';
      filmToggle.setAttribute('aria-pressed', filmHeld ? 'true' : 'false');
    });
    filmToggle.addEventListener('click', function () { filmHeld = !filmHeld; sync(); });
    motionListeners.push(function () { filmHeld = reduceMotion || motionHeld; sync(); });
  });


  // Character field under the hero: a still texture of mono glyphs, like a magnified frame.
  // Drawn once (and again on resize or theme change). Nothing animates.
  var field = document.querySelector('.field-canvas');
  if (field && field.getContext) {
    var ramp = [' ', ' ', '.', '\u00b7', ':', '+', '\u00d7', '\u25ab', '\u25aa'];
    var seed = function (x, y) { var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return n - Math.floor(n); };
    var drawField = function () {
      var box = field.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      field.width = Math.round(box.width * dpr); field.height = Math.round(box.height * dpr);
      var ctx = field.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, box.width, box.height);
      var css = getComputedStyle(document.documentElement);
      var dim = css.getPropertyValue('--muted').trim() || '#888', warm = css.getPropertyValue('--link').trim() || '#ccc';
      var cw = 11, ch = 16, cols = Math.ceil(box.width / cw), rows = Math.ceil(box.height / ch);
      ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace'; ctx.textBaseline = 'top';
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var u = c / cols, v = r / rows;
          // a soft diagonal light shaft, a horizon line and grain
          var shaft = Math.exp(-Math.pow((u - 0.62) + (v - 0.5) * 0.55, 2) / 0.012);
          var horizon = Math.exp(-Math.pow(v - 0.58, 2) / 0.02) * (0.35 + 0.65 * Math.abs(Math.sin(u * 9.0 + 1.3)) * 0.6);
          var edge = Math.min(u, 1 - u) * 4; edge = edge > 1 ? 1 : edge;
          var val = (shaft * 0.9 + horizon * 0.55) * edge + (seed(c, r) - 0.5) * 0.35;
          if (val < 0.12) continue;
          var i = Math.min(ramp.length - 1, Math.floor(val * ramp.length));
          ctx.globalAlpha = Math.min(0.85, 0.18 + val * 0.6);
          ctx.fillStyle = (val > 0.72 && seed(r, c) > 0.55) ? warm : dim;
          ctx.fillText(ramp[i], c * cw, r * ch);
        }
      }
      ctx.globalAlpha = 1;
    };
    var fieldTimer;
    var redraw = function () { clearTimeout(fieldTimer); fieldTimer = setTimeout(drawField, 120); };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(drawField);
    window.addEventListener('resize', redraw);
    new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
