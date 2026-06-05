import { Router } from 'express';
import { createCategory, deleteCategory, getCategories } from '../controllers/categoryController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

router.get('/', getCategories);
router.post('/', authMiddleware, adminMiddleware, createCategory);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCategory);

export default router;
