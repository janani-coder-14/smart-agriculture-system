const test = require('node:test');
const assert = require('node:assert/strict');

const { createService } = require('../../backend/service');


// =========================================
// TEST DATA
// =========================================

const validFarmer = {
  name: 'Ravi Kumar',
  mobile: '9876543210',
  email: 'ravi@example.com',
  password: 'secret1',
  confirmPassword: 'secret1'
};


// =========================================
// REGISTRATION TESTS
// =========================================

test('UNIT 1: register valid farmer', () => {

  const service = createService();

  const result = service.register(validFarmer);

  assert.equal(result.status, 201);

  assert.equal(
    result.body.farmer.name,
    'Ravi Kumar'
  );

  assert.equal(
    result.body.farmer.mobile,
    '9876543210'
  );

  // Password must not be exposed
  assert.equal(
    result.body.farmer.password,
    undefined
  );

  assert.equal(
    result.body.farmer.passwordHash,
    undefined
  );

});


test('UNIT 2: register duplicate mobile number', () => {

  const service = createService();

  service.register(validFarmer);

  const result =
    service.register(validFarmer);

  assert.equal(result.status, 409);

  assert.equal(
    result.body.message,
    'This mobile number is already registered'
  );

});


test('UNIT 3: register invalid farmer data', () => {

  const service = createService();

  const result =
    service.register({
      ...validFarmer,
      name: '',
      mobile: '12345'
    });

  assert.equal(result.status, 400);

  assert.ok(result.body.errors);

});


// =========================================
// LOGIN TESTS
// =========================================

test('UNIT 4: login with correct credentials', () => {

  const service = createService();

  service.register(validFarmer);

  const result =
    service.login({
      mobile: validFarmer.mobile,
      password: validFarmer.password
    });

  assert.equal(result.status, 200);

  assert.equal(
    result.body.message,
    'Login successful'
  );

  assert.equal(
    result.body.farmer.mobile,
    validFarmer.mobile
  );

});


test('UNIT 5: login with wrong password', () => {

  const service = createService();

  service.register(validFarmer);

  const result =
    service.login({
      mobile: validFarmer.mobile,
      password: 'wrongpassword'
    });

  assert.equal(result.status, 401);

  assert.equal(
    result.body.message,
    'Invalid mobile number or password'
  );

});


test('UNIT 6: login with unknown mobile number', () => {

  const service = createService();

  service.register(validFarmer);

  const result =
    service.login({
      mobile: '9111111111',
      password: validFarmer.password
    });

  assert.equal(result.status, 401);

  assert.equal(
    result.body.message,
    'Invalid mobile number or password'
  );

});


test('UNIT 7: login with missing credentials', () => {

  const service = createService();

  const result =
    service.login({});

  assert.equal(result.status, 400);

  assert.ok(
    result.body.errors
  );

});


// =========================================
// GET FARMER TESTS
// =========================================

test('UNIT 8: get existing farmer', () => {

  const service = createService();

  const registration =
    service.register(validFarmer);

  const farmerId =
    registration.body.farmer.id;

  const result =
    service.getFarmer(farmerId);

  assert.equal(result.status, 200);

  assert.equal(
    result.body.farmer.name,
    'Ravi Kumar'
  );

  assert.equal(
    result.body.farmer.mobile,
    validFarmer.mobile
  );

});


test('UNIT 9: get non-existing farmer', () => {

  const service = createService();

  const result =
    service.getFarmer(9999);

  assert.equal(result.status, 404);

  assert.equal(
    result.body.message,
    'Farmer not found'
  );

});


test('UNIT 10: get farmer does not expose password data', () => {

  const service = createService();

  const registration =
    service.register(validFarmer);

  const farmerId =
    registration.body.farmer.id;

  const result =
    service.getFarmer(farmerId);

  assert.equal(result.status, 200);

  assert.equal(
    result.body.farmer.password,
    undefined
  );

  assert.equal(
    result.body.farmer.passwordHash,
    undefined
  );

  assert.equal(
    result.body.farmer.passwordSalt,
    undefined
  );

});


// =========================================
// UPDATE FARMER TESTS
// =========================================

test('UNIT 11: update farmer profile', () => {

  const service = createService();

  const registration =
    service.register(validFarmer);

  const farmerId =
    registration.body.farmer.id;

  const result =
    service.updateFarmer(
      farmerId,
      {
        name: 'Ravi K',
        email: 'ravik@example.com',
        location: 'Coimbatore',
        farmSize: '4',
        mainCrop: 'Rice'
      }
    );

  assert.equal(result.status, 200);

  assert.equal(
    result.body.message,
    'Profile updated successfully'
  );

  assert.equal(
    result.body.farmer.name,
    'Ravi K'
  );

  assert.equal(
    result.body.farmer.location,
    'Coimbatore'
  );

  assert.equal(
    result.body.farmer.farmSize,
    '4'
  );

  assert.equal(
    result.body.farmer.mainCrop,
    'Rice'
  );

});


test('UNIT 12: update non-existing farmer', () => {

  const service = createService();

  const result =
    service.updateFarmer(
      9999,
      {
        name: 'Unknown Farmer',
        email: 'unknown@example.com'
      }
    );

  assert.equal(result.status, 404);

  assert.equal(
    result.body.message,
    'Farmer not found'
  );

});


test('UNIT 13: update farmer with invalid email', () => {

  const service = createService();

  const registration =
    service.register(validFarmer);

  const farmerId =
    registration.body.farmer.id;

  const result =
    service.updateFarmer(
      farmerId,
      {
        name: 'Ravi K',
        email: 'bad-email'
      }
    );

  assert.equal(result.status, 400);

  assert.ok(
    result.body.errors.email
  );

});


test('UNIT 14: update farmer with empty name', () => {

  const service = createService();

  const registration =
    service.register(validFarmer);

  const farmerId =
    registration.body.farmer.id;

  const result =
    service.updateFarmer(
      farmerId,
      {
        name: '',
        email: 'ravik@example.com'
      }
    );

  assert.equal(result.status, 400);

  assert.ok(
    result.body.errors.name
  );

});


test('UNIT 15: update does not change mobile number', () => {

  const service = createService();

  const registration =
    service.register(validFarmer);

  const farmerId =
    registration.body.farmer.id;

  service.updateFarmer(
    farmerId,
    {
      name: 'Ravi K',
      mobile: '9000000000',
      email: 'new@example.com'
    }
  );

  const result =
    service.getFarmer(farmerId);

  assert.equal(result.status, 200);

  // service.js explicitly prevents mobile updates
  assert.equal(
    result.body.farmer.mobile,
    '9876543210'
  );

});


// =========================================
// ADMIN LOGIN TESTS
// =========================================

test('UNIT 16: admin login with correct credentials', () => {

  const service = createService();

  const result =
    service.adminLogin({
      username: 'admin',
      password: 'admin123'
    });

  assert.equal(result.status, 200);

  assert.equal(
    result.body.message,
    'Admin login successful'
  );

  assert.equal(
    result.body.admin.username,
    'admin'
  );

});


test('UNIT 17: admin login with wrong password', () => {

  const service = createService();

  const result =
    service.adminLogin({
      username: 'admin',
      password: 'wrong'
    });

  assert.equal(result.status, 401);

  assert.equal(
    result.body.message,
    'Invalid admin username or password'
  );

});


test('UNIT 18: admin login with wrong username', () => {

  const service = createService();

  const result =
    service.adminLogin({
      username: 'wrongadmin',
      password: 'admin123'
    });

  assert.equal(result.status, 401);

});


test('UNIT 19: admin login with missing credentials', () => {

  const service = createService();

  const result =
    service.adminLogin({});

  assert.equal(result.status, 400);

  assert.ok(
    result.body.errors
  );

});


// =========================================
// CUSTOM ADMIN CREDENTIALS
// =========================================

test('UNIT 20: admin login supports custom credentials', () => {

  const service =
    createService({
      adminUsername: 'superadmin',
      adminPassword: 'secure123'
    });

  const result =
    service.adminLogin({
      username: 'superadmin',
      password: 'secure123'
    });

  assert.equal(result.status, 200);

  assert.equal(
    result.body.admin.username,
    'superadmin'
  );

});