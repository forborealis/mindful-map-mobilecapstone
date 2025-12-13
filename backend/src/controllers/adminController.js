const User = require('../models/User');
const MoodLog = require('../models/MoodLog');
const { getAuth } = require('../config/firebase');

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.mongoUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can access this resource.',
      });
    }

    // Get total users
    const totalUsers = await User.countDocuments();

    // Get total teachers
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    // Get total students
    const totalStudents = await User.countDocuments({ role: 'user' });

    // Calculate active/inactive students only (exclude teachers)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const activeStudentIds = await MoodLog.distinct('user', {
      date: { $gte: twoWeeksAgo },
    });

    // Get all student users
    const allStudents = await User.find({ role: 'user' }, '_id');
    const allStudentIdStrings = allStudents.map(s => s._id.toString());

    // Filter active students - convert ObjectIds to strings for comparison
    const activeStudentIdStrings = activeStudentIds.map(id => id.toString());
    const activeStudents = activeStudentIdStrings.filter(id => 
      allStudentIdStrings.includes(id)
    ).length;

    const inactiveStudents = totalStudents - activeStudents;

    // Get monthly users registration data (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Format monthly data for frontend
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthlyUserData = monthlyUsers.map(item => ({
      month: monthNames[item._id.month - 1],
      count: item.count,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalTeachers,
        totalStudents,
        activeInactiveStudents: {
          active: activeStudents,
          inactive: inactiveStudents,
        },
        monthlyUsers: monthlyUserData,
      },
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard statistics',
      error: error.message,
    });
  }
};

// Get all users (with pagination and filtering)
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.mongoUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can access this resource.',
      });
    }

    const { page = 1, limit = 10, role = null, searchTerm = null } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (role) {
      filter.role = role;
    }
    if (searchTerm) {
      filter.$or = [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await User.countDocuments(filter);

    // Get users
    const users = await User.find(filter)
      .select('-password')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message,
    });
  }
};



// Get active and inactive users detailed info
exports.getActiveInactiveUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.mongoUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can access this resource.',
      });
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Get all users
    const allUsers = await User.find().select('-password');

    // Get active user IDs
    const activeUserIds = await MoodLog.distinct('user', {
      date: { $gte: twoWeeksAgo },
    });

    // Separate active and inactive users
    const activeUsers = allUsers.filter((user) =>
      activeUserIds.some((id) => id.toString() === user._id.toString())
    );

    const inactiveUsers = allUsers.filter(
      (user) =>
        !activeUserIds.some((id) => id.toString() === user._id.toString())
    );

    return res.status(200).json({
      success: true,
      data: {
        activeUsers,
        inactiveUsers,
        summary: {
          totalActive: activeUsers.length,
          totalInactive: inactiveUsers.length,
          total: allUsers.length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting active/inactive users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving active/inactive users',
      error: error.message,
    });
  }
};

// Get all students
exports.getStudents = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.mongoUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can access this resource.',
      });
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Get all students with their active status
    const students = await User.find({ role: 'user' }).select('-password').lean();

    // Get active student IDs
    const activeStudentIds = await MoodLog.distinct('user', {
      date: { $gte: twoWeeksAgo },
    });

    // Add isActive field to each student
    const studentsWithStatus = students.map(student => ({
      ...student,
      isActive: activeStudentIds.some(id => id.toString() === student._id.toString()),
    }));

    return res.status(200).json({
      success: true,
      data: studentsWithStatus,
    });
  } catch (error) {
    console.error('Error getting students:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving students',
      error: error.message,
    });
  }
};

// Get all teachers
exports.getTeachers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.mongoUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can access this resource.',
      });
    }

    const teachers = await User.find({ role: 'teacher' }).select('-password').lean();

    return res.status(200).json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    console.error('Error getting teachers:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving teachers',
      error: error.message,
    });
  }
};

// Create teacher
exports.createTeacher = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.mongoUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can access this resource.',
      });
    }

    const { firstName, lastName, middleInitial, email, subject, assignedSections, password } = req.body;

    // Validate inputs
    if (!firstName || !lastName || !email || !subject || !password || !assignedSections || assignedSections.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Check if email already exists in MongoDB
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Create Firebase user first
    const auth = getAuth();
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email: email.toLowerCase().trim(),
        password: password,
      });
    } catch (firebaseError) {
      console.error('Firebase error:', firebaseError);
      if (firebaseError.code === 'auth/email-already-exists') {
        return res.status(400).json({
          success: false,
          message: 'Email already exists in Firebase',
        });
      }
      throw firebaseError;
    }

    // Create new teacher in MongoDB
    const newTeacher = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleInitial: middleInitial?.trim() || '',
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      assignedSections,
      password: password, // This will be hashed by User model pre-save hook
      firebaseUid: firebaseUser.uid, // Add Firebase UID
      role: 'teacher',
    });

    await newTeacher.save();

    // Return teacher data without password
    const teacherData = newTeacher.toObject();
    delete teacherData.password;

    return res.status(201).json({
      success: true,
      data: teacherData,
      message: 'Teacher created successfully',
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating teacher',
      error: error.message,
    });
  }
};

// Update teacher
exports.updateTeacher = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.mongoUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can access this resource.',
      });
    }

    const { id } = req.params;
    const { firstName, lastName, middleInitial, subject, assignedSections } = req.body;

    // Validate inputs
    if (!firstName || !lastName || !subject || !assignedSections || assignedSections.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const teacher = await User.findByIdAndUpdate(
      id,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleInitial: middleInitial?.trim() || '',
        subject: subject.trim(),
        assignedSections,
      },
      { new: true }
    ).select('-password');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: teacher,
      message: 'Teacher updated successfully',
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating teacher',
      error: error.message,
    });
  }
};

// Delete teacher
exports.deleteTeacher = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.mongoUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can access this resource.',
      });
    }

    const { id } = req.params;

    const teacher = await User.findByIdAndDelete(id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting teacher',
      error: error.message,
    });
  }
};
