const Subscription = require('../../models/Subscription');
const PaymentHistory = require('../../models/PaymentHistory');

// Mock database
jest.mock('../../config/database', () => ({
  execute: jest.fn()
}));

const db = require('../../config/database');

describe('Subscription Model - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasActiveSubscription', () => {
    it('should return true when user has active subscription', async () => {
      const mockResult = [[{
        id: 1,
        user_id: 1,
        status: 'active',
        end_date: new Date(Date.now() + 86400000).toISOString()
      }]];

      db.execute.mockResolvedValue(mockResult);

      const result = await Subscription.hasActiveSubscription(1);

      expect(result).toBe(true);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });

    it('should return false when user has no active subscription', async () => {
      db.execute.mockResolvedValue([[]]);

      const result = await Subscription.hasActiveSubscription(1);

      expect(result).toBe(false);
    });
  });

  describe('getConversationCount', () => {
    it('should return correct conversation count', async () => {
      db.execute.mockResolvedValue([[{ count: 3 }]]);

      const result = await Subscription.getConversationCount(1);

      expect(result).toBe(3);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('COUNT'),
        [1]
      );
    });

    it('should return 0 when user has no conversations', async () => {
      db.execute.mockResolvedValue([[{ count: 0 }]]);

      const result = await Subscription.getConversationCount(1);

      expect(result).toBe(0);
    });
  });

  describe('canAccessConversation', () => {
    it('should allow access when user has active subscription', async () => {
      // Mock active subscription
      db.execute.mockResolvedValueOnce([[{ id: 1, status: 'active' }]]);

      const result = await Subscription.canAccessConversation(1, 5);

      expect(result.canAccess).toBe(true);
      expect(result.reason).toBe('subscription');
    });

    it('should allow access to existing conversations', async () => {
      // Mock no subscription
      db.execute.mockResolvedValueOnce([[]]);
      // Mock existing conversation
      db.execute.mockResolvedValueOnce([[{ id: 1, match_id: 5 }]]);

      const result = await Subscription.canAccessConversation(1, 5);

      expect(result.canAccess).toBe(true);
      expect(result.reason).toBe('existing_conversation');
    });

    it('should allow access within free limit', async () => {
      // Mock no subscription
      db.execute.mockResolvedValueOnce([[]]);
      // Mock not existing conversation
      db.execute.mockResolvedValueOnce([[]]);
      // Mock conversation count = 3 (under limit of 5)
      db.execute.mockResolvedValueOnce([[{ count: 3 }]]);

      const result = await Subscription.canAccessConversation(1, 5);

      expect(result.canAccess).toBe(true);
      expect(result.reason).toBe('free');
      expect(result.remaining).toBe(2); // 5 - 3 = 2 remaining
    });

    it('should deny access when limit reached', async () => {
      // Mock no subscription
      db.execute.mockResolvedValueOnce([[]]);
      // Mock not existing conversation
      db.execute.mockResolvedValueOnce([[]]);
      // Mock conversation count = 5 (at limit)
      db.execute.mockResolvedValueOnce([[{ count: 5 }]]);

      const result = await Subscription.canAccessConversation(1, 5);

      expect(result.canAccess).toBe(false);
      expect(result.reason).toBe('limit_reached');
      expect(result.conversationCount).toBe(5);
      expect(result.limit).toBe(5);
    });
  });

  describe('create', () => {
    it('should create a new subscription', async () => {
      db.execute.mockResolvedValue([{ insertId: 1 }]);

      const endDate = '2025-10-08';
      const result = await Subscription.create(1, 'monthly', 12.00, endDate);

      expect(result).toBe(1);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO subscriptions'),
        expect.arrayContaining([1, 'monthly', 12.00, endDate])
      );
    });
  });

  describe('updateStatus', () => {
    it('should update subscription status', async () => {
      db.execute.mockResolvedValue([{ affectedRows: 1 }]);

      await Subscription.updateStatus(1, 'cancelled');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE subscriptions'),
        ['cancelled', 1]
      );
    });
  });
});

describe('PaymentHistory Model - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new payment record', async () => {
      db.execute.mockResolvedValue([{ insertId: 123 }]);

      const paymentData = {
        user_id: 1,
        amount: 12.00,
        currency: 'EUR',
        payment_method: 'paypal',
        paypal_order_id: '5O190127TN364715T',
        subscription_type: 'monthly',
        status: 'pending'
      };

      const result = await PaymentHistory.create(paymentData);

      expect(result).toBe(123);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payment_history'),
        expect.arrayContaining([
          1, 12.00, 'EUR', 'paypal', '5O190127TN364715T', 'monthly', 'pending'
        ])
      );
    });
  });

  describe('findByPayPalOrderId', () => {
    it('should find payment by PayPal order ID', async () => {
      const mockPayment = {
        id: 123,
        user_id: 1,
        paypal_order_id: '5O190127TN364715T',
        status: 'pending'
      };

      db.execute.mockResolvedValue([[mockPayment]]);

      const result = await PaymentHistory.findByPayPalOrderId('5O190127TN364715T');

      expect(result).toEqual(mockPayment);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE paypal_order_id'),
        ['5O190127TN364715T']
      );
    });

    it('should return null when payment not found', async () => {
      db.execute.mockResolvedValue([[]]);

      const result = await PaymentHistory.findByPayPalOrderId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update payment status', async () => {
      db.execute.mockResolvedValue([{ affectedRows: 1 }]);

      await PaymentHistory.updateStatus(123, 'completed');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE payment_history'),
        ['completed', 123]
      );
    });
  });

  describe('getByUserId', () => {
    it('should retrieve all payments for a user', async () => {
      const mockPayments = [
        { id: 1, amount: 12.00, status: 'completed' },
        { id: 2, amount: 5.00, status: 'pending' }
      ];

      db.execute.mockResolvedValue([mockPayments]);

      const result = await PaymentHistory.getByUserId(1);

      expect(result).toEqual(mockPayments);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id'),
        [1]
      );
    });
  });
});
