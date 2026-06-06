import { Router } from 'express';
import { clearCart, getCart, saveCart } from '../controllers/cartController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getCart);
router.put('/', authMiddleware, saveCart);
router.delete('/', authMiddleware, clearCart);

export default router;
