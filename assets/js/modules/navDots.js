const SECTIONS = [
  { id: 'hero',     label: 'Início' },
  { id: 'projects', label: 'Projetos' },
  { id: 'skills',   label: 'Habilidades' },
  { id: 'about',    label: 'Sobre' },
  { id: 'contact',  label: 'Contato' },
];

export function initNavDots() {
  const sections = SECTIONS.map(s => ({
    ...s,
    el: document.getElementById(s.id),
  })).filter(s => s.el);

  if (!sections.length) return;

  const nav = document.createElement('nav');
  nav.className = 'nav-dots';
  nav.setAttribute('aria-label', 'Navegação por seções');

  const dots = sections.map(s => {
    const dot = document.createElement('a');
    dot.className = 'nav-dot';
    dot.href = '#' + s.id;
    dot.dataset.label = s.label;
    dot.setAttribute('aria-label', s.label);
    nav.appendChild(dot);
    return { dot, el: s.el };
  });

  document.body.appendChild(nav);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      dots.forEach(({ dot, el }) => dot.classList.toggle('active', el === entry.target));
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  dots.forEach(({ el }) => observer.observe(el));
}
