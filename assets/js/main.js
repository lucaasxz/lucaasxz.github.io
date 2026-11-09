import { initScrollProgress } from './modules/scrollProgress.js?v=20261109t';
import { initNavbar }         from './modules/navbar.js?v=20261109t';
import { initScrollReveal }   from './modules/scrollReveal.js?v=20261109t';
import { initScrollSpy }      from './modules/scrollSpy.js?v=20261109t';
import { initNavDots }        from './modules/navDots.js?v=20261109t';
import { initBackToTop }      from './modules/backToTop.js?v=20261109t';
import { initCopyEmail }      from './modules/copyEmail.js?v=20261109t';
import { initEmailForm }      from './modules/emailForm.js?v=20261109t';
import { initSkeletonLoader } from './modules/skeletonLoader.js?v=20261109t';
import { initDemoModal }      from './modules/demoModal.js?v=20261109t';
import { initHeroSplit }      from './modules/heroSplit.js?v=20261109t';

document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initSkeletonLoader();
  initNavbar();
  initScrollReveal();
  initScrollSpy();
  initNavDots();
  initBackToTop();
  initCopyEmail();
  initEmailForm();
  initDemoModal();
  initHeroSplit();

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
