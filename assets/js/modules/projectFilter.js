export function initProjectFilter({
  filterSelector = '.filter-btn',
  cardSelector   = '.project-card',
  hiddenClass    = 'hidden',
} = {}) {
  const buttons = document.querySelectorAll(filterSelector);
  const cards   = document.querySelectorAll(cardSelector);
  if (!buttons.length || !cards.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle(hiddenClass, !match);
      });
    });
  });
}
