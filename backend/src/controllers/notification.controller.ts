import { Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const notifications = await Notification.find({ userId: req.user!.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const unreadCount = await Notification.countDocuments({ userId: req.user!.id, read: false });
  res.json({ notifications, unreadCount });
};

export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, { read: true });
  res.json({ message: 'Marked as read' });
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.updateMany({ userId: req.user!.id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read' });
};
