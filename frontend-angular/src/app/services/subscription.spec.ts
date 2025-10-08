import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from './subscription';

describe('SubscriptionService', () => {
  let service: Subscription;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Subscription,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(Subscription);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getStatus', () => {
    it('should return subscription status', () => {
      const mockStatus: SubscriptionStatus = {
        hasSubscription: false,
        conversationCount: 3,
        freeLimit: 5,
        conversationsRemaining: 2,
        canAccessNewConversations: true,
        userConversations: [1, 2, 3]
      };

      service.getStatus().subscribe(status => {
        expect(status).toEqual(mockStatus);
        expect(status.conversationCount).toBe(3);
        expect(status.conversationsRemaining).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/subscription/status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStatus);
    });

    it('should return active subscription details', () => {
      const mockStatus: SubscriptionStatus = {
        hasSubscription: true,
        conversationCount: 10,
        freeLimit: 5,
        conversationsRemaining: 0,
        canAccessNewConversations: true,
        userConversations: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        subscription: {
          id: 1,
          user_id: 1,
          subscription_type: 'monthly',
          start_date: '2025-10-07',
          end_date: '2025-11-07',
          status: 'active'
        }
      };

      service.getStatus().subscribe(status => {
        expect(status.hasSubscription).toBe(true);
        expect(status.subscription).toBeDefined();
        expect(status.subscription?.subscription_type).toBe('monthly');
      });

      const req = httpMock.expectOne(`${apiUrl}/subscription/status`);
      req.flush(mockStatus);
    });
  });

  describe('canAccessConversation', () => {
    it('should check if user can access conversation', () => {
      const matchId = 5;
      const mockResponse = {
        canAccess: true,
        reason: 'free',
        remaining: 2
      };

      service.canAccessConversation(matchId).subscribe(response => {
        expect(response.canAccess).toBe(true);
        expect(response.reason).toBe('free');
      });

      const req = httpMock.expectOne(`${apiUrl}/subscription/can-access/${matchId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return limit reached', () => {
      const matchId = 10;
      const mockResponse = {
        canAccess: false,
        reason: 'limit_reached',
        conversationCount: 5,
        limit: 5
      };

      service.canAccessConversation(matchId).subscribe(response => {
        expect(response.canAccess).toBe(false);
        expect(response.reason).toBe('limit_reached');
      });

      const req = httpMock.expectOne(`${apiUrl}/subscription/can-access/${matchId}`);
      req.flush(mockResponse);
    });
  });

  describe('getPlans', () => {
    it('should return available subscription plans', () => {
      const mockPlans: SubscriptionPlan[] = [
        {
          id: '24h',
          nameKey: 'subscription.plan24h.name',
          price: '5.00',
          durationKey: 'subscription.plan24h.duration',
          descriptionKey: 'subscription.plan24h.description',
          recurring: false
        },
        {
          id: 'monthly',
          nameKey: 'subscription.planMonthly.name',
          price: '12.00',
          durationKey: 'subscription.planMonthly.duration',
          descriptionKey: 'subscription.planMonthly.description',
          recurring: true,
          savingsKey: 'subscription.planMonthly.savings'
        },
        {
          id: 'yearly',
          nameKey: 'subscription.planYearly.name',
          price: '100.00',
          durationKey: 'subscription.planYearly.duration',
          descriptionKey: 'subscription.planYearly.description',
          recurring: true,
          savingsKey: 'subscription.planYearly.savings'
        }
      ];

      service.getPlans().subscribe(plans => {
        expect(plans).toEqual(mockPlans);
        expect(plans.length).toBe(3);
        expect(plans[0].id).toBe('24h');
        expect(plans[0].nameKey).toBe('subscription.plan24h.name');
      });

      const req = httpMock.expectOne(`${apiUrl}/subscription/plans`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPlans);
    });
  });

  describe('createPayPalOrder', () => {
    it('should create PayPal order for plan', () => {
      const planId = '24h';
      const mockResponse = {
        orderId: '5O190127TN364715T'
      };

      service.createPayPalOrder(planId).subscribe(response => {
        expect(response.orderId).toBe('5O190127TN364715T');
      });

      const req = httpMock.expectOne(`${apiUrl}/subscription/create-order`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ planId });
      req.flush(mockResponse);
    });

    it('should handle errors when creating order', () => {
      const planId = 'monthly';
      const errorMessage = 'Failed to create order';

      service.createPayPalOrder(planId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          expect(error.error.error).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/subscription/create-order`);
      req.flush({ error: errorMessage }, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('capturePayPalOrder', () => {
    it('should capture PayPal order', () => {
      const orderId = '5O190127TN364715T';
      const planId = '24h';
      const mockResponse = {
        success: true,
        orderId: '5O190127TN364715T'
      };

      service.capturePayPalOrder(orderId, planId).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.orderId).toBe('5O190127TN364715T');
      });

      const req = httpMock.expectOne(`${apiUrl}/subscription/capture-order`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ orderId, planId });
      req.flush(mockResponse);
    });

    it('should handle failed capture', () => {
      const orderId = '5O190127TN364715T';
      const planId = '24h';
      const errorMessage = 'Payment not completed';

      service.capturePayPalOrder(orderId, planId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
          expect(error.error.error).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/subscription/capture-order`);
      req.flush({ error: errorMessage }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getPaymentHistory', () => {
    it('should retrieve payment history', () => {
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

      service.getPaymentHistory().subscribe(history => {
        expect(history).toEqual(mockHistory);
        expect(history.length).toBe(2);
        expect(history[0].status).toBe('completed');
      });

      const req = httpMock.expectOne(`${apiUrl}/subscription/payment-history`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHistory);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel user subscription', () => {
      const mockResponse = {
        success: true,
        message: 'Subscription cancelled successfully'
      };

      service.cancelSubscription().subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/subscription/cancel`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
