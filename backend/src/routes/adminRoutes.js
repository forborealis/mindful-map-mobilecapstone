const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Apply auth middleware to all admin routes
router.use(verifyToken);

router.get('/dashboard-stats', adminController.getDashboardStats);
// Get all users with filtering and pagination
router.get('/users', adminController.getAllUsers);
router.get('/active-inactive-users', adminController.getActiveInactiveUsers);
router.get('/students', adminController.getStudents);

router.get('/teachers', adminController.getTeachers);
router.post('/teachers', adminController.createTeacher);
router.put('/teachers/:id', adminController.updateTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);

module.exports = router;
