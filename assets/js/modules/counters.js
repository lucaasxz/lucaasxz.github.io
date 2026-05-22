function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  let current  = 0;
  const step   = Math.ceil(target / 40);

  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 40);
}

export function initCounters({ sectionId = 'about', threshold = 0.4 } = {}) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.stat-number').forEach(animateCounter);
      observer.unobserve(entry.target);
    });
  }, { threshold });

  observer.observe(section);
}
