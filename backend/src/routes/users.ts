import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as UserController from '../controllers/user.controller';

const router = Router();

router.get('/profile', authenticate, UserController.getMyProfile);
router.put('/profile', authenticate, upload.single('avatar'), UserController.updateProfile);
router.get('/:id', UserController.getUserById);
router.post('/:id/follow', authenticate, UserController.toggleFollow);
router.put('/fcm-token', authenticate, UserController.updateFcmToken);

export default router;
