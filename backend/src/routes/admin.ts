import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as AdminController from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', AdminController.listUsers);
router.get('/users/:id', AdminController.getUserDetail);
router.put('/users/:id/suspend', AdminController.suspendUser);
router.put('/users/:id/unsuspend', AdminController.unsuspendUser);

router.get('/riders', AdminController.listPendingRiders);
router.put('/riders/:id/verify', AdminController.verifyRider);

router.get('/analytics', AdminController.getAnalytics);
router.get('/logs', AdminController.getAdminLogs);

export default router;
