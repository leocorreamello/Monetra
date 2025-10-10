const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { connectDatabase } = require('../config/database'); // Certifique-se que o caminho está correto

const app = express();  // A variável 'app' deve ser inicializada aqui, não 'server'

app.use(cors({
  origin: ['https://monetra-smoky.vercel.app', 'https://monetra-c1h5.vercel.app'], // Permitir múltiplos domínios
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware para processar requests antes de passá-las ao Express
app.use(express.json());

// Roteamento de API - Vamos garantir que as funções da API estejam sendo tratadas corretamente.
app.use('/api', require('./api/[...slug]'));  // Garantir que esse caminho esteja correto

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
