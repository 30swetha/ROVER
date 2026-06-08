import mongoose, { Document, Schema } from 'mongoose';

export type TripStatus = 'open' | 'full' | 'ongoing' | 'completed' | 'cancelled';

export interface ITrip extends Document {
  creatorId: mongoose.Types.ObjectId;
  title: string;
  startCity: string;
  destination: string;
  route: string[];
  date: Date;
  endDate?: Date;
  maxRiders: number;
  currentRiders: mongoose.Types.ObjectId[];
  pendingJoins: mongoose.Types.ObjectId[];
  description: string;
  coverImage?: string;
  status: TripStatus;
  tags: string[];
  chatRoomId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>({
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 200 },
  startCity: { type: String, required: true },
  destination: { type: String, required: true },
  route: [{ type: String }],
  date: { type: Date, required: true },
  endDate: { type: Date },
  maxRiders: { type: Number, required: true, min: 2, max: 100 },
  currentRiders: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  pendingJoins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  description: { type: String, required: true, maxlength: 2000 },
  coverImage: { type: String },
  status: { type: String, enum: ['open', 'full', 'ongoing', 'completed', 'cancelled'], default: 'open' },
  tags: [{ type: String }],
  chatRoomId: { type: String },
}, { timestamps: true });

TripSchema.index({ creatorId: 1 });
TripSchema.index({ status: 1 });
TripSchema.index({ date: 1 });
TripSchema.index({ startCity: 1, destination: 1 });

export const Trip = mongoose.model<ITrip>('Trip', TripSchema);
