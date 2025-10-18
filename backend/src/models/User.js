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
    enum: ['Grade 11 - A', 'Grade 11 - B', 'Grade 11 - C', 'Grade 11 - D'],
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);