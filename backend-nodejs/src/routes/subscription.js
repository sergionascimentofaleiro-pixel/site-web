const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Public route - get available plans (with rate limiting)
router.get('/plans', apiLimiter, subscriptionController.getPlans);

// PayPal webhook route (no auth required)
router.post('/webhook', express.json(), subscriptionController.webhook);

// Protected routes
router.use(authenticateToken);

router.get('/status', subscriptionController.getStatus);
router.get('/can-access/:matchId', subscriptionController.canAccessConversation);
router.post('/create-order', subscriptionController.createOrder);
router.post('/capture-order', subscriptionController.captureOrder);
router.get('/payment-history', subscriptionController.getPaymentHistory);
router.post('/cancel', subscriptionController.cancelSubscription);

module.exports = router;
