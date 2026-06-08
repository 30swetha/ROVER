import { Request, Response } from 'express';
import { Post } from '../models/Post';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../middleware/upload';
import { User } from '../models/User';
import mongoose from 'mongoose';

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];
  const images: string[] = [];
  const videos: string[] = [];

  if (files?.length) {
    await Promise.all(files.map(async (file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const url = await uploadToCloudinary(file.buffer, 'posts', isVideo ? 'video' : 'image');
      if (isVideo) videos.push(url);
      else images.push(url);
    }));
  }

  const post = await Post.create({
    authorId: req.user!.id,
    content: req.body.content || '',
    images,
    videos,
    type: req.body.type || (videos.length > 0 ? 'reel' : 'post'),
    location: req.body.location,
    tags: req.body.tags ? JSON.parse(req.body.tags) : [],
  });

  const populated = await post.populate('authorId', 'name avatar city');
  res.status(201).json({ post: populated });
};

export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const user = await User.findById(req.user!.id).select('following');
  const followingIds = user?.following || [];

  const posts = await Post.find({
    $or: [
      { authorId: { $in: [...followingIds, new mongoose.Types.ObjectId(req.user!.id)] } },
      { type: 'post' },
    ],
    type: 'post',
  })
    .populate('authorId', 'name avatar city trustScore')
    .populate('comments.userId', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ posts });
};

export const getReels = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const reels = await Post.find({ type: 'reel', videos: { $exists: true, $ne: [] } })
    .populate('authorId', 'name avatar city')
    .sort({ createdAt: -1, likes: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ reels });
};

export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await Post.findById(req.params.id);
  if (!post) { res.status(404).json({ error: 'Post not found' }); return; }

  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const liked = post.likes.some(id => id.equals(userId));

  await Post.findByIdAndUpdate(
    req.params.id,
    liked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
  );

  res.json({ liked: !liked, likesCount: post.likes.length + (liked ? -1 : 1) });
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { text } = req.body;
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $push: { comments: { userId: req.user!.id, text, createdAt: new Date() } } },
    { new: true },
  ).populate('comments.userId', 'name avatar');

  if (!post) { res.status(404).json({ error: 'Post not found' }); return; }
  res.json({ comments: post.comments });
};

export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await Post.findOneAndDelete({ _id: req.params.id, authorId: req.user!.id });
  if (!post) { res.status(404).json({ error: 'Post not found or unauthorized' }); return; }
  res.json({ message: 'Post deleted' });
};

export const getUserPosts = async (req: Request, res: Response): Promise<void> => {
  const { type } = req.query;
  const filter: Record<string, unknown> = { authorId: req.params.userId };
  if (type) filter.type = type;

  const posts = await Post.find(filter)
    .populate('authorId', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(30);

  res.json({ posts });
};
