import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'owner' | 'rider' | 'tripPartner' | 'admin';

export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  city?: string;
  verified: boolean;
  suspended: boolean;
  fcmToken?: string;
  trustScore: number;
  badges: string[];
  xp: number;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, unique: true, match: /^[6-9]\d{9}$/ },
  email: { type: String, lowercase: true, sparse: true, match: /\S+@\S+\.\S+/ },
  role: { type: String, enum: ['owner', 'rider', 'tripPartner', 'admin'], default: 'owner' },
  avatar: { type: String },
  bio: { type: String, maxlength: 500 },
  city: { type: String, trim: true },
  verified: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },
  fcmToken: { type: String },
  trustScore: { type: Number, default: 0, min: 0, max: 100 },
  badges: [{ type: String }],
  xp: { type: Number, default: 0 },
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

UserSchema.index({ role: 1 });
UserSchema.index({ city: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
