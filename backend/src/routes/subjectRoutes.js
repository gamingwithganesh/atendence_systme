import express from 'express';
import { addSubject, getSubjects, editSubject } from '../controllers/subjectController.js';
import { protect, hodOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, hodOrAdmin, addSubject);
router.get('/', protect, hodOrAdmin, getSubjects);
router.put('/:id', protect, hodOrAdmin, editSubject);

export default router;
