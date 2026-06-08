import { Response } from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/Message';
import { AuthRequest } from '../middleware/auth';
import { emitToUser } from '../services/socket.service';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
        tripId: { $exists: false },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId'],
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$read', false] }] }, 1, 0],
          },
        },
      },
    },
    {
      $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
    },
    { $unwind: '$user' },
    { $sort: { 'lastMessage.createdAt': -1 } },
    { $limit: 50 },
  ]);

  res.json({ conversations });
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const myId = new mongoose.Types.ObjectId(req.user!.id);
  const otherId = new mongoose.Types.ObjectId(req.params.userId);

  const messages = await Message.find({
    $or: [
      { senderId: myId, receiverId: otherId },
      { senderId: otherId, receiverId: myId },
    ],
    tripId: { $exists: false },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  await Message.updateMany(
    { senderId: otherId, receiverId: myId, read: false },
    { read: true, readAt: new Date() },
  );

  res.json({ messages: messages.reverse() });
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { receiverId, content, type = 'text', mediaUrl } = req.body;

  const message = await Message.create({
    senderId: req.user!.id,
    receiverId,
    content,
    type,
    mediaUrl,
  });

  emitToUser(receiverId, 'new-message', {
    from: req.user!.id,
    content,
    type,
    messageId: message._id,
    timestamp: message.createdAt,
  });

  res.status(201).json({ message });
};

export const getTripMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const messages = await Message.find({ tripId: req.params.tripId })
    .populate('senderId', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ messages: messages.reverse() });
};
