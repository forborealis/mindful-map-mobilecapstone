const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const journalController = require('../controllers/journalController');

router.post('/create', verifyToken, journalController.createJournalEntry);
router.get('/all', verifyToken, journalController.getJournalEntries);
router.get('/entry/:id', verifyToken, journalController.getJournalEntryById);
router.put('/journal/:id', verifyToken, journalController.updateJournalEntry);
router.delete('/journal/:id', verifyToken, journalController.deleteJournalEntry);
module.exports = router;