const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authenticateToken } = require('../middleware/auth');

// All match routes require authentication
router.use(authenticateToken);

router.get('/', matchController.getMatches);
router.delete('/:matchId', matchController.unmatch);

module.exports = router;
