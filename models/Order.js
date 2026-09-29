const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
const PAYMENT_PROVIDERS = ["COD", "UPI"];

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const addressSnapshotSchema = new Schema(
  {
    label: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const paymentSchema = new Schema(
  {
    provider: { type: String, enum: PAYMENT_PROVIDERS, default: "COD" },
    reference: { type: String, default: "" },
    status: { type: String, enum: PAYMENT_STATUSES, default: "Pending" },
  },
  { _id: false },
);

const statusHistoryEntry = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    shippingAddress: { type: addressSnapshotSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    payment: { type: paymentSchema, required: true },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Pending",
      index: true,
    },
    statusHistory: [statusHistoryEntry],
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.pre("save", function () {
  if (this.isNew || this.isModified("orderStatus")) {
    const last = this.statusHistory[this.statusHistory.length - 1];
    if (!last || last.status !== this.orderStatus) {
      this.statusHistory.push({ status: this.orderStatus });
    }
  }
});

module.exports = mongoose.model("Order", orderSchema);
