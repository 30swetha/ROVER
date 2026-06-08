import { Request, Response } from 'express';
import { RiderProfile } from '../models/RiderProfile';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../middleware/upload';
import { calculateMatchScore } from '../utils/matchScore';
import { calculateTrustScore } from '../utils/trustScore';
import { Payment } from '../models/Payment';

export const listRiders = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 20, city, minRating, verified } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const matchStage: Record<string, unknown> = {};
  if (verified === 'true') matchStage.verificationStatus = 'approved';
  if (minRating) matchStage.rating = { $gte: Number(minRating) };

  const riders = await RiderProfile.find(matchStage)
    .populate('userId', 'name avatar city trustScore badges xp')
    .sort({ rating: -1, completedTrips: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await RiderProfile.countDocuments(matchStage);
  res.json({ riders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

export const getRiderById = async (req: Request, res: Response): Promise<void> => {
  const profile = await RiderProfile.findOne({ userId: req.params.id })
    .populate('userId', 'name avatar city bio trustScore badges xp followers following createdAt');

  if (!profile) { res.status(404).json({ error: 'Rider not found' }); return; }
  res.json({ profile });
};

export const getRiderDiscovery = async (req: AuthRequest, res: Response): Promise<void> => {
  const { pickupCity, destinationCity, budget, page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const riders = await RiderProfile.find({ verificationStatus: 'approved' })
    .populate('userId', 'name avatar city bio trustScore badges xp')
    .sort({ rating: -1 })
    .skip(skip)
    .limit(Number(limit) + 20);

  const ridersWithScores = riders.map(r => ({
    profile: r,
    user: r.userId as unknown,
    matchScore: pickupCity && destinationCity
      ? calculateMatchScore(r, {
        pickupCity: pickupCity as string,
        destinationCity: destinationCity as string,
        budget: Number(budget) || 2500,
      })
      : Math.floor(Math.random() * 30) + 70,
  }));

  ridersWithScores.sort((a, b) => b.matchScore - a.matchScore);
  const paginated = ridersWithScores.slice(0, Number(limit));

  res.json({ riders: paginated, hasMore: ridersWithScores.length > Number(limit) });
};

export const createProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await RiderProfile.findOne({ userId: req.user!.id });
  if (existing) { res.status(409).json({ error: 'Rider profile already exists' }); return; }

  const profile = await RiderProfile.create({ userId: req.user!.id, ...req.body });
  res.status(201).json({ profile });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const allowed = ['languages', 'ridingExperience', 'routeExpertise', 'insuranceStatus', 'prompts', 'coverPhoto'];
  const updates: Record<string, unknown> = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const profile = await RiderProfile.findOneAndUpdate(
    { userId: req.user!.id },
    updates,
    { new: true, upsert: true },
  );

  const { score, level } = calculateTrustScore(profile!);
  await Promise.all([
    RiderProfile.findByIdAndUpdate(profile!._id, { trustLevel: level }),
    User.findByIdAndUpdate(req.user!.id, { trustScore: score }),
  ]);

  res.json({ profile });
};

export const uploadDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const updates: Record<string, string> = {};

  if (files.license?.[0]) {
    updates.licenseUrl = await uploadToCloudinary(files.license[0].buffer, 'documents');
  }
  if (files.aadhaar?.[0]) {
    updates.aadhaarUrl = await uploadToCloudinary(files.aadhaar[0].buffer, 'documents');
  }
  if (files.selfie?.[0]) {
    updates.selfieUrl = await uploadToCloudinary(files.selfie[0].buffer, 'documents');
  }

  const { licenseNumber, aadhaarNumber } = req.body;
  if (licenseNumber) updates.licenseNumber = licenseNumber;
  if (aadhaarNumber) updates.aadhaarNumber = aadhaarNumber;

  const profile = await RiderProfile.findOneAndUpdate(
    { userId: req.user!.id },
    { ...updates, verificationStatus: 'pending' },
    { new: true, upsert: true },
  );

  res.json({ profile, message: 'Documents submitted for verification' });
};

export const uploadMedia = async (req: AuthRequest, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) { res.status(400).json({ error: 'No files uploaded' }); return; }

  const urls = await Promise.all(
    files.map(f => {
      const isVideo = f.mimetype.startsWith('video/');
      return uploadToCloudinary(f.buffer, 'rider_media', isVideo ? 'video' : 'image');
    }),
  );

  const isVideo = files[0].mimetype.startsWith('video/');
  const update = isVideo ? { $push: { videos: { $each: urls } } } : { $push: { photos: { $each: urls } } };

  await RiderProfile.findOneAndUpdate({ userId: req.user!.id }, update);
  res.json({ urls });
};

export const getEarnings = async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await RiderProfile.findOne({ userId: req.user!.id }).select('totalEarnings pendingEarnings');
  const payments = await Payment.find({ riderId: req.user!.id, status: 'released' })
    .sort({ releasedAt: -1 })
    .limit(20)
    .populate('requestId', 'pickupCity destinationCity');

  res.json({ earnings: profile, transactions: payments });
};
