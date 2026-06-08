import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as PostController from '../controllers/post.controller';

const router = Router();

router.post('/', authenticate, upload.array('files', 10), PostController.createPost);
router.get('/feed', authenticate, PostController.getFeed);
router.get('/reels', PostController.getReels);
router.post('/:id/like', authenticate, PostController.toggleLike);
router.post('/:id/comment', authenticate, PostController.addComment);
router.delete('/:id', authenticate, PostController.deletePost);
router.get('/user/:userId', PostController.getUserPosts);

export default router;
