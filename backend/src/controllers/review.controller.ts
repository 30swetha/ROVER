import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { RiderProfile } from '../models/RiderProfile';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { calculateTrustScore } from '../utils/trustScore';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { revieweeId, rating, comment, type, requestId, tripId } = req.body;

  const existing = await Review.findOne({
    reviewerId: req.user!.id,
    revieweeId,
    ...(requestId && { requestId }),
    ...(tripId && { tripId }),
  });
  if (existing) { res.status(409).json({ error: 'Review already submitted' }); return; }

  const review = await Review.create({
    reviewerId: req.user!.id,
    revieweeId,
    rating,
    comment,
    type,
    requestId,
    tripId,
  });

  // Update rider profile rating
  if (type === 'owner_to_rider') {
    const allReviews = await Review.find({ revieweeId, type: 'owner_to_rider' });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    const profile = await RiderProfile.findOneAndUpdate(
      { userId: revieweeId },
      { rating: Math.round(avgRating * 10) / 10, totalRatings: allReviews.length },
      { new: true },
    );

    if (profile) {
      const { score, level } = calculateTrustScore(profile);
      await Promise.all([
        RiderProfile.findByIdAndUpdate(profile._id, { trustLevel: level }),
        User.findByIdAndUpdate(revieweeId, { trustScore: score }),
      ]);
    }
  }

  res.status(201).json({ review });
};

export const getUserReviews = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, type } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter: Record<string, unknown> = { revieweeId: req.params.id };
  if (type) filter.type = type;

  const reviews = await Review.find(filter)
    .populate('reviewerId', 'name avatar city')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Review.countDocuments(filter);
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  res.json({ reviews, total, avgRating: Math.round(avgRating * 10) / 10, page: Number(page) });
};
