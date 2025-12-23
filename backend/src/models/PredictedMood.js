const mongoose = require('mongoose');

const predictedMoodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  weekNumber: {
    type: Number,
    required: true
  },
  predictions: {
    activity: {
      Monday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Tuesday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Wednesday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Thursday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Friday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Saturday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Sunday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object }
    },
    social: {
      Monday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Tuesday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Wednesday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Thursday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Friday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Saturday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Sunday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object }
    },
    health: {
      Monday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Tuesday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Wednesday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Thursday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Friday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Saturday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Sunday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object }
    },
    sleep: {
      Monday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Tuesday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Wednesday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Thursday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Friday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Saturday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object },
      Sunday: { predictedMood: String, actualMood: String, allMoodProbabilities: Object }
    }
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one record per user per week
predictedMoodSchema.index({ user: 1, year: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model('PredictedMood', predictedMoodSchema);
