const Product = require("../models/Product");
const Category = require("../models/Category");
const ExpressError = require("../utils/ExpressError");
const { sendSuccess, buildPaginationMeta, escapeRegex } = require("../utils/helpers");
const slugify = require("slugify");

const buildProductFilter = (query = {}) => {
  const filter = { isActive: true };

  if (query.search) {
    const regex = new RegExp(escapeRegex(String(query.search).trim()), "i");
    filter.$or = [
      { name: regex },
      { description: regex },
      { brand: regex },
    ];
  }

  if (query.category) {
    const categorySlug = String(query.category).trim();
    if (categorySlug) {
      filter.category = categorySlug;
    }
  }

  if (query.brand) {
    filter.brand = new RegExp(escapeRegex(String(query.brand).trim()), "i");
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice !== undefined && query.minPrice !== "") {
      filter.price.$gte = Number(query.minPrice);
    }
    if (query.maxPrice !== undefined && query.maxPrice !== "") {
      filter.price.$lte = Number(query.maxPrice);
    }
  }

  if (query.inStock !== undefined) {
    const isInStock = query.inStock === true || query.inStock === "true";
    filter.stock = isInStock ? { $gt: 0 } : { $lte: 0 };
  }

  if (query.featured !== undefined) {
    filter.featured = query.featured === true || query.featured === "true";
  }

  if (query.minRating) {
    filter.rating = { $gte: Number(query.minRating) };
  }

  return filter;
};

const buildSort = (sortKey = "newest") => {
  switch (sortKey) {
    case "price-asc":
      return { price: 1 };
    case "price-desc":
      return { price: -1 };
    case "rating-desc":
      return { rating: -1, numReviews: -1 };
    case "name-asc":
      return { name: 1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
};

module.exports.listProducts = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const filter = buildProductFilter(req.query);

  if (filter.category) {
    const category = await Category.findOne({ slug: filter.category }).select("_id").lean();
    if (category) {
      filter.category = category._id;
    } else {
      filter.category = null;
    }
  }

  const sort = buildSort(req.query.sort || "newest");
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  });
};

module.exports.getProductBySlug = async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate("category", "name slug")
    .lean();

  if (!product) {
    return next(new ExpressError(404, "Product not found."));
  }

  sendSuccess(res, product);
};

module.exports.createProduct = async (req, res, next) => {
  const payload = { ...req.body };

  if (!payload.name || !payload.category) {
    return next(new ExpressError(400, "Product name and category are required."));
  }

  const category = await Category.findById(payload.category);
  if (!category) {
    return next(new ExpressError(404, "Category not found."));
  }

  if (!payload.slug) {
    payload.slug = slugify(payload.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }

  const product = new Product({
    ...payload,
    category: category._id,
  });

  await product.save();
  const saved = await Product.findById(product._id).populate("category", "name slug").lean();
  sendSuccess(res, saved, 201);
};

module.exports.updateProduct = async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    return next(new ExpressError(404, "Product not found."));
  }

  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (!category) {
      return next(new ExpressError(404, "Category not found."));
    }
  }

  Object.assign(product, req.body);
  if (product.isModified("name") && !req.body.slug) {
    product.slug = slugify(product.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }

  await product.save();
  const updated = await Product.findById(product._id).populate("category", "name slug").lean();
  sendSuccess(res, updated);
};

module.exports.deleteProduct = async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    return next(new ExpressError(404, "Product not found."));
  }

  await product.deleteOne();
  sendSuccess(res, { deleted: true, slug: req.params.slug });
};

module.exports.uploadProductImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ExpressError(400, "At least one product image is required."));
  }

  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    return next(new ExpressError(404, "Product not found."));
  }

  product.images.push(
    ...req.files.map((file) => ({
      url: file.path || file.secure_url || file.url,
      publicId: file.public_id || file.filename || "",
    })),
  );

  await product.save();
  sendSuccess(res, product.toObject());
};

module.exports.updateStock = async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    return next(new ExpressError(404, "Product not found."));
  }

  product.stock = Number(req.body.stock);
  await product.save();
  sendSuccess(res, product.toObject());
};
