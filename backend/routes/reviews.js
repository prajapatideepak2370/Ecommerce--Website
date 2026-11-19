const express = require("express");
const router = express.Router({ mergeParams: true });
const reviewController = require("../controllers/review");
const catchAsync = require("../utils/catchAsync");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { validate } = require("../middleware/validate");
const { reviewSchemas } = require("../schema");
const multer = require("multer");
const path = require("path");
const ExpressError = require("../utils/ExpressError");
const { reviewImageStorage } = require("../utils/cloudinary");

const allowedReviewTypes = new Map([
  [".jpg", new Set(["image/jpeg", "image/jpg"])],
  [".jpeg", new Set(["image/jpeg", "image/jpg"])],
  [".png", new Set(["image/png"])],
  [".webp", new Set(["image/webp"])],
]);

const uploadReviewImages = multer({
  storage: reviewImageStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter(_req, file, callback) {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const acceptedMimes = allowedReviewTypes.get(extension);
    if (!acceptedMimes?.has(String(file.mimetype || "").toLowerCase())) {
      return callback(
        new ExpressError(
          400,
          "Review images must be JPG, JPEG, PNG, or WEBP files.",
        ),
      );
    }
    callback(null, true);
  },
});

router.get(
  "/",
  validate(reviewSchemas.query, "query"),
  catchAsync(reviewController.getReviewsByProduct),
);

router.use(requireAuth);

router.post(
  "/",
  reviewController.ensureVerifiedPurchase,
  uploadReviewImages.array("images", 5),
  reviewController.validatePayload(reviewSchemas.create),
  catchAsync(reviewController.createReview),
);

router
  .route("/:reviewId")
  .put(
    reviewController.ensureReviewOwner,
    uploadReviewImages.array("images", 5),
    reviewController.validatePayload(reviewSchemas.update),
    catchAsync(reviewController.updateReview),
  )
  .delete(catchAsync(reviewController.deleteReview));

router.put(
  "/:reviewId/moderate",
  requireAdmin,
  catchAsync(reviewController.moderateReview),
);

module.exports = router;
