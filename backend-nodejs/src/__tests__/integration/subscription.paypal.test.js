/**
 * Tests d'intégration PayPal
 *
 * Ces tests utilisent les vraies API PayPal Sandbox
 * Nécessite des clés API valides dans .env.test
 *
 * Pour exécuter ces tests :
 * 1. Configurez vos clés PayPal Sandbox dans .env.test
 * 2. Exécutez : npm test -- subscription-paypal.test.js
 */

const paypal = require('@paypal/checkout-server-sdk');
const paypalClient = require('../../config/paypal');

// Skip ces tests si les clés PayPal ne sont pas configurées
const shouldSkip = !process.env.PAYPAL_CLIENT_ID ||
                   process.env.PAYPAL_CLIENT_ID === 'test_client_id';

describe('PayPal Integration Tests', () => {
  // Skip si pas de vraies clés
  beforeAll(() => {
    if (shouldSkip) {
      console.log('⚠️  Skipping PayPal integration tests - configure real Sandbox keys in .env.test');
    } else {
      console.log('✅ Running PayPal integration tests with real Sandbox API');
      console.log('   Client ID:', process.env.PAYPAL_CLIENT_ID);
    }
  });

  describe('PayPal Order Creation', () => {
    (shouldSkip ? it.skip : it)('should create a PayPal order', async () => {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: '12.00'
          },
          description: 'Test subscription - Monthly',
          custom_id: JSON.stringify({ userId: 1, planId: 'monthly' })
        }],
        application_context: {
          brand_name: 'Dating App Test',
          return_url: 'http://localhost:4200/subscription/success',
          cancel_url: 'http://localhost:4200/subscription/cancel'
        }
      });

      const order = await paypalClient.client().execute(request);

      expect(order.result).toBeDefined();
      expect(order.result.id).toBeDefined();
      expect(order.result.status).toBe('CREATED');
      expect(order.result.purchase_units).toHaveLength(1);
      expect(order.result.purchase_units[0].amount.value).toBe('12.00');

      console.log('✓ Order created:', order.result.id);
      console.log('  Approval URL:', order.result.links.find(l => l.rel === 'approve')?.href);
    }, 15000);

    (shouldSkip ? it.skip : it)('should create orders for all plan types', async () => {
      const plans = [
        { id: '24h', amount: '5.00' },
        { id: 'monthly', amount: '12.00' },
        { id: 'yearly', amount: '100.00' }
      ];

      for (const plan of plans) {
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: 'EUR',
              value: plan.amount
            },
            description: `Test subscription - ${plan.id}`,
            custom_id: JSON.stringify({ userId: 1, planId: plan.id })
          }]
        });

        const order = await paypalClient.client().execute(request);

        expect(order.result.status).toBe('CREATED');
        expect(order.result.purchase_units[0].amount.value).toBe(plan.amount);

        console.log(`✓ ${plan.id} order created:`, order.result.id);
      }
    }, 30000);
  });

  describe('PayPal Order Details', () => {
    let orderId;

    beforeAll(async () => {
      if (shouldSkip) return;

      // Create an order for testing
      const request = new paypal.orders.OrdersCreateRequest();
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: '5.00'
          }
        }]
      });

      const order = await paypalClient.client().execute(request);
      orderId = order.result.id;
    });

    (shouldSkip ? it.skip : it)('should retrieve order details', async () => {
      const request = new paypal.orders.OrdersGetRequest(orderId);
      const order = await paypalClient.client().execute(request);

      expect(order.result).toBeDefined();
      expect(order.result.id).toBe(orderId);
      expect(order.result.status).toBe('CREATED');
    }, 15000);
  });

  describe('PayPal Environment Configuration', () => {
    it('should use correct environment (Sandbox for tests)', () => {
      // Vérifier qu'on est bien en mode test
      expect(process.env.NODE_ENV).toBe('test');
    });

    (shouldSkip ? it.skip : it)('should have valid PayPal credentials', () => {
      expect(process.env.PAYPAL_CLIENT_ID).toBeDefined();
      expect(process.env.PAYPAL_CLIENT_ID).not.toBe('test_client_id');
      expect(process.env.PAYPAL_CLIENT_SECRET).toBeDefined();
      expect(process.env.PAYPAL_CLIENT_SECRET).not.toBe('test_client_secret');
    });
  });
});

/**
 * Test manuel avec compte de test PayPal
 *
 * Ce test nécessite une intervention manuelle :
 * 1. Crée une commande PayPal
 * 2. Affiche l'URL d'approbation
 * 3. Vous devez vous connecter avec votre compte test PayPal
 * 4. Approuver le paiement
 * 5. Le test capture ensuite le paiement
 *
 * Pour exécuter :
 * npm test -- subscription-paypal.test.js --testNamePattern="Manual PayPal Flow"
 */
describe('Manual PayPal Flow Test (requires user interaction)', () => {
  it.skip('should complete full PayPal payment flow', async () => {
    console.log('\n🔵 Starting manual PayPal flow test...\n');

    // 1. Create order
    const createRequest = new paypal.orders.OrdersCreateRequest();
    createRequest.prefer("return=representation");
    createRequest.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          value: '5.00'
        },
        description: 'Manual Test - 24h subscription',
        custom_id: JSON.stringify({ userId: 999, planId: '24h' })
      }],
      application_context: {
        brand_name: 'Dating App Manual Test',
        return_url: 'http://localhost:4200/subscription/success',
        cancel_url: 'http://localhost:4200/subscription/cancel'
      }
    });

    const order = await paypalClient.client().execute(createRequest);
    const orderId = order.result.id;
    const approvalUrl = order.result.links.find(l => l.rel === 'approve')?.href;

    console.log('✅ Order created:', orderId);
    console.log('\n📋 MANUAL STEPS:');
    console.log('1. Open this URL in your browser:');
    console.log(`   ${approvalUrl}`);
    console.log('2. Log in with your PayPal Sandbox test account:');
    console.log('   Username:', process.env.PAYPAL_TEST_USERNAME || '[Add to .env.test]');
    console.log('   Password:', process.env.PAYPAL_TEST_PASSWORD || '[Add to .env.test]');
    console.log('3. Approve the payment');
    console.log('4. Wait for redirect...\n');

    // In a real test, you would:
    // - Use Puppeteer/Playwright to automate browser
    // - Or wait for webhook callback
    // For now, just verify order was created
    expect(orderId).toBeDefined();
    expect(approvalUrl).toContain('paypal.com');
  }, 60000);
});

// Note: Tests are automatically skipped if shouldSkip is true
// This prevents API calls when credentials are not configured
