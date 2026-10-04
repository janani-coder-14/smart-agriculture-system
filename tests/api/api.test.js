// Functional / API tests. They start the real Express app on a random port and call it with fetch().
// Requires: npm install (express).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../../backend/app');
const { createService } = require('../../backend/service');

let server;
let base;
let farmerId;

const valid = {
  name: 'Ravi Kumar',
  mobile: '9876543210',
  email: 'ravi@example.com',
  password: 'secret1',
  confirmPassword: 'secret1'
};

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
}

test.before(async () => {
  server = createApp(createService()).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = 'http://127.0.0.1:' + server.address().port;
});

test.after(() => new Promise((r) => server.close(r)));

test('API 1: successful registration -> 201', async () => {
  const { status, data } = await call('POST', '/api/register', valid);
  assert.equal(status, 201);
  assert.match(data.message, /successful/i);
  assert.equal(data.farmer.name, 'Ravi Kumar');
  assert.equal(data.farmer.password, undefined);
  farmerId = data.farmer.id;
});

test('API 2: registration with empty name -> 400', async () => {
  const { status, data } = await call('POST', '/api/register', { ...valid, mobile: '9000000001', name: '' });
  assert.equal(status, 400);
  assert.equal(data.errors.name, 'Full name is required');
});

test('API 3: registration with invalid phone -> 400', async () => {
  const { status, data } = await call('POST', '/api/register', { ...valid, mobile: '12345' });
  assert.equal(status, 400);
  assert.ok(data.errors.mobile);
});

test('API 4: registration with short password -> 400', async () => {
  const { status, data } = await call('POST', '/api/register', {
    ...valid, mobile: '9000000002', password: '123', confirmPassword: '123'
  });
  assert.equal(status, 400);
  assert.ok(data.errors.password);
});

test('API 5: registration with mismatched password -> 400', async () => {
  const { status, data } = await call('POST', '/api/register', {
    ...valid, mobile: '9000000003', confirmPassword: 'other'
  });
  assert.equal(status, 400);
  assert.equal(data.errors.confirmPassword, 'Passwords do not match');
});

test('API 6: registration with invalid email -> 400', async () => {
  const { status, data } = await call('POST', '/api/register', {
    ...valid, mobile: '9000000004', email: 'bad-email'
  });
  assert.equal(status, 400);
  assert.ok(data.errors.email);
});

test('API 7: duplicate phone number -> 409', async () => {
  const { status, data } = await call('POST', '/api/register', valid);
  assert.equal(status, 409);
  assert.ok(data.message);
});

test('API 8: successful login -> 200', async () => {
  const { status, data } = await call('POST', '/api/login', { mobile: valid.mobile, password: valid.password });
  assert.equal(status, 200);
  assert.equal(data.message, 'Login successful');
  assert.equal(data.farmer.id, farmerId);
  assert.equal(data.farmer.passwordHash, undefined);
});

test('API 9: login with wrong password -> 401', async () => {
  const { status, data } = await call('POST', '/api/login', { mobile: valid.mobile, password: 'wrong' });
  assert.equal(status, 401);
  assert.ok(data.message);
});

test('API 10: login with unknown phone -> 401', async () => {
  const { status, data } = await call('POST', '/api/login', { mobile: '9111111111', password: 'secret1' });
  assert.equal(status, 401);
  assert.ok(data.message);
});

test('API 11: get existing farmer -> 200', async () => {
  const { status, data } = await call('GET', '/api/farmers/' + farmerId);
  assert.equal(status, 200);
  assert.equal(data.farmer.mobile, valid.mobile);
  assert.equal(data.farmer.password, undefined);
});

test('API 12: get non-existing farmer -> 404', async () => {
  const { status, data } = await call('GET', '/api/farmers/9999');
  assert.equal(status, 404);
  assert.equal(data.message, 'Farmer not found');
});

test('API 13: successful profile update -> 200 and persisted', async () => {
  const update = { name: 'Ravi K', email: 'ravik@example.com', location: 'Coimbatore', farmSize: '4', mainCrop: 'Rice' };
  const { status, data } = await call('PUT', '/api/farmers/' + farmerId, update);
  assert.equal(status, 200);
  assert.equal(data.message, 'Profile updated successfully');
  assert.equal(data.farmer.location, 'Coimbatore');
  const login = await call('POST', '/api/login', { mobile: valid.mobile, password: valid.password });
  assert.equal(login.data.farmer.mainCrop, 'Rice');
});

test('API 14: profile update with invalid email -> 400', async () => {
  const { status, data } = await call('PUT', '/api/farmers/' + farmerId, { name: 'Ravi K', email: 'bad' });
  assert.equal(status, 400);
  assert.ok(data.errors.email);
});

test('API 15: successful admin login -> 200', async () => {
  const { status, data } = await call('POST', '/api/admin/login', { username: 'admin', password: 'admin123' });
  assert.equal(status, 200);
  assert.equal(data.message, 'Admin login successful');
});

test('API 16: admin login with wrong password -> 401', async () => {
  const { status, data } = await call('POST', '/api/admin/login', { username: 'admin', password: 'wrong' });
  assert.equal(status, 401);
  assert.ok(data.message);
});

test('API 17: admin login with missing username/password -> 400', async () => {
  const { status, data } = await call('POST', '/api/admin/login', {});
  assert.equal(status, 400);
  assert.ok(data.errors.username);
  assert.ok(data.errors.password);
});

test('API extra: unknown API route -> 404 JSON', async () => {
  const { status, data } = await call('GET', '/api/nothing');
  assert.equal(status, 404);
  assert.ok(data.message);
});
