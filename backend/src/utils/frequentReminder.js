const cron = require('node-cron');
const User = require('../models/User');
const MoodLog = require('../models/MoodLog');
const { sendPush } = require('./sendPush');

function startFrequentReminderJob() {
  console.log('[FrequentReminder] scheduling */5 min job');
  cron.schedule('*/5 * * * *', async () => {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);

    try {
      const users = await User.find({ pushTokens: { $exists: true, $ne: [] } })
        .select('pushTokens lastReminderSentAt');

      for (const u of users) {
        const hasLog = await MoodLog.exists({
          user: u._id,
          date: { $gte: start, $lte: end }
        });
        if (hasLog) continue;

        if (u.lastReminderSentAt &&
            Date.now() - u.lastReminderSentAt.getTime() < 4 * 60 * 1000) {
          continue;
        }

        for (const t of u.pushTokens) {
          await sendPush(t, 'Mood check', 'Don’t forget to log your mood.', { screen: 'ChooseCategory' });
        }
        u.lastReminderSentAt = new Date();
        await u.save();
      }
      console.log('[FrequentReminder] cycle complete');
    } catch (e) {
      console.error('[FrequentReminder] error:', e.message);
    }
  });
}

module.exports = { startFrequentReminderJob };