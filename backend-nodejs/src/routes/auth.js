const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/language', authenticateToken, authController.updateLanguage);

module.exports = router;
