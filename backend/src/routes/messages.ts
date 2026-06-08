import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as MessageController from '../controllers/message.controller';

const router = Router();

router.get('/conversations', authenticate, MessageController.getConversations);
router.get('/:userId', authenticate, MessageController.getMessages);
router.post('/', authenticate, MessageController.sendMessage);
router.get('/trip/:tripId', authenticate, MessageController.getTripMessages);

export default router;
