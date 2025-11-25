const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: false,
  },
  middleInitial: {
    type: String,
    required: false,
    maxlength: 2,
  },
  lastName: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Rather not say'],
    default: 'Rather not say'
  },
  section: {
    type: String,
    enum: ['St. John Paul II (STEM 1)', 'St. Paul VI (STEM 2)', 'St. John XXIII (STEM 3)', 'St. Pius X (HUMSS) (STEM 3)', 'St. Tarcisius (ABM)', 'St. Jose Sanchez Del Rio (ICT)', 'N/A'],
    default: 'N/A',
    required: false,
  },
  avatar: {
    type: String, 
    required: false, 
  },
  avatarPublicId: {           
    type: String,
    required: false,
    default: ''
  },
  firebaseUid: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'user',
  },
  provider: {
    type: String,
    enum: ['Google'],
    required: false,
    default: undefined
  },
  pushTokens: {
    type: [String],
    default: []
  },
  lastReminderSentAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);