const app = require('../src/app');
const { connectDatabase } = require('./src/database');

const stripApiPrefix = (url) => {
  if (!url.startsWith('/api')) {
    return url;
  }

  const stripped = url.slice(4);

  if (stripped.startsWith('/')) {
    return stripped;
  }

  if (stripped.startsWith('?')) {
    return `/${stripped}`;
  }

  return stripped.length > 0 ? `/${stripped}` : '/';
};

module.exports = async (req, res) => {
  try {
    await connectDatabase();

    if (req.url) {
      req.url = stripApiPrefix(req.url);
    }

    return app(req, res);
  } catch (error) {
    console.error('[api] Failed to handle request', error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  }
};
