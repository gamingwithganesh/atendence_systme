import express from 'express';
import { markAttendance } from '../controllers/attendanceController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, markAttendance);

export default router;
