const crypto = require("crypto");

const generateSKU = (prefix = "TVX") => {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
};

const getStockStatus = (stock, threshold = process.env.LOW_STOCK_THRESHOLD || 5) => {
  if (!stock || stock <= 0) return "Out of Stock";
  if (stock <= Number(threshold)) return "Low Stock";
  return "In Stock";
};

const escapeRegex = (str) => {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const buildPaginationMeta = (page, limit, total) => {
  const currentPage = Math.max(1, Number(page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(limit) || 12));
  const totalPages = Math.ceil(total / perPage) || 1;
  return {
    page: currentPage,
    limit: perPage,
    totalItems: total,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

const computeTotals = (items, productMap) => {
  const subtotal = items.reduce((sum, item) => {
    const product = productMap.get(item.product.toString());
    if (!product) return sum;
    const price = product.discountPrice && product.discountPrice > 0
      ? product.discountPrice
      : product.price;
    return sum + price * item.quantity;
  }, 0);

  const taxPercent = Number(process.env.TAX_PERCENT) || 0;
  const tax = +(subtotal * taxPercent / 100).toFixed(2);

  const freeThreshold = Number(process.env.FREE_SHIPPING_THRESHOLD) || Infinity;
  const flatShipping = Number(process.env.SHIPPING_FEE) || 0;
  const shippingFee = subtotal >= freeThreshold ? 0 : flatShipping;

  const totalAmount = +(subtotal + tax + shippingFee).toFixed(2);

  return { subtotal, tax, shippingFee, totalAmount };
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const sendSuccess = (res, data = null, statusCode = 200) => {
  res.status(statusCode).json({ success: true, data });
};

module.exports = {
  generateSKU,
  getStockStatus,
  escapeRegex,
  buildPaginationMeta,
  computeTotals,
  round2,
  sendSuccess,
};
