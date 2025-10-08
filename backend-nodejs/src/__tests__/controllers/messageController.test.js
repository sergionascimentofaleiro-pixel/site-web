const messageController = require('../../controllers/messageController');
const Message = require('../../models/Message');
const Match = require('../../models/Match');
const Subscription = require('../../models/Subscription');

jest.mock('../../models/Message');
jest.mock('../../models/Match');
jest.mock('../../models/Subscription');

describe('Message Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { userId: 1 },
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      req.body = {
        matchId: 10,
        receiverId: 2,
        message: 'Hello!'
      };
    });

    it('should return 400 if required fields are missing', async () => {
      req.body = { matchId: 10 };

      await messageController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('should return 404 if match not found', async () => {
      Match.findById.mockResolvedValue(null);

      await messageController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Match not found' });
    });

    it('should return 403 if user is not part of match', async () => {
      Match.findById.mockResolvedValue({
        id: 10,
        user1_id: 3,
        user2_id: 4
      });

      await messageController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 403 if conversation limit reached', async () => {
      Match.findById.mockResolvedValue({
        id: 10,
        user1_id: 1,
        user2_id: 2
      });

      Subscription.canAccessConversation.mockResolvedValue({
        canAccess: false,
        conversationCount: 5,
        limit: 5,
        reason: 'limit_reached'
      });

      await messageController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Conversation limit reached',
        conversationCount: 5,
        limit: 5,
        requiresSubscription: true
      });
    });

    it('should create message when user can access conversation', async () => {
      Match.findById.mockResolvedValue({
        id: 10,
        user1_id: 1,
        user2_id: 2
      });

      Subscription.canAccessConversation.mockResolvedValue({
        canAccess: true,
        remaining: 2,
        reason: 'free'
      });

      Message.create.mockResolvedValue(123);
      Subscription.addConversation.mockResolvedValue();

      await messageController.sendMessage(req, res);

      expect(Message.create).toHaveBeenCalledWith(10, 1, 2, 'Hello!');
      expect(Subscription.addConversation).toHaveBeenCalledWith(1, 10);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Message sent successfully',
        messageId: 123,
        conversationsRemaining: 2
      });
    });

    it('should create message when user has subscription', async () => {
      Match.findById.mockResolvedValue({
        id: 10,
        user1_id: 1,
        user2_id: 2
      });

      Subscription.canAccessConversation.mockResolvedValue({
        canAccess: true,
        reason: 'subscription'
      });

      Message.create.mockResolvedValue(456);
      Subscription.addConversation.mockResolvedValue();

      await messageController.sendMessage(req, res);

      expect(Message.create).toHaveBeenCalledWith(10, 1, 2, 'Hello!');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Message sent successfully',
        messageId: 456,
        conversationsRemaining: undefined
      });
    });

    it('should handle errors gracefully', async () => {
      Match.findById.mockRejectedValue(new Error('Database error'));

      await messageController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
