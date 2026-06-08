import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as NotifController from '../controllers/notification.controller';

const router = Router();

router.get('/', authenticate, NotifController.getNotifications);
router.put('/:id/read', authenticate, NotifController.markRead);
router.put('/read-all', authenticate, NotifController.markAllRead);

export default router;
