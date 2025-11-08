const express = require('express');
const moodPredictionController = require('../controllers/moodPredictionController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// All prediction routes require authentication
router.get('/predict-mood', verifyToken, moodPredictionController.predictMood);
router.get('/mood-logs', verifyToken, moodPredictionController.getMoodLogs);
router.get('/mood-logs-category', verifyToken, moodPredictionController.getMoodLogsForCategory);
router.get('/predict-category-mood', verifyToken, moodPredictionController.predictCategoryMood);
router.get('/check-category-data', verifyToken, moodPredictionController.checkCategoryData);

module.exports = router;