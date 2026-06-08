import { Router } from 'express';
import { authenticate, requireRider } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as RiderController from '../controllers/rider.controller';

const router = Router();

router.get('/discovery', authenticate, RiderController.getRiderDiscovery);
router.get('/', RiderController.listRiders);
router.get('/:id', RiderController.getRiderById);
router.post('/profile', authenticate, requireRider, RiderController.createProfile);
router.put('/profile', authenticate, requireRider, RiderController.updateProfile);
router.post('/documents', authenticate, requireRider,
  upload.fields([
    { name: 'license', maxCount: 1 },
    { name: 'aadhaar', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  RiderController.uploadDocuments,
);
router.post('/media', authenticate, requireRider,
  upload.array('files', 10),
  RiderController.uploadMedia,
);
router.get('/my/earnings', authenticate, requireRider, RiderController.getEarnings);

export default router;
