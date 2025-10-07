const express = require('express');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const transactionsRoutes = require('./routes/transactions');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/', transactionsRoutes);

module.exports = app;
