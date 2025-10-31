const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');
const { validateLength, LIMITS } = require('../middleware/validation');

// All message routes require authentication
router.use(authenticateToken);

router.post('/', validateLength({ message: LIMITS.message }), messageController.sendMessage);
router.get('/conversations', messageController.getConversations);
router.get('/unread-count', messageController.getUnreadCount);
router.get('/unread-counts', messageController.getUnreadCounts);
router.get('/:matchId', messageController.getConversation);

module.exports = router;
