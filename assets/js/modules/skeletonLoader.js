export function initSkeletonLoader(imageSelector = '.project-image', delayMs = 900) {
  const images = document.querySelectorAll(imageSelector);
  images.forEach(img => img.classList.add('skeleton'));

  setTimeout(() => {
    images.forEach(img => img.classList.remove('skeleton'));
  }, delayMs);
}
