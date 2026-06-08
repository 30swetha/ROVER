import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'pending' | 'escrowed' | 'released' | 'refunded' | 'failed';

export interface IPayment extends Document {
  requestId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  riderId: mongoose.Types.ObjectId;
  amount: number;
  platformFee: number;
  riderEarning: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  escrowedAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  requestId: { type: Schema.Types.ObjectId, ref: 'TransportRequest', required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  riderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  riderEarning: { type: Number, required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  status: { type: String, enum: ['pending', 'escrowed', 'released', 'refunded', 'failed'], default: 'pending' },
  escrowedAt: { type: Date },
  releasedAt: { type: Date },
  refundedAt: { type: Date },
  refundReason: { type: String },
}, { timestamps: true });

PaymentSchema.index({ requestId: 1 });
PaymentSchema.index({ ownerId: 1 });
PaymentSchema.index({ riderId: 1 });
PaymentSchema.index({ status: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
