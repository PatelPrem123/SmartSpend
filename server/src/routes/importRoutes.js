import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  previewCsv,
  confirmCsv,
  getImportBatches,
  exportCsv,
} from '../controllers/importController.js';

// Strict rate limiter for file import/export operations (OWASP Resource Exhaustion Prevention)
const fileOpsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many file import/export requests, please slow down',
  },
  skip: () => env.NODE_ENV === 'test',
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed for bank statement import'));
    }
  },
});

// Middleware to catch Multer errors before controller execution
const handleCsvUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds the 5MB limit',
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload failed',
      });
    }
    next();
  });
};

const router = Router();

router.use(protect);

router.get('/', getImportBatches);
router.post('/csv/preview', fileOpsLimiter, handleCsvUpload, previewCsv);
router.post('/csv/confirm', fileOpsLimiter, confirmCsv);
router.get('/csv/export', fileOpsLimiter, exportCsv);

export default router;
