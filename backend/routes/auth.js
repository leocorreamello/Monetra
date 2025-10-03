const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

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

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Provide a valid email.').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must have at least 8 characters.')
      .matches(/[A-Za-z]/)
      .withMessage('Password must contain letters.')
      .matches(/[0-9]/)
      .withMessage('Password must contain numbers.'),
    body('name')
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ min: 2, max: 60 })
      .withMessage('Name must be between 2 and 60 characters.'),
    handleValidation
  ],
  async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const emailLower = email.toLowerCase();

      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        return res.status(409).json({ message: 'Email is already registered.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({
        email: emailLower,
        name: name?.trim() || undefined,
        passwordHash
      });

      const response = buildAuthResponse(user);
      return res.status(201).json(response);
    } catch (error) {
      console.error('[auth] register error', error);
      return res.status(500).json({ message: 'Failed to create user.' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Provide a valid email.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
    handleValidation
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash);

      if (!passwordMatches) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const response = buildAuthResponse(user);
      return res.json(response);
    } catch (error) {
      console.error('[auth] login error', error);
      return res.status(500).json({ message: 'Failed to authenticate user.' });
    }
  }
);

router.get('/me', authMiddleware, (req, res) => {
  return res.json(req.user.toJSON());
});

module.exports = router;
