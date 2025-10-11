require('dotenv').config();

const app = require('./src/app');
const { connectDatabase } = require('./api/src/database');

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

const start = async () => {
  try {
    await connectDatabase();

    app.listen(port, host, () => {
      console.log(`[core] Server running on http://${host}:${port}`);
    });
  } catch (error) {
    console.error('[core] Failed to start server', error);
    process.exit(1);
  }
};

start();
