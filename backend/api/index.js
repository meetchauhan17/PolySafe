// Vercel serverless entrypoint
// Loads the Express app and exports it as the default handler
const app = require('../src/index');

module.exports = app;
