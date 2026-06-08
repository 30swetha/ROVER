import { Router } from 'express';
import { authenticate, requireRider } from '../middleware/auth';
import * as AppController from '../controllers/application.controller';

const router = Router();

router.post('/', authenticate, requireRider, AppController.applyForRequest);
router.get('/my', authenticate, requireRider, AppController.getMyApplications);
router.put('/:id/withdraw', authenticate, requireRider, AppController.withdrawApplication);

export default router;
