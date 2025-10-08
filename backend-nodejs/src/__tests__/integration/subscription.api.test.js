const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const subscriptionRoutes = require('../../routes/subscription');
const { authenticateToken } = require('../../middleware/auth');

// Mock dependencies
jest.mock('../../models/Subscription');
jest.mock('../../models/PaymentHistory');
jest.mock('../../config/paypal');

const Subscription = require('../../models/Subscription');
const PaymentHistory = require('../../models/PaymentHistory');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/subscription', subscriptionRoutes);

// Test user token
const testUserId = 1;
const testToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET || 'test_secret');

describe('Subscription API - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/subscription/status', () => {
    it('should return subscription status for authenticated user', async () => {
      Subscription.hasActiveSubscription.mockResolvedValue(false);
      Subscription.getConversationCount.mockResolvedValue(3);
      Subscription.getUserConversations.mockResolvedValue([
        { match_id: 1 },
        { match_id: 2 },
        { match_id: 3 }
      ]);

      const response = await request(app)
        .get('/api/subscription/status')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        hasSubscription: false,
        conversationCount: 3,
        freeLimit: 5,
        conversationsRemaining: 2,
        canAccessNewConversations: true,
        userConversations: [1, 2, 3]
      });
    });

    it('should return subscription details when user has active subscription', async () => {
      const mockSubscription = {
        id: 1,
        user_id: testUserId,
        subscription_type: 'monthly',
        start_date: '2025-10-01',
        end_date: '2025-11-01',
        status: 'active'
      };

      Subscription.hasActiveSubscription.mockResolvedValue(true);
      Subscription.getConversationCount.mockResolvedValue(10);
      Subscription.getUserConversations.mockResolvedValue([
        { match_id: 1 }, { match_id: 2 }, { match_id: 3 }, { match_id: 4 }, { match_id: 5 },
        { match_id: 6 }, { match_id: 7 }, { match_id: 8 }, { match_id: 9 }, { match_id: 10 }
      ]);
      Subscription.getActiveSubscription.mockResolvedValue(mockSubscription);

      const response = await request(app)
        .get('/api/subscription/status')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.hasSubscription).toBe(true);
      expect(response.body.subscription).toEqual(mockSubscription);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/subscription/status');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/subscription/can-access/:matchId', () => {
    it('should allow access with active subscription', async () => {
      Subscription.canAccessConversation.mockResolvedValue({
        canAccess: true,
        reason: 'subscription'
      });

      const response = await request(app)
        .get('/api/subscription/can-access/5')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.canAccess).toBe(true);
      expect(response.body.reason).toBe('subscription');
    });

    it('should deny access when limit reached', async () => {
      Subscription.canAccessConversation.mockResolvedValue({
        canAccess: false,
        reason: 'limit_reached',
        conversationCount: 5,
        limit: 5
      });

      const response = await request(app)
        .get('/api/subscription/can-access/6')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.canAccess).toBe(false);
      expect(response.body.reason).toBe('limit_reached');
    });

    it('should return 400 for invalid match ID', async () => {
      const response = await request(app)
        .get('/api/subscription/can-access/invalid')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/subscription/plans', () => {
    it('should return available subscription plans', async () => {
      const response = await request(app)
        .get('/api/subscription/plans');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('id', '24h');
      expect(response.body[0]).toHaveProperty('nameKey', 'subscription.plan24h.name');
      expect(response.body[1]).toHaveProperty('id', 'monthly');
      expect(response.body[1]).toHaveProperty('nameKey', 'subscription.planMonthly.name');
      expect(response.body[2]).toHaveProperty('id', 'yearly');
      expect(response.body[2]).toHaveProperty('nameKey', 'subscription.planYearly.name');
    });

    it('should include pricing information', async () => {
      const response = await request(app)
        .get('/api/subscription/plans');

      const monthlyPlan = response.body.find(p => p.id === 'monthly');
      expect(monthlyPlan).toHaveProperty('price');
      expect(monthlyPlan).toHaveProperty('currency', 'EUR');
      expect(monthlyPlan).toHaveProperty('descriptionKey', 'subscription.planMonthly.description');
      expect(monthlyPlan).toHaveProperty('savingsKey', 'subscription.planMonthly.savings');
    });
  });

  describe('POST /api/subscription/create-order', () => {
    it('should create PayPal order for valid plan', async () => {
      const mockPayPalOrder = {
        result: {
          id: '5O190127TN364715T',
          status: 'CREATED'
        }
      };

      // Mock PayPal client
      const paypalClient = require('../../config/paypal');
      paypalClient.client = jest.fn(() => ({
        execute: jest.fn().mockResolvedValue(mockPayPalOrder)
      }));

      PaymentHistory.create.mockResolvedValue(123);

      const response = await request(app)
        .post('/api/subscription/create-order')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ planId: 'monthly' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orderId', '5O190127TN364715T');
      expect(PaymentHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: testUserId,
          amount: 12.00,
          currency: 'EUR',
          payment_method: 'paypal',
          subscription_type: 'monthly',
          status: 'pending'
        })
      );
    });

    it('should return 400 for invalid plan', async () => {
      const response = await request(app)
        .post('/api/subscription/create-order')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ planId: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 without plan ID', async () => {
      const response = await request(app)
        .post('/api/subscription/create-order')
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/subscription/capture-order', () => {
    it('should capture completed PayPal payment', async () => {
      const mockCaptureResult = {
        result: {
          id: '5O190127TN364715T',
          status: 'COMPLETED',
          purchase_units: [{
            custom_id: JSON.stringify({ userId: testUserId, planId: 'monthly' })
          }]
        }
      };

      const paypalClient = require('../../config/paypal');
      paypalClient.client = jest.fn(() => ({
        execute: jest.fn().mockResolvedValue(mockCaptureResult)
      }));

      const mockPayment = {
        id: 123,
        user_id: testUserId,
        subscription_type: 'monthly'
      };

      PaymentHistory.findByPayPalOrderId.mockResolvedValue(mockPayment);
      PaymentHistory.updateStatus.mockResolvedValue(true);
      Subscription.create.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/subscription/capture-order')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ orderId: '5O190127TN364715T' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(PaymentHistory.updateStatus).toHaveBeenCalledWith(123, 'completed');
      expect(Subscription.create).toHaveBeenCalled();
    });

    it('should return 400 without order ID', async () => {
      const response = await request(app)
        .post('/api/subscription/capture-order')
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/subscription/cancel', () => {
    it('should cancel active subscription', async () => {
      const mockSubscription = {
        id: 1,
        user_id: testUserId,
        subscription_type: 'monthly',
        status: 'active'
      };

      Subscription.getActiveSubscription.mockResolvedValue(mockSubscription);
      Subscription.updateStatus.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/subscription/cancel')
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Subscription.updateStatus).toHaveBeenCalledWith(1, 'cancelled');
    });
  });

  describe('GET /api/subscription/payment-history', () => {
    it('should return payment history for user', async () => {
      const mockHistory = [
        {
          id: 1,
          amount: 12.00,
          currency: 'EUR',
          payment_method: 'paypal',
          status: 'completed',
          created_at: '2025-10-01T10:00:00Z'
        },
        {
          id: 2,
          amount: 5.00,
          currency: 'EUR',
          payment_method: 'paypal',
          status: 'pending',
          created_at: '2025-10-08T15:30:00Z'
        }
      ];

      PaymentHistory.getByUserId.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/subscription/payment-history')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockHistory);
      expect(PaymentHistory.getByUserId).toHaveBeenCalledWith(testUserId);
    });
  });

  describe('POST /api/subscription/webhook', () => {
    it('should process successful payment webhook', async () => {
      const webhookEvent = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          custom_id: JSON.stringify({ userId: testUserId, planId: 'monthly' }),
          supplementary_data: {
            related_ids: {
              order_id: '5O190127TN364715T'
            }
          }
        }
      };

      const mockPayment = {
        id: 123,
        user_id: testUserId,
        subscription_type: 'monthly'
      };

      PaymentHistory.findByPayPalOrderId.mockResolvedValue(mockPayment);
      PaymentHistory.updateStatus.mockResolvedValue(true);
      Subscription.create.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/subscription/webhook')
        .send(webhookEvent);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle denied payment webhook', async () => {
      const webhookEvent = {
        event_type: 'PAYMENT.CAPTURE.DENIED',
        resource: {
          supplementary_data: {
            related_ids: {
              order_id: '5O190127TN364715T'
            }
          }
        }
      };

      const mockPayment = {
        id: 123,
        status: 'pending'
      };

      PaymentHistory.findByPayPalOrderId.mockResolvedValue(mockPayment);
      PaymentHistory.updateStatus.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/subscription/webhook')
        .send(webhookEvent);

      expect(response.status).toBe(200);
      expect(PaymentHistory.updateStatus).toHaveBeenCalledWith(123, 'failed');
    });
  });
});
