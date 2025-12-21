const express = require('express');
const router = express.Router();
const { verifyToken, checkTeacherRole } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');

// Apply auth and teacher role middleware to all teacher routes
router.use(verifyToken);
router.use(checkTeacherRole);

// Get teacher profile
router.get('/profile', teacherController.getTeacherProfile);

// Update teacher profile with avatar upload
router.put(
  '/profile',
  teacherController.uploadAvatar,
  teacherController.updateTeacherProfile
);

// Get students by teacher's assigned sections
router.get('/students', teacherController.getStudentsBySection);

// Get mood logs for students in teacher's sections
router.get('/student-mood-logs', teacherController.getStudentMoodLogs);

// Get mood logs by specific section
router.get('/mood-logs/:section', teacherController.getMoodLogsBySection);

// Get students in a specific section with mood log counts
router.get('/section-students/:section', teacherController.getSectionStudents);

// Get mood logs for a specific student
router.get('/student-mood-logs/:studentId', teacherController.getStudentMoodLogsById);

// Get dashboard statistics
router.get('/dashboard-stats', teacherController.getTeacherDashboardStats);

module.exports = router;
