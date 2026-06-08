import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  requestId?: mongoose.Types.ObjectId;
  tripId?: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  type: 'owner_to_rider' | 'rider_to_owner' | 'trip_member';
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  revieweeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestId: { type: Schema.Types.ObjectId, ref: 'TransportRequest' },
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000 },
  type: { type: String, enum: ['owner_to_rider', 'rider_to_owner', 'trip_member'], required: true },
}, { timestamps: true });

ReviewSchema.index({ revieweeId: 1 });
ReviewSchema.index({ reviewerId: 1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
