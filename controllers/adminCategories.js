const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const ExpressError = require("../utils/ExpressError");
const { sendSuccess, escapeRegex } = require("../utils/helpers");
const slugify = require("slugify");
const _ = require("lodash");
const { audit } = require("../utils/adminAudit");
const { deleteFromCloudinary } = require("../utils/cloudinary");

module.exports.listCategories = async (req, res) => {
  const includeInactive =
    req.query.includeInactive === "true" || req.query.includeInactive === true;
  const filter = {};
  if (!includeInactive) filter.isActive = true;
  if (req.query.search) {
    filter.name = new RegExp(escapeRegex(String(req.query.search).trim()), "i");
  }
  const [items, productCountsAll] = await Promise.all([
    Category.find(filter).sort({ name: 1 }).lean(),
    Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);
  const counts = new Map(productCountsAll.map((r) => [String(r._id), r.count]));
  const decorated = items.map((c) => ({
    ...c,
    productCount: counts.get(String(c._id)) || 0,
  }));
  sendSuccess(res, { docs: decorated });
};

module.exports.getCategory = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid category id."));
  }
  const cat = await Category.findById(id).lean();
  if (!cat) return next(new ExpressError(404, "Category not found."));
  const productCount = await Product.countDocuments({ category: cat._id });
  sendSuccess(res, { ...cat, productCount });
};

module.exports.createCategory = async (req, res, next) => {
  const { name, slug, description = "", isActive = true } = req.body || {};
  const trimmed = String(name || "").trim();
  if (!trimmed) return next(new ExpressError(400, "Category name is required."));
  const exists = await Category.findOne({
    name: { $regex: `^${escapeRegex(trimmed)}$`, $options: "i" },
  });
  if (exists) {
    return next(
      new ExpressError(409, "A category with this name already exists."),
    );
  }
  const normalizedSlug = slug
    ? slugify(String(slug), { lower: true, strict: true })
    : undefined;
  if (normalizedSlug && (await Category.exists({ slug: normalizedSlug }))) {
    return next(
      new ExpressError(409, "A category with this slug already exists."),
    );
  }
  const cat = new Category({
    name: trimmed,
    slug: normalizedSlug,
    description,
    isActive,
  });
  await cat.save();
  const saved = cat.toObject();
  await audit(req, "category.create", "category", String(cat._id), null, saved);
  sendSuccess(res, { ...saved, productCount: 0 }, 201);
};

module.exports.updateCategory = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid category id."));
  }
  const cat = await Category.findById(id);
  if (!cat) return next(new ExpressError(404, "Category not found."));
  const before = cat.toObject();
  const updates = _.pick(req.body || {}, [
    "name",
    "slug",
    "description",
    "isActive",
  ]);
  if (typeof updates.name === "string") {
    const t = updates.name.trim();
    if (!t) return next(new ExpressError(400, "Name cannot be empty."));
    const exists = await Category.findOne({
      name: { $regex: `^${escapeRegex(t)}$`, $options: "i" },
      _id: { $ne: cat._id },
    });
    if (exists) {
      return next(
        new ExpressError(409, "A category with this name already exists."),
      );
    }
    updates.name = t;
  }
  if (typeof updates.slug === "string") {
    updates.slug = slugify(updates.slug, { lower: true, strict: true });
    const exists = await Category.findOne({
      slug: updates.slug,
      _id: { $ne: cat._id },
    });
    if (exists) {
      return next(
        new ExpressError(409, "A category with this slug already exists."),
      );
    }
  }
  Object.assign(cat, updates);
  await cat.save();
  const after = cat.toObject();
  const productCount = await Product.countDocuments({ category: cat._id });
  await audit(req, "category.update", "category", String(id), before, after);
  sendSuccess(res, { ...after, productCount });
};

module.exports.deleteCategory = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid category id."));
  }
  const cat = await Category.findById(id);
  if (!cat) return next(new ExpressError(404, "Category not found."));
  const before = cat.toObject();

  const productCount = await Product.countDocuments({ category: cat._id });
  const { reassignTo } = req.body || {};
  if (productCount > 0) {
    if (!reassignTo) {
      return next(
        new ExpressError(
          400,
          `Cannot delete category with ${productCount} product(s). Provide \`reassignTo\` category id to move products elsewhere, or move products first.`,
        ),
      );
    }
    if (!mongoose.Types.ObjectId.isValid(reassignTo)) {
      return next(new ExpressError(400, "Invalid `reassignTo` category id."));
    }
    if (String(reassignTo) === String(id)) {
      return next(
        new ExpressError(400, "`reassignTo` cannot be the same category."),
      );
    }
    const target = await Category.findById(reassignTo);
    if (!target) {
      return next(new ExpressError(404, "Target category not found."));
    }
    await Product.updateMany(
      { category: cat._id },
      { $set: { category: target._id } },
    );
  }

  const img = cat.image && cat.image.publicId;
  if (img) await deleteFromCloudinary(img, "image");
  await cat.deleteOne();
  await audit(
    req,
    "category.delete",
    "category",
    String(id),
    before,
    null,
    reassignTo ? `reassigned ${productCount} products to ${reassignTo}` : "",
  );
  sendSuccess(res, { deleted: true, id, reassignedProducts: productCount });
};

module.exports.uploadImage = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid category id."));
  }
  const cat = await Category.findById(id);
  if (!cat) return next(new ExpressError(404, "Category not found."));
  const before = cat.toObject();
  if (!req.file) {
    return next(new ExpressError(400, "A category image is required."));
  }
  const oldPublicId = cat.image && cat.image.publicId;
  cat.image = {
    url: req.file.path || req.file.secure_url || req.file.url || "",
    publicId: req.file.public_id || req.file.filename || "",
  };
  await cat.save();
  if (oldPublicId && oldPublicId !== cat.image.publicId) {
    await deleteFromCloudinary(oldPublicId, "image");
  }
  const after = cat.toObject();
  await audit(
    req,
    "category.image.upload",
    "category",
    String(id),
    { image: before.image },
    { image: after.image },
  );
  sendSuccess(res, { ...after });
};

module.exports.deleteImage = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid category id."));
  }
  const cat = await Category.findById(id);
  if (!cat) return next(new ExpressError(404, "Category not found."));
  const before = cat.toObject();
  const publicId = cat.image && cat.image.publicId;
  if (publicId) await deleteFromCloudinary(publicId, "image");
  cat.image = { url: "", publicId: "" };
  await cat.save();
  const after = cat.toObject();
  await audit(
    req,
    "category.image.delete",
    "category",
    String(id),
    { image: before.image },
    { image: after.image },
  );
  sendSuccess(res, { ...after });
};
