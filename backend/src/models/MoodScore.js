const mongoose = require('mongoose');

const MoodScoreSchema = new mongoose.Schema({
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
  category: {
    type: String,
    required: true,
    enum: ['activity', 'social', 'health', 'sleep']
  },
  activity: {
    type: String,
    required: function() {
      return this.category !== 'sleep';
    }
  },
  moodScore: {
    type: Number,
    required: true,
    min: -100,
    max: 100
  },
    sleepHours: {
    type: Number,
    required: false 
  }
});

module.exports = mongoose.model('MoodScore', MoodScoreSchema);