import express from 'express';
import {
    createSwapRequest,
    getSwapRequests,
    getMySwapRequests,
    getIncomingSwapRequests,
    targetAcceptSwap,
    targetDeclineSwap,
} from '../controllers/swapController.js';
import { protect, hodOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Teacher routes
router.post('/', protect, createSwapRequest);                          // Create a swap request
router.get('/my-requests', protect, getMySwapRequests);                // View my outgoing requests + status
router.get('/incoming', protect, getIncomingSwapRequests);             // View incoming requests directed at me
router.put('/:id/accept', protect, targetAcceptSwap);                  // Target teacher: Accept
router.put('/:id/decline', protect, targetDeclineSwap);                // Target teacher: Decline

// HOD / Admin route — read-only history
router.get('/', protect, hodOrAdmin, getSwapRequests);                 // HOD views all history

export default router;
