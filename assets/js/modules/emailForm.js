const FORMSPREE_URL = 'https://formspree.io/f/xredqjjk';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setError(form, fieldId, msg) {
  const errEl = document.getElementById(fieldId + 'Error');
  const input = form.querySelector('#' + fieldId);
  if (errEl) errEl.textContent = msg;
  if (input) input.classList.add('error');
}

function clearError(form, fieldId) {
  const errEl = document.getElementById(fieldId + 'Error');
  const input = form.querySelector('#' + fieldId);
  if (errEl) errEl.textContent = '';
  if (input) input.classList.remove('error');
}

function validate(form) {
  let ok = true;
  ['name', 'email', 'message'].forEach(id => clearError(form, id));

  if (!form.user_name.value.trim())               { setError(form, 'name',    'Informe seu nome.');      ok = false; }
  if (!form.user_email.value.trim())              { setError(form, 'email',   'Informe seu email.');     ok = false; }
  else if (!EMAIL_RX.test(form.user_email.value)) { setError(form, 'email',   'Email inválido.');        ok = false; }
  if (!form.message.value.trim())                 { setError(form, 'message', 'Escreva uma mensagem.');  ok = false; }

  return ok;
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('.btn-text').style.display    = loading ? 'none'   : 'inline';
  btn.querySelector('.btn-loading').style.display = loading ? 'inline' : 'none';
}

export function initEmailForm(formId = 'contactForm') {
  const form = document.getElementById(formId);
  if (!form) return;

  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', () => {
      const id = field.name === 'user_name' ? 'name' : field.name === 'user_email' ? 'email' : field.name;
      clearError(form, id);
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate(form)) return;

    const btn     = document.getElementById('submitBtn');
    const success = document.getElementById('formSuccess');

    setLoading(btn, true);

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      });

      if (!res.ok) throw new Error('Formspree error');

      form.reset();
      success.style.display = 'block';
      setTimeout(() => { success.style.display = 'none'; }, 5000);
    } catch {
      setError(form, 'message', 'Erro ao enviar. Tente por email direto.');
    } finally {
      setLoading(btn, false);
    }
  });
}
