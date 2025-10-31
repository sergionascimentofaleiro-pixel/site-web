const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sanitizeEmail } = require('../utils/sanitizer');
const logger = require('../utils/logger');

// Generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(sanitizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const userId = await User.create(sanitizedEmail, password);

    // Generate token
    const token = generateToken(userId, sanitizedEmail);

    res.status(201).json({
      message: 'User registered successfully',
      userId,
      token
    });
  } catch (error) {
    logger.error('Register error:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find user
    const user = await User.findByEmail(sanitizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await User.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      message: 'Login successful',
      userId: user.id,
      token,
      preferredLanguage: user.preferred_language || 'fr'
    });
  } catch (error) {
    logger.error('Login error:', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Get user error:', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user language preference
exports.updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;

    if (!language || !['en', 'fr', 'es', 'pt'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

    await User.updateLanguage(req.user.userId, language);

    res.json({ message: 'Language preference updated successfully' });
  } catch (error) {
    logger.error('Update language error:', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Internal server error' });
  }
};
