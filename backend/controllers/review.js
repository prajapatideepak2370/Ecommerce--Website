const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Review = require("../models/review");
const { deleteFromCloudinary } = require("../utils/cloudinary");
const { sendSuccess } = require("../utils/helpers");

const reviewSorts = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  highest: { rating: -1, createdAt: -1 },
};

const getUploadedImages = (files = []) =>
  files.map((file) => ({
    url: file.path || file.secure_url || file.url,
    publicId: file.filename || file.public_id,
  }));

async function deleteUploadedImages(images = []) {
  await Promise.all(
    images.map((image) =>
      image.publicId
        ? deleteFromCloudinary(image.publicId)
        : Promise.resolve(),
    ),
  );
}

async function cleanupUploadedFiles(files = []) {
  await deleteUploadedImages(
    files.map((file) => ({
      publicId: file.filename || file.public_id,
    })),
  );
}

async function aggregateReviewSummary(productId, persist = false) {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        ratingSum: { $sum: "$rating" },
        oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        twoStars: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        threeStars: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        fourStars: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        fiveStars: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
      },
    },
  ]);
  const totalReviews = stats?.total || 0;
  const averageRating = totalReviews
    ? Math.round((stats.ratingSum / totalReviews) * 10) / 10
    : 0;
  const summary = {
    averageRating,
    totalReviews,
    distribution: [
      { rating: 5, count: stats?.fiveStars || 0 },
      { rating: 4, count: stats?.fourStars || 0 },
      { rating: 3, count: stats?.threeStars || 0 },
      { rating: 2, count: stats?.twoStars || 0 },
      { rating: 1, count: stats?.oneStar || 0 },
    ],
  };

  if (persist) {
    await Product.updateOne(
      { _id: productId },
      {
        $set: {
          rating: averageRating,
          numReviews: totalReviews,
        },
      },
    );
  }

  return summary;
}

async function findOwnedReview(req) {
  if (
    !mongoose.isValidObjectId(req.params.productId) ||
    !mongoose.isValidObjectId(req.params.reviewId)
  ) {
    throw new ExpressError(400, "Invalid product or review ID.");
  }
  const review = await Review.findOne({
    _id: req.params.reviewId,
    product: req.params.productId,
    user: req.user._id,
  });
  if (!review) throw new ExpressError(404, "Review not found.");
  return review;
}

module.exports = {
  aggregateReviewSummary,
  cleanupUploadedFiles,
  validatePayload: (schema) =>
    catchAsync(async (req, _res, next) => {
      const { error } = schema.validate(req.body, {
        abortEarly: false,
        allowUnknown: false,
      });
      if (error) {
        await cleanupUploadedFiles(req.files);
        const message = error.details.map((detail) => detail.message).join(", ");
        return next(new ExpressError(400, message));
      }
      next();
    }),

  getReviewsByProduct: catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return next(new ExpressError(400, "Invalid product ID."));
    }

    const [reviews, summary] = await Promise.all([
      Review.find({ product: productId })
        .sort(reviewSorts[req.query.sort] || reviewSorts.newest)
        .populate("user", "name username avatar")
        .lean(),
      aggregateReviewSummary(productId),
    ]);

    let viewer = { authenticated: false, canReview: false };
    if (req.user?._id) {
      const [existingReview, hasPaidOrder] = await Promise.all([
        Review.exists({ product: productId, user: req.user._id }),
        Order.exists({
          user: req.user._id,
          "items.product": productId,
          "payment.status": "Paid",
          orderStatus: { $nin: ["Cancelled", "Refunded"] },
        }),
      ]);
      viewer = {
        authenticated: true,
        canReview: Boolean(hasPaidOrder && !existingReview && !req.user.isBlocked),
      };
    }

    sendSuccess(res, { items: reviews, summary, viewer });
  }),

  ensureVerifiedPurchase: catchAsync(async (req, _res, next) => {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return next(new ExpressError(400, "Invalid product ID."));
    }

    const productExists = await Product.exists({
      _id: productId,
      isActive: true,
    });
    if (!productExists) {
      return next(new ExpressError(404, "Product not found."));
    }

    const existingReview = await Review.exists({
      product: productId,
      user: req.user._id,
    });
    if (existingReview) {
      return next(
        new ExpressError(409, "You have already reviewed this product."),
      );
    }

    const hasPaidOrder = await Order.exists({
      user: req.user._id,
      "items.product": productId,
      "payment.status": "Paid",
      orderStatus: { $nin: ["Cancelled", "Refunded"] },
    });
    if (!hasPaidOrder) {
      return next(
        new ExpressError(
          403,
          "Only customers with a paid order for this product can post a review.",
        ),
      );
    }

    next();
  }),

  ensureReviewOwner: catchAsync(async (req, _res, next) => {
    await findOwnedReview(req);
    next();
  }),

  createReview: catchAsync(async (req, res) => {
    const images = getUploadedImages(req.files);
    const review = new Review({
      product: req.params.productId,
      user: req.user._id,
      rating: req.body.rating,
      title: req.body.title,
      comment: req.body.comment,
      images,
      verifiedPurchase: true,
    });

    try {
      await review.save();
    } catch (error) {
      await cleanupUploadedFiles(req.files);
      if (error.code === 11000) {
        throw new ExpressError(409, "You have already reviewed this product.");
      }
      throw error;
    }

    const summary = await aggregateReviewSummary(req.params.productId, true);
    const savedReview = await Review.findById(review._id)
      .populate("user", "name username avatar")
      .lean();
    sendSuccess(res, { review: savedReview, summary }, 201);
  }),

  updateReview: catchAsync(async (req, res) => {
    const review = await findOwnedReview(req);
    const newImages = getUploadedImages(req.files);
    if (review.images.length + newImages.length > 5) {
      await cleanupUploadedFiles(req.files);
      throw new ExpressError(400, "A review can include up to 5 images.");
    }

    for (const field of ["rating", "title", "comment"]) {
      if (req.body[field] !== undefined) review[field] = req.body[field];
    }
    if (newImages.length) review.images.push(...newImages);

    try {
      await review.save();
    } catch (error) {
      await cleanupUploadedFiles(req.files);
      throw error;
    }

    const summary = await aggregateReviewSummary(req.params.productId, true);
    const savedReview = await Review.findById(review._id)
      .populate("user", "name username avatar")
      .lean();
    sendSuccess(res, { review: savedReview, summary });
  }),

  deleteReview: catchAsync(async (req, res) => {
    const review = await findOwnedReview(req);
    const images = review.images || [];
    await review.deleteOne();
    const summary = await aggregateReviewSummary(req.params.productId, true);
    await deleteUploadedImages(images);
    sendSuccess(res, { deleted: true, summary });
  }),
  moderateReview: catchAsync(async (_req, _res, next) => {
    next(new ExpressError(501, "Review moderation is not available yet."));
  }),
};
