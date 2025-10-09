const express = require('express');
const serverless = require('serverless-http');
const app = require('../src/app');
const { connectDatabase } = require('../config/database');

const server = express();

server.use((req, _res, next) => {
  if (req.url === '/api') {
    req.url = '/';
  } else if (req.url.startsWith('/api/')) {
    req.url = req.url.slice(4) || '/';
  }

  if (req.originalUrl === '/api') {
    req.originalUrl = '/';
  } else if (req.originalUrl?.startsWith('/api/')) {
    req.originalUrl = req.originalUrl.slice(4) || '/';
  }

  next();
});

server.use(app);

const handler = serverless(server);

module.exports = async (req, res) => {
  try {
    await connectDatabase();
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
