const mongoose = require('mongoose');

const CHALLENGE_TYPES = [
  'Gratitude',
  'Goal Setting',
  'Self Reflection',
  'Positive Affirmation',
  'Daily Highlights',
  'Problem Solving',
  'Free Write'
];

const JournalEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  challenges: [{
    type: String,
    required: true,
    enum: CHALLENGE_TYPES
  }],
  content: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);