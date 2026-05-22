const STORAGE_KEY = 'ls-theme';

function applyTheme(theme, btn) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);

  const isDark = theme === 'dark';
  btn.querySelector('.icon-moon').style.display = isDark ? 'none'  : 'block';
  btn.querySelector('.icon-sun').style.display  = isDark ? 'block' : 'none';
  btn.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
}

export function initDarkMode(btnId = 'themeToggle') {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const saved = localStorage.getItem(STORAGE_KEY)
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  applyTheme(saved, btn);

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark', btn);
  });
}
