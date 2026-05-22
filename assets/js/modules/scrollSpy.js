export function initScrollSpy(navSelector = '.nav-links a[href^="#"]') {
  const links = [...document.querySelectorAll(navSelector)];
  if (!links.length) return;

  const sections = links
    .map(link => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  function setActive(id) {
    links.forEach(link => {
      const matches = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', matches);
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sections.forEach(section => observer.observe(section));
}
