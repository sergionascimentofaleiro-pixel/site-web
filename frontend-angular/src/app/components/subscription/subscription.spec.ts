import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubscriptionComponent } from './subscription';
import { Subscription } from '../../services/subscription';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('SubscriptionComponent', () => {
  let component: SubscriptionComponent;
  let fixture: ComponentFixture<SubscriptionComponent>;
  let subscriptionService: jasmine.SpyObj<Subscription>;

  const mockPlans = [
    {
      id: '24h',
      nameKey: 'subscription.plan24h.name',
      price: '5.00',
      currency: 'EUR',
      durationKey: 'subscription.plan24h.duration',
      descriptionKey: 'subscription.plan24h.description',
      recurring: false
    },
    {
      id: 'monthly',
      nameKey: 'subscription.planMonthly.name',
      price: '12.00',
      currency: 'EUR',
      durationKey: 'subscription.planMonthly.duration',
      descriptionKey: 'subscription.planMonthly.description',
      recurring: true,
      savingsKey: 'subscription.planMonthly.savings'
    }
  ];

  const mockStatus = {
    hasSubscription: false,
    conversationCount: 3,
    freeLimit: 5,
    conversationsRemaining: 2,
    canAccessNewConversations: true,
    userConversations: [1, 2, 3]
  };

  beforeEach(async () => {
    const subscriptionServiceSpy = jasmine.createSpyObj('Subscription', [
      'getPlans',
      'getStatus',
      'createPayPalOrder',
      'cancelSubscription'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SubscriptionComponent, TranslateModule.forRoot()],
      providers: [
        { provide: Subscription, useValue: subscriptionServiceSpy },
        { provide: Router, useValue: routerSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    subscriptionService = TestBed.inject(Subscription) as jasmine.SpyObj<Subscription>;

    // Setup default spy returns
    subscriptionService.getPlans.and.returnValue(of(mockPlans));
    subscriptionService.getStatus.and.returnValue(of(mockStatus));

    fixture = TestBed.createComponent(SubscriptionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load plans and status on init', () => {
    fixture.detectChanges(); // triggers ngOnInit

    expect(subscriptionService.getPlans).toHaveBeenCalled();
    expect(subscriptionService.getStatus).toHaveBeenCalled();
    expect(component.plans().length).toBe(2);
    expect(component.status()).toEqual(mockStatus);
  });

  it('should calculate progress percentage correctly', () => {
    component.status.set(mockStatus);
    const percentage = component.getProgressPercentage();
    expect(percentage).toBe(60); // 3/5 * 100
  });

  it('should return correct progress color', () => {
    component.status.set({ ...mockStatus, conversationCount: 2 }); // 40%
    expect(component.getProgressColor()).toBe('#4CAF50'); // Green

    component.status.set({ ...mockStatus, conversationCount: 3 }); // 60%
    expect(component.getProgressColor()).toBe('#FF9800'); // Orange

    component.status.set({ ...mockStatus, conversationCount: 5 }); // 100%
    expect(component.getProgressColor()).toBe('#F44336'); // Red
  });

  it('should handle plan selection when PayPal SDK is loaded', async () => {
    // Simulate PayPal SDK loaded
    component.paypalLoaded.set(true);
    spyOn(component, 'renderPayPalButton');

    await component.selectPlan('24h');

    expect(component.selectedPlan()).toBe('24h');
    expect(component.showPayPal()).toBe(true);
  });

  it('should wait for PayPal SDK to load before rendering button', (done) => {
    // PayPal SDK not loaded initially
    component.paypalLoaded.set(false);
    spyOn(component, 'renderPayPalButton');

    component.selectPlan('24h');

    // Should show loading message
    expect(component.errorMessage()).toContain('loading');

    // Simulate PayPal SDK loading after 500ms
    setTimeout(() => {
      component.paypalLoaded.set(true);
    }, 500);

    // Check after SDK loads
    setTimeout(() => {
      expect(component.renderPayPalButton).toHaveBeenCalled();
      expect(component.showPayPal()).toBe(true);
      done();
    }, 1000);
  });

  it('should show error if PayPal SDK fails to load', (done) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 12000;
    // PayPal SDK never loads
    component.paypalLoaded.set(false);

    component.selectPlan('24h');

    // Wait for timeout (10 seconds simulated)
    setTimeout(() => {
      expect(component.errorMessage()).toContain('failed to load');
      expect(component.selectedPlan()).toBeNull();
      done();
    }, 11000);
  }, 12000);

  xit('should handle order creation error in PayPal button', (done) => {
    // Mock PayPal SDK as loaded
    component.paypalLoaded.set(true);

    const error = { error: { error: 'Failed to create order' } };
    subscriptionService.createPayPalOrder.and.returnValue(throwError(() => error));

    // Mock the paypal object to simulate the button flow
    (window as any).paypal = {
      Buttons: (config: any) => {
        // Immediately trigger the createOrder callback to test error handling
        Promise.resolve().then(() => {
          return config.createOrder();
        }).catch((err: any) => {
          // The error should be caught and set in errorMessage
          expect(component.errorMessage()).toContain('Failed');
          done();
        });

        return {
          render: (selector: string) => Promise.resolve()
        };
      }
    };

    component.selectPlan('monthly');
  }, 6000);

  it('should cancel subscription with confirmation', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    subscriptionService.cancelSubscription.and.returnValue(of({ success: true }));
    spyOn(component, 'loadData');

    await component.cancelSubscription();

    expect(window.confirm).toHaveBeenCalled();
    expect(subscriptionService.cancelSubscription).toHaveBeenCalled();
    expect(component.successMessage()).toBeTruthy();
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should not cancel subscription without confirmation', async () => {
    spyOn(window, 'confirm').and.returnValue(false);

    await component.cancelSubscription();

    expect(subscriptionService.cancelSubscription).not.toHaveBeenCalled();
  });
});
