const express = require('express');
const activityController = require('../controllers/activityController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Breathing exercise routes
router.get('/breathing/progress', verifyToken, activityController.getProgress);
router.post('/breathing/progress', verifyToken, activityController.updateProgress);

module.exports = router;