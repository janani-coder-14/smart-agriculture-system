// Pure validation functions (no Express, no storage) so they are easy to unit test.
// Each validator returns an "errors" object: { fieldName: "message" }. Empty object = valid.

const MOBILE_LENGTH_RE = /^\d{10}$/;
const MOBILE_START_RE = /^[6-9]/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function validateName(value) {
  return text(value) === '' ? 'Full name is required' : null;
}

function validateMobile(value) {
  const mobile = text(value);
  if (mobile === '') return 'Mobile number is required';
  if (!MOBILE_LENGTH_RE.test(mobile)) return 'Mobile number must be exactly 10 digits';
  if (!MOBILE_START_RE.test(mobile)) return 'Mobile number must start with 6, 7, 8 or 9';
  return null;
}

// Email is optional: empty is fine, but if given it must look like an email.
function validateEmail(value) {
  const email = text(value);
  if (email === '') return null;
  return EMAIL_RE.test(email) ? null : 'Please enter a valid email address';
}

function validatePassword(value) {
  if (typeof value !== 'string' || value === '') return 'Password is required';
  if (value.length < 6) return 'Password must be at least 6 characters';
  return null;
}

function validateConfirmPassword(password, confirm) {
  if (typeof confirm !== 'string' || confirm === '') return 'Please confirm your password';
  return password === confirm ? null : 'Passwords do not match';
}

// Farm size is optional (acres). If given it must be a positive number.
function validateFarmSize(value) {
  const size = text(value);
  if (size === '') return null;
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return 'Farm size must be a positive number';
  return null;
}

function collect(pairs) {
  const errors = {};
  for (const [field, message] of pairs) {
    if (message) errors[field] = message;
  }
  return errors;
}

function validateRegistration(body) {
  const b = body || {};
  return collect([
    ['name', validateName(b.name)],
    ['mobile', validateMobile(b.mobile)],
    ['email', validateEmail(b.email)],
    ['password', validatePassword(b.password)],
    ['confirmPassword', validateConfirmPassword(b.password, b.confirmPassword)]
  ]);
}

function validateLogin(body) {
  const b = body || {};
  const errors = {};
  if (text(b.mobile) === '') errors.mobile = 'Mobile number is required';
  if (typeof b.password !== 'string' || b.password === '') errors.password = 'Password is required';
  return errors;
}

// Only fields that are present in the body are validated (partial updates allowed).
function validateProfileUpdate(body) {
  const b = body || {};
  const pairs = [];
  if (b.name !== undefined) pairs.push(['name', validateName(b.name)]);
  if (b.email !== undefined) pairs.push(['email', validateEmail(b.email)]);
  if (b.farmSize !== undefined) pairs.push(['farmSize', validateFarmSize(b.farmSize)]);
  return collect(pairs);
}

function validateAdminLogin(body) {
  const b = body || {};
  const errors = {};
  if (text(b.username) === '') errors.username = 'Username is required';
  if (typeof b.password !== 'string' || b.password === '') errors.password = 'Password is required';
  return errors;
}

module.exports = {
  text,
  validateName,
  validateMobile,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateFarmSize,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateAdminLogin
};
