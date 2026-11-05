import { Category } from '../models/Category.js';
import { createCategorySchema, updateCategorySchema } from '../validators/categoryValidator.js';

/**
 * @desc    Get all categories for authenticated user
 * @route   GET /api/v1/categories
 * @access  Private
 */
export async function getCategories(req, res, next) {
  try {
    const { type, includeArchived } = req.query;
    const filter = { userId: req.user._id };

    if (type) {
      filter.type = type;
    }
    if (includeArchived !== 'true') {
      filter.isArchived = false;
    }

    const categories = await Category.find(filter).sort({ isDefault: -1, name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get single category details
 * @route   GET /api/v1/categories/:id
 * @access  Private
 */
export async function getCategoryById(req, res, next) {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or access unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Create new custom category
 * @route   POST /api/v1/categories
 * @access  Private
 */
export async function createCategory(req, res, next) {
  try {
    const validatedData = createCategorySchema.parse(req.body);

    const existing = await Category.findOne({
      userId: req.user._id,
      name: validatedData.name,
      type: validatedData.type,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `A ${validatedData.type} category named "${validatedData.name}" already exists`,
      });
    }

    const category = await Category.create({
      userId: req.user._id,
      name: validatedData.name,
      type: validatedData.type,
      icon: validatedData.icon,
      color: validatedData.color,
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Update category
 * @route   PATCH /api/v1/categories/:id
 * @access  Private
 */
export async function updateCategory(req, res, next) {
  try {
    const validatedData = updateCategorySchema.parse(req.body);

    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or access unauthorized',
      });
    }

    if (validatedData.name && validatedData.name !== category.name) {
      const duplicate = await Category.findOne({
        userId: req.user._id,
        name: validatedData.name,
        type: category.type,
        _id: { $ne: category._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: `A ${category.type} category named "${validatedData.name}" already exists`,
        });
      }
      category.name = validatedData.name;
    }

    if (validatedData.icon) category.icon = validatedData.icon;
    if (validatedData.color) category.color = validatedData.color;
    if (validatedData.isArchived !== undefined) category.isArchived = validatedData.isArchived;

    await category.save();

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Delete custom category (Default categories are protected)
 * @route   DELETE /api/v1/categories/:id
 * @access  Private
 */
export async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or access unauthorized',
      });
    }

    if (category.isDefault) {
      return res.status(403).json({
        success: false,
        error: 'Protected system category: Default categories cannot be deleted',
      });
    }

    await Category.deleteOne({ _id: category._id });

    res.status(200).json({
      success: true,
      message: `Category "${category.name}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}
