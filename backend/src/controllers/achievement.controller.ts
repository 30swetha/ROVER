import { Request, Response } from 'express';
import { Achievement } from '../models/Achievement';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notification.service';
import { BadgeType } from '../models/Achievement';

const BADGE_XP: Record<BadgeType, number> = {
  first_ride: 100,
  ten_trips: 250,
  fifty_trips: 750,
  hundred_trips: 2000,
  top_rated: 500,
  verified_rider: 300,
  community_star: 400,
  trip_leader: 350,
  early_adopter: 200,
  five_star_streak: 600,
};

export async function awardBadge(userId: string, badge: BadgeType): Promise<void> {
  const existing = await Achievement.findOne({ userId, badge });
  if (existing) return;

  const xp = BADGE_XP[badge];
  await Achievement.create({ userId, badge, xpAwarded: xp });
  await User.findByIdAndUpdate(userId, { $inc: { xp }, $addToSet: { badges: badge } });

  await sendNotification({
    userId,
    title: 'New Achievement! 🏆',
    body: `You earned the "${badge.replace(/_/g, ' ')}" badge (+${xp} XP)`,
    type: 'achievement',
    data: { badge, xp },
  });
}

export const getMyAchievements = async (req: AuthRequest, res: Response): Promise<void> => {
  const achievements = await Achievement.find({ userId: req.user!.id }).sort({ earnedAt: -1 });
  const user = await User.findById(req.user!.id).select('xp badges');
  res.json({ achievements, xp: user?.xp, badges: user?.badges });
};

export const getLeaderboard = async (_req: Request, res: Response): Promise<void> => {
  const leaders = await User.find({ role: 'rider' })
    .select('name avatar city xp trustScore badges')
    .sort({ xp: -1 })
    .limit(50);

  res.json({ leaderboard: leaders });
};
