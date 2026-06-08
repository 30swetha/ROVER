import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as EmergencyController from '../controllers/emergency.controller';

const router = Router();

router.post('/sos', authenticate, EmergencyController.triggerSOS);
router.get('/active', authenticate, EmergencyController.getActiveAlerts);
router.put('/:id/resolve', authenticate, EmergencyController.resolveAlert);

export default router;
