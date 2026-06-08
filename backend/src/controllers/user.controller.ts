import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../middleware/upload';
import mongoose from 'mongoose';

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.id)
    .populate('followers', 'name avatar city')
    .populate('following', 'name avatar city');

  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ user });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const updates: Record<string, unknown> = {};
  const allowed = ['name', 'bio', 'city', 'email'];
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  if (req.file) {
    updates.avatar = await uploadToCloudinary(req.file.buffer, 'avatars');
  }

  const user = await User.findByIdAndUpdate(req.user!.id, updates, { new: true });
  res.json({ user });
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id)
    .select('-fcmToken')
    .populate('followers', 'name avatar')
    .populate('following', 'name avatar');

  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ user });
};

export const toggleFollow = async (req: AuthRequest, res: Response): Promise<void> => {
  const targetId = new mongoose.Types.ObjectId(req.params.id);
  const myId = new mongoose.Types.ObjectId(req.user!.id);

  const me = await User.findById(myId);
  if (!me) { res.status(404).json({ error: 'User not found' }); return; }

  const isFollowing = me.following.some(id => id.equals(targetId));

  await Promise.all([
    User.findByIdAndUpdate(myId,
      isFollowing ? { $pull: { following: targetId } } : { $addToSet: { following: targetId } },
    ),
    User.findByIdAndUpdate(targetId,
      isFollowing ? { $pull: { followers: myId } } : { $addToSet: { followers: myId } },
    ),
  ]);

  res.json({ following: !isFollowing });
};

export const updateFcmToken = async (req: AuthRequest, res: Response): Promise<void> => {
  await User.findByIdAndUpdate(req.user!.id, { fcmToken: req.body.token });
  res.json({ message: 'FCM token updated' });
};
