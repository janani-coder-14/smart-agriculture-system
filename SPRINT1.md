# Sprint 1 - Smart Agriculture

## 1. Sprint objective
Deliver the basic user access features: farmers can register, log in and manage their profile, and an admin can log in.

## 2. User stories completed
1. Farmer Registration & Login
2. Farmer Profile Management
3. Admin Login & Access

## 3. Features implemented
- Farmer registration with validation (name, mobile, optional email, password, confirm password)
- Farmer login with required-field checks and invalid-credential errors
- Farmer profile page: view and edit name, email, location, farm size, main crop (mobile is read-only), success message, logout
- Admin login (username/password) with a simple admin welcome panel and logout
- Show/hide (eye) buttons on every password field
- Field-level validation messages shown below each input (client side and server side)
- Passwords are stored hashed (scrypt) and never returned by the API
- Farmer data is saved to a JSON file, so registrations and profile updates survive server restarts

## 4. Frontend pages
`index.html` (farmer login), `register.html`, `profile.html`, `admin.html`, plus `css/style.css` and `js/common.js`, `js/auth.js`, `js/profile.js`, `js/admin.js`. All pages call the backend with `fetch()`.

## 5. Backend APIs
| Endpoint | Success | Errors |
|----------|---------|--------|
| POST /api/register | 201 | 400 invalid input, 409 duplicate mobile |
| POST /api/login | 200 | 400 missing fields, 401 invalid credentials |
| GET /api/farmers/:id | 200 | 404 not found |
| PUT /api/farmers/:id | 200 | 400 invalid input, 404 not found |
| POST /api/admin/login | 200 | 400 missing fields, 401 invalid credentials |

Every error response contains a `message`; validation errors also contain an `errors` object keyed by field name.

## 6. Validation rules
- Name: required
- Mobile: exactly 10 digits, starting with 6, 7, 8 or 9
- Email: optional; must be a valid format if entered
- Password: at least 6 characters
- Confirm password: must match password
- Farm size (profile): optional; must be a positive number (acres)
- Login / admin login: all fields required

## 7. Testing performed
- Unit tests (`tests/unit`): validators and service logic
- API/functional tests (`tests/api`): all 17 required scenarios plus an unknown-route check
- Browser check of the frontend (headless Chrome): registration, login, profile update, admin login, show/hide password, error placement
- See `TEST_CASES.md` and `API_TESTING.md`

## 8. Final test results
| Suite | Total | Passed | Failed | Errors |
|-------|-------|--------|--------|--------|
| Unit tests (node:test) | 32 | 32 | 0 | 0 |
| API tests (node:test) | 18 | 18 | 0 | 0 |
| Browser checks (headless Chrome) | 26 | 26 | 0 | 0 |
| **All** | **76** | **76** | **0** | **0** |

**Important about how these were run:** the npm registry was blocked in the environment where this was built, so real Express could not be installed. The unit tests ran for real. The API tests and browser checks ran against a small temporary Express-compatible stand-in (not included in the project). Please run `npm install` and `npm test` on your machine to confirm with real Express; the code uses only basic Express features (`express.json`, `express.static`, routing, error middleware).

The earlier Java/JUnit project (20 tests) is separate and was not touched or re-run.

## 9. Known limitations
- Data is stored in a JSON file (`backend/data/farmers.json`) instead of a database; a real database is planned for a later sprint
- No session tokens: the farmer id is kept in the browser's localStorage, and the admin state in sessionStorage, so the profile API is not protected against someone who knows another farmer's id. Proper authentication (JWT/sessions) is planned for a later sprint
- The admin panel is a placeholder; admin features come later
- Demo admin credentials are fixed (configurable by environment variables)
- No rate limiting on login

## 10. How to run
```bash
cd backend
npm install
npm start
```
Open http://localhost:3000/
