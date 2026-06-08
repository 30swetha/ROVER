import { Response } from 'express';
import { TransportRequest } from '../models/TransportRequest';
import { RiderApplication } from '../models/RiderApplication';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../middleware/upload';
import { sendNotification } from '../services/notification.service';

export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];
  const bikeImages: string[] = [];

  if (files?.length) {
    for (const file of files) {
      const url = await uploadToCloudinary(file.buffer, 'bikes');
      bikeImages.push(url);
    }
  }

  const request = await TransportRequest.create({
    ownerId: req.user!.id,
    ...req.body,
    bikeImages,
    pickupDate: new Date(req.body.pickupDate),
    deliveryDeadline: new Date(req.body.deliveryDeadline),
  });

  res.status(201).json({ request });
};

export const listRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = 1, limit = 20, status, pickupCity, destinationCity, myRequests } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (pickupCity) filter.pickupCity = new RegExp(pickupCity as string, 'i');
  if (destinationCity) filter.destinationCity = new RegExp(destinationCity as string, 'i');
  if (myRequests === 'true') filter.ownerId = req.user!.id;

  const requests = await TransportRequest.find(filter)
    .populate('ownerId', 'name avatar city trustScore')
    .populate('selectedRider', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await TransportRequest.countDocuments(filter);
  res.json({ requests, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

export const getRequestById = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await TransportRequest.findById(req.params.id)
    .populate('ownerId', 'name avatar city trustScore bio')
    .populate('selectedRider', 'name avatar');

  if (!request) { res.status(404).json({ error: 'Request not found' }); return; }
  res.json({ request });
};

export const updateRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await TransportRequest.findOne({ _id: req.params.id, ownerId: req.user!.id });
  if (!request) { res.status(404).json({ error: 'Request not found or unauthorized' }); return; }
  if (request.status !== 'open') { res.status(400).json({ error: 'Cannot update non-open request' }); return; }

  const allowed = ['pickupDate', 'deliveryDeadline', 'budget', 'notes'];
  const updates: Record<string, unknown> = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const updated = await TransportRequest.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json({ request: updated });
};

export const deleteRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await TransportRequest.findOneAndDelete({ _id: req.params.id, ownerId: req.user!.id, status: 'open' });
  if (!request) { res.status(404).json({ error: 'Request not found or cannot be deleted' }); return; }
  res.json({ message: 'Request deleted' });
};

export const getApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  const applications = await RiderApplication.find({ requestId: req.params.id })
    .populate({
      path: 'riderId',
      select: 'name avatar city trustScore',
      populate: { path: '_id', model: 'RiderProfile', foreignField: 'userId', select: 'rating completedTrips verificationStatus trustLevel' },
    })
    .sort({ status: 1, appliedAt: -1 });

  res.json({ applications });
};

export const selectRider = async (req: AuthRequest, res: Response): Promise<void> => {
  const { riderId } = req.body;
  const request = await TransportRequest.findOne({ _id: req.params.id, ownerId: req.user!.id, status: 'open' });
  if (!request) { res.status(404).json({ error: 'Request not found' }); return; }

  const application = await RiderApplication.findOne({ requestId: req.params.id, riderId, status: 'pending' });
  if (!application) { res.status(400).json({ error: 'No pending application from this rider' }); return; }

  await Promise.all([
    TransportRequest.findByIdAndUpdate(req.params.id, { selectedRider: riderId, status: 'inProgress' }),
    RiderApplication.findByIdAndUpdate(application._id, { status: 'accepted' }),
    RiderApplication.updateMany(
      { requestId: req.params.id, riderId: { $ne: riderId } },
      { status: 'rejected' },
    ),
  ]);

  const owner = await User.findById(req.user!.id).select('name');
  await sendNotification({
    userId: riderId,
    title: 'You got selected! 🎉',
    body: `${owner?.name} selected you for a bike transport job.`,
    type: 'selection',
    data: { requestId: req.params.id },
  });

  res.json({ message: 'Rider selected successfully' });
};
