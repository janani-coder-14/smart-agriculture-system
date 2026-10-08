const path = require('path');
const { createApp } = require('./app');
const { createService } = require('./service');

const PORT = process.env.PORT || 3000;

createApp(createService({ dataFile: path.join(__dirname, 'data', 'farmers.json') })).listen(PORT, () => {
  console.log(`Smart Agriculture server running at http://localhost:${PORT}/`);
  console.log('Farmer data is saved in backend/data/farmers.json');
});
