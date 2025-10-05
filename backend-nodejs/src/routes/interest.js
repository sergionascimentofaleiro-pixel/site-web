const express = require('express');
const router = express.Router();
const interestController = require('../controllers/interestController');
const { authenticateToken } = require('../middleware/auth');

// Get all available interests (public - for registration/profile creation)
router.get('/all', interestController.getAllInterests);

// Get current user's interests
router.get('/my', authenticateToken, interestController.getMyInterests);

// Set current user's interests
router.post('/my', authenticateToken, interestController.setMyInterests);

module.exports = router;
