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
      if (!document.startViewTransition || reduceMotion) { apply(); return; }
      // Circular wipe that grows out of the toggle
      var r = toggle.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.startViewTransition(apply).ready.then(function () {
        root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 650, easing: 'cubic-bezier(.16, 1, .3, 1)', pseudoElement: '::view-transition-new(root)' });
      });
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
    document.querySelectorAll('main section:not(.hero) .section-head, .factors, .cities, .faq, .about-copy, .contact-copy, .form, .city-grid .fit-list, .for, .nearby')
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

    // Glass cards: light follows the pointer
    document.querySelectorAll('.card, .tile, .steps li, .factors').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    // Phone mockup: tilts toward the pointer on desktop, follows the scroll on phones
    var phone = document.querySelector('.phone');
    var screen = document.querySelector('.screen');
    function tilt(rx, ry) {
      phone.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      phone.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      screen.style.setProperty('--gx', (ry * 3) + '%');
    }
    if (phone && screen) {
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
    ['Your business,', 'seen by', 'SoCal.'],
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
  if (dock && 'IntersectionObserver' in window) {
    var heroIn = true, contactIn = false;
    function update() { dock.classList.toggle('show', !heroIn && !contactIn); }
    new IntersectionObserver(function (es) { heroIn = es[0].isIntersecting; update(); }).observe(hero);
    new IntersectionObserver(function (es) { contactIn = es[0].isIntersecting; update(); }).observe(contact);
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
