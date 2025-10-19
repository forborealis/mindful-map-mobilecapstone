const express = require('express');
const MoodDataController = require('../controllers/moodDataController');
const router = express.Router();

router.get('/logs', MoodDataController.getAllMoodLogs);
router.get('/logs/user/:userId', MoodDataController.getUserMoodLogs);
router.get('/logs/:id', MoodDataController.getMoodLogById);
router.get('/stats/user/:userId', MoodDataController.getUserMoodStats);
module.exports = router;