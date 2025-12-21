const mongoose = require('mongoose');

const RecommendationEffectivenessSchema = new mongoose.Schema({
  recommendation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recommendation',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    trim: true,
    default: ''
  },
  sentimentScore: {
    type: Number, // -1.0 to +1.0 (stub for now)
    min: -1,
    max: 1,
    default: 0
  },
  combinedScore: {
    type: Number, // normalize to 0–1 combining rating and sentiment
    min: 0,
    max: 1,
    default: 0
  },
  effective: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

RecommendationEffectivenessSchema.index({ recommendation: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('RecommendationEffectiveness', RecommendationEffectivenessSchema);