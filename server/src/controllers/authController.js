import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updatePasswordSchema,
} from '../validators/authValidator.js';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  TRANSACTION_TYPES,
} from '../config/constants.js';

/**
 * Helper to generate JWT, configure HttpOnly cookie, and send JSON response
 */
function sendTokenResponse(user, statusCode, res) {
  const token = user.getSignedJwtToken();

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.status(statusCode).cookie('jwt', token, cookieOptions).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      baseCurrency: user.baseCurrency,
      timezone: user.timezone,
      monthlyBudgetLimitMinor: user.monthlyBudgetLimitMinor,
    },
  });
}

/**
 * Seed default categories for a newly registered user
 */
async function seedDefaultCategories(userId) {
  const expenseDocs = DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
    userId,
    name: cat.name,
    type: TRANSACTION_TYPES.EXPENSE,
    icon: cat.icon,
    color: cat.color,
    isDefault: true,
  }));

  const incomeDocs = DEFAULT_INCOME_CATEGORIES.map((cat) => ({
    userId,
    name: cat.name,
    type: TRANSACTION_TYPES.INCOME,
    icon: cat.icon,
    color: cat.color,
    isDefault: true,
  }));

  await Category.insertMany([...expenseDocs, ...incomeDocs]);
}

/**
 * @desc    Register a new user & seed default categories
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export async function register(req, res, next) {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists',
      });
    }

    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      password: validatedData.password,
      baseCurrency: validatedData.baseCurrency,
      timezone: validatedData.timezone,
    });

    // Seed default categories
    try {
      await seedDefaultCategories(user._id);
    } catch (seedErr) {
      // Non-fatal if seeding has minor conflict
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials: Email or password incorrect',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials: Email or password incorrect',
      });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Log out user & clear cookie
 * @route   POST /api/v1/auth/logout
 * @access  Public
 */
export async function logout(req, res) {
  res.cookie('jwt', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
}

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export async function getMe(req, res) {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      baseCurrency: req.user.baseCurrency,
      timezone: req.user.timezone,
      monthlyBudgetLimitMinor: req.user.monthlyBudgetLimitMinor,
      lastLoginAt: req.user.lastLoginAt,
      createdAt: req.user.createdAt,
    },
  });
}

/**
 * @desc    Update user profile details
 * @route   PATCH /api/v1/auth/me
 * @access  Private
 */
export async function updateMe(req, res, next) {
  try {
    const validatedData = updateProfileSchema.parse(req.body);

    const user = req.user;
    if (validatedData.name) user.name = validatedData.name;
    if (validatedData.timezone) user.timezone = validatedData.timezone;
    if (validatedData.monthlyBudgetLimitMinor !== undefined) {
      user.monthlyBudgetLimitMinor = validatedData.monthlyBudgetLimitMinor;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        baseCurrency: user.baseCurrency,
        timezone: user.timezone,
        monthlyBudgetLimitMinor: user.monthlyBudgetLimitMinor,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Update password for authenticated user
 * @route   PUT /api/v1/auth/password
 * @access  Private
 */
export async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password provided is incorrect',
      });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
}
