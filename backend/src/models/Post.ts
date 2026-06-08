import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  userId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IPost extends Document {
  authorId: mongoose.Types.ObjectId;
  content: string;
  images: string[];
  videos: string[];
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  shares: number;
  type: 'post' | 'reel';
  location?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const PostSchema = new Schema<IPost>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, maxlength: 2000, default: '' },
  images: [{ type: String }],
  videos: [{ type: String }],
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [CommentSchema],
  shares: { type: Number, default: 0 },
  type: { type: String, enum: ['post', 'reel'], default: 'post' },
  location: { type: String },
  tags: [{ type: String }],
}, { timestamps: true });

PostSchema.index({ authorId: 1 });
PostSchema.index({ type: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);
