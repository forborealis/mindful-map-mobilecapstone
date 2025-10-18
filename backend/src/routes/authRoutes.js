const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const AuthController = require('../controllers/authController');

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mindful-map/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' }
    ]
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  }
});

router.post('/login', AuthController.login);
router.post('/register', upload.single('avatar'), AuthController.register); // Make sure this line exists
router.get('/profile/:uid', AuthController.getProfile);
router.post('/google-auth', AuthController.googleAuth);
module.exports = router;