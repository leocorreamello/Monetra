const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { connectDatabase } = require('../config/database'); // Certifique-se que o caminho está correto

const server = express();

// Habilitando CORS para todas as rotas
server.use(cors({
  origin: 'https://monetra-smoky.vercel.app', // Substitua pela URL do seu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware para processar requests antes de passá-las ao Express
server.use(express.json());

const handler = serverless(server);

module.exports = async (req, res) => {
  try {
    console.log("[db] Iniciando conexão com o banco...");
    await connectDatabase();
    console.log("[db] Conexão com o banco bem-sucedida.");
    res.status(200).json({ message: 'Banco de dados conectado com sucesso' });
  } catch (error) {
    console.error('[api] Failed to handle request', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
