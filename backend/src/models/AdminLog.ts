import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;
  targetId?: mongoose.Types.ObjectId;
  targetModel?: string;
  details: string;
  ip?: string;
  createdAt: Date;
}

const AdminLogSchema = new Schema<IAdminLog>({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId },
  targetModel: { type: String },
  details: { type: String, required: true },
  ip: { type: String },
}, { timestamps: true });

AdminLogSchema.index({ adminId: 1 });
AdminLogSchema.index({ createdAt: -1 });

export const AdminLog = mongoose.model<IAdminLog>('AdminLog', AdminLogSchema);
