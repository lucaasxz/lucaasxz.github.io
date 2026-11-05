import { initDarkMode }       from './modules/darkMode.js';
import { initScrollProgress } from './modules/scrollProgress.js';
import { initNavbar }         from './modules/navbar.js';
import { initScrollReveal }   from './modules/scrollReveal.js';
import { initScrollSpy }      from './modules/scrollSpy.js';
import { initNavDots }        from './modules/navDots.js';
import { initBackToTop }      from './modules/backToTop.js';
import { initCopyEmail }      from './modules/copyEmail.js';
import { initEmailForm }      from './modules/emailForm.js';
import { initSkeletonLoader } from './modules/skeletonLoader.js';
import { initDemoModal }      from './modules/demoModal.js';

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
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

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
