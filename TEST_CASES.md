# Test Cases - Sprint 1

> **How these were run:** the npm registry was blocked where this was built, so real Express could not be installed.
> Unit tests ran for real. API tests and browser checks ran against a temporary Express-compatible stand-in (not shipped).
> Run `cd backend && npm install && npm test` to confirm with real Express and update this file if anything differs.

## Functional test cases

| Test ID | Module | Scenario | Expected Result | Actual Result | Status |
|---------|--------|----------|-----------------|---------------|--------|
| T1 | Farmer Registration | Valid registration | 201, farmer created, no password in response | 201 "Registration successful. You can now log in."; no password fields returned | PASS |
| T2 | Farmer Registration | Empty name | 400, error below name field | 400; "Full name is required" shown below Name input | PASS |
| T3 | Farmer Registration | Invalid phone (`12345`) | 400, phone error below mobile field | 400; "Mobile number must be exactly 10 digits" below Mobile input | PASS |
| T4 | Farmer Registration | Phone starting with 5 | Error "must start with 6, 7, 8 or 9" | Validator returned that message | PASS |
| T5 | Farmer Registration | Password shorter than 6 characters | 400, password error | 400; "Password must be at least 6 characters" | PASS |
| T6 | Farmer Registration | Confirm password mismatch | 400, error below confirm field | 400; "Passwords do not match" below Confirm Password input | PASS |
| T7 | Farmer Registration | Invalid email | 400, email error | 400; "Please enter a valid email address" below Email input | PASS |
| T8 | Farmer Registration | Email left empty | Registration allowed | 201 | PASS |
| T9 | Farmer Registration | Duplicate mobile number | 409, error below mobile field | 409; "This mobile number is already registered" | PASS |
| T10 | Farmer Login | Valid credentials | 200, redirect to profile page | 200 "Login successful"; browser opened profile.html with saved data | PASS |
| T11 | Farmer Login | Wrong password | 401 error message | 401 "Invalid mobile number or password" shown on page | PASS |
| T12 | Farmer Login | Unknown mobile number | 401 error message | 401 "Invalid mobile number or password" | PASS |
| T13 | Farmer Login | Both fields empty | Required errors below both fields | "Mobile number is required" / "Password is required" shown below inputs | PASS |
| T14 | Farmer Profile | Get existing farmer | 200 with profile data | 200; farmer data returned without password | PASS |
| T15 | Farmer Profile | Get non-existing farmer | 404 "Farmer not found" | 404 "Farmer not found" | PASS |
| T16 | Farmer Profile | Valid update (location, farm size, crop) | 200 and success message | 200 "Profile updated successfully"; message shown on page | PASS |
| T17 | Farmer Profile | Updated data after logout and login | New values shown | Location, crop and email showed updated values | PASS |
| T18 | Farmer Profile | Invalid email on update | 400, error below email field | 400; "Please enter a valid email address" | PASS |
| T19 | Farmer Profile | Try to change mobile number | Mobile unchanged | Field is read-only; service ignores `mobile` in updates | PASS |
| T20 | Farmer Profile | Open profile page while logged out | Redirect to login | Redirected to index.html | PASS |
| T21 | Admin Login | Correct credentials | 200 and admin panel shown | 200 "Admin login successful"; panel displayed | PASS |
| T22 | Admin Login | Wrong password | 401 error | 401 "Invalid admin username or password" | PASS |
| T23 | Admin Login | Missing username and password | 400, errors below fields | 400; "Username is required" / "Password is required" | PASS |
| T24 | UI | Password show/hide (register, confirm, admin) | Input toggles text/password | Toggled correctly on each | PASS |
| T25 | UI | Admin password visible in frontend files | Not present | `admin123` not found in any HTML/JS/CSS file | PASS |
| T27 | Persistence | Register + update profile, restart server, log in | Same data returned | Real server restart: login returned location and crop; unit test passes | PASS |
| T26 | UI | Homepage | Opens at http://localhost:PORT/ | Loaded, title "Farmer Login" | PASS |

## Automated test results

| Suite | Total | Passed | Failed | Errors |
|-------|-------|--------|--------|--------|
| Unit tests - `tests/unit/validators.test.js`, `service.test.js` | 32 | 32 | 0 | 0 |
| API tests - `tests/api/api.test.js` (17 required scenarios + 1 unknown-route check) | 18 | 18 | 0 | 0 |
| Browser checks (headless Chrome, 26 checks covering T1-T26 UI behaviour) | 26 | 26 | 0 | 0 |
| **Final count** | **76** | **76** | **0** | **0** |

`npm test` runs the unit and API tests: **Tests: 50, Passed: 50, Failed: 0**.

## API test results
All 17 required API scenarios returned the expected status code and message. Full requests and responses are in `API_TESTING.md`.

## Issues found while testing (and what was done)
1. `node --test <directory>` failed on Node 22 (the folder is treated as a file). **Cause:** test-runner command, not the app. **Fix:** `npm test` now lists the test files explicitly.
2. One browser check ("no console errors") first failed. **Cause:** the check was too strict - it counted the expected 401/409 responses from the negative tests and a missing favicon (404). **Fix:** added an empty favicon link to the pages and made the check ignore the intentional 401/409 responses. A real JavaScript error would still fail it. No application logic was changed.

## Previous Java project
The earlier Java/JUnit 5 tests (CropYieldPredictorTest, FarmerValidatorTest, WeatherAnalyzerTest - 20 tests) are not part of this folder, were not touched and were not re-run here.
