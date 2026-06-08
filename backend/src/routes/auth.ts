import { Router } from 'express';
import { body } from 'express-validator';
import * as AuthController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/send-otp',
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid Indian phone number'),
  AuthController.sendOTP,
);

router.post('/verify-otp',
  body('phone').matches(/^[6-9]\d{9}$/),
  body('otp').isLength({ min: 6, max: 6 }),
  body('firebaseToken').notEmpty(),
  AuthController.verifyOTP,
);

router.post('/refresh-token', authenticate, AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);
router.put('/complete-profile', authenticate,
  body('name').notEmpty().trim(),
  body('role').isIn(['owner', 'rider', 'tripPartner']),
  AuthController.completeProfile,
);

export default router;
