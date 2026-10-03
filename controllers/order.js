const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded",
];

function formatOrderNumber(id) {
  const hex =
    String(id || "")
      .slice(-6)
      .toUpperCase() || "000000";
  return `TVX-${hex}`;
}

function serializeOrder(order, { withUser = false } = {}) {
  if (!order) return null;
  const plain = typeof order.toObject === "function" ? order.toObject() : order;
  const user = plain.user || {};
  const userSnapshot =
    withUser && plain.user?._id
      ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          phone: user.phone,
        }
      : plain.user;
  return {
    ...plain,
    orderNumber: formatOrderNumber(plain._id),
    user: userSnapshot,
  };
}

async function resolveProduct(productId, productMeta) {
  if (!productId) return null;
  const tryMatch = async (query) => {
    try {
      return await Product.findOne(query);
    } catch {
      return null;
    }
  };
  if (mongoose.Types.ObjectId.isValid(String(productId))) {
    const byId = await tryMatch({ _id: productId });
    if (byId) return byId;
  }
  const slug = productMeta?.slug;
  if (slug) {
    const bySlug = await tryMatch({ slug: String(slug).trim() });
    if (bySlug) return bySlug;
  }
  const name = productMeta?.name;
  if (name) {
    const byName = await tryMatch({ name: String(name).trim() });
    if (byName) return byName;
  }
  return null;
}

async function buildOrderItemsFromEntries(
  entries,
  { allowFrontendPrice = false } = {},
) {
  let subtotal = 0;
  const items = [];
  const stockDeductions = [];

  for (const entry of entries) {
    const rawProductId = entry.product || entry._id;
    const productMeta = entry.productMeta || {};
    const resolvedProduct = await resolveProduct(rawProductId, {
      slug: productMeta.slug,
      name: entry.name,
    });

    if (!resolvedProduct) {
      const displayName = entry.name || productMeta?.name || rawProductId;
      throw new ExpressError(
        400,
        `"${displayName}" is not available for purchase. Please remove it and try again.`,
      );
    }
    if (!resolvedProduct.isActive) {
      throw new ExpressError(
        400,
        `"${resolvedProduct.name}" is no longer available.`,
      );
    }

    const quantity = Math.max(1, Number(entry.quantity || 0));
    if (resolvedProduct.stock < quantity) {
      throw new ExpressError(
        400,
        `Not enough stock for "${resolvedProduct.name}". Available: ${resolvedProduct.stock}.`,
      );
    }

    let unitPrice;
    if (
      allowFrontendPrice &&
      typeof entry.unitPrice === "number" &&
      entry.unitPrice > 0
    ) {
      unitPrice = Number(entry.unitPrice);
    } else {
      unitPrice =
        resolvedProduct.discountPrice &&
        resolvedProduct.discountPrice > 0 &&
        resolvedProduct.discountPrice < resolvedProduct.price
          ? resolvedProduct.discountPrice
          : resolvedProduct.price;
    }

    subtotal += unitPrice * quantity;
    items.push({
      product: resolvedProduct._id,
      name: resolvedProduct.name,
      image:
        resolvedProduct.images?.[0]?.url ||
        entry.image ||
        productMeta?.images?.[0]?.url ||
        "",
      quantity,
      priceAtPurchase: unitPrice,
    });
    stockDeductions.push({
      productId: resolvedProduct._id,
      quantity,
    });
  }

  return { items, subtotal, stockDeductions };
}

async function createOrderFromCart(
  userId,
  { shippingAddress, addressId, bodyItems, payment },
) {
  let entries = [];
  let sourceCart = null;
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (cart && cart.items?.length) {
    sourceCart = cart;
    entries = cart.items.map((entry) => ({
      product: entry.product?._id || entry.product,
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      productMeta: entry.productMeta || {},
    }));
  } else if (Array.isArray(bodyItems) && bodyItems.length) {
    entries = bodyItems.map((it) => ({
      product: it.product || it._id,
      name: it.name,
      image: it.image,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      productMeta: it.productMeta || {},
    }));
  }

  if (!entries.length) {
    throw new ExpressError(400, "Your cart is empty.");
  }

  const { items, subtotal, stockDeductions } = await buildOrderItemsFromEntries(
    entries,
    {
      allowFrontendPrice: !!bodyItems?.length,
    },
  );

  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const shippingFee = subtotal > 5000 ? 0 : 199;
  const totalAmount = Math.round((subtotal + tax + shippingFee) * 100) / 100;

  for (const dedupe of stockDeductions) {
    await Product.findOneAndUpdate(
      { _id: dedupe.productId, stock: { $gte: dedupe.quantity } },
      { $inc: { stock: -dedupe.quantity } },
    );
  }

  const provider = payment?.provider || payment?.method || "COD";
  const reference = payment?.reference || "";
  const status = payment?.status || "Pending";

  const initialStatus = status === "Paid" ? "Confirmed" : "Pending";
  const order = new Order({
    user: userId,
    items,
    shippingAddress,
    subtotal,
    tax,
    shippingFee,
    totalAmount,
    payment: { provider, reference, status },
    orderStatus: initialStatus,
    statusHistory: [
      { status: initialStatus, note: "Order placed", timestamp: new Date() },
    ],
  });
  await order.save();

  if (sourceCart) {
    sourceCart.items = [];
    await sourceCart.save();
  }

  return order;
}

const createOrder = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) throw new ExpressError(401, "Authentication required.");
  const user = await User.findById(userId);
  if (!user) throw new ExpressError(404, "User not found.");
  const shippingAddress =
    req.body.shippingAddress ||
    user.addresses?.find((a) => a._id?.toString() === req.body.addressId) ||
    user.addresses?.find((a) => a.isDefault) ||
    user.addresses?.[0];
  if (!shippingAddress) {
    throw new ExpressError(400, "Please provide a shipping address.");
  }
  const payment = {
    provider: req.body.paymentMethod,
    reference: req.body.paymentReference || "",
    status: req.body.paymentStatus || "Pending",
  };
  const order = await createOrderFromCart(userId, {
    shippingAddress,
    addressId: req.body.addressId,
    bodyItems: req.body.items,
    payment,
  });
  const populated = await Order.findById(order._id).populate(
    "user",
    "name email username phone",
  );
  res.status(201).json({
    success: true,
    data: serializeOrder(populated, { withUser: true }),
  });
});

const getMyOrders = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  const [orders, total] = await Promise.all([
    Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.max(1, Number(limit)))
      .populate("user", "name email"),
    Order.countDocuments({ user: userId }),
  ]);
  res.json({
    success: true,
    data: {
      items: orders.map((o) => serializeOrder(o)),
      total,
      page: Number(page),
      limit: Number(limit),
    },
  });
});

const getOrderById = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const isAdmin = req.user?.role === "admin";
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email username phone",
  );
  if (!order) throw new ExpressError(404, "Order not found.");
  const ownerId = order.user?._id?.toString() || order.user?.toString();
  if (!isAdmin && ownerId !== userId?.toString()) {
    throw new ExpressError(403, "You are not authorized to view this order.");
  }
  res.json({
    success: true,
    data: serializeOrder(order, { withUser: true }),
  });
});

const cancelOrder = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ExpressError(404, "Order not found.");
  const ownerId = order.user?.toString();
  if (ownerId !== userId?.toString()) {
    throw new ExpressError(403, "You are not authorized to cancel this order.");
  }
  const locked = ["Shipped", "Delivered", "Cancelled", "Refunded"];
  if (locked.includes(order.orderStatus)) {
    throw new ExpressError(
      400,
      `This order cannot be cancelled (status: ${order.orderStatus}).`,
    );
  }
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }
  order.orderStatus = "Cancelled";
  order.payment.status =
    order.payment.status === "Paid" ? "Refunded" : order.payment.status;
  await order.save();
  const refreshed = await Order.findById(order._id).populate(
    "user",
    "name email username phone",
  );
  res.json({
    success: true,
    data: serializeOrder(refreshed, { withUser: true }),
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = "",
    status = "",
    payment = "",
    sort = "newest",
  } = req.query;
  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  const filter = {};
  if (status && ORDER_STATUSES.includes(String(status))) {
    filter.orderStatus = status;
  }
  if (
    payment &&
    ["Pending", "Paid", "Failed", "Refunded"].includes(String(payment))
  ) {
    filter["payment.status"] = payment;
  }
  const searchTerm = String(search).trim();
  let userIdsForSearch = [];
  if (searchTerm) {
    const userMatches = await User.find(
      {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
          { username: { $regex: searchTerm, $options: "i" } },
        ],
      },
      { _id: 1 },
    ).limit(200);
    userIdsForSearch = userMatches.map((u) => u._id);
    filter.$or = [
      { _id: { $regex: searchTerm, $options: "i" } },
      { "shippingAddress.fullName": { $regex: searchTerm, $options: "i" } },
      { "items.name": { $regex: searchTerm, $options: "i" } },
      ...(userIdsForSearch.length ? [{ user: { $in: userIdsForSearch } }] : []),
    ];
  }
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "total-desc": { totalAmount: -1 },
    "total-asc": { totalAmount: 1 },
    status: { orderStatus: 1, createdAt: -1 },
  };
  const sortBy = sortMap[sort] || sortMap.newest;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(Math.max(1, Number(limit)))
      .populate("user", "name email username phone"),
    Order.countDocuments(filter),
  ]);

  const stats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);
  const statusCounts = await Order.aggregate([
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
  ]);
  const paymentCounts = await Order.aggregate([
    { $group: { _id: "$payment.status", count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      items: orders.map((o) => serializeOrder(o, { withUser: true })),
      total,
      page: Number(page),
      limit: Number(limit),
      summary: {
        totalRevenue: stats[0]?.totalRevenue || 0,
        totalOrders: stats[0]?.totalOrders || 0,
        statusCounts: Object.fromEntries(
          statusCounts.map((s) => [s._id, s.count]),
        ),
        paymentCounts: Object.fromEntries(
          paymentCounts.map((s) => [s._id, s.count]),
        ),
      },
    },
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderStatus, note = "" } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ExpressError(404, "Order not found.");
  if (!ORDER_STATUSES.includes(orderStatus)) {
    throw new ExpressError(400, `Invalid order status: ${orderStatus}`);
  }
  order.orderStatus = orderStatus;
  if (orderStatus === "Cancelled") {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }
  }
  const last = order.statusHistory[order.statusHistory.length - 1];
  if (!last || last.status !== orderStatus) {
    order.statusHistory.push({
      status: orderStatus,
      note,
      timestamp: new Date(),
    });
  } else if (note) {
    last.note = note;
    last.timestamp = new Date();
    order.markModified("statusHistory");
  }
  await order.save();
  const refreshed = await Order.findById(order._id).populate(
    "user",
    "name email username phone",
  );
  res.json({
    success: true,
    data: serializeOrder(refreshed, { withUser: true }),
  });
});

const markRefunded = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ExpressError(404, "Order not found.");
  order.payment.status = "Refunded";
  order.orderStatus = "Refunded";
  const last = order.statusHistory[order.statusHistory.length - 1];
  if (!last || last.status !== "Refunded") {
    order.statusHistory.push({
      status: "Refunded",
      note: req.body?.note || "Refund processed by admin",
      timestamp: new Date(),
    });
  }
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }
  await order.save();
  const refreshed = await Order.findById(order._id).populate(
    "user",
    "name email username phone",
  );
  res.json({
    success: true,
    data: serializeOrder(refreshed, { withUser: true }),
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  markRefunded,
};
