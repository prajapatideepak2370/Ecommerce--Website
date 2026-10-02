const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const AdminAuditLog = require("../models/AdminAuditLog");
const ExpressError = require("../utils/ExpressError");
const {
  sendSuccess,
  buildPaginationMeta,
  escapeRegex,
} = require("../utils/helpers");
const { audit } = require("../utils/adminAudit");

const LOW_STOCK = () => Number(process.env.LOW_STOCK_THRESHOLD || 5);

function _stockLevel(qty, threshold) {
  if (!Number.isFinite(qty) || qty <= 0) return "out";
  if (qty <= threshold) return "low";
  return "ok";
}

function _availability(qty, threshold) {
  const level = _stockLevel(qty, threshold);
  if (level === "out") return "out-of-stock";
  if (level === "low") return "low-stock";
  return "in-stock";
}

module.exports.getInventoryList = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const search = req.query.search ? String(req.query.search).trim() : "";
  const stockLevel = req.query.stockLevel || "";
  const threshold = LOW_STOCK();

  const filter = {
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  };
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$and = [{
      $or: [{ name: regex }, { sku: regex }, { brand: regex }],
    }];
  }

  if (stockLevel === "out") filter.stock = { $lte: 0 };
  if (stockLevel === "low") {
    filter.stock = { $gt: 0, $lte: threshold };
  }
  if (stockLevel === "ok") filter.stock = { $gt: threshold };

  const sortField = ["stock", "name", "updatedAt"].includes(req.query.sort)
    ? req.query.sort
    : "stock";
  const sort = { [sortField]: req.query.dir === "desc" ? -1 : 1 };
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

  const decorated = items.map((p) => {
    const level = _stockLevel(p.stock, threshold);
    return {
      _id: p._id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: p.price,
      discountPrice: p.discountPrice,
      stock: p.stock,
      images: p.images,
      lowStockThreshold: threshold,
      availability: _availability(p.stock, threshold),
      stockLevel: level,
      isActive: p.isActive,
      updatedAt: p.updatedAt,
    };
  });

  const aggregates = await Product.aggregate([
    {
      $match: {
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      },
    },
    {
      $group: {
        _id: null,
        totalUnits: { $sum: "$stock" },
        totalProducts: { $sum: 1 },
        outCount: {
          $sum: { $cond: [{ $lte: ["$stock", 0] }, 1, 0] },
        },
        lowCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ["$stock", 0] },
                  { $lte: ["$stock", threshold] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const agg = (aggregates && aggregates[0]) || {
    totalUnits: 0,
    totalProducts: total,
    outCount: 0,
    lowCount: 0,
  };

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
    summary: {
      totalUnits: agg.totalUnits || 0,
      totalProducts: agg.totalProducts || total,
      outOfStock: agg.outCount || 0,
      lowStock: agg.lowCount || 0,
      threshold,
    },
    stockLevel,
  });
};

module.exports.patchInventoryStock = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid product id."));
  }
  const product = await Product.findById(id);
  if (!product) return next(new ExpressError(404, "Product not found."));
  const before = { stock: product.stock };

  const { stock, delta, reason = "" } = req.body || {};
  let nextStock;
  if (delta !== undefined && delta !== null) {
    nextStock = Number(product.stock || 0) + Number(delta);
  } else if (stock !== undefined && stock !== null) {
    nextStock = Number(stock);
  } else {
    return next(
      new ExpressError(400, "Provide either `stock` or `delta`."),
    );
  }
  if (!Number.isFinite(nextStock) || nextStock < 0) {
    return next(new ExpressError(400, "Stock cannot go negative."));
  }
  product.stock = Math.floor(nextStock);
  await product.save();
  const after = { stock: product.stock };
  await audit(
    req,
    "product.stock",
    "product",
    String(id),
    before,
    after,
    typeof reason === "string" ? reason : "",
    {
      delta: delta !== undefined ? Number(delta) : null,
      stock: stock !== undefined ? Number(stock) : null,
      inventory: true,
    },
  );
  sendSuccess(res, {
    _id: id,
    stock: product.stock,
    availability: _availability(product.stock, LOW_STOCK()),
  });
};

module.exports.getStockChangeHistory = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid product id."));
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {
    entityType: "product",
    entityId: String(id),
    action: "product.stock",
  };

  const [items, total] = await Promise.all([
    AdminAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("adminId", "name username email")
      .lean(),
    AdminAuditLog.countDocuments(filter),
  ]);

  const history = items.map((h) => {
    const beforeStock = h.beforeSnapshot && h.beforeSnapshot.stock;
    const afterStock = h.afterSnapshot && h.afterSnapshot.stock;
    const calculatedDelta =
      beforeStock !== undefined && afterStock !== undefined
        ? afterStock - beforeStock
        : null;
    return {
      ...h,
      metadata: {
        ...(h.metadata || {}),
        beforeStock,
        afterStock,
        delta: h.metadata?.delta ?? calculatedDelta,
      },
    };
  });

  const pageInfo = buildPaginationMeta(page, limit, total);
  sendSuccess(res, {
    docs: history,
    pagination: {
      ...pageInfo,
      totalDocs: total,
      pagingCounter: total === 0 ? 0 : (page - 1) * limit + 1,
      hasPrevPage: pageInfo.hasPrev,
      hasNextPage: pageInfo.hasNext,
    },
  });
};
