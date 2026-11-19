const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    images: { type: [reviewImageSchema], default: [] },
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
