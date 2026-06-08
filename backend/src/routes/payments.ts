import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as PaymentController from '../controllers/payment.controller';

const router = Router();

router.post('/create-order', authenticate, PaymentController.createOrder);
router.post('/verify', authenticate, PaymentController.verifyPayment);
router.post('/release/:requestId', authenticate, PaymentController.releasePayment);
router.get('/history', authenticate, PaymentController.getHistory);

export default router;
