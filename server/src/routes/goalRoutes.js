import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  getContributions,
  deleteContribution,
} from '../controllers/goalController.js';

const router = Router();

router.use(protect);

router.route('/').get(getGoals).post(createGoal);

router.route('/:id').get(getGoalById).patch(updateGoal).delete(deleteGoal);

router.route('/:id/contributions').get(getContributions).post(addContribution);

router.route('/:id/contributions/:contributionId').delete(deleteContribution);

export default router;
