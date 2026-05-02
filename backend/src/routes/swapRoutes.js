import express from 'express';
import { createSwapRequest, getSwapRequests, approveSwap, rejectSwap } from '../controllers/swapController.js';
import { protect, hodOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createSwapRequest); // Teacher can create
router.get('/', protect, hodOrAdmin, getSwapRequests); // HOD can view all
router.put('/:id/approve', protect, hodOrAdmin, approveSwap); // HOD can approve
router.put('/:id/reject', protect, hodOrAdmin, rejectSwap); // HOD can reject

export default router;
