const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const AuthController = require('../controllers/authController');

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mindful-map/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' }
    ]
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Routes
router.post('/login', AuthController.login);
router.post('/register', upload.single('avatar'), AuthController.register);
router.get('/profile/:uid', AuthController.getProfile);
router.put('/profile/:uid', upload.single('avatar'), AuthController.updateProfile);
router.post('/google-auth', AuthController.googleAuth);

module.exports = router;