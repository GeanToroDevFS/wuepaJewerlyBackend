import { Router } from 'express';
import {
  createOrder,
  getAdminOrders,
  getOrderDetails,
  updateOrderStatus,
} from '../controllers/orderController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, adminMiddleware, getAdminOrders);
router.get('/:id', authMiddleware, adminMiddleware, getOrderDetails);
router.put('/:id/status', authMiddleware, adminMiddleware, updateOrderStatus);

export default router;
