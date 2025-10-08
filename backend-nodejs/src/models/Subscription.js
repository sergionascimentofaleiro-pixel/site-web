const db = require('../config/database');

class Subscription {
  static async create(userId, subscriptionType, amount, endDate, stripePaymentIntentId = null, stripeSubscriptionId = null) {
    const [result] = await db.execute(
      `INSERT INTO subscriptions (user_id, subscription_type, amount, end_date, stripe_payment_intent_id, stripe_subscription_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, subscriptionType, amount, endDate, stripePaymentIntentId, stripeSubscriptionId]
    );
    return result.insertId;
  }

  static async getActiveSubscription(userId) {
    const [rows] = await db.execute(
      `SELECT * FROM subscriptions
       WHERE user_id = ? AND status = 'active' AND end_date > NOW()
       ORDER BY end_date DESC
       LIMIT 1`,
      [userId]
    );
    return rows[0];
  }

  static async getAllUserSubscriptions(userId) {
    const [rows] = await db.execute(
      `SELECT * FROM subscriptions
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async updateStatus(subscriptionId, status) {
    await db.execute(
      'UPDATE subscriptions SET status = ? WHERE id = ?',
      [status, subscriptionId]
    );
  }

  static async cancelSubscription(subscriptionId) {
    const [subscription] = await db.execute(
      'SELECT * FROM subscriptions WHERE id = ?',
      [subscriptionId]
    );

    if (!subscription[0]) {
      throw new Error('Subscription not found');
    }

    const sub = subscription[0];
    const subscriptionType = sub.subscription_type;
    const startDate = new Date(sub.start_date);
    const now = new Date();
    const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));

    // Yearly subscription cancelled within 14 days → immediate cancellation
    if (subscriptionType === 'yearly' && daysSinceStart <= 14) {
      await db.execute(
        `UPDATE subscriptions
         SET status = 'cancelled', cancelled_at = NOW(), will_renew = FALSE, end_date = NOW()
         WHERE id = ?`,
        [subscriptionId]
      );
      return {
        immediate: true,
        refund: true,
        message: 'Subscription cancelled immediately with full refund (14-day money-back guarantee)'
      };
    }

    // All other cases: cancel at end of period (no refund)
    await db.execute(
      `UPDATE subscriptions
       SET cancelled_at = NOW(), will_renew = FALSE
       WHERE id = ?`,
      [subscriptionId]
    );

    return {
      immediate: false,
      refund: false,
      message: 'Subscription will not renew. Access continues until end date.'
    };
  }

  static async findByStripeSubscriptionId(stripeSubscriptionId) {
    const [rows] = await db.execute(
      'SELECT * FROM subscriptions WHERE stripe_subscription_id = ?',
      [stripeSubscriptionId]
    );
    return rows[0];
  }

  static async expireOldSubscriptions() {
    await db.execute(
      `UPDATE subscriptions
       SET status = 'expired'
       WHERE status = 'active' AND end_date < NOW()`
    );
  }

  static async hasActiveSubscription(userId) {
    const subscription = await this.getActiveSubscription(userId);
    return !!subscription;
  }

  // Conversation tracking methods
  static async getConversationCount(userId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM user_conversations WHERE user_id = ?',
      [userId]
    );
    return rows[0].count;
  }

  static async addConversation(userId, matchId) {
    await db.execute(
      'INSERT IGNORE INTO user_conversations (user_id, match_id) VALUES (?, ?)',
      [userId, matchId]
    );
  }

  static async hasConversation(userId, matchId) {
    const [rows] = await db.execute(
      'SELECT id FROM user_conversations WHERE user_id = ? AND match_id = ?',
      [userId, matchId]
    );
    return rows.length > 0;
  }

  static async getUserConversations(userId) {
    const [rows] = await db.execute(
      'SELECT match_id FROM user_conversations WHERE user_id = ? ORDER BY first_message_at ASC',
      [userId]
    );
    return rows;
  }

  static async canAccessConversation(userId, matchId) {
    const freeLimit = parseInt(process.env.FREE_CONVERSATION_LIMIT || 5);

    // Check if user has active subscription
    const hasSubscription = await this.hasActiveSubscription(userId);
    if (hasSubscription) {
      return { canAccess: true, reason: 'subscription' };
    }

    // Check if user already has this conversation
    const hasConversation = await this.hasConversation(userId, matchId);
    if (hasConversation) {
      return { canAccess: true, reason: 'existing_conversation' };
    }

    // Check conversation count
    const conversationCount = await this.getConversationCount(userId);
    if (conversationCount < freeLimit) {
      return { canAccess: true, remaining: freeLimit - conversationCount, reason: 'free' };
    }

    return { canAccess: false, conversationCount, limit: freeLimit, reason: 'limit_reached' };
  }
}

module.exports = Subscription;
