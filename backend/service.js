// Business logic for Sprint 1.
//
// NOTE: Farmers are kept in an array in memory. If options.dataFile is given (server.js does this),
// the array is also saved to that JSON file after every change and loaded again on start, so data
// survives server restarts. Without dataFile (used in tests) data is memory-only.
// A real database will replace this file storage in a later sprint.
//
// Every method returns { status, body } so it can be unit tested without Express.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const v = require('./validators');

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 32).toString('hex');
  return { salt: s, hash };
}

function passwordMatches(password, salt, expectedHash) {
  const actual = Buffer.from(hashPassword(password, salt).hash, 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// Removes password data before a farmer is sent to the client.
function publicFarmer(f) {
  return {
    id: f.id,
    name: f.name,
    mobile: f.mobile,
    email: f.email,
    location: f.location,
    farmSize: f.farmSize,
    mainCrop: f.mainCrop,
    createdAt: f.createdAt
  };
}

function createService(options = {}) {
  const adminUsername = options.adminUsername || process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = options.adminPassword || process.env.ADMIN_PASSWORD || 'admin123';

  const dataFile = options.dataFile || null;
  let farmers = [];
  let nextId = 1;

  if (dataFile && fs.existsSync(dataFile)) {
    try {
      farmers = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      nextId = farmers.reduce((max, f) => Math.max(max, f.id), 0) + 1;
    } catch (err) {
      console.error('Could not read ' + dataFile + ', starting with no farmers:', err.message);
      farmers = [];
    }
  }

  function save() {
    if (!dataFile) return;
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    const tmp = dataFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(farmers, null, 2));
    fs.renameSync(tmp, dataFile);
  }

  function findById(id) {
    return farmers.find((f) => String(f.id) === String(id));
  }

  function register(body) {
    const errors = v.validateRegistration(body);
    if (Object.keys(errors).length > 0) {
      return { status: 400, body: { message: 'Please correct the errors in the form', errors } };
    }
    const mobile = v.text(body.mobile);
    if (farmers.some((f) => f.mobile === mobile)) {
      return {
        status: 409,
        body: {
          message: 'This mobile number is already registered',
          errors: { mobile: 'This mobile number is already registered' }
        }
      };
    }
    const { salt, hash } = hashPassword(body.password);
    const farmer = {
      id: nextId++,
      name: v.text(body.name),
      mobile,
      email: v.text(body.email),
      location: '',
      farmSize: '',
      mainCrop: '',
      passwordSalt: salt,
      passwordHash: hash,
      createdAt: new Date().toISOString()
    };
    farmers.push(farmer);
    save();
    return {
      status: 201,
      body: { message: 'Registration successful. You can now log in.', farmer: publicFarmer(farmer) }
    };
  }

  function login(body) {
    const errors = v.validateLogin(body);
    if (Object.keys(errors).length > 0) {
      return { status: 400, body: { message: 'Mobile number and password are required', errors } };
    }
    const farmer = farmers.find((f) => f.mobile === v.text(body.mobile));
    // Same message for unknown number and wrong password (does not reveal which one failed).
    if (!farmer || !passwordMatches(body.password, farmer.passwordSalt, farmer.passwordHash)) {
      return { status: 401, body: { message: 'Invalid mobile number or password' } };
    }
    return { status: 200, body: { message: 'Login successful', farmer: publicFarmer(farmer) } };
  }

  function getFarmer(id) {
    const farmer = findById(id);
    if (!farmer) return { status: 404, body: { message: 'Farmer not found' } };
    return { status: 200, body: { farmer: publicFarmer(farmer) } };
  }

  function updateFarmer(id, body) {
    const farmer = findById(id);
    if (!farmer) return { status: 404, body: { message: 'Farmer not found' } };
    const errors = v.validateProfileUpdate(body);
    if (Object.keys(errors).length > 0) {
      return { status: 400, body: { message: 'Please correct the errors in the form', errors } };
    }
    // Only these fields can be changed. Mobile number and password are never updated here.
    for (const field of ['name', 'email', 'location', 'farmSize', 'mainCrop']) {
      if (body[field] !== undefined) farmer[field] = v.text(body[field]);
    }
    save();
    return { status: 200, body: { message: 'Profile updated successfully', farmer: publicFarmer(farmer) } };
  }

  function adminLogin(body) {
    const errors = v.validateAdminLogin(body);
    if (Object.keys(errors).length > 0) {
      return { status: 400, body: { message: 'Username and password are required', errors } };
    }
    if (v.text(body.username) !== adminUsername || body.password !== adminPassword) {
      return { status: 401, body: { message: 'Invalid admin username or password' } };
    }
    return { status: 200, body: { message: 'Admin login successful', admin: { username: adminUsername } } };
  }

  return { register, login, getFarmer, updateFarmer, adminLogin };
}

module.exports = { createService };
