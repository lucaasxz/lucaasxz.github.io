const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setFieldError(form, fieldId, message) {
  const errorEl = document.getElementById(fieldId + 'Error');
  const inputEl = form.querySelector('#' + fieldId);
  if (errorEl) errorEl.textContent = message;
  if (inputEl) inputEl.classList.add('error');
}

function clearFieldError(form, fieldId) {
  const errorEl = document.getElementById(fieldId + 'Error');
  const inputEl = form.querySelector('#' + fieldId);
  if (errorEl) errorEl.textContent = '';
  if (inputEl) inputEl.classList.remove('error');
}

function validateForm(form) {
  const name    = form.name.value.trim();
  const email   = form.email.value.trim();
  const message = form.message.value.trim();
  let valid = true;

  ['name', 'email', 'message'].forEach(id => clearFieldError(form, id));

  if (!name)                      { setFieldError(form, 'name',    'Por favor, informe seu nome.');     valid = false; }
  if (!email)                     { setFieldError(form, 'email',   'Por favor, informe seu email.');    valid = false; }
  else if (!EMAIL_REGEX.test(email)) { setFieldError(form, 'email', 'Email inválido.');                 valid = false; }
  if (!message)                   { setFieldError(form, 'message', 'Por favor, escreva uma mensagem.'); valid = false; }

  return valid;
}

function setSubmitLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('.btn-text').style.display    = loading ? 'none'   : 'inline';
  btn.querySelector('.btn-loading').style.display = loading ? 'inline' : 'none';
}

function showSuccess(successEl, durationMs = 5000) {
  successEl.style.display = 'block';
  setTimeout(() => { successEl.style.display = 'none'; }, durationMs);
}

export function initContactForm({ formId = 'contactForm', submitBtnId = 'submitBtn', successId = 'formSuccess' } = {}) {
  const form      = document.getElementById(formId);
  const submitBtn = document.getElementById(submitBtnId);
  const successEl = document.getElementById(successId);
  if (!form || !submitBtn || !successEl) return;

  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', () => clearFieldError(form, field.id));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm(form)) return;

    setSubmitLoading(submitBtn, true);

    setTimeout(() => {
      setSubmitLoading(submitBtn, false);
      form.reset();
      showSuccess(successEl);
    }, 1500);
  });
}
