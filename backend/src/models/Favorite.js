// models/Favorite.js
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  music: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Music',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['calming', 'focus', 'sleep', 'meditation', 'nature', 'other'],
    lowercase: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a user can't favorite the same music twice
favoriteSchema.index({ user: 1, music: 1 }, { unique: true });

// Index for faster queries
favoriteSchema.index({ user: 1, category: 1 });
favoriteSchema.index({ user: 1, addedAt: -1 });

module.exports = mongoose.model('Favorite', favoriteSchema);