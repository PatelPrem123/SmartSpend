import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let details = null;

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }

  // Handle Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource ID: ${err.value}`;
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate entry: A record with this ${field} already exists`;
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database validation failed';
    details = Object.values(err.errors).map((e) => e.message);
  }

  // Handle Multer File Upload Errors
  if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File size exceeds 5MB limit'
        : `File upload error: ${err.message}`;
  }

  // Handle JWT Auth Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${message}`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details }),
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
