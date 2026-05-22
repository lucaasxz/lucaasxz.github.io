export function initBackToTop({ btnId = 'backToTop', threshold = 400 } = {}) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > threshold);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
