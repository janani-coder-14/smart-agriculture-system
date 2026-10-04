// Handles the farmer login form (index.html) and registration form (register.html).

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(loginForm);
    hideMessage('form-message');

    const mobile = document.getElementById('mobile').value;
    const password = document.getElementById('password').value;

    const errors = {};
    if (mobile.trim() === '') errors.mobile = 'Mobile number is required';
    if (password === '') errors.password = 'Password is required';
    if (Object.keys(errors).length) return showFieldErrors(loginForm, errors);

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    try {
      const { status, data } = await api('POST', '/api/login', { mobile: mobile.trim(), password });
      if (status === 200) {
        localStorage.setItem('farmerId', data.farmer.id);
        window.location.href = 'profile.html';
      } else {
        if (data.errors) showFieldErrors(loginForm, data.errors);
        showMessage('form-message', data.message || 'Login failed', false);
      }
    } catch (err) {
      showMessage('form-message', 'Cannot reach the server. Is it running?', false);
    } finally {
      btn.disabled = false;
    }
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(registerForm);
    hideMessage('form-message');

    const values = {
      name: document.getElementById('name').value,
      mobile: document.getElementById('mobile').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      confirmPassword: document.getElementById('confirmPassword').value
    };

    const errors = {};
    ['name', 'mobile', 'email', 'password'].forEach((f) => {
      const msg = rules[f](values[f]);
      if (msg) errors[f] = msg;
    });
    if (values.confirmPassword === '') errors.confirmPassword = 'Please confirm your password';
    else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match';
    if (Object.keys(errors).length) return showFieldErrors(registerForm, errors);

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    try {
      const { status, data } = await api('POST', '/api/register', {
        name: values.name.trim(),
        mobile: values.mobile.trim(),
        email: values.email.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword
      });
      if (status === 201) {
        registerForm.reset();
        showMessage('form-message', data.message + ' Redirecting to login...', true);
        setTimeout(() => (window.location.href = 'index.html'), 2000);
      } else {
        if (data.errors) showFieldErrors(registerForm, data.errors);
        showMessage('form-message', data.message || 'Registration failed', false);
      }
    } catch (err) {
      showMessage('form-message', 'Cannot reach the server. Is it running?', false);
    } finally {
      btn.disabled = false;
    }
  });
}
