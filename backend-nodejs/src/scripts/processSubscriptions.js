const db = require('../config/database');

/**
 * Process subscriptions: expire old ones and renew eligible ones
 */
async function processSubscriptions() {
  try {
    console.log('=== Processing Subscriptions ===');
    console.log('Time:', new Date().toISOString());

    // 1. Expire subscriptions that have passed their end_date
    const [expiredResult] = await db.execute(
      `UPDATE subscriptions
       SET status = 'expired'
       WHERE status = 'active' AND end_date < NOW()`
    );
    console.log(`Expired ${expiredResult.affectedRows} subscriptions`);

    // 2. Find subscriptions to renew (monthly and yearly with will_renew=true, ending in next 24h)
    const [subscriptionsToRenew] = await db.execute(
      `SELECT *
       FROM subscriptions
       WHERE status = 'active'
         AND will_renew = TRUE
         AND subscription_type IN ('monthly', 'yearly')
         AND end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 DAY)`
    );

    console.log(`Found ${subscriptionsToRenew.length} subscriptions to renew`);

    // 3. Renew each subscription
    for (const sub of subscriptionsToRenew) {
      try {
        const newEndDate = new Date(sub.end_date);

        if (sub.subscription_type === 'monthly') {
          newEndDate.setMonth(newEndDate.getMonth() + 1);
        } else if (sub.subscription_type === 'yearly') {
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        }

        const newEndDateString = newEndDate.toISOString().slice(0, 19).replace('T', ' ');

        await db.execute(
          `UPDATE subscriptions
           SET end_date = ?, start_date = NOW()
           WHERE id = ?`,
          [newEndDateString, sub.id]
        );

        console.log(`Renewed subscription ${sub.id} (${sub.subscription_type}) for user ${sub.user_id} until ${newEndDateString}`);

        // Note: In a real app, you would also process the payment here via PayPal/Stripe
        // For now, we just extend the subscription assuming payment succeeded
      } catch (renewError) {
        console.error(`Failed to renew subscription ${sub.id}:`, renewError);
      }
    }

    console.log('=== Subscription Processing Complete ===\n');
  } catch (error) {
    console.error('Error processing subscriptions:', error);
  }
}

// Run the script
if (require.main === module) {
  processSubscriptions()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { processSubscriptions };
