const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');  
const concordanceController = require('../controllers/concordanceController');


router.post('/run', verifyToken, concordanceController.runConcordanceForUser);
router.get('/history', verifyToken, concordanceController.getHistoricalConcordance);

module.exports = router;