import express from 'express';
import { createSlot, getTimetableForClass, getTimetableForTeacher, deleteSlot } from '../controllers/timetableController.js';
import { generateTimetable } from '../controllers/autoGenController.js';
import { protect, hodOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/auto-generate', protect, hodOrAdmin, generateTimetable);
router.post('/', protect, hodOrAdmin, createSlot);
router.get('/class/:classId', protect, getTimetableForClass);
router.get('/teacher/:teacherId', protect, getTimetableForTeacher);
router.delete('/:id', protect, hodOrAdmin, deleteSlot);

export default router;
