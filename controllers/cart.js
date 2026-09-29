const Cart = require("../models/Cart");
const Product = require("../models/Product");
const ExpressError = require("../utils/ExpressError");
const { sendSuccess } = require("../utils/helpers");

const getCartSummary = (cartDoc) => {
  const items = (cartDoc?.items || []).map((item) => {
    const product = item.product && typeof item.product === "object" ? item.product : null;
    const price = product?.discountPrice && product.discountPrice > 0 ? product.discountPrice : product?.price || 0;
    return {
      ...item.toObject?.() ?? item,
      product: product?._id || item.product,
      productMeta: product ? {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discountPrice: product.discountPrice,
        images: product.images || [],
        stock: product.stock,
      } : null,
      unitPrice: price,
      lineTotal: price * (item.quantity || 0),
    };
  });

  const subtotal = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  const tax = Number((subtotal * (Number(process.env.TAX_PERCENT) || 0) / 100).toFixed(2));
  const freeShippingThreshold = Number(process.env.FREE_SHIPPING_THRESHOLD) || Infinity;
  const shippingFee = subtotal > 0 && subtotal >= freeShippingThreshold ? 0 : Number(process.env.SHIPPING_FEE || 0);

  return {
    items,
    subtotal,
    tax,
    shippingFee,
    totalAmount: +(subtotal + tax + shippingFee).toFixed(2),
  };
};

const ensureCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

module.exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate({ path: "items.product", select: "_id name slug price discountPrice images stock" });

  sendSuccess(res, getCartSummary(cart));
};

module.exports.addToCart = async (req, res, next) => {
  const { product: productId, quantity = 1 } = req.body;
  const qty = Number(quantity);

  if (!productId) {
    return next(new ExpressError(400, "Product is required."));
  }
  if (!Number.isInteger(qty) || qty < 1) {
    return next(new ExpressError(400, "Quantity must be a positive integer."));
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new ExpressError(404, "Product not found."));
  }
  if (product.stock < qty) {
    return next(new ExpressError(400, `Only ${product.stock} item(s) left in stock.`));
  }

  const cart = await ensureCart(req.user._id);
  const existingItem = cart.items.find((item) => String(item.product) === String(productId));

  if (existingItem) {
    const nextQty = existingItem.quantity + qty;
    if (nextQty > product.stock) {
      return next(new ExpressError(400, `Only ${product.stock} item(s) left in stock.`));
    }
    existingItem.quantity = nextQty;
  } else {
    cart.items.push({ product: product._id, quantity: qty });
  }

  await cart.save();
  const savedCart = await Cart.findOne({ user: req.user._id })
    .populate({ path: "items.product", select: "_id name slug price discountPrice images stock" });

  sendSuccess(res, getCartSummary(savedCart), 201);
};

module.exports.updateQuantity = async (req, res, next) => {
  const { itemId } = req.params;
  const qty = Number(req.body.quantity);

  if (!Number.isInteger(qty) || qty < 1) {
    return next(new ExpressError(400, "Quantity must be a positive integer."));
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate({ path: "items.product", select: "_id stock price discountPrice name" });
  if (!cart) {
    return next(new ExpressError(404, "Cart not found."));
  }

  const item = cart.items.id(itemId);
  if (!item) {
    return next(new ExpressError(404, "Cart item not found."));
  }

  const product = item.product;
  if (!product) {
    return next(new ExpressError(404, "Product no longer exists."));
  }
  if (qty > product.stock) {
    return next(new ExpressError(400, `Only ${product.stock} item(s) left in stock.`));
  }

  item.quantity = qty;
  await cart.save();

  sendSuccess(res, getCartSummary(cart));
};

module.exports.removeItem = async (req, res, next) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new ExpressError(404, "Cart not found."));
  }

  const before = cart.items.length;
  cart.items = cart.items.filter((item) => String(item._id) !== String(itemId));

  if (cart.items.length === before) {
    return next(new ExpressError(404, "Cart item not found."));
  }

  await cart.save();
  const freshCart = await Cart.findOne({ user: req.user._id })
    .populate({ path: "items.product", select: "_id name slug price discountPrice images stock" });

  sendSuccess(res, getCartSummary(freshCart));
};

module.exports.clearCart = async (req, res) => {
  await Cart.deleteOne({ user: req.user._id });
  sendSuccess(res, { items: [], subtotal: 0, tax: 0, shippingFee: 0, totalAmount: 0 });
};
