import { Component, OnInit, OnDestroy, signal, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription as SubscriptionService, SubscriptionPlan, SubscriptionStatus } from '../../services/subscription';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

declare const paypal: any;

@Component({
  selector: 'app-subscription',
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './subscription.html',
  styleUrl: './subscription.scss'
})
export class SubscriptionComponent implements OnInit, OnDestroy {
  plans = signal<SubscriptionPlan[]>([]);
  status = signal<SubscriptionStatus | null>(null);
  isLoading = signal(true);
  isProcessing = signal(false);
  selectedPlan = signal<string | null>(null);
  errorMessage = signal('');
  successMessage = signal('');
  showPayPal = signal(false);
  paypalLoaded = signal(false);
  paypalRendering = signal(false);

  constructor(
    private subscriptionService: SubscriptionService,
    private router: Router,
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnDestroy() {
    // Cleanup if needed
  }

  async ngOnInit() {
    // Load PayPal SDK
    if (isPlatformBrowser(this.platformId)) {
      this.loadPayPalScript();
    }
    // Load plans and status
    this.loadData();
  }

  loadPayPalScript(): void {
    if (typeof paypal !== 'undefined') {
      this.paypalLoaded.set(true);
      return;
    }

    const script = document.createElement('script');
    // Use the correct PayPal Sandbox Client ID
    script.src = 'https://www.paypal.com/sdk/js?client-id=Af93iVs15blSEniyWhaS4iU7Id4hT0-GasnKzHA30YL_OeprInfVRJRCuADpLx7couOQ79ifg8rZRmfe&components=buttons&disable-funding=paylater&currency=EUR';
    script.async = true;
    script.onload = () => {
      this.paypalLoaded.set(true);
      console.log('PayPal SDK loaded successfully');
    };
    script.onerror = () => {
      console.error('Failed to load PayPal SDK');
      this.errorMessage.set('Failed to load PayPal SDK. Please refresh the page.');
    };
    document.body.appendChild(script);
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load plans
    this.subscriptionService.getPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
      },
      error: (error) => {
        console.error('Error loading plans:', error);
        this.errorMessage.set('Failed to load subscription plans');
      }
    });

    // Load status
    this.subscriptionService.getStatus().subscribe({
      next: (status) => {
        this.status.set(status);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading status:', error);
        this.isLoading.set(false);
      }
    });
  }

  async selectPlan(planId: string): Promise<void> {
    this.selectedPlan.set(planId);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Check if PayPal SDK is loaded
    if (!this.paypalLoaded()) {
      this.errorMessage.set('PayPal is loading, please wait a moment...');
      // Wait for PayPal to load
      const maxWait = 10000; // 10 seconds max
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (this.paypalLoaded()) {
          clearInterval(checkInterval);
          this.errorMessage.set('');
          this.showPayPal.set(true);
          setTimeout(() => {
            this.renderPayPalButton(planId);
          }, 100);
        } else if (Date.now() - startTime > maxWait) {
          clearInterval(checkInterval);
          this.errorMessage.set('PayPal SDK failed to load. Please refresh the page.');
          this.selectedPlan.set(null);
        }
      }, 200);
      return;
    }

    this.showPayPal.set(true);
    // Wait for DOM update, then render PayPal button
    setTimeout(() => {
      this.renderPayPalButton(planId);
    }, 100);
  }

  renderPayPalButton(planId: string): void {
    const containerId = `paypal-button-container-${planId}`;
    const container = document.getElementById(containerId);

    if (!container) {
      console.error('PayPal container not found');
      return;
    }

    // Clear any existing buttons
    container.innerHTML = '';

    if (typeof paypal === 'undefined') {
      console.error('PayPal SDK not loaded');
      this.errorMessage.set('PayPal SDK not loaded. Please refresh the page.');
      return;
    }

    // Show loading indicator
    this.paypalRendering.set(true);

    paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'pay'
      },
      onClick: (data: any, actions: any) => {
        // Show spinner when user clicks on a payment option (PayPal or Card)
        this.paypalRendering.set(true);
        return actions.resolve();
      },
      createOrder: async () => {
        try {
          const response = await this.subscriptionService.createPayPalOrder(planId).toPromise();
          if (!response || !response.orderId) {
            throw new Error('No order ID received');
          }
          // Hide spinner once order is created and form is ready
          setTimeout(() => this.paypalRendering.set(false), 500);
          return response.orderId;
        } catch (error: any) {
          console.error('Create order error:', error);
          this.errorMessage.set(error.error?.error || this.translate.instant('subscription.error'));
          this.paypalRendering.set(false);
          throw error;
        }
      },
      onApprove: async (data: any) => {
        try {
          this.isProcessing.set(true);
          await this.subscriptionService.capturePayPalOrder(data.orderID, planId).toPromise();
          this.successMessage.set(this.translate.instant('subscription.success'));
          this.showPayPal.set(false);
          this.selectedPlan.set(null);
          this.loadData();
        } catch (error: any) {
          console.error('Capture order error:', error);
          this.errorMessage.set(error.error?.error || this.translate.instant('subscription.error'));
        } finally {
          this.isProcessing.set(false);
        }
      },
      onCancel: () => {
        this.showPayPal.set(false);
        this.selectedPlan.set(null);
        this.paypalRendering.set(false);
        this.errorMessage.set(this.translate.instant('subscription.cancelled'));
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
        this.errorMessage.set(this.translate.instant('subscription.error'));
        this.showPayPal.set(false);
        this.selectedPlan.set(null);
        this.paypalRendering.set(false);
      }
    }).render(`#${containerId}`).then(() => {
      // Initial buttons rendered - spinner will be shown again on click
      this.paypalRendering.set(false);
    });
  }

  async cancelSubscription() {
    if (!confirm(this.translate.instant('subscription.confirmCancel') || 'Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
      return;
    }

    try {
      const response: any = await this.subscriptionService.cancelSubscription().toPromise();

      if (response.immediate && response.refund) {
        this.successMessage.set('Votre abonnement a été annulé immédiatement avec remboursement complet (garantie de 14 jours).');
      } else {
        this.successMessage.set('Votre abonnement ne se renouvellera pas. Vous conservez l\'accès jusqu\'à la fin de la période payée.');
      }

      this.loadData();
    } catch (error: any) {
      console.error('Cancel error:', error);
      this.errorMessage.set(error.error?.error || this.translate.instant('subscription.cancelError'));
    }
  }

  getProgressPercentage(): number {
    const status = this.status();
    if (!status) return 0;
    return (status.conversationCount / status.freeLimit) * 100;
  }

  getProgressColor(): string {
    const percentage = this.getProgressPercentage();
    if (percentage < 60) return '#4CAF50'; // Green
    if (percentage < 90) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  getSubscriptionTypeName(): string {
    const subscription = this.status()?.subscription;
    if (!subscription) return '';

    const type = subscription.subscription_type;
    switch(type) {
      case '24h':
        return this.translate.instant('subscription.plan24h.name');
      case 'monthly':
        return this.translate.instant('subscription.planMonthly.name');
      case 'yearly':
        return this.translate.instant('subscription.planYearly.name');
      default:
        return type;
    }
  }

  canCancelSubscription(): boolean {
    const subscription = this.status()?.subscription;
    if (!subscription) return false;

    // 24h subscriptions cannot be cancelled
    return subscription.subscription_type !== '24h';
  }

  isCancelled(): boolean {
    const subscription = this.status()?.subscription;
    return !!(subscription && subscription.cancelled_at);
  }

  willRenew(): boolean {
    const subscription = this.status()?.subscription;
    return !!(subscription && subscription.will_renew);
  }
}
