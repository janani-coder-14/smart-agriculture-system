// Builds the Express app. Kept separate from server.js so tests can start it on any port.
const path = require('path');
const express = require('express');
const { createService } = require('./service');

function createApp(service = createService()) {
  const app = express();

  app.use(express.json());

  // Wrap a service call so every route sends { status, body } as JSON.
  const send = (res, result) => res.status(result.status).json(result.body);

  app.post('/api/register', (req, res) => send(res, service.register(req.body)));
  app.post('/api/login', (req, res) => send(res, service.login(req.body)));
  app.get('/api/farmers/:id', (req, res) => send(res, service.getFarmer(req.params.id)));
  app.put('/api/farmers/:id', (req, res) => send(res, service.updateFarmer(req.params.id, req.body)));
  app.post('/api/admin/login', (req, res) => send(res, service.adminLogin(req.body)));

  // Unknown API routes -> JSON 404 (instead of an HTML page)
  app.use('/api', (req, res) => res.status(404).json({ message: 'API endpoint not found' }));

  // The frontend is served by Express itself, so no Live Server and no CORS setup is needed
  // (page and API share the same origin: http://localhost:3000).
  app.use(express.static(path.join(__dirname, '..', 'frontend')));

  // Malformed JSON body -> 400 with a useful message
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
      return res.status(400).json({ message: 'Invalid JSON in request body' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
