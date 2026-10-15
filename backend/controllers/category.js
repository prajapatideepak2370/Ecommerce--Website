const Category = require("../models/Category");
const ExpressError = require("../utils/ExpressError");
const { sendSuccess } = require("../utils/helpers");

module.exports.listCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  sendSuccess(res, categories);
};

module.exports.getCategory = async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!category) {
    return next(new ExpressError(404, "Category not found."));
  }
  sendSuccess(res, category);
};

module.exports.createCategory = async (req, res, next) => {
  const { name, description = "", isActive = true } = req.body;
  const trimmedName = String(name || "").trim();

  if (!trimmedName) {
    return next(new ExpressError(400, "Category name is required."));
  }

  const exists = await Category.findOne({ name: new RegExp(`^${trimmedName}$`, "i") }).lean();
  if (exists) {
    return next(new ExpressError(409, "A category with this name already exists."));
  }

  const category = new Category({
    name: trimmedName,
    description,
    isActive,
  });

  await category.save();
  sendSuccess(res, category.toObject(), 201);
};

module.exports.updateCategory = async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) {
    return next(new ExpressError(404, "Category not found."));
  }

  const updates = { ...req.body };
  if (typeof updates.name === "string") {
    updates.name = updates.name.trim();
    if (!updates.name) {
      return next(new ExpressError(400, "Category name cannot be empty."));
    }
  }

  Object.assign(category, updates);
  await category.save();
  sendSuccess(res, category.toObject());
};

module.exports.deleteCategory = async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) {
    return next(new ExpressError(404, "Category not found."));
  }

  await category.deleteOne();
  sendSuccess(res, { deleted: true, slug: req.params.slug });
};

module.exports.uploadCategoryImage = async (req, res, next) => {
  if (!req.file) {
    return next(new ExpressError(400, "A category image is required."));
  }

  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) {
    return next(new ExpressError(404, "Category not found."));
  }

  category.image = {
    url: req.file.path || req.file.secure_url || req.file.url,
    publicId: req.file.public_id || req.file.filename || "",
  };

  await category.save();
  sendSuccess(res, category.toObject());
};
