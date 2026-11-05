import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  createTransfer,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect); // All transaction routes are protected

router.route('/').get(getTransactions).post(createTransaction);
router.post('/transfer', createTransfer);
router.route('/:id').get(getTransactionById).patch(updateTransaction).delete(deleteTransaction);

export default router;
