const serverless = require('serverless-http');
const app = require('../src/app');
const { connectDatabase } = require('../config/database');

const handler = serverless(app);

module.exports = async (req, res) => {
  try {
    await connectDatabase();
    req.url = req.url.replace(/^\/api/, '') || '/';
    return handler(req, res);
  } catch (error) {
    console.error('[api] Failed to handle request', error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Internal Server Error'
      })
    );
    return undefined;
  }
};
