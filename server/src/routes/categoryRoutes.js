import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect); // All category routes are protected

router.route('/').get(getCategories).post(createCategory);
router.route('/:id').get(getCategoryById).patch(updateCategory).delete(deleteCategory);

export default router;
