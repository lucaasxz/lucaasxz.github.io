import { initDarkMode }       from './modules/darkMode.js';
import { initCursor }         from './modules/cursor.js';
import { initScrollProgress } from './modules/scrollProgress.js';
import { initNavbar }         from './modules/navbar.js';
import { initScrollReveal }   from './modules/scrollReveal.js';
import { initScrollSpy }      from './modules/scrollSpy.js';
import { initNavDots }        from './modules/navDots.js';
import { initProjectFilter }  from './modules/projectFilter.js';
import { initBackToTop }      from './modules/backToTop.js';
import { initCopyEmail }      from './modules/copyEmail.js';
import { initEmailForm }      from './modules/emailForm.js';
import { initSkeletonLoader } from './modules/skeletonLoader.js';
import { initDemoModal }      from './modules/demoModal.js';

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initCursor();
  initScrollProgress();
  initSkeletonLoader();
  initNavbar();
  initScrollReveal();
  initScrollSpy();
  initNavDots();
  initProjectFilter();
  initBackToTop();
  initCopyEmail();
  initEmailForm();
  initDemoModal();

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
