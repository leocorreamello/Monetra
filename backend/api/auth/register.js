require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { connectDatabase } = require('../src/database');
const User = require('../../models/User');

const getTokenConfig = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }
  return {
    secret,
    expiresIn: process.env.TOKEN_EXPIRES_IN || '7d'
  };
};

const buildAuthResponse = (user) => {
  const { secret, expiresIn } = getTokenConfig();
  const payload = {
    sub: user.id,
    email: user.email
  };

  const token = jwt.sign(payload, secret, { expiresIn });

  return {
    token,
    user: user.toJSON()
  };
};

const validateEmail = body('email')
  .isEmail()
  .withMessage('Provide a valid email.')
  .normalizeEmail();

const validatePassword = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must have at least 8 characters.')
  .matches(/[A-Za-z]/)
  .withMessage('Password must contain letters.')
  .matches(/[0-9]/)
  .withMessage('Password must contain numbers.');

const validateName = body('name')
  .optional({ nullable: true, checkFalsy: true })
  .isLength({ min: 2, max: 60 })
  .withMessage('Name must be between 2 and 60 characters.');

// Helper para validar campos no contexto serverless
const runValidations = async (req, validators) => {
  for (const validator of validators) {
    await validator.run(req);
  }
  
  const errors = validationResult(req);
  return errors;
};

module.exports = async (req, res) => {
  // Configurar headers CORS PRIMEIRO
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight - RETORNAR 204 (No Content)
  if (req.method === 'OPTIONS') {
    console.log('[register] Handling OPTIONS preflight from:', origin);
    return res.status(204).end();
  }

  // Log para debug
  console.log('[register] POST request from:', origin);

  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Conectar ao banco de dados
    await connectDatabase();

    // Validar campos
    const errors = await runValidations(req, [
      validateEmail,
      validatePassword,
      validateName
    ]);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;
    const emailLower = email.toLowerCase();

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    // Criar hash da senha
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Criar usuário
    const user = await User.create({
      email: emailLower,
      name: name?.trim() || undefined,
      passwordHash
    });

    // Gerar token e resposta
    const response = buildAuthResponse(user);
    return res.status(201).json(response);
    
  } catch (error) {
    console.error('[auth/register] Error:', error);
    return res.status(500).json({ 
      message: 'Failed to create user.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
