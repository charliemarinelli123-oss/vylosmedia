/* ─────────────────────────────────────────
   VYLOS MEDIA — main.js
───────────────────────────────────────── */

// ── NAV SCROLL STATE ──
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}, { passive: true });

// ── MOBILE MENU ──
const burger      = document.getElementById('burger');
const mobileMenu  = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');
const mobileLinks = document.querySelectorAll('.mobile-menu__link');

function openMenu() {
  mobileMenu.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}

burger.addEventListener('click', openMenu);
mobileClose.addEventListener('click', closeMenu);
mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});

// ── SCROLL REVEAL ──
const revealEls = document.querySelectorAll(
  '.services__grid, .service-card, .statement__text, .social__links, .contact__inner, .section-header'
);

revealEls.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
});

revealEls.forEach(el => observer.observe(el));

// ── STAGGERED SERVICE CARDS ──
const serviceCards = document.querySelectorAll('.service-card');
serviceCards.forEach((card, i) => {
  card.style.transitionDelay = `${i * 80}ms`;
});

// ── CONTACT FORM ──
const form     = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name    = form.name.value.trim();
  const email   = form.email.value.trim();
  const message = form.message.value.trim();
  let valid = true;

  // Clear previous errors
  form.querySelectorAll('input, textarea').forEach(el => el.classList.remove('error'));
  formNote.textContent = '';
  formNote.className = 'form-note';

  if (!name) {
    form.name.classList.add('error');
    valid = false;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    form.email.classList.add('error');
    valid = false;
  }

  if (!message) {
    form.message.classList.add('error');
    valid = false;
  }

  if (!valid) {
    formNote.textContent = 'Please fill in all fields correctly.';
    formNote.classList.add('error');
    return;
  }

  // Replace this with your actual form endpoint (Formspree, Netlify Forms, etc.)
  // Example with Formspree: action="https://formspree.io/f/YOUR_ID"
  // For now we'll simulate a successful submission.

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Sending…';
  submitBtn.disabled = true;

  await new Promise(r => setTimeout(r, 1200)); // Simulate network request

  // ─ UNCOMMENT BELOW and replace YOUR_FORMSPREE_ID to wire up real form submission ─
  /*
  try {
    const res = await fetch('https://formspree.io/f/YOUR_FORMSPREE_ID', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    if (!res.ok) throw new Error('Network response was not ok');
  } catch (err) {
    formNote.textContent = 'Something went wrong. Please email us directly.';
    formNote.classList.add('error');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    return;
  }
  */

  formNote.textContent = "Message received. We'll be in touch within 24 hours.";
  formNote.classList.add('success');
  form.reset();
  submitBtn.textContent = originalText;
  submitBtn.disabled = false;
});

// ── SMOOTH ANCHOR SCROLL (for in-page links) ──
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  });
});
