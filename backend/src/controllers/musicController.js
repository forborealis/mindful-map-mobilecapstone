// controllers/musicController.js
const Music = require('../models/Music');
const Favorite = require('../models/Favorite');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// GET all music by category
const getMusicByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user?._id; // Get user ID if authenticated
    
    const music = await Music.find({ 
      category: category.toLowerCase(), 
      isActive: true 
    }).sort({ createdAt: 1 });
    
    // If user is authenticated, check favorites
    let musicWithFavorites = music;
    if (userId) {
      const favorites = await Favorite.find({ 
        user: userId, 
        category: category.toLowerCase() 
      }).populate('music');
      
      const favoriteIds = favorites.map(fav => fav.music._id.toString());
      
      musicWithFavorites = music.map(track => ({
        ...track.toObject(),
        isFavorite: favoriteIds.includes(track._id.toString())
      }));
    }
    
    res.json({
      success: true,
      count: musicWithFavorites.length,
      data: musicWithFavorites
    });
  } catch (error) {
    console.error('Error fetching music:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching music',
      error: error.message
    });
  }
};

// GET all music
const getAllMusic = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    const music = await Music.find({ isActive: true }).sort({ createdAt: 1 });
    
    // If user is authenticated, check favorites
    let musicWithFavorites = music;
    if (userId) {
      const favorites = await Favorite.find({ user: userId }).populate('music');
      const favoriteIds = favorites.map(fav => fav.music._id.toString());
      
      musicWithFavorites = music.map(track => ({
        ...track.toObject(),
        isFavorite: favoriteIds.includes(track._id.toString())
      }));
    }
    
    res.json({
      success: true,
      count: musicWithFavorites.length,
      data: musicWithFavorites
    });
  } catch (error) {
    console.error('Error fetching music:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching music',
      error: error.message
    });
  }
};

// GET single music
const getMusicById = async (req, res) => {
  try {
    const userId = req.user?._id;
    const music = await Music.findById(req.params.id);
    
    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Music not found'
      });
    }
    
    let musicData = music.toObject();
    
    // Check if user has favorited this music
    if (userId) {
      const favorite = await Favorite.findOne({ user: userId, music: music._id });
      musicData.isFavorite = !!favorite;
    }
    
    res.json({
      success: true,
      data: musicData
    });
  } catch (error) {
    console.error('Error fetching music:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching music',
      error: error.message
    });
  }
};

// POST create new music
const createMusic = async (req, res) => {
  try {
    const { title, artist, category, cloudinaryPublicId, cloudinaryUrl, duration, thumbnail } = req.body;
    
    // Validate required fields
    if (!title || !category || !cloudinaryPublicId || !cloudinaryUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, category, cloudinaryPublicId, and cloudinaryUrl'
      });
    }
    
    // Check if music already exists
    const existingMusic = await Music.findOne({ cloudinaryPublicId });
    if (existingMusic) {
      return res.status(400).json({
        success: false,
        message: 'Music with this Cloudinary ID already exists'
      });
    }
    
    const music = await Music.create({
      title,
      artist: artist || 'Unknown Artist',
      category: category.toLowerCase(),
      cloudinaryPublicId,
      cloudinaryUrl,
      duration: duration || 0,
      thumbnail
    });
    
    res.status(201).json({
      success: true,
      message: 'Music created successfully',
      data: music
    });
  } catch (error) {
    console.error('Error creating music:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating music',
      error: error.message
    });
  }
};

// PUT update music
const updateMusic = async (req, res) => {
  try {
    const music = await Music.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Music not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Music updated successfully',
      data: music
    });
  } catch (error) {
    console.error('Error updating music:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating music',
      error: error.message
    });
  }
};

// POST increment play count
const incrementPlayCount = async (req, res) => {
  try {
    const music = await Music.findByIdAndUpdate(
      req.params.id,
      { $inc: { plays: 1 } },
      { new: true }
    );
    
    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Music not found'
      });
    }
    
    res.json({
      success: true,
      data: music
    });
  } catch (error) {
    console.error('Error updating play count:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating play count',
      error: error.message
    });
  }
};

// DELETE music (soft delete)
const deleteMusic = async (req, res) => {
  try {
    const music = await Music.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Music not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Music deleted successfully',
      data: music
    });
  } catch (error) {
    console.error('Error deleting music:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting music',
      error: error.message
    });
  }
};

// POST add music to favorites
const addToFavorites = async (req, res) => {
  try {
    const { id: musicId } = req.params;
    const userId = req.user._id;
    
    // Check if music exists
    const music = await Music.findById(musicId);
    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Music not found'
      });
    }
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ user: userId, music: musicId });
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Music already in favorites'
      });
    }
    
    const favorite = await Favorite.create({
      user: userId,
      music: musicId,
      category: music.category
    });
    
    res.status(201).json({
      success: true,
      message: 'Music added to favorites',
      data: favorite
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites',
      error: error.message
    });
  }
};

// DELETE remove music from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const { id: musicId } = req.params;
    const userId = req.user._id;
    
    const favorite = await Favorite.findOneAndDelete({ user: userId, music: musicId });
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Music removed from favorites'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites',
      error: error.message
    });
  }
};

// GET user's favorite music
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category } = req.query;
    
    let query = { user: userId };
    if (category) {
      query.category = category.toLowerCase();
    }
    
    const favorites = await Favorite.find(query)
      .populate('music')
      .sort({ addedAt: 1 });
    
    const favoriteMusic = favorites.map(fav => ({
      ...fav.music.toObject(),
      isFavorite: true,
      addedAt: fav.addedAt
    }));
    
    res.json({
      success: true,
      count: favoriteMusic.length,
      data: favoriteMusic
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
      error: error.message
    });
  }
};

// GET music categories with counts
const getMusicCategories = async (req, res) => {
  try {
    const categories = await Music.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

module.exports = {
  getMusicByCategory,
  getAllMusic,
  getMusicById,
  createMusic,
  updateMusic,
  incrementPlayCount,
  deleteMusic,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  getMusicCategories
};