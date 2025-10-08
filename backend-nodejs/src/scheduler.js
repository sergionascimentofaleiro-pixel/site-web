const cron = require('node-cron');
const { processSubscriptions } = require('./scripts/processSubscriptions');

/**
 * Setup scheduled tasks
 */
function setupScheduler() {
  console.log('⏰ Setting up scheduled tasks...');

  // Run subscription processing every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('\n🔄 Running daily subscription processing task...');
    try {
      await processSubscriptions();
      console.log('✅ Subscription processing completed successfully\n');
    } catch (error) {
      console.error('❌ Subscription processing failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Paris"
  });

  console.log('✅ Scheduled tasks configured:');
  console.log('   - Subscription processing: Every day at 2:00 AM (Europe/Paris)');

  // Optional: Run immediately on startup for testing
  if (process.env.RUN_SCHEDULER_ON_STARTUP === 'true') {
    console.log('🚀 Running subscription processing on startup (RUN_SCHEDULER_ON_STARTUP=true)...');
    processSubscriptions()
      .then(() => console.log('✅ Initial subscription processing completed'))
      .catch(error => console.error('❌ Initial subscription processing failed:', error));
  }
}

module.exports = { setupScheduler };
