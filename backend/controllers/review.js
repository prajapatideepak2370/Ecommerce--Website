const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const mongoose = require("mongoose");
const Review = require("../models/review");
const { sendSuccess } = require("../utils/helpers");

const stub = (name) =>
  catchAsync(async (req, res, next) => {
    next(new ExpressError(501, `${name} will be implemented in Phase 7+`));
  });

module.exports = {
  getReviewsByProduct: catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.productId)) {
      return next(new ExpressError(400, "Invalid product ID."));
    }

    const reviews = await Review.find({ product: req.params.productId })
      .sort({ createdAt: -1 })
      .populate("user", "name username")
      .lean();

    sendSuccess(res, reviews);
  }),
  createReview: stub("createReview"),
  updateReview: stub("updateReview"),
  deleteReview: stub("deleteReview"),
  moderateReview: stub("moderateReview (admin)"),
};
