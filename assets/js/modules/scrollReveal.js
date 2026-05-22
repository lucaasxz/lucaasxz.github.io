const REVEAL_SELECTORS = [
  '.project-card',
  '.about-text',
  '.about-photo',
  '.skill-group',
  '.connect-eyebrow',
  '.connect-title',
  '.connect-buttons',
  '.connect-email',
];

export function initScrollReveal({ threshold = 0.1, staggerMs = 80 } = {}) {
  const elements = document.querySelectorAll(REVEAL_SELECTORS.join(', '));
  elements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('visible'), i * staggerMs);
      observer.unobserve(entry.target);
    });
  }, { threshold });

  elements.forEach(el => observer.observe(el));
}
