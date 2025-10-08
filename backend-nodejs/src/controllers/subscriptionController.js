const paypal = require('@paypal/checkout-server-sdk');
const paypalClient = require('../config/paypal');
const Subscription = require('../models/Subscription');
const PaymentHistory = require('../models/PaymentHistory');

// Get user subscription status
exports.getStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const freeLimit = parseInt(process.env.FREE_CONVERSATION_LIMIT || 5);

    const hasSubscription = await Subscription.hasActiveSubscription(userId);
    const conversationCount = await Subscription.getConversationCount(userId);
    const userConversations = await Subscription.getUserConversations(userId);

    const status = {
      hasSubscription,
      conversationCount,
      freeLimit,
      conversationsRemaining: Math.max(0, freeLimit - conversationCount),
      canAccessNewConversations: hasSubscription || conversationCount < freeLimit,
      userConversations: userConversations.map(row => row.match_id)
    };

    if (hasSubscription) {
      status.subscription = await Subscription.getActiveSubscription(userId);
    }

    res.json(status);
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
};

// Check if user can access a specific conversation
exports.canAccessConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const matchId = parseInt(req.params.matchId);

    if (isNaN(matchId)) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }

    const result = await Subscription.canAccessConversation(userId, matchId);
    res.json(result);
  } catch (error) {
    console.error('Can access conversation error:', error);
    res.status(500).json({ error: 'Failed to check conversation access' });
  }
};

// Get available subscription plans
exports.getPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: '24h',
        nameKey: 'subscription.plan24h.name',
        price: process.env.PRICE_24H || '5.00',
        currency: 'EUR',
        durationKey: 'subscription.plan24h.duration',
        descriptionKey: 'subscription.plan24h.description',
        recurring: false
      },
      {
        id: 'monthly',
        nameKey: 'subscription.planMonthly.name',
        price: process.env.PRICE_MONTHLY || '12.00',
        currency: 'EUR',
        durationKey: 'subscription.planMonthly.duration',
        descriptionKey: 'subscription.planMonthly.description',
        recurring: true,
        savingsKey: 'subscription.planMonthly.savings'
      },
      {
        id: 'yearly',
        nameKey: 'subscription.planYearly.name',
        price: process.env.PRICE_YEARLY || '100.00',
        currency: 'EUR',
        durationKey: 'subscription.planYearly.duration',
        descriptionKey: 'subscription.planYearly.description',
        recurring: true,
        savingsKey: 'subscription.planYearly.savings'
      }
    ];

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
};

// Create PayPal order
exports.createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Get plan details
    let price, subscriptionType;
    switch (planId) {
      case '24h':
        price = parseFloat(process.env.PRICE_24H || 5);
        subscriptionType = '24h';
        break;
      case 'monthly':
        price = parseFloat(process.env.PRICE_MONTHLY || 12);
        subscriptionType = 'monthly';
        break;
      case 'yearly':
        price = parseFloat(process.env.PRICE_YEARLY || 100);
        subscriptionType = 'yearly';
        break;
      default:
        return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const amount = price.toFixed(2);

    // Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          value: amount
        },
        description: `Dating App - ${subscriptionType} subscription`,
        custom_id: JSON.stringify({ userId, planId: subscriptionType })
      }],
      application_context: {
        brand_name: 'Dating App',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/subscription/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/subscription/cancel`
      }
    });

    const order = await paypalClient.client().execute(request);

    // Store pending order in database
    await PaymentHistory.create({
      user_id: userId,
      amount: price,
      currency: 'EUR',
      payment_method: 'paypal',
      paypal_order_id: order.result.id,
      subscription_type: subscriptionType,
      status: 'pending'
    });

    res.json({
      orderId: order.result.id
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Capture PayPal payment
exports.captureOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.userId; // Get from authenticated user

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    console.log('Capturing order:', orderId, 'for user:', userId);

    // Capture the payment
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await paypalClient.client().execute(request);
    console.log('Capture result status:', capture.result.status);
    console.log('Capture result:', JSON.stringify(capture.result, null, 2));

    if (capture.result.status === 'COMPLETED') {
      // Try to get custom_id from the order
      let planId;
      try {
        const customId = JSON.parse(capture.result.purchase_units[0].custom_id);
        planId = customId.planId;
        console.log('Plan ID from custom_id:', planId);
      } catch (parseError) {
        // Fallback: get planId from payment history
        console.log('Could not parse custom_id, fetching from payment history');
        const payment = await PaymentHistory.findByPayPalOrderId(orderId);
        if (payment) {
          planId = payment.subscription_type;
          console.log('Plan ID from payment history:', planId);
        } else {
          throw new Error('Could not determine plan ID');
        }
      }

      // Activate subscription
      await handleSuccessfulPayment(userId, planId, orderId);

      res.json({
        success: true,
        orderId: capture.result.id
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Capture order error:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('PayPal response:', JSON.stringify(error.response, null, 2));
    }
    res.status(500).json({ error: 'Failed to capture payment' });
  }
};

// PayPal webhook handler
exports.webhook = async (req, res) => {
  try {
    const webhookEvent = req.body;

    console.log('PayPal webhook received:', webhookEvent.event_type);

    // Handle different event types
    switch (webhookEvent.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        const resource = webhookEvent.resource;
        const orderId = resource.supplementary_data?.related_ids?.order_id;

        if (orderId && resource.custom_id) {
          const customId = JSON.parse(resource.custom_id);
          const { userId, planId } = customId;

          await handleSuccessfulPayment(userId, planId, orderId);
        }
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        const failedOrderId = webhookEvent.resource.supplementary_data?.related_ids?.order_id;
        if (failedOrderId) {
          const payment = await PaymentHistory.findByPayPalOrderId(failedOrderId);
          if (payment) {
            await PaymentHistory.updateStatus(payment.id, 'failed');
          }
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Handle successful payment
async function handleSuccessfulPayment(userId, planId, orderId) {
  try {
    console.log('=== handleSuccessfulPayment START ===');
    console.log('userId:', userId, 'planId:', planId, 'orderId:', orderId);

    // Find payment record
    const payment = await PaymentHistory.findByPayPalOrderId(orderId);
    console.log('Payment record found:', payment);

    if (!payment) {
      console.error('Payment not found:', orderId);
      return;
    }

    // Update payment status
    await PaymentHistory.updateStatus(payment.id, 'completed');
    console.log('Payment status updated to completed');

    // Calculate subscription end date and get amount
    let endDate = new Date();
    let amount = payment.amount;
    console.log('Start date:', endDate, 'Amount:', amount);

    switch (planId) {
      case '24h':
        endDate.setHours(endDate.getHours() + 24);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    const endDateString = endDate.toISOString().split('T')[0];
    console.log('End date calculated:', endDateString);

    // Create subscription
    console.log('Creating subscription with params:', {
      userId,
      planId,
      amount,
      endDate: endDateString
    });

    const subscriptionId = await Subscription.create(
      userId,
      planId,
      amount,
      endDateString
    );

    console.log('Subscription created with ID:', subscriptionId);
    console.log('Subscription activated for user:', userId);
    console.log('=== handleSuccessfulPayment END ===');
  } catch (error) {
    console.error('Handle successful payment error:', error);
    console.error('Error stack:', error.stack);
  }
}

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.userId;

    // Get active subscription
    const subscription = await Subscription.getActiveSubscription(userId);
    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // 24h subscriptions cannot be cancelled
    if (subscription.subscription_type === '24h') {
      return res.status(400).json({ error: '24-hour subscriptions cannot be cancelled' });
    }

    // Cancel subscription with appropriate logic
    const result = await Subscription.cancelSubscription(subscription.id);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const history = await PaymentHistory.getByUserId(userId);
    res.json(history);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
};
