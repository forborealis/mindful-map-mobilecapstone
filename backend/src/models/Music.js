// models/Music.js
const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    default: 'Unknown Artist',
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['calming', 'focus', 'sleep', 'meditation', 'nature', 'other'],
    lowercase: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
    unique: true
  },
  cloudinaryUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  thumbnail: {
    type: String,
    default: null
  },
  plays: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
musicSchema.index({ category: 1, isActive: 1 });
musicSchema.index({ title: 'text', artist: 'text' });

module.exports = mongoose.model('Music', musicSchema);