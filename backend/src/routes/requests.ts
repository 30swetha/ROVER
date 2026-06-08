import { Router } from 'express';
import { authenticate, requireOwner } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as RequestController from '../controllers/request.controller';

const router = Router();

router.post('/', authenticate, requireOwner,
  upload.array('bikeImages', 5),
  RequestController.createRequest,
);
router.get('/', authenticate, RequestController.listRequests);
router.get('/:id', authenticate, RequestController.getRequestById);
router.put('/:id', authenticate, requireOwner, RequestController.updateRequest);
router.delete('/:id', authenticate, requireOwner, RequestController.deleteRequest);
router.get('/:id/applications', authenticate, RequestController.getApplications);
router.post('/:id/select-rider', authenticate, requireOwner, RequestController.selectRider);

export default router;
