const app = require('../src/app');
const { connectDatabase } = require('../config/database');

module.exports = async (req, res) => {
  try {
    await connectDatabase();
    return app(req, res);
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
