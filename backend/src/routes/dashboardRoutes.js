import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect, hodOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, hodOrAdmin, getDashboardStats);

export default router;
