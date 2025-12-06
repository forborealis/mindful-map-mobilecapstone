const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  moodScore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MoodScore',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['activity', 'social', 'health', 'sleep'],
    trim: true
  },
  activity: {
    type: String,
    trim: true
  },
  moodScoreValue: {
    type: Number,
    required: true,
    min: -100,
    max: 100
  },
  sleepHours: {
    type: Number
  },
  recommendation: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['positive', 'negative'],
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


RecommendationSchema.index({ moodScore: 1, recommendation: 1 }, { unique: true });

RecommendationSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Recommendation', RecommendationSchema);