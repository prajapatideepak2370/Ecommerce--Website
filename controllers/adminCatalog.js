const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const ExpressError = require("../utils/ExpressError");
const {
  sendSuccess,
  buildPaginationMeta,
  escapeRegex,
} = require("../utils/helpers");
const slugify = require("slugify");
const _ = require("lodash");
const { audit } = require("../utils/adminAudit");
const { deleteFromCloudinary } = require("../utils/cloudinary");

const LOW_STOCK_THRESHOLD = () =>
  Number(process.env.LOW_STOCK_THRESHOLD || 5);

function _availability(stock, threshold) {
  if (stock <= 0) return "out-of-stock";
  if (stock <= threshold) return "low-stock";
  return "in-stock";
}

function _buildFilter(query) {
  const filter = {};
  const {
    search,
    category,
    status,
    stockLevel,
    brand,
    minPrice,
    maxPrice,
    featured,
    includeDeleted,
  } = query || {};

  if (status === "deleted") {
    filter.deletedAt = { $ne: null };
  } else {
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;
  }
  if (
    status === "active" ||
    status === "inactive" ||
    (status !== "deleted" &&
      includeDeleted !== "true" &&
      includeDeleted !== true)
  ) {
    filter.$or = [{ deletedAt: null }, { deletedAt: { $exists: false } }];
  }

  if (search) {
    const regex = new RegExp(escapeRegex(String(search).trim()), "i");
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { name: regex },
          { description: regex },
          { brand: regex },
          { sku: regex },
        ],
      },
    ];
  }
  if (brand) {
    filter.brand = new RegExp(escapeRegex(String(brand).trim()), "i");
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice !== undefined && minPrice !== "")
      filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== "")
      filter.price.$lte = Number(maxPrice);
  }
  if (featured !== undefined && featured !== "") {
    filter.featured = featured === true || featured === "true";
  }
  if (stockLevel) {
    const t = LOW_STOCK_THRESHOLD();
    switch (stockLevel) {
      case "out":
        filter.stock = { $lte: 0 };
        break;
      case "low":
        filter.stock = { $gt: 0, $lte: t };
        break;
      case "ok":
        filter.stock = { $gt: t };
        break;
      default:
        break;
    }
  }
  return filter;
}

async function _resolveCategoryFilter(filter) {
  if (filter.category && typeof filter.category === "string") {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(filter.category);
    let cat;
    if (isObjectId) {
      cat = await Category.findById(filter.category).select("_id").lean();
    } else {
      cat = await Category.findOne({ slug: filter.category }).select("_id").lean();
    }
    if (cat) filter.category = cat._id;
    else filter.category = null;
  }
}

function _buildSort(sortKey, sortDir = "desc") {
  const direction = sortDir === "asc" ? 1 : -1;
  switch (sortKey) {
    case "price-asc":
      return { price: 1 };
    case "price-desc":
      return { price: -1 };
    case "stock-asc":
      return { stock: 1 };
    case "stock-desc":
      return { stock: -1 };
    case "name-asc":
      return { name: 1 };
    case "name-desc":
      return { name: -1 };
    case "sku-asc":
      return { sku: 1 };
    case "name":
      return { name: direction };
    case "price":
      return { price: direction };
    case "stock":
      return { stock: direction };
    case "category":
      return { category: direction };
    case "isActive":
      return { isActive: direction };
    case "updatedAt":
      return { updatedAt: direction };
    case "createdAt":
      return { createdAt: direction };
    case "newest":
    default:
      return { createdAt: -1 };
  }
}

module.exports.listProducts = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 25));
  const filter = _buildFilter(req.query);

  if (req.query.category) filter.category = req.query.category;
  await _resolveCategoryFilter(filter);

  const sort = _buildSort(req.query.sort || "newest", req.query.dir);
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

  const threshold = LOW_STOCK_THRESHOLD();
  const decorated = items.map((p) => ({
    ...p,
    availability: _availability(p.stock, threshold),
  }));

  const pageInfo = buildPaginationMeta(page, limit, total);
  sendSuccess(res, {
    docs: decorated,
    pagination: {
      ...pageInfo,
      totalDocs: total,
      pagingCounter: total === 0 ? 0 : (page - 1) * limit + 1,
      hasPrevPage: pageInfo.hasPrev,
      hasNextPage: pageInfo.hasNext,
    },
  });
};

module.exports.getProductById = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid product id."));
  }
  const product = await Product.findById(id)
    .populate("category", "name slug")
    .lean();
  if (!product) return next(new ExpressError(404, "Product not found."));
  const threshold = LOW_STOCK_THRESHOLD();
  sendSuccess(res, {
    ...product,
    availability: _availability(product.stock, threshold),
  });
};

function _checkDiscount(discountPrice, price, next) {
  if (
    discountPrice !== undefined &&
    discountPrice !== null &&
    Number(discountPrice) >= Number(price)
  ) {
    return next(
      new ExpressError(400, "Discount price must be lower than price."),
    );
  }
  return null;
}

module.exports.createProduct = async (req, res, next) => {
  const payload = { ...req.body };

  if (!payload.name || !payload.category) {
    return next(
      new ExpressError(400, "Product name and category are required."),
    );
  }
  if (payload.price === undefined || payload.price === null || Number(payload.price) <= 0) {
    return next(new ExpressError(400, "A positive price is required."));
  }
  const check = _checkDiscount(payload.discountPrice, payload.price, next);
  if (check) return check;
  if (payload.stock === undefined || payload.stock === null || Number(payload.stock) < 0) {
    return next(new ExpressError(400, "Non-negative stock is required."));
  }

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(payload.category));
  const category = isObjectId
    ? await Category.findById(payload.category)
    : await Category.findOne({ slug: payload.category });
  if (!category) return next(new ExpressError(404, "Category not found."));
  payload.category = category._id;

  payload.slug = slugify(payload.slug || payload.name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
  if (!payload.slug) {
    payload.slug = slugify(payload.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
  const existingSlug = await Product.findOne({ slug: payload.slug });
  if (existingSlug) {
    payload.slug = `${payload.slug}-${Date.now().toString(36)}`;
  }

  if (payload.specifications && typeof payload.specifications === "object") {
    const cleaned = {};
    Object.keys(payload.specifications).forEach((k) => {
      const key = String(k || "").trim();
      if (!key) return;
      cleaned[key] = payload.specifications[k];
    });
    payload.specifications = cleaned;
  }

  const product = new Product(payload);
  await product.save();
  const saved = await Product.findById(product._id)
    .populate("category", "name slug")
    .lean();
  await audit(req, "product.create", "product", String(product._id), null, saved);
  sendSuccess(res, saved, 201);
};

module.exports.updateProduct = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid product id."));
  }
  const product = await Product.findById(id);
  if (!product) return next(new ExpressError(404, "Product not found."));
  const before = product.toObject();

  const updates = _.pick(req.body || {}, [
    "name",
    "slug",
    "description",
    "price",
    "discountPrice",
    "category",
    "stock",
    "brand",
    "sku",
    "specifications",
    "colorOptions",
    "dimensions",
    "material",
    "featured",
    "isActive",
  ]);

  if (updates.category) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(updates.category));
    const category = isObjectId
      ? await Category.findById(updates.category)
      : await Category.findOne({ slug: updates.category });
    if (!category) return next(new ExpressError(404, "Category not found."));
    updates.category = category._id;
  }

  const nextPrice = updates.price !== undefined ? Number(updates.price) : Number(product.price);
  const nextDiscount =
    updates.discountPrice !== undefined ? Number(updates.discountPrice) : product.discountPrice;
  const dcheck = _checkDiscount(nextDiscount, nextPrice, next);
  if (dcheck) return dcheck;

  if (updates.price !== undefined && Number(updates.price) <= 0) {
    return next(new ExpressError(400, "Price must be positive."));
  }
  if (updates.stock !== undefined && Number(updates.stock) < 0) {
    return next(new ExpressError(400, "Stock must be >= 0."));
  }

  if ("name" in updates && !("slug" in updates)) {
    updates.slug = slugify(updates.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    const dup = await Product.findOne({
      slug: updates.slug,
      _id: { $ne: product._id },
    });
    if (dup) updates.slug = `${updates.slug}-${Date.now().toString(36)}`;
  }
  if ("slug" in updates) {
    updates.slug = slugify(String(updates.slug), {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    if (!updates.slug) {
      return next(new ExpressError(400, "Slug cannot be empty."));
    }
    const dup = await Product.findOne({
      slug: updates.slug,
      _id: { $ne: product._id },
    });
    if (dup) {
      return next(new ExpressError(409, "Slug already in use."));
    }
  }
  if ("sku" in updates) {
    const dup = await Product.findOne({
      sku: updates.sku,
      _id: { $ne: product._id },
    });
    if (dup) return next(new ExpressError(409, "SKU already in use."));
  }

  Object.assign(product, updates);
  await product.save();
  const after = await Product.findById(product._id)
    .populate("category", "name slug")
    .lean();
  await audit(req, "product.update", "product", String(product._id), before, after);
  sendSuccess(res, after);
};

async function _orderReferencesProduct(productId) {
  const count = await Order.estimatedDocumentCount();
  if (count === 0) return false;
  const n = await Order.countDocuments({
    "items.product": mongoose.Types.ObjectId(productId),
  });
  return n > 0;
}

module.exports.deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid product id."));
  }
  const product = await Product.findById(id);
  if (!product) return next(new ExpressError(404, "Product not found."));

  const permanent = req.query.permanent === "true" || req.query.permanent === true;
  const before = product.toObject();

  if (!permanent) {
    product.isActive = false;
    product.deletedAt = new Date();
    await product.save();
    await Cart.updateMany(
      { "items.product": product._id },
      { $pull: { items: { product: product._id } } },
    );
    await Wishlist.updateMany(
      {},
      { $pull: { products: product._id } },
    );
    await audit(
      req,
      "product.softDelete",
      "product",
      String(product._id),
      before,
      { ...before, isActive: false, deletedAt: product.deletedAt },
      req.body && req.body.reason ? req.body.reason : "",
    );
    return sendSuccess(res, { deleted: "soft", id });
  }

  const referenced = await _orderReferencesProduct(product._id);
  if (referenced) {
    return next(
      new ExpressError(
        400,
        "Permanent delete blocked: this product appears in existing orders. Use soft delete, or archive orders first.",
      ),
    );
  }

  await Cart.updateMany(
    { "items.product": product._id },
    { $pull: { items: { product: product._id } } },
  );
  await Wishlist.updateMany({}, { $pull: { products: product._id } });

  const images = product.images || [];
  for (const img of images) {
    if (img && img.publicId) await deleteFromCloudinary(img.publicId, "image");
  }
  if (product.model3D && product.model3D.url) {
    const idFromUrl = product.model3D.url
      ? product.model3D.url.split("/").pop()
      : null;
    if (idFromUrl) await deleteFromCloudinary(idFromUrl, "raw");
  }

  await product.deleteOne();
  await audit(req, "product.permanentDelete", "product", id, before, null, req.body && req.body.reason ? req.body.reason : "");
  sendSuccess(res, { deleted: "permanent", id });
};

module.exports.patchStatus = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid product id."));
  }
  const product = await Product.findById(id);
  if (!product) return next(new ExpressError(404, "Product not found."));
  const before = product.toObject();
  const nextIsActive =
    req.body && req.body.isActive !== undefined
      ? !!req.body.isActive
      : !product.isActive;
  product.isActive = nextIsActive;
  if (nextIsActive && product.deletedAt) product.deletedAt = null;
  await product.save();
  const after = product.toObject();
  await audit(req, "product.status", "product", id, before, after);
  sendSuccess(res, after);
};

module.exports.patchStock = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid product id."));
  }
  const product = await Product.findById(id);
  if (!product) return next(new ExpressError(404, "Product not found."));
  const before = product.toObject();

  const { stock, delta, reason = "" } = req.body || {};
  let nextStock;
  if (delta !== undefined && delta !== null) {
    nextStock = Number(product.stock || 0) + Number(delta);
  } else if (stock !== undefined && stock !== null) {
    nextStock = Number(stock);
  } else {
    return next(
      new ExpressError(400, "Provide either stock or delta for the update."),
    );
  }
  if (!Number.isFinite(nextStock) || nextStock < 0) {
    return next(new ExpressError(400, "Stock cannot go negative."));
  }
  product.stock = Math.floor(nextStock);
  await product.save();
  const after = product.toObject();
  await audit(
    req,
    "product.stock",
    "product",
    id,
    { stock: before.stock },
    { stock: after.stock },
    typeof reason === "string" ? reason : "",
    {
      delta: delta !== undefined ? Number(delta) : null,
      stock: stock !== undefined ? Number(stock) : null,
    },
  );
  sendSuccess(res, { stock: product.stock, _id: id });
};

module.exports.uploadImages = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid product id."));
  }
  const product = await Product.findById(id);
  if (!product) return next(new ExpressError(404, "Product not found."));
  const before = product.toObject();

  if (!req.files || req.files.length === 0) {
    return next(new ExpressError(400, "At least one image is required."));
  }
  const added = [];
  req.files.forEach((f) => {
    const url = f.path || f.secure_url || f.url || "";
    const publicId = f.public_id || f.filename || "";
    if (url && publicId) {
      added.push({ url, publicId });
    }
  });
  if (added.length === 0) {
    return next(new ExpressError(400, "No valid image uploads processed."));
  }
  product.images = product.images || [];
  product.images.push(...added);
  await product.save();
  const after = product.toObject();
  await audit(
    req,
    "product.images.upload",
    "product",
    id,
    { images: before.images },
    { images: after.images },
    `Added ${added.length} image(s)`,
  );
  sendSuccess(res, { images: after.images, added });
};

module.exports.deleteImage = async (req, res, next) => {
  const { id, publicId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid product id."));
  }
  const product = await Product.findById(id);
  if (!product) return next(new ExpressError(404, "Product not found."));
  const before = product.toObject();
  const idx = (product.images || []).findIndex(
    (i) => String(i.publicId) === String(publicId),
  );
  if (idx === -1) return next(new ExpressError(404, "Image not found."));
  const [removed] = product.images.splice(idx, 1);
  if (removed && removed.publicId) {
    await deleteFromCloudinary(removed.publicId, "image");
  }
  await product.save();
  const after = product.toObject();
  await audit(
    req,
    "product.images.delete",
    "product",
    id,
    { images: before.images },
    { images: after.images },
    `Removed ${publicId}`,
  );
  sendSuccess(res, { images: after.images, removedPublicId: publicId });
};

module.exports.reorderImages = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid product id."));
  }
  const product = await Product.findById(id);
  if (!product) return next(new ExpressError(404, "Product not found."));
  const before = product.toObject();
  const { order, primaryPublicId = null } = req.body || {};
  if (!Array.isArray(order)) {
    return next(new ExpressError(400, "Provide `order` array of publicIds."));
  }
  const byId = new Map((product.images || []).map((img) => [img.publicId, img]));
  const rebuilt = [];
  order.forEach((pid) => {
    const match = byId.get(String(pid));
    if (match) rebuilt.push(match);
  });
  const leftover = (product.images || []).filter(
    (img) => !order.includes(String(img.publicId)),
  );
  product.images = [...rebuilt, ...leftover];

  if (primaryPublicId) {
    const pIdx = product.images.findIndex(
      (img) => String(img.publicId) === String(primaryPublicId),
    );
    if (pIdx > 0) {
      const [p] = product.images.splice(pIdx, 1);
      product.images.unshift(p);
    }
  }
  await product.save();
  const after = product.toObject();
  await audit(
    req,
    "product.images.reorder",
    "product",
    id,
    { images: before.images },
    { images: after.images },
    primaryPublicId ? `Primary: ${primaryPublicId}` : "",
  );
  sendSuccess(res, { images: after.images });
};

module.exports.upload3D = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid product id."));
  }
  const product = await Product.findById(id);
  if (!product) return next(new ExpressError(404, "Product not found."));
  const before = product.toObject();
  const file = req.file;
  if (!file) return next(new ExpressError(400, "3D model file required."));
  const url = file.path || file.secure_url || file.url || "";
  const name = file.originalname || file.filename || "";
  let format = null;
  if (name.toLowerCase().endsWith(".glb")) format = "glb";
  else if (name.toLowerCase().endsWith(".gltf")) format = "gltf";
  else {
    const hint = req.body && req.body.format ? String(req.body.format).toLowerCase() : null;
    if (hint === "glb" || hint === "gltf") format = hint;
  }
  if (!format) {
    return next(new ExpressError(400, "3D model format must be glb or gltf."));
  }
  product.model3D = { url, format };
  await product.save();
  const after = product.toObject();
  await audit(
    req,
    "product.model3D.upload",
    "product",
    id,
    { model3D: before.model3D },
    { model3D: after.model3D },
  );
  sendSuccess(res, { model3D: after.model3D });
};

module.exports.delete3D = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid product id."));
  }
  const product = await Product.findById(id);
  if (!product) return next(new ExpressError(404, "Product not found."));
  const before = product.toObject();
  const existing = product.model3D;
  if (existing && existing.url) {
    const idFromUrl = existing.url ? existing.url.split("/").pop() : null;
    if (idFromUrl) await deleteFromCloudinary(idFromUrl, "raw");
  }
  product.model3D = undefined;
  await product.save();
  const after = product.toObject();
  await audit(
    req,
    "product.model3D.delete",
    "product",
    id,
    { model3D: before.model3D },
    { model3D: null },
  );
  sendSuccess(res, { removed: true });
};

module.exports.bulkAction = async (req, res, next) => {
  const { ids, action, payload = {} } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ExpressError(400, "Provide a non-empty `ids` array."));
  }
  if (!action) {
    return next(new ExpressError(400, "`action` is required."));
  }
  const validIds = ids.filter((i) => mongoose.Types.ObjectId.isValid(i));
  if (validIds.length === 0) {
    return next(new ExpressError(400, "No valid ids provided."));
  }
  let result = { success: 0, failed: 0, skipped: 0, action };

  switch (action) {
    case "activate": {
      const r = await Product.updateMany(
        { _id: { $in: validIds } },
        { $set: { isActive: true, deletedAt: null } },
      );
      result.success = r.modifiedCount;
      break;
    }
    case "deactivate": {
      const r = await Product.updateMany(
        { _id: { $in: validIds } },
        { $set: { isActive: false } },
      );
      result.success = r.modifiedCount;
      break;
    }
    case "softDelete": {
      const r = await Product.updateMany(
        { _id: { $in: validIds } },
        { $set: { isActive: false, deletedAt: new Date() } },
      );
      result.success = r.modifiedCount;
      await Cart.updateMany(
        { "items.product": { $in: validIds } },
        { $pull: { items: { product: { $in: validIds } } } },
      );
      await Wishlist.updateMany(
        {},
        { $pull: { products: { $in: validIds } } },
      );
      break;
    }
    case "stockAdd": {
      const delta = Number(payload && payload.delta);
      const reason = (payload && payload.reason) || "";
      if (!Number.isFinite(delta)) {
        return next(
          new ExpressError(400, "`payload.delta` number required for stockAdd."),
        );
      }
      for (const pid of validIds) {
        try {
          const p = await Product.findById(pid);
          if (!p) {
            result.failed++;
            continue;
          }
          const before = { stock: p.stock };
          const next = Math.max(0, Number(p.stock || 0) + delta);
          p.stock = next;
          await p.save();
          await audit(
            req,
            "product.stock",
            "product",
            String(pid),
            before,
            { stock: next },
            `Bulk stockAdd ${delta}${reason ? ` — ${reason}` : ""}`,
          );
          result.success++;
        } catch (_e) {
          result.failed++;
        }
      }
      break;
    }
    default:
      return next(new ExpressError(400, `Unknown bulk action: ${action}`));
  }
  await audit(
    req,
    "product.bulk",
    "product",
    `bulk:${action}`,
    { ids: validIds },
    result,
    (payload && payload.reason) || "",
  );
  sendSuccess(res, result);
};

module.exports.getCatalogSummary = async (req, res) => {
  const threshold = LOW_STOCK_THRESHOLD();
  const [
    totalProducts,
    activeProducts,
    inactiveProducts,
    lowStock,
    outOfStock,
    categoriesCount,
    recentlyAdded,
    lowStockList,
  ] = await Promise.all([
    Product.countDocuments({
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    }),
    Product.countDocuments({
      isActive: true,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    }),
    Product.countDocuments({
      isActive: false,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    }),
    Product.countDocuments({
      stock: { $gt: 0, $lte: threshold },
      isActive: true,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    }),
    Product.countDocuments({
      stock: { $lte: 0 },
      isActive: true,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    }),
    Category.countDocuments(),
    Product.find({
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Product.find({
      stock: { $gt: 0, $lte: threshold },
      isActive: true,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    })
      .populate("category", "name")
      .sort({ stock: 1 })
      .limit(10)
      .lean(),
  ]);
  const decorated = (arr) =>
    arr.map((p) => ({ ...p, availability: _availability(p.stock, threshold) }));
  sendSuccess(res, {
    totals: {
      totalProducts,
      activeProducts,
      inactiveProducts,
      lowStock,
      outOfStock,
      categoriesCount,
    },
    recentlyAdded: decorated(recentlyAdded),
    lowStockList: decorated(lowStockList),
    thresholds: { lowStock: threshold },
  });
};
