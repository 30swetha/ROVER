import { Request, Response } from 'express';
import { Trip } from '../models/Trip';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../middleware/upload';
import { sendNotification } from '../services/notification.service';
import { v4 as uuidv4 } from 'uuid';

export const createTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  let coverImage: string | undefined;
  if (req.file) {
    coverImage = await uploadToCloudinary(req.file.buffer, 'trips');
  }

  const trip = await Trip.create({
    creatorId: req.user!.id,
    ...req.body,
    date: new Date(req.body.date),
    endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    currentRiders: [req.user!.id],
    chatRoomId: uuidv4(),
    coverImage,
  });

  res.status(201).json({ trip });
};

export const listTrips = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 20, status, startCity, destination } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (startCity) filter.startCity = new RegExp(startCity as string, 'i');
  if (destination) filter.destination = new RegExp(destination as string, 'i');

  const trips = await Trip.find(filter)
    .populate('creatorId', 'name avatar city trustScore')
    .populate('currentRiders', 'name avatar')
    .sort({ date: 1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Trip.countDocuments(filter);
  res.json({ trips, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

export const getTripById = async (req: Request, res: Response): Promise<void> => {
  const trip = await Trip.findById(req.params.id)
    .populate('creatorId', 'name avatar city bio trustScore')
    .populate('currentRiders', 'name avatar city')
    .populate('pendingJoins', 'name avatar');

  if (!trip) { res.status(404).json({ error: 'Trip not found' }); return; }
  res.json({ trip });
};

export const updateTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  const trip = await Trip.findOneAndUpdate(
    { _id: req.params.id, creatorId: req.user!.id },
    req.body,
    { new: true },
  );
  if (!trip) { res.status(404).json({ error: 'Trip not found or unauthorized' }); return; }
  res.json({ trip });
};

export const requestJoin = async (req: AuthRequest, res: Response): Promise<void> => {
  const trip = await Trip.findById(req.params.id);
  if (!trip || trip.status !== 'open') { res.status(400).json({ error: 'Trip not available' }); return; }
  if (trip.currentRiders.map(r => r.toString()).includes(req.user!.id)) {
    res.status(409).json({ error: 'Already a member' });
    return;
  }

  await Trip.findByIdAndUpdate(req.params.id, { $addToSet: { pendingJoins: req.user!.id } });

  await sendNotification({
    userId: trip.creatorId.toString(),
    title: 'Join Request 🏍️',
    body: 'Someone wants to join your trip!',
    type: 'trip_update',
    data: { tripId: req.params.id },
  });

  res.json({ message: 'Join request sent' });
};

export const approveJoin = async (req: AuthRequest, res: Response): Promise<void> => {
  const trip = await Trip.findOne({ _id: req.params.id, creatorId: req.user!.id });
  if (!trip) { res.status(404).json({ error: 'Trip not found' }); return; }

  const { userId } = req.params;
  await Trip.findByIdAndUpdate(req.params.id, {
    $pull: { pendingJoins: userId },
    $addToSet: { currentRiders: userId },
  });

  const updated = await Trip.findById(req.params.id);
  if (updated && updated.currentRiders.length >= updated.maxRiders) {
    await Trip.findByIdAndUpdate(req.params.id, { status: 'full' });
  }

  await sendNotification({
    userId,
    title: 'Join Approved! 🎉',
    body: `Your request to join "${trip.title}" was approved.`,
    type: 'trip_update',
    data: { tripId: req.params.id },
  });

  res.json({ message: 'User approved' });
};

export const leaveTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  await Trip.findByIdAndUpdate(req.params.id, { $pull: { currentRiders: req.user!.id } });
  res.json({ message: 'Left trip' });
};
