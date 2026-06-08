import { Response } from 'express';
import { EmergencyAlert } from '../models/EmergencyAlert';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { sendBulkNotification } from '../services/notification.service';
import { getIO } from '../services/socket.service';

export const triggerSOS = async (req: AuthRequest, res: Response): Promise<void> => {
  const { lat, lng, address, requestId, tripId, emergencyContacts, message } = req.body;

  const alert = await EmergencyAlert.create({
    userId: req.user!.id,
    requestId,
    tripId,
    location: { lat, lng, address },
    emergencyContacts: emergencyContacts || [],
    message,
  });

  // Notify admins
  const admins = await User.find({ role: 'admin' }).select('_id');
  const adminIds = admins.map(a => a._id.toString());

  const user = await User.findById(req.user!.id).select('name phone');

  await sendBulkNotification(
    adminIds,
    '🚨 SOS ALERT',
    `${user?.name} (${user?.phone}) triggered an emergency alert. Location: ${address || `${lat}, ${lng}`}`,
    'sos',
  );

  // Broadcast via socket
  getIO().emit('sos-alert', {
    alertId: alert._id,
    userId: req.user!.id,
    userName: user?.name,
    location: { lat, lng, address },
    requestId,
    tripId,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({ alert, message: 'SOS triggered. Help is on the way.' });
};

export const getActiveAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  const filter = req.user!.role === 'admin'
    ? { resolved: false }
    : { userId: req.user!.id, resolved: false };

  const alerts = await EmergencyAlert.find(filter)
    .populate('userId', 'name phone avatar')
    .sort({ createdAt: -1 });

  res.json({ alerts });
};

export const resolveAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  const alert = await EmergencyAlert.findByIdAndUpdate(
    req.params.id,
    { resolved: true, resolvedAt: new Date(), resolvedBy: req.user!.id },
    { new: true },
  );
  if (!alert) { res.status(404).json({ error: 'Alert not found' }); return; }
  res.json({ alert });
};
