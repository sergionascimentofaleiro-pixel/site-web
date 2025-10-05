const Message = require('../models/Message');
const Match = require('../models/Match');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { matchId, receiverId, message } = req.body;

    if (!matchId || !receiverId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the match exists and user is part of it
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.user1_id !== userId && match.user2_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const messageId = await Message.create(matchId, userId, receiverId, message);

    res.status(201).json({
      message: 'Message sent successfully',
      messageId
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get conversation for a match
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { matchId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Verify user is part of the match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.user1_id !== userId && match.user2_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const messages = await Message.getConversation(matchId, limit);

    // Mark messages as read
    await Message.markConversationAsRead(matchId, userId);

    res.json(messages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await Message.getUnreadCount(userId);

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all conversations with last message
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await Message.getLastMessages(userId);

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
