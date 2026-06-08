import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ReviewController from '../controllers/review.controller';

const router = Router();

router.post('/', authenticate, ReviewController.createReview);
router.get('/user/:id', ReviewController.getUserReviews);

export default router;
