import { Router } from 'express';
import { markOrderPaid, paymentWebhook } from '../controllers/paymentController';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/pay', authMiddleware, adminMiddleware, markOrderPaid);
router.post('/webhook', authMiddleware, adminMiddleware, paymentWebhook);

export default router;
