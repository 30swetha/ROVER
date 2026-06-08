import mongoose, { Document, Schema } from 'mongoose';

export interface IEmergencyAlert extends Document {
  userId: mongoose.Types.ObjectId;
  requestId?: mongoose.Types.ObjectId;
  tripId?: mongoose.Types.ObjectId;
  location: { lat: number; lng: number; address?: string };
  emergencyContacts: string[];
  message?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const EmergencyAlertSchema = new Schema<IEmergencyAlert>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestId: { type: Schema.Types.ObjectId, ref: 'TransportRequest' },
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String },
  },
  emergencyContacts: [{ type: String }],
  message: { type: String },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

EmergencyAlertSchema.index({ userId: 1, resolved: 1 });

export const EmergencyAlert = mongoose.model<IEmergencyAlert>('EmergencyAlert', EmergencyAlertSchema);
