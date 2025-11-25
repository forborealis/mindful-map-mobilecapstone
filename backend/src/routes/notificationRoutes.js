const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const MoodLog = require('../models/MoodLog');
const { sendPush } = require('../utils/sendPush');

// Register Expo push token and immediately send a reminder if no mood log today
router.post('/register-push-token', verifyToken, async (req, res) => {
  console.log('[register-push-token] uid:', req.user?.uid, 'token:', req.body?.token);
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'Missing token' });

  try {
    // Find Mongo user by Firebase UID
    const user = await User.findOne({ firebaseUid: req.user.uid }).select('pushTokens _id');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Persist token (avoid duplicates)
    let added = false;
    if (!user.pushTokens?.includes(token)) {
      user.pushTokens.push(token);
      await user.save();
      added = true;
    }

    // Check if user has a mood log today
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const hasLog = await MoodLog.exists({ user: user._id, date: { $gte: start, $lte: end } });

    let sent = 0;
    if (!hasLog) {
      // Send to all stored tokens so user gets the reminder even if they had an old token
      for (const t of user.pushTokens) {
        await sendPush(t, 'Log today’s mood', 'Take a moment to check in.', { screen: 'ChooseCategory' });
        sent++;
      }
    }

    return res.json({ success: true, tokenStored: added, immediateReminderSent: sent > 0, sentCount: sent });
  } catch (e) {
    console.error('[register-push-token] error:', e.message);
    return res.status(500).json({ success: false, error: 'Failed to save token' });
  }
});

module.exports = router;