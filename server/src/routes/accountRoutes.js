import { Router } from 'express';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  archiveAccount,
} from '../controllers/accountController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect); // All account routes are protected

router.route('/').get(getAccounts).post(createAccount);
router.route('/:id').get(getAccountById).patch(updateAccount).delete(archiveAccount);

export default router;
