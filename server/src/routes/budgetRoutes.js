import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
} from '../controllers/budgetController.js';

const router = Router();

router.use(protect);

router.route('/').post(createBudget).get(getBudgets);

router.route('/:id').get(getBudgetById).patch(updateBudget).delete(deleteBudget);

export default router;
