const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { validateLength, LIMITS } = require('../middleware/validation');

// Public routes with rate limiting and input validation
router.post('/register', registerLimiter, validateLength({
  email: LIMITS.email,
  password: LIMITS.password
}), authController.register);
router.post('/login', authLimiter, validateLength({
  email: LIMITS.email,
  password: LIMITS.password
}), authController.login);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/language', authenticateToken, authController.updateLanguage);

module.exports = router;
