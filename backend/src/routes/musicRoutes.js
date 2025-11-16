// routes/music.js
const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const { verifyToken } = require('../middleware/auth');

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