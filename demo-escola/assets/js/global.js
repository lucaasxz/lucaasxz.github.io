document.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    e.preventDefault();
    document.body.style.opacity = '0';
    setTimeout(() => {
      window.location.href = href;
    }, 400);
  });
});
