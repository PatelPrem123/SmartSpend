import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import {
  register,
  login,
  logout,
  getMe,
  updateMe,
  updatePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Dedicated brute-force rate limiter for authentication endpoints (DEC-007 / OWASP A07)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
  skip: () => env.NODE_ENV === 'test',
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);

router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.put('/password', protect, updatePassword);

export default router;
