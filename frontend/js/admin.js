// Admin login page. Credentials are checked by the backend (POST /api/admin/login).
// Sprint 1 limitation: the "logged in" state is kept in sessionStorage only (no server session/token yet).

const adminForm = document.getElementById('admin-form');
const panel = document.getElementById('admin-panel');

function showPanel(username) {
  adminForm.style.display = 'none';
  panel.style.display = 'block';
  document.getElementById('admin-name').textContent = username;
}

const savedAdmin = sessionStorage.getItem('adminUser');
if (savedAdmin) showPanel(savedAdmin);

adminForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors(adminForm);
  hideMessage('form-message');

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  const errors = {};
  if (username === '') errors.username = 'Username is required';
  if (password === '') errors.password = 'Password is required';
  if (Object.keys(errors).length) return showFieldErrors(adminForm, errors);

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  try {
    const { status, data } = await api('POST', '/api/admin/login', { username, password });
    if (status === 200) {
      sessionStorage.setItem('adminUser', data.admin.username);
      showMessage('form-message', data.message, true);
      showPanel(data.admin.username);
    } else {
      if (data.errors) showFieldErrors(adminForm, data.errors);
      showMessage('form-message', data.message || 'Admin login failed', false);
    }
  } catch (err) {
    showMessage('form-message', 'Cannot reach the server. Is it running?', false);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('admin-logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('adminUser');
  window.location.reload();
});
