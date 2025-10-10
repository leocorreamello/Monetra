const express = require('express');
const serverless = require('serverless-http');
const { connectDatabase } = require('../config/database'); // Certifique-se que o caminho está correto

const server = express();

// Middleware para processar requests antes de passá-las ao Express
server.use(express.json());

const handler = serverless(server);

module.exports = async (req, res) => {
  try {
    // Adiciona um timeout controlado para evitar que a Vercel aguarde indefinidamente
    const timeout = setTimeout(() => {
      res.status(408).send('Request timed out');
    }, 10000); // Timeout de 10 segundos

    // Inicia a conexão com o banco
    console.log("[db] Iniciando conexão com o MongoDB...");
    await connectDatabase(); // Isso chama a função que está no seu 'database.js'

    clearTimeout(timeout); // Limpa o timeout se a função for concluída antes de 10s

    // Envia uma resposta de sucesso se a conexão foi bem-sucedida
    console.log("[db] Conexão com o banco bem-sucedida.");
    res.status(200).json({ message: 'Banco de dados conectado com sucesso' });

  } catch (error) {
    console.error('[api] Failed to handle request', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
