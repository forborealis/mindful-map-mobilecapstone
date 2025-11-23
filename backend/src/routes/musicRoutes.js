// routes/music.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { uploadMp3ToCloudinary, uploadMultipleMp3s } = require('../utils/uploadMusic');
const musicController = require('../controllers/musicController');
const Music = require('../models/Music');
const { verifyToken } = require('../middleware/auth');

// Single file upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const cloudinaryResult = await uploadMp3ToCloudinary(req.file.path);

    // Get metadata from form fields or use defaults
    const title = req.body.title || cloudinaryResult.public_id;
    const artist = req.body.artist || 'Unknown Artist';
    const category = req.body.category || 'other';

    // Save to MongoDB
    const musicDoc = await Music.create({
      title,
      artist,
      category,
      cloudinaryPublicId: cloudinaryResult.public_id,
      cloudinaryUrl: cloudinaryResult.secure_url,
      duration: cloudinaryResult.duration || 0
    });

    res.json({ success: true, music: musicDoc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Multiple files upload
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    const filePaths = req.files.map(f => f.path);
    const results = await uploadMultipleMp3s(filePaths);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Music routes
router.get('/categories', musicController.getMusicCategories);
router.get('/category/:category', musicController.getMusicByCategory);
router.get('/', musicController.getAllMusic);
router.get('/:id', musicController.getMusicById);
router.post('/', musicController.createMusic);
router.put('/:id', musicController.updateMusic);
router.post('/:id/play', musicController.incrementPlayCount);
router.delete('/:id', musicController.deleteMusic);

// Favorites routes (require authentication)
router.post('/:id/favorite', verifyToken, musicController.addToFavorites);
router.delete('/:id/favorite', verifyToken, musicController.removeFromFavorites);
router.get('/user/favorites', verifyToken, musicController.getFavorites);

module.exports = router;