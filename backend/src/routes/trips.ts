import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as TripController from '../controllers/trip.controller';

const router = Router();

router.post('/', authenticate, upload.single('coverImage'), TripController.createTrip);
router.get('/', TripController.listTrips);
router.get('/:id', TripController.getTripById);
router.put('/:id', authenticate, TripController.updateTrip);
router.post('/:id/join', authenticate, TripController.requestJoin);
router.post('/:id/approve/:userId', authenticate, TripController.approveJoin);
router.delete('/:id/leave', authenticate, TripController.leaveTrip);

export default router;
