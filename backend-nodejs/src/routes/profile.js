const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

// All profile routes require authentication
router.use(authenticateToken);

router.post('/', profileController.createProfile);
router.get('/me', profileController.getMyProfile);
router.get('/potential-matches', profileController.getPotentialMatches);
router.post('/swipe', profileController.swipe);

module.exports = router;
