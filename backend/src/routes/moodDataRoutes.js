const express = require('express');
const MoodDataController = require('../controllers/moodDataController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Existing routes
router.get('/logs', MoodDataController.getAllMoodLogs);
router.get('/logs/user/:userId', MoodDataController.getUserMoodLogs);
router.get('/logs/:id', MoodDataController.getMoodLogById);
router.get('/stats/user/:userId', MoodDataController.getUserMoodStats);

// New routes for mood log operations (require authentication)
router.post('/logs/save', verifyToken, MoodDataController.saveMood);
router.get('/logs/today/last', verifyToken, MoodDataController.getTodaysLastMoodLog);
router.get('/logs/today/sleep', verifyToken, MoodDataController.getTodaysSleepLog);
router.get('/logs/check', verifyToken, MoodDataController.checkMoodLogs);
router.get('/logs/paginated', verifyToken, MoodDataController.getPaginatedMoodLogs);
router.get('/logs/category/:category', verifyToken, MoodDataController.getMoodLogsByCategory);

router.get('/daily-anova', verifyToken, MoodDataController.calculateDailyAnova);
router.get('/weekly-anova', verifyToken, MoodDataController.calculateWeeklyAnova);
module.exports = router;