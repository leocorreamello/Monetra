const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { connectDatabase } = require('../config/database'); // Certifique-se que o caminho está correto

const app = express();  // Use 'app' para o Express

// Habilitando CORS para múltiplos domínios
app.use(cors({
  origin: ['https://monetra-smoky.vercel.app', 'https://monetra-c1h5.vercel.app'], // Permitir múltiplos domínios
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware para processar requests antes de passá-las ao Express
app.use(express.json());

// Roteamento da API - Certifique-se de que 'api/[...slug].js' esteja no lugar certo
app.use('/api', require('./api/[...slug]'));

const handler = serverless(app);

module.exports = async (req, res) => {
  try {
    console.log("[db] Iniciando conexão com o MongoDB...");
    await connectDatabase();
    console.log("[db] Conexão com o banco bem-sucedida.");
    return handler(req, res);  // Chama a função handler serverless
  } catch (error) {
    console.error('[api] Failed to handle request', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
