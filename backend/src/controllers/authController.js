const bcrypt = require('bcryptjs');
const { getAuth, getFirestore } = require('../config/firebase');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

class AuthController{

static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          error: 'Email and password are required'  
        });
      }
      
      console.log(`🔐 Login attempt for: ${email}`);
      
      const auth = getAuth();

      // Verify user exists in Firebase Auth
      let firebaseUser;
      try {
        firebaseUser = await auth.getUserByEmail(email);
      } catch (error) {
        console.log('❌ Firebase user not found:', email);
        return res.status(401).json({ 
          success: false,
          error: 'No account found with this email address'  
        });
      }
      
      if (firebaseUser.disabled) {
        return res.status(401).json({ 
          success: false,
          error: 'Account is disabled' 
        });
      }

      const mongoUser = await User.findOne({ 
        $or: [
          { firebaseUid: firebaseUser.uid },
          { email: email }
        ]
      });
      
      if (!mongoUser) {
        console.log('❌ MongoDB user not found:', email);
        return res.status(401).json({
          success: false,
          error: 'No account found with this email address'  
        });
      }
      
      const isPasswordValid = await bcrypt.compare(password, mongoUser.password);
      
      if (!isPasswordValid) {
        console.log('❌ Invalid password for:', email);
        return res.status(401).json({
          success: false,
          error: 'Incorrect password. Please try again.' 
        });
      }
      
      // Generate custom token
      const customToken = await auth.createCustomToken(firebaseUser.uid);
      
      console.log('✅ Login successful for:', email);
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          firstName: mongoUser.firstName,
          lastName: mongoUser.lastName,
          displayName: firebaseUser.displayName,
          avatar: mongoUser.avatar,
          section: mongoUser.section,
          gender: mongoUser.gender,
          role: mongoUser.role
        },
        token: customToken
      });
      
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error during login'  
      });
    }
  }  

static async register(req, res) {
  try {
    console.log('📝 Registration request received');
    console.log('Body:', req.body);
    console.log('File:', req.file ? 'Present' : 'Not present');
    console.log('Headers:', req.headers);
    
    let email, password, firstName, lastName, middleInitial, gender, section;
    
    if (req.body && Object.keys(req.body).length > 0) {
      ({ email, password, firstName, lastName, middleInitial, gender, section } = req.body);
    } else if (req.fields) {
      ({ email, password, firstName, lastName, middleInitial, gender, section } = req.fields);
    } else {
      email = req.body?.email || req.email;
      password = req.body?.password || req.password;
      firstName = req.body?.firstName || req.firstName;
      lastName = req.body?.lastName || req.lastName;
      middleInitial = req.body?.middleInitial || req.middleInitial;
      gender = req.body?.gender || req.gender;
      section = req.body?.section || req.section;
    }
    
    console.log('📝 Extracted data:', {
      email: email ? '✓' : '✗',
      password: password ? '✓' : '✗',
      firstName: firstName ? '✓' : '✗',
      lastName: lastName ? '✓' : '✗',
      hasFile: !!req.file
    });
    
    if (!email || !password || !firstName || !lastName) {
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
        } catch (deleteError) {
          console.log('⚠️ Failed to delete uploaded avatar:', deleteError);
        }
      }
      
      return res.status(400).json({
        success: false,
        error: 'All required fields must be filled'
      });
    }
    
    if (password.length < 6) {
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
        } catch (deleteError) {
          console.log('⚠️ Failed to delete uploaded avatar:', deleteError);
        }
      }
      
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }
    
    const auth = getAuth();
    const firestore = getFirestore();
    const avatarUrl = req.file ? req.file.path : '';
    const avatarPublicId = req.file ? req.file.filename : '';
    
    console.log('📷 Avatar upload info:', {
      hasFile: !!req.file,
      avatarUrl,
      avatarPublicId
    });
    
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create Firebase user
      const firebaseUser = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        emailVerified: true,
        photoURL: avatarUrl 
      });
      
      try {
        await firestore.collection('users').doc(firebaseUser.uid).set({
          firstName,
          middleInitial: middleInitial || '',
          lastName,
          email,
          gender: gender || 'Rather not say',
          section: section || 'Grade 11 - A',
          avatar: avatarUrl,              
          avatarPublicId: avatarPublicId, 
          role: 'user',
          createdAt: new Date(),
          firebaseUid: firebaseUser.uid
        });
      } catch (firestoreError) {
        console.log('⚠️ Firestore save failed:', firestoreError.message);
      }
      
      const mongoUser = new User({
        email,
        firstName,
        lastName,
        middleInitial: middleInitial || '',
        gender: gender || 'Rather not say',
        section: section || 'Grade 11 - A',
        firebaseUid: firebaseUser.uid,
        password: hashedPassword,
        avatar: avatarUrl,              
        avatarPublicId: avatarPublicId, 
        role: 'user'
      });
      
      await mongoUser.save();
      
      const customToken = await auth.createCustomToken(firebaseUser.uid);
      
      console.log('✅ Registration successful with avatar:', avatarUrl);
      
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          firstName: mongoUser.firstName,
          lastName: mongoUser.lastName,
          displayName: firebaseUser.displayName,
          avatar: mongoUser.avatar,
          section: mongoUser.section,
          gender: mongoUser.gender,
          role: mongoUser.role
        },
        token: customToken
      });
      
    } catch (firebaseError) {
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
          console.log('🗑️ Deleted uploaded avatar due to registration failure');
        } catch (deleteError) {
          console.log('⚠️ Failed to delete uploaded avatar:', deleteError);
        }
      }
      
      if (firebaseError.code === 'auth/email-already-exists') {
        return res.status(400).json({
          success: false,
          error: 'An account with this email already exists'
        });
      }
      
      console.error('❌ Firebase error:', firebaseError);
      return res.status(400).json({
        success: false,
        error: 'Failed to create account. Please try again.'
      });
    }
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
        console.log('🗑️ Cleaned up avatar after registration error');
      } catch (deleteError) {
        console.log('⚠️ Failed to cleanup avatar:', deleteError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.'
    });
  }
}
static async getProfile(req, res) {
  try {
    const { uid } = req.params;
    
    const mongoUser = await User.findOne({ firebaseUid: uid });
    
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        uid: mongoUser.firebaseUid,
        email: mongoUser.email,
        firstName: mongoUser.firstName,
        middleInitial: mongoUser.middleInitial,
        lastName: mongoUser.lastName,
        gender: mongoUser.gender,
        section: mongoUser.section,
        avatar: mongoUser.avatar,
        avatarPublicId: mongoUser.avatarPublicId, 
        role: mongoUser.role,
        createdAt: mongoUser.createdAt
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
}

static async googleAuth(req, res) {
  try {
    const { uid, email, firstName, lastName, avatar, displayName } = req.body;
    
    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    console.log('🔍 Google auth for:', email);
    
    const auth = getAuth(); 
    let mongoUser = await User.findOne({ 
      $or: [
        { firebaseUid: uid },
        { email: email }
      ]
    });
    
    let isNewUser = false;
    
    if (!mongoUser) {
      // Create new user
      isNewUser = true;
      mongoUser = new User({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        firebaseUid: uid,
        avatar: avatar || '',
        role: 'user',
        gender: 'Rather not say',
        section: 'Grade 11 - A',
        password: 'google-auth', 
      });
      
      await mongoUser.save();
      console.log('✅ New Google user created:', email);
    } else {
      if (avatar && !mongoUser.avatar) {
        mongoUser.avatar = avatar;
        await mongoUser.save();
      }
      console.log('✅ Existing Google user logged in:', email);
    }
    
    const customToken = await auth.createCustomToken(uid);
    
    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      user: {
        uid: mongoUser.firebaseUid,
        email: mongoUser.email,
        firstName: mongoUser.firstName,
        lastName: mongoUser.lastName,
        avatar: mongoUser.avatar,
        section: mongoUser.section,
        gender: mongoUser.gender,
        role: mongoUser.role
      },
      token: customToken,
      isNewUser
    });
    
  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Google authentication failed'
    });
  }
}

}
module.exports = AuthController;