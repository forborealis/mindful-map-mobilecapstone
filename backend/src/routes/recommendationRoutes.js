const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const recommendationController = require('../controllers/recommendationController');

router.post('/generate', verifyToken, recommendationController.generateAndSaveRecommendation);
router.get('/week', verifyToken, recommendationController.getCurrentWeekRecommendations);
router.post('/resolve', verifyToken, recommendationController.resolveMoodScoreId);
router.post('/feedback', verifyToken, recommendationController.submitRecommendationFeedback);
router.get('/feedback/:recommendationId', verifyToken, recommendationController.getUserFeedbackForRecommendation);

module.exports = router;