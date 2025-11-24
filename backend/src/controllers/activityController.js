const BreathingExercise = require('../models/BreathingExercise');

// Get user's breathing exercise progress
exports.getProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    let progress = await BreathingExercise.findOne({ user: userId });
    if (!progress) {
      progress = await BreathingExercise.create({ user: userId });
    }
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching progress', error: err.message });
  }
};

// Update user's breathing exercise progress
exports.updateProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const update = req.body;
    let progress = await BreathingExercise.findOneAndUpdate(
      { user: userId },
      { $set: update }, // <-- Only set provided fields
      { new: true, upsert: true }
    );
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating progress', error: err.message });
  }
};