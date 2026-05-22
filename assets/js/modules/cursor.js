const INTERACTIVE = 'a, button, [role="tab"], .project-card, label, input, textarea';

export function initCursor(cursorId = 'customCursor') {
  const cursor = document.getElementById(cursorId);
  if (!cursor) return;

  const isTouchDevice = window.matchMedia('(hover: none)').matches;
  if (isTouchDevice) return;

  let mouseX = 0, mouseY = 0;
  let rafId;

  function move() {
    cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    rafId = requestAnimationFrame(move);
  }

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!cursor.classList.contains('visible')) {
      cursor.classList.add('visible');
      rafId = requestAnimationFrame(move);
    }
  });

  document.addEventListener('mouseleave', () => cursor.classList.remove('visible'));

  document.querySelectorAll(INTERACTIVE).forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });

  document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));
}
