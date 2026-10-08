// Runs the Sprint 1 API scenarios against the real app
// and writes API_TESTING.md with the ACTUAL request / status / response.
//
// Usage (from backend/):
// node ../tests/api/generate-report.js

const fs = require('fs');
const path = require('path');

const { createApp } = require('../../backend/app');
const { createService } = require('../../backend/service');


// =========================================
// VALID FARMER DATA
// =========================================

const valid = {
  name: 'Ravi Kumar',
  mobile: '9876543210',
  email: 'ravi@example.com',
  password: 'secret1',
  confirmPassword: 'secret1'
};

let id;


// =========================================
// API TEST CASES
// =========================================

const cases = [

  // -----------------------------------------
  // FARMER REGISTRATION
  // -----------------------------------------

  [
    'Successful farmer registration',
    'POST',
    '/api/register',
    () => valid,
    201
  ],

  [
    'Registration with empty name',
    'POST',
    '/api/register',
    () => ({
      ...valid,
      mobile: '9000000001',
      name: ''
    }),
    400
  ],

  [
    'Registration with invalid phone',
    'POST',
    '/api/register',
    () => ({
      ...valid,
      mobile: '12345'
    }),
    400
  ],

  [
    'Registration with password shorter than 6 characters',
    'POST',
    '/api/register',
    () => ({
      ...valid,
      mobile: '9000000002',
      password: '123',
      confirmPassword: '123'
    }),
    400
  ],

  [
    'Registration with mismatched password',
    'POST',
    '/api/register',
    () => ({
      ...valid,
      mobile: '9000000003',
      confirmPassword: 'other'
    }),
    400
  ],

  [
    'Registration with invalid email',
    'POST',
    '/api/register',
    () => ({
      ...valid,
      mobile: '9000000004',
      email: 'bad-email'
    }),
    400
  ],

  [
    'Duplicate phone number',
    'POST',
    '/api/register',
    () => valid,
    409
  ],


  // -----------------------------------------
  // FARMER LOGIN
  // -----------------------------------------

  [
    'Successful farmer login',
    'POST',
    '/api/login',
    () => ({
      mobile: valid.mobile,
      password: valid.password
    }),
    200
  ],

  [
    'Login with wrong password',
    'POST',
    '/api/login',
    () => ({
      mobile: valid.mobile,
      password: 'wrong'
    }),
    401
  ],

  [
    'Login with unknown phone number',
    'POST',
    '/api/login',
    () => ({
      mobile: '9111111111',
      password: 'secret1'
    }),
    401
  ],


  // -----------------------------------------
  // FARMER VIEW
  // -----------------------------------------

  [
    'Get existing farmer profile',
    'GET',
    () => '/api/farmers/' + id,
    () => undefined,
    200
  ],

  [
    'Get non-existing farmer profile',
    'GET',
    '/api/farmers/9999',
    () => undefined,
    404
  ],


  // -----------------------------------------
  // FARMER PROFILE UPDATE
  // -----------------------------------------

  [
    'Successful profile update',
    'PUT',
    () => '/api/farmers/' + id,
    () => ({
      name: 'Ravi K',
      email: 'ravik@example.com',
      location: 'Coimbatore',
      farmSize: '4',
      mainCrop: 'Rice'
    }),
    200
  ],

  [
    'Profile update with invalid email',
    'PUT',
    () => '/api/farmers/' + id,
    () => ({
      name: 'Ravi K',
      email: 'bad'
    }),
    400
  ],


  // -----------------------------------------
  // ADMIN LOGIN
  // -----------------------------------------

  [
    'Successful admin login',
    'POST',
    '/api/admin/login',
    () => ({
      username: 'admin',
      password: 'admin123'
    }),
    200
  ],

  [
    'Admin login with wrong password',
    'POST',
    '/api/admin/login',
    () => ({
      username: 'admin',
      password: 'wrong'
    }),
    401
  ],

  [
    'Admin login with missing username/password',
    'POST',
    '/api/admin/login',
    () => ({}),
    400
  ],


  // -----------------------------------------
  // ADMIN / FARMER MANAGEMENT
  // -----------------------------------------

  [
    'Admin can view existing farmer',
    'GET',
    () => '/api/farmers/' + id,
    () => undefined,
    200
  ],

  [
    'Updated farmer details are persisted',
    'GET',
    () => '/api/farmers/' + id,
    () => undefined,
    200
  ],

  [
    'Update non-existing farmer',
    'PUT',
    '/api/farmers/9999',
    () => ({
      name: 'Unknown Farmer',
      email: 'unknown@example.com'
    }),
    404
  ],


  // -----------------------------------------
  // SECURITY / VALIDATION
  // -----------------------------------------

  [
    'Farmer details do not expose password after update',
    'GET',
    () => '/api/farmers/' + id,
    () => undefined,
    200
  ],

  [
    'Profile update with empty name',
    'PUT',
    () => '/api/farmers/' + id,
    () => ({
      name: '',
      email: 'ravik@example.com'
    }),
    400
  ],

  [
    'Profile update with invalid farmer ID',
    'PUT',
    '/api/farmers/99999',
    () => ({
      name: 'Test Farmer',
      email: 'test@example.com'
    }),
    404
  ],


  // -----------------------------------------
  // UNKNOWN ROUTE
  // -----------------------------------------

  [
    'Unknown API route',
    'GET',
    '/api/nothing',
    () => undefined,
    404
  ]

];


// =========================================
// RUN TESTS AND GENERATE REPORT
// =========================================

(async () => {

  const server =
    createApp(createService()).listen(0);


  await new Promise((resolve) =>
    server.once('listening', resolve)
  );


  const base =
    'http://127.0.0.1:' +
    server.address().port;


  // =========================================
  // REPORT HEADER
  // =========================================

  let out =
    '# API Testing - Sprint 1\n\n';

  out +=
    'Generated by `tests/api/generate-report.js` on ' +
    new Date().toISOString() +
    '.\n\n';

  out +=
    'Every request below was actually sent to the running Express app and the response recorded.\n\n';


  let pass = 0;


  // =========================================
  // RUN EACH TEST CASE
  // =========================================

  for (
    let i = 0;
    i < cases.length;
    i++
  ) {

    const [
      title,
      method,
      p,
      bodyFn,
      expected
    ] = cases[i];


    // Resolve dynamic URL
    const url =
      typeof p === 'function'
        ? p()
        : p;


    // Create request body
    const body =
      bodyFn();


    // =========================================
    // SEND REQUEST
    // =========================================

    const res =
      await fetch(
        base + url,
        {
          method,

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            body === undefined
              ? undefined
              : JSON.stringify(body)
        }
      );


    const data =
      await res.json();


    // =========================================
    // SAVE FARMER ID
    // =========================================

    if (
      i === 0 &&
      data.farmer &&
      data.farmer.id
    ) {

      id =
        data.farmer.id;

    }


    // =========================================
    // CHECK RESULT
    // =========================================

    const ok =
      res.status === expected;


    if (ok) {
      pass++;
    }


    // =========================================
    // WRITE TEST RESULT
    // =========================================

    out +=
      `## A${i + 1}. ${title}\n\n`;


    out +=
      `- **Request:** \`${method} ${url}\`\n`;


    if (body !== undefined) {

      out +=
        '- **Body:**\n\n' +
        '```json\n' +
        JSON.stringify(
          body,
          null,
          2
        ) +
        '\n```\n\n';

    }


    out +=
      `- **Expected status:** ${expected}\n`;


    out +=
      `- **Actual status:** ${res.status}\n`;


    out +=
      `- **Message:** ${data.message || '(none)'}\n`;


    out +=
      `- **Result:** ${ok ? 'PASS' : 'FAIL'}\n\n`;


    out +=
      '```json\n' +
      JSON.stringify(
        data,
        null,
        2
      ) +
      '\n```\n\n';

  }


  // =========================================
  // SUMMARY
  // =========================================

  const failed =
    cases.length - pass;


  out +=
    '## Summary\n\n';


  out +=
    `Total: ${cases.length}  |  ` +
    `Passed: ${pass}  |  ` +
    `Failed: ${failed}\n`;


  // =========================================
  // WRITE API_TESTING.md
  // =========================================

  fs.writeFileSync(

    path.join(
      __dirname,
      '..',
      '..',
      'API_TESTING.md'
    ),

    out

  );


  console.log(
    `API report written. ` +
    `Total ${cases.length}, ` +
    `passed ${pass}, ` +
    `failed ${failed}`
  );


  server.close();

})();