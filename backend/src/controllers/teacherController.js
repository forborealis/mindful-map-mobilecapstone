const User = require('../models/User');
const MoodLog = require('../models/MoodLog');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mindful-map/avatars',
    allowedFormats: ['jpg', 'png', 'gif'],
  },
});

const upload = multer({ storage: storage });

/**
 * Get teacher profile
 */
exports.getTeacherProfile = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id).select('-password');
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found.' 
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

/**
 * Update teacher profile
 */
exports.updateTeacherProfile = async (req, res) => {
  try {
    const { firstName, lastName, middleInitial, subject } = req.body;
    
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found.' 
      });
    }

    // Update allowed fields
    if (firstName) teacher.firstName = firstName;
    if (lastName) teacher.lastName = lastName;
    if (middleInitial) teacher.middleInitial = middleInitial;
    if (subject) teacher.subject = subject;

    // Update avatar if provided
    if (req.file) {
      // Delete old avatar from Cloudinary if it exists
      if (teacher.avatarPublicId) {
        try {
          await cloudinary.uploader.destroy(teacher.avatarPublicId);
          console.log(`✅ Deleted old avatar: ${teacher.avatarPublicId}`);
        } catch (deleteError) {
          console.error('Error deleting old avatar:', deleteError);
          // Continue with update even if deletion fails
        }
      }
      
      // Set new avatar - extract public_id from filename or use direct value
      teacher.avatar = req.file.path;
      
      const publicId = req.file.filename || req.file.public_id;
      teacher.avatarPublicId = publicId;
      
      console.log(`✅ New avatarPublicId set: ${teacher.avatarPublicId}`);
    }

    await teacher.save();

    // Reload to ensure all fields are populated
    const savedTeacher = await User.findById(req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        firstName: savedTeacher.firstName,
        lastName: savedTeacher.lastName,
        middleInitial: savedTeacher.middleInitial,
        subject: savedTeacher.subject,
        email: savedTeacher.email,
        assignedSections: savedTeacher.assignedSections,
        avatar: savedTeacher.avatar,
        avatarPublicId: savedTeacher.avatarPublicId || ''
      }
    });
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

/**
 * Export multer upload middleware for avatar
 */
exports.uploadAvatar = upload.single('avatar');

/**
 * Get students by teacher's assigned sections
 */
exports.getStudentsBySection = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found.' 
      });
    }

    const students = await User.find({ 
      section: { $in: teacher.assignedSections || [] },
      role: 'user' 
    }).select('-password');

    // Get mood log counts for each student
    const studentsWithLogs = await Promise.all(
      students.map(async (student) => {
        const moodLogCounts = await MoodLog.aggregate([
          { $match: { user: student._id } },
          { $group: { 
            _id: '$category', 
            count: { $sum: 1 } 
          }}
        ]);

        // Convert array to object for easier access
        const counts = {};
        moodLogCounts.forEach(item => {
          counts[item._id] = item.count;
        });

        return {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          section: student.section,
          avatar: student.avatar,
          moodLogCounts: counts
        };
      })
    );

    res.status(200).json({
      success: true,
      data: studentsWithLogs,
      sections: teacher.assignedSections || []
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

/**
 * Get mood logs for students in teacher's sections
 */
exports.getStudentMoodLogs = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found.' 
      });
    }

    // Get all students in teacher's assigned sections
    const students = await User.find({ 
      section: { $in: teacher.assignedSections || [] },
      role: 'user' 
    }).select('_id firstName lastName email section');

    const studentIds = students.map(student => student._id);

    // Get mood logs for these students
    const moodLogs = await MoodLog.find({ 
      user: { $in: studentIds } 
    })
      .populate('user', 'firstName lastName email section')
      .sort({ date: -1 });

    // Enrich mood logs with student info
    const enrichedMoodLogs = moodLogs.map(log => ({
      ...log.toObject(),
      studentName: `${log.user.firstName} ${log.user.lastName}`,
      studentEmail: log.user.email,
      studentSection: log.user.section
    }));

    res.status(200).json({
      success: true,
      data: enrichedMoodLogs,
      sections: teacher.assignedSections || [],
      totalLogs: enrichedMoodLogs.length
    });
  } catch (error) {
    console.error('Error fetching student mood logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

/**
 * Get mood logs for a specific section
 */
exports.getMoodLogsBySection = async (req, res) => {
  try {
    const { section } = req.params;
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found.' 
      });
    }

    // Verify teacher has access to this section
    if (!teacher.assignedSections || !teacher.assignedSections.includes(section)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied to this section.' 
      });
    }

    // Get all students in the specified section
    const students = await User.find({ 
      section: section,
      role: 'user' 
    }).select('_id firstName lastName email');

    const studentIds = students.map(student => student._id);

    // Get mood logs for these students
    const moodLogs = await MoodLog.find({ 
      user: { $in: studentIds } 
    })
      .populate('user', 'firstName lastName email section')
      .sort({ date: -1 });

    // Enrich mood logs with student info
    const enrichedMoodLogs = moodLogs.map(log => ({
      ...log.toObject(),
      studentName: `${log.user.firstName} ${log.user.lastName}`,
      studentEmail: log.user.email,
      studentSection: log.user.section
    }));

    res.status(200).json({
      success: true,
      data: enrichedMoodLogs,
      section: section,
      totalLogs: enrichedMoodLogs.length
    });
  } catch (error) {
    console.error('Error fetching mood logs by section:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

/**
 * Get students in a specific section with mood log counts
 */
exports.getSectionStudents = async (req, res) => {
  try {
    const { section } = req.params;
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found.' 
      });
    }

    // Verify teacher has access to this section
    if (!teacher.assignedSections || !teacher.assignedSections.includes(section)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied to this section.' 
      });
    }

    // Get students in the specified section
    const students = await User.find({ 
      section: section,
      role: 'user' 
    }).select('firstName lastName email avatar section');

    // Get mood log counts for each student
    const studentsWithLogs = await Promise.all(
      students.map(async (student) => {
        const moodLogCounts = await MoodLog.aggregate([
          { $match: { user: student._id } },
          { $group: { 
            _id: '$category', 
            count: { $sum: 1 } 
          }}
        ]);

        // Convert array to object for easier access
        const counts = {};
        moodLogCounts.forEach(item => {
          counts[item._id] = item.count;
        });

        return {
          ...student.toObject(),
          name: `${student.firstName} ${student.lastName}`,
          moodLogCounts: counts
        };
      })
    );

    res.status(200).json({
      success: true,
      data: studentsWithLogs,
      section: section
    });
  } catch (error) {
    console.error('Error fetching section students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

/**
 * Get mood logs for a specific student
 */
exports.getStudentMoodLogsById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found.' 
      });
    }

    // Get the student and verify they're in teacher's section
    const student = await User.findById(studentId).select('firstName lastName email section');
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found.' 
      });
    }

    // Verify teacher has access to this student's section
    if (!teacher.assignedSections || !teacher.assignedSections.includes(student.section)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied to this student.' 
      });
    }

    // Get mood logs for this student
    const moodLogs = await MoodLog.find({ 
      user: studentId 
    }).sort({ date: -1 });

    // Enrich mood logs with student info
    const enrichedMoodLogs = moodLogs.map(log => ({
      ...log.toObject(),
      studentName: `${student.firstName} ${student.lastName}`,
      studentEmail: student.email,
      studentSection: student.section
    }));

    res.status(200).json({
      success: true,
      data: enrichedMoodLogs,
      student: {
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        section: student.section
      },
      totalLogs: enrichedMoodLogs.length
    });
  } catch (error) {
    console.error('Error fetching student mood logs by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

/**
 * Get dashboard statistics for teacher
 */
exports.getTeacherDashboardStats = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found.' 
      });
    }

    // Get students count in teacher's sections
    const studentsCount = await User.countDocuments({ 
      section: { $in: teacher.assignedSections || [] },
      role: 'user' 
    });

    // Get students in sections
    const students = await User.find({ 
      section: { $in: teacher.assignedSections || [] },
      role: 'user' 
    }).select('_id');

    const studentIds = students.map(student => student._id);

    // Get total mood logs count
    const totalMoodLogs = await MoodLog.countDocuments({ 
      user: { $in: studentIds } 
    });

    // Get recent mood logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMoodLogs = await MoodLog.countDocuments({ 
      user: { $in: studentIds },
      date: { $gte: sevenDaysAgo }
    });

    // Get mood distribution based on afterEmotion field
    const moodDistribution = await MoodLog.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $group: { 
        _id: '$afterEmotion', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } }
    ]);

    // Get most common mood
    const mostCommonMoodData = moodDistribution.length > 0 ? moodDistribution[0] : null;

    res.status(200).json({
      success: true,
      data: {
        sections: teacher.assignedSections || [],
        studentsCount,
        totalMoodLogs,
        recentMoodLogs,
        moodDistribution,
        mostCommonMood: mostCommonMoodData?._id || null,
        mostCommonMoodCount: mostCommonMoodData?.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};
