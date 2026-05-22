function createPhoneModal() {
  const overlay = document.createElement('div');
  overlay.className = 'demo-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <button class="demo-close" aria-label="Fechar demo">✕</button>
    <div class="phone-mockup">
      <div class="phone-notch"></div>
      <div class="phone-screen">
        <iframe class="demo-frame" title="Demo do projeto"></iframe>
      </div>
      <div class="phone-home-bar"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function createBrowserModal() {
  const overlay = document.createElement('div');
  overlay.className = 'demo-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <button class="demo-close" aria-label="Fechar demo">✕</button>
    <div class="browser-mockup">
      <div class="browser-toolbar">
        <div class="browser-dots">
          <span></span><span></span><span></span>
        </div>
        <div class="browser-address" id="browserAddress">localhost</div>
      </div>
      <div class="browser-screen">
        <iframe class="demo-frame" title="Demo do projeto"></iframe>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function setupModal(overlay) {
  const frame    = overlay.querySelector('.demo-frame');
  const closeBtn = overlay.querySelector('.demo-close');
  const address  = overlay.querySelector('#browserAddress');

  function open(src) {
    frame.src = src;
    if (address) address.textContent = src;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    frame.src = '';
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  return { open };
}

export function initDemoModal() {
  const triggers = document.querySelectorAll('[data-demo-src]');
  if (!triggers.length) return;

  const phoneModal   = setupModal(createPhoneModal());
  const browserModal = setupModal(createBrowserModal());

  triggers.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const src  = btn.dataset.demoSrc;
      const type = btn.dataset.demoType || 'mobile';
      type === 'web' ? browserModal.open(src) : phoneModal.open(src);
    });
  });
}
