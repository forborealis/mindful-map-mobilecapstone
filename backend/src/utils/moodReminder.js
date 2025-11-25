const cron = require('node-cron');
const User = require('../models/User');
const MoodLog = require('../models/MoodLog');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function startMoodReminderJob() {
  // 14:00 UTC daily
  cron.schedule('0 14 * * *', async () => {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);

    try {
      const users = await User.find(
        { pushTokens: { $exists: true, $ne: [] } },
        { pushTokens: 1 }
      );

      const payloads = [];
      for (const u of users) {
        const hasLog = await MoodLog.exists({
          user: u._id,
          date: { $gte: start, $lte: end }
        });
        if (!hasLog) {
          for (const t of u.pushTokens) {
            payloads.push({
              to: t,
              title: "Log today’s mood",
              body: "Take a moment to check in.",
              sound: 'default',
              priority: 'high',
              data: { screen: 'MoodInput' }
            });
          }
        }
      }

      for (let i = 0; i < payloads.length; i += 100) {
        const chunk = payloads.slice(i, i + 100);
        await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk)
        });
      }

      console.log('Mood reminders sent:', payloads.length);
    } catch (e) {
      console.error('Mood reminder job error:', e.message);
    }
  });
}

module.exports = { startMoodReminderJob };