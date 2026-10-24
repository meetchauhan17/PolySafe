// Vercel serverless entrypoint
// Safe lazy-initialization with rich error capture for debugging
let app;
let initError = null;

try {
  app = require('../src/index');
} catch (err) {
  initError = err;
  console.error('[Vercel Serverless Init Error]:', err);
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      error: 'Backend initialization failed',
      name: initError.name,
      message: initError.message,
      stack: initError.stack
    });
  }
  return app(req, res);
};
