import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  getCashFlowReport,
  getCategoryDistributionReport,
  getAccountDerivedBalanceReport,
  exportExcelReport,
  exportPdfReport,
  getAnnualFinancialSummary,
} from '../controllers/reportsController.js';

// Dedicated rate limiter for export operations (Prevents server CPU/Memory exhaustion during heavy report generation)
const fileOpsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many export requests, please slow down',
  },
  skip: () => env.NODE_ENV === 'test',
});

const router = Router();

router.use(protect);

router.get('/cashflow', getCashFlowReport);
router.get('/categories', getCategoryDistributionReport);
router.get('/accounts/:accountId/derived-balance', getAccountDerivedBalanceReport);
router.get('/annual-summary', getAnnualFinancialSummary);
router.get('/export/excel', fileOpsLimiter, exportExcelReport);
router.get('/export/pdf', fileOpsLimiter, exportPdfReport);

export default router;
