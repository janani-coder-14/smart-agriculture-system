// Helpers shared by all pages.

// Show / hide password buttons: <button class="toggle-pw" data-target="inputId">
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.toggle-pw');
  if (!btn) return;
  const input = document.getElementById(btn.dataset.target);
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.textContent = show ? 'Hide' : 'Show';
  btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});

// Error text goes in <span class="error" id="err-<field>"> directly below each input.
function clearErrors(form) {
  form.querySelectorAll('.error').forEach((el) => (el.textContent = ''));
  form.querySelectorAll('input, select').forEach((el) => el.classList.remove('invalid'));
}

function showFieldErrors(form, errors) {
  Object.keys(errors).forEach((field) => {
    const span = form.querySelector('#err-' + field);
    const input = form.querySelector('#' + field);
    if (span) span.textContent = errors[field];
    if (input) input.classList.add('invalid');
  });
}

function showMessage(id, text, ok) {
  const box = document.getElementById(id);
  box.textContent = text;
  box.className = 'message ' + (ok ? 'success' : 'fail');
}

function hideMessage(id) {
  const box = document.getElementById(id);
  box.textContent = '';
  box.className = 'message';
}

// fetch() wrapper: always resolves to { status, data } (data is the parsed JSON body).
async function api(method, url, body) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  let data = {};
  try { data = await res.json(); } catch (e) { /* non-JSON body */ }
  return { status: res.status, data };
}

// Same rules as the backend, used for instant feedback before sending the request.
const rules = {
  name: (v) => (v.trim() === '' ? 'Full name is required' : ''),
  mobile: (v) => {
    v = v.trim();
    if (v === '') return 'Mobile number is required';
    if (!/^\d{10}$/.test(v)) return 'Mobile number must be exactly 10 digits';
    if (!/^[6-9]/.test(v)) return 'Mobile number must start with 6, 7, 8 or 9';
    return '';
  },
  email: (v) => {
    v = v.trim();
    if (v === '') return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address';
  },
  password: (v) => {
    if (v === '') return 'Password is required';
    return v.length < 6 ? 'Password must be at least 6 characters' : '';
  },
  farmSize: (v) => {
    v = v.trim();
    if (v === '') return '';
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? '' : 'Farm size must be a positive number';
  }
};
