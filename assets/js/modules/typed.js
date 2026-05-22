export function initTyped(elementId, words, { typeSpeed = 100, deleteSpeed = 60, pauseMs = 2000, pauseBetween = 400 } = {}) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let wordIndex  = 0;
  let charIndex  = 0;
  let deleting   = false;

  function tick() {
    const current = words[wordIndex];

    if (deleting) {
      el.textContent = current.substring(0, charIndex--);
      if (charIndex < 0) {
        deleting   = false;
        wordIndex  = (wordIndex + 1) % words.length;
        setTimeout(tick, pauseBetween);
        return;
      }
    } else {
      el.textContent = current.substring(0, ++charIndex);
      if (charIndex === current.length) {
        setTimeout(() => { deleting = true; tick(); }, pauseMs);
        return;
      }
    }

    setTimeout(tick, deleting ? deleteSpeed : typeSpeed);
  }

  tick();
}
