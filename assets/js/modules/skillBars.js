export function initSkillBars({ sectionId = 'skills', threshold = 0.3 } = {}) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
        bar.style.width = bar.getAttribute('data-width') + '%';
      });
      observer.unobserve(entry.target);
    });
  }, { threshold });

  observer.observe(section);
}
