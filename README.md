# Smart Agriculture (Sprint 1)

A simple college mini project: farmer registration and login, farmer profile management, and admin login.

- **Backend:** Node.js + Express (JSON API)
- **Frontend:** plain HTML, CSS and JavaScript (served by Express)
- **Storage:** JSON file `backend/data/farmers.json` (simple Sprint 1 storage, replaced by a database later)

## How to run

Requires Node.js 18 or newer.

```bash
cd backend
npm install
npm start
```

Open **http://localhost:3000/** in your browser. No Live Server is needed.

## How to test

```bash
cd backend
npm test            # unit tests + API tests
npm run test:unit   # unit tests only (no install needed)
npm run test:api    # API tests only
node ../tests/api/generate-report.js   # regenerates ../API_TESTING.md
```

Tests use Node's built-in test runner (`node:test`), so no extra test library is required.

## Pages

| Page | Purpose |
|------|---------|
| `/index.html` | Farmer login (home page) |
| `/register.html` | Farmer registration |
| `/profile.html` | View/edit profile, logout |
| `/admin.html` | Admin login |

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/register` | Register a farmer |
| POST | `/api/login` | Farmer login |
| GET | `/api/farmers/:id` | Get a farmer profile |
| PUT | `/api/farmers/:id` | Update a farmer profile |
| POST | `/api/admin/login` | Admin login |

## Admin demo account

Username `admin`, password `admin123` (demo only; can be overridden with the `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables). It is not shown anywhere in the app UI.

## Important

Farmer data is saved in `backend/data/farmers.json`, so it survives server restarts. Delete that file to clear all farmers. Passwords are stored hashed. This file storage is temporary and will be replaced by a database in a later sprint.

## Folder structure

```
smart-agriculture/
├── backend/        server.js, app.js, service.js, validators.js, package.json
├── frontend/       index.html, register.html, profile.html, admin.html, css/, js/
├── tests/          unit/ and api/ tests
├── TEST_CASES.md
├── API_TESTING.md
├── SPRINT1.md
└── README.md
```
