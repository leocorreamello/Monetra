require('dotenv').config();
const jwt = require('jsonwebtoken');
const { connectDatabase } = require('../src/database');
const User = require('../../models/User');

module.exports = async (req, res) => {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

    // Verificar token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.sub);

      if (!user) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      return res.status(200).json(user.toJSON());
      
    } catch (jwtError) {
      console.error('[auth/me] JWT verification error:', jwtError);
      return res.status(401).json({ message: 'Not authorized' });
    }
    
  } catch (error) {
    console.error('[auth/me] Error:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch user.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
