const JournalEntry = require('../models/JournalEntry');

// Create a new journal entry
exports.createJournalEntry = async (req, res) => {
  try {
    const { content, date, challenges } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(challenges) || challenges.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one challenge is required.' });
    }
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ success: false, message: 'Content is required.' });
    }

    const entry = new JournalEntry({
      user: userId,
      content,
      date: date || new Date(),
      challenges
    });

    await entry.save();
    res.status(201).json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create journal entry', error: err.message });
  }
};

// Get all journal entries for the logged-in user
exports.getJournalEntries = async (req, res) => {
  try {
    const userId = req.user._id;
    const entries = await JournalEntry.find({ user: userId }).sort({ date: -1 });
    res.json({ success: true, entries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch journal entries', error: err.message });
  }
};

// Get a single journal entry by ID
exports.getJournalEntryById = async (req, res) => {
  try {
    const userId = req.user._id;
    const entry = await JournalEntry.findOne({ _id: req.params.id, user: userId });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch entry', error: err.message });
  }
};

// Update a journal entry
exports.updateJournalEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const { content } = req.body;
    const entry = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { content },
      { new: true }
    );
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update entry', error: err.message });
  }
};

// Delete a journal entry
exports.deleteJournalEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const entry = await JournalEntry.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    res.json({ success: true, message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete entry', error: err.message });
  }
};