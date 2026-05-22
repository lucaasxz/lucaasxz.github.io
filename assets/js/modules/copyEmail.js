function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('visible'));
  });

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 350);
  }, 2500);
}

export function initCopyEmail(selector = '.connect-email') {
  const el = document.querySelector(selector);
  if (!el) return;

  const email = el.textContent.trim()
    || el.getAttribute('href')?.replace('mailto:', '');

  el.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
      showToast('✓ Email copiado!');
    } catch {
      window.location.href = 'mailto:' + email;
    }
  });
}
