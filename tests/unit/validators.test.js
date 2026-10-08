const test = require('node:test');
const assert = require('node:assert/strict');

const {
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
} = require('../../backend/validators');


// =========================================
// TEXT
// =========================================

test('VALIDATOR 1: text converts value to trimmed string', () => {

  assert.equal(
    text('  Ravi Kumar  '),
    'Ravi Kumar'
  );

});


test('VALIDATOR 2: text converts null and undefined to empty string', () => {

  assert.equal(text(null), '');
  assert.equal(text(undefined), '');

});


// =========================================
// NAME
// =========================================

test('VALIDATOR 3: valid name returns null', () => {

  assert.equal(
    validateName('Ravi Kumar'),
    null
  );

});


test('VALIDATOR 4: empty name returns error', () => {

  assert.equal(
    validateName(''),
    'Full name is required'
  );

});


test('VALIDATOR 5: whitespace-only name returns error', () => {

  assert.equal(
    validateName('   '),
    'Full name is required'
  );

});


// =========================================
// MOBILE
// =========================================

test('VALIDATOR 6: valid mobile number returns null', () => {

  assert.equal(
    validateMobile('9876543210'),
    null
  );

});


test('VALIDATOR 7: empty mobile returns required error', () => {

  assert.equal(
    validateMobile(''),
    'Mobile number is required'
  );

});


test('VALIDATOR 8: mobile with less than 10 digits is rejected', () => {

  assert.equal(
    validateMobile('987654321'),
    'Mobile number must be exactly 10 digits'
  );

});


test('VALIDATOR 9: mobile with more than 10 digits is rejected', () => {

  assert.equal(
    validateMobile('98765432101'),
    'Mobile number must be exactly 10 digits'
  );

});


test('VALIDATOR 10: mobile starting with 5 is rejected', () => {

  assert.equal(
    validateMobile('5876543210'),
    'Mobile number must start with 6, 7, 8 or 9'
  );

});


test('VALIDATOR 11: mobile containing letters is rejected', () => {

  assert.equal(
    validateMobile('98765abc10'),
    'Mobile number must be exactly 10 digits'
  );

});


test('VALIDATOR 12: mobile starting with 6 is valid', () => {

  assert.equal(
    validateMobile('6876543210'),
    null
  );

});


// =========================================
// EMAIL
// =========================================

test('VALIDATOR 13: valid email returns null', () => {

  assert.equal(
    validateEmail('ravi@example.com'),
    null
  );

});


test('VALIDATOR 14: empty email is allowed', () => {

  assert.equal(
    validateEmail(''),
    null
  );

});


test('VALIDATOR 15: invalid email returns error', () => {

  assert.equal(
    validateEmail('bad-email'),
    'Please enter a valid email address'
  );

});


test('VALIDATOR 16: email without domain is rejected', () => {

  assert.equal(
    validateEmail('ravi@'),
    'Please enter a valid email address'
  );

});


// =========================================
// PASSWORD
// =========================================

test('VALIDATOR 17: valid password returns null', () => {

  assert.equal(
    validatePassword('secret1'),
    null
  );

});


test('VALIDATOR 18: empty password is rejected', () => {

  assert.equal(
    validatePassword(''),
    'Password is required'
  );

});


test('VALIDATOR 19: password shorter than 6 characters is rejected', () => {

  assert.equal(
    validatePassword('12345'),
    'Password must be at least 6 characters'
  );

});


test('VALIDATOR 20: six-character password is valid', () => {

  assert.equal(
    validatePassword('123456'),
    null
  );

});


test('VALIDATOR 21: non-string password is rejected', () => {

  assert.equal(
    validatePassword(123456),
    'Password is required'
  );

});


// =========================================
// CONFIRM PASSWORD
// =========================================

test('VALIDATOR 22: matching passwords return null', () => {

  assert.equal(
    validateConfirmPassword(
      'secret1',
      'secret1'
    ),
    null
  );

});


test('VALIDATOR 23: mismatched passwords are rejected', () => {

  assert.equal(
    validateConfirmPassword(
      'secret1',
      'different'
    ),
    'Passwords do not match'
  );

});


test('VALIDATOR 24: empty confirmation password is rejected', () => {

  assert.equal(
    validateConfirmPassword(
      'secret1',
      ''
    ),
    'Please confirm your password'
  );

});


// =========================================
// FARM SIZE
// =========================================

test('VALIDATOR 25: empty farm size is allowed', () => {

  assert.equal(
    validateFarmSize(''),
    null
  );

});


test('VALIDATOR 26: positive farm size is valid', () => {

  assert.equal(
    validateFarmSize('4'),
    null
  );

});


test('VALIDATOR 27: decimal farm size is valid', () => {

  assert.equal(
    validateFarmSize('2.5'),
    null
  );

});


test('VALIDATOR 28: zero farm size is rejected', () => {

  assert.equal(
    validateFarmSize('0'),
    'Farm size must be a positive number'
  );

});


test('VALIDATOR 29: negative farm size is rejected', () => {

  assert.equal(
    validateFarmSize('-2'),
    'Farm size must be a positive number'
  );

});


test('VALIDATOR 30: non-numeric farm size is rejected', () => {

  assert.equal(
    validateFarmSize('abc'),
    'Farm size must be a positive number'
  );

});


// =========================================
// REGISTRATION VALIDATION
// =========================================

test('VALIDATOR 31: valid registration returns no errors', () => {

  const errors =
    validateRegistration({
      name: 'Ravi Kumar',
      mobile: '9876543210',
      email: 'ravi@example.com',
      password: 'secret1',
      confirmPassword: 'secret1'
    });

  assert.deepEqual(
    errors,
    {}
  );

});


test('VALIDATOR 32: invalid registration returns field errors', () => {

  const errors =
    validateRegistration({
      name: '',
      mobile: '12345',
      email: 'bad-email',
      password: '123',
      confirmPassword: '456'
    });

  assert.ok(errors.name);
  assert.ok(errors.mobile);
  assert.ok(errors.email);
  assert.ok(errors.password);
  assert.ok(errors.confirmPassword);

});


test('VALIDATOR 33: missing registration body returns errors', () => {

  const errors =
    validateRegistration();

  assert.ok(errors.name);
  assert.ok(errors.mobile);
  assert.ok(errors.password);
  assert.ok(errors.confirmPassword);

});


// =========================================
// LOGIN VALIDATION
// =========================================

test('VALIDATOR 34: valid login returns no errors', () => {

  const errors =
    validateLogin({
      mobile: '9876543210',
      password: 'secret1'
    });

  assert.deepEqual(
    errors,
    {}
  );

});


test('VALIDATOR 35: login with missing mobile returns error', () => {

  const errors =
    validateLogin({
      password: 'secret1'
    });

  assert.equal(
    errors.mobile,
    'Mobile number is required'
  );

});


test('VALIDATOR 36: login with missing password returns error', () => {

  const errors =
    validateLogin({
      mobile: '9876543210'
    });

  assert.equal(
    errors.password,
    'Password is required'
  );

});


test('VALIDATOR 37: empty login body returns both errors', () => {

  const errors =
    validateLogin({});

  assert.equal(
    errors.mobile,
    'Mobile number is required'
  );

  assert.equal(
    errors.password,
    'Password is required'
  );

});


// =========================================
// PROFILE UPDATE VALIDATION
// =========================================

test('VALIDATOR 38: valid profile update returns no errors', () => {

  const errors =
    validateProfileUpdate({
      name: 'Ravi K',
      email: 'ravik@example.com',
      farmSize: '4'
    });

  assert.deepEqual(
    errors,
    {}
  );

});


test('VALIDATOR 39: invalid profile email returns error', () => {

  const errors =
    validateProfileUpdate({
      name: 'Ravi K',
      email: 'bad-email'
    });

  assert.equal(
    errors.email,
    'Please enter a valid email address'
  );

});


test('VALIDATOR 40: invalid farm size returns error', () => {

  const errors =
    validateProfileUpdate({
      farmSize: '-5'
    });

  assert.equal(
    errors.farmSize,
    'Farm size must be a positive number'
  );

});


test('VALIDATOR 41: partial profile update is allowed', () => {

  const errors =
    validateProfileUpdate({
      name: 'Ravi K'
    });

  assert.deepEqual(
    errors,
    {}
  );

});


test('VALIDATOR 42: empty profile update is valid', () => {

  const errors =
    validateProfileUpdate({});

  assert.deepEqual(
    errors,
    {}
  );

});


// =========================================
// ADMIN LOGIN VALIDATION
// =========================================

test('VALIDATOR 43: valid admin login returns no errors', () => {

  const errors =
    validateAdminLogin({
      username: 'admin',
      password: 'admin123'
    });

  assert.deepEqual(
    errors,
    {}
  );

});


test('VALIDATOR 44: missing admin username returns error', () => {

  const errors =
    validateAdminLogin({
      password: 'admin123'
    });

  assert.equal(
    errors.username,
    'Username is required'
  );

});


test('VALIDATOR 45: missing admin password returns error', () => {

  const errors =
    validateAdminLogin({
      username: 'admin'
    });

  assert.equal(
    errors.password,
    'Password is required'
  );

});


test('VALIDATOR 46: empty admin login returns both errors', () => {

  const errors =
    validateAdminLogin({});

  assert.equal(
    errors.username,
    'Username is required'
  );

  assert.equal(
    errors.password,
    'Password is required'
  );

});