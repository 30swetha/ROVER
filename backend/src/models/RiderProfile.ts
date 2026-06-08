import mongoose, { Document, Schema } from 'mongoose';

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'reupload';
export type TrustLevel = 'bronze' | 'silver' | 'gold';

export interface IPrompt {
  question: string;
  answer: string;
}

export interface IRiderProfile extends Document {
  userId: mongoose.Types.ObjectId;
  licenseNumber?: string;
  aadhaarNumber?: string;
  selfieUrl?: string;
  licenseUrl?: string;
  aadhaarUrl?: string;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  rating: number;
  totalRatings: number;
  completedTrips: number;
  totalEarnings: number;
  pendingEarnings: number;
  languages: string[];
  ridingExperience: number;
  routeExpertise: string[];
  safetyScore: number;
  insuranceStatus: boolean;
  coverPhoto?: string;
  photos: string[];
  videos: string[];
  prompts: IPrompt[];
  trustLevel: TrustLevel;
  cancellationRate: number;
  avgResponseTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const PromptSchema = new Schema<IPrompt>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
}, { _id: false });

const RiderProfileSchema = new Schema<IRiderProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  licenseNumber: { type: String },
  aadhaarNumber: { type: String },
  selfieUrl: { type: String },
  licenseUrl: { type: String },
  aadhaarUrl: { type: String },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reupload'],
    default: 'pending',
  },
  verificationNotes: { type: String },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  completedTrips: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  pendingEarnings: { type: Number, default: 0 },
  languages: [{ type: String }],
  ridingExperience: { type: Number, default: 0 },
  routeExpertise: [{ type: String }],
  safetyScore: { type: Number, default: 100, min: 0, max: 100 },
  insuranceStatus: { type: Boolean, default: false },
  coverPhoto: { type: String },
  photos: [{ type: String }],
  videos: [{ type: String }],
  prompts: [PromptSchema],
  trustLevel: { type: String, enum: ['bronze', 'silver', 'gold'], default: 'bronze' },
  cancellationRate: { type: Number, default: 0, min: 0, max: 100 },
  avgResponseTime: { type: Number, default: 0 },
}, { timestamps: true });

RiderProfileSchema.index({ userId: 1 });
RiderProfileSchema.index({ verificationStatus: 1 });
RiderProfileSchema.index({ rating: -1 });
RiderProfileSchema.index({ completedTrips: -1 });

export const RiderProfile = mongoose.model<IRiderProfile>('RiderProfile', RiderProfileSchema);
