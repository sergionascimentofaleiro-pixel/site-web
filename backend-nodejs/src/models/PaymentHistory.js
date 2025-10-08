const db = require('../config/database');

class PaymentHistory {
  static async create(data) {
    const {
      user_id,
      amount,
      currency,
      payment_method,
      paypal_order_id,
      subscription_type,
      status
    } = data;

    const [result] = await db.execute(
      `INSERT INTO payment_history
       (user_id, amount, currency, payment_method, paypal_order_id, subscription_type, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [user_id, amount, currency, payment_method, paypal_order_id, subscription_type, status]
    );

    return result.insertId;
  }

  static async findByPayPalOrderId(orderId) {
    const [rows] = await db.execute(
      'SELECT * FROM payment_history WHERE paypal_order_id = ? LIMIT 1',
      [orderId]
    );

    return rows[0] || null;
  }

  static async updateStatus(paymentId, status) {
    await db.execute(
      'UPDATE payment_history SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, paymentId]
    );
  }

  static async getByUserId(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM payment_history WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return rows;
  }
}

module.exports = PaymentHistory;
