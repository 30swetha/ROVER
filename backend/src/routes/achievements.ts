import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as AchievementController from '../controllers/achievement.controller';

const router = Router();

router.get('/my', authenticate, AchievementController.getMyAchievements);
router.get('/leaderboard', AchievementController.getLeaderboard);

export default router;
