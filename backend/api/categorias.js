require('dotenv').config();
const { connectDatabase } = require('../api/src/database');
const { requireAuth } = require('../api/src/auth-helper');
const { listarCategorias } = require('../src/services/transactions');

const handler = async (req, res) => {
  // Configurar headers CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas GET é permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Conectar ao banco de dados
    await connectDatabase();

    // Listar categorias do usuário
    const categorias = await listarCategorias(req.user.id);
    return res.status(200).json(categorias);

  } catch (error) {
    console.error('[categorias] Error:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch categories.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Exportar com autenticação obrigatória
module.exports = requireAuth(handler);
