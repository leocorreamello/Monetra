const express = require('express');
const serverless = require('serverless-http');
const app = require('../src/app');
const { connectDatabase } = require('../config/database');

const server = express();

// Middleware para processar requests antes de passá-las ao Express
server.use(express.json());  // Para garantir que o JSON seja lido corretamente

// Roteamento da API
server.use('/api', app);  // Redireciona tudo de /api para o app

const handler = serverless(server);

console.log("Iniciando conexão com o banco...");
// Função serverless
module.exports = async (req, res) => {
  try {
    await connectDatabase();
    console.log("Conexão com o banco bem-sucedida.");
    return handler(req, res);
  } catch (error) {
    console.error('[api] Failed to handle request', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
