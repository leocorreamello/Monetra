require('dotenv').config();
const jwt = require('jsonwebtoken');
const { connectDatabase } = require('./database');
const User = require('../../models/User');

/**
 * Helper para autenticar requisições serverless
 * Retorna o usuário autenticado ou null
 */
const authenticateRequest = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    console.log('[auth-helper] No authorization header or invalid format');
    return null;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    console.log('[auth-helper] No token found in authorization header');
    return null;
  }

  try {
    // Conectar ao banco ANTES de buscar o usuário
    await connectDatabase();
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[auth-helper] Token decoded, user ID:', decoded.sub);
    
    const user = await User.findById(decoded.sub);
    
    if (!user) {
      console.log('[auth-helper] User not found for ID:', decoded.sub);
      return null;
    }
    
    console.log('[auth-helper] User authenticated:', user.email);
    return user;
  } catch (error) {
    console.error('[auth-helper] Authentication error:', error.message);
    return null;
  }
};

/**
 * Middleware wrapper para funções serverless
 * Garante que o usuário está autenticado antes de executar o handler
 */
const requireAuth = (handler) => {
  return async (req, res) => {
    try {
      // Conectar ao banco primeiro
      await connectDatabase();
      
      const user = await authenticateRequest(req);

      if (!user) {
        console.log('[auth-helper] Authentication failed - returning 401');
        res.setHeader('Content-Type', 'application/json');
        return res.status(401).json({ message: 'Not authorized' });
      }

      // Adiciona o usuário ao request
      req.user = user;

      // Executa o handler
      return handler(req, res);
    } catch (error) {
      console.error('[auth-helper] Error in requireAuth:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

module.exports = {
  authenticateRequest,
  requireAuth
};
