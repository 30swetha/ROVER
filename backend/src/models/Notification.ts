import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'application' | 'selection' | 'payment' | 'message'
  | 'verification' | 'trip_update' | 'community' | 'sos' | 'achievement' | 'system';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: {
    type: String,
    enum: ['application', 'selection', 'payment', 'message', 'verification', 'trip_update', 'community', 'sos', 'achievement', 'system'],
    required: true,
  },
  data: { type: Schema.Types.Mixed },
  read: { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
