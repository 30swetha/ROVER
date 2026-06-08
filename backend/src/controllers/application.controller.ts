import { Response } from 'express';
import { RiderApplication } from '../models/RiderApplication';
import { TransportRequest } from '../models/TransportRequest';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notification.service';

export const applyForRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { requestId, proposal, price } = req.body;

  const request = await TransportRequest.findById(requestId);
  if (!request || request.status !== 'open') {
    res.status(400).json({ error: 'Request not available' });
    return;
  }

  const existing = await RiderApplication.findOne({ requestId, riderId: req.user!.id });
  if (existing) { res.status(409).json({ error: 'Already applied' }); return; }

  const application = await RiderApplication.create({
    requestId, riderId: req.user!.id, proposal, price,
  });

  await TransportRequest.findByIdAndUpdate(requestId, { $addToSet: { applicants: req.user!.id } });

  const rider = await User.findById(req.user!.id).select('name');
  await sendNotification({
    userId: request.ownerId.toString(),
    title: 'New Application 🏍️',
    body: `${rider?.name} applied for your bike transport request.`,
    type: 'application',
    data: { requestId, applicationId: application._id.toString() },
  });

  res.status(201).json({ application });
};

export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  const applications = await RiderApplication.find({ riderId: req.user!.id })
    .populate('requestId', 'pickupCity destinationCity bikeBrand bikeModel budget status pickupDate')
    .sort({ appliedAt: -1 });

  res.json({ applications });
};

export const withdrawApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  const application = await RiderApplication.findOneAndDelete({
    _id: req.params.id,
    riderId: req.user!.id,
    status: 'pending',
  });
  if (!application) { res.status(404).json({ error: 'Application not found or already processed' }); return; }

  await TransportRequest.findByIdAndUpdate(application.requestId, { $pull: { applicants: req.user!.id } });
  res.json({ message: 'Application withdrawn' });
};
