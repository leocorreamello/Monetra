require('dotenv').config();
const { connectDatabase } = require('../api/src/database');
const { listarCategorias } = require('../src/services/transactions');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res) => {
  // Configurar headers CORS PRIMEIRO
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('[categorias] Handling OPTIONS preflight');
    return res.status(204).end();
  }

  // Apenas GET é permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Conectar ao banco de dados
    await connectDatabase();

    // Autenticar usuário
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      console.log('[categorias] No authorization header');
      return res.status(401).json({ message: 'Not authorized' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('[categorias] No token provided');
      return res.status(401).json({ message: 'Not authorized' });
    }

    let user;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.sub);
      
      if (!user) {
        console.log('[categorias] User not found');
        return res.status(401).json({ message: 'Not authorized' });
      }
      
      console.log('[categorias] User authenticated:', user.email);
    } catch (jwtError) {
      console.error('[categorias] JWT verification failed:', jwtError.message);
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Listar categorias do usuário
    const categorias = await listarCategorias(user.id);
    return res.status(200).json(categorias);

  } catch (error) {
    console.error('[categorias] Error:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch categories.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
