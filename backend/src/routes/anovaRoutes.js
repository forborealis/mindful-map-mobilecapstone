const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const anovaController = require('../controllers/anovaController');

router.post('/run', verifyToken, anovaController.runAnovaForUser);
router.get('/history', verifyToken, anovaController.getHistoricalAnova);

module.exports = router;