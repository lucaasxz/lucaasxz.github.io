export function initNavbar() {
  const navbar     = document.getElementById('navbar');
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  function menu(aberto) {
    hamburger.classList.toggle('open', aberto);
    mobileMenu.classList.toggle('open', aberto);
    navbar.classList.toggle('menu-aberto', aberto);
    hamburger.setAttribute('aria-expanded', String(aberto));
    hamburger.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    mobileMenu.setAttribute('aria-hidden', String(!aberto));
  }

  hamburger.addEventListener('click', () => menu(!mobileMenu.classList.contains('open')));

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => menu(false));
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) menu(false);
  });
}
