import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export async function protect(req, res, next) {
  let token = null;

  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // 2. Fallback to Authorization Bearer header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized: Access token is missing',
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized: User account no longer exists',
      });
    }

    // Check if user changed password after token was issued via tokenVersion
    if (
      decoded.tokenVersion !== undefined &&
      decoded.tokenVersion !== (user.tokenVersion || 0)
    ) {
      return res.status(401).json({
        success: false,
        error: 'Session expired: User recently updated password. Please login again.',
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized: Invalid or expired token',
    });
  }
}
