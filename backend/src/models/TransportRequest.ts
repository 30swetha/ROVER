import mongoose, { Document, Schema } from 'mongoose';

export type RequestStatus = 'open' | 'inProgress' | 'completed' | 'cancelled';

export interface ITransportRequest extends Document {
  ownerId: mongoose.Types.ObjectId;
  pickupCity: string;
  pickupCoords?: { lat: number; lng: number };
  destinationCity: string;
  destinationCoords?: { lat: number; lng: number };
  pickupDate: Date;
  deliveryDeadline: Date;
  bikeBrand: string;
  bikeModel: string;
  registrationNumber: string;
  budget: number;
  notes?: string;
  bikeImages: string[];
  status: RequestStatus;
  applicants: mongoose.Types.ObjectId[];
  selectedRider?: mongoose.Types.ObjectId;
  distance?: number;
  estimatedDuration?: number;
  routePolyline?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransportRequestSchema = new Schema<ITransportRequest>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pickupCity: { type: String, required: true, trim: true },
  pickupCoords: {
    lat: { type: Number },
    lng: { type: Number },
  },
  destinationCity: { type: String, required: true, trim: true },
  destinationCoords: {
    lat: { type: Number },
    lng: { type: Number },
  },
  pickupDate: { type: Date, required: true },
  deliveryDeadline: { type: Date, required: true },
  bikeBrand: { type: String, required: true },
  bikeModel: { type: String, required: true },
  registrationNumber: { type: String, required: true, uppercase: true },
  budget: { type: Number, required: true, min: 0 },
  notes: { type: String, maxlength: 1000 },
  bikeImages: [{ type: String }],
  status: {
    type: String,
    enum: ['open', 'inProgress', 'completed', 'cancelled'],
    default: 'open',
  },
  applicants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  selectedRider: { type: Schema.Types.ObjectId, ref: 'User' },
  distance: { type: Number },
  estimatedDuration: { type: Number },
  routePolyline: { type: String },
}, { timestamps: true });

TransportRequestSchema.index({ ownerId: 1 });
TransportRequestSchema.index({ status: 1 });
TransportRequestSchema.index({ pickupCity: 1, destinationCity: 1 });
TransportRequestSchema.index({ pickupDate: 1 });

export const TransportRequest = mongoose.model<ITransportRequest>('TransportRequest', TransportRequestSchema);
