import mongoose, { Document, Schema } from 'mongoose';

export type BadgeType =
  | 'first_ride' | 'ten_trips' | 'fifty_trips' | 'hundred_trips'
  | 'top_rated' | 'verified_rider' | 'community_star' | 'trip_leader'
  | 'early_adopter' | 'five_star_streak';

export interface IAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  badge: BadgeType;
  xpAwarded: number;
  earnedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  badge: {
    type: String,
    enum: ['first_ride', 'ten_trips', 'fifty_trips', 'hundred_trips', 'top_rated', 'verified_rider', 'community_star', 'trip_leader', 'early_adopter', 'five_star_streak'],
    required: true,
  },
  xpAwarded: { type: Number, required: true, default: 0 },
  earnedAt: { type: Date, default: Date.now },
}, { timestamps: true });

AchievementSchema.index({ userId: 1 });
AchievementSchema.index({ badge: 1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema);
