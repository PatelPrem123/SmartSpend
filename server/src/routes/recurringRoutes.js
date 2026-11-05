import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createRecurringRule,
  getRecurringRules,
  getRecurringRuleById,
  updateRecurringRule,
  deleteRecurringRule,
  triggerManualSweep,
  getRuleTransactionHistory,
} from '../controllers/recurringController.js';

const router = Router();

router.use(protect);

router.route('/').post(createRecurringRule).get(getRecurringRules);

router.post('/sweep', triggerManualSweep);

router
  .route('/:id')
  .get(getRecurringRuleById)
  .patch(updateRecurringRule)
  .delete(deleteRecurringRule);

router.get('/:id/transactions', getRuleTransactionHistory);

export default router;
