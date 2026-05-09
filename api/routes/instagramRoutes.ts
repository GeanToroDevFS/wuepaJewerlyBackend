import { Router } from 'express';

import {
  syncInstagramProducts
} from '../controllers/instagramController';

import {
  authMiddleware
} from '../middlewares/authMiddleware';

import {
  adminMiddleware
} from '../middlewares/adminMiddleware';

const router = Router();

router.post(
  '/sync',
  authMiddleware,
  adminMiddleware,
  syncInstagramProducts
);

export default router;