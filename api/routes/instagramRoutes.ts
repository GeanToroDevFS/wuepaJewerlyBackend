import { Router } from 'express';

import {
  publishInstagramPost
} from '../controllers/instagramController';

import { authMiddleware }
from '../middlewares/authMiddleware';

import { adminMiddleware }
from '../middlewares/adminMiddleware';

const router = Router();

router.post(
  '/publish',
  authMiddleware,
  adminMiddleware,
  publishInstagramPost
);

export default router;