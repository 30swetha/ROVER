import { Response } from 'express';
import { User } from '../models/User';
import { RiderProfile } from '../models/RiderProfile';
import { TransportRequest } from '../models/TransportRequest';
import { Payment } from '../models/Payment';
import { Post } from '../models/Post';
import { Trip } from '../models/Trip';
import { AdminLog } from '../models/AdminLog';
import { AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notification.service';

async function logAction(adminId: string, action: string, targetId: string, details: string, ip?: string) {
  await AdminLog.create({ adminId, action, targetId, details, ip });
}

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = 1, limit = 50, role, search, suspended } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (suspended !== undefined) filter.suspended = suspended === 'true';
  if (search) filter.$or = [
    { name: new RegExp(search as string, 'i') },
    { phone: new RegExp(search as string, 'i') },
  ];

  const users = await User.find(filter)
    .select('-fcmToken')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await User.countDocuments(filter);
  res.json({ users, total, page: Number(page) });
};

export const getUserDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id).select('-fcmToken');
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const riderProfile = user.role === 'rider'
    ? await RiderProfile.findOne({ userId: req.params.id })
    : null;

  res.json({ user, riderProfile });
};

export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  await User.findByIdAndUpdate(req.params.id, { suspended: true });
  await logAction(req.user!.id, 'suspend_user', req.params.id, req.body.reason || 'No reason given');
  res.json({ message: 'User suspended' });
};

export const unsuspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  await User.findByIdAndUpdate(req.params.id, { suspended: false });
  await logAction(req.user!.id, 'unsuspend_user', req.params.id, 'Account reinstated');
  res.json({ message: 'User unsuspended' });
};

export const listPendingRiders = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status = 'pending' } = req.query;
  const riders = await RiderProfile.find({ verificationStatus: status })
    .populate('userId', 'name phone avatar city createdAt')
    .sort({ createdAt: 1 });

  res.json({ riders });
};

export const verifyRider = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, notes } = req.body;
  if (!['approved', 'rejected', 'reupload'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const profile = await RiderProfile.findOneAndUpdate(
    { userId: req.params.id },
    { verificationStatus: status, verificationNotes: notes },
    { new: true },
  );
  if (!profile) { res.status(404).json({ error: 'Rider profile not found' }); return; }

  const messages: Record<string, string> = {
    approved: 'Your KYC has been verified! You can now apply for transport jobs.',
    rejected: `Your KYC was rejected. Reason: ${notes || 'Documents unclear'}`,
    reupload: 'Please reupload your documents. Reason: ' + (notes || 'Documents unclear'),
  };

  await sendNotification({
    userId: req.params.id,
    title: status === 'approved' ? 'KYC Approved! ✅' : 'KYC Update',
    body: messages[status],
    type: 'verification',
    data: { status },
  });

  await logAction(req.user!.id, `verify_rider_${status}`, req.params.id, notes || '');
  res.json({ profile, message: `Rider ${status}` });
};

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const [
    totalUsers, totalRiders, totalRequests, totalTrips,
    activeRequests, completedRequests,
    revenueData, newUsersThisMonth,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'rider' }),
    TransportRequest.countDocuments(),
    Trip.countDocuments(),
    TransportRequest.countDocuments({ status: 'inProgress' }),
    TransportRequest.countDocuments({ status: 'completed' }),
    Payment.aggregate([
      { $match: { status: 'released' } },
      { $group: { _id: null, total: { $sum: '$platformFee' }, count: { $sum: 1 } } },
    ]),
    User.countDocuments({ createdAt: { $gte: new Date(new Date().setDate(1)) } }),
  ]);

  const revenue = revenueData[0] || { total: 0, count: 0 };

  const userGrowth = await User.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 30 },
  ]);

  res.json({
    kpis: {
      totalUsers, totalRiders, totalRequests, totalTrips,
      activeRequests, completedRequests,
      totalRevenue: revenue.total,
      completedPayments: revenue.count,
      newUsersThisMonth,
    },
    userGrowth: userGrowth.reverse(),
  });
};

export const getAdminLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const logs = await AdminLog.find()
    .populate('adminId', 'name')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ logs });
};
