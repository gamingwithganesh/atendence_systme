import express from 'express';
import { addHOD, getHODs, deleteHOD, addTeacher, getTeachers, deleteTeacher, addStudent, deleteStudent, getStudentsByClass } from '../controllers/userController.js';
import { protect, admin, hodOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin routes
router.post('/hod', protect, admin, addHOD);
router.get('/hod', protect, admin, getHODs);
router.delete('/hod/:id', protect, admin, deleteHOD);

// HOD routes
router.post('/teacher', protect, hodOrAdmin, addTeacher);
router.get('/teacher', protect, hodOrAdmin, getTeachers);
router.delete('/teacher/:id', protect, hodOrAdmin, deleteTeacher);
router.post('/student', protect, hodOrAdmin, addStudent);
router.delete('/student/:id', protect, hodOrAdmin, deleteStudent);
router.get('/class/:classId/students', protect, getStudentsByClass);

export default router;
