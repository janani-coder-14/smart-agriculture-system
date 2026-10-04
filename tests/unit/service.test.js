const test = require('node:test');
const assert = require('node:assert/strict');
const { createService } = require('../../backend/service');

const valid = {
  name: 'Ravi Kumar',
  mobile: '9876543210',
  email: 'ravi@example.com',
  password: 'secret1',
  confirmPassword: 'secret1'
};

function fresh() {
  return createService();
}

// ---- Registration ----
test('register: valid input returns 201 and no password data', () => {
  const r = fresh().register(valid);
  assert.equal(r.status, 201);
  assert.equal(r.body.farmer.name, 'Ravi Kumar');
  assert.equal(r.body.farmer.mobile, '9876543210');
  assert.equal(r.body.farmer.password, undefined);
  assert.equal(r.body.farmer.passwordHash, undefined);
  assert.equal(r.body.farmer.passwordSalt, undefined);
});

test('register: email is optional', () => {
  const r = fresh().register({ ...valid, email: '' });
  assert.equal(r.status, 201);
});

test('register: empty name returns 400 with name error', () => {
  const r = fresh().register({ ...valid, name: '' });
  assert.equal(r.status, 400);
  assert.equal(r.body.errors.name, 'Full name is required');
});

test('register: invalid phone returns 400 with mobile error', () => {
  const r = fresh().register({ ...valid, mobile: '12345' });
  assert.equal(r.status, 400);
  assert.ok(r.body.errors.mobile);
});

test('register: short password returns 400', () => {
  const r = fresh().register({ ...valid, password: '123', confirmPassword: '123' });
  assert.equal(r.status, 400);
  assert.ok(r.body.errors.password);
});

test('register: mismatched confirm password returns 400', () => {
  const r = fresh().register({ ...valid, confirmPassword: 'different' });
  assert.equal(r.status, 400);
  assert.equal(r.body.errors.confirmPassword, 'Passwords do not match');
});

test('register: invalid email returns 400', () => {
  const r = fresh().register({ ...valid, email: 'bad-email' });
  assert.equal(r.status, 400);
  assert.ok(r.body.errors.email);
});

test('register: duplicate mobile returns 409', () => {
  const s = fresh();
  s.register(valid);
  const r = s.register({ ...valid, name: 'Someone Else' });
  assert.equal(r.status, 409);
  assert.ok(r.body.message);
});

// ---- Login ----
test('login: valid credentials return 200 with farmer', () => {
  const s = fresh();
  s.register(valid);
  const r = s.login({ mobile: valid.mobile, password: valid.password });
  assert.equal(r.status, 200);
  assert.equal(r.body.farmer.mobile, valid.mobile);
  assert.equal(r.body.farmer.passwordHash, undefined);
});

test('login: wrong password returns 401', () => {
  const s = fresh();
  s.register(valid);
  const r = s.login({ mobile: valid.mobile, password: 'wrongpass' });
  assert.equal(r.status, 401);
  assert.equal(r.body.message, 'Invalid mobile number or password');
});

test('login: unknown mobile returns 401', () => {
  const r = fresh().login({ mobile: '9000000000', password: 'secret1' });
  assert.equal(r.status, 401);
});

test('login: missing fields return 400', () => {
  const r = fresh().login({});
  assert.equal(r.status, 400);
  assert.ok(r.body.errors.mobile);
  assert.ok(r.body.errors.password);
});

// ---- Profile ----
test('getFarmer: existing farmer returns 200', () => {
  const s = fresh();
  const id = s.register(valid).body.farmer.id;
  const r = s.getFarmer(id);
  assert.equal(r.status, 200);
  assert.equal(r.body.farmer.name, 'Ravi Kumar');
});

test('getFarmer: unknown id returns 404', () => {
  const r = fresh().getFarmer(999);
  assert.equal(r.status, 404);
  assert.equal(r.body.message, 'Farmer not found');
});

test('updateFarmer: valid update returns 200 and is persisted', () => {
  const s = fresh();
  const id = s.register(valid).body.farmer.id;
  const r = s.updateFarmer(id, {
    name: 'Ravi K', email: 'new@example.com', location: 'Coimbatore', farmSize: '3.5', mainCrop: 'Rice'
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.farmer.location, 'Coimbatore');
  const again = s.login({ mobile: valid.mobile, password: valid.password });
  assert.equal(again.body.farmer.name, 'Ravi K');
  assert.equal(again.body.farmer.mainCrop, 'Rice');
});

test('updateFarmer: mobile number cannot be changed', () => {
  const s = fresh();
  const id = s.register(valid).body.farmer.id;
  s.updateFarmer(id, { name: 'Ravi', mobile: '9111111111' });
  assert.equal(s.getFarmer(id).body.farmer.mobile, valid.mobile);
});

test('updateFarmer: invalid email returns 400 and does not change data', () => {
  const s = fresh();
  const id = s.register(valid).body.farmer.id;
  const r = s.updateFarmer(id, { name: 'Ravi', email: 'bad' });
  assert.equal(r.status, 400);
  assert.ok(r.body.errors.email);
  assert.equal(s.getFarmer(id).body.farmer.email, 'ravi@example.com');
});

test('updateFarmer: empty name returns 400', () => {
  const s = fresh();
  const id = s.register(valid).body.farmer.id;
  assert.equal(s.updateFarmer(id, { name: '' }).status, 400);
});

test('updateFarmer: unknown id returns 404', () => {
  assert.equal(fresh().updateFarmer(42, { name: 'X' }).status, 404);
});

// ---- Admin ----
test('adminLogin: correct credentials return 200', () => {
  const r = fresh().adminLogin({ username: 'admin', password: 'admin123' });
  assert.equal(r.status, 200);
  assert.equal(r.body.admin.username, 'admin');
});

test('adminLogin: wrong password returns 401', () => {
  assert.equal(fresh().adminLogin({ username: 'admin', password: 'nope' }).status, 401);
});

test('adminLogin: missing fields return 400', () => {
  const r = fresh().adminLogin({});
  assert.equal(r.status, 400);
  assert.ok(r.body.errors.username);
  assert.ok(r.body.errors.password);
});

// ---- Persistence ----
test('persistence: registered farmer and profile update survive a "restart"', () => {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-'));
  const dataFile = path.join(dir, 'farmers.json');

  const first = createService({ dataFile });
  const id = first.register(valid).body.farmer.id;
  first.updateFarmer(id, { name: 'Ravi K', location: 'Coimbatore', mainCrop: 'Rice' });

  const second = createService({ dataFile }); // new service = server restarted
  const login = second.login({ mobile: valid.mobile, password: valid.password });
  assert.equal(login.status, 200);
  assert.equal(login.body.farmer.name, 'Ravi K');
  assert.equal(login.body.farmer.location, 'Coimbatore');
  assert.equal(login.body.farmer.mainCrop, 'Rice');
  // ids keep increasing after restart
  const other = second.register({ ...valid, mobile: '9123456780' });
  assert.equal(other.body.farmer.id, id + 1);
  fs.rmSync(dir, { recursive: true, force: true });
});
