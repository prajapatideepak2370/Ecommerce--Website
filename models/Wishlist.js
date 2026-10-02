const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const wishlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    products: [
      { type: Schema.Types.ObjectId, ref: "Product", index: true },
    ],
  },
  { timestamps: true },
);

wishlistSchema.index({ user: 1, products: 1 });

module.exports = mongoose.model("Wishlist", wishlistSchema);
