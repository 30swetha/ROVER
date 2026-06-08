import mongoose, { Document, Schema } from 'mongoose';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface IRiderApplication extends Document {
  requestId: mongoose.Types.ObjectId;
  riderId: mongoose.Types.ObjectId;
  proposal: string;
  price: number;
  status: ApplicationStatus;
  appliedAt: Date;
}

const RiderApplicationSchema = new Schema<IRiderApplication>({
  requestId: { type: Schema.Types.ObjectId, ref: 'TransportRequest', required: true },
  riderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  proposal: { type: String, required: true, maxlength: 500 },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

RiderApplicationSchema.index({ requestId: 1 });
RiderApplicationSchema.index({ riderId: 1 });
RiderApplicationSchema.index({ requestId: 1, riderId: 1 }, { unique: true });

export const RiderApplication = mongoose.model<IRiderApplication>('RiderApplication', RiderApplicationSchema);
