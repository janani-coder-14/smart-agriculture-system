const test = require('node:test');
const assert = require('node:assert/strict');
const v = require('../../backend/validators');

test('validateMobile accepts valid numbers starting with 6-9', () => {
  for (const n of ['6123456789', '7123456789', '8123456789', '9876543210']) {
    assert.equal(v.validateMobile(n), null);
  }
});

test('validateMobile rejects empty, short, long, non-digit and wrong-start numbers', () => {
  assert.equal(v.validateMobile(''), 'Mobile number is required');
  assert.equal(v.validateMobile('98765'), 'Mobile number must be exactly 10 digits');
  assert.equal(v.validateMobile('98765432101'), 'Mobile number must be exactly 10 digits');
  assert.equal(v.validateMobile('98765abcde'), 'Mobile number must be exactly 10 digits');
  assert.equal(v.validateMobile('5123456789'), 'Mobile number must start with 6, 7, 8 or 9');
});

test('validateName rejects empty and whitespace-only names', () => {
  assert.equal(v.validateName(''), 'Full name is required');
  assert.equal(v.validateName('   '), 'Full name is required');
  assert.equal(v.validateName('Ravi Kumar'), null);
});

test('validateEmail is optional but must be valid when given', () => {
  assert.equal(v.validateEmail(''), null);
  assert.equal(v.validateEmail(undefined), null);
  assert.equal(v.validateEmail('ravi@example.com'), null);
  assert.equal(v.validateEmail('not-an-email'), 'Please enter a valid email address');
  assert.equal(v.validateEmail('a@b'), 'Please enter a valid email address');
});

test('validatePassword requires at least 6 characters', () => {
  assert.equal(v.validatePassword(''), 'Password is required');
  assert.equal(v.validatePassword('12345'), 'Password must be at least 6 characters');
  assert.equal(v.validatePassword('123456'), null);
});

test('validateConfirmPassword must match', () => {
  assert.equal(v.validateConfirmPassword('secret1', 'secret1'), null);
  assert.equal(v.validateConfirmPassword('secret1', 'secret2'), 'Passwords do not match');
  assert.equal(v.validateConfirmPassword('secret1', ''), 'Please confirm your password');
});

test('validateFarmSize is optional and must be a positive number', () => {
  assert.equal(v.validateFarmSize(''), null);
  assert.equal(v.validateFarmSize('2.5'), null);
  assert.equal(v.validateFarmSize('abc'), 'Farm size must be a positive number');
  assert.equal(v.validateFarmSize('-1'), 'Farm size must be a positive number');
  assert.equal(v.validateFarmSize('0'), 'Farm size must be a positive number');
});

test('validateRegistration returns errors keyed by field', () => {
  const errors = v.validateRegistration({
    name: '', mobile: '123', email: 'bad', password: '123', confirmPassword: '999'
  });
  assert.deepEqual(Object.keys(errors).sort(), ['confirmPassword', 'email', 'mobile', 'name', 'password']);
  assert.deepEqual(
    v.validateRegistration({ name: 'A', mobile: '9876543210', password: 'secret1', confirmPassword: 'secret1' }),
    {}
  );
});

test('validateRegistration handles a missing body', () => {
  assert.ok(Object.keys(v.validateRegistration(undefined)).length > 0);
});
