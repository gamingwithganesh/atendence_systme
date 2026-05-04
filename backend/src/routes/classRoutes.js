import express from 'express';
import { addClass, getClasses, editClass } from '../controllers/classController.js';
import { protect, hodOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, hodOrAdmin, addClass);
router.get('/', protect, getClasses);
router.put('/:id', protect, hodOrAdmin, editClass);

export default router;
