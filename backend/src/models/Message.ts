import mongoose, { Document, Schema } from 'mongoose';

export type MessageType = 'text' | 'image' | 'location' | 'system';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId?: mongoose.Types.ObjectId;
  tripId?: mongoose.Types.ObjectId;
  content: string;
  type: MessageType;
  mediaUrl?: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
  content: { type: String, required: true, maxlength: 2000 },
  type: { type: String, enum: ['text', 'image', 'location', 'system'], default: 'text' },
  mediaUrl: { type: String },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ tripId: 1 });
MessageSchema.index({ createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
