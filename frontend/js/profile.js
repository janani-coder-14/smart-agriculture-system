// Farmer profile page: load profile, update profile, logout.

const form = document.getElementById('profile-form');
const farmerId = localStorage.getItem('farmerId');
const fields = ['name', 'mobile', 'email', 'location', 'farmSize', 'mainCrop'];

if (!farmerId) {
  window.location.href = 'index.html'; // not logged in
}

function fillForm(farmer) {
  fields.forEach((f) => (document.getElementById(f).value = farmer[f] || ''));
}

async function loadProfile() {
  try {
    const { status, data } = await api('GET', '/api/farmers/' + farmerId);
    if (status === 200) {
      fillForm(data.farmer);
    } else {
      // e.g. 404 after a server restart (in-memory data was cleared)
      localStorage.removeItem('farmerId');
      window.location.href = 'index.html';
    }
  } catch (err) {
    showMessage('form-message', 'Cannot reach the server. Is it running?', false);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors(form);
  hideMessage('form-message');

  const body = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    location: document.getElementById('location').value.trim(),
    farmSize: document.getElementById('farmSize').value.trim(),
    mainCrop: document.getElementById('mainCrop').value.trim()
  };

  const errors = {};
  ['name', 'email', 'farmSize'].forEach((f) => {
    const msg = rules[f](body[f]);
    if (msg) errors[f] = msg;
  });
  if (Object.keys(errors).length) return showFieldErrors(form, errors);

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  try {
    const { status, data } = await api('PUT', '/api/farmers/' + farmerId, body);
    if (status === 200) {
      fillForm(data.farmer);
      showMessage('form-message', data.message, true);
    } else {
      if (data.errors) showFieldErrors(form, data.errors);
      showMessage('form-message', data.message || 'Update failed', false);
    }
  } catch (err) {
    showMessage('form-message', 'Cannot reach the server. Is it running?', false);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('farmerId');
  window.location.href = 'index.html';
});

if (farmerId) loadProfile();
