import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

// 🔐 Auth con Firebase token
router.post('/register', authController.register.bind(authController));
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/verify-token', authController.verifyToken.bind(authController));

export default router;