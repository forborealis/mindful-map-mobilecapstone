const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const recommendationController = require('../controllers/recommendationController');

router.post('/generate', verifyToken, recommendationController.generateAndSaveRecommendation);
router.get('/week', verifyToken, recommendationController.getCurrentWeekRecommendations);

module.exports = router;