import { admin, initFirebase } from '../config/firebase';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { NotificationType } from '../models/Notification';

initFirebase();

interface SendNotificationParams {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
}

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  const { userId, title, body, type, data } = params;

  await Notification.create({ userId, title, body, type, data });

  const user = await User.findById(userId).select('fcmToken');
  if (!user?.fcmToken) return;

  try {
    await admin.messaging().send({
      token: user.fcmToken,
      notification: { title, body },
      data: { type, ...(data ? { payload: JSON.stringify(data) } : {}) },
      android: { priority: 'high', notification: { channelId: 'rover_default', sound: 'default' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
  } catch (err) {
    console.error('FCM send error:', err);
  }
}

export async function sendBulkNotification(
  userIds: string[],
  title: string,
  body: string,
  type: NotificationType,
): Promise<void> {
  await Promise.allSettled(userIds.map(userId => sendNotification({ userId, title, body, type })));
}
