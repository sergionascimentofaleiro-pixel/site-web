const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

// All message routes require authentication
router.use(authenticateToken);

router.post('/', messageController.sendMessage);
router.get('/conversations', messageController.getConversations);
router.get('/unread-count', messageController.getUnreadCount);
router.get('/:matchId', messageController.getConversation);

module.exports = router;
