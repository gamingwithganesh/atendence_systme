import express from 'express';
import { addClass, getClasses } from '../controllers/classController.js';
import { protect, hodOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, hodOrAdmin, addClass);
router.get('/', protect, getClasses);

export default router;
