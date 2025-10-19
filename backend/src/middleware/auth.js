const { getAuth } = require('../config/firebase');
const User = require('../models/User');

// Middleware to verify Firebase tokens
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid token provided.'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Find the user in your MongoDB database using Firebase UID
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found in database'
      });
    }
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      _id: user._id, // MongoDB user ID
      mongoUser: user // Full user document
    };
    
    next();
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware to check if user can access specific user data
const checkUserAccess = (req, res, next) => {
  const { userId } = req.params;
  
  // Allow if requesting own data
  if (req.user._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. You can only access your own data.'
    });
  }
  
  next();
};

module.exports = { verifyToken, checkUserAccess };