const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  // Legacy source (ANOVA/old)
  moodScore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MoodScore',
    required: false
  },
  // New source (CCC)
  moodLog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MoodLog',
    required: false
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

// Require at least one source (MoodScore or MoodLog)
RecommendationSchema.pre('validate', function (next) {
  if (!this.moodScore && !this.moodLog) {
    return next(new Error('Either moodScore or moodLog is required'));
  }
  next();
});

// Unique per source+text (handles both flows)
RecommendationSchema.index(
  { moodScore: 1, recommendation: 1 },
  { unique: true, partialFilterExpression: { moodScore: { $exists: true } } }
);
RecommendationSchema.index(
  { moodLog: 1, recommendation: 1 },
  { unique: true, partialFilterExpression: { moodLog: { $exists: true } } }
);

// Useful query index
RecommendationSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Recommendation', RecommendationSchema);