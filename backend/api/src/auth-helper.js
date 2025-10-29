require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

/**
 * Helper para autenticar requisições serverless
 * Retorna o usuário autenticado ou null
 */
const authenticateRequest = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);
    return user;
  } catch (error) {
    console.error('[auth-helper] Authentication error:', error);
    return null;
  }
};

/**
 * Middleware wrapper para funções serverless
 * Garante que o usuário está autenticado antes de executar o handler
 */
const requireAuth = (handler) => {
  return async (req, res) => {
    const user = await authenticateRequest(req);

    if (!user) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Adiciona o usuário ao request
    req.user = user;

    // Executa o handler
    return handler(req, res);
  };
};

module.exports = {
  authenticateRequest,
  requireAuth
};
