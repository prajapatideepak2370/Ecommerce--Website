const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const { audit } = require("../utils/adminAudit");

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded",
];

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"];

function formatOrderNumber(id) {
  const hex = String(id || "").slice(-6).toUpperCase() || "000000";
  return `TVX-${hex}`;
}

function serialize(order) {
  if (!order) return null;
  const plain = typeof order.toObject === "function" ? order.toObject() : order;
  const user = plain.user || {};
  return {
    ...plain,
    orderNumber: formatOrderNumber(plain._id),
    user: user?._id
      ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          phone: user.phone,
        }
      : user,
  };
}

const listOrders = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 25,
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
  if (payment && PAYMENT_STATUSES.includes(String(payment))) {
    filter["payment.status"] = payment;
  }
  const searchTerm = String(search).trim();
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
    const userIds = userMatches.map((u) => u._id);
    filter.$or = [
      { "shippingAddress.fullName": { $regex: searchTerm, $options: "i" } },
      { "shippingAddress.phone": { $regex: searchTerm, $options: "i" } },
      { "items.name": { $regex: searchTerm, $options: "i" } },
      ...(userIds.length ? [{ user: { $in: userIds } }] : []),
    ];
    try {
      const hexMatch = searchTerm.replace(/^TVX[-_]?/i, "");
      if (/^[0-9a-fA-F]{6,24}$/.test(hexMatch)) {
        filter.$or.push({ _id: { $regex: hexMatch, $options: "i" } });
      }
    } catch (_) {}
  }
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "total-desc": { totalAmount: -1 },
    "total-asc": { totalAmount: 1 },
    status: { orderStatus: 1, createdAt: -1 },
  };
  const sortBy = sortMap[sort] || sortMap.newest;

  const [orders, total, stats, statusCounts, paymentCounts] = await Promise.all([
    Order.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(Math.max(1, Number(limit)))
      .populate("user", "name email username phone"),
    Order.countDocuments(filter),
    Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalOrders: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
    Order.aggregate([{ $group: { _id: "$payment.status", count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    data: {
      items: orders.map(serialize),
      total,
      page: Number(page),
      limit: Number(limit),
      summary: {
        totalRevenue: stats[0]?.totalRevenue || 0,
        totalOrders: stats[0]?.totalOrders || 0,
        statusCounts: Object.fromEntries(statusCounts.map((s) => [s._id, s.count])),
        paymentCounts: Object.fromEntries(paymentCounts.map((s) => [s._id, s.count])),
      },
    },
  });
});

const getOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email username phone",
  );
  if (!order) throw new ExpressError(404, "Order not found.");
  res.json({ success: true, data: serialize(order) });
});

const restockItems = async (order) => {
  for (const item of order.items || []) {
    if (item.product) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }
};

const updateStatus = catchAsync(async (req, res) => {
  const { orderStatus, note = "", paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ExpressError(404, "Order not found.");
  if (orderStatus) {
    if (!ORDER_STATUSES.includes(orderStatus)) {
      throw new ExpressError(400, `Invalid order status: ${orderStatus}`);
    }
    if (["Cancelled", "Refunded"].includes(orderStatus)) {
      if (orderStatus !== order.orderStatus) await restockItems(order);
    }
    order.orderStatus = orderStatus;
    const last = order.statusHistory[order.statusHistory.length - 1];
    if (!last || last.status !== orderStatus) {
      order.statusHistory.push({ status: orderStatus, note, timestamp: new Date() });
    } else if (note) {
      last.note = note;
      last.timestamp = new Date();
      order.markModified("statusHistory");
    }
  }
  if (paymentStatus && PAYMENT_STATUSES.includes(paymentStatus)) {
    order.payment.status = paymentStatus;
  }
  await order.save();
  const statusPrevious = order.$locals?.__previousStatus || null;
  await audit(
    req,
    orderStatus ? "order.status.updated" : "order.payment.updated",
    "order",
    String(order._id),
    { orderStatus: statusPrevious },
    {
      orderStatus: order.orderStatus,
      paymentStatus: order.payment.status,
      note,
    },
    typeof note === "string" ? note : "",
  );
  const refreshed = await Order.findById(order._id).populate(
    "user",
    "name email username phone",
  );
  res.json({ success: true, data: serialize(refreshed) });
});

const refundOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ExpressError(404, "Order not found.");
  const before = {
    orderStatus: order.orderStatus,
    paymentStatus: order.payment.status,
  };
  order.payment.status = "Refunded";
  order.orderStatus = "Refunded";
  const last = order.statusHistory[order.statusHistory.length - 1];
  const note = req.body?.note || "Refund processed by admin";
  if (!last || last.status !== "Refunded") {
    order.statusHistory.push({
      status: "Refunded",
      note,
      timestamp: new Date(),
    });
  }
  await restockItems(order);
  await order.save();
  await audit(
    req,
    "order.refunded",
    "order",
    String(order._id),
    before,
    {
      orderStatus: "Refunded",
      paymentStatus: "Refunded",
      note,
    },
    note,
  );
  const refreshed = await Order.findById(order._id).populate(
    "user",
    "name email username phone",
  );
  res.json({ success: true, data: serialize(refreshed) });
});

const updatePayment = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ExpressError(404, "Order not found.");
  const before = {
    paymentStatus: order.payment.status,
    provider: order.payment.provider,
    reference: order.payment.reference,
  };
  const { paymentStatus, provider, reference } = req.body;
  if (paymentStatus && PAYMENT_STATUSES.includes(paymentStatus)) {
    order.payment.status = paymentStatus;
  }
  if (provider) order.payment.provider = provider;
  if (reference !== undefined) order.payment.reference = reference || "";
  await order.save();
  await audit(
    req,
    "order.payment.updated",
    "order",
    String(order._id),
    before,
    {
      paymentStatus: order.payment.status,
      provider: order.payment.provider,
      reference: order.payment.reference,
    },
    "",
  );
  const refreshed = await Order.findById(order._id).populate(
    "user",
    "name email username phone",
  );
  res.json({ success: true, data: serialize(refreshed) });
});

module.exports = {
  listOrders,
  getOrder,
  updateStatus,
  refundOrder,
  updatePayment,
};
